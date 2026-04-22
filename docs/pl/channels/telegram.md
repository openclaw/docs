---
read_when:
    - Praca nad funkcjami Telegram lub Webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-04-22T04:21:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1575c4e5e932a4a6330d57fa0d1639336aecdb8fa70d37d92dccd0d466d2fccb
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: gotowe do produkcji dla DM botów + grup przez grammY. Long polling jest trybem domyślnym; tryb Webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna zasada DM dla Telegram to parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i instrukcje naprawy.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce konfiguracji kanałów i przykłady.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Utwórz token bota w BotFather">
    Otwórz Telegram i rozpocznij czat z **@BotFather** (upewnij się, że nazwa użytkownika to dokładnie `@BotFather`).

    Uruchom `/newbot`, postępuj zgodnie z instrukcjami i zapisz token.

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

    Zapasowo przez env: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
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
    Dodaj bota do swojej grupy, a następnie ustaw `channels.telegram.groups` i `groupPolicy` tak, aby pasowały do Twojego modelu dostępu.
  </Step>
</Steps>

<Note>
Kolejność rozstrzygania tokenu uwzględnia konto. W praktyce wartości z config mają pierwszeństwo przed zapasowym env, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność grup">
    Boty Telegram domyślnie używają **Privacy Mode**, który ogranicza, jakie wiadomości grupowe otrzymują.

    Jeśli bot ma widzieć wszystkie wiadomości grupowe, zrób jedno z poniższych:

    - wyłącz tryb prywatności przez `/setprivacy`, lub
    - ustaw bota jako administratora grupy.

    Po przełączeniu trybu prywatności usuń bota i dodaj go ponownie do każdej grupy, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty-administratorzy otrzymują wszystkie wiadomości grupowe, co jest przydatne dla stale aktywnego zachowania w grupie.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić/zabronić dodawania do grup
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Zasady DM">
    `channels.telegram.dmPolicy` kontroluje dostęp do wiadomości bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` akceptuje numeryczne identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie DM i jest odrzucane przez walidację konfiguracji.
    Konfiguracja wymaga wyłącznie numerycznych identyfikatorów użytkowników.
    Jeśli wykonałeś aktualizację i Twoja konfiguracja zawiera wpisy listy dozwolonych `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (best-effort; wymaga tokenu bota Telegram).
    Jeśli wcześniej polegałeś na plikach list dozwolonych ze store parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach allowlist (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    W przypadku botów z jednym właścicielem preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi identyfikatorami `allowFrom`, aby zachować trwałą zasadę dostępu w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częsta pomyłka: zatwierdzenie parowania DM nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje tylko dostęp do DM. Autoryzacja nadawcy w grupie nadal pochodzi z jawnych list dozwolonych w konfiguracji.
    Jeśli chcesz, aby „po jednorazowej autoryzacji działały zarówno DM, jak i polecenia grupowe”, umieść swój numeryczny identyfikator użytkownika Telegram w `channels.telegram.allowFrom`.

    ### Znajdowanie swojego identyfikatora użytkownika Telegram

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

  <Tab title="Zasady grup i listy dozwolonych">
    Obowiązują jednocześnie dwa mechanizmy:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - przy `groupPolicy: "open"`: każda grupa może przejść kontrolę identyfikatora grupy
         - przy `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako lista dozwolonych (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców w grupach. Jeśli nie jest ustawione, Telegram używa zapasowo `allowFrom`.
    Wpisy `groupAllowFrom` powinny być numerycznymi identyfikatorami użytkowników Telegram (`telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatów grup lub supergrup Telegram w `groupAllowFrom`. Ujemne identyfikatory czatów należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawcy w grupie **nie** dziedziczy zatwierdzeń DM ze store parowania.
    Parowanie pozostaje tylko dla DM. Dla grup ustaw `groupAllowFrom` lub `allowFrom` per grupa/per temat.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram używa zapasowo `allowFrom` z config, a nie store parowania.
    Praktyczny wzorzec dla botów z jednym właścicielem: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na docelowe grupy w `channels.telegram.groups`.
    Uwaga wykonawcza: jeśli `channels.telegram` jest całkowicie nieobecne, runtime domyślnie przechodzi do fail-closed `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest ustawione jawnie.

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
      - Umieszczaj identyfikatory użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby wewnątrz dozwolonej grupy mogą uruchomić bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.
    </Warning>

  </Tab>

  <Tab title="Zachowanie wzmianek">
    Odpowiedzi grupowe domyślnie wymagają wzmianki.

    Wzmianka może pochodzić z:

    - natywnej wzmianki `@botusername`, lub
    - wzorców wzmianki w:
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

    Jak uzyskać identyfikator czatu grupowego:

    - prześlij wiadomość grupową do `@userinfobot` / `@getidsbot`
    - lub odczytaj `chat.id` z `openclaw logs --follow`
    - lub sprawdź `getUpdates` w Bot API

  </Tab>
</Tabs>

## Zachowanie w runtime

- Telegram jest zarządzany przez proces gateway.
- Routing jest deterministyczny: przychodzące odpowiedzi Telegram wracają do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi i placeholderami mediów.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dopisują `:topic:<threadId>`, aby utrzymać izolację tematów.
- Wiadomości DM mogą zawierać `message_thread_id`; OpenClaw trasuje je za pomocą kluczy sesji świadomych wątków i zachowuje identyfikator wątku dla odpowiedzi.
- Long polling używa grammY runner z sekwencjonowaniem per czat/per wątek. Ogólna współbieżność sink runner używa `agents.defaults.maxConcurrent`.
- Restarty watchdoga long polling są wyzwalane domyślnie po 120 sekundach bez zakończonego sygnału życia `getUpdates`. Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy w Twoim wdrożeniu nadal występują fałszywe restarty z powodu zastoju polling podczas długotrwałej pracy. Wartość jest podawana w milisekundach i może wynosić od `30000` do `600000`; obsługiwane są nadpisania per konto.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Opis funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumienia na żywo (edycje wiadomości)">
    OpenClaw może strumieniować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` ma wartość `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` jest mapowane do `partial` w Telegram (zgodność z nazewnictwem międzykanałowym)
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzi/postępu używają tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.
    - starsze `channels.telegram.streamMode` i wartości logiczne `streaming` są mapowane automatycznie

    Dla odpowiedzi tylko tekstowych:

    - DM: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)
    - grupa/temat: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)

    Dla odpowiedzi złożonych (na przykład ładunków mediów) OpenClaw wraca do normalnego końcowego dostarczenia, a następnie czyści wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielne od strumieniowania blokowego. Gdy dla Telegram jawnie włączone jest strumieniowanie blokowe, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Jeśli natywny transport szkicu jest niedostępny/odrzucony, OpenClaw automatycznie przechodzi na `sendMessage` + `editMessageText`.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - odpowiedź końcowa jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i zapasowe HTML">
    Tekst wychodzący używa `parse_mode: "HTML"` Telegram.

    - Tekst w stylu Markdown jest renderowany do HTML bezpiecznego dla Telegram.
    - Surowy HTML modelu jest escape’owany, aby ograniczyć błędy parsowania Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponawia próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć przez `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Polecenia natywne i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana przy starcie przez `setMyCommands`.

    Domyślne ustawienia poleceń natywnych:

    - `commands.native: "auto"` włącza polecenia natywne dla Telegram

    Dodawanie niestandardowych wpisów menu poleceń:

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
    - konflikty/duplikaty są pomijane i logowane

    Uwagi:

    - polecenia niestandardowe są tylko wpisami menu; nie implementują automatycznie zachowania
    - polecenia Plugin/Skills nadal mogą działać po wpisaniu, nawet jeśli nie są pokazane w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/wtyczek nadal mogą się rejestrować, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal było przepełnione po przycięciu; zmniejsz liczbę poleceń plugin/Skills/niestandardowych albo wyłącz `channels.telegram.commands.native`.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzące DNS/HTTPS do `api.telegram.org` jest zablokowane.

    ### Polecenia parowania urządzenia (Plugin `device-pair`)

    Gdy Plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym role/scopes)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji zawiera krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap utrzymuje podstawowy token Node przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Kontrole zakresów bootstrap są prefiksowane rolą, więc ta lista dozwolonych operatora spełnia tylko żądania operatora; role inne niż operator nadal wymagają zakresów pod własnym prefiksem roli.

    Jeśli urządzenie ponowi próbę ze zmienionymi szczegółami uwierzytelniania (na przykład rola/scopes/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione, a nowe żądanie używa innego `requestId`. Uruchom ponownie `/pair pending` przed zatwierdzeniem.

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

    Kontrolki ograniczeń:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w runtime używają aktywnego zrzutu config/secrets (start/reload), więc ścieżki akcji nie wykonują ad hoc ponownego rozwiązywania SecretRef przy każdym wysłaniu.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątkowania odpowiedzi">
    Telegram obsługuje jawne tagi wątkowania odpowiedzi w generowanym wyjściu:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na określony identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` kontroluje obsługę:

    - `off` (domyślnie)
    - `first`
    - `all`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal honorowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy z forum:

    - klucze sesji tematów dopisują `:topic:<threadId>`
    - odpowiedzi i wpisywanie kierowane są do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Przypadek specjalny tematu ogólnego (`threadId=1`):

    - wysyłki wiadomości pomijają `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje pisania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, jeśli nie zostały nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy z ustawień domyślnych grupy.

    **Routing agenta per temat**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własny izolowany obszar roboczy, pamięć i sesję. Przykład:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Temat ogólny → agent main
                "3": { agentId: "zu" },        // Temat dev → agent zu
                "5": { agentId: "coder" }      // Code review → agent coder
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

    Obecnie jest to ograniczone do tematów forum w grupach i supergrupach.

    **Uruchamianie ACP powiązanego z wątkiem z czatu**:

    - `/acp spawn <agent> --thread here|auto` może powiązać bieżący temat Telegram z nową sesją ACP.
    - Kolejne wiadomości w temacie są kierowane bezpośrednio do powiązanej sesji ACP (bez potrzeby `/acp steer`).
    - OpenClaw przypina wiadomość potwierdzającą uruchomienie w temacie po pomyślnym powiązaniu.
    - Wymaga `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Kontekst szablonu obejmuje:

    - `MessageThreadId`
    - `IsForum`

    Zachowanie wątku DM:

    - czaty prywatne z `message_thread_id` zachowują routing DM, ale używają kluczy sesji i celów odpowiedzi świadomych wątku.

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

    Obsługa przychodzących naklejek:

    - statyczne WEBP: pobierane i przetwarzane (placeholder `<media:sticker>`)
    - animowane TGS: pomijane
    - wideo WEBM: pomijane

    Pola kontekstu naklejek:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Plik cache naklejek:

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

    Akcja wysłania naklejki:

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
    Reakcje Telegram przychodzą jako aktualizacje `message_reaction` (oddzielnie od ładunków wiadomości).

    Gdy są włączone, OpenClaw umieszcza w kolejce zdarzenia systemowe takie jak:

    - `Dodano reakcję Telegram: 👍 przez Alice (@alice) do wiadomości 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkowników na wiadomości wysłane przez bota (best-effort przez cache wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrolę dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy niebędące forami są kierowane do sesji czatu grupowego
      - grupy forum są kierowane do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla polling/webhook automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje ack">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozstrzygania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - zapasowo emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji z wydarzeń i poleceń Telegram">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grup (`migrate_to_chat_id`) do aktualizacji `channels.telegram.groups`
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
    Domyślnie: long polling.

    Tryb Webhook:

    - ustaw `channels.telegram.webhookUrl`
    - ustaw `channels.telegram.webhookSecret` (wymagane, gdy ustawiony jest adres URL webhooka)
    - opcjonalnie `channels.telegram.webhookPath` (domyślnie `/telegram-webhook`)
    - opcjonalnie `channels.telegram.webhookHost` (domyślnie `127.0.0.1`)
    - opcjonalnie `channels.telegram.webhookPort` (domyślnie `8787`)

    Domyślny lokalny listener dla trybu Webhook nasłuchuje na `127.0.0.1:8787`.

    Jeśli Twój publiczny endpoint jest inny, umieść przed nim reverse proxy i ustaw `webhookUrl` na publiczny URL.
    Ustaw `webhookHost` (na przykład `0.0.0.0`), gdy celowo potrzebujesz zewnętrznego ingressu.

  </Accordion>

  <Accordion title="Limity, ponawianie i cele CLI">
    - domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste linie) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar mediów Telegram przychodzących i wychodzących.
    - `channels.telegram.timeoutSeconds` nadpisuje timeout klienta Telegram API (jeśli nie jest ustawione, obowiązuje wartość domyślna grammY).
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; dostrajaj w zakresie `30000`–`600000` tylko dla fałszywie dodatnich restartów zastoju polling.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` lub `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania dalej jest obecnie przekazywany tak, jak został odebrany.
    - listy dozwolonych Telegram przede wszystkim ograniczają to, kto może uruchomić agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.
    - kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - konfiguracja `channels.telegram.retry` dotyczy pomocników wysyłania Telegram (CLI/narzędzia/akcje) dla możliwych do odzyskania wychodzących błędów API.

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

    Flagi polls tylko dla Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` dla tematów forum (lub użyj celu `:topic:`)

    Wysyłanie Telegram obsługuje także:

    - `--presentation` z blokami `buttons` dla klawiatur inline, gdy pozwala na to `channels.telegram.capabilities.inlineButtons`
    - `--pin` lub `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać w danym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć lub przesyłek animowanych mediów

    Ograniczenia akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym polls
    - `channels.telegram.actions.poll=false` wyłącza tworzenie Telegram polls, pozostawiając zwykłe wysyłanie włączone

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM zatwierdzających i może opcjonalnie publikować prośby o zatwierdzenie w czacie lub temacie źródłowym.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (opcjonalnie; zapasowo używa numerycznych identyfikatorów właścicieli wywnioskowanych z `allowFrom` oraz bezpośredniego `defaultTo`, gdy to możliwe)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`

    Zatwierdzający muszą mieć numeryczne identyfikatory użytkowników Telegram. Telegram automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozpoznać co najmniej jednego zatwierdzającego, albo z `execApprovals.approvers`, albo z numerycznej konfiguracji właściciela konta (`allowFrom` i `defaultTo` dla wiadomości bezpośrednich). Ustaw `enabled: false`, aby jawnie wyłączyć Telegram jako natywnego klienta zatwierdzeń. W przeciwnym razie żądania zatwierdzenia wracają zapasowo do innych skonfigurowanych ścieżek zatwierdzania albo do zasad zapasowych zatwierdzeń exec.

    Telegram renderuje także współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Telegram głównie dodaje routing DM zatwierdzających, rozsyłanie do czatów/tematów i wskazówki pisania przed dostarczeniem.
    Gdy te przyciski są obecne, są one podstawowym UX zatwierdzania; OpenClaw
    powinien uwzględniać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia czatowe są niedostępne lub ręczne zatwierdzenie jest jedyną ścieżką.

    Zasady dostarczania:

    - `target: "dm"` wysyła prośby o zatwierdzenie tylko do rozpoznanych DM zatwierdzających
    - `target: "channel"` wysyła prośbę z powrotem do źródłowego czatu/tematu Telegram
    - `target: "both"` wysyła do DM zatwierdzających i do źródłowego czatu/tematu

    Tylko rozpoznani zatwierdzający mogą zatwierdzać lub odrzucać. Osoby niebędące zatwierdzającymi nie mogą używać `/approve` ani przycisków zatwierdzania Telegram.

    Zachowanie rozstrzygania zatwierdzeń:

    - ID z prefiksem `plugin:` są zawsze rozstrzygane przez zatwierdzenia Plugin.
    - Inne ID najpierw próbują `exec.approval.resolve`.
    - Jeśli Telegram jest również autoryzowany do zatwierdzeń Plugin, a gateway zwraca,
      że zatwierdzenie exec jest nieznane/wygasłe, Telegram ponawia próbę raz przez
      `plugin.approval.resolve`.
    - Rzeczywiste odmowy/błędy zatwierdzeń exec nie przechodzą po cichu zapasowo do
      rozstrzygania zatwierdzeń Plugin.

    Dostarczanie do kanału pokazuje tekst polecenia na czacie, więc włączaj `channel` lub `both` tylko w zaufanych grupach/tematach. Gdy prośba trafia do tematu forum, OpenClaw zachowuje temat zarówno dla prośby o zatwierdzenie, jak i działań po zatwierdzeniu. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline zależą także od tego, czy `channels.telegram.capabilities.inlineButtons` dopuszcza docelową powierzchnię (`dm`, `group` lub `all`).

    Powiązana dokumentacja: [Zatwierdzenia exec](/pl/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Kontrolki odpowiedzi na błędy

Gdy agent napotka błąd dostarczenia lub dostawcy, Telegram może odpowiedzieć tekstem błędu albo go wyciszyć. To zachowanie kontrolują dwa klucze konfiguracji:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                           |
| ----------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła przyjazną wiadomość o błędzie na czat. `silent` całkowicie wycisza odpowiedzi z błędami. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | Minimalny czas między odpowiedziami z błędami na tym samym czacie. Zapobiega spamowi błędów podczas awarii. |

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

    - Jeśli `requireMention=false`, tryb prywatności Telegram musi pozwalać na pełną widoczność.
      - BotFather: `/setprivacy` -> Disable
      - następnie usuń bota i dodaj go ponownie do grupy
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne identyfikatory grup; wildcard `"*"` nie może być sprawdzany pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (lub musi zawierać `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow`, aby sprawdzić powody pomijania

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj tożsamość swojego nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy zasady grupy mają wartość `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele wpisów; zmniejsz liczbę poleceń plugin/Skills/niestandardowych albo wyłącz menu natywne
    - `setMyCommands failed` z błędami sieci/fetch zwykle wskazuje na problemy z dostępnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Niestabilność polling lub sieci">

    - Node 22+ + niestandardowy fetch/proxy może wywoływać natychmiastowe zachowanie abort, jeśli typy AbortSignal nie pasują.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` do IPv6; uszkodzony ruch wychodzący IPv6 może powodować sporadyczne błędy Telegram API.
    - Jeśli logi zawierają `TypeError: fetch failed` lub `Network request for 'getUpdates' failed!`, OpenClaw ponawia je teraz jako możliwe do odzyskania błędy sieciowe.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw restartuje polling i odbudowuje transport Telegram po 120 sekundach bez zakończonego sygnału życia long polling.
    - Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty zastoju polling. Uporczywe zastoje zwykle wskazują na problemy proxy, DNS, IPv6 lub TLS egress między hostem a `api.telegram.org`.
    - Na hostach VPS z niestabilnym bezpośrednim egress/TLS kieruj wywołania Telegram API przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2) i `dnsResultOrder=ipv4first`.
    - Jeśli Twój host to WSL2 lub jawnie lepiej działa w trybie tylko IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania mediów Telegram. Jeśli zaufany fake-IP lub
      transparent proxy przepisuje `api.telegram.org` na jakiś inny
      prywatny/wewnętrzny/specjalnego przeznaczenia adres podczas pobierania mediów, możesz
      włączyć obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo ustawienie opt-in jest dostępne per konto pod
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli Twoje proxy rozwiązuje hosty mediów Telegram do `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Media Telegram już domyślnie dopuszczają zakres benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia ochronę SSRF dla mediów Telegram.
      Używaj tego tylko w zaufanych środowiskach proxy kontrolowanych przez operatora,
      takich jak routing fake-IP Clash, Mihomo lub Surge, gdy
      syntetyzują prywatne lub specjalnego przeznaczenia odpowiedzi poza zakresem benchmarkowym RFC 2544.
      Pozostaw tę opcję wyłączoną dla zwykłego publicznego dostępu Telegram przez internet.
    </Warning>

    - Nadpisania przez env (tymczasowe):
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

## Wskaźniki do dokumentacji referencyjnej konfiguracji Telegram

Główna dokumentacja referencyjna:

- `channels.telegram.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.telegram.botToken`: token bota (BotFather).
- `channels.telegram.tokenFile`: odczytuje token ze ścieżki do zwykłego pliku. Symlinki są odrzucane.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.telegram.allowFrom`: lista dozwolonych DM (numeryczne identyfikatory użytkowników Telegram). `allowlist` wymaga co najmniej jednego identyfikatora nadawcy. `open` wymaga `"*"`. `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do identyfikatorów i może odzyskać wpisy listy dozwolonych z plików store parowania w przepływach migracji allowlist.
- `channels.telegram.actions.poll`: włącza lub wyłącza tworzenie Telegram polls (domyślnie: włączone; nadal wymaga `sendMessage`).
- `channels.telegram.defaultTo`: domyślny cel Telegram używany przez CLI `--deliver`, gdy nie podano jawnego `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.telegram.groupAllowFrom`: lista dozwolonych nadawców grupowych (numeryczne identyfikatory użytkowników Telegram). `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do identyfikatorów. Wpisy nienumeryczne są ignorowane podczas autoryzacji. Autoryzacja grupowa nie używa zapasowego store parowania DM (`2026.2.25+`).
- Priorytet dla wielu kont:
  - Gdy skonfigurowane są co najmniej dwa identyfikatory kont, ustaw `channels.telegram.defaultAccount` (lub uwzględnij `channels.telegram.accounts.default`), aby jawnie określić domyślny routing.
  - Jeśli żadne z nich nie jest ustawione, OpenClaw zapasowo używa pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` zgłasza ostrzeżenie.
  - `channels.telegram.accounts.default.allowFrom` i `channels.telegram.accounts.default.groupAllowFrom` dotyczą wyłącznie konta `default`.
  - Nazwane konta dziedziczą `channels.telegram.allowFrom` i `channels.telegram.groupAllowFrom`, gdy wartości na poziomie konta nie są ustawione.
  - Nazwane konta nie dziedziczą `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: wartości domyślne per grupa + lista dozwolonych (użyj `"*"` dla globalnych wartości domyślnych).
  - `channels.telegram.groups.<id>.groupPolicy`: nadpisanie per grupa dla groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: domyślne ograniczanie do wzmianek.
  - `channels.telegram.groups.<id>.skills`: filtr Skills (pominięcie = wszystkie Skills, puste = brak).
  - `channels.telegram.groups.<id>.allowFrom`: nadpisanie listy dozwolonych nadawców per grupa.
  - `channels.telegram.groups.<id>.systemPrompt`: dodatkowy system prompt dla grupy.
  - `channels.telegram.groups.<id>.enabled`: wyłącza grupę, gdy ma wartość `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: nadpisania per temat (pola grupy + `agentId` tylko dla tematu).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: kieruje ten temat do konkretnego agenta (nadpisuje routing na poziomie grupy i bindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: nadpisanie per temat dla groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: nadpisanie ograniczania do wzmianek per temat.
- najwyższego poziomu `bindings[]` z `type: "acp"` i kanonicznym identyfikatorem tematu `chatId:topic:topicId` w `match.peer.id`: pola trwałego powiązania tematu ACP (zobacz [Agenci ACP](/pl/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: kieruje tematy DM do konkretnego agenta (to samo zachowanie co dla tematów forum).
- `channels.telegram.execApprovals.enabled`: włącza Telegram jako klienta zatwierdzeń exec opartego na czacie dla tego konta.
- `channels.telegram.execApprovals.approvers`: identyfikatory użytkowników Telegram uprawnionych do zatwierdzania lub odrzucania żądań exec. Opcjonalne, gdy `channels.telegram.allowFrom` lub bezpośrednie `channels.telegram.defaultTo` już identyfikuje właściciela.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (domyślnie: `dm`). `channel` i `both` zachowują źródłowy temat Telegram, jeśli jest obecny.
- `channels.telegram.execApprovals.agentFilter`: opcjonalny filtr identyfikatora agenta dla przekazywanych próśb o zatwierdzenie.
- `channels.telegram.execApprovals.sessionFilter`: opcjonalny filtr klucza sesji (substring lub regex) dla przekazywanych próśb o zatwierdzenie.
- `channels.telegram.accounts.<account>.execApprovals`: nadpisanie per konto dla routingu zatwierdzeń exec Telegram i autoryzacji zatwierdzających.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (domyślnie: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: nadpisanie per konto.
- `channels.telegram.commands.nativeSkills`: włącza/wyłącza natywne polecenia Skills Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (domyślnie: `off`).
- `channels.telegram.textChunkLimit`: rozmiar wychodzących fragmentów (znaki).
- `channels.telegram.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych liniach (granice akapitów) przed dzieleniem według długości.
- `channels.telegram.linkPreview`: przełącznik podglądów linków dla wiadomości wychodzących (domyślnie: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (podgląd strumienia na żywo; domyślnie: `partial`; `progress` jest mapowane do `partial`; `block` to zgodność ze starszym trybem podglądu). Strumieniowanie podglądu Telegram używa jednej wiadomości podglądu, która jest edytowana w miejscu.
- `channels.telegram.streaming.preview.toolProgress`: ponownie używa wiadomości podglądu na żywo do aktualizacji narzędzi/postępu, gdy aktywne jest strumieniowanie podglądu (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.
- `channels.telegram.mediaMaxMb`: limit mediów Telegram przychodzących/wychodzących (MB, domyślnie: 100).
- `channels.telegram.retry`: zasady ponawiania dla pomocników wysyłania Telegram (CLI/narzędzia/akcje) przy możliwych do odzyskania wychodzących błędach API (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: nadpisuje Node autoSelectFamily (true=włącz, false=wyłącz). Domyślnie włączone w Node 22+, z domyślnym wyłączeniem w WSL2.
- `channels.telegram.network.dnsResultOrder`: nadpisuje kolejność wyników DNS (`ipv4first` lub `verbatim`). Domyślnie `ipv4first` w Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: niebezpieczne ustawienie opt-in dla zaufanych środowisk fake-IP lub transparent proxy, w których pobieranie mediów Telegram rozwiązuje `api.telegram.org` do prywatnych/wewnętrznych/specjalnego przeznaczenia adresów poza domyślnym dozwolonym zakresem benchmarkowym RFC 2544.
- `channels.telegram.proxy`: URL proxy dla wywołań Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: włącza tryb Webhook (wymaga `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: sekret Webhooka (wymagany, gdy ustawione jest webhookUrl).
- `channels.telegram.webhookPath`: lokalna ścieżka Webhooka (domyślnie `/telegram-webhook`).
- `channels.telegram.webhookHost`: lokalny host bindowania Webhooka (domyślnie `127.0.0.1`).
- `channels.telegram.webhookPort`: lokalny port bindowania Webhooka (domyślnie `8787`).
- `channels.telegram.actions.reactions`: ogranicza reakcje narzędzi Telegram.
- `channels.telegram.actions.sendMessage`: ogranicza wysyłanie wiadomości przez narzędzia Telegram.
- `channels.telegram.actions.deleteMessage`: ogranicza usuwanie wiadomości przez narzędzia Telegram.
- `channels.telegram.actions.sticker`: ogranicza akcje naklejek Telegram — wysyłanie i wyszukiwanie (domyślnie: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — kontroluje, które reakcje wyzwalają zdarzenia systemowe (domyślnie: `own`, gdy nieustawione).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — kontroluje możliwości reakcji agenta (domyślnie: `minimal`, gdy nieustawione).
- `channels.telegram.errorPolicy`: `reply | silent` — kontroluje zachowanie odpowiedzi na błędy (domyślnie: `reply`). Obsługiwane są nadpisania per konto/grupa/temat.
- `channels.telegram.errorCooldownMs`: minimalna liczba ms między odpowiedziami z błędami na tym samym czacie (domyślnie: `60000`). Zapobiega spamowi błędów podczas awarii.

- [Dokumentacja referencyjna konfiguracji - Telegram](/pl/gateway/configuration-reference#telegram)

Pola Telegram o najwyższym znaczeniu:

- start/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; symlinki są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- zatwierdzenia exec: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- strumieniowanie: `streaming` (podgląd), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/sieć: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Routowanie wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
