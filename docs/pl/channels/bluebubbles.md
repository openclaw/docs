---
read_when:
    - Konfigurowanie kanału BlueBubbles
    - Rozwiązywanie problemów z parowaniem Webhooka
    - Konfigurowanie iMessage na macOS
summary: iMessage przez serwer BlueBubbles na macOS (wysyłanie/odbieranie REST, pisanie, reakcje, parowanie, zaawansowane akcje).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-22T04:20:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Status: dołączony Plugin, który komunikuje się z serwerem BlueBubbles na macOS przez HTTP. **Zalecany do integracji z iMessage** ze względu na bogatsze API i łatwiejszą konfigurację w porównaniu ze starszym kanałem imsg.

## Dołączony Plugin

Bieżące wydania OpenClaw zawierają BlueBubbles w pakiecie, więc zwykłe kompilacje pakietowane nie wymagają osobnego kroku `openclaw plugins install`.

## Przegląd

- Działa na macOS przez aplikację pomocniczą BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Zalecane/testowane: macOS Sequoia (15). macOS Tahoe (26) działa; edycja jest obecnie uszkodzona na Tahoe, a aktualizacje ikon grup mogą być zgłaszane jako udane, ale się nie synchronizować.
- OpenClaw komunikuje się z nim przez jego REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Wiadomości przychodzące docierają przez Webhooki; odpowiedzi wychodzące, wskaźniki pisania, potwierdzenia odczytu i tapbacki są wywołaniami REST.
- Załączniki i naklejki są przetwarzane jako media przychodzące (i przekazywane agentowi, gdy to możliwe).
- Parowanie/lista dozwolonych działa tak samo jak w innych kanałach (`/channels/pairing` itp.) z użyciem `channels.bluebubbles.allowFrom` + kodów parowania.
- Reakcje są prezentowane jako zdarzenia systemowe, tak jak w Slack/Telegram, dzięki czemu agenci mogą je „wspomnieć” przed odpowiedzią.
- Funkcje zaawansowane: edycja, cofanie wysłania, odpowiedzi w wątkach, efekty wiadomości, zarządzanie grupami.

## Szybki start

