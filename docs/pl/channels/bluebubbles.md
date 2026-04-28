---
read_when:
    - Konfigurowanie kanału BlueBubbles
    - Rozwiązywanie problemów z parowaniem Webhooka
    - Konfigurowanie iMessage na macOS
sidebarTitle: BlueBubbles
summary: iMessage przez serwer macOS BlueBubbles (REST wysyłanie/odbieranie, pisanie, reakcje, parowanie, zaawansowane działania).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:23:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

Status: dołączony plugin, który komunikuje się z serwerem macOS BlueBubbles przez HTTP. **Zalecany do integracji z iMessage** ze względu na bogatsze API i łatwiejszą konfigurację w porównaniu ze starszym kanałem imsg.

<Note>
Aktualne wydania OpenClaw zawierają BlueBubbles, więc zwykłe spakowane kompilacje nie wymagają osobnego kroku `openclaw plugins install`.
</Note>

## Omówienie

- Działa na macOS za pośrednictwem aplikacji pomocniczej BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Zalecane/testowane: macOS Sequoia (15). macOS Tahoe (26) działa; edycja jest obecnie uszkodzona na Tahoe, a aktualizacje ikon grup mogą zgłaszać powodzenie, ale nie synchronizować się.
- OpenClaw komunikuje się z nim przez jego REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Wiadomości przychodzące docierają przez Webhooki; odpowiedzi wychodzące, wskaźniki pisania, potwierdzenia odczytu i tapbacki są wykonywane przez wywołania REST.
- Załączniki i naklejki są przetwarzane jako multimedia przychodzące (i przekazywane agentowi, gdy to możliwe).
- Automatyczne odpowiedzi TTS, które syntezują dźwięk MP3 lub CAF, są dostarczane jako dymki notatek głosowych iMessage zamiast zwykłych załączników plikowych.
- Parowanie/lista dozwolonych działa tak samo jak w innych kanałach (`/channels/pairing` itd.) z użyciem `channels.bluebubbles.allowFrom` + kodów parowania.
- Reakcje są prezentowane jako zdarzenia systemowe, podobnie jak w Slack/Telegram, dzięki czemu agenci mogą je „wspomnieć” przed odpowiedzią.
- Zaawansowane funkcje: edycja, cofanie wysłania, odpowiedzi w wątkach, efekty wiadomości, zarządzanie grupami.

## Szybki start

