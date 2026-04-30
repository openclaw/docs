---
read_when:
    - Praca nad funkcjami Telegram lub webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-04-30T16:27:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d18ca6c7ab39d7d34848c562857661501d8364329f6e5a266213aa23846047dd
    source_path: channels/telegram.md
    workflow: 16
---

Gotowe do produkcji dla wiadomości prywatnych botów i grup za pośrednictwem grammY. Domyślnym trybem jest długie odpytywanie; tryb webhook jest opcjonalny.

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
    Otwórz Telegram i rozpocznij rozmowę z **@BotFather** (upewnij się, że nazwa to dokładnie `@BotFather`).

    Uruchom `/newbot`, postępuj zgodnie z instrukcjami i zapisz token.

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

    Awaryjne ustawienie środowiskowe: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
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
Kolejność rozstrzygania tokenu uwzględnia konto. W praktyce wartości konfiguracyjne mają pierwszeństwo przed awaryjnym ustawieniem środowiskowym, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność grup">
    Boty Telegram domyślnie używają **trybu prywatności**, który ogranicza wiadomości grupowe, jakie otrzymują.

    Jeśli bot musi widzieć wszystkie wiadomości grupowe, wykonaj jedną z tych czynności:

    - wyłącz tryb prywatności przez `/setprivacy`, lub
    - ustaw bota jako administratora grupy.

    Po przełączeniu trybu prywatności usuń i ponownie dodaj bota w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty administracyjne otrzymują wszystkie wiadomości grupowe, co jest przydatne w przypadku stale aktywnego zachowania grupowego.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić/zabronić dodawania do grup
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka wiadomości prywatnych">
    `channels.telegram.dmPolicy` kontroluje dostęp przez wiadomości prywatne:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego ID nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` pozwala dowolnemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, wydawać mu polecenia. Używaj tego tylko dla celowo publicznych botów z mocno ograniczonymi narzędziami; boty z jednym właścicielem powinny używać `allowlist` z liczbowymi ID użytkowników.

    `channels.telegram.allowFrom` przyjmuje liczbowe ID użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach wielokontowych restrykcyjne `channels.telegram.allowFrom` na najwyższym poziomie jest traktowane jako granica bezpieczeństwa: wpisy `allowFrom: ["*"]` na poziomie konta nie czynią tego konta publicznym, chyba że efektywna lista dozwolonych kont nadal zawiera jawny symbol wieloznaczny po scaleniu.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie wiadomości prywatne i jest odrzucane przez walidację konfiguracji.
    Konfiguracja pyta tylko o liczbowe ID użytkowników.
    Jeśli wykonano aktualizację, a konfiguracja zawiera wpisy listy dozwolonych `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (best-effort; wymaga tokenu bota Telegram).
    Jeśli wcześniej polegano na plikach listy dozwolonych magazynu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach listy dozwolonych (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych ID).

    W przypadku botów z jednym właścicielem preferuj `dmPolicy: "allowlist"` z jawnymi liczbowymi ID `allowFrom`, aby polityka dostępu była trwała w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnych nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp przez wiadomości prywatne. Jeśli właściciel poleceń jeszcze nie istnieje, pierwsze zatwierdzone parowanie ustawia również `commands.ownerAllowFrom`, aby polecenia tylko dla właściciela i zatwierdzenia wykonywania miały jawne konto operatora.
    Autoryzacja nadawcy w grupie nadal pochodzi z jawnych list dozwolonych w konfiguracji.
    Jeśli chcesz „autoryzuję się raz i działają zarówno wiadomości prywatne, jak i polecenia grupowe”, umieść swoje liczbowe ID użytkownika Telegram w `channels.telegram.allowFrom`; w przypadku poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

    ### Znajdowanie ID użytkownika Telegram

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
         - z `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako lista dozwolonych (jawne ID lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` jest używane do filtrowania nadawców w grupach. Jeśli nie jest ustawione, Telegram wraca do `allowFrom`.
    Wpisy `groupAllowFrom` powinny być liczbowymi ID użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj ID czatów grup Telegram ani supergrup w `groupAllowFrom`. Ujemne ID czatów należą do `channels.telegram.groups`.
    Wpisy nieliczbowe są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawcy w grupie **nie** dziedziczy zatwierdzeń z magazynu parowania wiadomości prywatnych.
    Parowanie pozostaje tylko dla wiadomości prywatnych. Dla grup ustaw `groupAllowFrom` albo `allowFrom` dla konkretnej grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram wraca do konfiguracyjnego `allowFrom`, a nie do magazynu parowania.
    Praktyczny wzorzec dla botów z jednym właścicielem: ustaw swoje ID użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na docelowe grupy w `channels.telegram.groups`.
    Uwaga dotycząca działania: jeśli `channels.telegram` całkowicie brakuje, środowisko uruchomieniowe domyślnie zamyka dostęp, ustawiając `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest jawnie ustawione.

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

      - Umieść ujemne ID czatów grup Telegram lub supergrup, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieść ID użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą wyzwalać bota.
      - Użyj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.

    </Warning>

  </Tab>

  <Tab title="Zachowanie wzmianek">
    Odpowiedzi grupowe domyślnie wymagają wzmianki.

    Wzmianka może pochodzić z:

    - natywnej wzmianki `@botusername`, lub
    - wzorców wzmianek w:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Przełączniki poleceń na poziomie sesji:

    - `/activation always`
    - `/activation mention`

    Aktualizują one tylko stan sesji. Użyj konfiguracji, aby zachować trwałość.

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

## Zachowanie w czasie działania

- Telegram należy do procesu gateway.
- Routing jest deterministyczny: wiadomości przychodzące z Telegram odpowiadają z powrotem do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi i placeholderami multimediów.
- Sesje grupowe są izolowane według ID grupy. Tematy forum dodają `:topic:<threadId>`, aby utrzymać izolację tematów.
- Wiadomości prywatne mogą zawierać `message_thread_id`; OpenClaw kieruje je z kluczami sesji świadomymi wątków i zachowuje ID wątku dla odpowiedzi.
- Długie odpytywanie używa runnera grammY z sekwencjonowaniem według czatu/wątku. Ogólna współbieżność ujścia runnera używa `agents.defaults.maxConcurrent`.
- Długie odpytywanie jest chronione wewnątrz każdego procesu gateway, aby tylko jeden aktywny poller mógł używać tokenu bota w danym momencie. Jeśli nadal widzisz konflikty `getUpdates` 409, prawdopodobnie ten sam token jest używany przez inny gateway OpenClaw, skrypt lub zewnętrzny poller.
- Restarty watchdog długiego odpytywania domyślnie uruchamiają się po 120 sekundach bez ukończonej żywotności `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy wdrożenie nadal doświadcza fałszywych restartów z powodu zatrzymania odpytywania podczas długotrwałej pracy. Wartość jest podawana w milisekundach i jest dozwolona w zakresie od `30000` do `600000`; obsługiwane są nadpisania dla poszczególnych kont.
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
    - starsze `channels.telegram.streamMode` i logiczne wartości `streaming` są wykrywane; uruchom `openclaw doctor --fix`, aby przenieść je do `channels.telegram.streaming.mode`

    Aktualizacje podglądu postępu narzędzi to krótkie wiersze „Working...” wyświetlane podczas działania narzędzi, na przykład wykonywania poleceń, odczytów plików, aktualizacji planowania lub podsumowań poprawek. Telegram domyślnie pozostawia je włączone, aby odpowiadały zachowaniu wydanego OpenClaw od `v2026.4.22` i nowszych wersji. Aby zachować edytowany podgląd tekstu odpowiedzi, ale ukryć wiersze postępu narzędzi, ustaw:

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

    Użyj `streaming.mode: "off"` tylko wtedy, gdy chcesz dostarczania wyłącznie finalnych odpowiedzi: edycje podglądu Telegram są wyłączone, a ogólne komunikaty narzędzi/postępu są tłumione zamiast wysyłania ich jako samodzielnych wiadomości „Working...”. Monity zatwierdzania, ładunki multimedialne i błędy nadal są kierowane przez normalne finalne dostarczanie. Użyj `streaming.preview.toolProgress: false`, gdy chcesz zachować tylko edycje podglądu odpowiedzi, jednocześnie ukrywając wiersze statusu postępu narzędzi.

    Dla odpowiedzi zawierających tylko tekst:

    - krótkie podglądy DM/grupy/tematu: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu
    - podglądy starsze niż około minuta: OpenClaw wysyła ukończoną odpowiedź jako nową wiadomość końcową, a następnie czyści podgląd, więc widoczny znacznik czasu Telegram odzwierciedla czas ukończenia zamiast czasu utworzenia podglądu

    W przypadku złożonych odpowiedzi (na przykład ładunków multimedialnych) OpenClaw wraca do normalnego dostarczenia końcowego, a następnie czyści wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielne od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - odpowiedź końcowa jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i awaryjne użycie HTML">
    Tekst wychodzący używa Telegram `parse_mode: "HTML"`.

    - Tekst podobny do Markdown jest renderowany do HTML bezpiecznego dla Telegram.
    - Surowy HTML modelu jest escapowany, aby ograniczyć błędy parsowania Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponawia próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć za pomocą `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Polecenia natywne i polecenia niestandardowe">
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
    - polecenia plugin/skill nadal mogą działać po wpisaniu, nawet jeśli nie są widoczne w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/plugin mogą nadal zostać zarejestrowane, jeśli są skonfigurowane.

    Częste błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przepełniło się po przycięciu; zmniejsz liczbę poleceń plugin/skill/niestandardowych albo wyłącz `channels.telegram.commands.native`.
    - Niepowodzenie `deleteWebhook`, `deleteMyCommands` lub `setMyCommands` z `404: Not Found`, gdy bezpośrednie polecenia curl Bot API działają, może oznaczać, że `channels.telegram.apiRoot` ustawiono na pełny endpoint `/bot<TOKEN>`. `apiRoot` musi być tylko korzeniem Bot API, a `openclaw doctor --fix` usuwa przypadkowy końcowy `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Zaktualizuj `botToken`, `tokenFile` lub `TELEGRAM_BOT_TOKEN` przy użyciu aktualnego tokenu BotFather; OpenClaw zatrzymuje się przed odpytywaniem, więc nie jest to raportowane jako błąd czyszczenia webhooka.
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

    Kod konfiguracji przenosi krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap utrzymuje token węzła głównego przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Kontrole zakresów bootstrap mają prefiks roli, więc ta lista dozwolonych operatora spełnia tylko żądania operatora; role inne niż operator nadal potrzebują zakresów z własnym prefiksem roli.

    Jeśli urządzenie ponowi próbę ze zmienionymi szczegółami uwierzytelniania (na przykład rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostanie zastąpione, a nowe żądanie użyje innego `requestId`. Uruchom ponownie `/pair pending` przed zatwierdzeniem.

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
    Wysyłki w czasie działania używają aktywnego zrzutu konfiguracji/secretów (uruchomienie/przeładowanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdej wysyłce.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątkowania odpowiedzi">
    Telegram obsługuje jawne tagi wątkowania odpowiedzi w wygenerowanym wyjściu:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na konkretny identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` steruje obsługą:

    - `off` (domyślnie)
    - `first`
    - `all`

    Gdy wątkowanie odpowiedzi jest włączone i oryginalny tekst lub podpis Telegram jest dostępny, OpenClaw automatycznie dołącza natywny cytat Telegram. Telegram ogranicza natywny tekst cytatu do 1024 jednostek kodu UTF-16, więc dłuższe wiadomości są cytowane od początku i wracają do zwykłej odpowiedzi, jeśli Telegram odrzuci cytat.

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal respektowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematu dodają `:topic:<threadId>`
    - odpowiedzi i wpisywanie są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Szczególny przypadek tematu ogólnego (`threadId=1`):

    - wysyłki wiadomości pomijają `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje wpisywania nadal zawierają `message_thread_id`

    Dziedziczenie tematu: wpisy tematu dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy z domyślnych ustawień grupy.

    **Routing agenta per temat**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własną izolowaną przestrzeń roboczą, pamięć i sesję. Przykład:

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

    **Utworzenie ACP powiązane z wątkiem z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; dalsze wiadomości trafiają tam bezpośrednio. OpenClaw przypina potwierdzenie utworzenia w temacie. Wymaga `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` zachowują routing DM, ale używają kluczy sesji świadomych wątku.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie jako notatki głosowej
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

    Plik cache naklejek:

    - `~/.openclaw/telegram/sticker-cache.json`

    Naklejki są opisywane raz (gdy to możliwe) i cache'owane, aby ograniczyć powtarzane wywołania wizji.

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

    Wyszukaj cache'owane naklejki:

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

    Gdy są włączone, OpenClaw kolejkowuje zdarzenia systemowe takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkowników na wiadomości wysłane przez bota (najlepszym staraniem przez pamięć podręczną wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrolę dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy niebędące forum trafiają do sesji czatu grupowego
      - grupy forum trafiają do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla odpytywania/webhook obejmuje `message_reaction` automatycznie.

  </Accordion>

  <Accordion title="Reakcje potwierdzenia">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

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

    - zdarzenia migracji grup (`migrate_to_chat_id`) w celu aktualizacji `channels.telegram.groups`
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

  <Accordion title="Długie odpytywanie kontra webhook">
    Domyślnie używane jest długie odpytywanie. Dla trybu webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (domyślnie `/telegram-webhook`, `127.0.0.1`, `8787`).

    Lokalny odbiornik wiąże się z `127.0.0.1:8787`. Dla publicznego ruchu przychodzącego umieść odwrotne proxy przed lokalnym portem albo celowo ustaw `webhookHost: "0.0.0.0"`.

    Tryb webhook weryfikuje zabezpieczenia żądania, tajny token Telegram oraz treść JSON przed zwróceniem `200` do Telegram.
    OpenClaw następnie przetwarza aktualizację asynchronicznie przez te same pasy bota dla czatu/tematu, których używa długie odpytywanie, więc wolne tury agenta nie wstrzymują ACK dostarczenia Telegram.

  </Accordion>

  <Accordion title="Limity, ponawianie i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów Telegram.
    - `channels.telegram.timeoutSeconds` nadpisuje limit czasu klienta API Telegram (jeśli nie jest ustawione, obowiązuje domyślna wartość grammY). Klienci botów z długim odpytywaniem ograniczają skonfigurowane wartości poniżej 45-sekundowego zabezpieczenia żądania `getUpdates`, aby bezczynne odpytywania nie były przerywane przed ukończeniem 30-sekundowego okna odpytywania.
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; dostrajaj w zakresie od `30000` do `600000` tylko w przypadku fałszywie dodatnich restartów po zastoju odpytywania.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` albo `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania jest obecnie przekazywany w otrzymanej postaci.
    - listy dozwolonych Telegram przede wszystkim ograniczają, kto może wyzwolić agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.
    - Kontrole historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfiguracja `channels.telegram.retry` dotyczy pomocników wysyłania Telegram (CLI/narzędzia/akcje) dla możliwych do odzyskania błędów wychodzącego API. Dostarczenie końcowej odpowiedzi przychodzącej również używa ograniczonego ponowienia bezpiecznego wysyłania dla błędów Telegram przed połączeniem, ale nie ponawia niejednoznacznych obwiedni sieciowych po wysłaniu, które mogłyby zduplikować widoczne wiadomości.

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
    - `--force-document`, aby wysyłać wychodzące obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć albo przesyłek animowanych multimediów

    Bramkowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając zwykłe wysyłki włączone

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM osób zatwierdzających i opcjonalnie może publikować monity w czacie lub temacie źródłowym. Osoby zatwierdzające muszą być numerycznymi identyfikatorami użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy co najmniej jedna osoba zatwierdzająca jest rozwiązywalna)
    - `channels.telegram.execApprovals.approvers` (wraca do numerycznych identyfikatorów właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` kontrolują, kto może rozmawiać z botem i gdzie wysyła on zwykłe odpowiedzi. Nie czynią nikogo osobą zatwierdzającą exec. Pierwsze zatwierdzone parowanie DM inicjuje `commands.ownerAllowFrom`, gdy właściciel poleceń jeszcze nie istnieje, więc konfiguracja z jednym właścicielem nadal działa bez duplikowania identyfikatorów w `execApprovals.approvers`.

    Dostarczanie do kanału pokazuje tekst polecenia w czacie; włączaj `channel` albo `both` tylko w zaufanych grupach/tematach. Gdy monit trafia do tematu forum, OpenClaw zachowuje temat dla monitu zatwierdzenia i wiadomości uzupełniającej. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline wymagają też, aby `channels.telegram.capabilities.inlineButtons` pozwalało na powierzchnię docelową (`dm`, `group` albo `all`). Identyfikatory zatwierdzeń z prefiksem `plugin:` są rozwiązywane przez zatwierdzenia Plugin; pozostałe najpierw przez zatwierdzenia exec.

    Zobacz [zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrole odpowiedzi błędów

Gdy agent napotka błąd dostarczenia lub dostawcy, Telegram może odpowiedzieć tekstem błędu albo go wyciszyć. To zachowanie kontrolują dwa klucze konfiguracji:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                                           |
| ----------------------------------- | ----------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła przyjazną wiadomość błędu do czatu. `silent` całkowicie wycisza odpowiedzi błędów.              |
| `channels.telegram.errorCooldownMs` | liczba (ms)       | `60000`   | Minimalny czas między odpowiedziami błędów do tego samego czatu. Zapobiega spamowi błędami podczas awarii.     |

Obsługiwane są nadpisania na poziomie konta, grupy i tematu (takie samo dziedziczenie jak dla innych kluczy konfiguracji Telegram).

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
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne identyfikatory grup; członkostwa dla symbolu wieloznacznego `"*"` nie można sprawdzić.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (albo zawierać `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow`, aby znaleźć powody pominięcia

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj swoją tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy polityka grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele wpisów; zmniejsz liczbę poleceń Plugin/Skills/niestandardowych albo wyłącz natywne menu
    - wywołania startowe `deleteMyCommands` / `setMyCommands` są ograniczone i ponawiane raz przez awaryjny transport Telegram przy przekroczeniu limitu czasu żądania. Utrzymujące się błędy sieci/fetch zwykle wskazują problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Uruchamianie zgłasza nieautoryzowany token">

    - `getMe returned 401` to błąd uwierzytelniania Telegram dla skonfigurowanego tokena bota.
    - Skopiuj ponownie albo wygeneruj ponownie token bota w BotFather, a następnie zaktualizuj `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` albo `TELEGRAM_BOT_TOKEN` dla konta domyślnego.
    - `deleteWebhook 401 Unauthorized` podczas uruchamiania również jest błędem uwierzytelniania; potraktowanie go jako "brak istniejącego webhooka" tylko odłożyłoby tę samą awarię złego tokena do późniejszych wywołań API.
    - Jeśli `deleteWebhook` nie powiedzie się z przejściowym błędem sieci podczas uruchamiania odpytywania, OpenClaw sprawdza `getWebhookInfo`; gdy Telegram zgłasza pusty URL webhooka, odpytywanie jest kontynuowane, ponieważ czyszczenie jest już spełnione.

  </Accordion>

  <Accordion title="Niestabilność odpytywania lub sieci">

    - Node 22+ + niestandardowy fetch/proxy może wywoływać natychmiastowe przerwanie, jeśli typy AbortSignal są niezgodne.
    - Niektórzy dostawcy hostingu najpierw rozwiązują `api.telegram.org` na IPv6; uszkodzony ruch wychodzący IPv6 może powodować sporadyczne awarie Telegram API.
    - Jeśli logi zawierają `TypeError: fetch failed` albo `Network request for 'getUpdates' failed!`, OpenClaw ponawia teraz te błędy jako możliwe do odzyskania błędy sieciowe.
    - Jeśli gniazda Telegram są odnawiane w krótkim, stałym cyklu, sprawdź, czy `channels.telegram.timeoutSeconds` nie ma niskiej wartości; klienci botów używający długiego odpytywania ograniczają skonfigurowane wartości poniżej zabezpieczenia żądania `getUpdates`, ale starsze wydania mogły przerywać każde odpytywanie, gdy ta wartość była ustawiona poniżej limitu czasu długiego odpytywania.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw domyślnie restartuje odpytywanie i odbudowuje transport Telegram po 120 sekundach bez zakończonego sprawdzenia żywotności długiego odpytywania.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy uruchomione konto odpytywania nie zakończyło `getUpdates` po początkowym okresie karencji, gdy uruchomione konto webhooka nie zakończyło `setWebhook` po początkowym okresie karencji albo gdy ostatnia pomyślna aktywność transportu odpytywania jest nieaktualna.
    - Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długo działające wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zastoju odpytywania. Uporczywe zastoje zwykle wskazują na problemy z proxy, DNS, IPv6 albo ruchem wychodzącym TLS między hostem a `api.telegram.org`.
    - Telegram honoruje też zmienne środowiskowe proxy procesu dla transportu Bot API, w tym `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` oraz ich warianty pisane małymi literami. `NO_PROXY` / `no_proxy` nadal mogą omijać `api.telegram.org`.
    - Jeśli zarządzane proxy OpenClaw jest skonfigurowane przez `OPENCLAW_PROXY_URL` dla środowiska usługi i nie ma standardowej zmiennej środowiskowej proxy, Telegram używa tego URL-a również dla transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS kieruj wywołania Telegram API przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2) i `dnsResultOrder=ipv4first`.
    - Jeśli host działa w WSL2 albo wyraźnie działa lepiej w trybie tylko IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu testów porównawczych RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania multimediów Telegram. Jeśli zaufane fake-IP albo
      przezroczyste proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/specjalnego użycia adres podczas pobierania multimediów, możesz włączyć
      obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo ustawienie opt-in jest dostępne dla każdego konta pod
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli proxy rozwiązuje hosty multimediów Telegram na `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie zezwalają na zakres
      testów porównawczych RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia
      SSRF dla multimediów Telegram. Używaj tego tylko w zaufanych, kontrolowanych przez operatora środowiskach proxy,
      takich jak routing fake-IP Clash, Mihomo albo Surge, gdy syntetyzują one
      prywatne lub specjalnego użycia odpowiedzi spoza zakresu testów porównawczych RFC 2544.
      Pozostaw to wyłączone dla zwykłego publicznego dostępu Telegram przez internet.
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
- zatwierdzenia wykonywania: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- przesyłanie strumieniowe: `streaming` (podgląd), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- niestandardowy główny adres API: `apiRoot` (tylko główny adres Bot API; nie dodawaj `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Pierwszeństwo wielu kont: gdy skonfigurowane są dwa lub więcej identyfikatorów kont, ustaw `channels.telegram.defaultAccount` (albo dodaj `channels.telegram.accounts.default`), aby domyślny routing był jawny. W przeciwnym razie OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` wyświetla ostrzeżenie. Nazwane konta dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
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
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Routing wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj grupy i tematy do agentów.
  </Card>
  <Card title="Rozwiązywanie problemów" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa.
  </Card>
</CardGroup>