1. Zainstaluj serwer BlueBubbles na swoim Macu (postępuj zgodnie z instrukcjami na [bluebubbles.app/install](https://bluebubbles.app/install)).
2. W konfiguracji BlueBubbles włącz Web API i ustaw hasło.
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

4. Skieruj Webhooki BlueBubbles do swojego Gateway (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Uruchom Gateway; zarejestruje obsługę Webhooka i rozpocznie parowanie.

Uwaga dotycząca bezpieczeństwa:

- Zawsze ustawiaj hasło Webhooka.
- Uwierzytelnianie Webhooka jest zawsze wymagane. OpenClaw odrzuca żądania Webhooka BlueBubbles, chyba że zawierają hasło/guid zgodne z `channels.bluebubbles.password` (na przykład `?password=<password>` albo `x-password`), niezależnie od topologii local loopback/proxy.
- Uwierzytelnianie hasłem jest sprawdzane przed odczytem/przetwarzaniem pełnych treści Webhooka.

## Utrzymywanie aktywnej aplikacji Messages.app (konfiguracje VM / bezgłowe)

W niektórych konfiguracjach macOS VM / always-on aplikacja Messages.app może przejść w stan „bezczynności” (zdarzenia przychodzące przestają docierać, dopóki aplikacja nie zostanie otwarta/przeniesiona na pierwszy plan). Prostym obejściem jest **szturchanie Messages co 5 minut** za pomocą AppleScript + LaunchAgent.

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

- To uruchamia się **co 300 sekund** oraz **przy logowaniu**.
- Pierwsze uruchomienie może wywołać monity macOS dotyczące **Automatyzacji** (`osascript` → Messages). Zatwierdź je w tej samej sesji użytkownika, w której działa LaunchAgent.

Załaduj go:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles jest dostępne w interaktywnym onboardingu:

```
openclaw onboard
```

Kreator poprosi o:

- **URL serwera** (wymagane): adres serwera BlueBubbles (np. `http://192.168.1.100:1234`)
- **Hasło** (wymagane): hasło API z ustawień BlueBubbles Server
- **Ścieżkę Webhooka** (opcjonalne): domyślnie `/bluebubbles-webhook`
- **Zasadę DM**: pairing, allowlist, open lub disabled
- **Listę dozwolonych**: numery telefonów, adresy e-mail lub cele czatu

Możesz też dodać BlueBubbles przez CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kontrola dostępu (DM + grupy)

DM:

- Domyślnie: `channels.bluebubbles.dmPolicy = "pairing"`.
- Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdzanie przez:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Parowanie jest domyślnym mechanizmem wymiany tokenów. Szczegóły: [Parowanie](/pl/channels/pairing)

Grupy:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (domyślnie: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` określa, kto może wyzwalać działanie w grupach, gdy ustawiono `allowlist`.

### Wzbogacanie nazw kontaktów (macOS, opcjonalne)

Webhooki grupowe BlueBubbles często zawierają tylko surowe adresy uczestników. Jeśli chcesz, aby kontekst `GroupMembers` pokazywał zamiast tego lokalne nazwy kontaktów, możesz opcjonalnie włączyć lokalne wzbogacanie z Kontaktów na macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` włącza wyszukiwanie. Domyślnie: `false`.
- Wyszukiwania są wykonywane dopiero po tym, jak dostęp do grupy, autoryzacja poleceń i bramka wzmianek przepuszczą wiadomość.
- Wzbogacani są tylko nienazwani uczestnicy telefoniczni.
- Surowe numery telefonów pozostają wartością zapasową, gdy nie znaleziono lokalnego dopasowania.

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
- Polecenia sterujące od autoryzowanych nadawców omijają bramkę wzmianek.

Konfiguracja per grupa:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // wartość domyślna dla wszystkich grup
        "iMessage;-;chat123": { requireMention: false }, // nadpisanie dla konkretnej grupy
      },
    },
  },
}
```

### Bramka poleceń

- Polecenia sterujące (np. `/config`, `/model`) wymagają autoryzacji.
- Do określenia autoryzacji poleceń używane są `allowFrom` i `groupAllowFrom`.
- Autoryzowani nadawcy mogą uruchamiać polecenia sterujące nawet bez wzmianki w grupach.

### System prompt per grupa

Każdy wpis pod `channels.bluebubbles.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do system promptu agenta przy każdej turze obsługującej wiadomość w tej grupie, dzięki czemu możesz ustawić personę lub reguły zachowania per grupa bez edytowania promptów agenta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Utrzymuj odpowiedzi poniżej 3 zdań. Dopasuj się do swobodnego tonu grupy.",
        },
      },
    },
  },
}
```

Klucz odpowiada temu, co BlueBubbles raportuje jako `chatGuid` / `chatIdentifier` / numeryczne `chatId` dla grupy, a wpis z symbolem wieloznacznym `"*"` zapewnia wartość domyślną dla każdej grupy bez dokładnego dopasowania (ten sam wzorzec jest używany przez `requireMention` i zasady narzędzi per grupa). Dokładne dopasowania zawsze mają pierwszeństwo przed symbolem wieloznacznym. To pole jest ignorowane w DM; zamiast tego użyj dostosowania promptu na poziomie agenta lub konta.

#### Przykład praktyczny: odpowiedzi w wątkach i reakcje tapback (Private API)

Po włączeniu BlueBubbles Private API wiadomości przychodzące zawierają krótkie identyfikatory wiadomości (na przykład `[[reply_to:5]]`), a agent może wywołać `action=reply`, aby odpowiedzieć w konkretnym wątku, albo `action=react`, aby dodać tapback. `systemPrompt` per grupa to niezawodny sposób, aby agent wybierał właściwe narzędzie:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Odpowiadając w tej grupie, zawsze wywołuj action=reply z",
            "messageId `[[reply_to:N]]` z kontekstu, aby Twoja odpowiedź była",
            "wątkiem pod wiadomością wyzwalającą. Nigdy nie wysyłaj nowej,",
            "niepowiązanej wiadomości.",
            "",
            "W przypadku krótkich potwierdzeń ('ok', 'mam', 'już się tym zajmuję'), używaj",
            "action=react z odpowiednim emoji tapback (❤️, 👍, 😂, ‼️, ❓)",
            "zamiast wysyłać tekstową odpowiedź.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reakcje tapback i odpowiedzi w wątkach wymagają BlueBubbles Private API; mechanikę działania opisano w sekcjach [Zaawansowane akcje](#advanced-actions) i [Identyfikatory wiadomości](#message-ids-short-vs-full).

## Powiązania konwersacji ACP

Czaty BlueBubbles można zamienić w trwałe obszary robocze ACP bez zmiany warstwy transportowej.

Szybki przepływ pracy operatora:

- Uruchom `/acp spawn codex --bind here` w DM lub dozwolonym czacie grupowym.
- Kolejne wiadomości w tej samej konwersacji BlueBubbles będą kierowane do uruchomionej sesji ACP.
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

Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać wspólne zachowanie powiązań ACP.

## Pisanie + potwierdzenia odczytu

- **Wskaźniki pisania**: wysyłane automatycznie przed i podczas generowania odpowiedzi.
- **Potwierdzenia odczytu**: kontrolowane przez `channels.bluebubbles.sendReadReceipts` (domyślnie: `true`).
- **Wskaźniki pisania**: OpenClaw wysyła zdarzenia rozpoczęcia pisania; BlueBubbles czyści stan pisania automatycznie po wysłaniu lub po przekroczeniu limitu czasu (ręczne zatrzymanie przez DELETE jest zawodne).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // wyłącz potwierdzenia odczytu
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
        reactions: true, // tapbacki (domyślnie: true)
        edit: true, // edytowanie wysłanych wiadomości (macOS 13+, uszkodzone na macOS 26 Tahoe)
        unsend: true, // cofanie wysłania wiadomości (macOS 13+)
        reply: true, // odpowiedzi w wątkach według GUID wiadomości
        sendWithEffect: true, // efekty wiadomości (slam, loud itp.)
        renameGroup: true, // zmiana nazwy czatów grupowych
        setGroupIcon: true, // ustawianie ikony/zdjęcia czatu grupowego (niestabilne na macOS 26 Tahoe)
        addParticipant: true, // dodawanie uczestników do grup
        removeParticipant: true, // usuwanie uczestników z grup
        leaveGroup: true, // opuszczanie czatów grupowych
        sendAttachment: true, // wysyłanie załączników/mediów
      },
    },
  },
}
```