<Steps>
  <Step title="Zainstaluj BlueBubbles">
    Zainstaluj serwer BlueBubbles na swoim Macu (postępuj zgodnie z instrukcjami na [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Włącz web API">
    W konfiguracji BlueBubbles włącz web API i ustaw hasło.
  </Step>
  <Step title="Skonfiguruj OpenClaw">
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
  <Step title="Skieruj Webhooki do Gateway">
    Skieruj Webhooki BlueBubbles do swojego Gateway (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Uruchom Gateway">
    Uruchom Gateway; zarejestruje on obsługę Webhooka i rozpocznie parowanie.
  </Step>
</Steps>

<Warning>
**Bezpieczeństwo**

- Zawsze ustawiaj hasło Webhooka.
- Uwierzytelnianie Webhooka jest zawsze wymagane. OpenClaw odrzuca żądania Webhooka BlueBubbles, chyba że zawierają hasło/guid zgodne z `channels.bluebubbles.password` (na przykład `?password=<password>` lub `x-password`), niezależnie od topologii loopback/proxy.
- Uwierzytelnianie hasłem jest sprawdzane przed odczytaniem/przeparsowaniem pełnej treści Webhooka.
</Warning>

## Utrzymywanie aktywności Messages.app (konfiguracje VM / bezgłowe)

W niektórych konfiguracjach VM macOS / always-on może się zdarzyć, że Messages.app przejdzie w stan „idle” (zdarzenia przychodzące zatrzymują się, dopóki aplikacja nie zostanie otwarta/przeniesiona na pierwszy plan). Prostym obejściem jest **szturchanie Messages co 5 minut** za pomocą AppleScript + LaunchAgent.

<Steps>
  <Step title="Zapisz AppleScript">
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
  <Step title="Zainstaluj LaunchAgent">
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

    To uruchamia się **co 300 sekund** i **przy logowaniu**. Pierwsze uruchomienie może wywołać monity macOS **Automation** (`osascript` → Messages). Zatwierdź je w tej samej sesji użytkownika, która uruchamia LaunchAgent.

  </Step>
  <Step title="Załaduj">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles jest dostępny w interaktywnym onboardingu:

```
openclaw onboard
```

Kreator pyta o:

<ParamField path="Server URL" type="string" required>
  Adres serwera BlueBubbles (np. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Hasło API z ustawień serwera BlueBubbles.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Ścieżka punktu końcowego Webhooka.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` lub `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Numery telefonów, adresy e-mail lub cele czatu.
</ParamField>

Możesz też dodać BlueBubbles przez CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kontrola dostępu (DM + grupy)

<Tabs>
  <Tab title="DM">
    - Domyślnie: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do momentu zatwierdzenia (kody wygasają po 1 godzinie).
    - Zatwierdzanie przez:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Parowanie jest domyślnym mechanizmem wymiany tokenów. Szczegóły: [Parowanie](/pl/channels/pairing)
  </Tab>
  <Tab title="Grupy">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (domyślnie: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` kontroluje, kto może uruchamiać działania w grupach, gdy ustawione jest `allowlist`.
  </Tab>
</Tabs>

### Wzbogacanie nazw kontaktów (macOS, opcjonalne)

Webhooki grupowe BlueBubbles często zawierają tylko surowe adresy uczestników. Jeśli chcesz, aby kontekst `GroupMembers` pokazywał zamiast tego lokalne nazwy kontaktów, możesz włączyć lokalne wzbogacanie z Kontaktów na macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` włącza wyszukiwanie. Domyślnie: `false`.
- Wyszukiwania są uruchamiane dopiero po tym, jak dostęp do grupy, autoryzacja poleceń i bramkowanie wzmianek przepuszczą wiadomość.
- Wzbogacani są tylko nienazwani uczestnicy telefoniczni.
- Surowe numery telefonów pozostają wartością zapasową, gdy nie zostanie znalezione lokalne dopasowanie.

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
- Gdy dla grupy włączone jest `requireMention`, agent odpowiada tylko wtedy, gdy zostanie wspomniany.
- Polecenia sterujące od autoryzowanych nadawców omijają bramkowanie wzmianek.

Konfiguracja dla poszczególnych grup:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // domyślnie dla wszystkich grup
        "iMessage;-;chat123": { requireMention: false }, // nadpisanie dla konkretnej grupy
      },
    },
  },
}
```

### Bramkowanie poleceń

- Polecenia sterujące (np. `/config`, `/model`) wymagają autoryzacji.
- Do określania autoryzacji poleceń używane są `allowFrom` i `groupAllowFrom`.
- Autoryzowani nadawcy mogą uruchamiać polecenia sterujące nawet bez wzmianki w grupach.

### System prompt dla poszczególnych grup

Każdy wpis w `channels.bluebubbles.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do system promptu agenta przy każdej turze obsługującej wiadomość w tej grupie, dzięki czemu możesz ustawić personę lub reguły zachowania dla danej grupy bez edytowania promptów agenta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Odpowiedzi nie mogą przekraczać 3 zdań. Dopasuj się do swobodnego tonu grupy.",
        },
      },
    },
  },
}
```

Klucz odpowiada temu, co BlueBubbles raportuje jako `chatGuid` / `chatIdentifier` / numeryczne `chatId` dla grupy, a wpis z symbolem wieloznacznym `"*"` zapewnia wartość domyślną dla każdej grupy bez dokładnego dopasowania (ten sam wzorzec jest używany przez `requireMention` i zasady narzędzi dla poszczególnych grup). Dokładne dopasowania zawsze mają pierwszeństwo przed symbolem wieloznacznym. DM ignorują to pole; zamiast tego użyj dostosowania promptu na poziomie agenta lub konta.

#### Przykład praktyczny: odpowiedzi w wątkach i reakcje tapback (Private API)

Przy włączonym BlueBubbles Private API wiadomości przychodzące docierają z krótkimi identyfikatorami wiadomości (na przykład `[[reply_to:5]]`), a agent może wywołać `action=reply`, aby odpowiedzieć w konkretnym wątku wiadomości, lub `action=react`, aby dodać tapback. `systemPrompt` dla poszczególnych grup to niezawodny sposób, aby agent wybierał właściwe narzędzie:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Odpowiadając w tej grupie, zawsze wywołuj action=reply z",
            "messageId [[reply_to:N]] z kontekstu, aby Twoja odpowiedź trafiła",
            "pod wiadomość, która ją wywołała. Nigdy nie wysyłaj nowej, niepowiązanej wiadomości.",
            "",
            "W przypadku krótkich potwierdzeń ('ok', 'mam', 'już robię') używaj",
            "action=react z odpowiednim emoji tapback (❤️, 👍, 😂, ‼️, ❓)",
            "zamiast wysyłać odpowiedź tekstową.",
          ].join(" "),
        },
      },
    },
  },
}
```

