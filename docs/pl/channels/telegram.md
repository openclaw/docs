---
read_when:
    - Praca nad funkcjami Telegram lub webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:47:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

Gotowe do produkcji dla wiadomości prywatnych botów i grup przez grammY. Tryb domyślny to long polling; tryb webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Domyślna polityka wiadomości prywatnych dla Telegram to parowanie.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i scenariusze naprawcze.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce i przykłady konfiguracji kanałów.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Create the bot token in BotFather">
    Otwórz Telegram i porozmawiaj z **@BotFather** (upewnij się, że nazwa użytkownika to dokładnie `@BotFather`).

    Uruchom `/newbot`, wykonaj instrukcje i zapisz token.

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
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w konfiguracji/zmiennych środowiskowych, a następnie uruchom Gateway.

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
    Dodaj bota do swojej grupy, a następnie pobierz oba identyfikatory wymagane do dostępu do grupy:

    - Twój identyfikator użytkownika Telegram, używany w `allowFrom` / `groupAllowFrom`
    - identyfikator czatu grupowego Telegram, używany jako klucz w `channels.telegram.groups`

    Przy pierwszej konfiguracji pobierz identyfikator czatu grupowego z `openclaw logs --follow`, bota przekazującego identyfikatory albo metody Bot API `getUpdates`. Po zezwoleniu grupie `/whoami@<bot_username>` może potwierdzić identyfikatory użytkownika i grupy.

    Ujemne identyfikatory supergrup Telegram zaczynające się od `-100` są identyfikatorami czatów grupowych. Umieszczaj je w `channels.telegram.groups`, a nie w `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Kolejność rozpoznawania tokenów uwzględnia konta. W praktyce wartości z konfiguracji mają pierwszeństwo przed awaryjnymi zmiennymi środowiskowymi, a `TELEGRAM_BOT_TOKEN` ma zastosowanie tylko do konta domyślnego.
Po pomyślnym uruchomieniu OpenClaw buforuje tożsamość bota w katalogu stanu przez maksymalnie 24 godziny, aby ponowne uruchomienia mogły uniknąć dodatkowego wywołania Telegram `getMe`; zmiana lub usunięcie tokena czyści ten cache.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Boty Telegram domyślnie używają **trybu prywatności**, który ogranicza wiadomości grupowe, jakie otrzymują.

    Jeśli bot musi widzieć wszystkie wiadomości grupowe:

    - wyłącz tryb prywatności przez `/setprivacy` albo
    - ustaw bota jako administratora grupy.

    Przy przełączaniu trybu prywatności usuń i ponownie dodaj bota w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Group permissions">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty-administratorzy otrzymują wszystkie wiadomości grupowe, co jest przydatne przy zawsze aktywnym zachowaniu w grupie.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups`, aby zezwolić na dodawanie do grup lub je zablokować
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

### Tożsamość bota w grupie