Dostępne akcje:

- **react**: dodawanie/usuwanie reakcji tapback (`messageId`, `emoji`, `remove`). Natywny zestaw tapbacków iMessage to `love`, `like`, `dislike`, `laugh`, `emphasize` i `question`. Gdy agent wybierze emoji spoza tego zestawu (na przykład `👀`), narzędzie reakcji przełącza się awaryjnie na `love`, aby tapback nadal się wyświetlił zamiast powodować niepowodzenie całego żądania. Skonfigurowane reakcje ack nadal są walidowane ściśle i zwracają błąd dla nieznanych wartości.
- **edit**: edytowanie wysłanej wiadomości (`messageId`, `text`)
- **unsend**: cofanie wysłania wiadomości (`messageId`)
- **reply**: odpowiedź na konkretną wiadomość (`messageId`, `text`, `to`)
- **sendWithEffect**: wysyłanie z efektem iMessage (`text`, `to`, `effectId`)
- **renameGroup**: zmiana nazwy czatu grupowego (`chatGuid`, `displayName`)
- **setGroupIcon**: ustawienie ikony/zdjęcia czatu grupowego (`chatGuid`, `media`) — niestabilne na macOS 26 Tahoe (API może zwracać sukces, ale ikona się nie synchronizuje).
- **addParticipant**: dodanie osoby do grupy (`chatGuid`, `address`)
- **removeParticipant**: usunięcie osoby z grupy (`chatGuid`, `address`)
- **leaveGroup**: opuszczenie czatu grupowego (`chatGuid`)
- **upload-file**: wysyłanie mediów/plików (`to`, `buffer`, `filename`, `asVoice`)
  - Notatki głosowe: ustaw `asVoice: true` z dźwiękiem **MP3** lub **CAF**, aby wysłać go jako wiadomość głosową iMessage. BlueBubbles konwertuje MP3 → CAF podczas wysyłania notatek głosowych.
