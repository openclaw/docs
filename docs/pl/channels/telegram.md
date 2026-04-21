---
read_when:
    - Praca nad funkcjami Telegram lub Webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-04-21T17:45:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 816238b53942b319a300843db62ec1d4bf8d84bc11094010926ac9ad457c6d3d
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: gotowe do użycia produkcyjnie dla DM-ów bota i grup przez grammY. Long polling jest domyślnym trybem; tryb Webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną polityką DM dla Telegram jest parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałem" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i scenariusze naprawcze.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce i przykłady konfiguracji kanału.
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

    Zmienna środowiskowa awaryjna: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w config/env, a następnie uruchom gateway.

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
    Dodaj bota do swojej grupy, a następnie ustaw `channels.telegram.groups` i `groupPolicy` tak, aby odpowiadały Twojemu modelowi dostępu.
  </Step>
</Steps>

<Note>
Kolejność rozwiązywania tokena uwzględnia konto. W praktyce wartości z config mają pierwszeństwo przed awaryjną zmienną środowiskową, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność grup">
    Boty Telegram domyślnie działają w **Trybie prywatności**, który ogranicza wiadomości grupowe, jakie otrzymują.

    Jeśli bot ma widzieć wszystkie wiadomości grupowe, wykonaj jedno z poniższych:

    - wyłącz tryb prywatności przez `/setprivacy`, lub
    - nadaj botowi uprawnienia administratora grupy.

    Po przełączeniu trybu prywatności usuń bota i dodaj go ponownie w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty z uprawnieniami administratora otrzymują wszystkie wiadomości grupowe, co jest przydatne dla stale aktywnego zachowania w grupie.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić/zabronić dodawania do grup
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.telegram.dmPolicy` kontroluje dostęp do wiadomości bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` akceptuje numeryczne identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie DM-y i jest odrzucane przez walidację konfiguracji.
    Konfiguracja wymaga wyłącznie numerycznych identyfikatorów użytkowników.
    Jeśli wykonano aktualizację i konfiguracja zawiera wpisy `@username` na liście dozwolonych, uruchom `openclaw doctor --fix`, aby je rozwiązać (best-effort; wymaga tokena bota Telegram).
    Jeśli wcześniej używano plików listy dozwolonych ze store parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach allowlist (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    Dla botów z jednym właścicielem zalecane jest `dmPolicy: "allowlist"` z jawnymi numerycznymi identyfikatorami `allowFrom`, aby polityka dostępu była trwale zapisana w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania DM nie oznacza, że „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp tylko do DM-ów. Autoryzacja nadawców w grupach nadal wynika z jawnych list dozwolonych w konfiguracji.
    Jeśli chcesz, aby „po jednorazowej autoryzacji działały zarówno DM-y, jak i polecenia grupowe”, dodaj swój numeryczny identyfikator użytkownika Telegram do `channels.telegram.allowFrom`.

    ### Jak znaleźć swój identyfikator użytkownika Telegram

    Bezpieczniej (bez zewnętrznego bota):

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
         - z `groupPolicy: "open"`: każda grupa może przejść kontrole identyfikatora grupy
         - z `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako lista dozwolonych (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` jest używane do filtrowania nadawców w grupach. Jeśli nie jest ustawione, Telegram używa `allowFrom` jako wartości zapasowej.
    Wpisy `groupAllowFrom` powinny być numerycznymi identyfikatorami użytkowników Telegram (`telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatu grupy lub supergrupy Telegram w `groupAllowFrom`. Ujemne identyfikatory czatu należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawców.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawcy w grupie **nie** dziedziczy zatwierdzeń ze store parowania DM.
    Parowanie pozostaje wyłącznie dla DM-ów. W przypadku grup ustaw `groupAllowFrom` lub `allowFrom` dla konkretnej grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram używa zapasowo wartości `allowFrom` z konfiguracji, a nie store parowania.
    Praktyczny wzorzec dla botów z jednym właścicielem: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na docelowe grupy w `channels.telegram.groups`.
    Uwaga wykonawcza: jeśli `channels.telegram` całkowicie nie istnieje, wykonanie domyślnie przyjmuje fail-closed `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest jawnie ustawione.

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

      - Umieszczaj ujemne identyfikatory grup lub supergrup Telegram, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieszczaj identyfikatory użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą uruchamiać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.
    </Warning>

  </Tab>

  <Tab title="Zachowanie wzmianki">
    Odpowiedzi grupowe domyślnie wymagają wzmianki.

    Wzmianka może pochodzić z:

    - natywnej wzmianki `@botusername`, lub
    - wzorców wzmianki w:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Przełączniki poleceń na poziomie sesji:

    - `/activation always`
    - `/activation mention`

    Aktualizują one tylko stan sesji. Aby zachować ustawienie na stałe, użyj konfiguracji.

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

    - prześlij wiadomość z grupy do `@userinfobot` / `@getidsbot`
    - lub odczytaj `chat.id` z `openclaw logs --follow`
    - lub sprawdź `getUpdates` w Bot API

  </Tab>
</Tabs>

## Zachowanie w czasie działania

- Telegram jest obsługiwany przez proces gateway.
- Routing jest deterministyczny: odpowiedzi przychodzące z Telegram wracają do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi i placeholderami multimediów.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dodają `:topic:<threadId>`, aby zachować izolację tematów.
- Wiadomości DM mogą zawierać `message_thread_id`; OpenClaw trasuje je przy użyciu kluczy sesji uwzględniających wątek i zachowuje identyfikator wątku dla odpowiedzi.
- Long polling używa grammY runner z sekwencjonowaniem per czat/per wątek. Całkowita współbieżność ujścia runnera używa `agents.defaults.maxConcurrent`.
- Restart watchdoga long pollingu jest wyzwalany domyślnie po 120 sekundach bez zakończonego sygnału żywotności `getUpdates`. Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy wdrożenie nadal widzi fałszywe restarty z powodu zastoju pollingu podczas długotrwałej pracy. Wartość jest podawana w milisekundach i może mieścić się w zakresie od `30000` do `600000`; obsługiwane są nadpisania per konto.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Dokumentacja funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumieniowania na żywo (edycje wiadomości)">
    OpenClaw może strumieniować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` to `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` jest mapowane do `partial` w Telegram (zgodność z nazewnictwem międzykanałowym)
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzi/postępu używają ponownie tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować oddzielne wiadomości narzędzi/postępu.
    - starsze wartości `channels.telegram.streamMode` i boolowskie `streaming` są automatycznie mapowane

    Dla odpowiedzi tylko tekstowych:

    - DM: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)
    - grupa/temat: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)

    Dla odpowiedzi złożonych (na przykład ładunków multimedialnych) OpenClaw przechodzi awaryjnie do zwykłego końcowego dostarczenia, a następnie czyści wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielone od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Jeśli natywny transport wersji roboczej jest niedostępny/odrzucony, OpenClaw automatycznie przechodzi awaryjnie na `sendMessage` + `editMessageText`.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - odpowiedź końcowa jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i awaryjny HTML">
    Tekst wychodzący używa Telegram `parse_mode: "HTML"`.

    - Tekst w stylu Markdown jest renderowany do HTML bezpiecznego dla Telegram.
    - Surowy HTML modelu jest escapowany, aby zmniejszyć liczbę błędów parsowania w Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponowi próbę jako zwykły tekst.

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
        { command: "backup", description: "Kopia zapasowa Git" },
        { command: "generate", description: "Utwórz obraz" },
      ],
    },
  },
}
```

    Zasady:

    - nazwy są normalizowane (usuwanie początkowego `/`, małe litery)
    - prawidłowy wzorzec: `a-z`, `0-9`, `_`, długość `1..32`
    - polecenia niestandardowe nie mogą nadpisywać poleceń natywnych
    - konflikty/duplikaty są pomijane i logowane

    Uwagi:

    - polecenia niestandardowe są tylko wpisami menu; nie implementują automatycznie zachowania
    - polecenia Plugin/Skills mogą nadal działać po wpisaniu, nawet jeśli nie są pokazane w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/pluginów mogą nadal się rejestrować, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przekracza limit po przycięciu; zmniejsz liczbę poleceń Plugin/Skills/niestandardowych lub wyłącz `channels.telegram.commands.native`.
    - `setMyCommands failed` z błędami network/fetch zwykle oznacza, że wychodzący DNS/HTTPS do `api.telegram.org` jest zablokowany.

    ### Polecenia parowania urządzenia (Plugin `device-pair`)

    Gdy Plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym rolę/zakresy)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji przenosi krótko żyjący token bootstrap. Wbudowane przekazanie bootstrap utrzymuje podstawowy token node przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Kontrole zakresów bootstrap mają prefiks roli, więc ta lista dozwolonych operatora spełnia tylko żądania operatora; role inne niż operator nadal wymagają zakresów pod własnym prefiksem roli.

    Jeśli urządzenie ponawia próbę ze zmienionymi danymi uwierzytelniania (na przykład rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione, a nowe żądanie używa innego `requestId`. Uruchom ponownie `/pair pending` przed zatwierdzeniem.

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
  message: "Wybierz opcję:",
  buttons: [
    [
      { text: "Tak", callback_data: "yes" },
      { text: "Nie", callback_data: "no" },
    ],
    [{ text: "Anuluj", callback_data: "cancel" }],
  ],
}
```

    Kliknięcia callback są przekazywane do agenta jako tekst:
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

    Kontrolki bramkowania:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w czasie działania używają aktywnego snapshotu config/secrets (uruchomienie/przeładowanie), więc ścieżki akcji nie wykonują ad hoc ponownego rozwiązywania SecretRef dla każdej wysyłki.

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

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal respektowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematów dodają `:topic:<threadId>`
    - odpowiedzi i wskaźnik pisania są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Przypadek specjalny tematu ogólnego (`threadId=1`):

    - wysyłanie wiadomości pomija `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje pisania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostały nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie jest dziedziczone z domyślnych ustawień grupy.

    **Trasowanie agenta per temat**: każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Dzięki temu każdy temat ma własny izolowany workspace, pamięć i sesję. Przykład:

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

    **Trwałe powiązanie tematu ACP**: tematy forum mogą przypinać sesje harness ACP przez najwyższego poziomu typowane powiązania ACP:

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

    Jest to obecnie ograniczone do tematów forum w grupach i supergrupach.

    **Uruchamianie ACP związane z wątkiem z poziomu czatu**:

    - `/acp spawn <agent> --thread here|auto` może powiązać bieżący temat Telegram z nową sesją ACP.
    - Kolejne wiadomości w temacie są kierowane bezpośrednio do powiązanej sesji ACP (bez potrzeby używania `/acp steer`).
    - OpenClaw przypina wiadomość potwierdzającą uruchomienie wewnątrz tematu po pomyślnym powiązaniu.
    - Wymaga `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Kontekst szablonu obejmuje:

    - `MessageThreadId`
    - `IsForum`

    Zachowanie wątków DM:

    - prywatne czaty z `message_thread_id` zachowują routing DM, ale używają kluczy sesji i celów odpowiedzi uwzględniających wątek.

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

    Naklejki są opisywane jednokrotnie (gdy to możliwe) i cachowane, aby ograniczyć powtarzane wywołania vision.

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
  query: "machający kot",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Reakcje Telegram przychodzą jako aktualizacje `message_reaction` (oddzielnie od payloadów wiadomości).

    Gdy są włączone, OpenClaw umieszcza w kolejce zdarzenia systemowe, takie jak:

    - `Dodano reakcję Telegram: 👍 przez Alice (@alice) do wiadomości 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza wyłącznie reakcje użytkowników na wiadomości wysłane przez bota (best-effort przez cache wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrolę dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie dostarcza identyfikatorów wątków w aktualizacjach reakcji.
      - grupy nieforumowe są kierowane do sesji czatu grupowego
      - grupy forum są kierowane do sesji tematu ogólnego grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla pollingu/Webhook automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje ack">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozwiązywania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - zapasowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji ze zdarzeń i poleceń Telegram">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grupy (`migrate_to_chat_id`) do aktualizacji `channels.telegram.groups`
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

  <Accordion title="Long polling vs Webhook">
    Domyślnie: long polling.

    Tryb Webhook:

    - ustaw `channels.telegram.webhookUrl`
    - ustaw `channels.telegram.webhookSecret` (wymagane, gdy ustawiony jest URL Webhook)
    - opcjonalnie `channels.telegram.webhookPath` (domyślnie `/telegram-webhook`)
    - opcjonalnie `channels.telegram.webhookHost` (domyślnie `127.0.0.1`)
    - opcjonalnie `channels.telegram.webhookPort` (domyślnie `8787`)

    Domyślny lokalny listener dla trybu Webhook wiąże się z `127.0.0.1:8787`.

    Jeśli publiczny endpoint jest inny, umieść przed nim reverse proxy i skieruj `webhookUrl` na publiczny URL.
    Ustaw `webhookHost` (na przykład `0.0.0.0`), gdy celowo potrzebujesz zewnętrznego ingressu.

  </Accordion>

  <Accordion title="Limity, ponawianie prób i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste linie) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar multimediów Telegram przychodzących i wychodzących.
    - `channels.telegram.timeoutSeconds` nadpisuje timeout klienta Telegram API (jeśli nie jest ustawione, obowiązuje domyślna wartość grammY).
    - `channels.telegram.pollingStallThresholdMs` domyślnie ma wartość `120000`; dostrajaj w zakresie `30000`–`600000` tylko w przypadku fałszywie dodatnich restartów z powodu zastoju pollingu.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` lub `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytowania/przekazywania jest obecnie przekazywany tak, jak został odebrany.
    - listy dozwolonych Telegram służą głównie do kontrolowania, kto może wyzwolić agenta, a nie jako pełna granica redakcji dodatkowego kontekstu.
    - kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - konfiguracja `channels.telegram.retry` dotyczy pomocników wysyłania Telegram (CLI/narzędzia/akcje) dla odzyskiwalnych błędów wychodzącego API.

    Cel wysyłki CLI może być numerycznym identyfikatorem czatu lub nazwą użytkownika:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram polls używają `openclaw message poll` i obsługują tematy forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flagi poll tylko dla Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` dla tematów forum (lub użyj celu `:topic:`)

    Wysyłanie Telegram obsługuje także:

    - `--buttons` dla klawiatur inline, gdy zezwala na to `channels.telegram.capabilities.inlineButtons`
    - `--force-document`, aby wysyłać wychodzące obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć lub animowanych uploadów multimediów

    Bramy akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym polls
    - `channels.telegram.actions.poll=false` wyłącza tworzenie polls Telegram, pozostawiając zwykłe wysyłki włączone

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM-ach osób zatwierdzających i może opcjonalnie publikować prompty zatwierdzenia w oryginalnym czacie lub temacie.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (opcjonalnie; awaryjnie używa numerycznych identyfikatorów właścicieli wywnioskowanych z `allowFrom` i bezpośredniego `defaultTo`, gdy to możliwe)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`

    Osoby zatwierdzające muszą mieć numeryczne identyfikatory użytkowników Telegram. Telegram automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jedną osobę zatwierdzającą, albo z `execApprovals.approvers`, albo z numerycznej konfiguracji właściciela konta (`allowFrom` i `defaultTo` dla wiadomości bezpośrednich). Ustaw `enabled: false`, aby jawnie wyłączyć Telegram jako natywnego klienta zatwierdzania. W przeciwnym razie żądania zatwierdzenia przechodzą awaryjnie do innych skonfigurowanych ścieżek zatwierdzania lub do polityki awaryjnej zatwierdzeń exec.

    Telegram renderuje także współdzielone przyciski zatwierdzeń używane przez inne kanały czatu. Natywny adapter Telegram dodaje głównie routing DM-ów osób zatwierdzających, fanout kanału/tematu oraz podpowiedzi pisania przed dostarczeniem.
    Gdy te przyciski są obecne, stanowią podstawowy UX zatwierdzania; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia na czacie są niedostępne lub ręczne zatwierdzenie jest jedyną ścieżką.

    Reguły dostarczania:

    - `target: "dm"` wysyła prompty zatwierdzenia tylko do rozwiązanych DM-ów osób zatwierdzających
    - `target: "channel"` wysyła prompt z powrotem do źródłowego czatu/tematu Telegram
    - `target: "both"` wysyła do DM-ów osób zatwierdzających oraz do źródłowego czatu/tematu

    Tylko rozwiązane osoby zatwierdzające mogą zatwierdzać lub odrzucać. Osoby niebędące zatwierdzającymi nie mogą używać `/approve` ani przycisków zatwierdzania Telegram.

    Zachowanie rozwiązywania zatwierdzeń:

    - identyfikatory z prefiksem `plugin:` są zawsze rozwiązywane przez zatwierdzenia Plugin
    - inne identyfikatory zatwierdzeń najpierw próbują `exec.approval.resolve`
    - jeśli Telegram jest także autoryzowany do zatwierdzeń Plugin i gateway zgłasza,
      że zatwierdzenie exec jest nieznane/wygasłe, Telegram ponawia próbę jeden raz przez
      `plugin.approval.resolve`
    - rzeczywiste odmowy/błędy zatwierdzeń exec nie przechodzą po cichu awaryjnie do
      rozwiązywania zatwierdzeń Plugin

    Dostarczanie do kanału pokazuje tekst polecenia na czacie, więc włączaj `channel` lub `both` tylko w zaufanych grupach/tematach. Gdy prompt trafia do tematu forum, OpenClaw zachowuje temat zarówno dla promptu zatwierdzenia, jak i dalszej komunikacji po zatwierdzeniu. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline zależą również od tego, czy `channels.telegram.capabilities.inlineButtons` zezwala na docelową powierzchnię (`dm`, `group` lub `all`).

    Powiązana dokumentacja: [Zatwierdzenia exec](/pl/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Kontrolki odpowiedzi błędów

Gdy agent napotka błąd dostarczenia lub providera, Telegram może albo odpowiedzieć tekstem błędu, albo go wyciszyć. Dwa klucze konfiguracji kontrolują to zachowanie:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                            |
| ----------------------------------- | ----------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła przyjazną wiadomość o błędzie do czatu. `silent` całkowicie tłumi odpowiedzi błędów. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | Minimalny czas między odpowiedziami błędów do tego samego czatu. Zapobiega spamowi błędami podczas awarii. |

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
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne identyfikatory grup; nie da się sprawdzić członkostwa dla wildcard `"*"`.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (lub musi zawierać `"*"`)
    - sprawdź członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow`, aby znaleźć powody pominięcia

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy polityka grupy ma wartość `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele wpisów; zmniejsz liczbę poleceń Plugin/Skills/niestandardowych lub wyłącz menu natywne
    - `setMyCommands failed` z błędami network/fetch zwykle wskazuje na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Niestabilność pollingu lub sieci">

    - Node 22+ + niestandardowy fetch/proxy może wywoływać natychmiastowe przerywanie, jeśli typy AbortSignal się nie zgadzają.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` do IPv6; uszkodzony wychodzący IPv6 może powodować sporadyczne błędy Telegram API.
    - Jeśli logi zawierają `TypeError: fetch failed` lub `Network request for 'getUpdates' failed!`, OpenClaw ponawia teraz te błędy jako odzyskiwalne błędy sieciowe.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw restartuje polling i odbudowuje transport Telegram po 120 sekundach bez zakończonego sygnału żywotności long-pollingu.
    - Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zastoju pollingu. Uporczywe zastoje zwykle wskazują na problemy z proxy, DNS, IPv6 lub wychodzącym TLS między hostem a `api.telegram.org`.
    - Na hostach VPS z niestabilnym bezpośrednim wyjściem/TLS kieruj wywołania Telegram API przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2) oraz `dnsResultOrder=ipv4first`.
    - Jeśli host to WSL2 lub działa wyraźnie lepiej z zachowaniem tylko IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania multimediów Telegram. Jeśli zaufany fake-IP lub
      transparent proxy przepisuje `api.telegram.org` na inny
      adres prywatny/wewnętrzny/specjalnego przeznaczenia podczas pobierania multimediów, możesz
      włączyć obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo ustawienie opt-in jest dostępne per konto pod
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli proxy rozwiązuje hosty multimediów Telegram do `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie zezwalają na zakres benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia ochronę SSRF
      dla multimediów Telegram. Używaj tego tylko w zaufanych, kontrolowanych przez operatora środowiskach proxy,
      takich jak routing fake-IP w Clash, Mihomo lub Surge, gdy
      syntetyzują prywatne lub specjalnego przeznaczenia odpowiedzi poza zakresem benchmarkowym RFC 2544.
      Pozostaw to wyłączone dla zwykłego publicznego dostępu do Telegram przez internet.
    </Warning>

    - Nadpisania zmiennych środowiskowych (tymczasowe):
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

Więcej pomocy: [Rozwiązywanie problemów z kanałem](/pl/channels/troubleshooting).

## Wskaźniki do dokumentacji referencyjnej konfiguracji Telegram

Główny opis referencyjny:

- `channels.telegram.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.telegram.botToken`: token bota (BotFather).
- `channels.telegram.tokenFile`: odczytuje token ze ścieżki do zwykłego pliku. Symlinki są odrzucane.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.telegram.allowFrom`: lista dozwolonych DM (numeryczne identyfikatory użytkowników Telegram). `allowlist` wymaga co najmniej jednego identyfikatora nadawcy. `open` wymaga `"*"`. `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do identyfikatorów i może odzyskać wpisy allowlist z plików store parowania w przepływach migracji allowlist.
- `channels.telegram.actions.poll`: włącza lub wyłącza tworzenie polls Telegram (domyślnie: włączone; nadal wymaga `sendMessage`).
- `channels.telegram.defaultTo`: domyślny cel Telegram używany przez CLI `--deliver`, gdy nie podano jawnego `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.telegram.groupAllowFrom`: lista dozwolonych nadawców w grupach (numeryczne identyfikatory użytkowników Telegram). `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do identyfikatorów. Wpisy nienumeryczne są ignorowane podczas autoryzacji. Autoryzacja grup nie używa awaryjnego store parowania DM (`2026.2.25+`).
- Priorytet wielu kont:
  - Gdy skonfigurowano dwa lub więcej identyfikatorów kont, ustaw `channels.telegram.defaultAccount` (lub dołącz `channels.telegram.accounts.default`), aby jawnie określić routing domyślny.
  - Jeśli żadne z nich nie jest ustawione, OpenClaw awaryjnie używa pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` wyświetla ostrzeżenie.
  - `channels.telegram.accounts.default.allowFrom` i `channels.telegram.accounts.default.groupAllowFrom` mają zastosowanie tylko do konta `default`.
  - Nazwane konta dziedziczą `channels.telegram.allowFrom` i `channels.telegram.groupAllowFrom`, gdy wartości na poziomie konta nie są ustawione.
  - Nazwane konta nie dziedziczą `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: wartości domyślne per grupa + allowlist (użyj `"*"` dla globalnych wartości domyślnych).
  - `channels.telegram.groups.<id>.groupPolicy`: nadpisanie `groupPolicy` per grupa (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: domyślna bramka wzmianki.
  - `channels.telegram.groups.<id>.skills`: filtr Skills (pominięte = wszystkie Skills, puste = brak).
  - `channels.telegram.groups.<id>.allowFrom`: nadpisanie listy dozwolonych nadawców per grupa.
  - `channels.telegram.groups.<id>.systemPrompt`: dodatkowy system prompt dla grupy.
  - `channels.telegram.groups.<id>.enabled`: wyłącza grupę, gdy ma wartość `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: nadpisania per temat (pola grupy + właściwe tylko dla tematu `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: kieruje ten temat do określonego agenta (nadpisuje routing na poziomie grupy i bindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: nadpisanie `groupPolicy` per temat (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: nadpisanie bramki wzmianki per temat.
- najwyższego poziomu `bindings[]` z `type: "acp"` i kanonicznym identyfikatorem tematu `chatId:topic:topicId` w `match.peer.id`: pola trwałego powiązania tematu ACP (zobacz [Agenty ACP](/pl/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: kieruje tematy DM do określonego agenta (to samo zachowanie co tematy forum).
- `channels.telegram.execApprovals.enabled`: włącza Telegram jako klienta zatwierdzeń exec opartego na czacie dla tego konta.
- `channels.telegram.execApprovals.approvers`: identyfikatory użytkowników Telegram, którzy mogą zatwierdzać lub odrzucać żądania exec. Opcjonalne, gdy `channels.telegram.allowFrom` lub bezpośrednie `channels.telegram.defaultTo` już identyfikuje właściciela.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (domyślnie: `dm`). `channel` i `both` zachowują źródłowy temat Telegram, jeśli występuje.
- `channels.telegram.execApprovals.agentFilter`: opcjonalny filtr identyfikatora agenta dla przekazywanych promptów zatwierdzeń.
- `channels.telegram.execApprovals.sessionFilter`: opcjonalny filtr klucza sesji (podciąg lub regex) dla przekazywanych promptów zatwierdzeń.
- `channels.telegram.accounts.<account>.execApprovals`: nadpisanie per konto dla routingu zatwierdzeń exec Telegram i autoryzacji osób zatwierdzających.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (domyślnie: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: nadpisanie per konto.
- `channels.telegram.commands.nativeSkills`: włącza/wyłącza natywne polecenia Skills Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (domyślnie: `off`).
- `channels.telegram.textChunkLimit`: rozmiar wychodzącego chunku (znaki).
- `channels.telegram.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych liniach (granice akapitów) przed chunkowaniem według długości.
- `channels.telegram.linkPreview`: przełącza podglądy linków dla wiadomości wychodzących (domyślnie: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (podgląd strumieniowania na żywo; domyślnie: `partial`; `progress` jest mapowane do `partial`; `block` to zgodność ze starszym trybem podglądu). Podgląd strumieniowania Telegram używa jednej wiadomości podglądu edytowanej w miejscu.
- `channels.telegram.streaming.preview.toolProgress`: używa ponownie wiadomości podglądu na żywo dla aktualizacji narzędzi/postępu, gdy podgląd strumieniowania jest aktywny (domyślnie: `true`). Ustaw `false`, aby zachować oddzielne wiadomości narzędzi/postępu.
- `channels.telegram.mediaMaxMb`: limit multimediów Telegram przychodzących/wychodzących (MB, domyślnie: 100).
- `channels.telegram.retry`: polityka ponawiania prób dla pomocników wysyłania Telegram (CLI/narzędzia/akcje) przy odzyskiwalnych błędach wychodzącego API (`attempts`, `minDelayMs`, `maxDelayMs`, `jitter`).
- `channels.telegram.network.autoSelectFamily`: nadpisuje Node autoSelectFamily (true=włącz, false=wyłącz). Domyślnie włączone w Node 22+, przy czym WSL2 domyślnie ma wyłączone.
- `channels.telegram.network.dnsResultOrder`: nadpisuje kolejność wyników DNS (`ipv4first` lub `verbatim`). Domyślnie `ipv4first` w Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: niebezpieczne ustawienie opt-in dla zaufanych środowisk fake-IP lub transparent proxy, w których pobieranie multimediów Telegram rozwiązuje `api.telegram.org` do adresów prywatnych/wewnętrznych/specjalnego przeznaczenia poza domyślnie dozwolonym zakresem benchmarkowym RFC 2544.
- `channels.telegram.proxy`: URL proxy dla wywołań Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: włącza tryb Webhook (wymaga `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: sekret Webhook (wymagany, gdy ustawiono webhookUrl).
- `channels.telegram.webhookPath`: lokalna ścieżka Webhook (domyślnie `/telegram-webhook`).
- `channels.telegram.webhookHost`: lokalny host wiązania Webhook (domyślnie `127.0.0.1`).
- `channels.telegram.webhookPort`: lokalny port wiązania Webhook (domyślnie `8787`).
- `channels.telegram.actions.reactions`: bramkuje reakcje narzędzi Telegram.
- `channels.telegram.actions.sendMessage`: bramkuje wysyłanie wiadomości narzędzi Telegram.
- `channels.telegram.actions.deleteMessage`: bramkuje usuwanie wiadomości narzędzi Telegram.
- `channels.telegram.actions.sticker`: bramkuje akcje naklejek Telegram — wysyłanie i wyszukiwanie (domyślnie: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — kontroluje, które reakcje wyzwalają zdarzenia systemowe (domyślnie: `own`, gdy nie ustawiono).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — kontroluje możliwości reakcji agenta (domyślnie: `minimal`, gdy nie ustawiono).
- `channels.telegram.errorPolicy`: `reply | silent` — kontroluje zachowanie odpowiedzi na błędy (domyślnie: `reply`). Obsługiwane są nadpisania per konto/grupa/temat.
- `channels.telegram.errorCooldownMs`: minimalna liczba ms między odpowiedziami błędów do tego samego czatu (domyślnie: `60000`). Zapobiega spamowi błędami podczas awarii.

- [Opis referencyjny konfiguracji - Telegram](/pl/gateway/configuration-reference#telegram)

Pola Telegram o wysokiej wartości sygnału:

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; symlinki są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- zatwierdzenia exec: `execApprovals`, `accounts.*.execApprovals`
- polecenie/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- strumieniowanie: `streaming` (podgląd), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