Zarówno reakcje tapback, jak i odpowiedzi w wątkach wymagają BlueBubbles Private API; informacje o mechanice działania znajdziesz w sekcjach [Zaawansowane działania](#advanced-actions) i [Identyfikatory wiadomości](#message-ids-short-vs-full).

## Powiązania konwersacji ACP

Czaty BlueBubbles można przekształcić w trwałe obszary robocze ACP bez zmiany warstwy transportowej.

Szybki przepływ pracy operatora:

- Uruchom `/acp spawn codex --bind here` w DM lub dozwolonej grupie czatu.
- Przyszłe wiadomości w tej samej konwersacji BlueBubbles będą kierowane do uruchomionej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są również obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "bluebubbles"`.

`match.peer.id` może używać dowolnej obsługiwanej formy celu BlueBubbles:

- znormalizowany uchwyt DM, taki jak `+15555550123` lub `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

W przypadku stabilnych powiązań grup preferuj `chat_id:*` lub `chat_identifier:*`.

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

Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać współdzielone zachowanie powiązań ACP.

## Pisanie + potwierdzenia odczytu

- **Wskaźniki pisania**: Wysyłane automatycznie przed i w trakcie generowania odpowiedzi.
- **Potwierdzenia odczytu**: Kontrolowane przez `channels.bluebubbles.sendReadReceipts` (domyślnie: `true`).
- **Wskaźniki pisania**: OpenClaw wysyła zdarzenia rozpoczęcia pisania; BlueBubbles automatycznie czyści stan pisania po wysłaniu lub przekroczeniu limitu czasu (ręczne zatrzymanie przez DELETE jest zawodne).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // wyłącza potwierdzenia odczytu
    },
  },
}
```

## Zaawansowane działania

BlueBubbles obsługuje zaawansowane działania na wiadomościach, gdy są włączone w konfiguracji:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacki (domyślnie: true)
        edit: true, // edytowanie wysłanych wiadomości (macOS 13+, uszkodzone na macOS 26 Tahoe)
        unsend: true, // cofanie wysłania wiadomości (macOS 13+)
        reply: true, // odpowiedzi w wątkach według GUID wiadomości
        sendWithEffect: true, // efekty wiadomości (slam, loud itp.)
        renameGroup: true, // zmiana nazwy czatów grupowych
        setGroupIcon: true, // ustawienie ikony/zdjęcia czatu grupowego (niestabilne na macOS 26 Tahoe)
        addParticipant: true, // dodawanie uczestników do grup
        removeParticipant: true, // usuwanie uczestników z grup
        leaveGroup: true, // opuszczanie czatów grupowych
        sendAttachment: true, // wysyłanie załączników/multimediów
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Dostępne działania">
    - **react**: Dodawanie/usuwanie reakcji tapback (`messageId`, `emoji`, `remove`). Natywny zestaw tapbacków iMessage to `love`, `like`, `dislike`, `laugh`, `emphasize` i `question`. Gdy agent wybierze emoji spoza tego zestawu (na przykład `👀`), narzędzie reakcji wraca do `love`, aby tapback nadal się wyświetlał zamiast powodować niepowodzenie całego żądania. Skonfigurowane reakcje ack nadal są walidowane rygorystycznie i zwracają błąd przy nieznanych wartościach.
    - **edit**: Edytowanie wysłanej wiadomości (`messageId`, `text`).
    - **unsend**: Cofnięcie wysłania wiadomości (`messageId`).
    - **reply**: Odpowiedź na konkretną wiadomość (`messageId`, `text`, `to`).
    - **sendWithEffect**: Wysyłanie z efektem iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Zmiana nazwy czatu grupowego (`chatGuid`, `displayName`).
    - **setGroupIcon**: Ustawienie ikony/zdjęcia czatu grupowego (`chatGuid`, `media`) — niestabilne na macOS 26 Tahoe (API może zwrócić powodzenie, ale ikona się nie zsynchronizuje).
    - **addParticipant**: Dodanie osoby do grupy (`chatGuid`, `address`).
    - **removeParticipant**: Usunięcie osoby z grupy (`chatGuid`, `address`).
    - **leaveGroup**: Opuszczenie czatu grupowego (`chatGuid`).
    - **upload-file**: Wysyłanie multimediów/plików (`to`, `buffer`, `filename`, `asVoice`).
      - Notatki głosowe: ustaw `asVoice: true` z dźwiękiem **MP3** lub **CAF**, aby wysłać jako wiadomość głosową iMessage. BlueBubbles konwertuje MP3 → CAF podczas wysyłania notatek głosowych.
    - Starszy alias: `sendAttachment` nadal działa, ale `upload-file` jest kanoniczną nazwą działania.
  </Accordion>
</AccordionGroup>

### Identyfikatory wiadomości (krótkie vs pełne)

OpenClaw może prezentować _krótkie_ identyfikatory wiadomości (np. `1`, `2`), aby oszczędzać tokeny.

- `MessageSid` / `ReplyToId` mogą być krótkimi identyfikatorami.
- `MessageSidFull` / `ReplyToIdFull` zawierają pełne identyfikatory dostawcy.
- Krótkie identyfikatory są przechowywane w pamięci; mogą wygasnąć po restarcie lub usunięciu z pamięci podręcznej.
- Działania akceptują krótki lub pełny `messageId`, ale krótkie identyfikatory zwrócą błąd, jeśli nie są już dostępne.

Do trwałych automatyzacji i przechowywania używaj pełnych identyfikatorów:

- Szablony: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontekst: `MessageSidFull` / `ReplyToIdFull` w przychodzących ładunkach

Zobacz [Konfiguracja](/pl/gateway/configuration), aby poznać zmienne szablonów.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Scalanie rozdzielonych wiadomości DM (polecenie + URL w jednej wiadomości)

Gdy użytkownik wpisuje polecenie i URL razem w iMessage — np. `Dump https://example.com/article` — Apple dzieli wysłanie na **dwa osobne dostarczenia Webhooka**:

1. Wiadomość tekstową (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

Na większości konfiguracji oba Webhooki docierają do OpenClaw w odstępie około 0,8-2,0 s. Bez scalania agent otrzymuje samo polecenie w turze 1, odpowiada (często „wyślij mi URL”), a URL widzi dopiero w turze 2 — kiedy kontekst polecenia jest już utracony.

`channels.bluebubbles.coalesceSameSenderDms` włącza dla DM scalanie kolejnych Webhooków od tego samego nadawcy w jedną turę agenta. Czaty grupowe nadal są kluczowane per wiadomość, aby zachować strukturę tur dla wielu użytkowników.

<Tabs>
  <Tab title="Kiedy włączyć">
    Włącz, gdy:

    - Udostępniasz Skills, które oczekują `polecenie + ładunek` w jednej wiadomości (dump, paste, save, queue itp.).
    - Twoi użytkownicy wklejają URL-e, obrazy lub długie treści razem z poleceniami.
    - Możesz zaakceptować dodatkowe opóźnienie tur DM (patrz poniżej).

    Pozostaw wyłączone, gdy:

    - Potrzebujesz minimalnego opóźnienia poleceń dla jednowyrazowych wyzwalaczy DM.
    - Wszystkie Twoje przepływy to jednorazowe polecenia bez następujących po nich ładunków.

  </Tab>
  <Tab title="Włączanie">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // włączenie (domyślnie: false)
        },
      },
    }
    ```

    Gdy flaga jest włączona i nie ma jawnego `messages.inbound.byChannel.bluebubbles`, okno debounce rozszerza się do **2500 ms** (domyślnie dla nieskalowanych wiadomości jest to 500 ms). Szersze okno jest wymagane — rytm rozdzielonego wysyłania Apple wynoszący 0,8-2,0 s nie mieści się w ciaśniejszym ustawieniu domyślnym.

    Aby samodzielnie dostroić okno:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms działa w większości konfiguracji; zwiększ do 4000 ms, jeśli Twój Mac jest wolny
            // lub pod presją pamięci (zaobserwowana przerwa może wtedy przekroczyć 2 s).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Kompromisy">
    - **Dodatkowe opóźnienie dla poleceń sterujących DM.** Gdy flaga jest włączona, wiadomości poleceń sterujących DM (takie jak `Dump`, `Save` itp.) czekają teraz do końca okna debounce przed wysłaniem, na wypadek nadejścia Webhooka z ładunkiem. Polecenia w czacie grupowym nadal są wysyłane natychmiast.
    - **Scalony wynik ma ograniczenia** — scalony tekst jest ograniczony do 4000 znaków z jawnym znacznikiem `…[truncated]`; załączniki są ograniczone do 20; wpisy źródłowe do 10 (poza tym zachowywane są pierwszy i najnowszy). Każde źródłowe `messageId` nadal trafia do deduplikacji przychodzącej, więc późniejsze odtworzenie pojedynczego zdarzenia przez MessagePoller zostanie rozpoznane jako duplikat.
    - **Włączenie opcjonalne, per kanał.** Inne kanały (Telegram, WhatsApp, Slack, …) pozostają bez zmian.
  </Tab>
</Tabs>

### Scenariusze i to, co widzi agent

| Wiadomość wpisana przez użytkownika                                 | Co dostarcza Apple        | Flaga wyłączona (domyślnie)             | Flaga włączona + okno 2500 ms                                          |
| ------------------------------------------------------------------- | ------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `Dump https://example.com` (jedno wysłanie)                         | 2 Webhooki ~1 s odstępu   | Dwie tury agenta: samo „Dump”, potem URL | Jedna tura: scalony tekst `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (załącznik + tekst)                 | 2 Webhooki                | Dwie tury                               | Jedna tura: tekst + obraz                                              |
| `/status` (samodzielne polecenie)                                   | 1 Webhook                 | Natychmiastowe wysłanie                 | **Czeka do końca okna, potem wysyła**                                  |
| Samodzielnie wklejony URL                                           | 1 Webhook                 | Natychmiastowe wysłanie                 | Natychmiastowe wysłanie (tylko jeden wpis w koszyku)                   |
| Tekst + URL wysłane celowo jako dwie oddzielne wiadomości, po minutach | 2 Webhooki poza oknem  | Dwie tury                               | Dwie tury (okno wygasa między nimi)                                    |
| Szybki zalew (>10 małych DM w obrębie okna)                         | N Webhooków               | N tur                                   | Jedna tura, wynik ograniczony (pierwszy + najnowszy, zastosowane limity tekstu/załączników) |