- Starszy alias: `sendAttachment` nadal działa, ale `upload-file` jest kanoniczną nazwą akcji.

### Identyfikatory wiadomości (krótkie vs pełne)

OpenClaw może prezentować _krótkie_ identyfikatory wiadomości (np. `1`, `2`), aby oszczędzać tokeny.

- `MessageSid` / `ReplyToId` mogą być krótkimi identyfikatorami.
- `MessageSidFull` / `ReplyToIdFull` zawierają pełne identyfikatory dostawcy.
- Krótkie identyfikatory są przechowywane w pamięci; mogą wygasnąć po restarcie lub wyczyszczeniu cache.
- Akcje akceptują krótki lub pełny `messageId`, ale krótkie identyfikatory zwrócą błąd, jeśli nie są już dostępne.

Używaj pełnych identyfikatorów do trwałych automatyzacji i przechowywania:

- Szablony: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontekst: `MessageSidFull` / `ReplyToIdFull` w ładunkach przychodzących

Zobacz [Konfiguracja](/pl/gateway/configuration), aby poznać zmienne szablonów.

## Scalanie rozdzielonych DM przy wysyłaniu (polecenie + URL w jednej wiadomości)

Gdy użytkownik wpisuje razem polecenie i URL w iMessage — np. `Dump https://example.com/article` — Apple rozdziela wysłanie na **dwie osobne dostawy Webhooka**:

