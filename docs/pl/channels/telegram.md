---
read_when:
    - Praca nad funkcjami Telegram lub Webhookami
summary: Status obsługi, możliwości i konfiguracja bota Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-03T17:43:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 202d6eaaf9348203855659d30616368995bce9269082e60dfed67c8d444abf18
    source_path: channels/telegram.md
    workflow: 16
---

Gotowe do produkcji dla DM-ów botów i grup za pośrednictwem grammY. Long polling jest trybem domyślnym; tryb webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Domyślną polityką DM dla Telegram jest parowanie.
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
    Otwórz Telegram i porozmawiaj z **@BotFather** (potwierdź, że uchwyt to dokładnie `@BotFather`).

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

    Awaryjna zmienna środowiskowa: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w konfiguracji/środowisku, a następnie uruchom gateway.

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
    Dodaj bota do swojej grupy, a następnie uzyskaj oba identyfikatory wymagane do dostępu grupowego:

    - Twój identyfikator użytkownika Telegram, używany w `allowFrom` / `groupAllowFrom`
    - identyfikator czatu grupy Telegram, używany jako klucz w `channels.telegram.groups`

    Przy pierwszej konfiguracji uzyskaj identyfikator czatu grupy z `openclaw logs --follow`, bota do przekazywanych identyfikatorów albo Bot API `getUpdates`. Po dopuszczeniu grupy `/whoami@<bot_username>` może potwierdzić identyfikatory użytkownika i grupy.

    Ujemne identyfikatory supergrup Telegram zaczynające się od `-100` są identyfikatorami czatów grupowych. Umieść je w `channels.telegram.groups`, a nie w `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Kolejność rozwiązywania tokenu uwzględnia konto. W praktyce wartości z konfiguracji mają pierwszeństwo przed awaryjną zmienną środowiskową, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
Po udanym uruchomieniu OpenClaw zapisuje tożsamość bota w katalogu stanu na maksymalnie 24 godziny, aby ponowne uruchomienia mogły uniknąć dodatkowego wywołania Telegram `getMe`; zmiana lub usunięcie tokenu czyści tę pamięć podręczną.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Boty Telegram domyślnie używają **trybu prywatności**, który ogranicza wiadomości grupowe, jakie otrzymują.

    Jeśli bot musi widzieć wszystkie wiadomości grupowe:

    - wyłącz tryb prywatności za pomocą `/setprivacy`, albo
    - ustaw bota jako administratora grupy.

    Podczas przełączania trybu prywatności usuń i ponownie dodaj bota w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Group permissions">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty administracyjne otrzymują wszystkie wiadomości grupowe, co jest przydatne dla zawsze aktywnego zachowania grupowego.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups`, aby zezwolić na dodawanie do grup lub je zablokować
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

### Tożsamość bota w grupie

