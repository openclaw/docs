---
read_when:
    - Konfigurowanie kanału BlueBubbles
    - Rozwiązywanie problemów z parowaniem Webhooka
    - Konfigurowanie iMessage na macOS
summary: iMessage przez serwer BlueBubbles na macOS (REST wysyłanie/odbieranie, pisanie, reakcje, parowanie, zaawansowane działania).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T09:51:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30ce50ae8a17140b42fa410647c367e0eefdffb1646b1ff92d8e1af63f2e1155
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Status: dołączony plugin, który komunikuje się z serwerem BlueBubbles na macOS przez HTTP. **Zalecany do integracji z iMessage** ze względu na bogatsze API i łatwiejszą konfigurację w porównaniu ze starszym kanałem imsg.

## Dołączony plugin

Bieżące wydania OpenClaw zawierają BlueBubbles, więc zwykłe spakowane buildy nie
wymagają osobnego kroku `openclaw plugins install`.

## Przegląd

- Działa na macOS przez aplikację pomocniczą BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Zalecane/przetestowane: macOS Sequoia (15). macOS Tahoe (26) działa; edycja jest obecnie uszkodzona na Tahoe, a aktualizacje ikon grup mogą zgłaszać powodzenie, ale nie synchronizować się.
- OpenClaw komunikuje się z nim przez jego REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Wiadomości przychodzące docierają przez webhooki; odpowiedzi wychodzące, wskaźniki pisania, potwierdzenia odczytu i tapbacki są wywołaniami REST.
- Załączniki i naklejki są przetwarzane jako multimedia przychodzące (i przekazywane do agenta, gdy to możliwe).
- Parowanie/allowlista działa tak samo jak w innych kanałach (`/channels/pairing` itd.) z użyciem `channels.bluebubbles.allowFrom` + kodów parowania.
- Reakcje są prezentowane jako zdarzenia systemowe, tak jak w Slack/Telegram, dzięki czemu agenci mogą o nich „wspomnieć” przed odpowiedzią.
- Funkcje zaawansowane: edycja, cofanie wysłania, odpowiedzi w wątkach, efekty wiadomości, zarządzanie grupami.

## Szybki start

