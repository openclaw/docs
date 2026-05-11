---
read_when:
    - Praca nad funkcjami Telegrama lub webhookami
summary: Stan obsługi botów Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:21:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

Gotowe do produkcji dla wiadomości DM bota i grup przez grammY. Domyślnym trybem jest długie odpytywanie; tryb webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślne zasady DM dla Telegram to parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i scenariusze naprawcze.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce i przykłady konfiguracji kanałów.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Utwórz token bota w BotFather">
    Otwórz Telegram i porozmawiaj z **@BotFather** (upewnij się, że identyfikator to dokładnie `@BotFather`).

    Uruchom `/newbot`, postępuj zgodnie z monitami i zapisz token.

  </Step>

  <Step title="Skonfiguruj token i zasady DM">

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

    Awaryjna wartość env: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w konfiguracji/env, a następnie uruchom gateway.

  </Step>

  <Step title="Uruchom gateway i zatwierdź pierwszą wiadomość DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kody parowania wygasają po 1 godzinie.

  </Step>

  <Step title="Dodaj bota do grupy">
    Dodaj bota do swojej grupy, a następnie uzyskaj oba identyfikatory potrzebne do dostępu do grupy:

    - Twój identyfikator użytkownika Telegram, używany w `allowFrom` / `groupAllowFrom`
    - identyfikator czatu grupy Telegram, używany jako klucz w `channels.telegram.groups`

    Przy pierwszej konfiguracji uzyskaj identyfikator czatu grupy z `openclaw logs --follow`, bota do przekazywanych identyfikatorów albo Bot API `getUpdates`. Po dopuszczeniu grupy `/whoami@<bot_username>` może potwierdzić identyfikatory użytkownika i grupy.

    Ujemne identyfikatory supergrup Telegram zaczynające się od `-100` są identyfikatorami czatów grupowych. Umieść je w `channels.telegram.groups`, a nie w `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Kolejność rozpoznawania tokenów uwzględnia konta. W praktyce wartości z konfiguracji mają pierwszeństwo przed awaryjną wartością env, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność grup">
    Boty Telegram domyślnie używają **Privacy Mode**, który ogranicza wiadomości grupowe, jakie otrzymują.

    Jeśli bot musi widzieć wszystkie wiadomości grupowe, wykonaj jedną z tych czynności:

    - wyłącz tryb prywatności przez `/setprivacy`, albo
    - ustaw bota jako administratora grupy.

    Po przełączeniu trybu prywatności usuń i ponownie dodaj bota w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty administracyjne otrzymują wszystkie wiadomości grupowe, co jest przydatne w przypadku stale aktywnego działania w grupie.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić na dodawanie do grup lub go odmówić
    - `/setprivacy` dla zachowania widoczności w grupie

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Zasady DM">
    `channels.telegram.dmPolicy` kontroluje dostęp przez wiadomości bezpośrednie:

    - `pairing` (domyślne)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` pozwala dowolnemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, wydawać botowi polecenia. Używaj tego tylko dla celowo publicznych botów z mocno ograniczonymi narzędziami; boty jednego właściciela powinny używać `allowlist` z numerycznymi identyfikatorami użytkowników.

    `channels.telegram.allowFrom` przyjmuje numeryczne identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach wielokontowych restrykcyjne `channels.telegram.allowFrom` najwyższego poziomu jest traktowane jako granica bezpieczeństwa: wpisy `allowFrom: ["*"]` na poziomie konta nie upubliczniają tego konta, chyba że efektywna lista dozwolonych kont nadal zawiera jawny symbol wieloznaczny po scaleniu.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie wiadomości DM i jest odrzucane przez walidację konfiguracji.
    Konfiguracja prosi tylko o numeryczne identyfikatory użytkowników.
    Jeśli po aktualizacji Twoja konfiguracja zawiera wpisy `@username` na liście dozwolonych, uruchom `openclaw doctor --fix`, aby je rozwiązać (najlepszym możliwym sposobem; wymaga tokena bota Telegram).
    Jeśli wcześniej polegałeś na plikach listy dozwolonych ze sklepu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach listy dozwolonych (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    W przypadku botów jednego właściciela preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi identyfikatorami `allowFrom`, aby polityka dostępu była trwała w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania DM nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp DM. Jeśli właściciel poleceń jeszcze nie istnieje, pierwsze zatwierdzone parowanie ustawia również `commands.ownerAllowFrom`, aby polecenia tylko dla właściciela i zatwierdzenia exec miały jawne konto operatora.
    Autoryzacja nadawcy w grupie nadal pochodzi z jawnych list dozwolonych w konfiguracji.
    Jeśli chcesz, aby „autoryzuję się raz i działają zarówno wiadomości DM, jak i polecenia grupowe”, umieść swój numeryczny identyfikator użytkownika Telegram w `channels.telegram.allowFrom`; dla poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

    ### Znajdowanie identyfikatora użytkownika Telegram

    Bezpieczniej (bez bota zewnętrznego):

    1. Wyślij wiadomość DM do swojego bota.
    2. Uruchom `openclaw logs --follow`.
    3. Odczytaj `from.id`.

    Oficjalna metoda Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metoda zewnętrzna (mniej prywatna): `@userinfobot` lub `@getidsbot`.

  </Tab>

  <Tab title="Zasady grup i listy dozwolonych">
    Dwie kontrolki działają łącznie:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - z `groupPolicy: "open"`: dowolna grupa może przejść sprawdzanie identyfikatora grupy
         - z `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako lista dozwolonych (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców w grupach. Jeśli nie jest ustawione, Telegram używa awaryjnie `allowFrom`.
    Wpisy `groupAllowFrom` powinny być numerycznymi identyfikatorami użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatów grup ani supergrup Telegram w `groupAllowFrom`. Ujemne identyfikatory czatów należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawcy w grupie **nie** dziedziczy zatwierdzeń ze sklepu parowania DM.
    Parowanie pozostaje tylko dla DM. Dla grup ustaw `groupAllowFrom` albo `allowFrom` na poziomie grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram używa awaryjnie konfiguracji `allowFrom`, a nie sklepu parowania.
    Praktyczny wzorzec dla botów jednego właściciela: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i dopuść docelowe grupy w `channels.telegram.groups`.
    Uwaga dotycząca czasu działania: jeśli `channels.telegram` całkowicie brakuje, runtime domyślnie zamyka dostęp przez `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest jawnie ustawione.

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

    Przykład: zezwól dowolnemu członkowi w jednej określonej grupie:

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

    Przykład: zezwól tylko określonym użytkownikom w jednej określonej grupie:

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

      - Umieść ujemne identyfikatory czatów grup lub supergrup Telegram, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieść identyfikatory użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą wyzwalać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby każdy członek dozwolonej grupy mógł rozmawiać z botem.

    </Warning>

  </Tab>

  <Tab title="Zachowanie wzmianek">
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

    Uzyskiwanie identyfikatora czatu grupy:

    - przekaż wiadomość grupową do `@userinfobot` / `@getidsbot`
    - albo odczytaj `chat.id` z `openclaw logs --follow`
    - albo sprawdź Bot API `getUpdates`
    - po dopuszczeniu grupy uruchom `/whoami@<bot_username>`, jeśli natywne polecenia są włączone

  </Tab>
</Tabs>

## Zachowanie w runtime

- Telegram jest obsługiwany przez proces Gateway.
- Routing jest deterministyczny: przychodzące wiadomości Telegram otrzymują odpowiedź przez Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi, placeholderami mediów i utrwalonym kontekstem łańcucha odpowiedzi dla odpowiedzi Telegram zaobserwowanych przez Gateway.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dodają `:topic:<threadId>`, aby zachować izolację tematów.
- Wiadomości DM mogą zawierać `message_thread_id`; OpenClaw zachowuje identyfikator wątku dla odpowiedzi, ale domyślnie utrzymuje wiadomości DM w płaskiej sesji. Skonfiguruj `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` albo pasującą konfigurację tematu, gdy celowo chcesz izolacji sesji tematu DM.
- Długie odpytywanie używa runnera grammY z sekwencjonowaniem per czat/per wątek. Ogólna współbieżność ujścia runnera używa `agents.defaults.maxConcurrent`.
- Długie odpytywanie jest chronione wewnątrz każdego procesu Gateway, aby tylko jeden aktywny poller mógł używać tokena bota naraz. Jeśli nadal widzisz konflikty `getUpdates` 409, prawdopodobnie inny Gateway OpenClaw, skrypt lub zewnętrzny poller używa tego samego tokena.
- Restart watchdog dla długiego odpytywania domyślnie uruchamia się po 120 sekundach bez ukończonej żywotności `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy Twoje wdrożenie nadal obserwuje fałszywe restarty z powodu zastoju odpytywania podczas długotrwałej pracy. Wartość jest podawana w milisekundach i może wynosić od `30000` do `600000`; obsługiwane są nadpisania per konto.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Opis funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumienia na żywo (edycje wiadomości)">
    OpenClaw może przesyłać częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` to `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` utrzymuje jedną edytowalną wersję roboczą statusu dla postępu narzędzi, czyści ją po zakończeniu i wysyła końcową odpowiedź jako zwykłą wiadomość
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzi/postępu ponownie używają tej samej edytowanej wiadomości podglądu (domyślnie: `true`, gdy aktywne jest strumieniowanie podglądu)
    - `streaming.preview.commandText` kontroluje szczegóły poleceń/exec w tych wierszach postępu narzędzi: `raw` (domyślnie, zachowuje wydane zachowanie) albo `status` (tylko etykieta narzędzia)
    - starsze wartości `channels.telegram.streamMode` oraz logiczne `streaming` są wykrywane; uruchom `openclaw doctor --fix`, aby zmigrować je do `channels.telegram.streaming.mode`

    Aktualizacje podglądu postępu narzędzi to krótkie wiersze statusu pokazywane podczas działania narzędzi, na przykład wykonywania poleceń, odczytu plików, aktualizacji planowania albo podsumowań poprawek. Telegram domyślnie utrzymuje je włączone, aby odpowiadać wydanemu zachowaniu OpenClaw od `v2026.4.22` i nowszych. Aby zachować edytowany podgląd tekstu odpowiedzi, ale ukryć wiersze postępu narzędzi, ustaw:

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

    Aby postęp narzędzi pozostał widoczny, ale tekst poleceń/exec był ukryty, ustaw:

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

    Użyj trybu `progress`, gdy chcesz widzieć postęp narzędzi bez edytowania końcowej odpowiedzi w tej samej wiadomości. Umieść politykę tekstu poleceń pod `streaming.progress`:

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

    Używaj `streaming.mode: "off"` tylko wtedy, gdy chcesz dostarczania wyłącznie końcowego: edycje podglądu Telegram są wyłączone, a ogólny szum narzędzi/postępu jest wyciszany zamiast wysyłania go jako samodzielnych wiadomości statusu. Monity zatwierdzeń, ładunki multimedialne i błędy nadal przechodzą przez normalne dostarczanie końcowe. Użyj `streaming.preview.toolProgress: false`, gdy chcesz tylko zachować edycje podglądu odpowiedzi, ukrywając wiersze statusu postępu narzędzi.

    <Note>
      Odpowiedzi Telegram na zaznaczone cytaty są wyjątkiem. Gdy `replyToMode` ma wartość `"first"`, `"all"` albo `"batched"`, a wiadomość przychodząca zawiera zaznaczony tekst cytatu, OpenClaw wysyła końcową odpowiedź przez natywną ścieżkę odpowiedzi z cytatem Telegram zamiast edytować podgląd odpowiedzi, więc `streaming.preview.toolProgress` nie może pokazać krótkich wierszy statusu dla tej tury. Odpowiedzi na bieżącą wiadomość bez zaznaczonego tekstu cytatu nadal zachowują strumieniowanie podglądu. Ustaw `replyToMode: "off"`, gdy widoczność postępu narzędzi jest ważniejsza niż natywne odpowiedzi z cytatem, albo ustaw `streaming.preview.toolProgress: false`, aby zaakceptować ten kompromis.
    </Note>

    Dla odpowiedzi wyłącznie tekstowych:

    - krótkie podglądy DM/grupy/tematu: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu
    - długie końcowe odpowiedzi tekstowe dzielone na wiele wiadomości Telegram ponownie używają istniejącego podglądu jako pierwszego końcowego fragmentu, gdy to możliwe, a następnie wysyłają tylko pozostałe fragmenty
    - końcowe odpowiedzi w trybie postępu czyszczą wersję roboczą statusu i używają normalnego dostarczania końcowego zamiast edytować wersję roboczą w odpowiedź
    - jeśli końcowa edycja nie powiedzie się przed potwierdzeniem ukończonego tekstu, OpenClaw używa normalnego dostarczania końcowego i czyści nieaktualny podgląd

    Dla złożonych odpowiedzi (na przykład ładunków multimedialnych) OpenClaw wraca do normalnego dostarczania końcowego, a następnie czyści wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielne od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - podgląd rozumowania jest usuwany po dostarczeniu końcowym; użyj `/reasoning on`, gdy rozumowanie ma pozostać widoczne
    - końcowa odpowiedź jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i awaryjny HTML">
    Tekst wychodzący używa Telegram `parse_mode: "HTML"`.

    - Tekst podobny do Markdown jest renderowany do HTML bezpiecznego dla Telegram.
    - Surowy HTML modelu jest escapowany, aby ograniczyć błędy parsowania Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponawia próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć za pomocą `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Natywne polecenia i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana przy uruchamianiu za pomocą `setMyCommands`.

    Domyślne ustawienia poleceń natywnych:

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
    - polecenia pluginów/Skills nadal mogą działać po wpisaniu, nawet jeśli nie są widoczne w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/pluginów nadal mogą się rejestrować, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przepełniło się po przycięciu; zmniejsz liczbę poleceń pluginów/Skills/niestandardowych albo wyłącz `channels.telegram.commands.native`.
    - Niepowodzenie `deleteWebhook`, `deleteMyCommands` albo `setMyCommands` z `404: Not Found`, gdy bezpośrednie polecenia curl Bot API działają, może oznaczać, że `channels.telegram.apiRoot` ustawiono na pełny endpoint `/bot<TOKEN>`. `apiRoot` musi być tylko korzeniem Bot API, a `openclaw doctor --fix` usuwa przypadkowy końcowy `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Zaktualizuj `botToken`, `tokenFile` albo `TELEGRAM_BOT_TOKEN` bieżącym tokenem BotFather; OpenClaw zatrzymuje się przed odpytywaniem, więc nie jest to zgłaszane jako niepowodzenie czyszczenia webhooka.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzący DNS/HTTPS do `api.telegram.org` jest zablokowany.

    ### Polecenia parowania urządzenia (Plugin `device-pair`)

    Gdy Plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym rolę/zakresy)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji przenosi krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap utrzymuje token węzła podstawowego na `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Sprawdzenia zakresu bootstrap mają prefiks roli, więc ta allowlista operatora spełnia tylko żądania operatora; role niebędące operatorem nadal potrzebują zakresów pod własnym prefiksem roli.

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

    Kontrole bramkowania:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki runtime używają aktywnej migawki konfiguracji/sekretów (uruchomienie/przeładowanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef dla każdej wysyłki.

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
    - odpowiedzi i sygnalizacja pisania trafiają do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Specjalny przypadek tematu ogólnego (`threadId=1`):

    - wysyłanie wiadomości pomija `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje pisania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że są nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` jest tylko dla tematu i nie dziedziczy z domyślnych ustawień grupy.

    **Routing agentów per temat**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własny izolowany obszar roboczy, pamięć i sesję. Przykład:

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

    **Uruchamianie ACP powiązane z wątkiem z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne wiadomości są kierowane bezpośrednio tam. OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga pozostawienia włączonego `channels.telegram.threadBindings.spawnSessions` (domyślnie: `true`).

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` domyślnie zachowują routing DM i metadane odpowiedzi w płaskich sesjach; używają kluczy sesji świadomych wątków tylko wtedy, gdy skonfigurowano `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` albo pasującą konfigurację tematu. Użyj najwyższego poziomu `channels.telegram.dm.threadReplies` jako domyślnego ustawienia konta albo `direct.<chatId>.threadReplies` dla jednego DM.

  </Accordion>

  <Accordion title="Dźwięk, wideo i naklejki">
    ### Wiadomości audio

    Telegram odróżnia notatki głosowe od plików audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie notatki głosowej
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

    Telegram odróżnia pliki wideo od notatek wideo.

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

    Naklejki są opisywane raz (gdy to możliwe) i zapisywane w pamięci podręcznej, aby ograniczyć powtarzane wywołania wizji.

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

    Wyszukaj naklejki w pamięci podręcznej:

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

    Po włączeniu OpenClaw dodaje do kolejki zdarzenia systemowe, takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkowników na wiadomości wysłane przez bota (best-effort przez pamięć podręczną wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrole dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy niebędące forum kierują do sesji czatu grupowego
      - grupy forum kierują do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla polling/Webhook automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje potwierdzenia">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozstrzygania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - rezerwowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

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
    Domyślnie używany jest long polling. Dla trybu Webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (domyślne `/telegram-webhook`, `127.0.0.1`, `8787`).

    W trybie long polling OpenClaw utrwala znacznik wodny restartu dopiero po pomyślnym wysłaniu aktualizacji. Jeśli handler zawiedzie, ta aktualizacja pozostaje możliwa do ponowienia w tym samym procesie i nie jest zapisywana jako ukończona na potrzeby deduplikacji po restarcie.

    Lokalny listener wiąże się z `127.0.0.1:8787`. Dla publicznego wejścia umieść odwrotne proxy przed lokalnym portem albo celowo ustaw `webhookHost: "0.0.0.0"`.

    Tryb Webhook weryfikuje zabezpieczenia żądania, tajny token Telegram oraz ciało JSON przed zwróceniem `200` do Telegram.
    Następnie OpenClaw przetwarza aktualizację asynchronicznie przez te same pasy bota per czat/per temat, których używa long polling, więc wolne tury agenta nie blokują ACK dostarczenia Telegram.

  </Accordion>

  <Accordion title="Limity, ponawianie i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów Telegram.
    - `channels.telegram.mediaGroupFlushMs` (domyślnie 500) kontroluje, jak długo albumy/grupy multimediów Telegram są buforowane, zanim OpenClaw wyśle je jako jedną wiadomość przychodzącą. Zwiększ tę wartość, jeśli części albumu przychodzą późno; zmniejsz ją, aby skrócić opóźnienie odpowiedzi na album.
    - `channels.telegram.timeoutSeconds` nadpisuje timeout klienta API Telegram (jeśli nieustawione, obowiązuje domyślna wartość grammY). Klienci botów ograniczają skonfigurowane wartości poniżej 60-sekundowego zabezpieczenia żądania wychodzącego tekstu/pisania, aby grammY nie przerwał dostarczenia widocznej odpowiedzi, zanim uruchomi się zabezpieczenie transportu i fallback OpenClaw. Long polling nadal używa 45-sekundowego zabezpieczenia żądania `getUpdates`, aby bezczynne odpytywania nie były porzucane bez końca.
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; dostrajaj w zakresie od `30000` do `600000` tylko dla fałszywie dodatnich restartów z powodu zastoju polling.
    - historia kontekstu grupowego używa `channels.telegram.historyLimit` albo `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania jest normalizowany do jednego wybranego okna kontekstu konwersacji, gdy Gateway zaobserwował wiadomości nadrzędne; pamięć podręczna zaobserwowanych wiadomości jest utrwalana obok magazynu sesji. Telegram uwzględnia w aktualizacjach tylko jeden płytki `reply_to_message`, więc łańcuchy starsze niż pamięć podręczna są ograniczone do bieżącego ładunku aktualizacji Telegram.
    - listy dozwolonych Telegram przede wszystkim ograniczają to, kto może uruchomić agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.
    - kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfiguracja `channels.telegram.retry` dotyczy helperów wysyłania Telegram (CLI/narzędzia/akcje) dla możliwych do odzyskania błędów wychodzącego API. Dostarczenie końcowej odpowiedzi przychodzącej także używa ograniczonego ponawiania safe-send dla awarii Telegram przed połączeniem, ale nie ponawia niejednoznacznych kopert sieciowych po wysłaniu, które mogłyby zduplikować widoczne wiadomości.

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

    Wysyłanie Telegram obsługuje także:

    - `--presentation` z blokami `buttons` dla klawiatur inline, gdy zezwala na to `channels.telegram.capabilities.inlineButtons`
    - `--pin` albo `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać w tym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy, GIF-y i filmy jako dokumenty zamiast skompresowanych zdjęć, animowanych multimediów albo przesyłanych wideo

    Bramkowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając włączone zwykłe wysyłki

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM zatwierdzających i może opcjonalnie publikować prompty w czacie lub temacie źródłowym. Zatwierdzający muszą być numerycznymi identyfikatorami użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy co najmniej jeden zatwierdzający jest rozwiązywalny)
    - `channels.telegram.execApprovals.approvers` (wraca do numerycznych identyfikatorów właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` kontrolują, kto może rozmawiać z botem i gdzie bot wysyła zwykłe odpowiedzi. Nie czynią nikogo zatwierdzającym exec. Pierwsze zatwierdzone parowanie DM inicjalizuje `commands.ownerAllowFrom`, gdy właściciel poleceń jeszcze nie istnieje, więc konfiguracja z jednym właścicielem nadal działa bez duplikowania identyfikatorów w `execApprovals.approvers`.

    Dostarczanie do kanału pokazuje tekst polecenia na czacie; włączaj `channel` albo `both` tylko w zaufanych grupach/tematach. Gdy prompt trafia do tematu forum, OpenClaw zachowuje temat dla promptu zatwierdzenia i kolejnej wiadomości. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzenia inline wymagają również, aby `channels.telegram.capabilities.inlineButtons` zezwalało na docelową powierzchnię (`dm`, `group` albo `all`). Identyfikatory zatwierdzeń z prefiksem `plugin:` są rozwiązywane przez zatwierdzenia pluginów; pozostałe są najpierw rozwiązywane przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>```

## Kontrolowanie odpowiedzi o błędach

Gdy agent napotka błąd dostarczenia lub dostawcy, Telegram może odpowiedzieć tekstem błędu albo go ukryć. To zachowanie kontrolują dwa klucze konfiguracji:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                                         |
| ----------------------------------- | ----------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła do czatu przyjazny komunikat o błędzie. `silent` całkowicie wycisza odpowiedzi o błędach.     |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | Minimalny czas między odpowiedziami o błędach do tego samego czatu. Zapobiega spamowi błędami podczas awarii. |

Obsługiwane są nadpisania dla konta, grupy i tematu (z takim samym dziedziczeniem jak inne klucze konfiguracji Telegram).
__OC_I18N_900023__
## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Bot nie odpowiada na wiadomości grupowe bez wzmianki">

    - Jeśli `requireMention=false`, tryb prywatności Telegram musi zezwalać na pełną widoczność.
      - BotFather: `/setprivacy` -> Disable
      - następnie usuń bota z grupy i dodaj go ponownie
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne identyfikatory grup; symbol wieloznaczny `"*"` nie może być sondowany pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (lub zawierać `"*"`)
    - sprawdź członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow`, aby znaleźć powody pomijania

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj swoją tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy zasada grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele wpisów; ogranicz polecenia plugin/skill/niestandardowe albo wyłącz natywne menu
    - wywołania startowe `deleteMyCommands` / `setMyCommands` oraz wywołania wpisywania `sendChatAction` są ograniczone czasowo i ponawiane raz przez awaryjny transport Telegram po przekroczeniu limitu czasu żądania. Trwałe błędy sieciowe/fetch zwykle wskazują na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Start zgłasza nieautoryzowany token">

    - `getMe returned 401` to błąd uwierzytelniania Telegram dla skonfigurowanego tokenu bota.
    - Skopiuj ponownie albo wygeneruj od nowa token bota w BotFather, a następnie zaktualizuj `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` albo `TELEGRAM_BOT_TOKEN` dla konta domyślnego.
    - `deleteWebhook 401 Unauthorized` podczas startu także jest błędem uwierzytelniania; potraktowanie go jako „Webhook nie istnieje” tylko odroczyłoby tę samą awarię złego tokenu do późniejszych wywołań API.

  </Accordion>

  <Accordion title="Niestabilność odpytywania lub sieci">

    - Node 22+ + niestandardowy fetch/proxy może wywołać natychmiastowe przerwanie, jeśli typy AbortSignal się nie zgadzają.
    - Niektóre hosty rozwiązują `api.telegram.org` najpierw na IPv6; uszkodzony ruch wychodzący IPv6 może powodować okresowe awarie API Telegram.
    - Jeśli logi zawierają `TypeError: fetch failed` albo `Network request for 'getUpdates' failed!`, OpenClaw ponawia je teraz jako możliwe do odzyskania błędy sieciowe.
    - Podczas startu odpytywania OpenClaw ponownie używa udanej sondy startowej `getMe` dla grammY, dzięki czemu runner nie potrzebuje drugiego `getMe` przed pierwszym `getUpdates`.
    - Jeśli `deleteWebhook` zakończy się przejściowym błędem sieciowym podczas startu odpytywania, OpenClaw przechodzi do długiego odpytywania zamiast wykonywać kolejne wywołanie kontrolne przed odpytywaniem. Nadal aktywny Webhook objawia się konfliktem `getUpdates`; OpenClaw odbudowuje wtedy transport Telegram i ponawia czyszczenie Webhook.
    - Jeśli gniazda Telegram są odnawiane w krótkim, stałym rytmie, sprawdź, czy `channels.telegram.timeoutSeconds` nie ma niskiej wartości; klienci botów ograniczają skonfigurowane wartości poniżej strażników żądań wychodzących i `getUpdates`, ale starsze wydania mogły przerywać każde odpytywanie lub odpowiedź, gdy ustawiono to poniżej tych strażników.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw domyślnie restartuje odpytywanie i odbudowuje transport Telegram po 120 sekundach bez zakończonej żywotności długiego odpytywania.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy działające konto odpytywania nie zakończyło `getUpdates` po okresie karencji startu, gdy działające konto Webhook nie zakończyło `setWebhook` po okresie karencji startu albo gdy ostatnia udana aktywność transportu odpytywania jest przestarzała.
    - Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zastoju odpytywania. Trwałe zastoje zwykle wskazują na problemy z proxy, DNS, IPv6 albo ruchem wychodzącym TLS między hostem a `api.telegram.org`.
    - Telegram respektuje również zmienne środowiskowe proxy procesu dla transportu Bot API, w tym `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i ich warianty pisane małymi literami. `NO_PROXY` / `no_proxy` nadal mogą omijać `api.telegram.org`.
    - Jeśli zarządzany proxy OpenClaw jest skonfigurowany przez `OPENCLAW_PROXY_URL` dla środowiska usługi i nie ma standardowej zmiennej środowiskowej proxy, Telegram również używa tego URL do transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS kieruj wywołania API Telegram przez `channels.telegram.proxy`:
__OC_I18N_900024__
    - Node 22+ domyślnie używa `autoSelectFamily=true` (oprócz WSL2). Kolejność wyników DNS Telegram respektuje `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, następnie `channels.telegram.network.dnsResultOrder`, a potem domyślne ustawienie procesu, takie jak `NODE_OPTIONS=--dns-result-order=ipv4first`; jeśli żadne nie ma zastosowania, Node 22+ wraca do `ipv4first`.
    - Jeśli Twój host to WSL2 albo jawnie działa lepiej z zachowaniem tylko IPv4, wymuś wybór rodziny:
__OC_I18N_900025__
    - Odpowiedzi z zakresu testów porównawczych RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania multimediów Telegram. Jeśli zaufany fake-IP albo
      przezroczysty proxy przepisuje `api.telegram.org` na inny
      adres prywatny/wewnętrzny/specjalnego użycia podczas pobierania multimediów, możesz
      włączyć obejście tylko dla Telegram:
__OC_I18N_900026__
    - To samo ustawienie opt-in jest dostępne dla każdego konta pod adresem
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli Twój proxy rozwiązuje hosty multimediów Telegram na `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie zezwalają na zakres
      testów porównawczych RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia SSRF dla multimediów Telegram. Używaj go tylko w zaufanych, kontrolowanych przez operatora środowiskach proxy, takich jak routing fake-IP Clash, Mihomo albo Surge, gdy syntetyzują odpowiedzi prywatne lub specjalnego użycia poza zakresem testów porównawczych RFC 2544. Pozostaw wyłączone przy normalnym publicznym dostępie Telegram do internetu.
    </Warning>

    - Nadpisania środowiskowe (tymczasowe):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Sprawdź odpowiedzi DNS:
__OC_I18N_900027__
  </Accordion>
</AccordionGroup>

Więcej pomocy: [Rozwiązywanie problemów z kanałami](/channels/troubleshooting).

## Odniesienie do konfiguracji

Główne odniesienie: [Odniesienie do konfiguracji - Telegram](/gateway/config-channels#telegram).

<Accordion title="Najważniejsze pola Telegram">

- start/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; dowiązania symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- zatwierdzanie exec: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- strumieniowanie: `streaming` (podgląd), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- niestandardowy korzeń API: `apiRoot` (tylko korzeń Bot API; nie dołączaj `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Pierwszeństwo wielu kont: gdy skonfigurowane są co najmniej dwa identyfikatory kont, ustaw `channels.telegram.defaultAccount` (albo dołącz `channels.telegram.accounts.default`), aby domyślne routowanie było jawne. W przeciwnym razie OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` ostrzega. Nazwane konta dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Telegram z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie listy dozwolonych grup i tematów.
  </Card>
  <Card title="Routowanie kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj przychodzące wiadomości do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Routowanie wieloagentowe" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj grupy i tematy na agentów.
  </Card>
  <Card title="Rozwiązywanie problemów" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa.
  </Card>
</CardGroup>