W grupach Telegram i tematach forum jawna wzmianka o skonfigurowanym uchwycie bota (na przykład `@my_bot`) jest traktowana jako adresowanie wybranego agenta OpenClaw, nawet jeśli nazwa persony agenta różni się od nazwy użytkownika Telegram. Polityka wyciszenia grupy nadal dotyczy niepowiązanego ruchu grupowego, ale sam uchwyt bota nie jest uznawany za „kogoś innego”.

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` kontroluje dostęp do wiadomości bezpośrednich:

    - `pairing` (domyślne)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` pozwala dowolnemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, wydawać botowi polecenia. Używaj tego tylko dla celowo publicznych botów z mocno ograniczonymi narzędziami; boty jednego właściciela powinny używać `allowlist` z numerycznymi identyfikatorami użytkowników.

    `channels.telegram.allowFrom` przyjmuje numeryczne identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach wielokontowych restrykcyjne `channels.telegram.allowFrom` najwyższego poziomu jest traktowane jako granica bezpieczeństwa: wpisy `allowFrom: ["*"]` na poziomie konta nie czynią tego konta publicznym, chyba że efektywna lista dozwolonych kont po scaleniu nadal zawiera jawny symbol wieloznaczny.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie DM-y i jest odrzucane przez walidację konfiguracji.
    Konfiguracja prosi tylko o numeryczne identyfikatory użytkowników.
    Jeśli po aktualizacji Twoja konfiguracja zawiera wpisy listy dozwolonych `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (najlepszym możliwym sposobem; wymaga tokenu bota Telegram).
    Jeśli wcześniej polegałeś na plikach listy dozwolonych magazynu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach listy dozwolonych (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    Dla botów jednego właściciela preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi identyfikatorami `allowFrom`, aby polityka dostępu była trwała w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania DM nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp do DM-ów. Jeśli nie istnieje jeszcze właściciel poleceń, pierwsze zatwierdzone parowanie ustawia także `commands.ownerAllowFrom`, aby polecenia tylko dla właściciela i zatwierdzenia exec miały jawne konto operatora.
    Autoryzacja nadawców w grupie nadal pochodzi z jawnych list dozwolonych w konfiguracji.
    Jeśli chcesz, aby „jestem raz autoryzowany i działają zarówno DM-y, jak i polecenia grupowe”, umieść swój numeryczny identyfikator użytkownika Telegram w `channels.telegram.allowFrom`; dla poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

    ### Znajdowanie identyfikatora użytkownika Telegram

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

  <Tab title="Group policy and allowlists">
    Dwie kontrolki działają razem:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - z `groupPolicy: "open"`: dowolna grupa może przejść sprawdzenia identyfikatora grupy
         - z `groupPolicy: "allowlist"` (domyślne): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako lista dozwolonych (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślne)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców w grupach. Jeśli nie jest ustawione, Telegram wraca do `allowFrom`.
    Wpisy `groupAllowFrom` powinny być numerycznymi identyfikatorami użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatów grup Telegram ani supergrup w `groupAllowFrom`. Ujemne identyfikatory czatów należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): uwierzytelnianie nadawcy grupowego **nie** dziedziczy zatwierdzeń z magazynu parowania DM.
    Parowanie pozostaje tylko dla DM-ów. Dla grup ustaw `groupAllowFrom` albo `allowFrom` na poziomie grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram wraca do konfiguracji `allowFrom`, a nie do magazynu parowania.
    Praktyczny wzorzec dla botów jednego właściciela: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i dopuść docelowe grupy w `channels.telegram.groups`.
    Uwaga dotycząca runtime: jeśli `channels.telegram` całkowicie brakuje, runtime domyślnie działa w trybie fail-closed `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest jawnie ustawione.

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

    Przetestuj to z grupy za pomocą `@<bot_username> ping`. Zwykłe wiadomości grupowe nie wyzwalają bota, gdy `requireMention: true`.

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
      Częsty błąd: `groupAllowFrom` nie jest listą dozwolonych grup Telegram.

      - Umieść ujemne identyfikatory grup Telegram lub czatów supergrup, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieść identyfikatory użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą wyzwalać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Odpowiedzi w grupach domyślnie wymagają wzmianki.

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

    Kontekst historii grupy jest zawsze włączony dla grup i ograniczony przez
    `historyLimit`. Ustaw `channels.telegram.historyLimit: 0`, aby wyłączyć
    okno historii grupy Telegram. Wycofany klucz `includeGroupHistoryContext`
    jest usuwany przez `openclaw doctor --fix`.

    Uzyskiwanie identyfikatora czatu grupy:

    - przekaż wiadomość grupową do `@userinfobot` / `@getidsbot`
    - albo odczytaj `chat.id` z `openclaw logs --follow`
    - albo sprawdź Bot API `getUpdates`
    - po dopuszczeniu grupy uruchom `/whoami@<bot_username>`, jeśli natywne polecenia są włączone

  </Tab>
</Tabs>

## Zachowanie runtime