### Rozwiązywanie problemów ze scalaniem rozdzielonych wiadomości

Jeśli flaga jest włączona, a rozdzielone wysyłki nadal docierają jako dwie tury, sprawdź każdą warstwę:

<AccordionGroup>
  <Accordion title="Czy konfiguracja została faktycznie załadowana">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Następnie `openclaw gateway restart` — flaga jest odczytywana przy tworzeniu rejestru debouncerów.

  </Accordion>
  <Accordion title="Czy okno debounce jest wystarczająco szerokie dla Twojej konfiguracji">
    Sprawdź log serwera BlueBubbles w `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Zmierz odstęp między wysłaniem tekstu w stylu `"Dump"` a następującym po nim wysłaniem `"https://..."; Attachments:`. Zwiększ `messages.inbound.byChannel.bluebubbles`, aby wygodnie objąć ten odstęp.

  </Accordion>
  <Accordion title="Znaczniki czasu JSONL sesji ≠ nadejście Webhooka">
    Znaczniki czasu zdarzeń sesji (`~/.openclaw/agents/<id>/sessions/*.jsonl`) odzwierciedlają moment, w którym Gateway przekazuje wiadomość agentowi, **a nie** moment nadejścia Webhooka. Oznacza to, że zakolejkowana druga wiadomość oznaczona `[Queued messages while agent was busy]` wskazuje, że pierwsza tura nadal trwała, gdy nadejść drugi Webhook — koszyk scalania został już opróżniony. Dostrajaj okno na podstawie logu serwera BB, a nie logu sesji.
  </Accordion>
  <Accordion title="Presja pamięci spowalniająca wysyłanie odpowiedzi">
    Na słabszych maszynach (8 GB) tury agenta mogą trwać na tyle długo, że koszyk scalania opróżnia się przed zakończeniem odpowiedzi, a URL trafia jako zakolejkowana druga tura. Sprawdź `memory_pressure` i `ps -o rss -p $(pgrep openclaw-gateway)`; jeśli Gateway przekracza ~500 MB RSS i kompresor jest aktywny, zamknij inne ciężkie procesy albo przejdź na większy host.
  </Accordion>
  <Accordion title="Wysyłki z cytatem odpowiedzi to inna ścieżka">
    Jeśli użytkownik stuknął `Dump` jako **odpowiedź** na istniejący dymek URL (iMessage pokazuje plakietkę „1 Reply” na dymku Dump), URL znajduje się w `replyToBody`, a nie w drugim Webhooku. Scalanie nie ma tu zastosowania — to kwestia Skills/promptu, a nie debouncera.
  </Accordion>
</AccordionGroup>

## Block streaming

Kontroluj, czy odpowiedzi są wysyłane jako pojedyncza wiadomość, czy strumieniowane blokami:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // włącza block streaming (domyślnie wyłączone)
    },
  },
}
```

## Multimedia + limity

- Załączniki przychodzące są pobierane i przechowywane w pamięci podręcznej multimediów.
- Limit multimediów przez `channels.bluebubbles.mediaMaxMb` dla multimediów przychodzących i wychodzących (domyślnie: 8 MB).
- Tekst wychodzący jest dzielony na fragmenty według `channels.bluebubbles.textChunkLimit` (domyślnie: 4000 znaków).

## Odniesienie do konfiguracji

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

<AccordionGroup>
  <Accordion title="Połączenie i Webhook">
    - `channels.bluebubbles.enabled`: Włączanie/wyłączanie kanału.
    - `channels.bluebubbles.serverUrl`: Bazowy URL REST API BlueBubbles.
    - `channels.bluebubbles.password`: Hasło API.
    - `channels.bluebubbles.webhookPath`: Ścieżka punktu końcowego Webhooka (domyślnie: `/bluebubbles-webhook`).
  </Accordion>
  <Accordion title="Polityka dostępu">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).
    - `channels.bluebubbles.allowFrom`: Lista dozwolonych dla DM (uchwyty, adresy e-mail, numery E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (domyślnie: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Lista dozwolonych nadawców grupowych.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Na macOS opcjonalnie wzbogaca nienazwanych uczestników grup z lokalnych Kontaktów po przejściu bramkowania. Domyślnie: `false`.
    - `channels.bluebubbles.groups`: Konfiguracja dla poszczególnych grup (`requireMention` itd.).
  </Accordion>
  <Accordion title="Dostarczanie i dzielenie na fragmenty">
    - `channels.bluebubbles.sendReadReceipts`: Wysyłanie potwierdzeń odczytu (domyślnie: `true`).
    - `channels.bluebubbles.blockStreaming`: Włączanie block streaming (domyślnie: `false`; wymagane dla odpowiedzi strumieniowanych).
    - `channels.bluebubbles.textChunkLimit`: Rozmiar wychodzącego fragmentu w znakach (domyślnie: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Limit czasu na żądanie w ms dla wychodzących wysyłek tekstu przez `/api/v1/message/text` (domyślnie: 30000). Zwiększ na konfiguracjach macOS 26, gdzie wysyłki iMessage przez Private API mogą zawieszać się na ponad 60 sekund w frameworku iMessage; na przykład `45000` lub `60000`. Testy połączenia, wyszukiwania czatów, reakcje, edycje i kontrole stanu obecnie zachowują krótszy domyślny limit 10 s; rozszerzenie tego na reakcje i edycje jest planowane jako kolejny krok. Nadpisanie per konto: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (domyślnie) dzieli tylko po przekroczeniu `textChunkLimit`; `newline` dzieli na pustych liniach (granice akapitów) przed dzieleniem według długości.
  </Accordion>
  <Accordion title="Multimedia i historia">
    - `channels.bluebubbles.mediaMaxMb`: Limit multimediów przychodzących/wychodzących w MB (domyślnie: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Jawna lista dozwolonych bezwzględnych lokalnych katalogów dla wychodzących lokalnych ścieżek multimediów. Wysyłanie lokalnych ścieżek jest domyślnie zabronione, jeśli nie skonfigurowano tej opcji. Nadpisanie per konto: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Scala kolejne Webhooki DM od tego samego nadawcy w jedną turę agenta, aby rozdzielone wysłanie tekst+URL przez Apple docierało jako pojedyncza wiadomość (domyślnie: `false`). Zobacz [Scalanie rozdzielonych wiadomości DM](#coalescing-split-send-dms-command--url-in-one-composition), aby poznać scenariusze, dostrajanie okna i kompromisy. Rozszerza domyślne okno debounce dla wiadomości przychodzących z 500 ms do 2500 ms, gdy jest włączone bez jawnego `messages.inbound.byChannel.bluebubbles`.
    - `channels.bluebubbles.historyLimit`: Maksymalna liczba wiadomości grupowych dla kontekstu (0 wyłącza).
    - `channels.bluebubbles.dmHistoryLimit`: Limit historii DM.
  </Accordion>
  <Accordion title="Działania i konta">
    - `channels.bluebubbles.actions`: Włączanie/wyłączanie określonych działań.
    - `channels.bluebubbles.accounts`: Konfiguracja wielu kont.
  </Accordion>
</AccordionGroup>

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (lub `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adresowanie / cele dostarczania

Dla stabilnego routingu preferuj `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (preferowane dla grup)
- `chat_id:123`
- `chat_identifier:...`
- Bezpośrednie uchwyty: `+15555550123`, `user@example.com`
  - Jeśli bezpośredni uchwyt nie ma istniejącego czatu DM, OpenClaw utworzy go przez `POST /api/v1/chat/new`. Wymaga to włączenia BlueBubbles Private API.

### Routing iMessage vs SMS

Gdy ten sam uchwyt ma na Macu zarówno czat iMessage, jak i SMS (na przykład numer telefonu zarejestrowany w iMessage, który otrzymał też fallbacki z zielonymi dymkami), OpenClaw preferuje czat iMessage i nigdy po cichu nie obniża go do SMS. Aby wymusić czat SMS, użyj jawnego prefiksu celu `sms:` (na przykład `sms:+15555550123`). Uchwyty bez pasującego czatu iMessage nadal wysyłają przez czat zgłoszony przez BlueBubbles.

## Bezpieczeństwo

- Żądania Webhooka są uwierzytelniane przez porównanie parametrów zapytania lub nagłówków `guid`/`password` z `channels.bluebubbles.password`.
- Zachowaj hasło API i punkt końcowy Webhooka w tajemnicy (traktuj je jak poświadczenia).
- Nie ma obejścia localhost dla uwierzytelniania Webhooka BlueBubbles. Jeśli ruch Webhooka jest przekazywany przez proxy, zachowaj hasło BlueBubbles w żądaniu end-to-end. `gateway.trustedProxies` nie zastępuje tutaj `channels.bluebubbles.password`. Zobacz [Zabezpieczenia Gateway](/pl/gateway/security#reverse-proxy-configuration).
- Włącz HTTPS + reguły zapory na serwerze BlueBubbles, jeśli udostępniasz go poza swoją siecią LAN.

## Rozwiązywanie problemów

- Jeśli zdarzenia pisania/odczytu przestają działać, sprawdź logi Webhooka BlueBubbles i zweryfikuj, czy ścieżka Gateway odpowiada `channels.bluebubbles.webhookPath`.
- Kody parowania wygasają po godzinie; użyj `openclaw pairing list bluebubbles` i `openclaw pairing approve bluebubbles <code>`.
- Reakcje wymagają BlueBubbles Private API (`POST /api/v1/message/react`); upewnij się, że wersja serwera je udostępnia.
- Edycja/cofanie wysłania wymagają macOS 13+ i zgodnej wersji serwera BlueBubbles. Na macOS 26 (Tahoe) edycja jest obecnie uszkodzona z powodu zmian w Private API.
- Aktualizacje ikon grup mogą być niestabilne na macOS 26 (Tahoe): API może zwrócić powodzenie, ale nowa ikona się nie zsynchronizuje.
- OpenClaw automatycznie ukrywa znane uszkodzone działania na podstawie wersji macOS serwera BlueBubbles. Jeśli edycja nadal pojawia się na macOS 26 (Tahoe), wyłącz ją ręcznie przez `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` jest włączone, ale rozdzielone wysyłki (np. `Dump` + URL) nadal docierają jako dwie tury: zobacz listę kontrolną [rozwiązywania problemów ze scalaniem rozdzielonych wiadomości](#split-send-coalescing-troubleshooting) — częste przyczyny to zbyt wąskie okno debounce, błędne odczytanie znaczników czasu logu sesji jako momentu nadejścia Webhooka lub wysyłka z cytatem odpowiedzi (która używa `replyToBody`, a nie drugiego Webhooka).
- Informacje o stanie/kondycji: `openclaw status --all` lub `openclaw status --deep`.

Ogólne informacje o przepływie pracy kanałów znajdziesz w [Kanały](/pl/channels) oraz przewodniku [Plugins](/pl/tools/plugin).

## Powiązane

- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