W grupach Telegram i tematach forum jawna wzmianka skonfigurowanej nazwy użytkownika bota (na przykład `@my_bot`) jest traktowana jako zwrócenie się do wybranego agenta OpenClaw, nawet gdy nazwa persony agenta różni się od nazwy użytkownika Telegram. Polityka ciszy w grupie nadal ma zastosowanie do niezwiązanego ruchu grupowego, ale sama nazwa użytkownika bota nie jest uznawana za „kogoś innego”.

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` kontroluje dostęp przez wiadomości prywatne:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` pozwala dowolnemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, wydawać botowi polecenia. Używaj tego tylko dla celowo publicznych botów z mocno ograniczonymi narzędziami; boty z jednym właścicielem powinny używać `allowlist` z numerycznymi identyfikatorami użytkowników.

    `channels.telegram.allowFrom` przyjmuje numeryczne identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach z wieloma kontami restrykcyjne `channels.telegram.allowFrom` na najwyższym poziomie jest traktowane jako granica bezpieczeństwa: wpisy `allowFrom: ["*"]` na poziomie konta nie czynią tego konta publicznym, chyba że efektywna allowlista konta po scaleniu nadal zawiera jawny wildcard.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie wiadomości prywatne i jest odrzucane przez walidację konfiguracji.
    Konfiguracja prosi wyłącznie o numeryczne identyfikatory użytkowników.
    Jeśli po aktualizacji Twoja konfiguracja zawiera wpisy allowlisty `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (najlepszy możliwy wynik; wymaga tokena bota Telegram).
    Jeśli wcześniej polegałeś na plikach allowlisty magazynu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach allowlisty (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    Dla botów z jednym właścicielem preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi identyfikatorami `allowFrom`, aby polityka dostępu była trwała w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnych nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp do wiadomości prywatnych. Jeśli właściciel poleceń jeszcze nie istnieje, pierwsze zatwierdzone parowanie ustawia również `commands.ownerAllowFrom`, aby polecenia tylko dla właściciela i zatwierdzenia exec miały jawne konto operatora.
    Autoryzacja nadawcy w grupie nadal pochodzi z jawnych allowlist w konfiguracji.
    Jeśli chcesz „raz jestem autoryzowany i działają zarówno wiadomości prywatne, jak i polecenia grupowe”, umieść swój numeryczny identyfikator użytkownika Telegram w `channels.telegram.allowFrom`; dla poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

    ### Znajdowanie identyfikatora użytkownika Telegram

    Bezpieczniej (bez bota zewnętrznego):

    1. Wyślij wiadomość prywatną do swojego bota.
    2. Uruchom `openclaw logs --follow`.
    3. Odczytaj `from.id`.

    Oficjalna metoda Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metoda zewnętrzna (mniej prywatna): `@userinfobot` albo `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    Dwie kontrolki działają razem:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - z `groupPolicy: "open"`: dowolna grupa może przejść kontrole identyfikatora grupy
         - z `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (albo `"*"`)
       - skonfigurowane `groups`: działa jako allowlista (jawne identyfikatory albo `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców w grupach. Jeśli nie jest ustawione, Telegram wraca do `allowFrom`.
    Wpisy `groupAllowFrom` powinny być numerycznymi identyfikatorami użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatów grupowych ani supergrup Telegram w `groupAllowFrom`. Ujemne identyfikatory czatów należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawcy w grupie **nie** dziedziczy zatwierdzeń z magazynu parowania wiadomości prywatnych.
    Parowanie pozostaje tylko dla wiadomości prywatnych. Dla grup ustaw `groupAllowFrom` albo `allowFrom` na poziomie grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram wraca do konfiguracyjnego `allowFrom`, a nie do magazynu parowania.
    Praktyczny wzorzec dla botów z jednym właścicielem: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól grupom docelowym w `channels.telegram.groups`.
    Uwaga dotycząca runtime: jeśli `channels.telegram` całkowicie nie istnieje, runtime domyślnie zamyka dostęp (`groupPolicy="allowlist"`), chyba że `channels.defaults.groupPolicy` jest jawnie ustawione.

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
      Częsty błąd: `groupAllowFrom` nie jest allowlistą grup Telegram.

      - Umieszczaj ujemne identyfikatory grup lub supergrup Telegram, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieszczaj identyfikatory użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą wyzwalać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Odpowiedzi w grupie domyślnie wymagają wzmianki.

    Wzmianka może pochodzić z:

    - natywnej wzmianki `@botusername` albo
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
    okno historii grup Telegram. Wycofany klucz `includeGroupHistoryContext`
    jest usuwany przez `openclaw doctor --fix`.

    Pobieranie identyfikatora czatu grupowego:

    - przekaż wiadomość grupową do `@userinfobot` / `@getidsbot`
    - albo odczytaj `chat.id` z `openclaw logs --follow`
    - albo sprawdź Bot API `getUpdates`
    - po zezwoleniu grupie uruchom `/whoami@<bot_username>`, jeśli natywne polecenia są włączone

  </Tab>
</Tabs>

## Zachowanie runtime

