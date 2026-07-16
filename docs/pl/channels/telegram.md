---
read_when:
    - Praca nad funkcjami Telegrama lub webhookami
summary: Stan obsługi botów Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-07-16T18:18:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

Gotowe do zastosowań produkcyjnych dla wiadomości prywatnych z botem i grup za pośrednictwem grammY. Domyślnym transportem jest długie odpytywanie; tryb Webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną zasadą wiadomości prywatnych dla Telegram jest parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Procedury diagnostyki i naprawy obejmujące różne kanały.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce i przykłady konfiguracji kanału.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Utwórz token bota w BotFather">
    Obie metody kończą się uzyskaniem tokenu do wklejenia w OpenClaw — wybierz jedną:

    - **Przez czat**: otwórz Telegram, rozpocznij czat z **@BotFather** (upewnij się, że nazwa użytkownika to dokładnie `@BotFather`), uruchom `/newbot`, wykonaj polecenia i zapisz token.
    - **Przez przeglądarkę**: otwórz [aplikację internetową BotFather](https://t.me/BotFather?startapp) — działa w każdym kliencie Telegram, w tym [web.telegram.org](https://web.telegram.org) — utwórz bota w interfejsie i skopiuj jego token.

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

    Zapasowa zmienna środowiskowa: `TELEGRAM_BOT_TOKEN` (tylko konto domyślne; nazwane konta muszą używać `botToken` lub `tokenFile`).
    Telegram **nie** używa `openclaw channels login telegram`; ustaw token w konfiguracji lub zmiennej środowiskowej, a następnie uruchom Gateway.

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
    Dodaj bota do grupy, a następnie uzyskaj dwa identyfikatory wymagane do dostępu do grupy:

    - identyfikator użytkownika Telegram dla `allowFrom` / `groupAllowFrom`
    - identyfikator czatu grupowego Telegram jako klucz w `channels.telegram.groups`

    Uzyskaj identyfikator czatu grupowego z `openclaw logs --follow`, bota podającego identyfikatory przekazanych wiadomości lub `getUpdates` interfejsu Bot API. Po dopuszczeniu grupy `/whoami@<bot_username>` potwierdza identyfikatory użytkownika i grupy.

    Ujemne identyfikatory supergrup zaczynające się od `-100` są identyfikatorami czatów grupowych. Należy umieścić je w `channels.telegram.groups`, a nie w `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Rozpoznawanie tokenu uwzględnia konto: `tokenFile` ma pierwszeństwo przed `botToken`, a ten przed zmienną środowiskową; konfiguracja zawsze ma pierwszeństwo przed `TELEGRAM_BOT_TOKEN` (który jest rozpoznawany tylko dla konta domyślnego). Po pomyślnym uruchomieniu OpenClaw przechowuje tożsamość bota w pamięci podręcznej przez maksymalnie 24 godziny, dzięki czemu ponowne uruchomienia pomijają dodatkowe wywołanie `getMe`; zmiana lub usunięcie tokenu czyści tę pamięć podręczną.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność w grupach">
    Boty Telegram domyślnie używają **Privacy Mode**, który ogranicza odbierane przez nie wiadomości grupowe.

    Aby bot widział wszystkie wiadomości grupowe:

    - wyłącz tryb prywatności przez `/setprivacy` albo
    - nadaj botowi uprawnienia administratora grupy.

    Po przełączeniu trybu prywatności usuń bota z każdej grupy i dodaj go ponownie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupowe">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram. Boty będące administratorami otrzymują wszystkie wiadomości grupowe, co jest przydatne do ciągłego działania w grupie.
  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups` — zezwalanie na dodawanie do grup lub jego blokowanie
    - `/setprivacy` — sposób widoczności w grupach

    Te same ustawienia są dostępne w [aplikacji internetowej BotFather](https://t.me/BotFather?startapp), jeśli interfejs jest wygodniejszy niż polecenia czatu.

  </Accordion>
</AccordionGroup>

## Miniaplikacja panelu

Uruchom `/dashboard` w wiadomości prywatnej z botem, aby otworzyć panel OpenClaw wewnątrz Telegram.

Wymagania:

- `gateway.tailscale.mode: "serve"` lub `"funnel"` dla opublikowanego adresu URL HTTPS miniaplikacji.
- Numeryczny identyfikator użytkownika Telegram musi znajdować się na obowiązującej liście `allowFrom` wybranego konta lub w `commands.ownerAllowFrom`.
- Użyj wiadomości prywatnej. W grupach `/dashboard` odpowiada komunikatem `open this in a DM with the bot` i nie wysyła przycisku.
- Instalacje Docker: tryby Serve/Funnel wymagają, aby Gateway nasłuchiwał na interfejsie loopback obok `tailscaled`, czego nie może zapewnić sieć mostkowa z opublikowanymi portami. Uruchom kontener Gateway z `network_mode: host` i zamontuj w kontenerze gniazdo hosta `tailscaled` (`/var/run/tailscale`) oraz CLI `tailscale`.

Miniaplikacja jest ścieżką v1 dostępną wyłącznie przez Tailscale i nie obsługuje elementu iframe Telegram Web.

## Kontrola dostępu i aktywacja

### Tożsamość bota w grupie

W grupach i tematach forum jawna wzmianka skonfigurowanej nazwy użytkownika bota (na przykład `@my_bot`) kieruje wiadomość do wybranego agenta OpenClaw, nawet jeśli nazwa persony agenta różni się od nazwy użytkownika Telegram. Zasada milczenia w grupie nadal dotyczy niepowiązanego ruchu, ale sama nazwa użytkownika bota nigdy nie oznacza „kogoś innego”.

<Tabs>
  <Tab title="Zasada wiadomości prywatnych">
    `channels.telegram.dmPolicy` kontroluje dostęp przez wiadomości prywatne:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` umożliwia każdemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, wydawanie mu poleceń. Używaj tego tylko w celowo publicznych botach z mocno ograniczonymi narzędziami; boty jednego właściciela powinny używać `allowlist` z numerycznymi identyfikatorami użytkowników.

    `channels.telegram.allowFrom` przyjmuje numeryczne identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach z wieloma kontami restrykcyjne `channels.telegram.allowFrom` najwyższego poziomu stanowi granicę bezpieczeństwa: `allowFrom: ["*"]` na poziomie konta nie czyni go publicznym, chyba że scalona obowiązująca lista dozwolonych nadal zawiera jawny symbol wieloznaczny.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie wiadomości prywatne i jest odrzucane przez walidację konfiguracji.
    Podczas konfiguracji wymagane są wyłącznie numeryczne identyfikatory użytkowników. Jeśli konfiguracja zawiera wpisy listy dozwolonych `@username` ze starszej konfiguracji, uruchom `openclaw doctor --fix`, aby w miarę możliwości przekształcić je w numeryczne identyfikatory (wymaga tokenu bota Telegram).
    Jeśli wcześniej używane były pliki listy dozwolonych magazynu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` na potrzeby przepływów z listą dozwolonych (na przykład gdy `dmPolicy: "allowlist"` nie zawiera jeszcze jawnych identyfikatorów).

    W przypadku botów jednego właściciela preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi identyfikatorami `allowFrom` zamiast polegania na wcześniejszych zatwierdzeniach parowania.

    Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnych nie oznacza, że „ten nadawca jest upoważniony wszędzie”. Parowanie przyznaje wyłącznie dostęp do wiadomości prywatnych. Jeśli właściciel poleceń jeszcze nie istnieje, pierwsze zatwierdzone parowanie ustawia również `commands.ownerAllowFrom`, zapewniając poleceniom tylko dla właściciela i zatwierdzeniom wykonywania jawne konto operatora. Autoryzacja nadawców w grupach nadal wynika z jawnych list dozwolonych w konfiguracji.
    Aby jedna tożsamość była autoryzowana zarówno dla wiadomości prywatnych, jak i poleceń grupowych: umieść numeryczny identyfikator użytkownika Telegram w `channels.telegram.allowFrom`, a w przypadku poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

    ### Znajdowanie identyfikatora użytkownika Telegram

    Bezpieczniej (bez bota firmy trzeciej): wyślij wiadomość prywatną do swojego bota, uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalna metoda Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Firma trzecia (mniejsza prywatność): `@userinfobot` lub `@getidsbot`.

  </Tab>

  <Tab title="Zasada grup i listy dozwolonych">
    Dwa mechanizmy obowiązują jednocześnie:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`, `groupPolicy: "open"`: każda grupa przechodzi kontrolę identyfikatora grupy
       - brak konfiguracji `groups`, `groupPolicy: "allowlist"` (domyślnie): wszystkie grupy są blokowane do czasu dodania wpisów `groups` (lub `"*"`)
       - `groups` skonfigurowane: działa jako lista dozwolonych (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (domyślnie) / `disabled`

    `groupAllowFrom` filtruje nadawców grupowych; jeśli nie jest ustawione, Telegram używa zastępczo `allowFrom` (nie magazynu parowania — autoryzacja nadawców grupowych nigdy nie dziedziczy zatwierdzeń z magazynu parowania wiadomości prywatnych, co stanowi granicę bezpieczeństwa od `2026.2.25`).
    Wpisy `groupAllowFrom` powinny być numerycznymi identyfikatorami użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane); wpisy nienumeryczne są ignorowane. Nie umieszczaj tutaj identyfikatorów czatów grup ani supergrup — ujemne identyfikatory czatów należą do `channels.telegram.groups`.
    Praktyczny wzorzec dla botów jednego właściciela: ustaw identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` bez ustawienia i dopuść docelowe grupy w `channels.telegram.groups`.
    Jeśli `channels.telegram` całkowicie brakuje w konfiguracji, środowisko wykonawcze domyślnie stosuje zamknięte podejście `groupPolicy="allowlist"`, chyba że jawnie ustawiono `channels.defaults.groupPolicy`.

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

    Przetestuj w grupie za pomocą `@<bot_username> ping`. Zwykłe wiadomości grupowe nie wyzwalają bota, gdy `requireMention: true`.

    Zezwolenie dowolnemu członkowi jednej określonej grupy:

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

    Zezwolenie tylko określonym użytkownikom w jednej określonej grupie:

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
      Częsty błąd: `groupAllowFrom` nie jest listą dozwolonych grup.

      - Ujemne identyfikatory czatów grup i supergrup Telegram (`-1001234567890`) należą do `channels.telegram.groups`.
      - Identyfikatory użytkowników Telegram (`8734062810`) należą do `groupAllowFrom` i ograniczają osoby, które mogą wyzwolić bota wewnątrz dozwolonej grupy.
      - Użyj `groupAllowFrom: ["*"]` tylko po to, aby umożliwić każdemu członkowi dozwolonej grupy komunikowanie się z botem.

    </Warning>

  </Tab>

  <Tab title="Działanie wzmianek">
    Odpowiedzi w grupach domyślnie wymagają wzmianki. Wzmianka może pochodzić z:

    - natywnej wzmianki `@botusername` albo
    - wzorca wzmianki w `agents.list[].groupChat.mentionPatterns` lub `messages.groupChat.mentionPatterns`

    Przełączniki na poziomie sesji (tylko stan, bez zapisywania): `/activation always`, `/activation mention`. Aby ustawienie było trwałe, użyj konfiguracji:

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

    Kontekst historii grupy jest zawsze włączony i ograniczony przez `historyLimit`. Ustaw `channels.telegram.historyLimit: 0`, aby wyłączyć okno historii grupy. `openclaw doctor --fix` usuwa wycofany klucz `includeGroupHistoryContext`.

    Uzyskiwanie identyfikatora czatu grupowego: przekaż wiadomość grupową do `@userinfobot` / `@getidsbot`, odczytaj `chat.id` z `openclaw logs --follow`, sprawdź `getUpdates` interfejsu Bot API lub — po dopuszczeniu grupy — uruchom `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Działanie środowiska wykonawczego

- Telegram działa wewnątrz procesu Gateway.
- Routing jest deterministyczny: odpowiedzi na wiadomości przychodzące z Telegrama wracają do Telegrama (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi, symbolami zastępczymi multimediów oraz utrwalonym kontekstem łańcucha odpowiedzi dla odpowiedzi zaobserwowanych przez Gateway.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dołączają `:topic:<threadId>`.
- Wiadomości prywatne mogą zawierać `message_thread_id`; OpenClaw zachowuje tę wartość w odpowiedziach. Sesje tematów wiadomości prywatnych są rozdzielane tylko wtedy, gdy Telegram `getMe` zgłasza `has_topics_enabled: true` dla bota; w przeciwnym razie wiadomości prywatne pozostają w płaskiej sesji.
- Długie odpytywanie korzysta z runnera grammY z sekwencjonowaniem dla każdego czatu i wątku. Współbieżność ujścia runnera korzysta z `agents.defaults.maxConcurrent`.
- Uruchamianie wielu kont ogranicza liczbę równoczesnych sond `getMe`, aby duże floty botów nie uruchamiały sond dla wszystkich kont jednocześnie.
- Każdy proces Gateway chroni długie odpytywanie, aby w danym momencie tylko jeden aktywny proces odpytujący mógł używać tokenu bota. Utrzymujące się konflikty 409 `getUpdates` wskazują na inny Gateway OpenClaw, skrypt lub zewnętrzny proces odpytujący używający tego samego tokenu.
- Watchdog odpytywania domyślnie uruchamia je ponownie po 120 sekundach bez ukończonego sprawdzenia aktywności `getUpdates`. Wartość `channels.telegram.pollingStallThresholdMs` (30000-600000, obsługiwane są nadpisania dla poszczególnych kont) należy zwiększyć tylko wtedy, gdy we wdrożeniu występują fałszywe ponowne uruchomienia z powodu zastoju odpytywania podczas długotrwałych operacji.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

<Note>
  `channels.telegram.dm.threadReplies` i `channels.telegram.direct.<chatId>.threadReplies` zostały usunięte. Jeśli konfiguracja nadal zawiera te klucze, po aktualizacji należy uruchomić `openclaw doctor --fix`. Routing tematów wiadomości prywatnych jest teraz zgodny z Telegram `getMe.has_topics_enabled` (sterowany przez tryb wątków BotFather): boty z włączonymi tematami używają sesji wiadomości prywatnych ograniczonych do wątku, gdy Telegram wysyła `message_thread_id`; pozostałe wiadomości prywatne pozostają w płaskiej sesji.
</Note>

## Dokumentacja funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumieniowania na żywo (edycje wiadomości)">
    OpenClaw strumieniuje częściowe odpowiedzi w czasie rzeczywistym w czatach bezpośrednich, grupach i tematach: wysyła wiadomość podglądu, następnie wielokrotnie wykonuje `editMessageText`, a na końcu finalizuje ją w miejscu.

    - `channels.telegram.streaming` ma wartość `off | partial | block | progress` (domyślnie: `partial`)
    - krótkie początkowe podglądy odpowiedzi są opóźniane mechanizmem debounce, a następnie materializowane po ograniczonym czasie, jeśli przebieg nadal jest aktywny
    - `progress` utrzymuje jeden edytowalny szkic stanu dla postępu narzędzi, wyświetla stabilną etykietę stanu, gdy aktywność odpowiedzi pojawi się przed postępem narzędzi, usuwa go po zakończeniu i wysyła ostateczną odpowiedź jako zwykłą wiadomość
    - `streaming.preview.toolProgress` określa, czy aktualizacje narzędzi/postępu ponownie wykorzystują tę samą edytowaną wiadomość podglądu (domyślnie: `true`, gdy strumieniowanie podglądu jest aktywne)
    - `streaming.preview.commandText` określa poziom szczegółowości poleceń/wykonania w tych wierszach: `raw` (domyślnie) lub `status` (tylko etykieta narzędzia)
    - `streaming.progress.commentary` (domyślnie: `false`) włącza tekst komentarza/wstępu asystenta w tymczasowym szkicu postępu
    - wykrywane są starsze `channels.telegram.streamMode`, wartości logiczne `streaming` oraz wycofane klucze natywnego podglądu szkicu; aby je zmigrować, należy uruchomić `openclaw doctor --fix`

    Wiersze postępu narzędzi to krótkie aktualizacje stanu wyświetlane podczas działania narzędzi (wykonywanie poleceń, odczyt plików, aktualizacje planowania, podsumowania poprawek oraz wstęp/komentarz Codex w trybie serwera aplikacji). Telegram domyślnie pozostawia je włączone (zgodnie z zachowaniem wydanym od wersji `v2026.4.22`+).

    Aby zachować edycje podglądu odpowiedzi, ale ukryć wiersze postępu narzędzi:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    Aby zachować widoczny postęp narzędzi, ale ukryć tekst poleceń/wykonania:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    Tryb `progress` pokazuje postęp narzędzi bez edytowania ostatecznej odpowiedzi w tej wiadomości. Zasady dotyczące tekstu poleceń należy umieścić w `streaming.progress`:

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

    `streaming.mode: "off"` wyłącza edycje podglądu i tłumi ogólne komunikaty narzędzi/postępu zamiast wysyłać je jako osobne wiadomości o stanie; monity o zatwierdzenie, multimedia i błędy nadal są kierowane przez standardowe dostarczanie końcowe. `streaming.preview.toolProgress: false` zachowuje tylko edycje podglądu odpowiedzi.

    <Note>
      Wyjątkiem są odpowiedzi na zaznaczony cytat. Gdy `replyToMode` ma wartość `first`, `all` lub `batched`, a wiadomość przychodząca zawiera tekst zaznaczonego cytatu, OpenClaw wysyła ostateczną odpowiedź przez natywną ścieżkę odpowiedzi z cytatem Telegrama zamiast edytować podgląd odpowiedzi, dlatego `streaming.preview.toolProgress` nie może w tej turze wyświetlać wierszy stanu. Odpowiedzi na bieżącą wiadomość bez zaznaczonego tekstu cytatu nadal są strumieniowane. Jeśli widoczność postępu narzędzi jest ważniejsza niż natywne odpowiedzi z cytatem, należy ustawić `replyToMode: "off"`, albo ustawić `streaming.preview.toolProgress: false`, aby zaakceptować ten kompromis.
    </Note>

    W przypadku odpowiedzi zawierających tylko tekst: krótkie podglądy otrzymują końcową edycję w miejscu; długie odpowiedzi końcowe dzielone na wiele wiadomości ponownie wykorzystują podgląd jako pierwszy fragment, po czym wysyłana jest tylko pozostała część; odpowiedzi końcowe w trybie postępu usuwają szkic stanu i korzystają ze standardowego dostarczania końcowego; jeśli końcowa edycja nie powiedzie się przed potwierdzeniem zakończenia, OpenClaw przechodzi na standardowe dostarczanie końcowe i usuwa nieaktualny podgląd. W przypadku złożonych odpowiedzi (ładunków multimedialnych) OpenClaw zawsze przechodzi na standardowe dostarczanie końcowe i usuwa podgląd.

    Strumieniowanie podglądu i strumieniowanie bloków wzajemnie się wykluczają — gdy strumieniowanie bloków jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Rozumowanie: `/reasoning stream` strumieniuje rozumowanie do podglądu na żywo podczas generowania, a następnie usuwa podgląd rozumowania po dostarczeniu odpowiedzi końcowej (aby pozostawić go widocznym, należy użyć `/reasoning on`). Ostateczna odpowiedź jest wysyłana bez tekstu rozumowania.

  </Accordion>

  <Accordion title="Zaawansowane formatowanie wiadomości">
    Tekst wychodzący domyślnie korzysta ze standardowych wiadomości HTML Telegrama, czytelnych we wszystkich obecnych klientach: pogrubienie, kursywa, linki, kod, spoilery, cytaty — bez bloków dostępnych wyłącznie w rozszerzonym formacie Bot API 10.2 (natywnych tabel, szczegółów, rozszerzonych multimediów i formuł).

    Aby włączyć rozszerzone wiadomości Bot API 10.2:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Po włączeniu: agent otrzymuje informację, że rozszerzone wiadomości są dostępne dla tego bota/konta (wraz z obsługiwanym kontraktem tworzenia treści Markdown i wysp HTML); tekst Markdown jest renderowany przez reprezentację pośrednią Markdown OpenClaw jako typowane rozszerzone bloki Bot API 10.2 (nagłówki, tabele, szczegóły, listy kontrolne, rozszerzone multimedia, formuły, mapy i kolaże); podpisy multimediów nadal korzystają z podpisów HTML Telegrama (rozszerzone wiadomości nie zastępują podpisów, a ich limit wynosi 1024 znaki).

    Dzięki temu tekst modelu nie zawiera znaczników rozszerzonego Markdown Telegrama, więc waluty takie jak `$400-600K` nie są interpretowane jako wyrażenia matematyczne. Długi rozszerzony tekst jest automatycznie dzielony zgodnie z limitami Telegrama. Tabele przekraczające limit 20 kolumn są zastępowane blokiem kodu.

    Domyślnie: wyłączone ze względu na zgodność klientów — niektóre obecne klienty Desktop, Web, Android i klientów innych firm renderują zaakceptowane rozszerzone wiadomości jako nieobsługiwane. Należy pozostawić tę funkcję wyłączoną, chyba że każdy klient używany z botem potrafi je renderować. `/status` pokazuje, czy rozszerzone wiadomości są w bieżącej sesji włączone, czy wyłączone.

    Podglądy linków są domyślnie włączone. `channels.telegram.linkPreview: false` wyłącza automatyczne wykrywanie encji w rozszerzonym tekście.

  </Accordion>

  <Accordion title="Natywne i niestandardowe polecenia">
    Menu poleceń Telegrama jest rejestrowane podczas uruchamiania za pomocą `setMyCommands`. `commands.native: "auto"` włącza natywne polecenia dla Telegrama.

    Aby dodać niestandardowe pozycje menu poleceń:

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

    Reguły: nazwy są normalizowane (usunięcie początkowego `/`, zamiana na małe litery); prawidłowy wzorzec `a-z`, `0-9`, `_`, długość 1-32; niestandardowe polecenia nie mogą zastępować poleceń natywnych; konflikty i duplikaty są pomijane i rejestrowane.

    Niestandardowe polecenia są wyłącznie pozycjami menu — nie implementują automatycznie żadnego działania. Polecenia Plugin/Skills mogą nadal działać po wpisaniu, nawet jeśli nie są widoczne w menu Telegrama. Jeśli natywne polecenia są wyłączone, polecenia wbudowane zostają usunięte; niestandardowe polecenia i polecenia Plugin mogą nadal zostać zarejestrowane, jeśli je skonfigurowano.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` po ponownej próbie przycięcia oznacza, że menu nadal przekracza limit; należy zmniejszyć liczbę poleceń Plugin/Skills/niestandardowych lub wyłączyć `channels.telegram.commands.native`.
    - Niepowodzenie `deleteWebhook`, `deleteMyCommands` lub `setMyCommands` z `404: Not Found`, gdy bezpośrednie polecenia curl Bot API działają, zwykle oznacza, że `channels.telegram.apiRoot` ustawiono na pełny punkt końcowy `/bot<TOKEN>`. `apiRoot` musi wskazywać wyłącznie katalog główny Bot API; `openclaw doctor --fix` usuwa przypadkowe końcowe `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Należy zaktualizować `botToken`, `tokenFile` lub `TELEGRAM_BOT_TOKEN` (konto domyślne), używając bieżącego tokenu BotFather; OpenClaw zatrzymuje się przed rozpoczęciem odpytywania, więc błąd nie jest zgłaszany jako niepowodzenie czyszczenia Webhook.
    - `setMyCommands failed` z błędami sieci/pobierania zwykle oznacza, że wychodzący ruch DNS/HTTPS do `api.telegram.org` jest zablokowany.

    ### Polecenia parowania urządzeń (Plugin `device-pair`)

    Po zainstalowaniu:

    1. `/pair` generuje kod konfiguracji
    2. kod należy wkleić w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym rolę/zakresy)
    4. zatwierdzanie: `/pair approve <requestId>`, `/pair approve` (tylko oczekujące żądanie) lub `/pair approve latest`

    Jeśli urządzenie ponawia próbę ze zmienionymi danymi uwierzytelniania (rolą, zakresami lub kluczem publicznym), poprzednie oczekujące żądanie zostaje zastąpione nowym `requestId`; przed zatwierdzeniem należy ponownie uruchomić `/pair pending`.

    Więcej informacji: [Parowanie](/pl/channels/pairing#pair-via-telegram).

  </Accordion>

  <Accordion title="Przyciski wbudowane">
    Konfiguracja zakresu klawiatury wbudowanej:

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

    Zakresy: `off`, `dm`, `group`, `all`, `allowlist` (domyślnie). Starsze `capabilities: ["inlineButtons"]` jest mapowane na `"all"`.

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

    Przykład przycisku Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Otwórz aplikację:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Uruchom", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Przyciski `web_app` działają tylko w prywatnych czatach między użytkownikiem a botem.

    Kliknięcia wywołań zwrotnych nieprzejęte przez zarejestrowany interaktywny moduł obsługi pluginu są przekazywane agentowi jako tekst: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Akcje wiadomości Telegram dla agentów i automatyzacji">
    Akcje:

    - `sendMessage` (`to`, `content`, opcjonalnie `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` lub `caption`, opcjonalnie przyciski wbudowane `presentation`; edycje dotyczące wyłącznie przycisków aktualizują znaczniki odpowiedzi)
    - `createForumTopic` (`chatId`, `name`, opcjonalnie `iconColor`, `iconCustomEmojiId`)

    Ergonomiczne aliasy: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Ograniczenia: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (domyślnie: wyłączone). `edit`, `createForumTopic` i `editForumTopic` są domyślnie włączone bez osobnego przełącznika.
    Wysyłanie w czasie wykonywania korzysta z aktywnej migawki konfiguracji i sekretów utworzonej podczas uruchamiania lub ponownego ładowania, dlatego ścieżki akcji nie rozwiązują ponownie wartości `SecretRef` przy każdym wysłaniu.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions).

  </Accordion>

  <Accordion title="Znaczniki wątków odpowiedzi">
    Jawne znaczniki wątków odpowiedzi w generowanych danych wyjściowych:

    - `[[reply_to_current]]` — odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` — odpowiada na wiadomość o określonym identyfikatorze

    `channels.telegram.replyToMode`: `off` (domyślnie), `first`, `all`.

    Gdy wątki odpowiedzi są włączone, a oryginalny tekst lub podpis jest dostępny, OpenClaw automatycznie dodaje natywny fragment cytatu. Telegram ogranicza tekst natywnego cytatu do 1024 jednostek kodowych UTF-16; w przypadku dłuższych wiadomości cytowany jest ich początek, a jeśli Telegram odrzuci cytat, używana jest zwykła odpowiedź.

    `off` wyłącza tylko niejawne wątki odpowiedzi; jawne znaczniki `[[reply_to_*]]` są nadal respektowane.

  </Accordion>

  <Accordion title="Tematy forum i działanie wątków">
    Supergrupy forum: do kluczy sesji tematów dołączany jest `:topic:<threadId>`; odpowiedzi i wskaźniki pisania są kierowane do wątku tematu; ścieżka konfiguracji tematu to `channels.telegram.groups.<chatId>.topics.<threadId>`.

    Temat ogólny (`threadId=1`) jest przypadkiem szczególnym: wysyłane wiadomości pomijają `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)` z komunikatem „nie znaleziono wątku”), ale akcje pisania nadal zawierają `message_thread_id` (zgodnie z obserwacjami jest to wymagane, aby wskaźnik pisania był widoczny).

    Wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` dotyczy wyłącznie tematu i nie dziedziczy wartości domyślnych grupy. `topics."*"` ustawia wartości domyślne dla każdego tematu w tej grupie; dokładne identyfikatory tematów nadal mają pierwszeństwo przed `"*"`.

    **Kierowanie agentów według tematów**: każdy temat można skierować do innego agenta za pomocą `agentId` w konfiguracji tematu, zapewniając mu własny obszar roboczy, pamięć i sesję:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Temat ogólny -> agent główny
                "3": { agentId: "zu" },        // Temat programistyczny -> agent zu
                "5": { agentId: "coder" }      // Przegląd kodu -> agent coder
              }
            }
          }
        }
      }
    }
    ```

    Każdy temat ma wtedy własny klucz sesji, na przykład `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Trwałe powiązanie tematu ACP**: tematy forum mogą przypinać sesje środowiska ACP za pomocą typowanych powiązań najwyższego poziomu (`bindings[]` z `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` oraz identyfikatorem uwzględniającym temat, takim jak `-1001234567890:topic:42`). Obecnie zakres jest ograniczony do tematów forum w grupach i supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Uruchamianie ACP powiązanego z wątkiem z poziomu czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne wiadomości są kierowane bezpośrednio do niej, a OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga `channels.telegram.threadBindings.spawnSessions` (domyślnie: `true`).

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty w wiadomościach prywatnych z `message_thread_id` zachowują metadane odpowiedzi, ale używają kluczy sesji uwzględniających wątki tylko wtedy, gdy Telegram `getMe` zgłasza `has_topics_enabled: true`.
    Wycofane nadpisania `dm.threadReplies` i `direct.*.threadReplies` zostały usunięte; tryb wątków BotFather jest jedynym źródłem prawdy. Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne klucze konfiguracji.

  </Accordion>

  <Accordion title="Dźwięk, wideo i naklejki">
    ### Wiadomości dźwiękowe

    Telegram rozróżnia notatki głosowe od plików dźwiękowych. Domyślnie używane jest zachowanie pliku dźwiękowego; znacznik `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie notatki głosowej. Transkrypcje przychodzących notatek głosowych są przedstawiane w kontekście agenta jako wygenerowany maszynowo, niezaufany tekst, ale wykrywanie wzmianek nadal korzysta z nieprzetworzonej transkrypcji, dzięki czemu wiadomości głosowe wymagające wzmianki nadal działają.

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

    Telegram rozróżnia pliki wideo od notatek wideo. Notatki wideo nie obsługują podpisów; podany tekst wiadomości jest wysyłany osobno.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Lokalizacje i miejsca

    Użyj istniejącej akcji `send` z jednym samodzielnym obiektem `location`. Współrzędne powodują wysłanie natywnego znacznika; dodanie zarówno `name`, jak i `address` powoduje wysłanie natywnej karty miejsca. Lokalizacji nie można wysyłać razem z tekstem wiadomości ani multimediami.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Eiffel Tower",
    address: "Champ de Mars, Paris",
  },
}
```

    ### Naklejki

    Dane przychodzące: statyczny plik WEBP jest pobierany i przetwarzany (symbol zastępczy `<media:sticker>`); animowane pliki TGS i pliki wideo WEBM są pomijane.

    Pola kontekstu naklejki: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Opisy są buforowane w stanie pluginu OpenClaw w SQLite, aby ograniczyć powtarzające się wywołania analizy obrazu.

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

    Wyślij:

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
    Reakcje Telegram są odbierane jako aktualizacje `message_reaction`, niezależnie od ładunków wiadomości. Po włączeniu OpenClaw umieszcza w kolejce zdarzenia systemowe, takie jak `Telegram reaction added: 👍 by Alice (@alice) on msg 42`.

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    `own` oznacza wyłącznie reakcje użytkowników na wiadomości wysłane przez bota (w miarę możliwości, z użyciem pamięci podręcznej wysłanych wiadomości). Zdarzenia reakcji nadal podlegają mechanizmom kontroli dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); wiadomości od nieuprawnionych nadawców są odrzucane.

    Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji: grupy niebędące forami są kierowane do sesji czatu grupowego; grupy forum są kierowane do sesji tematu ogólnego (`:topic:1`), a nie do dokładnego tematu źródłowego.

    `allowed_updates` dla odpytywania lub Webhooka automatycznie zawiera `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą. `messages.ackReactionScope` określa, *kiedy* jest ono wysyłane.

    **Kolejność rozwiązywania emoji:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - zastępcze emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie „👀”)

    Telegram oczekuje emoji Unicode (na przykład „👀”); użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

    **Zakres (`messages.ackReactionScope`, domyślnie `"group-mentions"`; obecnie bez nadpisania na poziomie konta ani kanału Telegram):**

    `all` (wiadomości prywatne i grupy, w tym zdarzenia otoczenia pokoju), `direct` (tylko wiadomości prywatne), `group-all` (każda wiadomość grupowa z wyjątkiem zdarzeń otoczenia pokoju, bez wiadomości prywatnych), `group-mentions` (grupy, gdy wspomniano bota; **bez wiadomości prywatnych** — domyślnie), `off` / `none` (wyłączone).

    <Note>
    Domyślny zakres (`group-mentions`) nie wyzwala reakcji potwierdzających w wiadomościach prywatnych ani w zdarzeniach otoczenia pokoju. Użyj `direct` lub `all` dla wiadomości prywatnych; tylko `all` potwierdza zdarzenia otoczenia pokoju. Ta wartość jest odczytywana podczas uruchamiania dostawcy Telegram, dlatego zmiana wymaga ponownego uruchomienia Gateway.
    </Note>

  </Accordion>

  <Accordion title="Zapisy konfiguracji ze zdarzeń i poleceń Telegram">
    Zapisywanie konfiguracji kanału jest domyślnie włączone (`configWrites !== false`). Zapisy wyzwalane przez Telegram obejmują zdarzenia migracji grup (`migrate_to_chat_id`, aktualizuje `channels.telegram.groups`) oraz `/config set` / `/config unset` (wymaga włączenia poleceń).

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

  <Accordion title="Długie odpytywanie a Webhook">
    Domyślnie używane jest długie odpytywanie. W trybie Webhooka ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath` (domyślnie `/telegram-webhook`), `webhookHost` (domyślnie `127.0.0.1`), `webhookPort` (domyślnie `8787`), `webhookCertPath` (certyfikat PEM z podpisem własnym dla konfiguracji korzystających bezpośrednio z adresu IP lub bez domeny).

    W trybie długiego odpytywania OpenClaw utrwala znacznik wznowienia dopiero po pomyślnym przekazaniu aktualizacji; niepowodzenie modułu obsługi pozostawia możliwość ponowienia tej aktualizacji w tym samym procesie zamiast oznaczać ją jako ukończoną.

    Lokalny odbiornik domyślnie wiąże się z `127.0.0.1:8787`. W przypadku publicznego ruchu przychodzącego umieść odwrotne proxy przed lokalnym portem albo świadomie ustaw `webhookHost: "0.0.0.0"`.

    Tryb Webhooka weryfikuje zabezpieczenia żądania, tajny token Telegram i treść JSON, a następnie zatwierdza aktualizację w trwałej kolejce ruchu przychodzącego przed zwróceniem pustej odpowiedzi `200`. Pomyślne trwałe przyjęcie zawiera `x-openclaw-delivery-accepted: durable`; odpowiedzi dotyczące stanu, routingu, uwierzytelniania, walidacji i błędów pamięci masowej pomijają ten nagłówek. Odwrotne proxy i kontrolery hosta mogą wymagać tego nagłówka, aby odróżnić przyjęcie przez OpenClaw od ogólnej pustej odpowiedzi `200` bez wnioskowania o akceptacji na podstawie czasu odpowiedzi.

    Następnie OpenClaw przetwarza aktualizację asynchronicznie w tych samych ścieżkach bota przypisanych do poszczególnych czatów i tematów, które są używane przez długie odpytywanie, dzięki czemu powolne przebiegi agenta nie wstrzymują potwierdzenia dostarczenia do Telegram.

  </Accordion>

  <Accordion title="Limity, ponawianie prób i cele CLI">
    - `channels.telegram.textChunkLimit` domyślnie 4000; `streaming.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed podziałem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów.
    - `channels.telegram.mediaGroupFlushMs` (domyślnie 500, zakres 10-60000) określa, jak długo albumy/grupy multimediów są buforowane, zanim OpenClaw przekaże je jako jedną wiadomość przychodzącą. Należy zwiększyć tę wartość, jeśli części albumu docierają z opóźnieniem; zmniejszyć ją, aby skrócić opóźnienie odpowiedzi na album.
    - `channels.telegram.timeoutSeconds` zastępuje limit czasu klienta API (jeśli nie ustawiono wartości, obowiązuje domyślna wartość grammY). Klienty botów ograniczają skonfigurowane wartości poniżej 60-sekundowego zabezpieczenia żądań wychodzącego tekstu/pisania, aby grammY nie przerwał dostarczania widocznej odpowiedzi, zanim zadziałają zabezpieczenie transportu i mechanizm awaryjny OpenClaw. Długie odpytywanie nadal korzysta z 45-sekundowego zabezpieczenia żądania `getUpdates`, aby bezczynne odpytywania nie były porzucane na czas nieokreślony.
    - `channels.telegram.pollingStallThresholdMs` ma domyślną wartość 120000; wartość z zakresu od 30000 do 600000 należy dostosowywać wyłącznie w przypadku fałszywie dodatnich restartów spowodowanych wykryciem zastoju odpytywania.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` lub `messages.groupChat.historyLimit` (domyślnie 50); `0` ją wyłącza.
    - dodatkowy kontekst odpowiedzi/cytowania/przekazania jest normalizowany do jednego wybranego okna kontekstu konwersacji, gdy Gateway zaobserwował wiadomości nadrzędne; pamięć podręczna zaobserwowanych wiadomości znajduje się w stanie pluginu SQLite OpenClaw, a `openclaw doctor --fix` importuje starsze pliki pomocnicze. Telegram uwzględnia tylko jeden płytki `reply_to_message` na aktualizację, dlatego łańcuchy starsze niż pamięć podręczna są ograniczone do tego ładunku.
    - listy dozwolonych Telegram przede wszystkim określają, kto może uruchamiać agenta, a nie stanowią pełnej granicy redagowania dodatkowego kontekstu.
    - historia wiadomości prywatnych: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` dotyczy funkcji pomocniczych wysyłania Telegram (CLI/narzędzia/akcje) w przypadku możliwych do usunięcia błędów wychodzącego API. Dostarczanie końcowej odpowiedzi przychodzącej korzysta z ograniczonego, bezpiecznego ponawiania prób w przypadku błędów sprzed nawiązania połączenia, ale nie ponawia niejednoznacznych kopert sieciowych po wysłaniu, które mogłyby spowodować zduplikowanie widocznych wiadomości.

    Cele wysyłania CLI i narzędzia wiadomości akceptują numeryczny identyfikator czatu, nazwę użytkownika lub cel tematu forum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Ankiety używają `openclaw message poll` i obsługują tematy forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flagi ankiet dostępne tylko w Telegram: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (lub cel `:topic:`). `--poll-option` powtarza się 2-12 razy (limit opcji Telegram).

    Wysyłanie w Telegram obsługuje także `--presentation` z blokami `buttons` dla klawiatur wbudowanych (gdy zezwala na to `channels.telegram.capabilities.inlineButtons`), `--pin` lub `--delivery '{"pin":true}'` w celu zażądania przypięcia dostarczonej wiadomości, gdy bot może przypinać wiadomości na danym czacie, oraz `--force-document`, aby wysyłać wychodzące obrazy, pliki GIF i filmy jako dokumenty zamiast skompresowanych/animowanych przesyłanych plików lub filmów.

    Ograniczanie akcji: `channels.telegram.actions.sendMessage=false` wyłącza wszystkie wiadomości wychodzące, w tym ankiety; `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet, pozostawiając włączone zwykłe wysyłanie.

  </Accordion>

  <Accordion title="Zatwierdzanie wykonywania poleceń w Telegram">
    Telegram obsługuje zatwierdzanie wykonywania poleceń w wiadomościach prywatnych osób zatwierdzających i opcjonalnie może publikować monity na czacie lub w temacie źródłowym. Osoby zatwierdzające muszą być identyfikowane za pomocą numerycznych identyfikatorów użytkowników Telegram.

    - `channels.telegram.execApprovals.enabled` (`"auto"` włącza funkcję, gdy można rozpoznać co najmniej jedną osobę zatwierdzającą)
    - `channels.telegram.execApprovals.approvers` (w razie potrzeby używa numerycznych identyfikatorów właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` określają, kto może komunikować się z botem i gdzie bot wysyła zwykłe odpowiedzi — nie nadają one uprawnień do zatwierdzania wykonywania poleceń. Pierwsze zatwierdzone parowanie przez wiadomość prywatną inicjuje `commands.ownerAllowFrom`, jeśli nie istnieje jeszcze właściciel poleceń, dzięki czemu konfiguracje z jednym właścicielem działają bez powielania identyfikatorów w `execApprovals.approvers`.

    Dostarczanie do kanału wyświetla tekst polecenia na czacie; `channel` lub `both` należy włączać wyłącznie w zaufanych grupach/tematach. Gdy monit trafia do tematu forum, OpenClaw zachowuje temat dla monitu zatwierdzenia i dalszych wiadomości. Zatwierdzenia wykonywania poleceń domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania w treści wymagają również, aby `channels.telegram.capabilities.inlineButtons` zezwalało na docelową powierzchnię (`dm`, `group` lub `all`). Identyfikatory zatwierdzeń z prefiksem `plugin:` są rozpoznawane przez zatwierdzenia pluginu; pozostałe są najpierw rozpoznawane przez zatwierdzenia wykonywania poleceń.

    Zobacz [Zatwierdzanie wykonywania poleceń](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Sterowanie odpowiedziami o błędach

Gdy agent napotka błąd dostarczania lub dostawcy, zasady obsługi błędów określają, czy komunikaty o błędach trafiają na czat Telegram:

| Klucz                                 | Wartości                     | Domyślnie         | Opis                                                                                                                                                                                              |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` wysyła każdy komunikat o błędzie na czat. `once` wysyła każdy unikalny komunikat o błędzie raz na okres karencji (pomija powtarzające się identyczne błędy). `silent` nigdy nie wysyła komunikatów o błędach na czat. |
| `channels.telegram.errorCooldownMs` | liczba (ms)                | `14400000` (4h) | Okres karencji dla zasady `once`. Po wysłaniu błędu ten sam komunikat jest pomijany do upływu tego interwału. Zapobiega zalewaniu błędami podczas awarii.                                           |

Obsługiwane są nadpisania dla poszczególnych kont, grup i tematów (takie samo dziedziczenie jak w przypadku innych kluczy konfiguracji Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // pomijaj błędy w tej grupie
        },
      },
    },
  },
}
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Bot nie odpowiada na wiadomości grupowe bez wzmianki">

    - Jeśli `requireMention=false`, tryb prywatności Telegram musi zezwalać na pełną widoczność: BotFather `/setprivacy` -> Disable, a następnie należy usunąć bota z grupy i dodać go ponownie.
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` sprawdza jawne numeryczne identyfikatory grup; nie można sprawdzić członkostwa dla symbolu wieloznacznego `"*"`.
    - Szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - Gdy istnieje `channels.telegram.groups`, grupa musi znajdować się na liście (lub zawierać `"*"`).
    - Należy sprawdzić członkostwo bota w grupie.
    - Należy przejrzeć `openclaw logs --follow` pod kątem przyczyn pominięcia.

  </Accordion>

  <Accordion title="Polecenia działają częściowo lub wcale">

    - Należy autoryzować tożsamość nadawcy (parowanie i/lub numeryczny `allowFrom`); autoryzacja poleceń nadal obowiązuje, nawet gdy zasada grupy to `open`.
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu natywne zawiera zbyt wiele pozycji; należy zmniejszyć liczbę poleceń pluginów/Skills/niestandardowych lub wyłączyć menu natywne.
    - Wywołania startowe `deleteMyCommands` / `setMyCommands` oraz wywołania pisania `sendChatAction` są ograniczone i w przypadku przekroczenia limitu czasu żądania są ponawiane raz za pośrednictwem awaryjnego transportu Telegram. Utrzymujące się błędy sieci/pobierania zazwyczaj oznaczają, że DNS/HTTPS do `api.telegram.org` jest nieosiągalny.

  </Accordion>

  <Accordion title="Podczas uruchamiania zgłaszany jest nieautoryzowany token">

    - `getMe returned 401` to błąd uwierzytelniania Telegram dotyczący skonfigurowanego tokenu bota. Należy ponownie skopiować lub wygenerować token w BotFather, a następnie zaktualizować `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` lub `TELEGRAM_BOT_TOKEN` (konto domyślne).
    - `deleteWebhook 401 Unauthorized` podczas uruchamiania również oznacza błąd uwierzytelniania; potraktowanie go jako „brak Webhooka” jedynie odroczyłoby ten sam błąd nieprawidłowego tokenu do późniejszego wywołania API.

  </Accordion>

  <Accordion title="Niestabilność odpytywania lub sieci">

    - Node 22+ z niestandardowym mechanizmem fetch/proxy może powodować natychmiastowe przerywanie, jeśli typy `AbortSignal` są niezgodne.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` do IPv6; niesprawny ruch wychodzący IPv6 powoduje sporadyczne błędy API.
    - Wpisy dziennika zawierające `TypeError: fetch failed` lub `Network request for 'getUpdates' failed!` są ponawiane jako możliwe do usunięcia błędy sieciowe.
    - Podczas uruchamiania odpytywania OpenClaw ponownie wykorzystuje udaną startową próbę `getMe` dla grammY, dzięki czemu moduł uruchamiający nie potrzebuje drugiego `getMe` przed pierwszym `getUpdates`.
    - Jeśli `deleteWebhook` zakończy się przejściowym błędem sieci podczas uruchamiania odpytywania, OpenClaw przechodzi do długiego odpytywania zamiast wykonywać kolejne wywołanie płaszczyzny sterowania przed odpytywaniem. Nadal aktywny Webhook ujawnia się wtedy jako konflikt `getUpdates`; OpenClaw przebudowuje transport i ponawia czyszczenie Webhooka.
    - Jeśli gniazda Telegram są odnawiane w krótkim, stałym cyklu, należy sprawdzić, czy `channels.telegram.timeoutSeconds` nie ma niskiej wartości — klienty botów ograniczają skonfigurowane wartości poniżej zabezpieczeń żądań wychodzących i `getUpdates`, ale starsze wersje mogły przerywać każde odpytywanie lub odpowiedź, gdy ustawiono wartość niższą od tych zabezpieczeń.
    - `Polling stall detected` w dziennikach oznacza, że OpenClaw restartuje odpytywanie i przebudowuje transport po domyślnie 120 sekundach bez ukończonego potwierdzenia aktywności długiego odpytywania.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy uruchomione konto korzystające z odpytywania nie ukończyło `getUpdates` po okresie karencji uruchamiania, uruchomione konto korzystające z Webhooka nie ukończyło `setWebhook` po okresie karencji uruchamiania albo ostatnia pomyślna aktywność transportu odpytywania jest nieaktualna.
    - Wartość `channels.telegram.pollingStallThresholdMs` należy zwiększać tylko wtedy, gdy długotrwałe wywołania `getUpdates` działają prawidłowo, ale host nadal zgłasza fałszywe restarty z powodu zastoju odpytywania. Utrzymujące się zastoje zazwyczaj wskazują na problemy z proxy, DNS, IPv6 lub wychodzącym TLS do `api.telegram.org`.
    - Telegram uwzględnia zmienne środowiskowe proxy procesu dla transportu Bot API: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` oraz ich warianty pisane małymi literami. `NO_PROXY` / `no_proxy` nadal mogą omijać `api.telegram.org`.
    - Jeśli `OPENCLAW_PROXY_URL` jest ustawione dla środowiska usługi i nie istnieją standardowe zmienne środowiskowe proxy, Telegram również używa tego adresu URL dla transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS należy kierować wywołania API Telegram przez proxy:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2). Kolejność wyników DNS Telegram uwzględnia najpierw `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, następnie `channels.telegram.network.dnsResultOrder`, a potem ustawienie domyślne procesu (na przykład `NODE_OPTIONS=--dns-result-order=ipv4first`); jeśli żadne z nich nie ma zastosowania, w Node 22+ używane jest `ipv4first`.
    - W WSL2 lub gdy lepiej działa tryb wyłącznie IPv4, należy wymusić wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu testowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone podczas pobierania multimediów Telegram. Jeśli zaufany serwer proxy typu fake-IP lub przezroczysty serwer proxy podczas pobierania multimediów przepisuje `api.telegram.org` na inny adres prywatny, wewnętrzny lub specjalnego przeznaczenia, należy włączyć obejście dotyczące wyłącznie Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo ustawienie można włączyć osobno dla każdego konta w `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli serwer proxy rozwiązuje nazwy hostów multimediów Telegram na adresy z zakresu `198.18.x.x`, należy najpierw pozostawić niebezpieczną flagę wyłączoną — ten zakres jest już domyślnie dozwolony.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia SSRF multimediów Telegram. Należy używać go wyłącznie w zaufanych środowiskach proxy kontrolowanych przez operatora (routing fake-IP Clash, Mihomo lub Surge), które generują odpowiedzi prywatne lub specjalnego przeznaczenia spoza zakresu testowego RFC 2544. W przypadku zwykłego dostępu do Telegram przez publiczny internet należy pozostawić je wyłączone.
    </Warning>

    - Tymczasowe nadpisania za pomocą zmiennych środowiskowych: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - Sprawdzanie odpowiedzi DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Więcej pomocy: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji — Telegram](/pl/gateway/config-channels#telegram).

<Accordion title="Najważniejsze pola Telegram">

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile` (musi być zwykłym plikiem; dowiązania symboliczne są odrzucane), `accounts.*`
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, nadrzędne `bindings[]` (`type: "acp"`)
- wartości domyślne tematów: `groups.<chatId>.topics."*"` ma zastosowanie do niedopasowanych tematów forum; dokładne identyfikatory tematów mają przed nim pierwszeństwo
- zatwierdzanie wykonywania poleceń: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`, `threadBindings`
- strumieniowanie: `streaming` (tryby `off | partial | block | progress`), `streaming.preview.toolProgress`
- formatowanie/dostarczanie: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- niestandardowy katalog główny API: `apiRoot` (tylko katalog główny Bot API; nie należy dołączać `/bot<TOKEN>`), `trustedLocalFileRoots` (bezwzględne katalogi główne `file_path` samodzielnie hostowanego Bot API)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- zapisywanie/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Kolejność pierwszeństwa wielu kont: jeśli skonfigurowano co najmniej dwa identyfikatory kont, należy ustawić `channels.telegram.defaultAccount` (lub uwzględnić `channels.telegram.accounts.default`), aby jawnie określić domyślny routing. W przeciwnym razie OpenClaw użyje pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` wyświetli ostrzeżenie. Nazwane konta dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
</Note>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Parowanie użytkownika Telegram z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Działanie list dozwolonych grup i tematów.
  </Card>
  <Card title="Routing kanałów" icon="route" href="/pl/channels/channel-routing">
    Kierowanie wiadomości przychodzących do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i wzmacnianie zabezpieczeń.
  </Card>
  <Card title="Routing wieloagentowy" icon="sitemap" href="/pl/concepts/multi-agent">
    Przypisywanie grup i tematów do agentów.
  </Card>
  <Card title="Rozwiązywanie problemów" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka obejmująca wiele kanałów.
  </Card>
</CardGroup>