1. Zainstaluj serwer BlueBubbles na swoim Macu (postępuj zgodnie z instrukcjami na [bluebubbles.app/install](https://bluebubbles.app/install)).
2. W konfiguracji BlueBubbles włącz web API i ustaw hasło.
3. Uruchom `openclaw onboard` i wybierz BlueBubbles albo skonfiguruj ręcznie:

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

4. Skieruj webhooki BlueBubbles do swojego Gatewaya (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Uruchom Gateway; zarejestruje on obsługę webhooka i rozpocznie parowanie.

Uwaga dotycząca bezpieczeństwa:

- Zawsze ustawiaj hasło webhooka.
- Uwierzytelnianie webhooka jest zawsze wymagane. OpenClaw odrzuca żądania webhooka BlueBubbles, jeśli nie zawierają hasła/guid zgodnego z `channels.bluebubbles.password` (na przykład `?password=<password>` lub `x-password`), niezależnie od topologii local loopback/proxy.
- Uwierzytelnianie hasłem jest sprawdzane przed odczytem/przetworzeniem pełnych treści webhooka.

## Utrzymywanie aktywności aplikacji Messages.app (konfiguracje VM / headless)

W niektórych konfiguracjach macOS VM / always-on Messages.app może przechodzić w stan „idle” (zdarzenia przychodzące przestają docierać, dopóki aplikacja nie zostanie otwarta/przeniesiona na pierwszy plan). Prostym obejściem jest **„szturchanie” Messages co 5 minut** za pomocą AppleScript + LaunchAgent.

### 1) Zapisz AppleScript

Zapisz to jako:

- `~/Scripts/poke-messages.scpt`

Przykładowy skrypt (nieinteraktywny; nie przejmuje fokusu):

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

### 2) Zainstaluj LaunchAgent

Zapisz to jako:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

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

Uwagi:

- To uruchamia się **co 300 sekund** i **przy logowaniu**.
- Pierwsze uruchomienie może wywołać monity macOS **Automation** (`osascript` → Messages). Zatwierdź je w tej samej sesji użytkownika, w której działa LaunchAgent.

Załaduj go:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles jest dostępny w interaktywnym onboardingu:

```
openclaw onboard
```

Kreator pyta o:

- **Server URL** (wymagane): adres serwera BlueBubbles (np. `http://192.168.1.100:1234`)
- **Password** (wymagane): hasło API z ustawień BlueBubbles Server
- **Webhook path** (opcjonalne): domyślnie `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open lub disabled
- **Allow list**: numery telefonów, adresy e-mail lub cele czatu

Możesz też dodać BlueBubbles przez CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kontrola dostępu (DM-y + grupy)

DM-y:

- Domyślnie: `channels.bluebubbles.dmPolicy = "pairing"`.
- Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do momentu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdzaj przez:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Pairing jest domyślnym mechanizmem wymiany tokenów. Szczegóły: [Pairing](/pl/channels/pairing)

Grupy:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (domyślnie: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` kontroluje, kto może wywoływać agenta w grupach, gdy ustawiono `allowlist`.

### Wzbogacanie nazw kontaktów (macOS, opcjonalne)

Webhooki grupowe BlueBubbles często zawierają tylko surowe adresy uczestników. Jeśli chcesz, aby kontekst `GroupMembers` pokazywał zamiast tego lokalne nazwy kontaktów, możesz włączyć lokalne wzbogacanie z Contacts na macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` włącza wyszukiwanie. Domyślnie: `false`.
- Wyszukiwania są wykonywane dopiero po tym, jak dostęp do grupy, autoryzacja komend i bramkowanie wzmianek przepuszczą wiadomość.
- Wzbogacani są tylko nienazwani uczestnicy z numerami telefonów.
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

### Bramka wzmianek (grupy)

BlueBubbles obsługuje bramkowanie wzmianek dla czatów grupowych, zgodnie z zachowaniem iMessage/WhatsApp:

- Używa `agents.list[].groupChat.mentionPatterns` (lub `messages.groupChat.mentionPatterns`) do wykrywania wzmianek.
- Gdy dla grupy włączone jest `requireMention`, agent odpowiada tylko wtedy, gdy zostanie wspomniany.
- Komendy sterujące od autoryzowanych nadawców omijają bramkowanie wzmianek.

Konfiguracja per grupa:

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

### Bramka komend

- Komendy sterujące (np. `/config`, `/model`) wymagają autoryzacji.
- Do określenia autoryzacji komend używane są `allowFrom` i `groupAllowFrom`.
- Autoryzowani nadawcy mogą uruchamiać komendy sterujące nawet bez wzmianki w grupach.

### System prompt per grupa

Każdy wpis pod `channels.bluebubbles.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do system prompta agenta przy każdym kroku obsługującym wiadomość w tej grupie, więc możesz ustawić personę lub reguły zachowania dla konkretnej grupy bez edytowania promptów agenta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Odpowiedzi utrzymuj poniżej 3 zdań. Dopasuj się do swobodnego tonu grupy.",
        },
      },
    },
  },
}
```

Klucz odpowiada temu, co BlueBubbles zgłasza jako `chatGuid` / `chatIdentifier` / numeryczne `chatId` dla grupy, a wpis z symbolem wieloznacznym `"*"` zapewnia wartość domyślną dla każdej grupy bez dokładnego dopasowania (ten sam wzorzec jest używany przez `requireMention` i zasady narzędzi per grupa). Dokładne dopasowania zawsze mają pierwszeństwo przed wildcardem. DM-y ignorują to pole; zamiast tego użyj dostosowania prompta na poziomie agenta lub konta.

#### Przykład praktyczny: odpowiedzi w wątkach i reakcje tapback (Private API)

Po włączeniu BlueBubbles Private API wiadomości przychodzące docierają z krótkimi identyfikatorami wiadomości (na przykład `[[reply_to:5]]`), a agent może wywołać `action=reply`, aby odpowiedzieć w wątku na konkretną wiadomość, albo `action=react`, aby dodać tapback. `systemPrompt` per grupa to niezawodny sposób, aby agent wybierał właściwe narzędzie:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Gdy odpowiadasz w tej grupie, zawsze wywołuj action=reply z",
            "messageId `[[reply_to:N]]` z kontekstu, aby twoja odpowiedź była w wątku",
            "pod wiadomością wyzwalającą. Nigdy nie wysyłaj nowej, niepowiązanej wiadomości.",
            "",
            "Dla krótkich potwierdzeń ('ok', 'mam', 'zajmę się tym') używaj",
            "action=react z odpowiednim tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "zamiast wysyłać odpowiedź tekstową.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reakcje tapback i odpowiedzi w wątkach wymagają BlueBubbles Private API; mechanika bazowa jest opisana w [Advanced actions](#advanced-actions) i [Message IDs](#message-ids-short-vs-full).

## Powiązania konwersacji ACP

Czaty BlueBubbles można przekształcić w trwałe obszary robocze ACP bez zmiany warstwy transportowej.

Szybki przepływ dla operatora:

- Uruchom `/acp spawn codex --bind here` w DM lub dozwolonym czacie grupowym.
- Kolejne wiadomości w tej samej konwersacji BlueBubbles będą kierowane do utworzonej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są również obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "bluebubbles"`.

