---
read_when:
    - Praca nad funkcjami Telegram lub Webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-04-24T09:00:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdd6ea0277e074f90306f91d51fd329c6914de85dde0ae09a731713f1bba98d9
    source_path: channels/telegram.md
    workflow: 15
---

Gotowe do użycia produkcyjnego dla wiadomości prywatnych bota i grup przez grammY. Domyślnym trybem jest long polling; tryb Webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną polityką wiadomości prywatnych dla Telegram jest parowanie.
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
    Otwórz Telegram i rozpocznij czat z **@BotFather** (upewnij się, że identyfikator to dokładnie `@BotFather`).

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

    Zmienna środowiskowa zapasowa: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w config/env, a następnie uruchom Gateway.

  </Step>

  <Step title="Uruchom Gateway i zatwierdź pierwszą wiadomość prywatną">

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
Kolejność rozwiązywania tokenu uwzględnia konto. W praktyce wartości z konfiguracji mają pierwszeństwo przed zmiennymi środowiskowymi, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność w grupach">
    Boty Telegram domyślnie działają w **Trybie prywatności**, który ogranicza, jakie wiadomości grupowe otrzymują.

    Jeśli bot ma widzieć wszystkie wiadomości grupowe, wykonaj jedną z tych czynności:

    - wyłącz tryb prywatności przez `/setprivacy`, lub
    - nadaj botowi uprawnienia administratora grupy.

    Po przełączeniu trybu prywatności usuń bota i dodaj go ponownie w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty z uprawnieniami administratora otrzymują wszystkie wiadomości grupowe, co jest przydatne przy zachowaniu grupy działającym zawsze.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić na dodawanie do grup lub je zablokować
    - `/setprivacy`, aby sterować widocznością w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka wiadomości prywatnych">
    `channels.telegram.dmPolicy` steruje dostępem do wiadomości prywatnych:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` akceptuje numeryczne identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie wiadomości prywatne i jest odrzucane przez walidację konfiguracji.
    Konfiguracja wymaga wyłącznie numerycznych identyfikatorów użytkowników.
    Jeśli po aktualizacji w konfiguracji masz wpisy allowlisty w postaci `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (best-effort; wymaga tokenu bota Telegram).
    Jeśli wcześniej polegałeś na plikach allowlisty ze store parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach allowlisty (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    Dla botów z jednym właścicielem preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi identyfikatorami `allowFrom`, aby polityka dostępu była trwale zapisana w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnej nie oznacza „ten nadawca jest wszędzie autoryzowany”.
    Parowanie przyznaje dostęp tylko do wiadomości prywatnych. Autoryzacja nadawców w grupach nadal pochodzi wyłącznie z jawnych allowlist w konfiguracji.
    Jeśli chcesz, aby „po jednokrotnej autoryzacji działały zarówno wiadomości prywatne, jak i polecenia grupowe”, umieść swój numeryczny identyfikator użytkownika Telegram w `channels.telegram.allowFrom`.

    ### Jak znaleźć swój identyfikator użytkownika Telegram

    Bezpieczniejsza metoda (bez bota zewnętrznego):

    1. Wyślij wiadomość prywatną do swojego bota.
    2. Uruchom `openclaw logs --follow`.
    3. Odczytaj `from.id`.

    Oficjalna metoda Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metoda zewnętrzna (mniej prywatna): `@userinfobot` lub `@getidsbot`.

  </Tab>

  <Tab title="Polityka grup i allowlisty">
    Obowiązują jednocześnie dwa mechanizmy kontroli:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - przy `groupPolicy: "open"`: każda grupa może przejść weryfikację identyfikatora grupy
         - przy `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów do `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako allowlista (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców w grupach. Jeśli nie jest ustawione, Telegram wraca do `allowFrom`.
    Wpisy `groupAllowFrom` powinny być numerycznymi identyfikatorami użytkowników Telegram (`telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów grup ani supergrup Telegram w `groupAllowFrom`. Ujemne identyfikatory czatu należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawców.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawców grupowych **nie** dziedziczy zatwierdzeń ze store parowania dla wiadomości prywatnych.
    Parowanie pozostaje ograniczone do wiadomości prywatnych. Dla grup ustaw `groupAllowFrom` lub `allowFrom` per grupa/per temat.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram wraca do `allowFrom` z konfiguracji, a nie do store parowania.
    Praktyczny wzorzec dla botów z jednym właścicielem: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na docelowe grupy w `channels.telegram.groups`.
    Uwaga wykonawcza: jeśli `channels.telegram` jest całkowicie nieobecne, środowisko wykonawcze domyślnie stosuje bezpieczne blokowanie `groupPolicy="allowlist"`, chyba że jawnie ustawiono `channels.defaults.groupPolicy`.

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
      Częsty błąd: `groupAllowFrom` nie jest allowlistą grup Telegram.

      - Umieszczaj ujemne identyfikatory grup lub supergrup Telegram, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieszczaj identyfikatory użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą wywoływać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby każdy członek dozwolonej grupy mógł rozmawiać z botem.
    </Warning>

  </Tab>

  <Tab title="Zachowanie wzmianek">
    Odpowiedzi w grupach domyślnie wymagają wzmianki.

    Wzmianka może pochodzić z:

    - natywnej wzmianki `@botusername`, lub
    - wzorców wzmianki w:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Przełączniki poleceń na poziomie sesji:

    - `/activation always`
    - `/activation mention`

    Aktualizują one tylko stan sesji. Dla trwałości użyj konfiguracji.

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

    Jak uzyskać identyfikator czatu grupowego:

    - przekaż wiadomość z grupy do `@userinfobot` / `@getidsbot`
    - albo odczytaj `chat.id` z `openclaw logs --follow`
    - albo sprawdź `getUpdates` Bot API

  </Tab>
</Tabs>

## Zachowanie w czasie działania

- Telegram jest obsługiwany przez proces Gateway.
- Routing jest deterministyczny: przychodzące wiadomości Telegram otrzymują odpowiedzi z powrotem w Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do współdzielonej koperty kanału z metadanymi odpowiedzi i placeholderami multimediów.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dopisują `:topic:<threadId>`, aby zachować izolację tematów.
- Wiadomości prywatne mogą zawierać `message_thread_id`; OpenClaw kieruje je przy użyciu kluczy sesji uwzględniających wątek i zachowuje identyfikator wątku dla odpowiedzi.
- Long polling używa grammY runner z sekwencjonowaniem per czat/per wątek. Ogólna współbieżność sink runnera używa `agents.defaults.maxConcurrent`.
- Restart watchdoga long pollingu jest wyzwalany domyślnie po 120 sekundach bez zakończonego sygnału żywotności `getUpdates`. Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy w twoim wdrożeniu nadal pojawiają się fałszywe restarty z powodu zastoju pollingu podczas długotrwałej pracy. Wartość jest podawana w milisekundach i może wynosić od `30000` do `600000`; obsługiwane są nadpisania per konto.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Dokumentacja funkcji

<AccordionGroup>
  <Accordion title="Podgląd transmisji na żywo (edycje wiadomości)">
    OpenClaw może strumieniowo wysyłać częściowe odpowiedzi w czasie rzeczywistym:

    - czaty prywatne: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` ma wartość `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` jest mapowane do `partial` w Telegram (zgodność z nazewnictwem międzykanałowym)
    - `streaming.preview.toolProgress` określa, czy aktualizacje narzędzi/postępu mają ponownie używać tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.
    - starsze `channels.telegram.streamMode` i logiczne wartości `streaming` są mapowane automatycznie

    Dla odpowiedzi zawierających tylko tekst:

    - wiadomość prywatna: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)
    - grupa/temat: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)

    Dla odpowiedzi złożonych (na przykład ładunków multimedialnych) OpenClaw wraca do zwykłego końcowego dostarczenia, a następnie czyści wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielone od strumieniowania blokowego. Gdy dla Telegram jawnie włączono strumieniowanie blokowe, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Jeśli natywny transport roboczy jest niedostępny/odrzucony, OpenClaw automatycznie wraca do `sendMessage` + `editMessageText`.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - końcowa odpowiedź jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i zapasowy tryb HTML">
    Tekst wychodzący używa w Telegram `parse_mode: "HTML"`.

    - Tekst w stylu Markdown jest renderowany do bezpiecznego dla Telegram HTML.
    - Surowy HTML modelu jest escapowany, aby ograniczyć błędy parsowania Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponawia próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć przez `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Natywne polecenia i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana przy uruchamianiu przez `setMyCommands`.

    Domyślne ustawienia natywnych poleceń:

    - `commands.native: "auto"` włącza natywne polecenia dla Telegram

    Dodawanie niestandardowych wpisów do menu poleceń:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Kopia zapasowa Git" },
        { command: "generate", description: "Utwórz obraz" },
      ],
    },
  },
}
```

    Zasady:

    - nazwy są normalizowane (usunięcie początkowego `/`, małe litery)
    - prawidłowy wzorzec: `a-z`, `0-9`, `_`, długość `1..32`
    - polecenia niestandardowe nie mogą nadpisywać poleceń natywnych
    - konflikty/duplikaty są pomijane i zapisywane w logach

    Uwagi:

    - polecenia niestandardowe są tylko wpisami menu; nie implementują zachowania automatycznie
    - polecenia Plugin/Skills nadal mogą działać po wpisaniu, nawet jeśli nie są pokazane w menu Telegram

    Jeśli natywne polecenia są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/Pluginów nadal mogą się rejestrować, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przekracza limit po przycięciu; ogranicz polecenia Pluginów/Skills/niestandardowe lub wyłącz `channels.telegram.commands.native`.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzący DNS/HTTPS do `api.telegram.org` jest zablokowany.

    ### Polecenia parowania urządzeń (Plugin `device-pair`)

    Gdy Plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym rolę/zakresy)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji przenosi krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap utrzymuje token głównego Node przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Kontrole zakresów bootstrap są prefiksowane rolą, więc ta allowlista operatora spełnia tylko żądania operatora; role niebędące operatorem nadal wymagają zakresów pod własnym prefiksem roli.

    Jeśli urządzenie ponowi próbę ze zmienionymi danymi uwierzytelniania (na przykład rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostanie zastąpione, a nowe żądanie użyje innego `requestId`. Przed zatwierdzeniem uruchom ponownie `/pair pending`.

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

    Nadpisanie per konto:

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

    Kliknięcia callbacków są przekazywane do agenta jako tekst:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Akcje wiadomości Telegram dla agentów i automatyzacji">
    Akcje narzędzia Telegram obejmują:

    - `sendMessage` (`to`, `content`, opcjonalnie `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcjonalnie `iconColor`, `iconCustomEmojiId`)

    Akcje wiadomości kanału udostępniają ergonomiczne aliasy (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Mechanizmy kontroli:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w czasie działania używają aktywnego zrzutu konfiguracji/sekretów (uruchomienie/przeładowanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdym wysłaniu.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi odpowiedzi wątkowanych">
    Telegram obsługuje jawne tagi odpowiedzi wątkowanych w generowanym wyniku:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na określony identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` steruje obsługą:

    - `off` (domyślnie)
    - `first`
    - `all`

    Uwaga: `off` wyłącza niejawne odpowiedzi wątkowane. Jawne tagi `[[reply_to_*]]` są nadal uwzględniane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematów dopisują `:topic:<threadId>`
    - odpowiedzi i wskaźnik pisania są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Szczególny przypadek tematu ogólnego (`threadId=1`):

    - wysyłanie wiadomości pomija `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje pisania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy z domyślnych ustawień grupy.

    **Routing agenta per temat**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Dzięki temu każdy temat ma własny izolowany obszar roboczy, pamięć i sesję. Przykład:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Temat ogólny → agent main
                "3": { agentId: "zu" },        // Temat deweloperski → agent zu
                "5": { agentId: "coder" }      // Przegląd kodu → agent coder
              }
            }
          }
        }
      }
    }
    ```

    Każdy temat ma wtedy własny klucz sesji: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Trwałe powiązanie tematu ACP**: Tematy forum mogą przypinać sesje harness ACP przez najwyższego poziomu typowane powiązania ACP (`bindings[]` z `type: "acp"` i `match.channel: "telegram"`, `peer.kind: "group"` oraz identyfikatorem kwalifikowanym tematem, takim jak `-1001234567890:topic:42`). Obecnie ograniczone do tematów forum w grupach/supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Uruchamianie ACP powiązanego z wątkiem z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne wiadomości są tam kierowane bezpośrednio. OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty prywatne z `message_thread_id` zachowują routing wiadomości prywatnych, ale używają kluczy sesji uwzględniających wątek.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie jako notatki głosowej

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

    Obsługa naklejek przychodzących:

    - statyczne WEBP: pobierane i przetwarzane (placeholder `<media:sticker>`)
    - animowane TGS: pomijane
    - wideo WEBM: pomijane

    Pola kontekstu naklejek:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Plik pamięci podręcznej naklejek:

    - `~/.openclaw/telegram/sticker-cache.json`

    Naklejki są opisywane jednokrotnie (gdy to możliwe) i buforowane, aby ograniczyć powtarzane wywołania vision.

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

    Wyszukiwanie naklejek w pamięci podręcznej:

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
    Reakcje Telegram docierają jako aktualizacje `message_reaction` (oddzielnie od ładunków wiadomości).

    Po włączeniu OpenClaw umieszcza w kolejce zdarzenia systemowe takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkowników na wiadomości wysłane przez bota (best-effort przez pamięć podręczną wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrolę dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy niebędące forum są kierowane do sesji czatu grupowego
      - grupy forum są kierowane do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla pollingu/Webhook automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozwiązywania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - zapasowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji Unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji z zdarzeń i poleceń Telegram">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grup (`migrate_to_chat_id`) do aktualizacji `channels.telegram.groups`
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

  <Accordion title="Long polling a Webhook">
    Domyślnie używany jest long polling. Dla trybu Webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (domyślnie `/telegram-webhook`, `127.0.0.1`, `8787`).

    Lokalny listener wiąże się z `127.0.0.1:8787`. Dla publicznego wejścia albo umieść reverse proxy przed lokalnym portem, albo świadomie ustaw `webhookHost: "0.0.0.0"`.

  </Accordion>

  <Accordion title="Limity, ponawianie i cele CLI">
    - `channels.telegram.textChunkLimit` domyślnie wynosi 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów Telegram.
    - `channels.telegram.timeoutSeconds` nadpisuje limit czasu klienta API Telegram (jeśli nie jest ustawione, obowiązuje domyślna wartość grammY).
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; dostrajaj w zakresie `30000` do `600000` tylko przy fałszywie dodatnich restartach z powodu zastoju pollingu.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` lub `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania jest obecnie przekazywany w postaci otrzymanej.
    - allowlisty Telegram przede wszystkim kontrolują, kto może wywołać agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.
    - kontrola historii wiadomości prywatnych:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - konfiguracja `channels.telegram.retry` dotyczy pomocników wysyłania Telegram (CLI/narzędzia/akcje) dla odzyskiwalnych błędów wychodzącego API.

    Cel wysyłki CLI może być numerycznym identyfikatorem czatu lub nazwą użytkownika:

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
    - `--thread-id` dla tematów forum (lub użyj celu `:topic:`)

    Wysyłanie Telegram obsługuje również:

    - `--presentation` z blokami `buttons` dla klawiatur inline, gdy pozwala na to `channels.telegram.capabilities.inlineButtons`
    - `--pin` lub `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać w tym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć lub przesyłek animowanych multimediów

    Kontrola akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając zwykłe wysyłanie włączone

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w wiadomościach prywatnych zatwierdzających i może opcjonalnie publikować prompty w czacie źródłowym lub temacie. Osoby zatwierdzające muszą być oznaczone numerycznymi identyfikatorami użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy można rozwiązać co najmniej jednego zatwierdzającego)
    - `channels.telegram.execApprovals.approvers` (wraca do numerycznych identyfikatorów właściciela z `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Dostarczanie do kanału pokazuje tekst polecenia w czacie; włączaj `channel` lub `both` tylko w zaufanych grupach/tematach. Gdy prompt trafia do tematu forum, OpenClaw zachowuje temat dla promptu zatwierdzenia i dalszego przebiegu. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline również wymagają, aby `channels.telegram.capabilities.inlineButtons` zezwalało na docelową powierzchnię (`dm`, `group` lub `all`). Identyfikatory zatwierdzeń z prefiksem `plugin:` są rozwiązywane przez zatwierdzenia Pluginów; pozostałe są najpierw rozwiązywane przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrola odpowiedzi na błędy

Gdy agent napotka błąd dostarczenia lub dostawcy, Telegram może odpowiedzieć tekstem błędu albo go pominąć. To zachowanie kontrolują dwa klucze konfiguracji:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` wysyła przyjazny komunikat o błędzie do czatu. `silent` całkowicie wycisza odpowiedzi o błędach. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Minimalny czas między odpowiedziami o błędach do tego samego czatu. Zapobiega spamowi błędami podczas awarii. |

Obsługiwane są nadpisania per konto, per grupa i per temat (to samo dziedziczenie co dla innych kluczy konfiguracji Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // wycisz błędy w tej grupie
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
      - następnie usuń bota i dodaj go ponownie do grupy
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianek.
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne identyfikatory grup; symbol wieloznaczny `"*"` nie może być sprawdzany pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być na liście (lub musi zawierać `"*"`)
    - sprawdź, czy bot należy do grupy
    - przejrzyj logi: `openclaw logs --follow`, aby znaleźć przyczyny pomijania

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj swoją tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje nawet wtedy, gdy polityka grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele wpisów; ogranicz polecenia Pluginów/Skills/niestandardowe lub wyłącz menu natywne
    - `setMyCommands failed` z błędami sieci/fetch zwykle wskazuje na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Niestabilność pollingu lub sieci">

    - Node 22+ + niestandardowy fetch/proxy mogą wywołać natychmiastowe przerwanie, jeśli typy `AbortSignal` nie pasują.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` do IPv6; uszkodzony ruch wychodzący IPv6 może powodować sporadyczne błędy API Telegram.
    - Jeśli logi zawierają `TypeError: fetch failed` lub `Network request for 'getUpdates' failed!`, OpenClaw teraz ponawia te błędy jako odzyskiwalne błędy sieci.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw restartuje polling i odbudowuje transport Telegram po 120 sekundach bez zakończonego sygnału żywotności long pollingu.
    - Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty zastoju pollingu. Uporczywe zastoje zwykle wskazują na problemy z proxy, DNS, IPv6 lub wychodzącym TLS między hostem a `api.telegram.org`.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS kieruj wywołania API Telegram przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2) oraz `dnsResultOrder=ipv4first`.
    - Jeśli twój host to WSL2 lub jawnie lepiej działa z zachowaniem tylko IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania multimediów Telegram. Jeśli zaufany fake-IP lub
      transparent proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/specjalnego przeznaczenia adres podczas pobierania multimediów, możesz
      jawnie włączyć obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo włączenie jest dostępne per konto w
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli twoje proxy rozwiązuje hosty multimediów Telegram do `198.18.x.x`, najpierw pozostaw
      tę niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie zezwalają na zakres benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia ochronę
      przed SSRF dla multimediów Telegram. Używaj tego tylko w zaufanych środowiskach proxy
      kontrolowanych przez operatora, takich jak routing fake-IP Clash, Mihomo lub Surge, gdy
      syntetyzują one prywatne lub specjalnego przeznaczenia odpowiedzi poza zakresem benchmarkowym RFC 2544. Pozostaw tę opcję wyłączoną przy zwykłym publicznym dostępie do Telegram przez internet.
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

<Accordion title="Telegram pola o wysokim znaczeniu">

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; linki symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- zatwierdzenia exec: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- strumieniowanie: `streaming` (podgląd), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorytet wielokontowy: gdy skonfigurowane są co najmniej dwa identyfikatory kont, ustaw `channels.telegram.defaultAccount` (lub uwzględnij `channels.telegram.accounts.default`), aby jawnie określić routing domyślny. W przeciwnym razie OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` zgłasza ostrzeżenie. Nazwane konta dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Telegram z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie allowlist grup i tematów.
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
