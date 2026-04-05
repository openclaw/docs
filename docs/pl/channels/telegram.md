---
read_when:
    - Praca nad funkcjami Telegrama lub webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-04-05T13:47:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39fbf328375fbc5d08ec2e3eed58b19ee0afa102010ecbc02e074a310ced157e
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: gotowe do użycia na produkcji dla botowych wiadomości prywatnych i grup przez grammY. Długie odpytywanie jest trybem domyślnym; tryb webhooka jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna polityka DM dla Telegrama to parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/channels/troubleshooting">
    Diagnostyka międzykanałowa i instrukcje naprawy.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/gateway/configuration">
    Pełne wzorce konfiguracji kanałów i przykłady.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Utwórz token bota w BotFather">
    Otwórz Telegram i rozpocznij czat z **@BotFather** (upewnij się, że identyfikator to dokładnie `@BotFather`).

    Uruchom `/newbot`, postępuj zgodnie z instrukcjami i zapisz token.

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

    Zmienna env awaryjnie: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
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
    Dodaj bota do swojej grupy, a następnie ustaw `channels.telegram.groups` i `groupPolicy` zgodnie ze swoim modelem dostępu.
  </Step>
</Steps>

<Note>
Kolejność rozwiązywania tokena jest zależna od konta. W praktyce wartości z config mają pierwszeństwo przed zmienną env, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegrama

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność grup">
    Boty Telegrama domyślnie używają **Trybu prywatności**, który ogranicza, jakie wiadomości grupowe otrzymują.

    Jeśli bot ma widzieć wszystkie wiadomości grupowe, wykonaj jedną z poniższych czynności:

    - wyłącz tryb prywatności przez `/setprivacy`, lub
    - nadaj botowi uprawnienia administratora grupy.

    Po przełączeniu trybu prywatności usuń bota z każdej grupy i dodaj go ponownie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupowe">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty z uprawnieniami administratora otrzymują wszystkie wiadomości grupowe, co jest przydatne przy zawsze aktywnym zachowaniu w grupie.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić/zabronić dodawania do grup
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.telegram.dmPolicy` steruje dostępem do wiadomości prywatnych:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` akceptuje numeryczne identyfikatory użytkowników Telegrama. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie wiadomości prywatne i jest odrzucane przez walidację konfiguracji.
    Onboarding akceptuje dane wejściowe `@username` i rozwiązuje je do identyfikatorów numerycznych.
    Jeśli zaktualizowano system i konfiguracja zawiera wpisy allowlist `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (best-effort; wymaga tokena bota Telegram).
    Jeśli wcześniej polegano na plikach allowlist ze storage parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach allowlist (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    Dla botów z jednym właścicielem zalecane jest `dmPolicy: "allowlist"` z jawnymi numerycznymi identyfikatorami `allowFrom`, aby polityka dostępu była trwale zapisana w config (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnej nie oznacza, że „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp tylko do wiadomości prywatnych. Autoryzacja nadawcy w grupie nadal pochodzi z jawnych allowlist w konfiguracji.
    Jeśli chcesz, aby „po jednokrotnej autoryzacji działały zarówno DM, jak i polecenia grupowe”, dodaj swój numeryczny identyfikator użytkownika Telegram do `channels.telegram.allowFrom`.

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
    Łącznie stosowane są dwa mechanizmy kontroli:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - przy `groupPolicy: "open"`: dowolna grupa może przejść kontrole identyfikatora grupy
         - przy `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako allowlista (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców grupowych. Jeśli nie jest ustawione, Telegram używa awaryjnie `allowFrom`.
    Wpisy `groupAllowFrom` powinny być numerycznymi identyfikatorami użytkowników Telegrama (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatu grupy lub supergrupy Telegram w `groupAllowFrom`. Ujemne identyfikatory czatu należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawcy grupowego **nie** dziedziczy zatwierdzeń ze storage parowania DM.
    Parowanie pozostaje tylko dla DM. Dla grup ustaw `groupAllowFrom` albo `allowFrom` dla konkretnej grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram używa awaryjnie konfiguracji `allowFrom`, a nie storage parowania.
    Praktyczny wzorzec dla botów z jednym właścicielem: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na docelowe grupy w `channels.telegram.groups`.
    Uwaga wykonawcza: jeśli `channels.telegram` całkowicie nie istnieje, domyślnie środowisko uruchomieniowe działa w trybie fail-closed z `groupPolicy="allowlist"`, chyba że jawnie ustawiono `channels.defaults.groupPolicy`.

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
      Częsty błąd: `groupAllowFrom` nie jest allowlistą grup Telegrama.

      - Ujemne identyfikatory grupy lub supergrupy Telegram, takie jak `-1001234567890`, umieszczaj w `channels.telegram.groups`.
      - Identyfikatory użytkowników Telegrama, takie jak `8734062810`, umieszczaj w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby wewnątrz dozwolonej grupy mogą wywoływać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.
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

    Aktualizują one wyłącznie stan sesji. Aby zachować ustawienie trwale, użyj konfiguracji.

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
    - albo sprawdź `getUpdates` w Bot API

  </Tab>
</Tabs>

## Zachowanie w czasie działania

- Telegram jest obsługiwany przez proces gateway.
- Routing jest deterministyczny: przychodzące odpowiedzi Telegram wracają do Telegrama (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi i placeholderami mediów.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dodają `:topic:<threadId>`, aby utrzymać izolację tematów.
- Wiadomości prywatne mogą zawierać `message_thread_id`; OpenClaw kieruje je z użyciem kluczy sesji świadomych wątków i zachowuje identyfikator wątku dla odpowiedzi.
- Długie odpytywanie używa grammY runner z sekwencjonowaniem per czat/per wątek. Ogólna współbieżność sink runnera używa `agents.defaults.maxConcurrent`.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Dokumentacja funkcji

<AccordionGroup>
  <Accordion title="Podgląd transmisji na żywo (edycje wiadomości)">
    OpenClaw może przesyłać częściowe odpowiedzi w czasie rzeczywistym:

    - czaty prywatne: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` ma wartość `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` mapuje się do `partial` w Telegramie (zgodność z nazewnictwem międzykanałowym)
    - starsze wartości `channels.telegram.streamMode` i logiczne `streaming` są automatycznie mapowane

    Dla odpowiedzi zawierających tylko tekst:

    - DM: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)
    - grupa/temat: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)

    Dla odpowiedzi złożonych (na przykład ładunków mediów) OpenClaw wraca awaryjnie do zwykłego końcowego dostarczenia, a następnie usuwa wiadomość podglądu.

    Streaming podglądu jest oddzielny od streamingu blokowego. Gdy streaming blokowy jest jawnie włączony dla Telegrama, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego streamingu.

    Jeśli natywny transport szkicu jest niedostępny/odrzucony, OpenClaw automatycznie wraca do `sendMessage` + `editMessageText`.

    Strumień rozumowania tylko dla Telegrama:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - końcowa odpowiedź jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i awaryjny powrót do HTML">
    Tekst wychodzący używa w Telegramie `parse_mode: "HTML"`.

    - Tekst w stylu Markdown jest renderowany do bezpiecznego dla Telegrama HTML.
    - Surowy HTML modelu jest escapowany, aby ograniczyć błędy parsowania Telegrama.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw podejmie ponowną próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć przez `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Natywne polecenia i polecenia niestandardowe">
    Rejestracja menu poleceń Telegrama jest obsługiwana przy uruchomieniu przez `setMyCommands`.

    Domyślne ustawienia poleceń natywnych:

    - `commands.native: "auto"` włącza natywne polecenia dla Telegrama

    Dodawanie niestandardowych wpisów menu poleceń:

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
    - polecenia niestandardowe nie mogą nadpisywać poleceń natywnych
    - konflikty/duplikaty są pomijane i logowane

    Uwagi:

    - polecenia niestandardowe to tylko wpisy menu; nie implementują automatycznie zachowania
    - polecenia plugin/Skills nadal mogą działać po wpisaniu, nawet jeśli nie są pokazane w menu Telegrama

    Jeśli polecenia natywne są wyłączone, wbudowane są usuwane. Polecenia niestandardowe/plugin nadal mogą zostać zarejestrowane, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegrama nadal było przepełnione po przycięciu; zmniejsz liczbę poleceń plugin/Skills/niestandardowych lub wyłącz `channels.telegram.commands.native`.
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

    Kod konfiguracji zawiera krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap utrzymuje token głównego węzła przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Kontrole zakresów bootstrap są poprzedzone prefiksem roli, więc ta allowlista operatora spełnia tylko żądania operatora; role nieoperatorskie nadal wymagają zakresów pod własnym prefiksem roli.

    Jeśli urządzenie ponowi próbę ze zmienionymi danymi uwierzytelniania (na przykład rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostanie zastąpione, a nowe będzie używać innego `requestId`. Uruchom ponownie `/pair pending` przed zatwierdzeniem.

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

    Starsze `capabilities: ["inlineButtons"]` mapuje się do `inlineButtons: "all"`.

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
    Akcje narzędzi Telegram obejmują:

    - `sendMessage` (`to`, `content`, opcjonalnie `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcjonalnie `iconColor`, `iconCustomEmojiId`)

    Akcje wiadomości kanału udostępniają ergonomiczne aliasy (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Przełączniki ograniczeń:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w czasie działania używają aktywnej migawki config/secrets (uruchomienie/przeładowanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdym wysłaniu.

    Semantyka usuwania reakcji: [/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątków odpowiedzi">
    Telegram obsługuje jawne tagi wątków odpowiedzi w generowanych danych wyjściowych:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na konkretny identyfikator wiadomości Telegrama

    `channels.telegram.replyToMode` steruje obsługą:

    - `off` (domyślnie)
    - `first`
    - `all`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal honorowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematów dodają `:topic:<threadId>`
    - odpowiedzi i wpisywanie kierowane są do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Przypadek specjalny tematu ogólnego (`threadId=1`):

    - wysyłanie wiadomości pomija `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje wpisywania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostały nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematów i nie jest dziedziczony z domyślnych ustawień grupy.

    **Routing agenta per temat**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własny izolowany obszar roboczy, pamięć i sesję. Przykład:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Temat ogólny → główny agent
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

    **Trwałe powiązanie tematu ACP**: Tematy forum mogą przypinać sesje harness ACP przez najwyższego poziomu typowane powiązania ACP:

    - `bindings[]` z `type: "acp"` i `match.channel: "telegram"`

    Przykład:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Obecnie dotyczy to tematów forum w grupach i supergrupach.

    **Powiązane z wątkiem uruchamianie ACP z czatu**:

    - `/acp spawn <agent> --thread here|auto` może powiązać bieżący temat Telegrama z nową sesją ACP.
    - Kolejne wiadomości w temacie są kierowane bezpośrednio do powiązanej sesji ACP (bez potrzeby użycia `/acp steer`).
    - OpenClaw przypina w temacie wiadomość potwierdzającą uruchomienie po pomyślnym powiązaniu.
    - Wymaga `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Kontekst szablonu obejmuje:

    - `MessageThreadId`
    - `IsForum`

    Zachowanie wątków DM:

    - czaty prywatne z `message_thread_id` zachowują routing DM, ale używają kluczy sesji i celów odpowiedzi świadomych wątków.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie jako notatka głosowa

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

    Pola kontekstu naklejki:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Plik cache naklejek:

    - `~/.openclaw/telegram/sticker-cache.json`

    Naklejki są opisywane jednokrotnie (gdy to możliwe) i cache’owane, aby ograniczyć powtarzane wywołania vision.

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

    Wyszukiwanie naklejek w cache:

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
    Reakcje Telegrama docierają jako aktualizacje `message_reaction` (oddzielnie od ładunków wiadomości).

    Gdy są włączone, OpenClaw umieszcza w kolejce zdarzenia systemowe, takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza reakcje użytkowników tylko na wiadomości wysłane przez bota (best-effort przez cache wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrolę dostępu Telegrama (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy niebędące forum są kierowane do sesji czatu grupowego
      - grupy forum są kierowane do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla odpytywania/webhooka automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozwiązywania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - awaryjnie emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji Unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji z wydarzeń i poleceń Telegrama">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grupy (`migrate_to_chat_id`) w celu aktualizacji `channels.telegram.groups`
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
    Domyślnie: długie odpytywanie.

    Tryb webhooka:

    - ustaw `channels.telegram.webhookUrl`
    - ustaw `channels.telegram.webhookSecret` (wymagane, gdy ustawiono webhook URL)
    - opcjonalnie `channels.telegram.webhookPath` (domyślnie `/telegram-webhook`)
    - opcjonalnie `channels.telegram.webhookHost` (domyślnie `127.0.0.1`)
    - opcjonalnie `channels.telegram.webhookPort` (domyślnie `8787`)

    Domyślny lokalny nasłuch dla trybu webhooka jest powiązany z `127.0.0.1:8787`.

    Jeśli publiczny endpoint jest inny, umieść przed nim reverse proxy i wskaż `webhookUrl` na publiczny URL.
    Ustaw `webhookHost` (na przykład `0.0.0.0`), gdy celowo potrzebujesz zewnętrznego ruchu przychodzącego.

  </Accordion>

  <Accordion title="Limity, ponawianie prób i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste linie) przed podziałem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar mediów przychodzących i wychodzących Telegrama.
    - `channels.telegram.timeoutSeconds` nadpisuje limit czasu klienta Telegram API (jeśli nieustawione, obowiązuje domyślna wartość grammY).
    - historia kontekstu grupy używa `channels.telegram.historyLimit` lub `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania jest obecnie przekazywany tak, jak został odebrany.
    - allowlisty Telegrama głównie kontrolują, kto może wywołać agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.
    - kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - konfiguracja `channels.telegram.retry` dotyczy pomocników wysyłania Telegrama (CLI/tools/actions) dla odzyskiwalnych błędów wychodzącego API.

    Cel wysyłki CLI może być numerycznym identyfikatorem czatu lub nazwą użytkownika:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Ankiety Telegrama używają `openclaw message poll` i obsługują tematy forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flagi ankiet tylko dla Telegrama:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` dla tematów forum (lub użyj celu `:topic:`)

    Wysyłka Telegrama obsługuje także:

    - `--buttons` dla klawiatur inline, gdy `channels.telegram.capabilities.inlineButtons` zezwala na tę powierzchnię
    - `--force-document`, aby wysyłać obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć lub przesyłek animowanych mediów

    Ograniczenia akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegrama, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegrama, pozostawiając zwykłe wysyłanie włączone

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegramie">
    Telegram obsługuje zatwierdzenia exec w wiadomościach prywatnych zatwierdzających i opcjonalnie może publikować prośby o zatwierdzenie w źródłowym czacie lub temacie.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (opcjonalnie; awaryjnie używa numerycznych identyfikatorów właściciela wywnioskowanych z `allowFrom` oraz bezpośredniego `defaultTo`, gdy to możliwe)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`

    Zatwierdzający muszą być numerycznymi identyfikatorami użytkowników Telegrama. Telegram automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego, albo z `execApprovals.approvers`, albo z numerycznej konfiguracji właściciela konta (`allowFrom` i bezpośrednie `defaultTo` dla wiadomości prywatnych). Ustaw `enabled: false`, aby jawnie wyłączyć Telegram jako natywnego klienta zatwierdzania. W przeciwnym razie żądania zatwierdzenia wracają awaryjnie do innych skonfigurowanych tras zatwierdzania albo do polityki awaryjnej zatwierdzeń exec.

    Telegram renderuje także współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Telegrama głównie dodaje routing wiadomości prywatnych zatwierdzających, fan-out kanału/tematu oraz wskazówki wpisywania przed dostarczeniem.
    Gdy te przyciski są obecne, stanowią one główne UX zatwierdzania; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia na czacie są niedostępne lub ręczne zatwierdzenie jest jedyną ścieżką.

    Zasady dostarczania:

    - `target: "dm"` wysyła prośby o zatwierdzenie tylko do rozwiązanych wiadomości prywatnych zatwierdzających
    - `target: "channel"` odsyła prośbę do źródłowego czatu/tematu Telegrama
    - `target: "both"` wysyła do wiadomości prywatnych zatwierdzających i do źródłowego czatu/tematu

    Tylko rozwiązani zatwierdzający mogą zatwierdzać lub odrzucać. Osoby niebędące zatwierdzającymi nie mogą używać `/approve` ani przycisków zatwierdzania Telegrama.

    Zachowanie rozwiązywania zatwierdzeń:

    - Identyfikatory z prefiksem `plugin:` są zawsze rozwiązywane przez zatwierdzenia pluginów.
    - Inne identyfikatory najpierw próbują `exec.approval.resolve`.
    - Jeśli Telegram jest także autoryzowany do zatwierdzeń pluginów i gateway zwraca,
      że zatwierdzenie exec jest nieznane lub wygasłe, Telegram podejmuje jedną ponowną próbę przez
      `plugin.approval.resolve`.
    - Rzeczywiste odrzucenia/błędy zatwierdzeń exec nie przechodzą po cichu do rozwiązywania
      zatwierdzeń pluginów.

    Dostarczenie do kanału pokazuje tekst polecenia na czacie, więc włączaj `channel` lub `both` tylko w zaufanych grupach/tematach. Gdy prośba trafia do tematu forum, OpenClaw zachowuje temat zarówno dla prośby o zatwierdzenie, jak i działań po zatwierdzeniu. Zatwierdzenia exec wygasają domyślnie po 30 minutach.

    Przyciski zatwierdzania inline zależą też od tego, czy `channels.telegram.capabilities.inlineButtons` zezwala na docelową powierzchnię (`dm`, `group` lub `all`).

    Powiązana dokumentacja: [Zatwierdzenia exec](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Kontrola odpowiedzi na błędy

Gdy agent napotka błąd dostarczenia lub dostawcy, Telegram może albo odpowiedzieć tekstem błędu, albo go ukryć. Dwa klucze konfiguracyjne sterują tym zachowaniem:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` wysyła przyjazny komunikat o błędzie na czat. `silent` całkowicie wycisza odpowiedzi z błędami. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Minimalny czas między odpowiedziami z błędami na tym samym czacie. Zapobiega spamowi błędów podczas awarii.        |

Obsługiwane są nadpisania per konto, per grupa i per temat (to samo dziedziczenie co dla innych kluczy konfiguracji Telegrama).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // ukryj błędy w tej grupie
        },
      },
    },
  },
}
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Bot nie odpowiada na wiadomości grupowe bez wzmianki">

    - Jeśli `requireMention=false`, tryb prywatności Telegrama musi zezwalać na pełną widoczność.
      - BotFather: `/setprivacy` -> Disable
      - następnie usuń bota z grupy i dodaj go ponownie
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne identyfikatory grup; członkostwa dla wildcard `"*"` nie da się sprawdzić sondą.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (lub zawierać `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow`, aby sprawdzić powody pominięcia

  </Accordion>

  <Accordion title="Polecenia działają częściowo lub wcale">

    - autoryzuj tożsamość swojego nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy polityka grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele wpisów; zmniejsz liczbę poleceń plugin/Skills/niestandardowych lub wyłącz natywne menu
    - `setMyCommands failed` z błędami sieci/fetch zwykle wskazuje na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Niestabilność odpytywania lub sieci">

    - Node 22+ + niestandardowy fetch/proxy mogą wywoływać natychmiastowe przerywanie, jeśli typy AbortSignal się nie zgadzają.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` do IPv6; uszkodzony ruch wychodzący IPv6 może powodować sporadyczne błędy Telegram API.
    - Jeśli logi zawierają `TypeError: fetch failed` lub `Network request for 'getUpdates' failed!`, OpenClaw teraz ponawia te operacje jako odzyskiwalne błędy sieciowe.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS kieruj wywołania Telegram API przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2) oraz `dnsResultOrder=ipv4first`.
    - Jeśli host to WSL2 lub jawnie działa lepiej wyłącznie z IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania mediów Telegrama. Jeśli zaufany fake-IP lub
      transparent proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/specjalnego przeznaczenia adres podczas pobierania mediów, możesz
      włączyć obejście tylko dla Telegrama:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo opt-in jest dostępne per konto pod
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli proxy rozwiązuje hosty mediów Telegrama na `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Media Telegrama już domyślnie zezwalają na zakres benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia ochronę
      Telegram media SSRF. Używaj tego tylko w zaufanych środowiskach proxy
      kontrolowanych przez operatora, takich jak routing fake-IP w Clash, Mihomo lub Surge,
      gdy syntetyzują prywatne lub specjalnego przeznaczenia odpowiedzi poza zakresem benchmarkowym
      RFC 2544. W przypadku normalnego publicznego dostępu do Telegrama przez internet pozostaw tę opcję wyłączoną.
    </Warning>

    - Nadpisania przez zmienne środowiskowe (tymczasowe):
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

Więcej pomocy: [Rozwiązywanie problemów z kanałami](/channels/troubleshooting).

## Wskaźniki do referencji konfiguracji Telegrama

Główna referencja:

- `channels.telegram.enabled`: włącz/wyłącz uruchamianie kanału.
- `channels.telegram.botToken`: token bota (BotFather).
- `channels.telegram.tokenFile`: odczyt tokena ze ścieżki do zwykłego pliku. Linki symboliczne są odrzucane.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.telegram.allowFrom`: allowlista DM (numeryczne identyfikatory użytkowników Telegrama). `allowlist` wymaga co najmniej jednego identyfikatora nadawcy. `open` wymaga `"*"`. `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do identyfikatorów i może odzyskać wpisy allowlist z plików storage parowania w przepływach migracji allowlist.
- `channels.telegram.actions.poll`: włącz lub wyłącz tworzenie ankiet Telegrama (domyślnie: włączone; nadal wymaga `sendMessage`).
- `channels.telegram.defaultTo`: domyślny cel Telegrama używany przez CLI `--deliver`, gdy nie podano jawnego `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.telegram.groupAllowFrom`: allowlista nadawców grupowych (numeryczne identyfikatory użytkowników Telegrama). `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do identyfikatorów. Wpisy nienumeryczne są ignorowane przy autoryzacji. Autoryzacja grupowa nie używa awaryjnego odwołania do storage parowania DM (`2026.2.25+`).
- Priorytet wielu kont:
  - Gdy skonfigurowano dwa lub więcej identyfikatorów kont, ustaw `channels.telegram.defaultAccount` (lub uwzględnij `channels.telegram.accounts.default`), aby jawnie określić domyślny routing.
  - Jeśli nie ustawiono żadnej z tych wartości, OpenClaw awaryjnie używa pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` wyświetla ostrzeżenie.
  - `channels.telegram.accounts.default.allowFrom` i `channels.telegram.accounts.default.groupAllowFrom` mają zastosowanie tylko do konta `default`.
  - Nazwane konta dziedziczą `channels.telegram.allowFrom` i `channels.telegram.groupAllowFrom`, gdy wartości na poziomie konta nie są ustawione.
  - Nazwane konta nie dziedziczą `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: domyślne ustawienia per grupa + allowlista (użyj `"*"` dla ustawień globalnych).
  - `channels.telegram.groups.<id>.groupPolicy`: nadpisanie `groupPolicy` per grupa (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: domyślna blokada oparta na wzmiance.
  - `channels.telegram.groups.<id>.skills`: filtr Skills (pominięcie = wszystkie Skills, puste = brak).
  - `channels.telegram.groups.<id>.allowFrom`: nadpisanie allowlisty nadawców per grupa.
  - `channels.telegram.groups.<id>.systemPrompt`: dodatkowy system prompt dla grupy.
  - `channels.telegram.groups.<id>.enabled`: wyłącza grupę, gdy ma wartość `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: nadpisania per temat (pola grupy + `agentId` tylko dla tematów).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: kieruje ten temat do konkretnego agenta (nadpisuje routing na poziomie grupy i powiązań).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: nadpisanie `groupPolicy` per temat (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: nadpisanie blokady wzmianki per temat.
- najwyższego poziomu `bindings[]` z `type: "acp"` i kanonicznym identyfikatorem tematu `chatId:topic:topicId` w `match.peer.id`: pola trwałego powiązania tematu ACP (zobacz [Agenci ACP](/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: kieruje tematy DM do konkretnego agenta (to samo zachowanie co w przypadku tematów forum).
- `channels.telegram.execApprovals.enabled`: włącza Telegram jako klienta zatwierdzeń exec opartych na czacie dla tego konta.
- `channels.telegram.execApprovals.approvers`: identyfikatory użytkowników Telegrama, którym wolno zatwierdzać lub odrzucać żądania exec. Opcjonalne, gdy `channels.telegram.allowFrom` lub bezpośrednie `channels.telegram.defaultTo` już identyfikuje właściciela.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (domyślnie: `dm`). `channel` i `both` zachowują źródłowy temat Telegrama, jeśli istnieje.
- `channels.telegram.execApprovals.agentFilter`: opcjonalny filtr identyfikatora agenta dla przekazywanych próśb o zatwierdzenie.
- `channels.telegram.execApprovals.sessionFilter`: opcjonalny filtr klucza sesji (podciąg lub regex) dla przekazywanych próśb o zatwierdzenie.
- `channels.telegram.accounts.<account>.execApprovals`: nadpisanie per konto dla routingu zatwierdzeń exec Telegrama i autoryzacji zatwierdzających.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (domyślnie: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: nadpisanie per konto.
- `channels.telegram.commands.nativeSkills`: włącz/wyłącz natywne polecenia Skills Telegrama.
- `channels.telegram.replyToMode`: `off | first | all` (domyślnie: `off`).
- `channels.telegram.textChunkLimit`: rozmiar wychodzących fragmentów (znaki).
- `channels.telegram.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych liniach (granice akapitów) przed dzieleniem według długości.
- `channels.telegram.linkPreview`: przełącznik podglądów linków dla wiadomości wychodzących (domyślnie: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (podgląd transmisji na żywo; domyślnie: `partial`; `progress` mapuje się do `partial`; `block` to zgodność ze starszym trybem podglądu). Streaming podglądu Telegrama używa pojedynczej wiadomości podglądu, która jest edytowana w miejscu.
- `channels.telegram.mediaMaxMb`: limit mediów przychodzących/wychodzących Telegrama (MB, domyślnie: 100).
- `channels.telegram.retry`: polityka ponawiania dla pomocników wysyłania Telegrama (CLI/tools/actions) przy odzyskiwalnych błędach wychodzącego API (próby, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: nadpisanie Node autoSelectFamily (true=włącz, false=wyłącz). Domyślnie włączone w Node 22+, a w WSL2 domyślnie wyłączone.
- `channels.telegram.network.dnsResultOrder`: nadpisanie kolejności wyników DNS (`ipv4first` lub `verbatim`). Domyślnie `ipv4first` w Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: niebezpieczne opt-in dla zaufanych środowisk fake-IP lub transparent proxy, gdzie pobieranie mediów Telegrama rozwiązuje `api.telegram.org` do prywatnych/wewnętrznych/specjalnego przeznaczenia adresów poza domyślnie dozwolonym zakresem benchmarkowym RFC 2544.
- `channels.telegram.proxy`: URL proxy dla wywołań Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: włącza tryb webhooka (wymaga `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: sekret webhooka (wymagany, gdy ustawiono webhookUrl).
- `channels.telegram.webhookPath`: lokalna ścieżka webhooka (domyślnie `/telegram-webhook`).
- `channels.telegram.webhookHost`: host powiązania lokalnego webhooka (domyślnie `127.0.0.1`).
- `channels.telegram.webhookPort`: lokalny port powiązania webhooka (domyślnie `8787`).
- `channels.telegram.actions.reactions`: ogranicza reakcje narzędzi Telegrama.
- `channels.telegram.actions.sendMessage`: ogranicza wysyłanie wiadomości przez narzędzia Telegrama.
- `channels.telegram.actions.deleteMessage`: ogranicza usuwanie wiadomości przez narzędzia Telegrama.
- `channels.telegram.actions.sticker`: ogranicza akcje naklejek Telegrama — wysyłanie i wyszukiwanie (domyślnie: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — kontroluje, które reakcje wyzwalają zdarzenia systemowe (domyślnie: `own`, jeśli nie ustawiono).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — kontroluje możliwości reakcji agenta (domyślnie: `minimal`, jeśli nie ustawiono).
- `channels.telegram.errorPolicy`: `reply | silent` — kontroluje zachowanie odpowiedzi na błędy (domyślnie: `reply`). Obsługiwane są nadpisania per konto/grupa/temat.
- `channels.telegram.errorCooldownMs`: minimalna liczba ms między odpowiedziami z błędami na tym samym czacie (domyślnie: `60000`). Zapobiega spamowi błędów podczas awarii.

- [Referencja konfiguracji - Telegram](/gateway/configuration-reference#telegram)

Telegram-specific high-signal fields:

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; linki symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- zatwierdzenia exec: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- streaming: `streaming` (podgląd), `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/sieć: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Routing wielu agentów](/concepts/multi-agent)
- [Rozwiązywanie problemów](/channels/troubleshooting)
