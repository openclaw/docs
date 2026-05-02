---
read_when:
    - Praca nad funkcjami Telegram lub webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-05-02T20:41:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b5a733970f21e6b5a145b9ebb13134fb8e18b81fa0c723607019837c60f5497
    source_path: channels/telegram.md
    workflow: 16
---

Gotowe do produkcji dla wiadomości DM botów i grup przez grammY. Domyślnym trybem jest długie odpytywanie; tryb Webhook jest opcjonalny.

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
    Otwórz Telegram i rozpocznij czat z **@BotFather** (potwierdź, że nazwa to dokładnie `@BotFather`).

    Uruchom `/newbot`, postępuj zgodnie z monitami i zapisz token.

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

    Zapasowa zmienna środowiskowa: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w konfiguracji/środowisku, a następnie uruchom gateway.

  </Step>

  <Step title="Uruchom Gateway i zatwierdź pierwszą DM">

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
Kolejność rozwiązywania tokena uwzględnia konta. W praktyce wartości konfiguracji mają pierwszeństwo przed zapasową zmienną środowiskową, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność grupy">
    Boty Telegram domyślnie używają **trybu prywatności**, który ogranicza wiadomości grupowe, jakie otrzymują.

    Jeśli bot musi widzieć wszystkie wiadomości grupowe:

    - wyłącz tryb prywatności przez `/setprivacy`, albo
    - ustaw bota jako administratora grupy.

    Po przełączeniu trybu prywatności usuń i ponownie dodaj bota w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty administracyjne otrzymują wszystkie wiadomości grupowe, co jest przydatne przy stale aktywnym zachowaniu grupowym.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić na dodawanie do grup lub je zablokować
    - `/setprivacy` dla zachowania widoczności w grupie

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.telegram.dmPolicy` kontroluje dostęp przez wiadomości bezpośrednie:

    - `pairing` (domyślne)
    - `allowlist` (wymaga co najmniej jednego ID nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` pozwala każdemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, wydawać botowi polecenia. Używaj tego tylko dla celowo publicznych botów ze ściśle ograniczonymi narzędziami; boty jednego właściciela powinny używać `allowlist` z numerycznymi ID użytkowników.

    `channels.telegram.allowFrom` przyjmuje numeryczne ID użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach wielokontowych restrykcyjne `channels.telegram.allowFrom` najwyższego poziomu jest traktowane jako granica bezpieczeństwa: wpisy `allowFrom: ["*"]` na poziomie konta nie czynią tego konta publicznym, chyba że efektywna lista dozwolonych kont nadal zawiera jawny symbol wieloznaczny po scaleniu.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie DM i jest odrzucane przez walidację konfiguracji.
    Konfiguracja pyta tylko o numeryczne ID użytkowników.
    Jeśli wykonano aktualizację, a konfiguracja zawiera wpisy listy dozwolonych w formacie `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (najlepszym możliwym sposobem; wymaga tokena bota Telegram).
    Jeśli wcześniej używano plików listy dozwolonych ze sklepu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach z listą dozwolonych (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych ID).

    Dla botów jednego właściciela preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi ID `allowFrom`, aby polityka dostępu była trwała w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania DM nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp przez DM. Jeśli nie istnieje jeszcze właściciel poleceń, pierwsze zatwierdzone parowanie ustawia również `commands.ownerAllowFrom`, aby polecenia tylko dla właściciela i zatwierdzenia wykonania miały jawne konto operatora.
    Autoryzacja nadawcy w grupie nadal pochodzi z jawnych list dozwolonych w konfiguracji.
    Jeśli chcesz „jestem autoryzowany raz i działają zarówno DM, jak i polecenia grupowe”, umieść swoje numeryczne ID użytkownika Telegram w `channels.telegram.allowFrom`; dla poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

    ### Znajdowanie swojego ID użytkownika Telegram

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

  <Tab title="Polityka grup i listy dozwolonych">
    Dwie kontrolki działają razem:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - z `groupPolicy: "open"`: dowolna grupa może przejść kontrole ID grupy
         - z `groupPolicy: "allowlist"` (domyślne): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako lista dozwolonych (jawne ID lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślne)
       - `disabled`

    `groupAllowFrom` jest używane do filtrowania nadawców grupowych. Jeśli nie jest ustawione, Telegram wraca do `allowFrom`.
    Wpisy `groupAllowFrom` powinny być numerycznymi ID użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj ID czatów grup ani supergrup Telegram w `groupAllowFrom`. Ujemne ID czatów należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawcy grupowego **nie** dziedziczy zatwierdzeń sklepu parowania DM.
    Parowanie pozostaje tylko dla DM. Dla grup ustaw `groupAllowFrom` albo `allowFrom` dla grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram wraca do konfiguracji `allowFrom`, a nie do sklepu parowania.
    Praktyczny wzorzec dla botów jednego właściciela: ustaw swoje ID użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na grupy docelowe w `channels.telegram.groups`.
    Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.telegram` całkowicie brakuje, środowisko uruchomieniowe domyślnie działa w trybie fail-closed `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest jawnie ustawione.

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

      - Umieszczaj ujemne ID czatów grup lub supergrup Telegram, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieszczaj ID użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą wyzwalać bota.
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

    Aktualizują one tylko stan sesji. Użyj konfiguracji, aby zapewnić trwałość.

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

## Zachowanie środowiska uruchomieniowego

- Telegram jest własnością procesu Gateway.
- Routing jest deterministyczny: odpowiedzi przychodzące z Telegram wracają do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do współdzielonej koperty kanału z metadanymi odpowiedzi i placeholderami multimediów.
- Sesje grupowe są izolowane według ID grupy. Tematy forum dodają `:topic:<threadId>`, aby zachować izolację tematów.
- Wiadomości DM mogą przenosić `message_thread_id`; OpenClaw zachowuje ID wątku dla odpowiedzi, ale domyślnie utrzymuje DM w płaskiej sesji. Skonfiguruj `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` albo pasującą konfigurację tematu, gdy celowo chcesz izolacji sesji tematów DM.
- Długie odpytywanie używa runnera grammY z sekwencjonowaniem według czatu/wątku. Ogólna współbieżność ujścia runnera używa `agents.defaults.maxConcurrent`.
- Długie odpytywanie jest chronione wewnątrz każdego procesu Gateway, aby tylko jeden aktywny poller mógł używać tokena bota naraz. Jeśli nadal widzisz konflikty `getUpdates` 409, prawdopodobnie inny Gateway OpenClaw, skrypt lub zewnętrzny poller używa tego samego tokena.
- Ponowne uruchomienia watchdog długiego odpytywania wyzwalają się domyślnie po 120 sekundach bez ukończonej aktywności `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy wdrożenie nadal widzi fałszywe restarty z powodu zastoju odpytywania podczas długotrwałej pracy. Wartość jest podawana w milisekundach i dozwolona od `30000` do `600000`; obsługiwane są nadpisania dla poszczególnych kont.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Dokumentacja funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumieniowania na żywo (edycje wiadomości)">
    OpenClaw może strumieniować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` ma wartość `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` mapuje się na `partial` w Telegram (zgodność z nazewnictwem międzykanałowym)
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzi/postępu ponownie używają tej samej edytowanej wiadomości podglądu (domyślnie: `true`, gdy strumieniowanie podglądu jest aktywne)
    - starsze `channels.telegram.streamMode` i boolowskie wartości `streaming` są wykrywane; uruchom `openclaw doctor --fix`, aby zmigrować je do `channels.telegram.streaming.mode`

    Aktualizacje podglądu postępu narzędzi to krótkie wiersze „Praca...”, pokazywane podczas działania narzędzi, na przykład wykonywania poleceń, odczytów plików, aktualizacji planowania lub podsumowań poprawek. Telegram domyślnie pozostawia je włączone, aby odpowiadały wydanemu zachowaniu OpenClaw od `v2026.4.22` i późniejszych. Aby zachować edytowany podgląd dla tekstu odpowiedzi, ale ukryć wiersze postępu narzędzi, ustaw:

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

    Użyj `streaming.mode: "off"` tylko wtedy, gdy chcesz dostarczania wyłącznie końcowego: edycje podglądu Telegram są wyłączone, a ogólne komunikaty narzędzi/postępu są tłumione zamiast wysyłane jako osobne wiadomości „Pracuję...”. Monity zatwierdzeń, payloady multimediów i błędy nadal przechodzą przez normalne dostarczanie końcowe. Użyj `streaming.preview.toolProgress: false`, gdy chcesz zachować tylko edycje podglądu odpowiedzi, ukrywając wiersze statusu postępu narzędzi.

    Dla odpowiedzi tekstowych:

    - krótkie podglądy w DM/grupie/temacie: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu
    - podglądy starsze niż około jedna minuta: OpenClaw wysyła ukończoną odpowiedź jako nową wiadomość końcową, a następnie sprząta podgląd, dzięki czemu widoczny znacznik czasu Telegram odzwierciedla czas ukończenia zamiast czasu utworzenia podglądu

    Dla złożonych odpowiedzi (na przykład payloadów multimediów) OpenClaw wraca do normalnego dostarczania końcowego, a następnie sprząta wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielne od strumieniowania bloków. Gdy strumieniowanie bloków jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - odpowiedź końcowa jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i awaryjny HTML">
    Tekst wychodzący używa Telegram `parse_mode: "HTML"`.

    - Tekst podobny do Markdown jest renderowany do HTML bezpiecznego dla Telegram.
    - Surowy HTML modelu jest escapowany, aby ograniczyć niepowodzenia parsowania Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponawia próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć za pomocą `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Polecenia natywne i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana przy starcie za pomocą `setMyCommands`.

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
    - poprawny wzorzec: `a-z`, `0-9`, `_`, długość `1..32`
    - polecenia niestandardowe nie mogą nadpisywać poleceń natywnych
    - konflikty/duplikaty są pomijane i logowane

    Uwagi:

    - polecenia niestandardowe są tylko wpisami menu; nie implementują automatycznie zachowania
    - polecenia plugin/skill mogą nadal działać po wpisaniu, nawet jeśli nie są widoczne w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane są usuwane. Polecenia niestandardowe/plugin mogą nadal się rejestrować, jeśli są skonfigurowane.

    Typowe niepowodzenia konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przekroczyło limit po przycięciu; zmniejsz liczbę poleceń plugin/skill/niestandardowych albo wyłącz `channels.telegram.commands.native`.
    - Niepowodzenie `deleteWebhook`, `deleteMyCommands` lub `setMyCommands` z `404: Not Found`, podczas gdy bezpośrednie polecenia curl Bot API działają, może oznaczać, że `channels.telegram.apiRoot` ustawiono na pełny endpoint `/bot<TOKEN>`. `apiRoot` musi być tylko korzeniem Bot API, a `openclaw doctor --fix` usuwa przypadkowy końcowy `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Zaktualizuj `botToken`, `tokenFile` lub `TELEGRAM_BOT_TOKEN`, używając bieżącego tokena BotFather; OpenClaw zatrzymuje się przed odpytywaniem, więc nie jest to zgłaszane jako błąd sprzątania webhooka.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzący DNS/HTTPS do `api.telegram.org` jest zablokowany.

    ### Polecenia parowania urządzeń (plugin `device-pair`)

    Gdy plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym role/zakresy)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy jest tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji przenosi krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap utrzymuje token węzła głównego przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Sprawdzenia zakresów bootstrap mają prefiks roli, więc ta lista dozwolonych operatora spełnia tylko żądania operatora; role niebędące operatorem nadal wymagają zakresów pod własnym prefiksem roli.

    Jeśli urządzenie ponawia próbę ze zmienionymi szczegółami uwierzytelniania (na przykład rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione, a nowe żądanie używa innego `requestId`. Uruchom ponownie `/pair pending` przed zatwierdzeniem.

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

    Kliknięcia callback są przekazywane do agenta jako tekst:
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

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w czasie wykonywania używają aktywnego snapshotu konfiguracji/sekretów (start/przeładowanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdym wysłaniu.

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

    Gdy wątkowanie odpowiedzi jest włączone, a oryginalny tekst lub podpis Telegram jest dostępny, OpenClaw automatycznie dołącza natywny cytat Telegram. Telegram ogranicza natywny tekst cytatu do 1024 jednostek kodowych UTF-16, więc dłuższe wiadomości są cytowane od początku i wracają do zwykłej odpowiedzi, jeśli Telegram odrzuci cytat.

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

    Dziedziczenie tematu: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy z domyślnych ustawień grupy.

    **Routing agenta per temat**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własny izolowany obszar roboczy, pamięć i sesję. Przykład:

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

    **Trwałe powiązanie tematu ACP**: Tematy forum mogą przypinać sesje uprzęży ACP przez najwyższego poziomu typowane powiązania ACP (`bindings[]` z `type: "acp"` oraz `match.channel: "telegram"`, `peer.kind: "group"` i identyfikatorem kwalifikowanym tematem, takim jak `-1001234567890:topic:42`). Obecnie ograniczone do tematów forum w grupach/supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Uruchamianie ACP powiązane z wątkiem z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne wiadomości trafiają tam bezpośrednio. OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga, aby `channels.telegram.threadBindings.spawnSessions` pozostało włączone (domyślnie: `true`).

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` domyślnie zachowują routing DM i metadane odpowiedzi w płaskich sesjach; używają kluczy sesji świadomych wątków tylko wtedy, gdy skonfigurowano `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` albo pasującą konfigurację tematu. Użyj najwyższego poziomu `channels.telegram.dm.threadReplies` dla domyślnego ustawienia konta albo `direct.<chatId>.threadReplies` dla jednego DM.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie notatki głosowej
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

    Naklejki są opisywane raz (gdy to możliwe) i buforowane, aby ograniczyć powtarzane wywołania vision.

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

    Wyszukaj zapisane w pamięci podręcznej naklejki:

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

    - `own` oznacza tylko reakcje użytkowników na wiadomości wysłane przez bota (best-effort przez pamięć podręczną wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrole dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieuprawnieni nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy inne niż forum są kierowane do sesji czatu grupowego
      - grupy forum są kierowane do sesji ogólnego tematu grupy (`:topic:1`), a nie dokładnego tematu źródłowego

    `allowed_updates` dla odpytywania/webhooka automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje potwierdzenia">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozstrzygania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - zapasowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji Unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji ze zdarzeń i poleceń Telegram">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grupy (`migrate_to_chat_id`) do aktualizacji `channels.telegram.groups`
    - `/config set` i `/config unset` (wymaga włączenia poleceń)

    Wyłączanie:

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

  <Accordion title="Długie odpytywanie a webhook">
    Domyślne jest długie odpytywanie. Dla trybu webhooka ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (domyślnie `/telegram-webhook`, `127.0.0.1`, `8787`).

    Lokalny nasłuch wiąże się z `127.0.0.1:8787`. Dla publicznego wejścia umieść odwrotne proxy przed lokalnym portem albo celowo ustaw `webhookHost: "0.0.0.0"`.

    Tryb webhooka sprawdza zabezpieczenia żądania, tajny token Telegram oraz treść JSON przed zwróceniem `200` do Telegram.
    Następnie OpenClaw przetwarza aktualizację asynchronicznie przez te same pasy bota na czat/temat, które są używane przez długie odpytywanie, więc powolne tury agenta nie blokują potwierdzenia dostarczenia Telegram.

  </Accordion>

  <Accordion title="Limity, ponawianie i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów Telegram.
    - `channels.telegram.timeoutSeconds` nadpisuje limit czasu klienta API Telegram (jeśli nie ustawiono, obowiązuje domyślna wartość grammY). Klienci botów obcinają skonfigurowane wartości poniżej 60-sekundowego zabezpieczenia żądań wychodzącego tekstu/pisania, aby grammY nie przerywał dostarczania widocznej odpowiedzi, zanim zadziała zabezpieczenie transportu OpenClaw i mechanizm zapasowy. Długie odpytywanie nadal używa 45-sekundowego zabezpieczenia żądania `getUpdates`, aby bezczynne odpytywania nie były porzucane bez końca.
    - Domyślna wartość `channels.telegram.pollingStallThresholdMs` to `120000`; dostrajaj w zakresie od `30000` do `600000` tylko przy fałszywie dodatnich restartach z powodu zastoju odpytywania.
    - Historia kontekstu grupowego używa `channels.telegram.historyLimit` albo `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - Uzupełniający kontekst odpowiedzi/cytatu/przekazania jest obecnie przekazywany tak, jak został odebrany.
    - Listy dozwolonych Telegram głównie kontrolują, kto może wyzwolić agenta, a nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.
    - Kontrole historii wiadomości prywatnych:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfiguracja `channels.telegram.retry` ma zastosowanie do pomocników wysyłania Telegram (CLI/narzędzia/akcje) dla możliwych do odzyskania wychodzących błędów API. Dostarczanie końcowej odpowiedzi przychodzącej również używa ograniczonego ponowienia bezpiecznego wysyłania dla awarii Telegram przed połączeniem, ale nie ponawia niejednoznacznych kopert sieciowych po wysłaniu, które mogłyby zduplikować widoczne wiadomości.

    Cel wysyłania CLI może być numerycznym identyfikatorem czatu albo nazwą użytkownika:

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

    Wysyłanie Telegram obsługuje też:

    - `--presentation` z blokami `buttons` dla klawiatur inline, gdy `channels.telegram.capabilities.inlineButtons` na to pozwala
    - `--pin` albo `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać w tym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć lub przesyłanych multimediów animowanych

    Bramkowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając zwykłe wysyłanie włączone

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w prywatnych wiadomościach zatwierdzających i może opcjonalnie publikować monity w czacie lub temacie źródłowym. Zatwierdzający muszą być numerycznymi identyfikatorami użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy można rozpoznać co najmniej jednego zatwierdzającego)
    - `channels.telegram.execApprovals.approvers` (wraca do numerycznych identyfikatorów właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` kontrolują, kto może rozmawiać z botem i dokąd wysyła on normalne odpowiedzi. Nie czynią nikogo zatwierdzającym exec. Pierwsze zatwierdzone parowanie przez wiadomość prywatną inicjuje `commands.ownerAllowFrom`, gdy nie ma jeszcze właściciela poleceń, więc konfiguracja z jednym właścicielem nadal działa bez duplikowania identyfikatorów w `execApprovals.approvers`.

    Dostarczanie w kanale pokazuje tekst polecenia na czacie; włączaj `channel` albo `both` tylko w zaufanych grupach/tematach. Gdy monit trafia do tematu forum, OpenClaw zachowuje temat dla monitu zatwierdzenia i kolejnej odpowiedzi. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline wymagają również, aby `channels.telegram.capabilities.inlineButtons` pozwalało na powierzchnię docelową (`dm`, `group` albo `all`). Identyfikatory zatwierdzeń z prefiksem `plugin:` są rozstrzygane przez zatwierdzenia pluginu; pozostałe są najpierw rozstrzygane przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrole odpowiedzi o błędach

Gdy agent napotka błąd dostarczenia lub providera, Telegram może odpowiedzieć tekstem błędu albo go wyciszyć. Dwa klucze konfiguracji kontrolują to zachowanie:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                                           |
| ----------------------------------- | ----------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła przyjazną wiadomość o błędzie do czatu. `silent` całkowicie wycisza odpowiedzi o błędach.       |
| `channels.telegram.errorCooldownMs` | liczba (ms)       | `60000`   | Minimalny czas między odpowiedziami o błędach do tego samego czatu. Zapobiega spamowi błędów podczas awarii.  |

Obsługiwane są nadpisania dla konta, grupy i tematu (to samo dziedziczenie co dla innych kluczy konfiguracji Telegram).

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
      - następnie usuń bota z grupy i dodaj go ponownie
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzić jawne numeryczne identyfikatory grup; symbol wieloznaczny `"*"` nie może być sprawdzony pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (albo zawierać `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow`, aby zobaczyć powody pomijania

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj swoją tożsamość nadawcy (parowanie lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy polityka grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele pozycji; ogranicz polecenia pluginów/Skills/niestandardowe albo wyłącz natywne menu
    - wywołania startowe `deleteMyCommands` / `setMyCommands` oraz wywołania pisania `sendChatAction` są ograniczone i ponawiane raz przez mechanizm zapasowy transportu Telegram przy limicie czasu żądania. Utrzymujące się błędy sieci/fetch zwykle wskazują na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Uruchamianie zgłasza nieautoryzowany token">

    - `getMe returned 401` to błąd uwierzytelniania Telegram dla skonfigurowanego tokena bota.
    - Ponownie skopiuj albo wygeneruj token bota w BotFather, a następnie zaktualizuj `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` albo `TELEGRAM_BOT_TOKEN` dla konta domyślnego.
    - `deleteWebhook 401 Unauthorized` podczas uruchamiania również jest błędem uwierzytelniania; potraktowanie go jako „webhook nie istnieje” tylko odłożyłoby tę samą awarię złego tokena do późniejszych wywołań API.
    - Jeśli `deleteWebhook` zawiedzie z przejściowym błędem sieci podczas uruchamiania odpytywania, OpenClaw sprawdza `getWebhookInfo`; gdy Telegram zgłasza pusty URL webhooka, odpytywanie jest kontynuowane, ponieważ sprzątanie jest już spełnione.

  </Accordion>

  <Accordion title="Niestabilność odpytywania lub sieci">

    - Node 22+ + niestandardowy fetch/serwer proxy może powodować natychmiastowe przerwanie, jeśli typy AbortSignal są niezgodne.
    - Niektóre hosty rozwiązują `api.telegram.org` najpierw na IPv6; niesprawny ruch wychodzący IPv6 może powodować przerywane awarie API Telegram.
    - Jeśli logi zawierają `TypeError: fetch failed` lub `Network request for 'getUpdates' failed!`, OpenClaw teraz ponawia je jako możliwe do obsłużenia błędy sieciowe.
    - Jeśli gniazda Telegram resetują się w krótkim, stałym cyklu, sprawdź niską wartość `channels.telegram.timeoutSeconds`; klienci botów podnoszą skonfigurowane wartości niższe niż zabezpieczenia żądań wychodzących i `getUpdates`, ale starsze wydania mogły przerywać każde odpytywanie lub odpowiedź, gdy ustawiono tę wartość poniżej tych zabezpieczeń.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw domyślnie ponownie uruchamia odpytywanie i odbudowuje transport Telegram po 120 sekundach bez ukończonej kontroli żywotności długiego odpytywania.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy konto działające w trybie odpytywania nie ukończyło `getUpdates` po okresie karencji po uruchomieniu, gdy konto działające w trybie Webhook nie ukończyło `setWebhook` po okresie karencji po uruchomieniu albo gdy ostatnia udana aktywność transportu odpytywania jest nieaktualna.
    - Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długo trwające wywołania `getUpdates` działają prawidłowo, ale host nadal zgłasza fałszywe restarty z powodu zastoju odpytywania. Utrzymujące się zastoje zwykle wskazują na problemy z proxy, DNS, IPv6 lub ruchem wychodzącym TLS między hostem a `api.telegram.org`.
    - Telegram respektuje też zmienne środowiskowe proxy procesu dla transportu Bot API, w tym `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` oraz ich warianty pisane małymi literami. `NO_PROXY` / `no_proxy` mogą nadal omijać `api.telegram.org`.
    - Jeśli zarządzany serwer proxy OpenClaw jest skonfigurowany przez `OPENCLAW_PROXY_URL` dla środowiska usługi i nie ma standardowych zmiennych środowiskowych proxy, Telegram używa tego URL także dla transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS kieruj wywołania API Telegram przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie ustawia `autoSelectFamily=true` (oprócz WSL2). Kolejność wyników DNS Telegram respektuje `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, następnie `channels.telegram.network.dnsResultOrder`, a następnie domyślną wartość procesu, taką jak `NODE_OPTIONS=--dns-result-order=ipv4first`; jeśli żadna nie ma zastosowania, Node 22+ używa awaryjnie `ipv4first`.
    - Jeśli host to WSL2 albo wyraźnie działa lepiej w trybie tylko IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania multimediów Telegram. Jeśli zaufany serwer proxy typu fake-IP lub
      transparentny serwer proxy przepisuje `api.telegram.org` na inny
      adres prywatny/wewnętrzny/specjalnego zastosowania podczas pobierania multimediów, możesz włączyć
      obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Ta sama opcja włączenia jest dostępna dla każdego konta pod
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli serwer proxy rozwiązuje hosty multimediów Telegram na `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie dopuszczają zakres
      benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia SSRF
      dla multimediów Telegram. Używaj jej tylko w zaufanych środowiskach proxy kontrolowanych przez operatora,
      takich jak trasowanie fake-IP w Clash, Mihomo lub Surge, gdy
      syntetyzują prywatne lub specjalnego zastosowania odpowiedzi spoza zakresu benchmarkowego
      RFC 2544. Pozostaw ją wyłączoną dla zwykłego publicznego dostępu do Telegram przez Internet.
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

## Referencja konfiguracji

Główna referencja: [Referencja konfiguracji - Telegram](/pl/gateway/config-channels#telegram).

<Accordion title="Najistotniejsze pola Telegram">

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; dowiązania symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` najwyższego poziomu (`type: "acp"`)
- zatwierdzenia wykonywania poleceń: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- strumieniowanie: `streaming` (wersja zapoznawcza), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- niestandardowy katalog główny API: `apiRoot` (tylko katalog główny Bot API; nie uwzględniaj `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorytet wielu kont: gdy skonfigurowano dwa lub więcej identyfikatorów kont, ustaw `channels.telegram.defaultAccount` (albo uwzględnij `channels.telegram.accounts.default`), aby domyślne trasowanie było jawne. W przeciwnym razie OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` ostrzega. Konta nazwane dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Telegram z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie list dozwolonych grup i tematów.
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