- Telegram jest własnością procesu gateway.
- Routing jest deterministyczny: odpowiedzi przychodzące z Telegram wracają do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi, placeholderami mediów oraz utrwalonym kontekstem łańcucha odpowiedzi dla odpowiedzi Telegram zaobserwowanych przez gateway.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dodają `:topic:<threadId>`, aby utrzymać izolację tematów.
- Wiadomości DM mogą przenosić `message_thread_id`; OpenClaw zachowuje je na potrzeby odpowiedzi. Sesje tematów DM rozdzielają się tylko wtedy, gdy Telegram `getMe` zgłasza `has_topics_enabled: true` dla bota; w przeciwnym razie DM pozostają w płaskiej sesji.
- Long polling używa grammY runner z sekwencjonowaniem per chat/per thread. Ogólna współbieżność ujścia runner używa `agents.defaults.maxConcurrent`.
- Uruchamianie wielu kont ogranicza współbieżne sondy Telegram `getMe`, aby duże floty botów nie uruchamiały sond wszystkich kont jednocześnie.
- Long polling jest chroniony wewnątrz każdego procesu gateway, więc tylko jeden aktywny poller może używać tokenu bota naraz. Jeśli nadal widzisz konflikty `getUpdates` 409, prawdopodobnie inny gateway OpenClaw, skrypt albo zewnętrzny poller używa tego samego tokenu.
- Restarty watchdog long-polling uruchamiają się domyślnie po 120 sekundach bez zakończonej liveness `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy Twoje wdrożenie nadal widzi fałszywe restarty polling-stall podczas długotrwałej pracy. Wartość jest podawana w milisekundach i może wynosić od `30000` do `600000`; obsługiwane są nadpisania per account.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

<Note>
  `channels.telegram.dm.threadReplies` i `channels.telegram.direct.<chatId>.threadReplies` zostały usunięte. Uruchom `openclaw doctor --fix` po aktualizacji, jeśli Twoja konfiguracja nadal ma te klucze. Routing tematów DM podąża teraz za możliwościami bota z Telegram `getMe.has_topics_enabled`, kontrolowanymi przez tryb wątków BotFather: boty z włączonymi tematami używają sesji DM o zakresie wątku, gdy Telegram wysyła `message_thread_id`; pozostałe DM pozostają w płaskiej sesji.
</Note>

## Informacje o funkcjach

<AccordionGroup>
  <Accordion title="Podgląd transmisji na żywo (edycje wiadomości)">
    OpenClaw może transmitować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` to `off | partial | block | progress` (domyślnie: `partial`)
    - krótkie początkowe podglądy odpowiedzi są debounce'owane, a następnie materializowane po ograniczonym opóźnieniu, jeśli uruchomienie nadal jest aktywne
    - `progress` utrzymuje jeden edytowalny szkic statusu dla postępu narzędzi, pokazuje stabilną etykietę statusu, gdy aktywność odpowiedzi pojawia się przed postępem narzędzi, czyści go po zakończeniu i wysyła końcową odpowiedź jako zwykłą wiadomość
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzi/postępu ponownie używają tej samej edytowanej wiadomości podglądu (domyślnie: `true`, gdy transmisja podglądu jest aktywna)
    - `streaming.preview.commandText` kontroluje szczegóły command/exec w tych wierszach postępu narzędzi: `raw` (domyślnie, zachowuje wydane zachowanie) albo `status` (tylko etykieta narzędzia)
    - `streaming.progress.commentary` (domyślnie: `false`) włącza tekst komentarza/preambuły asystenta w tymczasowym szkicu postępu
    - wykrywane są starsze `channels.telegram.streamMode`, boolowskie wartości `streaming` oraz wycofane natywne klucze podglądu szkicu; uruchom `openclaw doctor --fix`, aby zmigrować je do bieżącej konfiguracji transmisji

    Aktualizacje podglądu postępu narzędzi to krótkie wiersze statusu wyświetlane podczas działania narzędzi, na przykład wykonanie polecenia, odczyty plików, aktualizacje planowania, podsumowania patchy albo tekst preambuły/komentarza Codex w trybie app-server Codex. Telegram domyślnie pozostawia je włączone, aby odpowiadały wydanemu zachowaniu OpenClaw od `v2026.4.22` i później.

    Aby zachować edytowany podgląd tekstu odpowiedzi, ale ukryć wiersze postępu narzędzi, ustaw:

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

    Aby pozostawić widoczny postęp narzędzi, ale ukryć tekst command/exec, ustaw:

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

    Użyj trybu `progress`, gdy chcesz widzieć postęp narzędzi bez edytowania końcowej odpowiedzi w tej samej wiadomości. Umieść politykę tekstu polecenia pod `streaming.progress`:

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

    Używaj `streaming.mode: "off"` tylko wtedy, gdy chcesz dostarczanie wyłącznie końcowe: edycje podglądu Telegram są wyłączone, a ogólny szum narzędzi/postępu jest tłumiony zamiast wysyłania jako samodzielne wiadomości statusu. Monity zatwierdzenia, payloady mediów i błędy nadal przechodzą przez normalne dostarczanie końcowe. Użyj `streaming.preview.toolProgress: false`, gdy chcesz zachować tylko edycje podglądu odpowiedzi, ukrywając wiersze statusu postępu narzędzi.

    <Note>
      Wybrane odpowiedzi cytowane Telegram są wyjątkiem. Gdy `replyToMode` ma wartość `"first"`, `"all"` albo `"batched"`, a wiadomość przychodząca zawiera wybrany tekst cytatu, OpenClaw wysyła końcową odpowiedź przez natywną ścieżkę cytowanej odpowiedzi Telegram zamiast edytować podgląd odpowiedzi, więc `streaming.preview.toolProgress` nie może pokazać krótkich wierszy statusu dla tego przebiegu. Odpowiedzi na bieżącą wiadomość bez wybranego tekstu cytatu nadal zachowują transmisję podglądu. Ustaw `replyToMode: "off"`, gdy widoczność postępu narzędzi ma większe znaczenie niż natywne odpowiedzi cytowane, albo ustaw `streaming.preview.toolProgress: false`, aby zaakceptować ten kompromis.
    </Note>

    Dla odpowiedzi tylko tekstowych:

    - krótkie podglądy DM/grupy/tematu: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu
    - długie końcowe teksty dzielone na wiele wiadomości Telegram ponownie używają istniejącego podglądu jako pierwszego końcowego fragmentu, gdy to możliwe, a następnie wysyłają tylko pozostałe fragmenty
    - odpowiedzi końcowe w trybie progress czyszczą szkic statusu i używają normalnego dostarczania końcowego zamiast edytować szkic w odpowiedź
    - jeśli końcowa edycja nie powiedzie się przed potwierdzeniem ukończonego tekstu, OpenClaw używa normalnego dostarczania końcowego i czyści przestarzały podgląd

    Dla złożonych odpowiedzi (na przykład payloadów mediów) OpenClaw wraca do normalnego dostarczania końcowego, a następnie czyści wiadomość podglądu.

    Transmisja podglądu jest oddzielna od transmisji blokowej. Gdy transmisja blokowa jest jawnie włączona dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnej transmisji.

    Zachowanie strumienia rozumowania:

    - `/reasoning stream` używa ścieżki podglądu rozumowania obsługiwanego kanału; w Telegram transmituje rozumowanie do podglądu na żywo podczas generowania
    - podgląd rozumowania jest usuwany po dostarczeniu końcowym; użyj `/reasoning on`, gdy rozumowanie ma pozostać widoczne
    - końcowa odpowiedź jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie wiadomości rich">
    Tekst wychodzący domyślnie używa standardowych wiadomości Telegram HTML, aby odpowiedzi pozostały czytelne w bieżących klientach Telegram. Ten tryb zgodności obsługuje zwykłe pogrubienie, kursywę, linki, kod, spoilery i cytaty, ale nie bloki dostępne tylko w rich Bot API 10.1, takie jak natywne tabele, szczegóły, rich media i formuły.

    Ustaw `channels.telegram.richMessages: true`, aby włączyć wiadomości rich Bot API 10.1:

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

    - Agent otrzymuje informację, że wiadomości rich Telegram są dostępne dla tego bota/konta.
    - Tekst Markdown jest renderowany przez Markdown IR OpenClaw i wysyłany jako Telegram rich HTML.
    - Jawne payloady rich HTML zachowują obsługiwane tagi Bot API 10.1, takie jak nagłówki, tabele, szczegóły, rich media i formuły.
    - Podpisy mediów nadal używają podpisów Telegram HTML, ponieważ wiadomości rich nie zastępują podpisów.

    Dzięki temu tekst modelu pozostaje z dala od znaczników Telegram Rich Markdown, więc waluty takie jak `$400-600K` nie są parsowane jako matematyka. Długi tekst rich jest automatycznie dzielony zgodnie z limitami tekstu rich i bloków rich Telegram. Tabele przekraczające limit kolumn Telegram są wysyłane jako bloki kodu.

    Domyślnie: wyłączone dla zgodności z klientami. Wiadomości rich wymagają zgodnych klientów Telegram; niektóre bieżące klienty Desktop, Web, Android i klienci zewnętrzni wyświetlają zaakceptowane wiadomości rich jako nieobsługiwane. Pozostaw tę opcję wyłączoną, chyba że każdy klient używany z botem potrafi je renderować. `/status` pokazuje, czy bieżąca sesja Telegram ma wiadomości rich włączone czy wyłączone.

    Podglądy linków są domyślnie włączone. `channels.telegram.linkPreview: false` pomija automatyczne wykrywanie encji dla tekstu rich.

  </Accordion>

  <Accordion title="Natywne polecenia i polecenia niestandardowe">
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
    - polecenia Plugin/skill nadal mogą działać po wpisaniu, nawet jeśli nie są pokazane w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane są usuwane. Polecenia niestandardowe/Plugin nadal mogą się rejestrować, jeśli skonfigurowano.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przepełniło się po przycięciu; zmniejsz liczbę poleceń Plugin/skill/niestandardowych albo wyłącz `channels.telegram.commands.native`.
    - niepowodzenie `deleteWebhook`, `deleteMyCommands` albo `setMyCommands` z `404: Not Found`, gdy bezpośrednie polecenia curl Bot API działają, może oznaczać, że `channels.telegram.apiRoot` ustawiono na pełny endpoint `/bot<TOKEN>`. `apiRoot` musi być tylko rootem Bot API, a `openclaw doctor --fix` usuwa przypadkowe końcowe `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Zaktualizuj `botToken`, `tokenFile` albo `TELEGRAM_BOT_TOKEN` bieżącym tokenem BotFather; OpenClaw zatrzymuje się przed pollingiem, więc nie jest to zgłaszane jako błąd czyszczenia webhook.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzący DNS/HTTPS do `api.telegram.org` jest zablokowany.

    ### Polecenia parowania urządzeń (`device-pair` plugin)

    Gdy `device-pair` plugin jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym role/zakresy)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji przenosi krótkotrwały token bootstrap. Wbudowany bootstrap kodu konfiguracji jest tylko node-only: pierwsze połączenie tworzy oczekujące żądanie node, a po zatwierdzeniu Gateway zwraca trwały token node z `scopes: []`. Nie zwraca przekazanego tokenu operatora; dostęp operatora wymaga osobnego zatwierdzonego parowania operatora albo przepływu tokenu.

    Jeśli urządzenie ponawia próbę ze zmienionymi szczegółami uwierzytelniania (na przykład role/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione, a nowe żądanie używa innego `requestId`. Uruchom ponownie `/pair pending` przed zatwierdzeniem.

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

    Kliknięcia callback, których nie przejmie zarejestrowany interaktywny
    handler Plugin, są przekazywane agentowi jako tekst:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Akcje wiadomości Telegram dla agentów i automatyzacji">
    Akcje narzędzia Telegram obejmują:

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
    Wysyłki runtime używają aktywnej migawki konfiguracji/sekretów (uruchomienie/przeładowanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdej wysyłce.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątkowania odpowiedzi">
    Telegram obsługuje jawne tagi wątkowania odpowiedzi w wygenerowanych danych wyjściowych:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na konkretny identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` kontroluje obsługę:

    - `off` (domyślnie)
    - `first`
    - `all`

    Gdy wątkowanie odpowiedzi jest włączone i oryginalny tekst lub podpis Telegram jest dostępny, OpenClaw automatycznie dołącza natywny cytowany fragment Telegram. Telegram ogranicza natywny tekst cytatu do 1024 jednostek kodu UTF-16, więc dłuższe wiadomości są cytowane od początku i wracają do zwykłej odpowiedzi, jeśli Telegram odrzuci cytat.

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` nadal są respektowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematu dołączają `:topic:<threadId>`
    - odpowiedzi i pisanie są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Specjalny przypadek tematu ogólnego (`threadId=1`):

    - wysyłki wiadomości pomijają `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje pisania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy wartości domyślnych z grupy.
    `topics."*"` ustawia wartości domyślne dla każdego tematu w tej grupie; dokładne identyfikatory tematów nadal mają pierwszeństwo przed `"*"`.

    **Routing agentów według tematu**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własny odizolowany obszar roboczy, pamięć i sesję. Przykład:

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

    **Trwałe powiązanie tematu ACP**: Tematy forum mogą przypinać sesje harness ACP przez typowane powiązania ACP najwyższego poziomu (`bindings[]` z `type: "acp"` i `match.channel: "telegram"`, `peer.kind: "group"` oraz identyfikatorem kwalifikowanym tematem, takim jak `-1001234567890:topic:42`). Obecnie zakres jest ograniczony do tematów forum w grupach/supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Powiązane z wątkiem uruchomienie ACP z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne wiadomości trafiają tam bezpośrednio. OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga, aby `channels.telegram.threadBindings.spawnSessions` pozostało włączone (domyślnie: `true`).

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` zachowują metadane odpowiedzi; używają kluczy sesji świadomych wątku tylko wtedy, gdy Telegram `getMe` zgłasza `has_topics_enabled: true` dla bota.
    Dawne nadpisania `dm.threadReplies` i `direct.*.threadReplies` zostały celowo wycofane; użyj trybu wątkowego BotFather jako jedynego źródła prawdy i uruchom `openclaw doctor --fix`, aby usunąć nieaktualne klucze konfiguracji.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie notatki głosowej
    - transkrypcje przychodzących notatek głosowych są ujmowane w kontekście agenta jako tekst wygenerowany maszynowo,
      niezaufany; wykrywanie wzmianek nadal używa surowej
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

    Opisy naklejek są buforowane w stanie Pluginu SQLite OpenClaw, aby ograniczyć powtarzane wywołania vision.

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
    Reakcje Telegram przychodzą jako aktualizacje `message_reaction` (oddzielnie od payloadów wiadomości).

    Gdy są włączone, OpenClaw kolejkowuje zdarzenia systemowe, takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkownika na wiadomości wysłane przez bota (best-effort przez cache wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrole dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy niebędące forami są kierowane do sesji czatu grupowego
      - grupy-fora są kierowane do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla pollingu/Webhooku automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje ack">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość. `ackReactionScope` decyduje, *kiedy* to emoji jest faktycznie wysyłane.

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
    Domyślny zakres (`"group-mentions"`) nie uruchamia reakcji ack w wiadomościach bezpośrednich. Aby uzyskać reakcję ack na przychodzące DM-y Telegram, ustaw `messages.ackReactionScope` na `"direct"` lub `"all"`. Wartość jest odczytywana przy starcie dostawcy Telegram, więc do zastosowania zmiany potrzebny jest restart Gateway.
    </Note>

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

  <Accordion title="Long polling kontra Webhook">
    Domyślnie używany jest long polling. Dla trybu Webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (domyślnie `/telegram-webhook`, `127.0.0.1`, `8787`).

    W trybie long-polling OpenClaw utrwala swój znacznik restartu dopiero po pomyślnym wysłaniu aktualizacji do obsługi. Jeśli handler zawiedzie, ta aktualizacja pozostaje możliwa do ponowienia w tym samym procesie i nie jest zapisywana jako ukończona na potrzeby deduplikacji po restarcie.

    Lokalny listener wiąże się z `127.0.0.1:8787`. Dla publicznego ingressu umieść reverse proxy przed lokalnym portem albo celowo ustaw `webhookHost: "0.0.0.0"`.

    Tryb Webhook sprawdza zabezpieczenia żądania, tajny token Telegram oraz ciało JSON przed zwróceniem `200` do Telegram.
    Następnie OpenClaw przetwarza aktualizację asynchronicznie przez te same ścieżki bota per czat/per temat, których używa long polling, więc wolne tury agenta nie blokują ACK dostarczenia Telegram.

  </Accordion>

  <Accordion title="Limity, ponawianie prób i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów Telegram.
    - `channels.telegram.mediaGroupFlushMs` (domyślnie 500) kontroluje, jak długo albumy/grupy multimediów Telegram są buforowane, zanim OpenClaw wyśle je jako jedną wiadomość przychodzącą. Zwiększ tę wartość, jeśli części albumu docierają późno; zmniejsz ją, aby skrócić opóźnienie odpowiedzi na album.
    - `channels.telegram.timeoutSeconds` nadpisuje limit czasu klienta API Telegram (jeśli nie ustawiono, obowiązuje domyślna wartość grammY). Klienci botów ograniczają skonfigurowane wartości poniżej 60-sekundowego zabezpieczenia żądań wychodzących tekstu/pisania, aby grammY nie przerwał dostarczania widocznej odpowiedzi, zanim uruchomią się zabezpieczenie transportu i fallback OpenClaw. Długie odpytywanie nadal używa 45-sekundowego zabezpieczenia żądania `getUpdates`, aby bezczynne odpytywania nie były porzucane bezterminowo.
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; dostrajaj w zakresie od `30000` do `600000` tylko w przypadku fałszywie dodatnich restartów z powodu zatrzymania odpytywania.
    - Historia kontekstu grupy używa `channels.telegram.historyLimit` albo `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - Dodatkowy kontekst odpowiedzi/cytatu/przekazania jest normalizowany do jednego wybranego okna kontekstu rozmowy, gdy Gateway zaobserwował wiadomości nadrzędne; pamięć podręczna zaobserwowanych wiadomości znajduje się w stanie Plugin SQLite OpenClaw, a `openclaw doctor --fix` importuje starsze sidecary. Telegram uwzględnia w aktualizacjach tylko jedno płytkie `reply_to_message`, więc łańcuchy starsze niż pamięć podręczna są ograniczone do bieżącego ładunku aktualizacji Telegram.
    - Listy dozwolonych Telegram przede wszystkim ograniczają, kto może uruchomić agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.
    - Kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfiguracja `channels.telegram.retry` ma zastosowanie do pomocników wysyłania Telegram (CLI/narzędzia/akcje) dla możliwych do odzyskania błędów wychodzącego API. Dostarczanie końcowej odpowiedzi przychodzącej również używa ograniczonego ponowienia bezpiecznego wysyłania dla awarii Telegram przed połączeniem, ale nie ponawia niejednoznacznych kopert sieciowych po wysłaniu, które mogłyby zduplikować widoczne wiadomości.

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

    Wysyłanie Telegram obsługuje też:

    - `--presentation` z blokami `buttons` dla klawiatur inline, gdy zezwala na to `channels.telegram.capabilities.inlineButtons`
    - `--pin` albo `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać w tym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy, GIF-y i filmy jako dokumenty zamiast skompresowanych zdjęć, multimediów animowanych albo przesyłanych filmów

    Bramkowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając włączone zwykłe wysyłanie

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM-ach zatwierdzających i może opcjonalnie publikować monity w czacie lub temacie źródłowym. Zatwierdzający muszą być numerycznymi identyfikatorami użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy można rozpoznać co najmniej jednego zatwierdzającego)
    - `channels.telegram.execApprovals.approvers` (używa awaryjnie numerycznych identyfikatorów właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` kontrolują, kto może rozmawiać z botem i dokąd bot wysyła zwykłe odpowiedzi. Nie czynią nikogo zatwierdzającym exec. Pierwsze zatwierdzone sparowanie DM inicjalizuje `commands.ownerAllowFrom`, gdy nie istnieje jeszcze właściciel poleceń, więc konfiguracja z jednym właścicielem nadal działa bez duplikowania identyfikatorów w `execApprovals.approvers`.

    Dostarczanie do kanału pokazuje tekst polecenia na czacie; włączaj `channel` albo `both` tylko w zaufanych grupach/tematach. Gdy monit trafia do tematu forum, OpenClaw zachowuje temat dla monitu zatwierdzenia i wiadomości uzupełniającej. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline wymagają również, aby `channels.telegram.capabilities.inlineButtons` zezwalało na docelową powierzchnię (`dm`, `group` albo `all`). Identyfikatory zatwierdzeń z prefiksem `plugin:` są rozwiązywane przez zatwierdzenia Plugin; pozostałe są najpierw rozwiązywane przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrolki odpowiedzi o błędach

