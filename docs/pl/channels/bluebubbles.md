---
read_when:
    - Konfigurowanie kanału BlueBubbles
    - Rozwiązywanie problemów z parowaniem Webhook
    - Konfigurowanie iMessage w systemie macOS
sidebarTitle: BlueBubbles
summary: Starsza obsługa iMessage za pośrednictwem serwera BlueBubbles dla macOS (wysyłanie/odbieranie przez REST, wskaźniki pisania, reakcje, parowanie, zaawansowane działania).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-07T01:51:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: e32b35242c7e751b49dcd8d839bc291c80cb4d88c0b4ce6f65635b7ef2ed97c3
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: dołączony starszy Plugin, który komunikuje się z serwerem BlueBubbles dla macOS przez HTTP. Istniejące konfiguracje BlueBubbles nadal działają, ale nowe wdrożenia OpenClaw iMessage powinny preferować natywny Plugin [iMessage](/pl/channels/imessage), gdy jego wymagania pasują do Twojego hosta.

<Warning>
BlueBubbles jest przestarzały dla nowych konfiguracji OpenClaw.

Nadrzędny ekosystem BlueBubbles jest nadal aktywny, ale OpenClaw zależy od API serwera BlueBubbles dla macOS. Na dzień 6 maja 2026 r. oficjalna gałąź rozwojowa [`bluebubbles-server`](https://github.com/BlueBubblesApp/bluebubbles-server) ostatnio zmieniła się [22 stycznia 2026 r.](https://github.com/BlueBubblesApp/bluebubbles-server/commit/88a4921bbd5a8111f1e9582b83715cf877171037), a najnowsze wydanie serwera ([`v1.9.9`](https://github.com/BlueBubblesApp/bluebubbles-server/releases/tag/v1.9.9)) opublikowano 16 maja 2025 r. Aplikacja kliencka i repozytoria pomocnicze mają nowszą aktywność, więc nie jest to twierdzenie o porzuceniu projektu; deprecjacja dotyczy ograniczenia zależności OpenClaw od zewnętrznego serwera HTTP, webhooków i powierzchni zgodności prywatnego API, gdy natywna ścieżka `imsg` utrzymuje integrację na lokalnym kontrakcie stdio.
</Warning>

<Note>
Bieżące wydania OpenClaw zawierają BlueBubbles, więc zwykłe spakowane kompilacje nie wymagają osobnego kroku `openclaw plugins install`.
</Note>

## Omówienie

- Działa na macOS przez aplikację pomocniczą BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Starsza opcja awaryjna dla instalacji, które już polegają na identyfikatorach kanałów BlueBubbles, stanie webhooków, celach grupowych, dostarczaniu cron lub routingu obszarów roboczych.
- Zalecane/przetestowane: macOS Sequoia (15). macOS Tahoe (26) działa; edycja jest obecnie zepsuta na Tahoe, a aktualizacje ikon grup mogą zgłaszać powodzenie, ale się nie synchronizować.
- OpenClaw komunikuje się z nim przez jego REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Wiadomości przychodzące docierają przez webhooki; odpowiedzi wychodzące, wskaźniki pisania, potwierdzenia odczytu i tapbacki są wywołaniami REST.
- Załączniki i naklejki są przetwarzane jako media przychodzące (i gdy to możliwe, udostępniane agentowi).
- Odpowiedzi Auto-TTS, które syntetyzują dźwięk MP3 lub CAF, są dostarczane jako dymki notatek głosowych iMessage zamiast zwykłych załączników plików.
- Parowanie/lista dozwolonych działa tak samo jak w innych kanałach (`/channels/pairing` itd.) z `channels.bluebubbles.allowFrom` + kodami parowania.
- Reakcje są udostępniane jako zdarzenia systemowe, tak jak w Slack/Telegram, aby agenci mogli o nich „wspomnieć” przed odpowiedzią.
- Funkcje zaawansowane: edycja, cofanie wysłania, wątki odpowiedzi, efekty wiadomości, zarządzanie grupami.

## Szybki start

<Steps>
  <Step title="Install BlueBubbles">
    Zainstaluj serwer BlueBubbles na Macu (postępuj zgodnie z instrukcjami na [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    W konfiguracji BlueBubbles włącz web API i ustaw hasło.
  </Step>
  <Step title="Configure OpenClaw">
    Uruchom `openclaw onboard` i wybierz BlueBubbles albo skonfiguruj ręcznie:

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="Point webhooks at the gateway">
    Skieruj webhooki BlueBubbles do swojego Gateway (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Uruchom Gateway; zarejestruje obsługę webhooka i rozpocznie parowanie.
  </Step>
</Steps>

<Warning>
**Bezpieczeństwo**

- Zawsze ustaw hasło webhooka.
- Uwierzytelnianie Webhook jest zawsze wymagane. OpenClaw odrzuca żądania webhooków BlueBubbles, chyba że zawierają hasło/guid zgodne z `channels.bluebubbles.password` (na przykład `?password=<password>` lub `x-password`), niezależnie od topologii loopback/proxy.
- Uwierzytelnianie hasłem jest sprawdzane przed odczytaniem/przeanalizowaniem pełnych treści webhooków.

</Warning>

## Utrzymywanie Messages.app przy życiu (konfiguracje VM / headless)

Niektóre konfiguracje macOS VM / zawsze włączone mogą doprowadzić do przejścia Messages.app w stan „bezczynności” (zdarzenia przychodzące zatrzymują się, dopóki aplikacja nie zostanie otwarta/przeniesiona na pierwszy plan). Prostym obejściem jest **wybudzanie Messages co 5 minut** za pomocą AppleScript + LaunchAgent.

<Steps>
  <Step title="Save the AppleScript">
    Zapisz to jako `~/Scripts/poke-messages.scpt`:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="Install a LaunchAgent">
    Zapisz to jako `~/Library/LaunchAgents/com.user.poke-messages.plist`:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    Uruchamia się to **co 300 sekund** i **przy logowaniu**. Pierwsze uruchomienie może wywołać monity macOS **Automation** (`osascript` → Messages). Zatwierdź je w tej samej sesji użytkownika, która uruchamia LaunchAgent.

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Wprowadzanie

BlueBubbles jest dostępny w interaktywnym wprowadzaniu:

```
openclaw onboard
```

Kreator pyta o:

<ParamField path="Server URL" type="string" required>
  Adres serwera BlueBubbles (np. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Hasło API z ustawień BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Ścieżka punktu końcowego Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` lub `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Numery telefonów, adresy e-mail lub cele czatów.
</ParamField>

Możesz też dodać BlueBubbles przez CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kontrola dostępu (DM-y + grupy)

<Tabs>
  <Tab title="DMs">
    - Domyślnie: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
    - Zatwierdź przez:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Parowanie jest domyślną wymianą tokenów. Szczegóły: [Parowanie](/pl/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (domyślnie: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` kontroluje, kto może wyzwalać w grupach, gdy ustawiono `allowlist`.

  </Tab>
</Tabs>

### Wzbogacanie nazw kontaktów (macOS, opcjonalnie)

Webhooki grup BlueBubbles często zawierają tylko surowe adresy uczestników. Jeśli chcesz, aby kontekst `GroupMembers` pokazywał zamiast tego lokalne nazwy kontaktów, możesz włączyć lokalne wzbogacanie z Kontaktów na macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` włącza wyszukiwanie. Domyślnie: `false`.
- Wyszukiwania są uruchamiane dopiero po tym, jak dostęp do grupy, autoryzacja poleceń i bramkowanie wzmianek przepuszczą wiadomość.
- Wzbogacani są tylko nienazwani uczestnicy telefoniczni.
- Surowe numery telefonów pozostają opcją awaryjną, gdy nie znaleziono lokalnego dopasowania.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Bramkowanie wzmianek (grupy)

BlueBubbles obsługuje bramkowanie wzmianek dla czatów grupowych, zgodnie z zachowaniem iMessage/WhatsApp:

- Używa `agents.list[].groupChat.mentionPatterns` (lub `messages.groupChat.mentionPatterns`) do wykrywania wzmianek.
- Gdy `requireMention` jest włączone dla grupy, agent odpowiada tylko po wzmiance.
- Polecenia kontrolne od autoryzowanych nadawców omijają bramkowanie wzmianek.

Konfiguracja dla grupy:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Prompt systemowy dla grupy

Każdy wpis pod `channels.bluebubbles.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do promptu systemowego agenta przy każdej turze obsługującej wiadomość w tej grupie, dzięki czemu możesz ustawić personę lub reguły zachowania dla grupy bez edytowania promptów agenta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

Klucz odpowiada temu, co BlueBubbles zgłasza jako `chatGuid` / `chatIdentifier` / numeryczne `chatId` dla grupy, a wpis wieloznaczny `"*"` zapewnia ustawienie domyślne dla każdej grupy bez dokładnego dopasowania (ten sam wzorzec używany przez `requireMention` i zasady narzędzi dla grup). Dokładne dopasowania zawsze wygrywają z symbolem wieloznacznym. DM-y ignorują to pole; zamiast tego użyj dostosowania promptu na poziomie agenta lub konta.

#### Przykład praktyczny: odpowiedzi w wątkach i reakcje tapback (Private API)

Przy włączonym BlueBubbles Private API wiadomości przychodzące docierają z krótkimi identyfikatorami wiadomości (na przykład `[[reply_to:5]]`), a agent może wywołać `action=reply`, aby wejść w wątek konkretnej wiadomości, albo `action=react`, aby dodać tapback. `systemPrompt` dla grupy to niezawodny sposób na utrzymanie wyboru właściwego narzędzia przez agenta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Reakcje tapback i odpowiedzi w wątkach wymagają BlueBubbles Private API; zobacz [Zaawansowane akcje](#advanced-actions) i [Identyfikatory wiadomości](#message-ids-short-vs-full), aby poznać mechanikę leżącą u podstaw.

## Powiązania konwersacji ACP

Czaty BlueBubbles można przekształcić w trwałe obszary robocze ACP bez zmiany warstwy transportu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` w DM-ie lub dozwolonym czacie grupowym.
- Przyszłe wiadomości w tej samej konwersacji BlueBubbles są kierowane do utworzonej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Obsługiwane są też skonfigurowane trwałe powiązania przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "bluebubbles"`.

`match.peer.id` może używać dowolnej obsługiwanej formy celu BlueBubbles:

- znormalizowany uchwyt DM, taki jak `+15555550123` lub `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Dla stabilnych powiązań grupowych preferuj `chat_id:*` lub `chat_identifier:*`.

Przykład:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać wspólne zachowanie powiązań ACP.

## Wskaźniki pisania + potwierdzenia odczytu

- **Wskaźniki pisania**: Wysyłane automatycznie przed generowaniem odpowiedzi i w jego trakcie.
- **Potwierdzenia odczytu**: Kontrolowane przez `channels.bluebubbles.sendReadReceipts` (domyślnie: `true`).
- **Wskaźniki pisania**: OpenClaw wysyła zdarzenia rozpoczęcia pisania; BlueBubbles automatycznie czyści stan pisania przy wysłaniu lub po przekroczeniu limitu czasu (ręczne zatrzymanie przez DELETE jest zawodne).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## Zaawansowane akcje

BlueBubbles obsługuje zaawansowane akcje wiadomości, gdy są włączone w konfiguracji:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**: Dodaj/usuń reakcje tapback (`messageId`, `emoji`, `remove`). Natywny zestaw tapback iMessage to `love`, `like`, `dislike`, `laugh`, `emphasize` i `question`. Gdy agent wybierze emoji spoza tego zestawu (na przykład `👀`), narzędzie reakcji użyje zastępczo `love`, aby tapback nadal się wyświetlił zamiast powodować niepowodzenie całego żądania. Skonfigurowane reakcje potwierdzające nadal są walidowane ściśle i zwracają błąd przy nieznanych wartościach.
    - **edit**: Edytuj wysłaną wiadomość (`messageId`, `text`).
    - **unsend**: Cofnij wysłanie wiadomości (`messageId`).
    - **reply**: Odpowiedz na konkretną wiadomość (`messageId`, `text`, `to`).
    - **sendWithEffect**: Wyślij z efektem iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Zmień nazwę czatu grupowego (`chatGuid`, `displayName`).
    - **setGroupIcon**: Ustaw ikonę/zdjęcie czatu grupowego (`chatGuid`, `media`) - zawodne w macOS 26 Tahoe (API może zwrócić sukces, ale ikona się nie zsynchronizuje).
    - **addParticipant**: Dodaj kogoś do grupy (`chatGuid`, `address`).
    - **removeParticipant**: Usuń kogoś z grupy (`chatGuid`, `address`).
    - **leaveGroup**: Opuść czat grupowy (`chatGuid`).
    - **upload-file**: Wyślij multimedia/pliki (`to`, `buffer`, `filename`, `asVoice`).
      - Notatki głosowe: ustaw `asVoice: true` z dźwiękiem **MP3** lub **CAF**, aby wysłać wiadomość głosową iMessage. BlueBubbles konwertuje MP3 → CAF podczas wysyłania notatek głosowych.
    - Starszy alias: `sendAttachment` nadal działa, ale `upload-file` jest kanoniczną nazwą akcji.

  </Accordion>
</AccordionGroup>

### Identyfikatory wiadomości (krótkie i pełne)

OpenClaw może pokazywać _krótkie_ identyfikatory wiadomości (np. `1`, `2`), aby oszczędzać tokeny.

- `MessageSid` / `ReplyToId` mogą być krótkimi identyfikatorami.
- `MessageSidFull` / `ReplyToIdFull` zawierają pełne identyfikatory dostawcy.
- Krótkie identyfikatory są przechowywane w pamięci; mogą wygasnąć po restarcie lub usunięciu z pamięci podręcznej.
- Akcje akceptują krótki lub pełny `messageId`, ale krótkie identyfikatory zwrócą błąd, jeśli nie będą już dostępne.

Używaj pełnych identyfikatorów dla trwałych automatyzacji i przechowywania:

- Szablony: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontekst: `MessageSidFull` / `ReplyToIdFull` w przychodzących ładunkach

Zobacz [Konfiguracja](/pl/gateway/configuration), aby poznać zmienne szablonów.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Scalanie podzielonych wysyłek DM (polecenie + URL w jednej kompozycji)

Gdy użytkownik wpisze w iMessage polecenie razem z adresem URL - np. `Dump https://example.com/article` - Apple dzieli wysyłkę na **dwa osobne dostarczenia webhooka**:

1. Wiadomość tekstowa (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

Dwa webhooki docierają do OpenClaw w odstępie około 0,8-2,0 s w większości konfiguracji. Bez scalania agent otrzymuje samo polecenie w turze 1, odpowiada (często „wyślij mi URL”) i widzi URL dopiero w turze 2 - kiedy kontekst polecenia jest już utracony.

`channels.bluebubbles.coalesceSameSenderDms` włącza dla DM scalanie kolejnych webhooków od tego samego nadawcy w jedną turę agenta. Czaty grupowe nadal są kluczowane według wiadomości, dzięki czemu struktura tur wielu użytkowników pozostaje zachowana.

<Tabs>
  <Tab title="When to enable">
    Włącz, gdy:

    - Dostarczasz Skills, które oczekują `command + payload` w jednej wiadomości (dump, paste, save, queue itd.).
    - Twoi użytkownicy wklejają adresy URL, obrazy lub długą treść razem z poleceniami.
    - Możesz zaakceptować dodatkowe opóźnienie tury DM (patrz niżej).

    Pozostaw wyłączone, gdy:

    - Potrzebujesz minimalnego opóźnienia poleceń dla jednowyrazowych wyzwalaczy DM.
    - Wszystkie Twoje przepływy to jednorazowe polecenia bez następujących po nich ładunków.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Po włączeniu flagi i bez jawnego `messages.inbound.byChannel.bluebubbles` okno debounce rozszerza się do **2500 ms** (domyślnie dla trybu bez scalania to 500 ms). Szersze okno jest wymagane - kadencja podzielonej wysyłki Apple wynosząca 0,8-2,0 s nie mieści się w ciaśniejszej wartości domyślnej.

    Aby samodzielnie dostroić okno:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Dodatkowe opóźnienie dla poleceń sterujących DM.** Po włączeniu flagi wiadomości poleceń sterujących DM (takie jak `Dump`, `Save` itd.) czekają teraz do końca okna debounce przed wysłaniem, na wypadek gdyby nadchodził webhook z ładunkiem. Polecenia czatu grupowego zachowują natychmiastową wysyłkę.
    - **Scalone wyjście jest ograniczone** - scalony tekst ma limit 4000 znaków z jawnym znacznikiem `…[truncated]`; załączniki mają limit 20; wpisy źródłowe mają limit 10 (poza nim zachowywany jest pierwszy i najnowszy). Każde źródłowe `messageId` nadal trafia do deduplikacji przychodzącej, więc późniejsze odtworzenie dowolnego pojedynczego zdarzenia przez MessagePoller zostanie rozpoznane jako duplikat.
    - **Opcjonalne, dla kanału.** Inne kanały (Telegram, WhatsApp, Slack, …) pozostają bez zmian.

  </Tab>
</Tabs>

### Scenariusze i to, co widzi agent

| Kompozycja użytkownika                                             | Dostarczenie przez Apple   | Flaga wyłączona (domyślnie)             | Flaga włączona + okno 2500 ms                                          |
| ------------------------------------------------------------------ | -------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (jedna wysyłka)                         | 2 webhooki w odstępie ~1 s | Dwie tury agenta: samo „Dump”, potem URL | Jedna tura: scalony tekst `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (załącznik + tekst)                | 2 webhooki                 | Dwie tury                               | Jedna tura: tekst + obraz                                               |
| `/status` (samodzielne polecenie)                                  | 1 webhook                  | Natychmiastowa wysyłka                  | **Czekaj do końca okna, potem wyślij**                                  |
| Sam URL wklejony osobno                                            | 1 webhook                  | Natychmiastowa wysyłka                  | Natychmiastowa wysyłka (tylko jeden wpis w koszyku)                     |
| Tekst + URL wysłane jako dwie celowo osobne wiadomości w odstępie minut | 2 webhooki poza oknem      | Dwie tury                               | Dwie tury (okno wygasa między nimi)                                     |
| Szybka seria (>10 małych DM w oknie)                                | N webhooków                | N tur                                   | Jedna tura, ograniczone wyjście (pierwsze + najnowsze, zastosowane limity tekstu/załączników) |

### Rozwiązywanie problemów ze scalaniem podzielonych wysyłek

Jeśli flaga jest włączona, a podzielone wysyłki nadal docierają jako dwie tury, sprawdź każdą warstwę:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Następnie `openclaw gateway restart` - flaga jest odczytywana podczas tworzenia rejestru debouncerów.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    Sprawdź dziennik serwera BlueBubbles w `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Zmierz odstęp między wysyłką tekstu w stylu `"Dump"` a następującą po niej wysyłką `"https://..."; Attachments:`. Podnieś `messages.inbound.byChannel.bluebubbles`, aby wygodnie pokryć ten odstęp.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    Znaczniki czasu zdarzeń sesji (`~/.openclaw/agents/<id>/sessions/*.jsonl`) odzwierciedlają moment, w którym Gateway przekazuje wiadomość agentowi, **a nie** moment nadejścia webhooka. Druga wiadomość w kolejce oznaczona `[Queued messages while agent was busy]` oznacza, że pierwsza tura nadal trwała, gdy dotarł drugi webhook - koszyk scalania został już opróżniony. Dostrajaj okno względem dziennika serwera BB, a nie dziennika sesji.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    Na mniejszych maszynach (8 GB) tury agenta mogą trwać wystarczająco długo, aby koszyk scalania opróżnił się przed zakończeniem odpowiedzi, a URL trafił jako druga tura w kolejce. Sprawdź `memory_pressure` i `ps -o rss -p $(pgrep openclaw-gateway)`; jeśli Gateway przekracza ~500 MB RSS i kompresor jest aktywny, zamknij inne ciężkie procesy albo przenieś się na większy host.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    Jeśli użytkownik stuknął `Dump` jako **odpowiedź** na istniejący dymek URL (iMessage pokazuje plakietkę „1 odpowiedź” na dymku Dump), URL znajduje się w `replyToBody`, a nie w drugim webhooku. Scalanie nie ma tu zastosowania - to kwestia umiejętności/promptu, a nie debouncera.
  </Accordion>
</AccordionGroup>

## Przesyłanie blokowe

Kontroluj, czy odpowiedzi są wysyłane jako jedna wiadomość, czy strumieniowane w blokach:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Multimedia + limity

- Załączniki przychodzące są pobierane i przechowywane w pamięci podręcznej multimediów.
- Limit multimediów przez `channels.bluebubbles.mediaMaxMb` dla multimediów przychodzących i wychodzących (domyślnie: 8 MB).
- Tekst wychodzący jest dzielony na fragmenty zgodnie z `channels.bluebubbles.textChunkLimit` (domyślnie: 4000 znaków).

## Odwołanie do konfiguracji

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

<AccordionGroup>
  <Accordion title="Połączenie i Webhook">
    - `channels.bluebubbles.enabled`: Włącz/wyłącz kanał.
    - `channels.bluebubbles.serverUrl`: Bazowy URL REST API BlueBubbles.
    - `channels.bluebubbles.password`: Hasło API.
    - `channels.bluebubbles.webhookPath`: Ścieżka punktu końcowego Webhook (domyślnie: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Zasady dostępu">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).
    - `channels.bluebubbles.allowFrom`: Lista dozwolonych DM (uchwyty, e-maile, numery E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (domyślnie: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Lista dozwolonych nadawców grupowych.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: W systemie macOS opcjonalnie uzupełnia nienazwanych uczestników grupy na podstawie lokalnych Kontaktów po przejściu kontroli dostępu. Domyślnie: `false`.
    - `channels.bluebubbles.groups`: Konfiguracja dla poszczególnych grup (`requireMention` itd.).

  </Accordion>
  <Accordion title="Dostarczanie i dzielenie na części">
    - `channels.bluebubbles.sendReadReceipts`: Wysyłaj potwierdzenia odczytu (domyślnie: `true`).
    - `channels.bluebubbles.blockStreaming`: Włącz strumieniowanie blokowe (domyślnie: `false`; wymagane dla odpowiedzi strumieniowych).
    - `channels.bluebubbles.textChunkLimit`: Rozmiar wychodzącej części w znakach (domyślnie: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Limit czasu na żądanie w ms dla wysyłania tekstu wychodzącego przez `/api/v1/message/text` (domyślnie: 30000). Zwiększ w konfiguracjach macOS 26, w których wysyłanie iMessage przez Private API może zawiesić się na ponad 60 sekund wewnątrz frameworka iMessage; na przykład `45000` lub `60000`. Próby, wyszukiwania czatów, reakcje, edycje i kontrole kondycji obecnie zachowują krótszą domyślną wartość 10 s; rozszerzenie zakresu na reakcje i edycje jest planowane jako kolejne usprawnienie. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (domyślnie) dzieli tylko po przekroczeniu `textChunkLimit`; `newline` dzieli na pustych wierszach (granicach akapitów) przed dzieleniem według długości.

  </Accordion>
  <Accordion title="Media i historia">
    - `channels.bluebubbles.mediaMaxMb`: Limit mediów przychodzących/wychodzących w MB (domyślnie: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Jawna lista dozwolonych bezwzględnych katalogów lokalnych dopuszczonych dla wychodzących lokalnych ścieżek mediów. Wysyłanie ścieżek lokalnych jest domyślnie odmawiane, chyba że ta opcja jest skonfigurowana. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Scal kolejne Webhooki DM od tego samego nadawcy w jedną turę agenta, tak aby rozdzielone wysyłanie tekstu i URL przez Apple dotarło jako jedna wiadomość (domyślnie: `false`). Zobacz [Scalanie rozdzielonych DM](#coalescing-split-send-dms-command--url-in-one-composition), aby poznać scenariusze, strojenie okna i kompromisy. Po włączeniu bez jawnego `messages.inbound.byChannel.bluebubbles` rozszerza domyślne okno debounce dla wiadomości przychodzących z 500 ms do 2500 ms.
    - `channels.bluebubbles.historyLimit`: Maksymalna liczba wiadomości grupowych dla kontekstu (0 wyłącza).
    - `channels.bluebubbles.dmHistoryLimit`: Limit historii DM.
    - `channels.bluebubbles.replyContextApiFallback`: Gdy odpowiedź przychodząca dotrze bez `replyToBody`/`replyToSender`, a pamięciowa pamięć podręczna kontekstu odpowiedzi nie trafi, pobierz oryginalną wiadomość z HTTP API BlueBubbles jako awaryjne rozwiązanie best-effort (domyślnie: `false`). Przydatne w wdrożeniach z wieloma instancjami współdzielącymi jedno konto BlueBubbles, po restartach procesu albo po eksmisji długowiecznej pamięci podręcznej TTL/LRU. Pobieranie jest chronione przed SSRF tymi samymi zasadami co każde inne żądanie klienta BlueBubbles, nigdy nie zgłasza wyjątku i wypełnia pamięć podręczną, aby kolejne odpowiedzi amortyzowały koszt. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Ustawienie na poziomie kanału propaguje się do kont, które pomijają tę flagę.

  </Accordion>
  <Accordion title="Akcje i konta">
    - `channels.bluebubbles.actions`: Włącz/wyłącz określone akcje.
    - `channels.bluebubbles.accounts`: Konfiguracja wielu kont.

  </Accordion>
</AccordionGroup>

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (lub `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adresowanie / cele dostarczania

Preferuj `chat_guid` dla stabilnego routingu:

- `chat_guid:iMessage;-;+15555550123` (preferowane dla grup)
- `chat_id:123`
- `chat_identifier:...`
- Bezpośrednie uchwyty: `+15555550123`, `user@example.com`
  - Jeśli bezpośredni uchwyt nie ma istniejącego czatu DM, OpenClaw utworzy go przez `POST /api/v1/chat/new`. Wymaga to włączenia BlueBubbles Private API.

### Routing iMessage a SMS

Gdy ten sam uchwyt ma na Macu zarówno czat iMessage, jak i SMS (na przykład numer telefonu zarejestrowany w iMessage, który otrzymywał także awaryjne wiadomości z zielonym dymkiem), OpenClaw preferuje czat iMessage i nigdy po cichu nie obniża trasy do SMS. Aby wymusić czat SMS, użyj jawnego prefiksu celu `sms:` (na przykład `sms:+15555550123`). Uchwyty bez pasującego czatu iMessage nadal wysyłają przez dowolny czat zgłoszony przez BlueBubbles.

## Bezpieczeństwo

- Żądania Webhook są uwierzytelniane przez porównanie parametrów zapytania lub nagłówków `guid`/`password` z `channels.bluebubbles.password`.
- Zachowaj hasło API i punkt końcowy Webhook w tajemnicy (traktuj je jak dane uwierzytelniające).
- Nie ma obejścia localhost dla uwierzytelniania Webhook BlueBubbles. Jeśli pośredniczysz w ruchu Webhook, zachowaj hasło BlueBubbles w żądaniu end-to-end. `gateway.trustedProxies` nie zastępuje tutaj `channels.bluebubbles.password`. Zobacz [Bezpieczeństwo Gateway](/pl/gateway/security#reverse-proxy-configuration).
- Włącz HTTPS i reguły zapory na serwerze BlueBubbles, jeśli wystawiasz go poza swoją sieć LAN.

## Rozwiązywanie problemów

- Jeśli zdarzenia pisania/odczytu przestaną działać, sprawdź logi Webhook BlueBubbles i zweryfikuj, czy ścieżka Gateway odpowiada `channels.bluebubbles.webhookPath`.
- Kody parowania wygasają po godzinie; użyj `openclaw pairing list bluebubbles` i `openclaw pairing approve bluebubbles <code>`.
- Reakcje wymagają prywatnego API BlueBubbles (`POST /api/v1/message/react`); upewnij się, że wersja serwera je udostępnia.
- Edycja/cofnięcie wysłania wymaga macOS 13+ i zgodnej wersji serwera BlueBubbles. W macOS 26 (Tahoe) edycja obecnie nie działa z powodu zmian w private API.
- Aktualizacje ikon grup mogą być zawodne w macOS 26 (Tahoe): API może zwrócić sukces, ale nowa ikona się nie zsynchronizuje.
- OpenClaw automatycznie ukrywa znane niedziałające akcje na podstawie wersji macOS serwera BlueBubbles. Jeśli edycja nadal pojawia się w macOS 26 (Tahoe), wyłącz ją ręcznie za pomocą `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` jest włączone, ale rozdzielone wysyłki (np. `Dump` + URL) nadal docierają jako dwie tury: zobacz listę kontrolną [rozwiązywania problemów ze scalaniem rozdzielonych wysyłek](#split-send-coalescing-troubleshooting) - typowe przyczyny to zbyt krótkie okno debounce, znaczniki czasu logu sesji błędnie odczytane jako czas dotarcia Webhook albo wysłanie cytatu odpowiedzi (które używa `replyToBody`, a nie drugiego Webhooka).
- Informacje o statusie/kondycji: `openclaw status --all` lub `openclaw status --deep`.

Ogólne informacje o przepływie pracy kanałów znajdziesz w przewodniku [Kanały](/pl/channels) oraz [Plugins](/pl/tools/plugin).

## Powiązane

- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i kontrola wzmianek
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie DM i przepływ parowania
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i utwardzanie