`match.peer.id` może używać dowolnej obsługiwanej postaci celu BlueBubbles:

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

Zobacz [ACP Agents](/pl/tools/acp-agents), aby poznać współdzielone zachowanie powiązań ACP.

## Pisanie + potwierdzenia odczytu

- **Wskaźniki pisania**: wysyłane automatycznie przed i podczas generowania odpowiedzi.
- **Potwierdzenia odczytu**: kontrolowane przez `channels.bluebubbles.sendReadReceipts` (domyślnie: `true`).
- **Wskaźniki pisania**: OpenClaw wysyła zdarzenia rozpoczęcia pisania; BlueBubbles czyści stan pisania automatycznie przy wysłaniu lub po upływie limitu czasu (ręczne zatrzymanie przez DELETE jest zawodne).

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
        unsend: true, // cofanie wysłanych wiadomości (macOS 13+)
        reply: true, // odpowiedzi w wątkach według GUID wiadomości
        sendWithEffect: true, // efekty wiadomości (slam, loud itd.)
        renameGroup: true, // zmiana nazwy czatów grupowych
        setGroupIcon: true, // ustawienie ikony/zdjęcia czatu grupowego (niestabilne na macOS 26 Tahoe)
        addParticipant: true, // dodawanie uczestników do grup
        removeParticipant: true, // usuwanie uczestników z grup
        leaveGroup: true, // opuszczanie czatów grupowych
        sendAttachment: true, // wysyłanie załączników/mediów
      },
    },
  },
}
```

Dostępne działania:

- **react**: dodawanie/usuwanie reakcji tapback (`messageId`, `emoji`, `remove`)
- **edit**: edytowanie wysłanej wiadomości (`messageId`, `text`)
- **unsend**: cofanie wysłania wiadomości (`messageId`)
- **reply**: odpowiedź na konkretną wiadomość (`messageId`, `text`, `to`)
- **sendWithEffect**: wysyłanie z efektem iMessage (`text`, `to`, `effectId`)
- **renameGroup**: zmiana nazwy czatu grupowego (`chatGuid`, `displayName`)
- **setGroupIcon**: ustawienie ikony/zdjęcia czatu grupowego (`chatGuid`, `media`) — niestabilne na macOS 26 Tahoe (API może zwrócić sukces, ale ikona się nie zsynchronizuje).
- **addParticipant**: dodanie osoby do grupy (`chatGuid`, `address`)
- **removeParticipant**: usunięcie osoby z grupy (`chatGuid`, `address`)
- **leaveGroup**: opuszczenie czatu grupowego (`chatGuid`)
- **upload-file**: wysyłanie mediów/plików (`to`, `buffer`, `filename`, `asVoice`)
  - Wiadomości głosowe: ustaw `asVoice: true` z dźwiękiem **MP3** lub **CAF**, aby wysłać go jako wiadomość głosową iMessage. BlueBubbles konwertuje MP3 → CAF podczas wysyłania wiadomości głosowych.
- Starszy alias: `sendAttachment` nadal działa, ale `upload-file` jest kanoniczną nazwą działania.

### Identyfikatory wiadomości (krótkie vs pełne)

OpenClaw może udostępniać _krótkie_ identyfikatory wiadomości (np. `1`, `2`), aby oszczędzać tokeny.

- `MessageSid` / `ReplyToId` mogą być krótkimi identyfikatorami.
- `MessageSidFull` / `ReplyToIdFull` zawierają pełne identyfikatory dostawcy.
- Krótkie identyfikatory są przechowywane w pamięci; mogą wygasnąć po restarcie lub wyczyszczeniu cache.
- Działania akceptują krótki lub pełny `messageId`, ale krótkie identyfikatory zwrócą błąd, jeśli nie są już dostępne.

Do trwałych automatyzacji i przechowywania używaj pełnych identyfikatorów:

- Szablony: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontekst: `MessageSidFull` / `ReplyToIdFull` w przychodzących payloadach

Zobacz [Configuration](/pl/gateway/configuration), aby poznać zmienne szablonów.

## Scalanie rozdzielonych wysyłek DM (komenda + URL w jednej wiadomości)

Gdy użytkownik wpisuje komendę i URL razem w iMessage — np. `Dump https://example.com/article` — Apple rozdziela wysyłkę na **dwa osobne dostarczenia webhooka**:

1. Wiadomość tekstową (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

Na większości konfiguracji te dwa webhooki docierają do OpenClaw w odstępie około 0.8–2.0 s. Bez scalania agent otrzymuje samą komendę w turze 1, odpowiada (często „wyślij mi URL”), i dopiero w turze 2 widzi URL — kiedy kontekst komendy jest już utracony.

`channels.bluebubbles.coalesceSameSenderDms` pozwala w DM scalić kolejne webhooki od tego samego nadawcy w jedną turę agenta. Czaty grupowe nadal pozostają przypięte do poszczególnych wiadomości, dzięki czemu zachowana jest struktura tur wielu użytkowników.

### Kiedy włączyć

Włącz, gdy:

- Dostarczasz Skills, które oczekują `command + payload` w jednej wiadomości (dump, paste, save, queue itd.).
- Twoi użytkownicy wklejają URL-e, obrazy lub długie treści razem z komendami.
- Akceptujesz dodatkowe opóźnienie tury DM (patrz niżej).

Pozostaw wyłączone, gdy:

- Potrzebujesz minimalnego opóźnienia komend dla jednokrotnych wyzwalaczy DM.
- Wszystkie twoje przepływy to jednorazowe komendy bez późniejszych payloadów.

### Włączanie

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // włączenie (domyślnie: false)
    },
  },
}
```

Przy włączonej fladze i bez jawnego `messages.inbound.byChannel.bluebubbles`, okno debounce rozszerza się do **2500 ms** (domyślnie dla braku scalania jest to 500 ms). Szersze okno jest wymagane — tempo rozdzielonych wysyłek Apple wynoszące 0.8–2.0 s nie mieści się w ciaśniejszym ustawieniu domyślnym.

Aby samodzielnie dostroić okno:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms działa na większości konfiguracji; zwiększ do 4000 ms, jeśli Twój Mac jest wolny
        // lub ma presję pamięci (zaobserwowana przerwa może wtedy przekroczyć 2 s).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Kompromisy

- **Dodatkowe opóźnienie dla komend sterujących w DM.** Przy włączonej fladze wiadomości z komendami sterującymi w DM (takie jak `Dump`, `Save` itd.) czekają teraz do końca okna debounce przed wysłaniem, na wypadek gdyby miał nadejść webhook z payloadem. Komendy w czatach grupowych nadal są wysyłane natychmiast.
- **Scalony wynik ma ograniczenia** — scalony tekst jest ograniczony do 4000 znaków z jawnym znacznikiem `…[truncated]`; załączniki są ograniczone do 20; wpisy źródłowe do 10 (po przekroczeniu zachowywane są pierwszy i najnowszy). Każdy źródłowy `messageId` nadal trafia do inbound-dedupe, więc późniejsze odtworzenie dowolnego pojedynczego zdarzenia przez MessagePoller zostanie rozpoznane jako duplikat.
- **Opt-in, per kanał.** Inne kanały (Telegram, WhatsApp, Slack, …) pozostają bez zmian.

### Scenariusze i to, co widzi agent

| Użytkownik wpisuje                                                 | Apple dostarcza           | Flaga wyłączona (domyślnie)             | Flaga włączona + okno 2500 ms                                           |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (jedno wysłanie)                        | 2 webhooki ~1 s odstępu   | Dwie tury agenta: samo „Dump”, potem URL | Jedna tura: scalony tekst `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (załącznik + tekst)                | 2 webhooki                | Dwie tury                               | Jedna tura: tekst + obraz                                               |
| `/status` (samodzielna komenda)                                    | 1 webhook                 | Natychmiastowe wysłanie                 | **Czekanie do końca okna, potem wysłanie**                              |
| Samodzielnie wklejony URL                                          | 1 webhook                 | Natychmiastowe wysłanie                 | Natychmiastowe wysłanie (tylko jeden wpis w bucket)                     |
| Tekst + URL wysłane celowo jako dwie osobne wiadomości, minuty później | 2 webhooki poza oknem  | Dwie tury                               | Dwie tury (okno wygasa między nimi)                                     |
| Szybki zalew (>10 małych DM-ów w oknie)                            | N webhooków               | N tur                                   | Jedna tura, wynik ograniczony (pierwszy + najnowszy, zastosowane limity tekstu/załączników) |

