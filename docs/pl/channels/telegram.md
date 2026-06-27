---
read_when:
    - Praca nad funkcjami Telegram lub Webhookami
summary: Status obsługi, możliwości i konfiguracja bota Telegram
title: Telegram
x-i18n:
    generated_at: "2026-06-27T17:14:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

Gotowe do użycia produkcyjnego w DM-ach botów i grupach przez grammY. Long polling jest trybem domyślnym; tryb webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną polityką DM dla Telegram jest parowanie.
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
    Otwórz Telegram i rozpocznij czat z **@BotFather** (upewnij się, że uchwyt to dokładnie `@BotFather`).

    Uruchom `/newbot`, wykonaj instrukcje i zapisz token.

  </Step>

  <Step title="Skonfiguruj token i politykę DM">

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

    Zapasowa wartość env: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
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
    Dodaj bota do swojej grupy, a następnie uzyskaj oba identyfikatory potrzebne do dostępu grupowego:

    - Twój identyfikator użytkownika Telegram, używany w `allowFrom` / `groupAllowFrom`
    - identyfikator czatu grupy Telegram, używany jako klucz pod `channels.telegram.groups`

    Przy pierwszej konfiguracji uzyskaj identyfikator czatu grupy z `openclaw logs --follow`, bota do przekazywanych identyfikatorów albo Bot API `getUpdates`. Po dopuszczeniu grupy `/whoami@<bot_username>` może potwierdzić identyfikatory użytkownika i grupy.

    Ujemne identyfikatory supergrup Telegram zaczynające się od `-100` są identyfikatorami czatu grupy. Umieść je pod `channels.telegram.groups`, a nie pod `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Kolejność rozwiązywania tokenu uwzględnia konto. W praktyce wartości konfiguracji mają pierwszeństwo przed zapasową wartością env, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
Po udanym uruchomieniu OpenClaw buforuje tożsamość bota w katalogu stanu do 24 godzin, aby restarty mogły uniknąć dodatkowego wywołania Telegram `getMe`; zmiana lub usunięcie tokenu czyści ten bufor.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność grup">
    Boty Telegram domyślnie używają **trybu prywatności**, który ogranicza wiadomości grupowe, jakie otrzymują.

    Jeśli bot musi widzieć wszystkie wiadomości grupowe, wykonaj jedną z tych czynności:

    - wyłącz tryb prywatności przez `/setprivacy`, albo
    - ustaw bota jako administratora grupy.

    Po przełączeniu trybu prywatności usuń i ponownie dodaj bota w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty administracyjne otrzymują wszystkie wiadomości grupowe, co jest przydatne dla stale aktywnego zachowania w grupie.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić na dodawanie do grup lub je zablokować
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

### Tożsamość bota w grupie

W grupach Telegram i tematach forum jawna wzmianka o skonfigurowanym uchwycie bota (na przykład `@my_bot`) jest traktowana jako adresowanie wybranego agenta OpenClaw, nawet jeśli nazwa persony agenta różni się od nazwy użytkownika Telegram. Polityka ciszy grupowej nadal dotyczy niezwiązanego ruchu grupowego, ale sam uchwyt bota nie jest uznawany za „kogoś innego”.

<Tabs>
  <Tab title="Polityka DM">
    `channels.telegram.dmPolicy` kontroluje dostęp do wiadomości bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` pozwala każdemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, sterować botem. Używaj tego tylko dla celowo publicznych botów z mocno ograniczonymi narzędziami; boty jednego właściciela powinny używać `allowlist` z liczbowymi identyfikatorami użytkowników.

    `channels.telegram.allowFrom` przyjmuje liczbowe identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach z wieloma kontami restrykcyjne `channels.telegram.allowFrom` najwyższego poziomu jest traktowane jako granica bezpieczeństwa: wpisy `allowFrom: ["*"]` na poziomie konta nie czynią tego konta publicznym, chyba że efektywna lista dozwolonych kont nadal zawiera jawny symbol wieloznaczny po scaleniu.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie DM-y i jest odrzucane przez walidację konfiguracji.
    Konfigurator prosi wyłącznie o liczbowe identyfikatory użytkowników.
    Jeśli po aktualizacji Twoja konfiguracja zawiera wpisy listy dozwolonych `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (w trybie najlepszej próby; wymaga tokenu bota Telegram).
    Jeśli wcześniej używano plików listy dozwolonych ze sklepu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach listy dozwolonych (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    Dla botów jednego właściciela preferuj `dmPolicy: "allowlist"` z jawnymi liczbowymi identyfikatorami `allowFrom`, aby polityka dostępu była trwała w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania DM nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp do DM. Jeśli właściciel poleceń jeszcze nie istnieje, pierwsze zatwierdzone parowanie ustawia również `commands.ownerAllowFrom`, aby polecenia tylko dla właściciela i zatwierdzenia exec miały jawne konto operatora.
    Autoryzacja nadawcy w grupie nadal pochodzi z jawnych list dozwolonych w konfiguracji.
    Jeśli chcesz „jestem autoryzowany raz i działają zarówno DM-y, jak i polecenia grupowe”, umieść swój liczbowy identyfikator użytkownika Telegram w `channels.telegram.allowFrom`; dla poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

    ### Znajdowanie identyfikatora użytkownika Telegram

    Bezpieczniej (bez bota zewnętrznego):

    1. Wyślij DM do swojego bota.
    2. Uruchom `openclaw logs --follow`.
    3. Odczytaj `from.id`.

    Oficjalna metoda Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metoda zewnętrzna (mniej prywatna): `@userinfobot` albo `@getidsbot`.

  </Tab>

  <Tab title="Polityka grup i listy dozwolonych">
    Dwie kontrolki działają razem:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - z `groupPolicy: "open"`: dowolna grupa może przejść kontrole identyfikatora grupy
         - z `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako lista dozwolonych (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców grupowych. Jeśli nie jest ustawione, Telegram używa zapasowo `allowFrom`.
    Wpisy `groupAllowFrom` powinny być liczbowymi identyfikatorami użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatów grup Telegram ani supergrup w `groupAllowFrom`. Ujemne identyfikatory czatu należą pod `channels.telegram.groups`.
    Wpisy nieliczbowe są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawcy grupowego **nie** dziedziczy zatwierdzeń ze sklepu parowania DM.
    Parowanie pozostaje tylko dla DM. Dla grup ustaw `groupAllowFrom` albo `allowFrom` dla konkretnej grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram używa zapasowo konfiguracyjnego `allowFrom`, a nie sklepu parowania.
    Praktyczny wzorzec dla botów jednego właściciela: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i dopuść grupy docelowe pod `channels.telegram.groups`.
    Uwaga dotycząca działania: jeśli `channels.telegram` całkowicie brakuje, runtime domyślnie fail-closed do `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest jawnie ustawione.

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

      - Umieść ujemne identyfikatory grup lub supergrup Telegram, takie jak `-1001234567890`, pod `channels.telegram.groups`.
      - Umieść identyfikatory użytkowników Telegram, takie jak `8734062810`, pod `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą uruchamiać bota.
      - Użyj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.

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

    Aktualizują one tylko stan sesji. Użyj konfiguracji dla trwałości.

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
    uwzględniane tylko wtedy, gdy były adresowane do bota, są odpowiedziami do bota
    albo są własnymi wiadomościami bota. Ustaw `includeGroupHistoryContext: "recent"`, aby
    uwzględnić najnowszą historię pokoju dla zaufanych grup. Ustaw
    `includeGroupHistoryContext: "none"`, aby nie wysyłać wcześniejszej historii grupy Telegram
    w następnej turze.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    Uzyskiwanie identyfikatora czatu grupy:

    - przekaż wiadomość grupową do `@userinfobot` / `@getidsbot`
    - albo odczytaj `chat.id` z `openclaw logs --follow`
    - albo sprawdź Bot API `getUpdates`
    - po dopuszczeniu grupy uruchom `/whoami@<bot_username>`, jeśli natywne polecenia są włączone

  </Tab>
</Tabs>

## Zachowanie runtime

- Telegram jest własnością procesu Gateway.
- Routing jest deterministyczny: odpowiedzi przychodzące z Telegram wracają do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi, placeholderami multimediów i utrwalonym kontekstem łańcucha odpowiedzi dla odpowiedzi Telegram zaobserwowanych przez Gateway.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dopisują `:topic:<threadId>`, aby zachować izolację tematów.
- Wiadomości DM mogą zawierać `message_thread_id`; OpenClaw zachowuje go dla odpowiedzi. Sesje tematów DM rozdzielają się tylko wtedy, gdy Telegram `getMe` zgłasza `has_topics_enabled: true` dla bota; w przeciwnym razie DM pozostają w płaskiej sesji.
- Długie odpytywanie używa runnera grammY z sekwencjonowaniem per czat/per wątek. Ogólna współbieżność ujścia runnera używa `agents.defaults.maxConcurrent`.
- Uruchamianie wielu kont ogranicza współbieżne sondy Telegram `getMe`, aby duże floty botów nie rozsyłały sond wszystkich kont jednocześnie.
- Długie odpytywanie jest chronione wewnątrz każdego procesu Gateway, więc tylko jeden aktywny poller może używać tokenu bota naraz. Jeśli nadal widzisz konflikty `getUpdates` 409, prawdopodobnie inny Gateway OpenClaw, skrypt albo zewnętrzny poller używa tego samego tokenu.
- Restart watchdoga długiego odpytywania domyślnie uruchamia się po 120 sekundach bez ukończonego potwierdzenia żywotności `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy Twoje wdrożenie nadal widzi fałszywe restarty z powodu zastoju odpytywania podczas długotrwałej pracy. Wartość jest w milisekundach i może wynosić od `30000` do `600000`; obsługiwane są nadpisania per konto.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

<Note>
  `channels.telegram.dm.threadReplies` i `channels.telegram.direct.<chatId>.threadReplies` zostały usunięte. Uruchom `openclaw doctor --fix` po aktualizacji, jeśli Twoja konfiguracja nadal ma te klucze. Routing tematów DM działa teraz zgodnie ze zdolnością bota z Telegram `getMe.has_topics_enabled`, którą kontroluje tryb wątków BotFather: boty z włączonymi tematami używają sesji DM zakresowanych do wątku, gdy Telegram wysyła `message_thread_id`; pozostałe DM pozostają w płaskiej sesji.
</Note>

## Opis funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumienia na żywo (edycje wiadomości)">
    OpenClaw może przesyłać częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` to `off | partial | block | progress` (domyślnie: `partial`)
    - krótkie początkowe podglądy odpowiedzi są debounce’owane, a potem materializowane po ograniczonym opóźnieniu, jeśli uruchomienie nadal jest aktywne
    - `progress` utrzymuje jedną edytowalną wersję roboczą statusu dla postępu narzędzi, pokazuje stabilną etykietę statusu, gdy aktywność odpowiedzi pojawia się przed postępem narzędzia, czyści ją po ukończeniu i wysyła finalną odpowiedź jako normalną wiadomość
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzi/postępu ponownie używają tej samej edytowanej wiadomości podglądu (domyślnie: `true`, gdy strumieniowanie podglądu jest aktywne)
    - `streaming.preview.commandText` kontroluje szczegóły poleceń/wykonania w tych liniach postępu narzędzi: `raw` (domyślnie, zachowuje wydane zachowanie) albo `status` (tylko etykieta narzędzia)
    - `streaming.progress.commentary` (domyślnie: `false`) włącza tekst komentarza/preambuły asystenta w tymczasowej wersji roboczej postępu
    - starsze `channels.telegram.streamMode`, boolowskie wartości `streaming` oraz wycofane natywne klucze podglądu wersji roboczej są wykrywane; uruchom `openclaw doctor --fix`, aby zmigrować je do bieżącej konfiguracji strumieniowania

    Aktualizacje podglądu postępu narzędzi to krótkie linie statusu pokazywane podczas działania narzędzi, na przykład wykonywanie poleceń, odczyty plików, aktualizacje planowania, podsumowania poprawek albo tekst preambuły/komentarza Codex w trybie serwera aplikacji Codex. Telegram domyślnie utrzymuje je włączone, aby odpowiadały wydanemu zachowaniu OpenClaw od `v2026.4.22` i nowszych.

    Aby zachować edytowany podgląd tekstu odpowiedzi, ale ukryć linie postępu narzędzi, ustaw:

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

    Aby zachować widoczny postęp narzędzi, ale ukryć tekst poleceń/wykonania, ustaw:

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

    Użyj trybu `progress`, gdy chcesz widocznego postępu narzędzi bez edytowania finalnej odpowiedzi w tej samej wiadomości. Umieść politykę tekstu poleceń pod `streaming.progress`:

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

    Używaj `streaming.mode: "off"` tylko wtedy, gdy chcesz dostarczania wyłącznie finalnych odpowiedzi: edycje podglądu Telegram są wyłączone, a ogólne komunikaty narzędzi/postępu są tłumione zamiast wysyłania ich jako osobnych wiadomości statusu. Monity o zatwierdzenie, payloady multimediów i błędy nadal przechodzą przez normalne dostarczanie finalne. Użyj `streaming.preview.toolProgress: false`, gdy chcesz tylko zachować edycje podglądu odpowiedzi, ukrywając linie statusu postępu narzędzi.

    <Note>
      Wybrane odpowiedzi z cytatem Telegram są wyjątkiem. Gdy `replyToMode` to `"first"`, `"all"` albo `"batched"` i wiadomość przychodząca zawiera wybrany tekst cytatu, OpenClaw wysyła finalną odpowiedź przez natywną ścieżkę odpowiedzi z cytatem Telegram zamiast edytować podgląd odpowiedzi, więc `streaming.preview.toolProgress` nie może pokazać krótkich linii statusu dla tego przebiegu. Odpowiedzi na bieżącą wiadomość bez wybranego tekstu cytatu nadal zachowują strumieniowanie podglądu. Ustaw `replyToMode: "off"`, gdy widoczność postępu narzędzi jest ważniejsza niż natywne odpowiedzi z cytatem, albo ustaw `streaming.preview.toolProgress: false`, aby zaakceptować ten kompromis.
    </Note>

    Dla odpowiedzi zawierających tylko tekst:

    - krótkie podglądy DM/grup/tematów: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje finalną edycję w miejscu
    - długie finalne teksty dzielone na wiele wiadomości Telegram ponownie używają istniejącego podglądu jako pierwszego finalnego fragmentu, gdy to możliwe, a potem wysyłają tylko pozostałe fragmenty
    - finalne odpowiedzi w trybie postępu czyszczą wersję roboczą statusu i używają normalnego dostarczania finalnego zamiast edytowania wersji roboczej w odpowiedź
    - jeśli finalna edycja nie powiedzie się, zanim ukończony tekst zostanie potwierdzony, OpenClaw używa normalnego dostarczania finalnego i czyści nieaktualny podgląd

    Dla złożonych odpowiedzi (na przykład payloadów multimediów) OpenClaw wraca do normalnego dostarczania finalnego, a następnie czyści wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielne od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Zachowanie strumienia rozumowania:

    - `/reasoning stream` używa ścieżki podglądu rozumowania obsługiwanego kanału; w Telegram strumieniuje rozumowanie do podglądu na żywo podczas generowania
    - podgląd rozumowania jest usuwany po dostarczeniu finalnej odpowiedzi; użyj `/reasoning on`, gdy rozumowanie ma pozostać widoczne
    - finalna odpowiedź jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie bogatych wiadomości">
    Tekst wychodzący domyślnie używa standardowych wiadomości HTML Telegram, aby odpowiedzi pozostawały czytelne we współczesnych klientach Telegram. Ten tryb zgodności obsługuje zwykłe pogrubienie, kursywę, linki, kod, spoilery i cytaty, ale nie obsługuje bloków dostępnych tylko w bogatym trybie Bot API 10.1, takich jak natywne tabele, szczegóły, bogate multimedia i formuły.

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
    - Jawne payloady bogatego HTML zachowują obsługiwane tagi Bot API 10.1, takie jak nagłówki, tabele, szczegóły, bogate multimedia i formuły.
    - Podpisy multimediów nadal używają podpisów HTML Telegram, ponieważ bogate wiadomości nie zastępują podpisów.

    Dzięki temu tekst modelu nie trafia do znaczników Telegram Rich Markdown, więc kwoty takie jak `$400-600K` nie są parsowane jako matematyka. Długi bogaty tekst jest automatycznie dzielony zgodnie z limitami bogatego tekstu i bogatych bloków Telegram. Tabele przekraczające limit kolumn Telegram są wysyłane jako bloki kodu.

    Domyślnie: wyłączone dla zgodności z klientami. Bogate wiadomości wymagają zgodnych klientów Telegram; niektóre obecne klienty Desktop, Web, Android i klienci firm trzecich wyświetlają zaakceptowane bogate wiadomości jako nieobsługiwane. Pozostaw tę opcję wyłączoną, chyba że każdy klient używany z botem potrafi je renderować. `/status` pokazuje, czy bieżąca sesja Telegram ma bogate wiadomości włączone czy wyłączone.

    Podglądy linków są domyślnie włączone. `channels.telegram.linkPreview: false` pomija automatyczne wykrywanie encji dla bogatego tekstu.

  </Accordion>

  <Accordion title="Polecenia natywne i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana przy uruchomieniu za pomocą `setMyCommands`.

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

    - polecenia niestandardowe są tylko wpisami menu; nie implementują automatycznie zachowania
    - polecenia Plugin/Skills mogą nadal działać po wpisaniu, nawet jeśli nie są pokazywane w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/Plugin mogą nadal się rejestrować, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przekroczyło limit po przycięciu; zmniejsz liczbę poleceń Plugin/Skills/niestandardowych albo wyłącz `channels.telegram.commands.native`.
    - Niepowodzenie `deleteWebhook`, `deleteMyCommands` albo `setMyCommands` z `404: Not Found`, gdy bezpośrednie polecenia curl Bot API działają, może oznaczać, że `channels.telegram.apiRoot` ustawiono na pełny endpoint `/bot<TOKEN>`. `apiRoot` musi być tylko katalogiem głównym Bot API, a `openclaw doctor --fix` usuwa przypadkowe końcowe `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Zaktualizuj `botToken`, `tokenFile` albo `TELEGRAM_BOT_TOKEN` bieżącym tokenem BotFather; OpenClaw zatrzymuje się przed odpytywaniem, więc nie jest to zgłaszane jako błąd czyszczenia Webhook.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzący DNS/HTTPS do `api.telegram.org` jest zablokowany.

    ### Polecenia parowania urządzenia (Plugin `device-pair`)

    Gdy Plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym rolę/zakresy)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy jest tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji przenosi krótkotrwały token bootstrap. Wbudowany bootstrap kodu konfiguracji jest przeznaczony tylko dla węzła: pierwsze połączenie tworzy oczekujące żądanie węzła, a po zatwierdzeniu Gateway zwraca trwały token węzła z `scopes: []`. Nie zwraca przekazanego tokenu operatora; dostęp operatora wymaga osobnego zatwierdzonego parowania operatora albo przepływu tokenu.

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

    Kliknięcia callback są przekazywane agentowi jako tekst:
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

    Kontrole bramkowania:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w czasie działania używają aktywnego zrzutu konfiguracji/sekretów (uruchomienie/ponowne wczytanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdej wysyłce.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątków odpowiedzi">
    Telegram obsługuje jawne tagi wątków odpowiedzi w wygenerowanym wyjściu:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na konkretny identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` kontroluje obsługę:

    - `off` (domyślne)
    - `first`
    - `all`

    Gdy wątki odpowiedzi są włączone, a oryginalny tekst lub podpis Telegram jest dostępny, OpenClaw automatycznie dołącza natywny cytat Telegram. Telegram ogranicza natywny tekst cytatu do 1024 jednostek kodu UTF-16, więc dłuższe wiadomości są cytowane od początku i wracają do zwykłej odpowiedzi, jeśli Telegram odrzuci cytat.

    Uwaga: `off` wyłącza niejawne wątki odpowiedzi. Jawne tagi `[[reply_to_*]]` nadal są respektowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematu dopisują `:topic:<threadId>`
    - odpowiedzi i wskaźnik pisania są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Specjalny przypadek tematu ogólnego (`threadId=1`):

    - wysyłki wiadomości pomijają `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje pisania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy wartości domyślnych grupy.
    `topics."*"` ustawia wartości domyślne dla każdego tematu w tej grupie; dokładne identyfikatory tematów nadal mają pierwszeństwo przed `"*"`.

    **Trasowanie agentów per temat**: Każdy temat może być trasowany do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własny izolowany obszar roboczy, pamięć i sesję. Przykład:

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

    **Trwałe powiązanie tematu ACP**: Tematy forum mogą przypinać sesje uprzęży ACP przez najwyższego poziomu typowane powiązania ACP (`bindings[]` z `type: "acp"` i `match.channel: "telegram"`, `peer.kind: "group"` oraz identyfikatorem kwalifikowanym tematem, takim jak `-1001234567890:topic:42`). Obecnie ograniczone do tematów forum w grupach/supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Uruchamianie ACP powiązane z wątkiem z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne wiadomości są trasowane bezpośrednio tam. OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga, aby `channels.telegram.threadBindings.spawnSessions` pozostało włączone (domyślnie: `true`).

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` zachowują metadane odpowiedzi; używają kluczy sesji świadomych wątków tylko wtedy, gdy Telegram `getMe` zgłasza `has_topics_enabled: true` dla bota.
    Dawne nadpisania `dm.threadReplies` i `direct.*.threadReplies` zostały celowo wycofane; użyj trybu wątków BotFather jako jedynego źródła prawdy i uruchom `openclaw doctor --fix`, aby usunąć nieaktualne klucze konfiguracji.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie jako notatka głosowa
    - transkrypcje przychodzących notatek głosowych są ujmowane w kontekście agenta jako wygenerowany maszynowo,
      niezaufany tekst; wykrywanie wzmianek nadal używa surowej
      transkrypcji, więc wiadomości głosowe bramkowane wzmiankami nadal działają.

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
    - wideo WEBM: pomijane

    Pola kontekstu naklejki:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Opisy naklejek są buforowane w stanie Plugin OpenClaw SQLite, aby ograniczyć powtarzane wywołania rozpoznawania obrazu.

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
    Reakcje Telegram docierają jako aktualizacje `message_reaction` (oddzielnie od payloadów wiadomości).

    Gdy są włączone, OpenClaw kolejkowuje zdarzenia systemowe, takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkowników na wiadomości wysłane przez bota (best-effort przez pamięć podręczną wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrole dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy niebędące forami są kierowane do sesji czatu grupowego
      - grupy forum są kierowane do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla odpytywania/Webhook automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje potwierdzenia">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość. `ackReactionScope` decyduje, *kiedy* to emoji zostanie faktycznie wysłane.

    **Kolejność rozwiązywania emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - awaryjne emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

    **Zakres (`messages.ackReactionScope`):**

    Dostawca Telegram odczytuje zakres z `messages.ackReactionScope` (domyślnie `"group-mentions"`). Obecnie nie ma nadpisania na poziomie konta Telegram ani kanału Telegram.

    Wartości: `"all"` (DM-y + grupy), `"direct"` (tylko DM-y), `"group-all"` (każda wiadomość grupowa, bez DM-ów), `"group-mentions"` (grupy, gdy bot jest wspomniany; **bez DM-ów** — to wartość domyślna), `"off"` / `"none"` (wyłączone).

    <Note>
    Domyślny zakres (`"group-mentions"`) nie uruchamia reakcji potwierdzenia w wiadomościach bezpośrednich. Aby uzyskać reakcję potwierdzenia dla przychodzących DM-ów Telegram, ustaw `messages.ackReactionScope` na `"direct"` lub `"all"`. Wartość jest odczytywana przy uruchamianiu dostawcy Telegram, więc aby zmiana zaczęła obowiązywać, potrzebny jest restart Gateway.
    </Note>

  </Accordion>

  <Accordion title="Zapisy konfiguracji ze zdarzeń i poleceń Telegram">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grup (`migrate_to_chat_id`) w celu aktualizacji `channels.telegram.groups`
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
    Domyślnie używane jest długie odpytywanie. Dla trybu Webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (domyślnie `/telegram-webhook`, `127.0.0.1`, `8787`).

    W trybie długiego odpytywania OpenClaw zapisuje swój znacznik wznowienia po restarcie dopiero po pomyślnym obsłużeniu aktualizacji. Jeśli handler się nie powiedzie, ta aktualizacja pozostaje możliwa do ponowienia w tym samym procesie i nie jest zapisywana jako ukończona na potrzeby deduplikacji po restarcie.

    Lokalny listener wiąże się z `127.0.0.1:8787`. Dla publicznego ruchu przychodzącego umieść reverse proxy przed lokalnym portem albo celowo ustaw `webhookHost: "0.0.0.0"`.

    Tryb Webhook waliduje zabezpieczenia żądania, tajny token Telegram oraz treść JSON przed zwróceniem `200` do Telegram.
    Następnie OpenClaw przetwarza aktualizację asynchronicznie przez te same ścieżki bota per czat/per temat, których używa długie odpytywanie, więc powolne tury agenta nie blokują ACK dostarczenia Telegram.

  </Accordion>

  <Accordion title="Limity, ponawianie prób i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar multimediów Telegram przychodzących i wychodzących.
    - `channels.telegram.mediaGroupFlushMs` (domyślnie 500) kontroluje, jak długo albumy/grupy multimediów Telegram są buforowane, zanim OpenClaw wyśle je jako jedną wiadomość przychodzącą. Zwiększ tę wartość, jeśli części albumu docierają z opóźnieniem; zmniejsz ją, aby skrócić opóźnienie odpowiedzi na album.
    - `channels.telegram.timeoutSeconds` zastępuje limit czasu klienta API Telegram (jeśli nie ustawiono, obowiązuje domyślna wartość grammY). Klienci botów ograniczają skonfigurowane wartości poniżej 60-sekundowego zabezpieczenia żądań tekstu wychodzącego/pisania, aby grammY nie przerwał dostarczania widocznej odpowiedzi, zanim uruchomi się zabezpieczenie transportu i fallback OpenClaw. Długie odpytywanie nadal używa 45-sekundowego zabezpieczenia żądania `getUpdates`, aby bezczynne odpytywania nie były porzucane bezterminowo.
    - `channels.telegram.pollingStallThresholdMs` domyślnie ma wartość `120000`; dostrajaj w zakresie od `30000` do `600000` tylko w przypadku fałszywie dodatnich restartów z powodu zastoju odpytywania.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` lub `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania jest normalizowany do jednego wybranego okna kontekstu rozmowy, gdy gateway zaobserwował wiadomości nadrzędne; pamięć podręczna zaobserwowanych wiadomości znajduje się w stanie Plugin SQLite OpenClaw, a `openclaw doctor --fix` importuje starsze pliki pomocnicze. Telegram uwzględnia w aktualizacjach tylko jedno płytkie `reply_to_message`, więc łańcuchy starsze niż pamięć podręczna są ograniczone do bieżącego ładunku aktualizacji Telegram.
    - listy dozwolonych Telegram przede wszystkim ograniczają, kto może uruchomić agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.
    - Kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfiguracja `channels.telegram.retry` dotyczy pomocników wysyłania Telegram (CLI/narzędzia/akcje) dla możliwych do odzyskania błędów wychodzącego API. Dostarczanie końcowej odpowiedzi przychodzącej także używa ograniczonego ponowienia bezpiecznego wysyłania dla awarii Telegram przed połączeniem, ale nie ponawia niejednoznacznych kopert sieciowych po wysłaniu, które mogłyby zduplikować widoczne wiadomości.

    Cele wysyłania CLI i narzędzi wiadomości mogą być numerycznym identyfikatorem czatu, nazwą użytkownika albo celem tematu forum:

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
    - `--pin` lub `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać wiadomości w tym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy, GIF-y i filmy jako dokumenty zamiast skompresowanych zdjęć, multimediów animowanych lub przesyłanych filmów

    Bramkowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając zwykłe wysyłanie włączone

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM zatwierdzających i opcjonalnie może publikować monity w czacie lub temacie źródłowym. Zatwierdzający muszą być numerycznymi identyfikatorami użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy co najmniej jeden zatwierdzający jest możliwy do rozpoznania)
    - `channels.telegram.execApprovals.approvers` (wraca do numerycznych identyfikatorów właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` kontrolują, kto może rozmawiać z botem i gdzie wysyła on normalne odpowiedzi. Nie czynią nikogo zatwierdzającym exec. Pierwsze zatwierdzone parowanie DM inicjuje `commands.ownerAllowFrom`, gdy nie istnieje jeszcze właściciel poleceń, więc konfiguracja z jednym właścicielem nadal działa bez duplikowania identyfikatorów pod `execApprovals.approvers`.

    Dostarczanie do kanału pokazuje tekst polecenia na czacie; włączaj `channel` lub `both` tylko w zaufanych grupach/tematach. Gdy monit trafia do tematu forum, OpenClaw zachowuje temat dla monitu zatwierdzenia i kolejnej wiadomości. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline również wymagają, aby `channels.telegram.capabilities.inlineButtons` zezwalało na docelową powierzchnię (`dm`, `group` lub `all`). Identyfikatory zatwierdzeń z prefiksem `plugin:` są rozwiązywane przez zatwierdzenia Plugin; pozostałe są najpierw rozwiązywane przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrolki odpowiedzi o błędach

Gdy agent napotka błąd dostarczania lub dostawcy, Telegram może odpowiedzieć tekstem błędu albo go wyciszyć. Tym zachowaniem sterują dwa klucze konfiguracji:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                             |
| ----------------------------------- | ----------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła przyjazny komunikat błędu do czatu. `silent` całkowicie wycisza odpowiedzi o błędach. |
| `channels.telegram.errorCooldownMs` | liczba (ms)       | `60000`   | Minimalny czas między odpowiedziami o błędach do tego samego czatu. Zapobiega spamowi błędami podczas awarii. |

Obsługiwane są nadpisania dla konta, grupy i tematu (takie samo dziedziczenie jak w przypadku innych kluczy konfiguracji Telegram).

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
      - następnie usuń i ponownie dodaj bota do grupy
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne identyfikatory grup; symbol wieloznaczny `"*"` nie może być sprawdzany pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (albo zawierać `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow` w poszukiwaniu powodów pominięcia

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje nawet wtedy, gdy polityka grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele wpisów; ogranicz polecenia Plugin/skill/niestandardowe albo wyłącz natywne menu
    - Wywołania startowe `deleteMyCommands` / `setMyCommands` i wywołania pisania `sendChatAction` są ograniczone czasowo i ponawiane raz przez fallback transportu Telegram przy przekroczeniu limitu czasu żądania. Uporczywe błędy sieci/fetch zwykle wskazują na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Uruchomienie zgłasza nieautoryzowany token">

    - `getMe returned 401` to błąd uwierzytelniania Telegram dla skonfigurowanego tokena bota.
    - Skopiuj ponownie albo wygeneruj ponownie token bota w BotFather, a następnie zaktualizuj `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` lub `TELEGRAM_BOT_TOKEN` dla konta domyślnego.
    - `deleteWebhook 401 Unauthorized` podczas uruchamiania także jest błędem uwierzytelniania; traktowanie go jako „brak istniejącego webhooka” tylko odłożyłoby tę samą awarię złego tokena do późniejszych wywołań API.

  </Accordion>

  <Accordion title="Niestabilność odpytywania lub sieci">

    - Node 22+ i niestandardowy fetch/proxy mogą wyzwolić natychmiastowe przerywanie, jeśli typy AbortSignal są niedopasowane.
    - Niektóre hosty rozwiązują `api.telegram.org` najpierw do IPv6; uszkodzony ruch wychodzący IPv6 może powodować sporadyczne awarie API Telegram.
    - Jeśli logi zawierają `TypeError: fetch failed` lub `Network request for 'getUpdates' failed!`, OpenClaw ponawia teraz te błędy jako możliwe do odzyskania błędy sieciowe.
    - Podczas uruchamiania odpytywania OpenClaw ponownie używa udanej sondy startowej `getMe` dla grammY, aby runner nie potrzebował drugiego `getMe` przed pierwszym `getUpdates`.
    - Jeśli `deleteWebhook` kończy się przejściowym błędem sieci podczas uruchamiania odpytywania, OpenClaw kontynuuje długie odpytywanie zamiast wykonywać kolejne przedodpytywujące wywołanie płaszczyzny sterowania. Nadal aktywny webhook ujawnia się jako konflikt `getUpdates`; OpenClaw wtedy odbudowuje transport Telegram i ponawia czyszczenie webhooka.
    - Jeśli gniazda Telegram są odnawiane w krótkim stałym rytmie, sprawdź, czy `channels.telegram.timeoutSeconds` nie ma niskiej wartości; klienci botów ograniczają skonfigurowane wartości poniżej zabezpieczeń żądań wychodzących i `getUpdates`, ale starsze wydania mogły przerywać każde odpytywanie lub odpowiedź, gdy ustawiono to poniżej tych zabezpieczeń.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw domyślnie restartuje odpytywanie i odbudowuje transport Telegram po 120 sekundach bez ukończonej żywotności długiego odpytywania.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy uruchomione konto odpytywania nie ukończyło `getUpdates` po okresie karencji startowej, gdy uruchomione konto webhooka nie ukończyło `setWebhook` po okresie karencji startowej albo gdy ostatnia udana aktywność transportu odpytywania jest nieświeża.
    - Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zastoju odpytywania. Uporczywe zastoje zwykle wskazują na problemy z proxy, DNS, IPv6 lub ruchem wychodzącym TLS między hostem a `api.telegram.org`.
    - Telegram honoruje także zmienne środowiskowe proxy procesu dla transportu Bot API, w tym `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` oraz ich warianty pisane małymi literami. `NO_PROXY` / `no_proxy` nadal mogą omijać `api.telegram.org`.
    - Jeśli zarządzane proxy OpenClaw jest skonfigurowane przez `OPENCLAW_PROXY_URL` dla środowiska usługi i nie ma standardowej zmiennej środowiskowej proxy, Telegram używa tego adresu URL również dla transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS kieruj wywołania API Telegram przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2). Kolejność wyników DNS Telegram honoruje `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, następnie `channels.telegram.network.dnsResultOrder`, a potem domyślne ustawienie procesu, takie jak `NODE_OPTIONS=--dns-result-order=ipv4first`; jeśli żadne nie ma zastosowania, Node 22+ wraca do `ipv4first`.
    - Jeśli host to WSL2 albo jawnie działa lepiej z zachowaniem tylko IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu testowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania multimediów Telegram. Jeśli zaufany fake-IP lub
      przezroczysty serwer proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/specjalnego użycia adres podczas pobierania multimediów, możesz
      włączyć obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo ustawienie opt-in jest dostępne dla każdego konta pod
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli Twój serwer proxy rozwiązuje hosty multimediów Telegram na `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie zezwalają na zakres
      testowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia SSRF
      multimediów Telegram. Używaj tego tylko w zaufanych środowiskach proxy kontrolowanych przez operatora,
      takich jak routing fake-IP Clash, Mihomo lub Surge, gdy syntetyzują one odpowiedzi prywatne
      lub specjalnego użycia poza zakresem testowym RFC 2544. Pozostaw to wyłączone dla zwykłego
      publicznego dostępu Telegram przez internet.
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
- domyślne ustawienia tematów: `groups.<chatId>.topics."*"` stosuje się do niedopasowanych tematów forum; dokładne identyfikatory tematów mają pierwszeństwo
- zatwierdzenia wykonania: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- strumieniowanie: `streaming` (wersja podglądowa), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- niestandardowy katalog główny API: `apiRoot` (tylko katalog główny Bot API; nie dołączaj `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- działania/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Kolejność pierwszeństwa wielu kont: gdy skonfigurowane są co najmniej dwa identyfikatory kont, ustaw `channels.telegram.defaultAccount` (lub dołącz `channels.telegram.accounts.default`), aby jawnie określić domyślny routing. W przeciwnym razie OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` ostrzega. Nazwane konta dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
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
    Model zagrożeń i utwardzanie zabezpieczeń.
  </Card>
  <Card title="Routing wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj grupy i tematy na agentów.
  </Card>
  <Card title="Rozwiązywanie problemów" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa.
  </Card>
</CardGroup>