1. Wiadomość tekstową (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

Dwa Webhooki docierają do OpenClaw w odstępie około 0,8-2,0 s w większości konfiguracji. Bez scalania agent otrzymuje samo polecenie w turze 1, odpowiada (często „wyślij mi URL”), i dopiero w turze 2 widzi URL — gdy kontekst polecenia jest już utracony.

`channels.bluebubbles.coalesceSameSenderDms` pozwala włączyć dla DM scalanie kolejnych Webhooków od tego samego nadawcy w jedną turę agenta. Czaty grupowe nadal są kluczowane per wiadomość, aby zachować strukturę tur wielu użytkowników.

### Kiedy włączyć

Włącz, gdy:

- Dostarczasz Skills, które oczekują `polecenie + ładunek` w jednej wiadomości (dump, paste, save, queue itp.).
- Twoi użytkownicy wklejają adresy URL, obrazy lub długie treści razem z poleceniami.
- Możesz zaakceptować dodatkowe opóźnienie tury DM (patrz niżej).

Pozostaw wyłączone, gdy:

- Potrzebujesz minimalnego opóźnienia poleceń dla jednokrotnych wyzwalaczy DM.
- Wszystkie Twoje przepływy to jednorazowe polecenia bez dalszego ładunku.

### Włączanie

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // włącz opcjonalnie (domyślnie: false)
    },
  },
}
```

Przy włączonej fladze i bez jawnego `messages.inbound.byChannel.bluebubbles` okno debounce rozszerza się do **2500 ms** (domyślnie dla trybu bez scalania jest to 500 ms). Szersze okno jest wymagane — rytm rozdzielonego wysyłania Apple na poziomie 0,8-2,0 s nie mieści się w ciaśniejszym domyślnym zakresie.

Aby samodzielnie dostroić okno:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms działa w większości konfiguracji; zwiększ do 4000 ms, jeśli Twój Mac jest wolny
        // albo pod presją pamięci (zaobserwowana przerwa może wtedy przekroczyć 2 s).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Kompromisy

- **Dodatkowe opóźnienie dla poleceń sterujących DM.** Przy włączonej fladze wiadomości z poleceniami sterującymi DM (takie jak `Dump`, `Save` itp.) czekają teraz do końca okna debounce przed wysłaniem dalej, na wypadek gdyby nadchodził Webhook z ładunkiem. Polecenia w czatach grupowych zachowują natychmiastowe wysyłanie.
- **Scalony wynik ma ograniczenia** — scalony tekst jest ograniczony do 4000 znaków z jawnym znacznikiem `…[truncated]`; załączniki są ograniczone do 20; wpisy źródłowe są ograniczone do 10 (po przekroczeniu zachowywane są pierwszy i najnowszy). Każdy źródłowy `messageId` nadal trafia do inbound-dedupe, więc późniejsze ponowne odtworzenie dowolnego pojedynczego zdarzenia przez MessagePoller zostanie rozpoznane jako duplikat.
- **Opcjonalne, per kanał.** Inne kanały (Telegram, WhatsApp, Slack, …) pozostają bez zmian.

### Scenariusze i to, co widzi agent

| Użytkownik wpisuje                                                   | Apple dostarcza           | Flaga wyłączona (domyślnie)             | Flaga włączona + okno 2500 ms                                         |
| -------------------------------------------------------------------- | ------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `Dump https://example.com` (jedno wysłanie)                          | 2 Webhooki ~1 s odstępu   | Dwie tury agenta: samo „Dump”, potem URL | Jedna tura: scalony tekst `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (załącznik + tekst)                  | 2 Webhooki                | Dwie tury                               | Jedna tura: tekst + obraz                                             |
| `/status` (samodzielne polecenie)                                    | 1 Webhook                 | Natychmiastowe wysłanie                 | **Czekanie do końca okna, potem wysłanie**                            |
| Samodzielnie wklejony URL                                            | 1 Webhook                 | Natychmiastowe wysłanie                 | Natychmiastowe wysłanie (tylko jeden wpis w koszyku)                  |
| Tekst + URL wysłane jako dwie celowo osobne wiadomości, w odstępie minut | 2 Webhooki poza oknem     | Dwie tury                               | Dwie tury (okno wygasa między nimi)                                   |
| Szybki zalew (>10 małych DM w oknie)                                 | N Webhooków               | N tur                                   | Jedna tura, wynik ograniczony (pierwszy + najnowszy, limity tekstu/załączników zastosowane) |

### Rozwiązywanie problemów ze scalaniem rozdzielonych wiadomości

Jeśli flaga jest włączona, a rozdzielone wysłania nadal docierają jako dwie tury, sprawdź każdą warstwę:

1. **Konfiguracja rzeczywiście została załadowana.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Następnie `openclaw gateway restart` — flaga jest odczytywana podczas tworzenia rejestru debouncerów.