### Rozwiązywanie problemów ze scalaniem rozdzielonych wysyłek

Jeśli flaga jest włączona, a rozdzielone wysyłki nadal docierają jako dwie tury, sprawdź każdą warstwę:

1. **Czy konfiguracja została faktycznie wczytana.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Następnie `openclaw gateway restart` — flaga jest odczytywana podczas tworzenia rejestru debouncerów.

2. **Czy okno debounce jest wystarczająco szerokie dla twojej konfiguracji.** Sprawdź log serwera BlueBubbles w `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Zmierz odstęp między wysłaniem tekstu typu `"Dump"` a kolejnym wysłaniem `"https://..."; Attachments:`. Zwiększ `messages.inbound.byChannel.bluebubbles`, aby wygodnie pokrywało ten odstęp.

3. **Znaczniki czasu JSONL sesji ≠ przyjście webhooka.** Znaczniki czasu zdarzeń sesji (`~/.openclaw/agents/<id>/sessions/*.jsonl`) odzwierciedlają moment przekazania wiadomości przez Gateway do agenta, **a nie** moment przyjścia webhooka. Druga wiadomość oznaczona jako `[Queued messages while agent was busy]` oznacza, że pierwsza tura nadal trwała, gdy przyszedł drugi webhook — bucket scalania został już opróżniony. Dostrajaj okno na podstawie logu serwera BB, a nie logu sesji.

4. **Presja pamięci spowalnia wysyłanie odpowiedzi.** Na słabszych maszynach (8 GB) tury agenta mogą trwać na tyle długo, że bucket scalania opróżnia się przed zakończeniem odpowiedzi, a URL trafia jako druga tura w kolejce. Sprawdź `memory_pressure` i `ps -o rss -p $(pgrep openclaw-gateway)`; jeśli Gateway przekracza około 500 MB RSS i aktywny jest kompresor, zamknij inne ciężkie procesy albo przejdź na mocniejszą maszynę.

5. **Wysyłki jako cytowana odpowiedź to inna ścieżka.** Jeśli użytkownik stuknął `Dump` jako **odpowiedź** na istniejący dymek URL (iMessage pokazuje odznakę „1 Reply” na dymku Dump), URL znajduje się w `replyToBody`, a nie w drugim webhooku. Scalanie nie ma wtedy zastosowania — to kwestia Skills/promptu, a nie debouncera.

## Block streaming

Określ, czy odpowiedzi mają być wysyłane jako pojedyncza wiadomość czy strumieniowane blokami:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // włącza block streaming (domyślnie wyłączone)
    },
  },
}
```

## Media + limity

- Przychodzące załączniki są pobierane i przechowywane w cache mediów.
- Limit mediów ustawiany przez `channels.bluebubbles.mediaMaxMb` dla mediów przychodzących i wychodzących (domyślnie: 8 MB).
- Tekst wychodzący jest dzielony na fragmenty zgodnie z `channels.bluebubbles.textChunkLimit` (domyślnie: 4000 znaków).

## Dokumentacja konfiguracji

Pełna konfiguracja: [Configuration](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.bluebubbles.enabled`: włącza/wyłącza kanał.
- `channels.bluebubbles.serverUrl`: bazowy URL REST API BlueBubbles.
- `channels.bluebubbles.password`: hasło API.
- `channels.bluebubbles.webhookPath`: ścieżka endpointu webhooka (domyślnie: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).
- `channels.bluebubbles.allowFrom`: allowlista DM-ów (uchwyty, e-maile, numery E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (domyślnie: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: allowlista nadawców grupowych.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: na macOS opcjonalnie wzbogaca nienazwanych uczestników grupy na podstawie lokalnych Contacts po przejściu bramkowania. Domyślnie: `false`.
- `channels.bluebubbles.groups`: konfiguracja per grupa (`requireMention` itd.).
- `channels.bluebubbles.sendReadReceipts`: wysyła potwierdzenia odczytu (domyślnie: `true`).
- `channels.bluebubbles.blockStreaming`: włącza block streaming (domyślnie: `false`; wymagane dla odpowiedzi strumieniowanych).
- `channels.bluebubbles.textChunkLimit`: rozmiar fragmentu wychodzącego w znakach (domyślnie: 4000).
- `channels.bluebubbles.sendTimeoutMs`: limit czasu na żądanie w ms dla wychodzących wysyłek tekstu przez `/api/v1/message/text` (domyślnie: 30000). Zwiększ na konfiguracjach macOS 26, gdzie wysyłki iMessage przez Private API mogą zawieszać się na ponad 60 sekund wewnątrz frameworka iMessage; na przykład `45000` lub `60000`. Proby, wyszukiwania czatów, reakcje, edycje i kontrole stanu na razie zachowują krótszy domyślny limit 10 s; rozszerzenie tego na reakcje i edycje jest planowane jako kolejny krok. Nadpisanie per konto: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (domyślnie) dzieli tylko po przekroczeniu `textChunkLimit`; `newline` dzieli po pustych wierszach (granice akapitów) przed dzieleniem według długości.
- `channels.bluebubbles.mediaMaxMb`: limit mediów przychodzących/wychodzących w MB (domyślnie: 8).
- `channels.bluebubbles.mediaLocalRoots`: jawna allowlista bezwzględnych lokalnych katalogów dozwolonych dla wychodzących lokalnych ścieżek mediów. Wysyłanie lokalnych ścieżek jest domyślnie zabronione, jeśli to nie jest skonfigurowane. Nadpisanie per konto: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: scala kolejne webhooki DM od tego samego nadawcy w jedną turę agenta, aby rozdzielona przez Apple wysyłka tekst+URL docierała jako pojedyncza wiadomość (domyślnie: `false`). Scenariusze, strojenie okna i kompromisy opisano w [Coalescing split-send DMs](#coalescing-split-send-dms-command--url-in-one-composition). Po włączeniu bez jawnego `messages.inbound.byChannel.bluebubbles` rozszerza domyślne okno debounce dla wiadomości przychodzących z 500 ms do 2500 ms.
- `channels.bluebubbles.historyLimit`: maksymalna liczba wiadomości grupowych dla kontekstu (0 wyłącza).
- `channels.bluebubbles.dmHistoryLimit`: limit historii DM.
- `channels.bluebubbles.actions`: włącza/wyłącza konkretne działania.
- `channels.bluebubbles.accounts`: konfiguracja wielu kont.

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

## Bezpieczeństwo

- Żądania webhooka są uwierzytelniane przez porównanie parametrów zapytania lub nagłówków `guid`/`password` z `channels.bluebubbles.password`.
- Zachowaj hasło API i endpoint webhooka w tajemnicy (traktuj je jak poświadczenia).
- Dla uwierzytelniania webhooka BlueBubbles nie ma obejścia dla localhost. Jeśli ruch webhooka przechodzi przez proxy, zachowaj hasło BlueBubbles w żądaniu na całej ścieżce end-to-end. `gateway.trustedProxies` nie zastępuje tutaj `channels.bluebubbles.password`. Zobacz [Gateway security](/pl/gateway/security#reverse-proxy-configuration).
- Jeśli wystawiasz serwer BlueBubbles poza swoją sieć LAN, włącz HTTPS + reguły firewalla.

## Rozwiązywanie problemów

- Jeśli wskaźniki pisania/odczytu przestają działać, sprawdź logi webhooka BlueBubbles i zweryfikuj, czy ścieżka Gatewaya odpowiada `channels.bluebubbles.webhookPath`.
- Kody parowania wygasają po godzinie; użyj `openclaw pairing list bluebubbles` i `openclaw pairing approve bluebubbles <code>`.
- Reakcje wymagają BlueBubbles private API (`POST /api/v1/message/react`); upewnij się, że wersja serwera je udostępnia.
- Edycja/cofanie wysłania wymagają macOS 13+ i zgodnej wersji serwera BlueBubbles. Na macOS 26 (Tahoe) edycja jest obecnie uszkodzona z powodu zmian w private API.
- Aktualizacje ikon grup mogą być niestabilne na macOS 26 (Tahoe): API może zwrócić sukces, ale nowa ikona się nie zsynchronizuje.
- OpenClaw automatycznie ukrywa znane jako uszkodzone działania na podstawie wersji macOS serwera BlueBubbles. Jeśli edycja nadal pojawia się na macOS 26 (Tahoe), wyłącz ją ręcznie przez `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` jest włączone, ale rozdzielone wysyłki (np. `Dump` + URL) nadal docierają jako dwie tury: zobacz checklistę [split-send coalescing troubleshooting](#split-send-coalescing-troubleshooting) — typowe przyczyny to zbyt wąskie okno debounce, błędne odczytanie znaczników czasu logu sesji jako czasu nadejścia webhooka albo wysyłka jako cytowana odpowiedź (która używa `replyToBody`, a nie drugiego webhooka).
- Informacje o statusie/stanie zdrowia: `openclaw status --all` lub `openclaw status --deep`.

Ogólny opis przepływu pracy kanałów znajdziesz w [Channels](/pl/channels) i przewodniku [Plugins](/pl/tools/plugin).

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Channel Routing](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
