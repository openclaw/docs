---
read_when:
    - Praca nad funkcjami Telegram lub Webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-05-02T09:44:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: dde2a15c6529365e6174f8e0640c1955b63fdfafa952b675159db93c5d43041c
    source_path: channels/telegram.md
    workflow: 16
---

Gotowe do produkcji dla wiadomości prywatnych botów i grup przez grammY. Domyślnym trybem jest długie odpytywanie; tryb Webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną zasadą wiadomości prywatnych dla Telegram jest parowanie.
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
    Otwórz Telegram i porozmawiaj z **@BotFather** (upewnij się, że nazwa konta to dokładnie `@BotFather`).

    Uruchom `/newbot`, postępuj zgodnie z instrukcjami i zapisz token.

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

    Zapasowe źródło env: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w konfiguracji/env, a następnie uruchom gateway.

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
Kolejność rozpoznawania tokenów uwzględnia konto. W praktyce wartości konfiguracji mają pierwszeństwo przed zapasowym źródłem env, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność grup">
    Boty Telegram domyślnie używają **trybu prywatności**, który ogranicza wiadomości grupowe, jakie otrzymują.

    Jeśli bot musi widzieć wszystkie wiadomości grupowe:

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
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Zasada wiadomości prywatnych">
    `channels.telegram.dmPolicy` kontroluje dostęp do wiadomości bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` pozwala każdemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, wydawać botowi polecenia. Używaj tego tylko dla celowo publicznych botów z mocno ograniczonymi narzędziami; boty z jednym właścicielem powinny używać `allowlist` z liczbowymi identyfikatorami użytkowników.

    `channels.telegram.allowFrom` przyjmuje liczbowe identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach z wieloma kontami restrykcyjne `channels.telegram.allowFrom` najwyższego poziomu jest traktowane jako granica bezpieczeństwa: wpisy `allowFrom: ["*"]` na poziomie konta nie czynią tego konta publicznym, chyba że efektywna lista dozwolonych kont nadal zawiera jawny symbol wieloznaczny po scaleniu.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie wiadomości prywatne i jest odrzucane przez walidację konfiguracji.
    Konfiguracja prosi tylko o liczbowe identyfikatory użytkowników.
    Jeśli po aktualizacji Twoja konfiguracja zawiera wpisy listy dozwolonych w formie `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (najlepsza możliwa próba; wymaga tokenu bota Telegram).
    Jeśli wcześniej polegałeś na plikach listy dozwolonych magazynu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach listy dozwolonych (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    Dla botów z jednym właścicielem preferuj `dmPolicy: "allowlist"` z jawnymi liczbowymi identyfikatorami `allowFrom`, aby utrzymać trwałą zasadę dostępu w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnych nie oznacza, że „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp do wiadomości prywatnych. Jeśli nie istnieje jeszcze właściciel poleceń, pierwsze zatwierdzone parowanie ustawia też `commands.ownerAllowFrom`, aby polecenia tylko dla właściciela i zatwierdzenia exec miały jawne konto operatora.
    Autoryzacja nadawców w grupach nadal pochodzi z jawnych list dozwolonych w konfiguracji.
    Jeśli chcesz, aby „jestem autoryzowany raz i działają zarówno wiadomości prywatne, jak i polecenia grupowe”, umieść swój liczbowy identyfikator użytkownika Telegram w `channels.telegram.allowFrom`; dla poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

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
    Dwie kontrolki działają razem:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - z `groupPolicy: "open"`: dowolna grupa może przejść sprawdzenia identyfikatora grupy
         - z `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako lista dozwolonych (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców grupowych. Jeśli nie jest ustawione, Telegram wraca do `allowFrom`.
    Wpisy `groupAllowFrom` powinny być liczbowymi identyfikatorami użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatów grup Telegram ani supergrup w `groupAllowFrom`. Ujemne identyfikatory czatów należą do `channels.telegram.groups`.
    Wpisy nieliczbowe są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): uwierzytelnianie nadawców grupowych **nie** dziedziczy zatwierdzeń z magazynu parowania wiadomości prywatnych.
    Parowanie pozostaje tylko dla wiadomości prywatnych. Dla grup ustaw `groupAllowFrom` albo `allowFrom` dla grupy lub tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram wraca do konfiguracyjnego `allowFrom`, nie do magazynu parowania.
    Praktyczny wzorzec dla botów z jednym właścicielem: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na grupy docelowe w `channels.telegram.groups`.
    Uwaga dotycząca środowiska wykonawczego: jeśli całkowicie brakuje `channels.telegram`, środowisko wykonawcze domyślnie zamyka dostęp przez `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest jawnie ustawione.

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

      - Umieszczaj ujemne identyfikatory czatów grup Telegram lub supergrup, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieszczaj identyfikatory użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą wywołać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.

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

    - przekaż wiadomość z grupy do `@userinfobot` / `@getidsbot`
    - albo odczytaj `chat.id` z `openclaw logs --follow`
    - albo sprawdź Bot API `getUpdates`

  </Tab>
</Tabs>

## Zachowanie środowiska wykonawczego

- Telegram jest własnością procesu gateway.
- Routing jest deterministyczny: wiadomości przychodzące z Telegram odpowiadają z powrotem do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi i symbolami zastępczymi mediów.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dodają `:topic:<threadId>`, aby utrzymać izolację tematów.
- Wiadomości prywatne mogą przenosić `message_thread_id`; OpenClaw zachowuje identyfikator wątku dla odpowiedzi, ale domyślnie utrzymuje wiadomości prywatne w płaskiej sesji. Skonfiguruj `channels.telegram.direct.<chatId>.threadReplies: "inbound"` lub `requireTopic: true`, gdy celowo chcesz izolacji sesji tematu wiadomości prywatnych.
- Długie odpytywanie używa runnera grammY z sekwencjonowaniem według czatu i wątku. Ogólna współbieżność ujścia runnera używa `agents.defaults.maxConcurrent`.
- Długie odpytywanie jest chronione wewnątrz każdego procesu gateway, aby tylko jeden aktywny poller mógł jednocześnie używać tokenu bota. Jeśli nadal widzisz konflikty `getUpdates` 409, prawdopodobnie inny OpenClaw gateway, skrypt lub zewnętrzny poller używa tego samego tokenu.
- Restarty watchdoga długiego odpytywania domyślnie uruchamiają się po 120 sekundach bez zakończonego sygnału żywotności `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy Twoje wdrożenie nadal widzi fałszywe restarty zatrzymania odpytywania podczas długo działającej pracy. Wartość jest podana w milisekundach i jest dozwolona od `30000` do `600000`; obsługiwane są nadpisania na poziomie konta.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Opis funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumienia na żywo (edycje wiadomości)">
    OpenClaw może strumieniować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` to `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` mapuje się na `partial` w Telegram (zgodność z nazewnictwem międzykanałowym)
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzi/postępu ponownie używają tej samej edytowanej wiadomości podglądu (domyślnie: `true`, gdy strumieniowanie podglądu jest aktywne)
    - starsze `channels.telegram.streamMode` i wartości logiczne `streaming` są wykrywane; uruchom `openclaw doctor --fix`, aby zmigrować je do `channels.telegram.streaming.mode`

    Aktualizacje podglądu postępu narzędzi to krótkie wiersze „Working...” wyświetlane podczas działania narzędzi, na przykład wykonywania poleceń, odczytów plików, aktualizacji planowania lub podsumowań poprawek. Telegram utrzymuje je domyślnie włączone, aby odpowiadać zachowaniu OpenClaw wydanemu od `v2026.4.22` i później. Aby zachować edytowany podgląd tekstu odpowiedzi, ale ukryć wiersze postępu narzędzi, ustaw:

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

    Używaj `streaming.mode: "off"` tylko wtedy, gdy chcesz dostarczać wyłącznie odpowiedź końcową: edycje podglądu Telegram są wyłączone, a ogólne komunikaty narzędzi/postępu są tłumione zamiast wysyłania ich jako samodzielnych wiadomości „Working...”. Monity o zatwierdzenie, ładunki multimedialne i błędy nadal przechodzą przez normalne dostarczanie końcowe. Użyj `streaming.preview.toolProgress: false`, gdy chcesz zachować tylko edycje podglądu odpowiedzi, ukrywając jednocześnie wiersze statusu postępu narzędzia.

    Dla odpowiedzi wyłącznie tekstowych:

    - krótkie podglądy w DM/grupie/temacie: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu
    - podglądy starsze niż około jedna minuta: OpenClaw wysyła ukończoną odpowiedź jako nową wiadomość końcową, a następnie sprząta podgląd, dzięki czemu widoczny znacznik czasu Telegram odzwierciedla czas ukończenia zamiast czasu utworzenia podglądu

    Dla złożonych odpowiedzi (na przykład ładunków multimedialnych) OpenClaw wraca do normalnego dostarczania końcowego, a następnie sprząta wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielne od strumieniowania bloków. Gdy strumieniowanie bloków jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - odpowiedź końcowa jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    Tekst wychodzący używa Telegram `parse_mode: "HTML"`.

    - Tekst podobny do Markdown jest renderowany do bezpiecznego dla Telegram HTML.
    - Surowy HTML modelu jest escapowany, aby ograniczyć błędy parsowania Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponawia próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć za pomocą `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Rejestracja menu poleceń Telegram jest obsługiwana podczas uruchamiania za pomocą `setMyCommands`.

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
    - polecenia plugin/skill mogą nadal działać po wpisaniu, nawet jeśli nie są pokazane w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/plugin mogą nadal zostać zarejestrowane, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przekroczyło limit po przycięciu; zmniejsz liczbę poleceń plugin/skill/niestandardowych albo wyłącz `channels.telegram.commands.native`.
    - Niepowodzenie `deleteWebhook`, `deleteMyCommands` lub `setMyCommands` z `404: Not Found`, podczas gdy bezpośrednie polecenia curl Bot API działają, może oznaczać, że `channels.telegram.apiRoot` ustawiono na pełny punkt końcowy `/bot<TOKEN>`. `apiRoot` musi być tylko korzeniem Bot API, a `openclaw doctor --fix` usuwa przypadkowy końcowy fragment `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Zaktualizuj `botToken`, `tokenFile` lub `TELEGRAM_BOT_TOKEN` bieżącym tokenem BotFather; OpenClaw zatrzymuje się przed odpytywaniem, więc nie jest to zgłaszane jako błąd czyszczenia webhooka.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzące DNS/HTTPS do `api.telegram.org` jest zablokowane.

    ### Polecenia parowania urządzenia (plugin `device-pair`)

    Gdy plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym rolę/zakresy)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji przenosi krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap utrzymuje token węzła głównego przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Sprawdzenia zakresów bootstrap są prefiksowane rolą, więc ta lista dozwolonych operatora spełnia tylko żądania operatora; role niebędące operatorem nadal potrzebują zakresów z własnym prefiksem roli.

    Jeśli urządzenie ponowi próbę ze zmienionymi szczegółami uwierzytelniania (na przykład rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostanie zastąpione, a nowe żądanie użyje innego `requestId`. Uruchom ponownie `/pair pending` przed zatwierdzeniem.

    Więcej szczegółów: [Parowanie](/pl/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
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

  <Accordion title="Telegram message actions for agents and automation">
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
    Wysyłki w czasie wykonywania używają aktywnego snapshotu konfiguracji/sekretów (uruchomienie/ponowne wczytanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdej wysyłce.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram obsługuje jawne tagi wątkowania odpowiedzi w wygenerowanych danych wyjściowych:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na konkretny identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` kontroluje obsługę:

    - `off` (domyślnie)
    - `first`
    - `all`

    Gdy wątkowanie odpowiedzi jest włączone i dostępny jest oryginalny tekst lub podpis Telegram, OpenClaw automatycznie dołącza natywny fragment cytatu Telegram. Telegram ogranicza natywny tekst cytatu do 1024 jednostek kodu UTF-16, więc dłuższe wiadomości są cytowane od początku i wracają do zwykłej odpowiedzi, jeśli Telegram odrzuci cytat.

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` nadal są respektowane.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Supergrupy forum:

    - klucze sesji tematu dodają `:topic:<threadId>`
    - odpowiedzi i wpisywanie są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Specjalny przypadek tematu ogólnego (`threadId=1`):

    - wysyłanie wiadomości pomija `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje wpisywania nadal zawierają `message_thread_id`

    Dziedziczenie tematu: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy wartości domyślnych grupy.

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

    **Trwałe powiązanie tematu ACP**: Tematy forum mogą przypinać sesje harness ACP przez typowane powiązania ACP najwyższego poziomu (`bindings[]` z `type: "acp"` i `match.channel: "telegram"`, `peer.kind: "group"` oraz identyfikatorem kwalifikowanym tematem, takim jak `-1001234567890:topic:42`). Obecnie zakres obejmuje tematy forum w grupach/supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Uruchamianie ACP powiązane z wątkiem z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne odpowiedzi trafiają tam bezpośrednio. OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga, aby `channels.telegram.threadBindings.spawnSessions` pozostało włączone (domyślnie: `true`).

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` zachowują routing DM i metadane odpowiedzi; używają kluczy sesji świadomych wątku tylko wtedy, gdy DM jest skonfigurowany z `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` lub pasującą konfiguracją tematu.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie notatki głosowej
    - transkrypcje przychodzących notatek głosowych są ujmowane w kontekście agenta jako wygenerowany maszynowo,
      niezaufany tekst; wykrywanie wzmianek nadal używa surowej
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

    Naklejki są opisywane raz (gdy to możliwe) i zapisywane w pamięci podręcznej, aby ograniczyć powtarzające się wywołania wizyjne.

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

    Po włączeniu OpenClaw kolejkuje zdarzenia systemowe, takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkowników na wiadomości wysłane przez bota (w miarę możliwości przez pamięć podręczną wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrole dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy spoza forum są kierowane do sesji czatu grupowego
      - grupy forum są kierowane do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla odpytywania/Webhook automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozstrzygania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - zastępcze emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji Unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji ze zdarzeń i poleceń Telegram">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grup (`migrate_to_chat_id`) aktualizujące `channels.telegram.groups`
    - `/config set` i `/config unset` (wymaga włączenia poleceń)

    Wyłączenie:

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
    Domyślnie używane jest długie odpytywanie. Dla trybu Webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalne `webhookPath`, `webhookHost`, `webhookPort` (domyślne wartości to `/telegram-webhook`, `127.0.0.1`, `8787`).

    Lokalny nasłuch wiąże się z `127.0.0.1:8787`. Dla publicznego ruchu przychodzącego umieść odwrotny serwer proxy przed lokalnym portem albo świadomie ustaw `webhookHost: "0.0.0.0"`.

    Tryb Webhook sprawdza zabezpieczenia żądania, tajny token Telegram i treść JSON przed zwróceniem `200` do Telegram.
    Następnie OpenClaw przetwarza aktualizację asynchronicznie przez te same ścieżki bota na czat/temat, których używa długie odpytywanie, więc wolne tury agenta nie blokują potwierdzenia dostarczenia Telegram.

  </Accordion>

  <Accordion title="Limity, ponowne próby i cele CLI">
    - `channels.telegram.textChunkLimit` domyślnie wynosi 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów Telegram.
    - `channels.telegram.timeoutSeconds` nadpisuje limit czasu klienta API Telegram (jeśli nie ustawiono, obowiązuje wartość domyślna grammY). Klienci botów używający długiego odpytywania ograniczają skonfigurowane wartości poniżej 45-sekundowego zabezpieczenia żądania `getUpdates`, aby bezczynne odpytywania nie były przerywane przed zakończeniem 30-sekundowego okna odpytywania.
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; dostrajaj w zakresie od `30000` do `600000` tylko w przypadku fałszywie dodatnich restartów z powodu zastoju odpytywania.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` albo `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania jest obecnie przekazywany w otrzymanej postaci.
    - listy dozwolonych Telegram przede wszystkim kontrolują, kto może wyzwolić agenta, a nie stanowią pełnej granicy maskowania dodatkowego kontekstu.
    - Kontrola historii wiadomości prywatnych:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfiguracja `channels.telegram.retry` ma zastosowanie do pomocniczych mechanizmów wysyłania Telegram (CLI/narzędzi/akcji) w przypadku możliwych do odzyskania błędów wychodzącego API. Dostarczanie końcowej odpowiedzi przychodzącej również używa ograniczonej ponownej próby bezpiecznego wysyłania dla awarii Telegram przed połączeniem, ale nie ponawia prób dla niejednoznacznych otoczek sieciowych po wysłaniu, które mogłyby zduplikować widoczne wiadomości.

    Cel wysyłki CLI może być liczbowym identyfikatorem czatu albo nazwą użytkownika:

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

    - `--presentation` z blokami `buttons` dla wbudowanych klawiatur, gdy `channels.telegram.capabilities.inlineButtons` na to pozwala
    - `--pin` albo `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać w tym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć lub przesyłek multimediów animowanych

    Kontrola akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając zwykłe wysyłanie włączone

  </Accordion>

  <Accordion title="Zatwierdzanie poleceń exec w Telegram">
    Telegram obsługuje zatwierdzanie poleceń exec w wiadomościach prywatnych do osób zatwierdzających i opcjonalnie może publikować monity w czacie lub temacie źródłowym. Identyfikatory osób zatwierdzających muszą być liczbowymi identyfikatorami użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy można rozstrzygnąć co najmniej jedną osobę zatwierdzającą)
    - `channels.telegram.execApprovals.approvers` (awaryjnie używa liczbowych identyfikatorów właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` kontrolują, kto może rozmawiać z botem i gdzie wysyła on zwykłe odpowiedzi. Nie czynią nikogo osobą zatwierdzającą exec. Pierwsze zatwierdzone parowanie w wiadomości prywatnej inicjuje `commands.ownerAllowFrom`, gdy nie istnieje jeszcze właściciel poleceń, więc konfiguracja z jednym właścicielem nadal działa bez duplikowania identyfikatorów w `execApprovals.approvers`.

    Dostarczanie do kanału pokazuje tekst polecenia na czacie; włączaj `channel` albo `both` tylko w zaufanych grupach/tematach. Gdy monit trafia do tematu forum, OpenClaw zachowuje temat dla monitu zatwierdzenia i odpowiedzi następczej. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Wbudowane przyciski zatwierdzania również wymagają, aby `channels.telegram.capabilities.inlineButtons` zezwalało na obszar docelowy (`dm`, `group` albo `all`). Identyfikatory zatwierdzeń z prefiksem `plugin:` są rozstrzygane przez zatwierdzenia Plugin; pozostałe najpierw przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrola odpowiedzi z błędami

Gdy agent napotka błąd dostarczania lub dostawcy, Telegram może odpowiedzieć tekstem błędu albo go wyciszyć. Tym zachowaniem sterują dwa klucze konfiguracji:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                                  |
| ----------------------------------- | ----------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła przyjazny komunikat błędu na czat. `silent` całkowicie wycisza odpowiedzi z błędami. |
| `channels.telegram.errorCooldownMs` | liczba (ms)       | `60000`   | Minimalny czas między odpowiedziami z błędami do tego samego czatu. Zapobiega spamowi błędami podczas awarii. |

Obsługiwane są nadpisania na poziomie konta, grupy i tematu (takie samo dziedziczenie jak w przypadku innych kluczy konfiguracji Telegram).

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
      - następnie usuń i ponownie dodaj bota do grupy
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzić jawne liczbowe identyfikatory grup; nie można sprawdzić członkostwa dla symbolu wieloznacznego `"*"`.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (albo zawierać `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow` pod kątem powodów pominięcia

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj tożsamość nadawcy (parowanie i/lub liczbowe `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy zasada grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele wpisów; zmniejsz liczbę poleceń Plugin, Skills lub niestandardowych albo wyłącz natywne menu
    - Wywołania startowe `deleteMyCommands` / `setMyCommands` są ograniczone i ponawiają próbę raz przez awaryjny transport Telegram po przekroczeniu limitu czasu żądania. Utrzymujące się błędy sieci/pobierania zwykle wskazują na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Uruchamianie zgłasza nieautoryzowany token">

    - `getMe returned 401` jest błędem uwierzytelniania Telegram dla skonfigurowanego tokenu bota.
    - Skopiuj ponownie albo wygeneruj ponownie token bota w BotFather, a następnie zaktualizuj `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` albo `TELEGRAM_BOT_TOKEN` dla konta domyślnego.
    - `deleteWebhook 401 Unauthorized` podczas uruchamiania także jest błędem uwierzytelniania; potraktowanie go jako „brak Webhook” tylko odroczyłoby ten sam błąd złego tokenu do późniejszych wywołań API.
    - Jeśli `deleteWebhook` zakończy się przejściowym błędem sieci podczas uruchamiania odpytywania, OpenClaw sprawdza `getWebhookInfo`; gdy Telegram zgłasza pusty adres URL Webhook, odpytywanie jest kontynuowane, ponieważ czyszczenie jest już spełnione.

  </Accordion>

  <Accordion title="Niestabilność odpytywania lub sieci">

    - Node 22+ + niestandardowy fetch/proxy może wywołać natychmiastowe przerwanie, jeśli typy AbortSignal są niezgodne.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` do IPv6; uszkodzony ruch wychodzący IPv6 może powodować sporadyczne awarie API Telegram.
    - Jeśli logi zawierają `TypeError: fetch failed` lub `Network request for 'getUpdates' failed!`, OpenClaw ponawia teraz te operacje jako możliwe do odzyskania błędy sieciowe.
    - Jeśli gniazda Telegram są odnawiane w krótkim, stałym cyklu, sprawdź, czy `channels.telegram.timeoutSeconds` nie jest niskie; klienci botów z long pollingiem ograniczają skonfigurowane wartości poniżej zabezpieczenia żądania `getUpdates`, ale starsze wydania mogły przerywać każde odpytywanie, gdy ustawiono tę wartość poniżej limitu czasu long pollingu.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw domyślnie restartuje odpytywanie i odbudowuje transport Telegram po 120 sekundach bez ukończonej kontroli żywotności long pollingu.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy uruchomione konto odpytywania nie ukończyło `getUpdates` po okresie karencji uruchamiania, gdy uruchomione konto webhooka nie ukończyło `setWebhook` po okresie karencji uruchamiania albo gdy ostatnia udana aktywność transportu odpytywania jest nieaktualna.
    - Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są poprawne, ale host nadal zgłasza fałszywe restarty z powodu zatrzymania odpytywania. Utrzymujące się zatrzymania zwykle wskazują na problemy z proxy, DNS, IPv6 lub ruchem wychodzącym TLS między hostem a `api.telegram.org`.
    - Telegram uwzględnia też zmienne środowiskowe proxy procesu dla transportu Bot API, w tym `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` oraz ich warianty małymi literami. `NO_PROXY` / `no_proxy` nadal mogą omijać `api.telegram.org`.
    - Jeśli zarządzane proxy OpenClaw jest skonfigurowane przez `OPENCLAW_PROXY_URL` dla środowiska usługi i nie ma standardowych zmiennych środowiskowych proxy, Telegram używa tego URL-a także dla transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS kieruj wywołania API Telegram przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (poza WSL2). Kolejność wyników DNS Telegram uwzględnia najpierw `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, potem `channels.telegram.network.dnsResultOrder`, a następnie domyślne ustawienie procesu, takie jak `NODE_OPTIONS=--dns-result-order=ipv4first`; jeśli żadne nie ma zastosowania, Node 22+ wraca do `ipv4first`.
    - Jeśli host działa w WSL2 albo wyraźnie lepiej działa przy zachowaniu tylko IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania multimediów Telegram. Jeśli zaufany fake-IP lub
      transparentne proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/specjalnego użycia adres podczas pobierania multimediów, możesz
      włączyć obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo włączenie jest dostępne dla konta pod adresem
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli proxy rozwiązuje hosty multimediów Telegram do `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie zezwalają na zakres
      benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia
      SSRF multimediów Telegram. Używaj tego tylko w zaufanych środowiskach proxy
      kontrolowanych przez operatora, takich jak routing fake-IP Clash, Mihomo lub Surge, gdy
      syntetyzują odpowiedzi prywatne albo specjalnego użycia spoza zakresu benchmarkowego
      RFC 2544. Pozostaw wyłączone dla zwykłego publicznego dostępu do Telegram przez internet.
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
- wątki/odpowiedzi: `replyToMode`
- strumieniowanie: `streaming` (podgląd), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- niestandardowy główny adres API: `apiRoot` (tylko główny adres Bot API; nie dołączaj `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Pierwszeństwo wielu kont: gdy skonfigurowano dwa lub więcej identyfikatorów kont, ustaw `channels.telegram.defaultAccount` (albo dołącz `channels.telegram.accounts.default`), aby jawnie określić domyślne trasowanie. W przeciwnym razie OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` ostrzega. Nazwane konta dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Telegram z gatewayem.
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
    Mapuj grupy i tematy do agentów.
  </Card>
  <Card title="Rozwiązywanie problemów" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka między kanałami.
  </Card>
</CardGroup>