Gdy agent napotka błąd dostarczania albo dostawcy, polityka błędów kontroluje, czy wiadomości o błędach są wysyłane do czatu Telegram:

| Klucz                               | Wartości                   | Domyślnie       | Opis                                                                                                                                                                                                                   |
| ----------------------------------- | -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — wysyła każdą wiadomość o błędzie do czatu. `once` — wysyła każdą unikalną wiadomość o błędzie raz na okno cooldownu (tłumi powtarzające się identyczne błędy). `silent` — nigdy nie wysyła wiadomości o błędach do czatu. |
| `channels.telegram.errorCooldownMs` | liczba (ms)                | `14400000` (4h) | Okno cooldownu dla polityki `once`. Po wysłaniu błędu ta sama wiadomość o błędzie jest tłumiona do upływu tego interwału. Zapobiega spamowi błędami podczas awarii.                                                    |

Obsługiwane są nadpisania dla konta, grupy i tematu (takie samo dziedziczenie jak dla innych kluczy konfiguracji Telegram).

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
    - `openclaw channels status --probe` może sprawdzić jawne numeryczne identyfikatory grup; symbol wieloznaczny `"*"` nie może być sprawdzony pod kątem członkostwa.
    - Szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (albo zawierać `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow`, aby zobaczyć powody pominięcia

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj swoją tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal ma zastosowanie, nawet gdy polityka grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma za dużo wpisów; zmniejsz liczbę poleceń Plugin/Skills/niestandardowych albo wyłącz natywne menu
    - Wywołania startowe `deleteMyCommands` / `setMyCommands` i wywołania pisania `sendChatAction` są ograniczone i ponawiane raz przez fallback transportu Telegram przy limicie czasu żądania. Uporczywe błędy sieci/fetch zwykle wskazują na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Uruchamianie zgłasza nieautoryzowany token">

    - `getMe returned 401` to błąd uwierzytelniania Telegram dla skonfigurowanego tokenu bota.
    - Skopiuj ponownie albo wygeneruj ponownie token bota w BotFather, a następnie zaktualizuj `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` albo `TELEGRAM_BOT_TOKEN` dla konta domyślnego.
    - `deleteWebhook 401 Unauthorized` podczas uruchamiania to również błąd uwierzytelniania; traktowanie go jako „brak Webhook” tylko odroczyłoby tę samą awarię złego tokenu do późniejszych wywołań API.

  </Accordion>

  <Accordion title="Niestabilność odpytywania albo sieci">

    - Node 22+ i niestandardowy fetch/proxy mogą wywołać natychmiastowe przerwanie, jeśli typy AbortSignal się nie zgadzają.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` na IPv6; uszkodzony ruch wychodzący IPv6 może powodować sporadyczne awarie API Telegram.
    - Jeśli logi zawierają `TypeError: fetch failed` albo `Network request for 'getUpdates' failed!`, OpenClaw ponawia je teraz jako możliwe do odzyskania błędy sieciowe.
    - Podczas startu odpytywania OpenClaw ponownie używa udanej startowej próby `getMe` dla grammY, aby runner nie potrzebował drugiego `getMe` przed pierwszym `getUpdates`.
    - Jeśli `deleteWebhook` zakończy się przejściowym błędem sieci podczas startu odpytywania, OpenClaw przechodzi dalej do długiego odpytywania zamiast wykonywać kolejne wywołanie płaszczyzny sterowania przed odpytywaniem. Nadal aktywny Webhook ujawnia się jako konflikt `getUpdates`; wtedy OpenClaw przebudowuje transport Telegram i ponawia czyszczenie Webhook.
    - Jeśli gniazda Telegram są odtwarzane w krótkim, stałym rytmie, sprawdź, czy `channels.telegram.timeoutSeconds` nie ma niskiej wartości; klienci botów ograniczają skonfigurowane wartości poniżej zabezpieczeń żądań wychodzących i `getUpdates`, ale starsze wydania mogły przerywać każde odpytywanie albo odpowiedź, gdy ustawiono tę wartość poniżej tych zabezpieczeń.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw domyślnie po 120 sekundach bez ukończonej żywotności długiego odpytywania restartuje odpytywanie i przebudowuje transport Telegram.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy działające konto odpytywania nie ukończyło `getUpdates` po okresie tolerancji startu, gdy działające konto Webhook nie ukończyło `setWebhook` po okresie tolerancji startu albo gdy ostatnia udana aktywność transportu odpytywania jest nieaktualna.
    - Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zatrzymania odpytywania. Uporczywe zatrzymania zwykle wskazują na problemy z proxy, DNS, IPv6 albo wychodzącym TLS między hostem a `api.telegram.org`.
    - Telegram respektuje również zmienne środowiskowe proxy procesu dla transportu Bot API, w tym `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i ich warianty pisane małymi literami. `NO_PROXY` / `no_proxy` nadal mogą pomijać `api.telegram.org`.
    - Jeśli zarządzane proxy OpenClaw jest skonfigurowane przez `OPENCLAW_PROXY_URL` dla środowiska usługi i nie ma standardowej zmiennej środowiskowej proxy, Telegram również używa tego URL dla transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS kieruj wywołania API Telegram przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2). Kolejność wyników DNS dla Telegram uwzględnia najpierw `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, potem `channels.telegram.network.dnsResultOrder`, a następnie domyślne ustawienie procesu, takie jak `NODE_OPTIONS=--dns-result-order=ipv4first`; jeśli żadne z nich nie ma zastosowania, Node 22+ wraca do `ipv4first`.
    - Jeśli Twój host to WSL2 albo wyraźnie działa lepiej w trybie tylko IPv4, wymuś wybór rodziny adresów:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już
      domyślnie dozwolone dla pobierania multimediów Telegram. Jeśli zaufany fake-IP lub
      przezroczysty serwer proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/specjalnego użycia adres podczas pobierania multimediów, możesz włączyć
      obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo ustawienie opcjonalne jest dostępne dla konta pod
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli Twój serwer proxy rozwiązuje hosty multimediów Telegram na `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie dopuszczają
      zakres benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia SSRF
      dla multimediów Telegram. Używaj go tylko w zaufanych, kontrolowanych przez operatora
      środowiskach proxy, takich jak routing fake-IP Clash, Mihomo lub Surge, gdy
      syntetyzują prywatne albo specjalnego użycia odpowiedzi spoza zakresu benchmarkowego
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

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji - Telegram](/pl/gateway/config-channels#telegram).

<Accordion title="Najważniejsze pola Telegram">

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; dowiązania symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- wartości domyślne tematów: `groups.<chatId>.topics."*"` stosuje się do niedopasowanych tematów forum; dokładne identyfikatory tematów mają nad tym pierwszeństwo
- zatwierdzenia exec: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- streaming: `streaming` (wersja poglądowa), `streaming.preview.toolProgress`, `blockStreaming`
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
Pierwszeństwo wielu kont: gdy skonfigurowano co najmniej dwa identyfikatory kont, ustaw `channels.telegram.defaultAccount` (albo dołącz `channels.telegram.accounts.default`), aby jawnie określić domyślne trasowanie. W przeciwnym razie OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` wyświetla ostrzeżenie. Nazwane konta dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
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
    Mapuj grupy i tematy na agentów.
  </Card>
  <Card title="Rozwiązywanie problemów" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa.
  </Card>
</CardGroup>
