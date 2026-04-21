---
read_when:
    - Praca nad funkcjami Telegram lub Webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-04-21T09:51:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5c70775b55d4923a31ad8bae7f4c6e7cbae754c05c3a578180d63db2b59e39a
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: gotowe do użycia produkcyjnie dla DM botów + grup przez grammY. Długie odpytywanie jest trybem domyślnym; tryb Webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną polityką DM dla Telegram jest parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałem" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i scenariusze naprawy.
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

    Zapasowo przez zmienną środowiskową: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
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
    Dodaj bota do swojej grupy, a następnie ustaw `channels.telegram.groups` i `groupPolicy` zgodnie ze swoim modelem dostępu.
  </Step>
</Steps>

<Note>
Kolejność rozwiązywania tokenu uwzględnia konto. W praktyce wartości z config mają pierwszeństwo przed zapasową zmienną środowiskową, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność w grupach">
    Boty Telegram domyślnie działają w **Trybie prywatności**, który ogranicza, jakie wiadomości grupowe otrzymują.

    Jeśli bot ma widzieć wszystkie wiadomości grupowe, zrób jedno z poniższych:

    - wyłącz tryb prywatności przez `/setprivacy`, albo
    - nadaj botowi rolę administratora grupy.

    Po przełączeniu trybu prywatności usuń bota i dodaj go ponownie w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupowe">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty z uprawnieniami administratora otrzymują wszystkie wiadomości grupowe, co jest przydatne przy zawsze aktywnym działaniu w grupie.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić/zabronić dodawania do grup
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.telegram.dmPolicy` steruje dostępem do wiadomości bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` akceptuje numeryczne identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie DM i jest odrzucane przez walidację konfiguracji.
    Konfiguracja prosi wyłącznie o numeryczne identyfikatory użytkowników.
    Jeśli wykonałeś aktualizację i Twoja konfiguracja zawiera wpisy listy dozwolonych `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (najlepszym dostępnym sposobem; wymaga tokenu bota Telegram).
    Jeśli wcześniej polegałeś na plikach listy dozwolonych ze storage parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach allowlist (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    W przypadku botów dla jednego właściciela preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi identyfikatorami `allowFrom`, aby polityka dostępu była trwale zapisana w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częsty punkt nieporozumienia: zatwierdzenie parowania DM nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp tylko do DM. Autoryzacja nadawcy w grupach nadal wynika z jawnych list dozwolonych w konfiguracji.
    Jeśli chcesz, aby „po jednorazowej autoryzacji działały zarówno DM, jak i polecenia grupowe”, umieść swój numeryczny identyfikator użytkownika Telegram w `channels.telegram.allowFrom`.

    ### Jak znaleźć swój identyfikator użytkownika Telegram

    Bezpieczniejsza metoda (bez bota zewnętrznego):

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
    Stosowane są łącznie dwa mechanizmy kontroli:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - przy `groupPolicy: "open"`: każda grupa może przejść kontrole identyfikatora grupy
         - przy `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako lista dozwolonych (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców w grupach. Jeśli nie jest ustawione, Telegram używa zapasowo `allowFrom`.
    Wpisy `groupAllowFrom` powinny być numerycznymi identyfikatorami użytkowników Telegram (`telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatów grupowych ani supergrup Telegram w `groupAllowFrom`. Ujemne identyfikatory czatów należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawców grupowych **nie** dziedziczy zatwierdzeń ze storage parowania DM.
    Parowanie pozostaje tylko dla DM. Dla grup ustaw `groupAllowFrom` albo `allowFrom` na poziomie grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram używa zapasowo `allowFrom` z konfiguracji, a nie storage parowania.
    Praktyczny wzorzec dla botów jednego właściciela: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na docelowe grupy w `channels.telegram.groups`.
    Uwaga dotycząca działania: jeśli `channels.telegram` całkowicie nie istnieje, wartości domyślne środowiska uruchomieniowego są fail-closed z `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest ustawione jawnie.

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

      - Umieszczaj ujemne identyfikatory grup Telegram lub supergrup, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieszczaj identyfikatory użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą wywoływać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.
    </Warning>

  </Tab>

  <Tab title="Zachowanie wzmianek">
    Odpowiedzi w grupach domyślnie wymagają wzmianki.

    Wzmianka może pochodzić z:

    - natywnej wzmianki `@botusername`, lub
    - wzorców wzmianek w:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Przełączniki poleceń na poziomie sesji:

    - `/activation always`
    - `/activation mention`

    Aktualizują one tylko stan sesji. Aby zachować ustawienie trwale, użyj konfiguracji.

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
    - albo odczytaj `chat.id` z `openclaw logs --follow`
    - albo sprawdź Bot API `getUpdates`

  </Tab>
</Tabs>

## Zachowanie w czasie działania

- Telegram jest zarządzany przez proces gateway.
- Routowanie jest deterministyczne: przychodzące odpowiedzi z Telegram wracają do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi i placeholderami multimediów.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dodają `:topic:<threadId>`, aby zachować izolację tematów.
- Wiadomości DM mogą zawierać `message_thread_id`; OpenClaw routuje je przy użyciu kluczy sesji uwzględniających wątek i zachowuje identyfikator wątku dla odpowiedzi.
- Długie odpytywanie używa grammY runner z sekwencjonowaniem per-czat/per-wątek. Ogólna współbieżność odbiornika runner używa `agents.defaults.maxConcurrent`.
- Restarty watchdoga dla długiego odpytywania uruchamiają się domyślnie po 120 sekundach bez zakończonego sygnału żywotności `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy wdrożenie nadal wykazuje fałszywe restarty z powodu zatrzymania odpytywania podczas długotrwałej pracy. Wartość jest podawana w milisekundach i może mieścić się w zakresie od `30000` do `600000`; obsługiwane są nadpisania per konto.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Opis funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumieniowania na żywo (edycje wiadomości)">
    OpenClaw może strumieniować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` ma wartość `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` jest mapowane do `partial` w Telegram (zgodność z nazewnictwem międzykanałowym)
    - starsze wartości `channels.telegram.streamMode` i logiczne `streaming` są mapowane automatycznie

    Dla odpowiedzi zawierających tylko tekst:

    - DM: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)
    - grupa/temat: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)

    Dla odpowiedzi złożonych (na przykład ładunków multimedialnych) OpenClaw wraca do zwykłego końcowego dostarczenia, a następnie usuwa wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielone od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Jeśli natywny transport szkicu jest niedostępny/odrzucony, OpenClaw automatycznie wraca do `sendMessage` + `editMessageText`.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - odpowiedź końcowa jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i zapasowy HTML">
    Tekst wychodzący używa Telegram `parse_mode: "HTML"`.

    - Tekst w stylu Markdown jest renderowany do bezpiecznego dla Telegram HTML.
    - Surowy HTML modelu jest escapowany, aby ograniczyć błędy parsowania w Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponowi próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć przez `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Polecenia natywne i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana przy uruchomieniu przez `setMyCommands`.

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
    - poprawny wzorzec: `a-z`, `0-9`, `_`, długość `1..32`
    - polecenia niestandardowe nie mogą nadpisywać poleceń natywnych
    - konflikty/duplikaty są pomijane i rejestrowane w logach

    Uwagi:

    - polecenia niestandardowe to tylko wpisy menu; nie implementują automatycznie działania
    - polecenia plugin/Skills mogą nadal działać po wpisaniu, nawet jeśli nie są pokazane w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/plugin nadal mogą zostać zarejestrowane, jeśli są skonfigurowane.

    Częste błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal było przepełnione po przycięciu; ogranicz polecenia plugin/Skills/niestandardowe albo wyłącz `channels.telegram.commands.native`.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzący DNS/HTTPS do `api.telegram.org` jest zablokowany.

    ### Polecenia parowania urządzenia (plugin `device-pair`)

    Gdy plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym rolę/scope’y)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji zawiera krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap utrzymuje token głównego Node przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Kontrole scope bootstrap mają prefiks roli, więc ta lista dozwolonych operatora spełnia tylko żądania operatora; role niebędące operatorem nadal wymagają scope’ów pod własnym prefiksem roli.

    Jeśli urządzenie ponowi próbę ze zmienionymi szczegółami uwierzytelniania (na przykład rolą/scope’ami/kluczem publicznym), poprzednie oczekujące żądanie zostaje zastąpione, a nowe żądanie używa innego `requestId`. Przed zatwierdzeniem uruchom ponownie `/pair pending`.

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

    Starsze `capabilities: ["inlineButtons"]` jest mapowane do `inlineButtons: "all"`.

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

    Kontrole bramkowania:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w czasie działania używają aktywnej migawki config/secrets (uruchomienie/przeładowanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef dla każdej wysyłki.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątkowania odpowiedzi">
    Telegram obsługuje jawne tagi wątkowania odpowiedzi w wygenerowanym wyjściu:

    - `[[reply_to_current]]` odpowiada na wiadomość wywołującą
    - `[[reply_to:<id>]]` odpowiada na określony identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` steruje obsługą:

    - `off` (domyślnie)
    - `first`
    - `all`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal honorowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematów dodają `:topic:<threadId>`
    - odpowiedzi i wpisywanie są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Przypadek specjalny tematu ogólnego (`threadId=1`):

    - wysyłanie wiadomości pomija `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje wpisywania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy wyłącznie tematu i nie jest dziedziczone z ustawień domyślnych grupy.

    **Routowanie agentów per temat**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własny izolowany workspace, pamięć i sesję. Przykład:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Temat ogólny → agent main
                "3": { agentId: "zu" },        // Temat deweloperski → agent zu
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

    Obecnie dotyczy to tylko tematów forum w grupach i supergrupach.

    **Uruchamianie ACP związane z wątkiem z czatu**:

    - `/acp spawn <agent> --thread here|auto` może powiązać bieżący temat Telegram z nową sesją ACP.
    - Kolejne wiadomości w temacie są kierowane bezpośrednio do powiązanej sesji ACP (bez potrzeby użycia `/acp steer`).
    - OpenClaw przypina wiadomość potwierdzenia uruchomienia w temacie po pomyślnym powiązaniu.
    - Wymaga `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Kontekst szablonu obejmuje:

    - `MessageThreadId`
    - `IsForum`

    Zachowanie wątków DM:

    - prywatne czaty z `message_thread_id` zachowują routowanie DM, ale używają kluczy sesji i celów odpowiedzi uwzględniających wątek.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie jako notatkę głosową

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
    - wideo WEBM: pomijane

    Pola kontekstu naklejek:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Plik cache naklejek:

    - `~/.openclaw/telegram/sticker-cache.json`

    Naklejki są opisywane jednokrotnie (gdy to możliwe) i zapisywane w cache, aby ograniczyć powtarzane wywołania vision.

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
    Reakcje Telegram przychodzą jako aktualizacje `message_reaction` (oddzielnie od ładunków wiadomości).

    Gdy są włączone, OpenClaw umieszcza w kolejce zdarzenia systemowe, takie jak:

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

    `allowed_updates` dla długiego odpytywania/Webhook automatycznie zawiera `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje ack">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozwiązywania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - zapasowo emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji Unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji z wydarzeń i poleceń Telegram">
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

  <Accordion title="Długie odpytywanie vs Webhook">
    Domyślnie: długie odpytywanie.

    Tryb Webhook:

    - ustaw `channels.telegram.webhookUrl`
    - ustaw `channels.telegram.webhookSecret` (wymagane, gdy ustawiono adres URL Webhook)
    - opcjonalnie `channels.telegram.webhookPath` (domyślnie `/telegram-webhook`)
    - opcjonalnie `channels.telegram.webhookHost` (domyślnie `127.0.0.1`)
    - opcjonalnie `channels.telegram.webhookPort` (domyślnie `8787`)

    Domyślny lokalny listener dla trybu Webhook nasłuchuje na `127.0.0.1:8787`.

    Jeśli Twój publiczny endpoint jest inny, umieść przed nim reverse proxy i skieruj `webhookUrl` na publiczny URL.
    Ustaw `webhookHost` (na przykład `0.0.0.0`), gdy celowo potrzebujesz zewnętrznego ingressu.

  </Accordion>

  <Accordion title="Limity, ponawianie i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste linie) przed podziałem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar multimediów Telegram przychodzących i wychodzących.
    - `channels.telegram.timeoutSeconds` nadpisuje timeout klienta Telegram API (jeśli nie jest ustawione, obowiązuje domyślna wartość grammY).
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; dostrajaj w zakresie od `30000` do `600000` tylko przy fałszywie dodatnich restartach z powodu zatrzymania odpytywania.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` lub `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania jest obecnie przekazywany w otrzymanej postaci.
    - listy dozwolonych Telegram przede wszystkim ograniczają to, kto może wywołać agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.
    - kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - konfiguracja `channels.telegram.retry` dotyczy helperów wysyłania Telegram (CLI/narzędzia/akcje) dla odzyskiwalnych błędów wychodzących Telegram API.

    Cel wysyłki CLI może być numerycznym identyfikatorem czatu albo nazwą użytkownika:

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

    Wysyłka Telegram obsługuje także:

    - `--buttons` dla klawiatur inline, gdy pozwala na to `channels.telegram.capabilities.inlineButtons`
    - `--force-document`, aby wysyłać wychodzące obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć lub animowanych multimediów

    Bramkowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając zwykłe wysyłki włączone

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM zatwierdzających i może opcjonalnie publikować prompty zatwierdzeń w czacie lub temacie źródłowym.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (opcjonalnie; zapasowo używa numerycznych identyfikatorów właścicieli wywnioskowanych z `allowFrom` i bezpośredniego `defaultTo`, gdy to możliwe)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`

    Zatwierdzający muszą być numerycznymi identyfikatorami użytkowników Telegram. Telegram automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego, albo z `execApprovals.approvers`, albo z konfiguracji numerycznego właściciela konta (`allowFrom` i `defaultTo` dla wiadomości bezpośrednich). Ustaw `enabled: false`, aby jawnie wyłączyć Telegram jako natywnego klienta zatwierdzeń. W przeciwnym razie żądania zatwierdzeń przechodzą zapasowo do innych skonfigurowanych tras zatwierdzeń albo do zapasowej polityki zatwierdzeń exec.

    Telegram renderuje także współdzielone przyciski zatwierdzeń używane przez inne kanały czatu. Natywny adapter Telegram głównie dodaje routowanie DM zatwierdzających, fanout kanału/tematu i wskazówki wpisywania przed dostarczeniem.
    Gdy te przyciski są obecne, są one podstawowym UX zatwierdzeń; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia w czacie są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

    Zasady dostarczania:

    - `target: "dm"` wysyła prompty zatwierdzeń tylko do rozwiązanych DM zatwierdzających
    - `target: "channel"` odsyła prompt do źródłowego czatu/tematu Telegram
    - `target: "both"` wysyła do DM zatwierdzających i do źródłowego czatu/tematu

    Tylko rozwiązani zatwierdzający mogą zatwierdzać albo odrzucać. Osoby niebędące zatwierdzającymi nie mogą używać `/approve` i nie mogą używać przycisków zatwierdzeń Telegram.

    Zachowanie rozwiązywania zatwierdzeń:

    - Identyfikatory z prefiksem `plugin:` są zawsze rozwiązywane przez zatwierdzenia plugin.
    - Inne identyfikatory zatwierdzeń najpierw próbują `exec.approval.resolve`.
    - Jeśli Telegram jest również autoryzowany dla zatwierdzeń plugin i gateway mówi,
      że zatwierdzenie exec jest nieznane/wygasłe, Telegram wykonuje jedną ponowną próbę przez
      `plugin.approval.resolve`.
    - Rzeczywiste odmowy/błędy zatwierdzeń exec nie przechodzą po cichu do rozwiązywania
      zatwierdzeń plugin.

    Dostarczenie do kanału pokazuje tekst polecenia na czacie, więc włączaj `channel` lub `both` tylko w zaufanych grupach/tematach. Gdy prompt trafia do tematu forum, OpenClaw zachowuje temat zarówno dla promptu zatwierdzenia, jak i dla dalszych działań po zatwierdzeniu. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzeń inline zależą także od tego, czy `channels.telegram.capabilities.inlineButtons` zezwala na docelową powierzchnię (`dm`, `group` lub `all`).

    Powiązana dokumentacja: [Zatwierdzenia exec](/pl/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Kontrola odpowiedzi na błędy

Gdy agent napotka błąd dostarczenia albo dostawcy, Telegram może albo odpowiedzieć tekstem błędu, albo go wyciszyć. To zachowanie kontrolują dwa klucze konfiguracji:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                              |
| ----------------------------------- | ----------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła przyjazną wiadomość o błędzie na czat. `silent` całkowicie tłumi odpowiedzi błędów. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | Minimalny czas między odpowiedziami błędów na tym samym czacie. Zapobiega spamowi błędów podczas awarii. |

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
    - `openclaw channels status --probe` może sprawdzić jawne numeryczne identyfikatory grup; wildcard `"*"` nie może być sprawdzony pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (albo zawierać `"*"`)
    - sprawdź członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow`, aby zobaczyć powody pomijania

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo w ogóle nie działają">

    - autoryzuj swoją tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy polityka grupy ma wartość `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele wpisów; ogranicz polecenia plugin/Skills/niestandardowe albo wyłącz menu natywne
    - `setMyCommands failed` z błędami sieci/fetch zwykle wskazuje problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Niestabilność odpytywania lub sieci">

    - Node 22+ + niestandardowy fetch/proxy mogą wywoływać natychmiastowe przerwanie, jeśli typy AbortSignal nie pasują.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` do IPv6; uszkodzony wychodzący IPv6 może powodować sporadyczne błędy Telegram API.
    - Jeśli logi zawierają `TypeError: fetch failed` albo `Network request for 'getUpdates' failed!`, OpenClaw teraz ponawia te błędy jako odzyskiwalne błędy sieciowe.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw restartuje odpytywanie i odbudowuje transport Telegram po domyślnie 120 sekundach bez zakończonego sygnału żywotności długiego odpytywania.
    - Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zatrzymania odpytywania. Utrzymujące się zatrzymania zwykle wskazują na problemy z proxy, DNS, IPv6 albo wychodzącym TLS między hostem a `api.telegram.org`.
    - Na hostach VPS z niestabilnym bezpośrednim wyjściem/TLS kieruj wywołania Telegram API przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2) i `dnsResultOrder=ipv4first`.
    - Jeśli Twój host to WSL2 albo jawnie działa lepiej przy zachowaniu wyłącznie IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierań multimediów Telegram. Jeśli zaufany fake-IP albo
      transparent proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/adres specjalnego przeznaczenia podczas pobierania multimediów, możesz
      włączyć obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo ustawienie opt-in jest dostępne per konto w
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli Twoje proxy rozwiązuje hosty multimediów Telegram do `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie zezwalają na zakres benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia ochronę Telegram
      media przed SSRF. Używaj tego tylko w zaufanych środowiskach proxy kontrolowanych przez operatora,
      takich jak routing fake-IP w Clash, Mihomo albo Surge, gdy
      syntetyzują prywatne albo specjalnego przeznaczenia odpowiedzi poza zakresem benchmarkowym RFC 2544. Przy normalnym publicznym dostępie do Telegram przez internet pozostaw to wyłączone.
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

Więcej pomocy: [Rozwiązywanie problemów z kanałem](/pl/channels/troubleshooting).

## Wskaźniki do referencji konfiguracji Telegram

Główna referencja:

- `channels.telegram.enabled`: włącz/wyłącz uruchamianie kanału.
- `channels.telegram.botToken`: token bota (BotFather).
- `channels.telegram.tokenFile`: odczyt tokenu ze ścieżki do zwykłego pliku. Linki symboliczne są odrzucane.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.telegram.allowFrom`: lista dozwolonych DM (numeryczne identyfikatory użytkowników Telegram). `allowlist` wymaga co najmniej jednego identyfikatora nadawcy. `open` wymaga `"*"`. `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do identyfikatorów i może odzyskać wpisy allowlist z plików storage parowania w przepływach migracji allowlist.
- `channels.telegram.actions.poll`: włącz lub wyłącz tworzenie ankiet Telegram (domyślnie: włączone; nadal wymaga `sendMessage`).
- `channels.telegram.defaultTo`: domyślny cel Telegram używany przez CLI `--deliver`, gdy nie podano jawnego `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.telegram.groupAllowFrom`: lista dozwolonych nadawców grupowych (numeryczne identyfikatory użytkowników Telegram). `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do identyfikatorów. Wpisy nienumeryczne są ignorowane podczas autoryzacji. Autoryzacja grupowa nie używa zapasowego storage parowania DM (`2026.2.25+`).
- Priorytet wielu kont:
  - Gdy skonfigurowano dwa lub więcej identyfikatorów kont, ustaw `channels.telegram.defaultAccount` (albo uwzględnij `channels.telegram.accounts.default`), aby jawnie określić domyślne routowanie.
  - Jeśli nie ustawiono żadnego z nich, OpenClaw używa zapasowo pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` zgłasza ostrzeżenie.
  - `channels.telegram.accounts.default.allowFrom` i `channels.telegram.accounts.default.groupAllowFrom` dotyczą tylko konta `default`.
  - Nazwane konta dziedziczą `channels.telegram.allowFrom` i `channels.telegram.groupAllowFrom`, gdy wartości na poziomie konta nie są ustawione.
  - Nazwane konta nie dziedziczą `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: ustawienia domyślne per grupa + allowlist (użyj `"*"` dla ustawień domyślnych globalnych).
  - `channels.telegram.groups.<id>.groupPolicy`: nadpisanie per grupa dla groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: domyślne bramkowanie wzmianką.
  - `channels.telegram.groups.<id>.skills`: filtr Skills (pominięte = wszystkie Skills, puste = żadne).
  - `channels.telegram.groups.<id>.allowFrom`: nadpisanie per grupa dla listy dozwolonych nadawców.
  - `channels.telegram.groups.<id>.systemPrompt`: dodatkowy systemPrompt dla grupy.
  - `channels.telegram.groups.<id>.enabled`: wyłącza grupę, gdy ma wartość `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: nadpisania per temat (pola grupy + właściwe tylko dla tematu `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: kieruje ten temat do określonego agenta (nadpisuje routowanie na poziomie grupy i bindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: nadpisanie per temat dla groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: nadpisanie per temat dla bramkowania wzmianką.
- najwyższego poziomu `bindings[]` z `type: "acp"` i kanonicznym identyfikatorem tematu `chatId:topic:topicId` w `match.peer.id`: pola trwałego powiązania tematu ACP (zobacz [Agenci ACP](/pl/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: kieruje tematy DM do określonego agenta (to samo zachowanie co dla tematów forum).
- `channels.telegram.execApprovals.enabled`: włącza Telegram jako klienta zatwierdzeń exec opartego na czacie dla tego konta.
- `channels.telegram.execApprovals.approvers`: identyfikatory użytkowników Telegram, którzy mogą zatwierdzać lub odrzucać żądania exec. Opcjonalne, gdy `channels.telegram.allowFrom` albo bezpośrednie `channels.telegram.defaultTo` już identyfikuje właściciela.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (domyślnie: `dm`). `channel` i `both` zachowują źródłowy temat Telegram, jeśli występuje.
- `channels.telegram.execApprovals.agentFilter`: opcjonalny filtr identyfikatora agenta dla przekazywanych promptów zatwierdzeń.
- `channels.telegram.execApprovals.sessionFilter`: opcjonalny filtr klucza sesji (substring albo regex) dla przekazywanych promptów zatwierdzeń.
- `channels.telegram.accounts.<account>.execApprovals`: nadpisanie per konto dla routowania zatwierdzeń exec Telegram i autoryzacji zatwierdzających.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (domyślnie: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: nadpisanie per konto.
- `channels.telegram.commands.nativeSkills`: włącz/wyłącz natywne polecenia Skills w Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (domyślnie: `off`).
- `channels.telegram.textChunkLimit`: rozmiar wychodzących fragmentów (znaki).
- `channels.telegram.chunkMode`: `length` (domyślnie) albo `newline`, aby dzielić po pustych liniach (granicach akapitów) przed dzieleniem według długości.
- `channels.telegram.linkPreview`: przełącznik podglądów linków dla wiadomości wychodzących (domyślnie: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (podgląd strumieniowania na żywo; domyślnie: `partial`; `progress` jest mapowane do `partial`; `block` to zgodność ze starszym trybem podglądu). Strumieniowanie podglądu Telegram używa pojedynczej wiadomości podglądu, która jest edytowana w miejscu.
- `channels.telegram.mediaMaxMb`: limit multimediów Telegram przychodzących/wychodzących (MB, domyślnie: 100).
- `channels.telegram.retry`: polityka ponawiania dla helperów wysyłania Telegram (CLI/narzędzia/akcje) przy odzyskiwalnych błędach wychodzących API (próby, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: nadpisanie Node autoSelectFamily (true=włącz, false=wyłącz). Domyślnie włączone w Node 22+, przy czym WSL2 domyślnie ma wyłączone.
- `channels.telegram.network.dnsResultOrder`: nadpisanie kolejności wyników DNS (`ipv4first` albo `verbatim`). Domyślnie `ipv4first` w Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: niebezpieczne ustawienie opt-in dla zaufanych środowisk fake-IP albo transparent proxy, gdzie pobrania multimediów Telegram rozwiązują `api.telegram.org` do prywatnych/wewnętrznych/adresów specjalnego przeznaczenia poza domyślnie dozwolonym zakresem benchmarkowym RFC 2544.
- `channels.telegram.proxy`: URL proxy dla wywołań Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: włącza tryb Webhook (wymaga `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: sekret Webhook (wymagany, gdy ustawiono webhookUrl).
- `channels.telegram.webhookPath`: lokalna ścieżka Webhook (domyślnie `/telegram-webhook`).
- `channels.telegram.webhookHost`: lokalny host bindowania Webhook (domyślnie `127.0.0.1`).
- `channels.telegram.webhookPort`: lokalny port bindowania Webhook (domyślnie `8787`).
- `channels.telegram.actions.reactions`: bramkowanie reakcji narzędzi Telegram.
- `channels.telegram.actions.sendMessage`: bramkowanie wysyłania wiadomości narzędzi Telegram.
- `channels.telegram.actions.deleteMessage`: bramkowanie usuwania wiadomości narzędzi Telegram.
- `channels.telegram.actions.sticker`: bramkowanie akcji naklejek Telegram — wysyłanie i wyszukiwanie (domyślnie: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — kontroluje, które reakcje wyzwalają zdarzenia systemowe (domyślnie: `own`, gdy nie ustawiono).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — kontroluje możliwości reakcji agenta (domyślnie: `minimal`, gdy nie ustawiono).
- `channels.telegram.errorPolicy`: `reply | silent` — kontroluje zachowanie odpowiedzi na błędy (domyślnie: `reply`). Obsługiwane są nadpisania per konto/grupa/temat.
- `channels.telegram.errorCooldownMs`: minimalna liczba ms między odpowiedziami błędów na tym samym czacie (domyślnie: `60000`). Zapobiega spamowi błędów podczas awarii.

- [Referencja konfiguracji - Telegram](/pl/gateway/configuration-reference#telegram)

Pola Telegram o wysokim znaczeniu:

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; linki symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- zatwierdzenia exec: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- strumieniowanie: `streaming` (podgląd), `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routowanie kanałów](/pl/channels/channel-routing)
- [Routowanie wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