2. **Okno debounce jest wystarczająco szerokie dla Twojej konfiguracji.** Sprawdź log serwera BlueBubbles w `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Zmierz odstęp między wysłaniem tekstu w stylu `"Dump"` a kolejnym wysłaniem `"https://..."; Attachments:`. Zwiększ `messages.inbound.byChannel.bluebubbles`, aby wygodnie obejmowało ten odstęp.

3. **Znaczniki czasu JSONL sesji ≠ nadejście Webhooka.** Znaczniki czasu zdarzeń sesji (`~/.openclaw/agents/<id>/sessions/*.jsonl`) odzwierciedlają moment przekazania wiadomości przez Gateway do agenta, **a nie** moment nadejścia Webhooka. Oznaczenie drugiej wiadomości w kolejce jako `[Queued messages while agent was busy]` oznacza, że pierwsza tura nadal trwała, gdy dotarł drugi Webhook — koszyk scalania został już opróżniony. Dostrajaj okno względem logu serwera BB, a nie logu sesji.

4. **Presja pamięci spowalnia wysyłanie odpowiedzi.** Na mniejszych maszynach (8 GB) tury agenta mogą trwać na tyle długo, że koszyk scalania zostaje opróżniony przed zakończeniem odpowiedzi, a URL trafia jako druga tura w kolejce. Sprawdź `memory_pressure` i `ps -o rss -p $(pgrep openclaw-gateway)`; jeśli Gateway przekracza ~500 MB RSS i Compaction jest aktywne, zamknij inne ciężkie procesy albo przejdź na większy host.

5. **Wysyłanie cytatów odpowiedzi to inna ścieżka.** Jeśli użytkownik stuknął `Dump` jako **odpowiedź** na istniejący dymek URL (iMessage pokazuje plakietkę „1 Reply” na dymku Dump), URL znajduje się w `replyToBody`, a nie w drugim Webhooku. Scalanie nie ma tu zastosowania — to kwestia Skills/promptu, a nie debouncera.

## Block streaming

Kontroluje, czy odpowiedzi są wysyłane jako pojedyncza wiadomość, czy strumieniowane w blokach:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // włącz block streaming (domyślnie wyłączone)
    },
  },
}
```

## Media + limity

- Załączniki przychodzące są pobierane i przechowywane w cache mediów.
- Limit mediów przez `channels.bluebubbles.mediaMaxMb` dla mediów przychodzących i wychodzących (domyślnie: 8 MB).
- Tekst wychodzący jest dzielony na fragmenty zgodnie z `channels.bluebubbles.textChunkLimit` (domyślnie: 4000 znaków).

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.bluebubbles.enabled`: włącza/wyłącza kanał.
- `channels.bluebubbles.serverUrl`: bazowy URL REST API BlueBubbles.
- `channels.bluebubbles.password`: hasło API.
- `channels.bluebubbles.webhookPath`: ścieżka punktu końcowego Webhooka (domyślnie: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).
- `channels.bluebubbles.allowFrom`: lista dozwolonych dla DM (uchwyty, e-maile, numery E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (domyślnie: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: lista dozwolonych nadawców grupowych.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: na macOS opcjonalnie wzbogaca nienazwanych uczestników grupy na podstawie lokalnych Kontaktów po przejściu bramek. Domyślnie: `false`.
- `channels.bluebubbles.groups`: konfiguracja per grupa (`requireMention` itp.).
- `channels.bluebubbles.sendReadReceipts`: wysyłanie potwierdzeń odczytu (domyślnie: `true`).
- `channels.bluebubbles.blockStreaming`: włącza block streaming (domyślnie: `false`; wymagane dla odpowiedzi strumieniowanych).
- `channels.bluebubbles.textChunkLimit`: rozmiar fragmentu wychodzącego w znakach (domyślnie: 4000).
- `channels.bluebubbles.sendTimeoutMs`: limit czasu pojedynczego żądania w ms dla wysyłania tekstu wychodzącego przez `/api/v1/message/text` (domyślnie: 30000). Zwiększ dla konfiguracji macOS 26, w których wysyłanie iMessage przez Private API może zawieszać się na ponad 60 sekund wewnątrz frameworka iMessage; na przykład `45000` lub `60000`. Testy, wyszukiwanie czatów, reakcje, edycje i kontrole stanu obecnie zachowują krótszy domyślny limit 10 s; rozszerzenie tego na reakcje i edycje jest planowane jako kolejny krok. Nadpisanie per konto: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (domyślnie) dzieli tylko po przekroczeniu `textChunkLimit`; `newline` dzieli po pustych liniach (granice akapitów) przed dzieleniem według długości.
- `channels.bluebubbles.mediaMaxMb`: limit mediów przychodzących/wychodzących w MB (domyślnie: 8).
- `channels.bluebubbles.mediaLocalRoots`: jawna lista dozwolonych bezwzględnych katalogów lokalnych, z których wolno używać lokalnych ścieżek mediów wychodzących. Wysyłanie z lokalnej ścieżki jest domyślnie blokowane, jeśli to nie jest skonfigurowane. Nadpisanie per konto: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: scala kolejne Webhooki DM od tego samego nadawcy w jedną turę agenta, aby rozdzielone przez Apple wysłanie tekst+URL docierało jako jedna wiadomość (domyślnie: `false`). Zobacz [Scalanie rozdzielonych DM przy wysyłaniu](#coalescing-split-send-dms-command--url-in-one-composition), aby poznać scenariusze, strojenie okna i kompromisy. Po włączeniu bez jawnego `messages.inbound.byChannel.bluebubbles` rozszerza domyślne okno debounce dla wiadomości przychodzących z 500 ms do 2500 ms.
- `channels.bluebubbles.historyLimit`: maksymalna liczba wiadomości grupowych dla kontekstu (0 wyłącza).
- `channels.bluebubbles.dmHistoryLimit`: limit historii DM.
- `channels.bluebubbles.actions`: włącza/wyłącza określone akcje.
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

### Routing iMessage vs SMS

Gdy ten sam uchwyt ma na Macu zarówno czat iMessage, jak i SMS (na przykład numer telefonu zarejestrowany w iMessage, który otrzymywał też zielone fallbacki), OpenClaw preferuje czat iMessage i nigdy po cichu nie przełącza na SMS. Aby wymusić czat SMS, użyj jawnego prefiksu celu `sms:` (na przykład `sms:+15555550123`). Uchwyty bez pasującego czatu iMessage nadal wysyłają przez ten czat, który zgłasza BlueBubbles.

## Bezpieczeństwo

- Żądania Webhooka są uwierzytelniane przez porównanie parametrów zapytania lub nagłówków `guid`/`password` z `channels.bluebubbles.password`.
- Zachowaj hasło API i punkt końcowy Webhooka w tajemnicy (traktuj je jak dane uwierzytelniające).
- Nie ma obejścia localhost dla uwierzytelniania Webhooka BlueBubbles. Jeśli przekazujesz ruch Webhooka przez proxy, zachowaj hasło BlueBubbles w żądaniu na całej ścieżce end-to-end. `gateway.trustedProxies` nie zastępuje tutaj `channels.bluebubbles.password`. Zobacz [Bezpieczeństwo Gateway](/pl/gateway/security#reverse-proxy-configuration).
- Włącz HTTPS i reguły zapory na serwerze BlueBubbles, jeśli wystawiasz go poza swoją sieć LAN.

## Rozwiązywanie problemów

- Jeśli zdarzenia pisania/odczytu przestaną działać, sprawdź logi Webhooka BlueBubbles i upewnij się, że ścieżka Gateway odpowiada `channels.bluebubbles.webhookPath`.
- Kody parowania wygasają po jednej godzinie; użyj `openclaw pairing list bluebubbles` i `openclaw pairing approve bluebubbles <code>`.
- Reakcje wymagają BlueBubbles private API (`POST /api/v1/message/react`); upewnij się, że wersja serwera je udostępnia.
- Edycja/cofanie wysłania wymagają macOS 13+ i zgodnej wersji serwera BlueBubbles. W macOS 26 (Tahoe) edycja jest obecnie uszkodzona z powodu zmian w Private API.
- Aktualizacje ikon grup mogą być niestabilne na macOS 26 (Tahoe): API może zwracać sukces, ale nowa ikona się nie synchronizuje.
- OpenClaw automatycznie ukrywa znane uszkodzone akcje na podstawie wersji macOS serwera BlueBubbles. Jeśli edycja nadal pojawia się na macOS 26 (Tahoe), wyłącz ją ręcznie przez `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` jest włączone, ale rozdzielone wysłania (np. `Dump` + URL) nadal docierają jako dwie tury: zobacz listę kontrolną [rozwiązywania problemów ze scalaniem rozdzielonych wiadomości](#split-send-coalescing-troubleshooting) — częste przyczyny to zbyt wąskie okno debounce, błędne odczytanie znaczników czasu logu sesji jako nadejścia Webhooka albo wysłanie cytatu odpowiedzi (które używa `replyToBody`, a nie drugiego Webhooka).
- Informacje o statusie/stanie: `openclaw status --all` lub `openclaw status --deep`.

Ogólne informacje o przepływie pracy kanałów znajdziesz w [Kanały](/pl/channels) i przewodniku [Plugins](/pl/tools/plugin).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