- Telegram należy do procesu Gateway.
- Routing jest deterministyczny: odpowiedzi przychodzące z Telegram wracają do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi, placeholderami multimediów oraz utrwalonym kontekstem łańcucha odpowiedzi dla odpowiedzi Telegram zaobserwowanych przez Gateway.
- Sesje grupowe są izolowane według ID grupy. Tematy forum dodają `:topic:<threadId>`, aby utrzymać izolację tematów.
- Wiadomości DM mogą zawierać `message_thread_id`; OpenClaw zachowuje je dla odpowiedzi. Sesje tematów DM są rozdzielane tylko wtedy, gdy Telegram `getMe` zgłasza `has_topics_enabled: true` dla bota; w przeciwnym razie DM pozostają w płaskiej sesji.
- Long polling używa runnera grammY z sekwencjonowaniem per czat/per wątek. Ogólna współbieżność ujścia runnera używa `agents.defaults.maxConcurrent`.
- Uruchamianie wielu kont ogranicza współbieżne sondy Telegram `getMe`, aby duże floty botów nie uruchamiały sond wszystkich kont naraz.
- Long polling jest chroniony wewnątrz każdego procesu Gateway, więc tylko jeden aktywny poller może używać tokena bota w danym czasie. Jeśli nadal widzisz konflikty `getUpdates` 409, prawdopodobnie inny Gateway OpenClaw, skrypt albo zewnętrzny poller używa tego samego tokena.
- Restarty watchdog long pollingu są domyślnie wyzwalane po 120 sekundach bez ukończonej żywotności `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy wdrożenie nadal widzi fałszywe restarty z powodu zastoju pollingu podczas długotrwałej pracy. Wartość jest podawana w milisekundach i może wynosić od `30000` do `600000`; obsługiwane są nadpisania per konto.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

<Note>
  `channels.telegram.dm.threadReplies` i `channels.telegram.direct.<chatId>.threadReplies` zostały usunięte. Uruchom `openclaw doctor --fix` po aktualizacji, jeśli konfiguracja nadal ma te klucze. Routing tematów DM używa teraz możliwości bota z Telegram `getMe.has_topics_enabled`, kontrolowanej przez tryb wątków BotFather: boty z włączonymi tematami używają sesji DM ograniczonych do wątku, gdy Telegram wysyła `message_thread_id`; pozostałe DM pozostają w płaskiej sesji.
</Note>

## Dokumentacja funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumienia na żywo (edycje wiadomości)">
    OpenClaw może strumieniować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` to `off | partial | block | progress` (domyślnie: `partial`)
    - krótkie początkowe podglądy odpowiedzi są debounce'owane, a następnie materializowane po ograniczonym opóźnieniu, jeśli uruchomienie jest nadal aktywne
    - `progress` utrzymuje jeden edytowalny szkic statusu dla postępu narzędzi, pokazuje stabilną etykietę statusu, gdy aktywność odpowiedzi pojawia się przed postępem narzędzi, czyści go po ukończeniu i wysyła finalną odpowiedź jako zwykłą wiadomość
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzi/postępu ponownie używają tej samej edytowanej wiadomości podglądu (domyślnie: `true`, gdy strumieniowanie podglądu jest aktywne)
    - `streaming.preview.commandText` kontroluje szczegóły polecenia/wykonania w tych wierszach postępu narzędzi: `raw` (domyślnie, zachowuje wydane zachowanie) albo `status` (tylko etykieta narzędzia)
    - `streaming.progress.commentary` (domyślnie: `false`) włącza tekst komentarza/preambuły asystenta w tymczasowym szkicu postępu
    - starsze `channels.telegram.streamMode`, boolowskie wartości `streaming` i wycofane klucze natywnego podglądu szkicu są wykrywane; uruchom `openclaw doctor --fix`, aby zmigrować je do bieżącej konfiguracji strumieniowania

    Aktualizacje podglądu postępu narzędzi to krótkie wiersze statusu pokazywane podczas działania narzędzi, na przykład wykonywanie poleceń, odczyty plików, aktualizacje planowania, podsumowania łatek albo tekst preambuły/komentarza Codex w trybie serwera aplikacji Codex. Telegram utrzymuje je domyślnie włączone, aby dopasować wydane zachowanie OpenClaw od `v2026.4.22` i nowszych.

    Aby zachować edytowany podgląd dla tekstu odpowiedzi, ale ukryć wiersze postępu narzędzi, ustaw:

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

    Użyj trybu `progress`, gdy chcesz widocznego postępu narzędzi bez edytowania finalnej odpowiedzi w tej samej wiadomości. Umieść politykę tekstu polecenia pod `streaming.progress`:

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

    Używaj `streaming.mode: "off"` tylko wtedy, gdy chcesz dostarczania wyłącznie finalnego: edycje podglądu Telegram są wyłączone, a ogólny szum narzędzi/postępu jest tłumiony zamiast wysyłania jako samodzielne wiadomości statusu. Monity zatwierdzania, payloady multimediów i błędy nadal przechodzą przez normalne dostarczanie finalne. Użyj `streaming.preview.toolProgress: false`, gdy chcesz tylko zachować edycje podglądu odpowiedzi, ukrywając wiersze statusu postępu narzędzi.

    <Note>
      Odpowiedzi Telegram na wybrany cytat są wyjątkiem. Gdy `replyToMode` to `"first"`, `"all"` albo `"batched"` i wiadomość przychodząca zawiera tekst wybranego cytatu, OpenClaw wysyła finalną odpowiedź przez natywną ścieżkę odpowiedzi na cytat Telegram zamiast edytować podgląd odpowiedzi, więc `streaming.preview.toolProgress` nie może pokazać krótkich wierszy statusu dla tego przebiegu. Odpowiedzi na bieżącą wiadomość bez tekstu wybranego cytatu nadal zachowują strumieniowanie podglądu. Ustaw `replyToMode: "off"`, gdy widoczność postępu narzędzi jest ważniejsza niż natywne odpowiedzi na cytaty, albo ustaw `streaming.preview.toolProgress: false`, aby zaakceptować kompromis.
    </Note>

    Dla odpowiedzi wyłącznie tekstowych:

    - krótkie podglądy DM/grupy/tematu: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje finalną edycję w miejscu
    - długie finalne teksty, które dzielą się na wiele wiadomości Telegram, ponownie używają istniejącego podglądu jako pierwszego finalnego fragmentu, gdy to możliwe, a potem wysyłają tylko pozostałe fragmenty
    - finalne odpowiedzi w trybie postępu czyszczą szkic statusu i używają normalnego dostarczania finalnego zamiast edytować szkic w odpowiedź
    - jeśli finalna edycja nie powiedzie się przed potwierdzeniem ukończonego tekstu, OpenClaw używa normalnego dostarczania finalnego i czyści przestarzały podgląd

    Dla złożonych odpowiedzi (na przykład payloadów multimediów) OpenClaw wraca do normalnego dostarczania finalnego, a następnie czyści wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielne od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Zachowanie strumienia rozumowania:

    - `/reasoning stream` używa ścieżki podglądu rozumowania obsługiwanego kanału; w Telegram strumieniuje rozumowanie do podglądu na żywo podczas generowania
    - podgląd rozumowania jest usuwany po dostarczeniu finalnym; użyj `/reasoning on`, gdy rozumowanie ma pozostać widoczne
    - finalna odpowiedź jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie wiadomości rozszerzonych">
    Tekst wychodzący domyślnie używa standardowych wiadomości HTML Telegram, aby odpowiedzi pozostały czytelne w bieżących klientach Telegram. Ten tryb zgodności obsługuje zwykłe pogrubienie, kursywę, linki, kod, spoilery i cytaty, ale nie bloki wyłącznie rozszerzone Bot API 10.1, takie jak natywne tabele, szczegóły, rich media i formuły.

    Ustaw `channels.telegram.richMessages: true`, aby włączyć rozszerzone wiadomości Bot API 10.1:

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

    - Agent otrzymuje informację, że rozszerzone wiadomości Telegram są dostępne dla tego bota/konta.
    - Tekst Markdown jest renderowany przez Markdown IR OpenClaw i wysyłany jako rozszerzony HTML Telegram.
    - Jawne payloady rozszerzonego HTML zachowują obsługiwane tagi Bot API 10.1, takie jak nagłówki, tabele, szczegóły, rich media i formuły.
    - Podpisy multimediów nadal używają podpisów HTML Telegram, ponieważ rozszerzone wiadomości nie zastępują podpisów.

    Dzięki temu tekst modelu nie trafia do znaczników Telegram Rich Markdown, więc waluty takie jak `$400-600K` nie są parsowane jako matematyka. Długi tekst rozszerzony jest automatycznie dzielony między limity tekstu rozszerzonego i bloków rozszerzonych Telegram. Tabele przekraczające limit kolumn Telegram są wysyłane jako bloki kodu.

    Domyślnie: wyłączone dla zgodności klientów. Rozszerzone wiadomości wymagają zgodnych klientów Telegram; niektóre bieżące klienty Desktop, Web, Android i klientów zewnętrznych wyświetlają zaakceptowane rozszerzone wiadomości jako nieobsługiwane. Pozostaw tę opcję wyłączoną, chyba że każdy klient używany z botem potrafi je renderować. `/status` pokazuje, czy bieżąca sesja Telegram ma rozszerzone wiadomości włączone czy wyłączone.

    Podglądy linków są domyślnie włączone. `channels.telegram.linkPreview: false` pomija automatyczne wykrywanie encji dla tekstu rozszerzonego.

  </Accordion>

  <Accordion title="Natywne polecenia i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana przy uruchomieniu przez `setMyCommands`.

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

    Jeśli polecenia natywne są wyłączone, wbudowane są usuwane. Polecenia niestandardowe/pluginów mogą nadal się rejestrować, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przepełniło się po przycięciu; zmniejsz liczbę poleceń pluginów/Skills/niestandardowych albo wyłącz `channels.telegram.commands.native`.
    - Niepowodzenie `deleteWebhook`, `deleteMyCommands` albo `setMyCommands` z `404: Not Found`, gdy bezpośrednie polecenia curl Bot API działają, może oznaczać, że `channels.telegram.apiRoot` ustawiono na pełny endpoint `/bot<TOKEN>`. `apiRoot` musi być tylko korzeniem Bot API, a `openclaw doctor --fix` usuwa przypadkowe końcowe `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Zaktualizuj `botToken`, `tokenFile` albo `TELEGRAM_BOT_TOKEN` bieżącym tokenem BotFather; OpenClaw zatrzymuje się przed pollingiem, więc nie jest to zgłaszane jako niepowodzenie czyszczenia webhooka.
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

    Kod konfiguracji zawiera krótkotrwały token bootstrap. Wbudowany bootstrap kodu konfiguracji zwraca trwały token Node z `scopes: []` oraz ograniczony token przekazania operatora dla zaufanego onboardingu mobilnego. Ten token operatora może odczytywać natywną konfigurację z czasu konfiguracji, ale nie przyznaje zakresów mutacji parowania ani `operator.admin`.

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

    Starsze `capabilities: ["inlineButtons"]` jest mapowane na `inlineButtons: "all"`.

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

    Kliknięcia wywołania zwrotnego, które nie zostaną obsłużone przez zarejestrowany interaktywny
    handler pluginu, są przekazywane agentowi jako tekst:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Akcje wiadomości Telegram dla agentów i automatyzacji">
    Akcje narzędzi Telegram obejmują:

    - `sendMessage` (`to`, `content`, opcjonalnie `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` lub `caption`, opcjonalne przyciski inline `presentation`; edycje samych przycisków aktualizują znaczniki odpowiedzi)
    - `createForumTopic` (`chatId`, `name`, opcjonalnie `iconColor`, `iconCustomEmojiId`)

    Akcje wiadomości kanału udostępniają ergonomiczne aliasy (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrole bramkowania:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w czasie działania używają aktywnej migawki konfiguracji/sekretów (uruchomienie/ponowne wczytanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdej wysyłce.

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

    Gdy wątkowanie odpowiedzi jest włączone i oryginalny tekst lub podpis Telegram jest dostępny, OpenClaw automatycznie dołącza natywny fragment cytatu Telegram. Telegram ogranicza natywny tekst cytatu do 1024 jednostek kodu UTF-16, więc dłuższe wiadomości są cytowane od początku i wracają do zwykłej odpowiedzi, jeśli Telegram odrzuci cytat.

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` nadal są respektowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematów dodają `:topic:<threadId>`
    - odpowiedzi i sygnalizowanie pisania trafiają do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Specjalny przypadek tematu ogólnego (`threadId=1`):

    - wysyłki wiadomości pomijają `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje pisania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy z domyślnych ustawień grupy.
    `topics."*"` ustawia wartości domyślne dla każdego tematu w tej grupie; dokładne identyfikatory tematów nadal mają pierwszeństwo przed `"*"`.

    **Routing agentów według tematu**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Dzięki temu każdy temat ma własną izolowaną przestrzeń roboczą, pamięć i sesję. Przykład:

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

    **Trwałe powiązanie tematu ACP**: Tematy forum mogą przypinać sesje uprzęży ACP przez typowane powiązania ACP najwyższego poziomu (`bindings[]` z `type: "acp"` oraz `match.channel: "telegram"`, `peer.kind: "group"` i identyfikatorem kwalifikowanym tematem, takim jak `-1001234567890:topic:42`). Obecnie ograniczone do tematów forum w grupach/supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Uruchomienie ACP powiązane z wątkiem z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne wiadomości trafiają bezpośrednio tam. OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga, aby `channels.telegram.threadBindings.spawnSessions` pozostało włączone (domyślnie: `true`).

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` zachowują metadane odpowiedzi; używają kluczy sesji świadomych wątków tylko wtedy, gdy Telegram `getMe` zgłasza `has_topics_enabled: true` dla bota.
    Dawne nadpisania `dm.threadReplies` i `direct.*.threadReplies` zostały celowo wycofane; używaj trybu wątków BotFather jako jedynego źródła prawdy i uruchom `openclaw doctor --fix`, aby usunąć przestarzałe klucze konfiguracji.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie jako notatki głosowej
    - transkrypcje przychodzących notatek głosowych są ujmowane w kontekście agenta jako tekst wygenerowany maszynowo
      i niezaufany; wykrywanie wzmianek nadal używa surowej
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

    - statyczne WEBP: pobierane i przetwarzane (placeholder `<media:sticker>`)
    - animowane TGS: pomijane
    - wideo WEBM: pomijane

    Pola kontekstu naklejki:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Opisy naklejek są buforowane w stanie Pluginu SQLite OpenClaw, aby ograniczyć powtarzane wywołania modelu wizyjnego.

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

  <Accordion title="Reaction notifications">
    Reakcje Telegram przychodzą jako aktualizacje `message_reaction` (oddzielnie od ładunków wiadomości).

    Gdy są włączone, OpenClaw kolejkuje zdarzenia systemowe, takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkownika na wiadomości wysłane przez bota (best-effort przez pamięć podręczną wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrolę dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy nieforumowe są kierowane do sesji czatu grupowego
      - grupy forumowe są kierowane do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla polling/webhook automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość. `ackReactionScope` decyduje, *kiedy* to emoji zostanie faktycznie wysłane.

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

    Wartości: `"all"` (DM-y + grupy), `"direct"` (tylko DM-y), `"group-all"` (każda wiadomość grupowa, bez DM-ów), `"group-mentions"` (grupy, gdy bot jest wspomniany; **bez DM-ów** — to wartość domyślna), `"off"` / `"none"` (wyłączone).

    <Note>
    Domyślny zakres (`"group-mentions"`) nie uruchamia reakcji potwierdzających w wiadomościach bezpośrednich. Aby uzyskać reakcję potwierdzającą dla przychodzących DM-ów Telegram, ustaw `messages.ackReactionScope` na `"direct"` lub `"all"`. Wartość jest odczytywana przy uruchomieniu dostawcy Telegram, więc do zastosowania zmiany potrzebny jest restart Gateway.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
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

  <Accordion title="Long polling vs webhook">
    Domyślnie używane jest długie odpytywanie. Dla trybu webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (domyślne wartości to `/telegram-webhook`, `127.0.0.1`, `8787`).

    W trybie długiego odpytywania OpenClaw utrwala swój znacznik restartu dopiero po pomyślnym przekazaniu aktualizacji. Jeśli handler zawiedzie, ta aktualizacja pozostaje możliwa do ponowienia w tym samym procesie i nie jest zapisywana jako ukończona na potrzeby deduplikacji po restarcie.

    Lokalny listener wiąże się z `127.0.0.1:8787`. W przypadku publicznego wejścia umieść reverse proxy przed lokalnym portem albo świadomie ustaw `webhookHost: "0.0.0.0"`.

    Tryb Webhook sprawdza strażników żądania, tajny token Telegram oraz treść JSON przed zwróceniem `200` do Telegram.
    Następnie OpenClaw przetwarza aktualizację asynchronicznie przez te same pasy bota per czat/per temat, których używa długie odpytywanie, więc wolne tury agenta nie blokują potwierdzenia dostarczenia Telegram.
  </Accordion>

  <Accordion title="Limity, ponawianie prób i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar multimediów przychodzących i wychodzących Telegram.
    - `channels.telegram.mediaGroupFlushMs` (domyślnie 500) kontroluje, jak długo albumy/grupy multimediów Telegram są buforowane, zanim OpenClaw przekaże je jako jedną wiadomość przychodzącą. Zwiększ tę wartość, jeśli części albumu docierają z opóźnieniem; zmniejsz ją, aby skrócić opóźnienie odpowiedzi albumu.
    - `channels.telegram.timeoutSeconds` zastępuje limit czasu klienta API Telegram (jeśli nie ustawiono, obowiązuje domyślna wartość grammY). Klienci botów ograniczają skonfigurowane wartości poniżej 60-sekundowego zabezpieczenia żądań wychodzącego tekstu/wpisywania, aby grammY nie przerwał dostarczenia widocznej odpowiedzi, zanim uruchomi się zabezpieczenie transportu i mechanizm awaryjny OpenClaw. Długie odpytywanie nadal używa 45-sekundowego zabezpieczenia żądania `getUpdates`, aby bezczynne odpytywania nie były porzucane bez końca.
    - `channels.telegram.pollingStallThresholdMs` ma domyślną wartość `120000`; dostrajaj w zakresie od `30000` do `600000` tylko w przypadku fałszywie dodatnich restartów z powodu zastoju odpytywania.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` lub `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania jest normalizowany do jednego wybranego okna kontekstu konwersacji, gdy gateway zaobserwował wiadomości nadrzędne; pamięć podręczna zaobserwowanych wiadomości znajduje się w stanie Plugin SQLite OpenClaw, a `openclaw doctor --fix` importuje starsze pliki pomocnicze. Telegram obejmuje w aktualizacjach tylko jeden płytki `reply_to_message`, więc łańcuchy starsze niż pamięć podręczna są ograniczone do bieżącego ładunku aktualizacji Telegram.
    - Listy dozwolonych Telegram kontrolują głównie, kto może uruchomić agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.
    - Kontrole historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfiguracja `channels.telegram.retry` dotyczy pomocników wysyłania Telegram (CLI/narzędzia/akcje) dla możliwych do odzyskania błędów wychodzącego API. Dostarczanie końcowej odpowiedzi przychodzącej również używa ograniczonego bezpiecznego ponawiania wysyłki dla awarii Telegram przed połączeniem, ale nie ponawia niejednoznacznych kopert sieciowych po wysłaniu, które mogłyby zduplikować widoczne wiadomości.

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
    - `--pin` lub `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać w tym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy, GIF-y i filmy jako dokumenty zamiast skompresowanych zdjęć, animowanych multimediów lub przesłanych filmów

    Bramkowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając zwykłe wysyłki włączone

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM-ach zatwierdzających i opcjonalnie może publikować monity w pierwotnym czacie lub temacie. Zatwierdzający muszą być numerycznymi identyfikatorami użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy da się rozpoznać co najmniej jednego zatwierdzającego)
    - `channels.telegram.execApprovals.approvers` (wraca do numerycznych identyfikatorów właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` kontrolują, kto może rozmawiać z botem i gdzie wysyła on zwykłe odpowiedzi. Nie czynią nikogo zatwierdzającym exec. Pierwsze zatwierdzone parowanie DM inicjuje `commands.ownerAllowFrom`, gdy nie istnieje jeszcze żaden właściciel poleceń, więc konfiguracja z jednym właścicielem nadal działa bez duplikowania identyfikatorów w `execApprovals.approvers`.

    Dostarczanie do kanału pokazuje tekst polecenia na czacie; włączaj `channel` lub `both` tylko w zaufanych grupach/tematach. Gdy monit trafia do tematu forum, OpenClaw zachowuje temat dla monitu zatwierdzenia i dalszej odpowiedzi. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline wymagają też, aby `channels.telegram.capabilities.inlineButtons` zezwalało na docelową powierzchnię (`dm`, `group` lub `all`). Identyfikatory zatwierdzeń z prefiksem `plugin:` są rozwiązywane przez zatwierdzenia pluginów; pozostałe są najpierw rozwiązywane przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrole odpowiedzi błędów

Gdy agent napotyka błąd dostarczenia lub dostawcy, polityka błędów kontroluje, czy komunikaty o błędach są wysyłane do czatu Telegram:

| Klucz                               | Wartości                   | Domyślnie       | Opis                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — wysyłaj każdy komunikat o błędzie do czatu. `once` — wysyłaj każdy unikatowy komunikat o błędzie raz na okno schładzania (tłum powtarzające się identyczne błędy). `silent` — nigdy nie wysyłaj komunikatów o błędach do czatu. |
| `channels.telegram.errorCooldownMs` | liczba (ms)                | `14400000` (4h) | Okno schładzania dla polityki `once`. Po wysłaniu błędu ten sam komunikat o błędzie jest tłumiony do upływu tego interwału. Zapobiega spamowi błędów podczas awarii.                                      |

Obsługiwane są nadpisania dla kont, grup i tematów (to samo dziedziczenie co dla innych kluczy konfiguracji Telegram).

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
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne identyfikatory grup; wildcard `"*"` nie może być sprawdzony pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (albo zawierać `"*"`)
    - sprawdź członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow` pod kątem powodów pominięcia

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy polityka grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu natywne ma zbyt wiele pozycji; zmniejsz liczbę poleceń pluginów/Skills/niestandardowych albo wyłącz menu natywne
    - Wywołania startowe `deleteMyCommands` / `setMyCommands` oraz wywołania wpisywania `sendChatAction` są ograniczone czasowo i ponawiane raz przez awaryjny transport Telegram przy przekroczeniu limitu czasu żądania. Uporczywe błędy sieci/pobierania zwykle wskazują na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Uruchamianie zgłasza nieautoryzowany token">

    - `getMe returned 401` to błąd uwierzytelniania Telegram dla skonfigurowanego tokenu bota.
    - Skopiuj ponownie lub wygeneruj od nowa token bota w BotFather, a następnie zaktualizuj `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` lub `TELEGRAM_BOT_TOKEN` dla konta domyślnego.
    - `deleteWebhook 401 Unauthorized` podczas uruchamiania również jest błędem uwierzytelniania; traktowanie tego jako „brak istniejącego webhooka” tylko odłożyłoby tę samą awarię złego tokenu do późniejszych wywołań API.

  </Accordion>

  <Accordion title="Niestabilność odpytywania lub sieci">

    - Node 22+ i niestandardowe fetch/proxy mogą wywołać natychmiastowe przerwanie, jeśli typy AbortSignal się nie zgadzają.
    - Niektóre hosty najpierw rozwiązuje `api.telegram.org` do IPv6; zepsuty wychodzący IPv6 może powodować okresowe awarie API Telegram.
    - Jeśli logi zawierają `TypeError: fetch failed` lub `Network request for 'getUpdates' failed!`, OpenClaw ponawia je teraz jako możliwe do odzyskania błędy sieciowe.
    - Podczas uruchamiania odpytywania OpenClaw ponownie używa udanej startowej sondy `getMe` dla grammY, aby runner nie potrzebował drugiego `getMe` przed pierwszym `getUpdates`.
    - Jeśli `deleteWebhook` kończy się przejściowym błędem sieci podczas uruchamiania odpytywania, OpenClaw przechodzi do długiego odpytywania zamiast wykonywać kolejne przedodpytywaniowe wywołanie płaszczyzny sterowania. Nadal aktywny Webhook ujawnia się jako konflikt `getUpdates`; OpenClaw następnie przebudowuje transport Telegram i ponawia czyszczenie webhooka.
    - Jeśli gniazda Telegram odświeżają się w krótkim stałym rytmie, sprawdź niską wartość `channels.telegram.timeoutSeconds`; klienci botów ograniczają skonfigurowane wartości poniżej zabezpieczeń żądań wychodzących i `getUpdates`, ale starsze wydania mogły przerywać każde odpytywanie lub odpowiedź, gdy ustawiono tę wartość poniżej tych zabezpieczeń.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw domyślnie restartuje odpytywanie i przebudowuje transport Telegram po 120 sekundach bez ukończonej żywotności długiego odpytywania.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy uruchomione konto odpytywania nie ukończyło `getUpdates` po okresie karencji startu, gdy uruchomione konto webhooka nie ukończyło `setWebhook` po okresie karencji startu, albo gdy ostatnia udana aktywność transportu odpytywania jest nieaktualna.
    - Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zastoju odpytywania. Uporczywe zastoje zwykle wskazują na problemy z proxy, DNS, IPv6 lub wychodzącym TLS między hostem a `api.telegram.org`.
    - Telegram honoruje też zmienne środowiskowe proxy procesu dla transportu Bot API, w tym `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i ich warianty małymi literami. `NO_PROXY` / `no_proxy` nadal może omijać `api.telegram.org`.
    - Jeśli zarządzany proxy OpenClaw jest skonfigurowany przez `OPENCLAW_PROXY_URL` dla środowiska usługi i nie ma standardowej zmiennej środowiskowej proxy, Telegram również używa tego URL-a dla transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim wyjściem/TLS kieruj wywołania API Telegram przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2). Kolejność wyników DNS Telegram honoruje najpierw `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, potem `channels.telegram.network.dnsResultOrder`, a następnie domyślne ustawienie procesu, takie jak `NODE_OPTIONS=--dns-result-order=ipv4first`; jeśli żadne nie ma zastosowania, Node 22+ wraca do `ipv4first`.
    - Jeśli Twój host to WSL2 albo jawnie działa lepiej z zachowaniem tylko IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu testów porównawczych RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
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

    - To samo ustawienie opcjonalne jest dostępne dla konta pod adresem
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli Twój proxy rozwiązuje hosty multimediów Telegram do `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie dopuszczają
      zakres testów porównawczych RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia SSRF
      multimediów Telegram. Używaj tego tylko w zaufanych środowiskach proxy kontrolowanych przez operatora,
      takich jak trasowanie fake-IP Clash, Mihomo lub Surge, gdy syntetyzują
      prywatne lub specjalnego użycia odpowiedzi spoza zakresu testów porównawczych
      RFC 2544. Pozostaw wyłączone dla normalnego publicznego dostępu Telegram przez internet.
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

<Accordion title="High-signal Telegram fields">

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; dowiązania symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- domyślne tematy: `groups.<chatId>.topics."*"` stosuje się do niedopasowanych tematów forum; dokładne identyfikatory tematów mają nad nim pierwszeństwo
- zatwierdzenia wykonania: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- strumieniowanie: `streaming` (wersja podglądowa), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- niestandardowy katalog główny API: `apiRoot` (tylko katalog główny Bot API; nie dołączaj `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
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
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Telegram z Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pl/channels/groups">
    Zachowanie listy dozwolonych grup i tematów.
  </Card>
  <Card title="Channel routing" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Security" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj grupy i tematy na agentów.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa.
  </Card>
</CardGroup>
