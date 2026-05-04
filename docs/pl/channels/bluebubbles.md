---
read_when:
    - Konfigurowanie kanału BlueBubbles
    - Rozwiązywanie problemów z parowaniem Webhook
    - Konfigurowanie iMessage w systemie macOS
sidebarTitle: BlueBubbles
summary: iMessage za pośrednictwem serwera BlueBubbles na macOS (wysyłanie/odbieranie przez REST, pisanie, reakcje, parowanie, zaawansowane działania).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-04T02:21:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78a054da0c7c32b161997acd05914896259dd1a050e736a4c9e438a452ab6a51
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: dołączony Plugin, który komunikuje się z serwerem BlueBubbles macOS przez HTTP. **Zalecany do integracji z iMessage** ze względu na bogatsze API i łatwiejszą konfigurację w porównaniu ze starszym kanałem imsg.

<Note>
Bieżące wydania OpenClaw zawierają BlueBubbles, więc zwykłe pakietowane kompilacje nie wymagają osobnego kroku `openclaw plugins install`.
</Note>

## Omówienie

- Działa na macOS przez aplikację pomocniczą BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Zalecane/przetestowane: macOS Sequoia (15). macOS Tahoe (26) działa; edycja jest obecnie zepsuta w Tahoe, a aktualizacje ikony grupy mogą zgłaszać powodzenie, ale nie synchronizować się.
- OpenClaw komunikuje się z nim przez jego REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Przychodzące wiadomości docierają przez Webhook; wychodzące odpowiedzi, wskaźniki pisania, potwierdzenia odczytu i tapbacki są wywołaniami REST.
- Załączniki i naklejki są pobierane jako przychodzące multimedia (i udostępniane agentowi, gdy to możliwe).
- Automatyczne odpowiedzi TTS, które syntetyzują audio MP3 lub CAF, są dostarczane jako dymki notatek głosowych iMessage zamiast zwykłych załączników plików.
- Parowanie/lista dozwolonych działa tak samo jak w innych kanałach (`/channels/pairing` itd.) z `channels.bluebubbles.allowFrom` + kodami parowania.
- Reakcje są udostępniane jako zdarzenia systemowe tak jak w Slack/Telegram, dzięki czemu agenci mogą je „wspomnieć” przed odpowiedzią.
- Funkcje zaawansowane: edycja, cofanie wysłania, wątkowanie odpowiedzi, efekty wiadomości, zarządzanie grupami.

## Szybki start

<Steps>
  <Step title="Zainstaluj BlueBubbles">
    Zainstaluj serwer BlueBubbles na Macu (postępuj zgodnie z instrukcjami na [bluebubbles.app/install](https://bluebubbles.app/install)).
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
  <Step title="Skieruj Webhook do Gateway">
    Skieruj Webhook BlueBubbles do swojego Gateway (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Uruchom Gateway">
    Uruchom Gateway; zarejestruje obsługę Webhook i rozpocznie parowanie.
  </Step>
</Steps>

<Warning>
**Bezpieczeństwo**

- Zawsze ustawiaj hasło Webhook.
- Uwierzytelnianie Webhook jest zawsze wymagane. OpenClaw odrzuca żądania Webhook BlueBubbles, chyba że zawierają hasło/guid zgodne z `channels.bluebubbles.password` (na przykład `?password=<password>` lub `x-password`), niezależnie od topologii local loopback/proxy.
- Uwierzytelnianie hasłem jest sprawdzane przed odczytem/parsowaniem pełnych treści Webhook.

</Warning>

## Utrzymywanie Messages.app przy życiu (konfiguracje VM / headless)

Niektóre konfiguracje macOS VM / always-on mogą sprawić, że Messages.app przejdzie w stan „bezczynności” (przychodzące zdarzenia zatrzymują się, dopóki aplikacja nie zostanie otwarta/przeniesiona na pierwszy plan). Prostym obejściem jest **szturchnięcie Messages co 5 minut** za pomocą AppleScript + LaunchAgent.

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

    To działa **co 300 sekund** oraz **przy logowaniu**. Pierwsze uruchomienie może wywołać monity macOS **Automation** (`osascript` → Messages). Zatwierdź je w tej samej sesji użytkownika, która uruchamia LaunchAgent.

  </Step>
  <Step title="Załaduj go">
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

Kreator prosi o:

<ParamField path="Adres URL serwera" type="string" required>
  Adres serwera BlueBubbles (np. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Hasło" type="string" required>
  Hasło API z ustawień BlueBubbles Server.
</ParamField>
<ParamField path="Ścieżka Webhook" type="string" default="/bluebubbles-webhook">
  Ścieżka punktu końcowego Webhook.
</ParamField>
<ParamField path="Zasada DM" type="string">
  `pairing`, `allowlist`, `open` albo `disabled`.
</ParamField>
<ParamField path="Lista dozwolonych" type="string[]">
  Numery telefonów, adresy e-mail lub cele czatu.
</ParamField>

Możesz też dodać BlueBubbles przez CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kontrola dostępu (DM-y + grupy)

<Tabs>
  <Tab title="DM-y">
    - Domyślnie: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
    - Zatwierdź przez:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Parowanie jest domyślną wymianą tokenów. Szczegóły: [Parowanie](/pl/channels/pairing)

  </Tab>
  <Tab title="Grupy">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (domyślnie: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` kontroluje, kto może wyzwalać w grupach, gdy ustawiono `allowlist`.

  </Tab>
</Tabs>

### Wzbogacanie nazw kontaktów (macOS, opcjonalne)

Webhooki grupowe BlueBubbles często zawierają tylko surowe adresy uczestników. Jeśli chcesz, aby kontekst `GroupMembers` pokazywał zamiast tego nazwy lokalnych kontaktów, możesz włączyć lokalne wzbogacanie z Kontaktów na macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` włącza wyszukiwanie. Domyślnie: `false`.
- Wyszukiwania są uruchamiane dopiero po tym, jak dostęp grupowy, autoryzacja poleceń i bramkowanie wzmianek przepuszczą wiadomość.
- Wzbogacani są tylko uczestnicy telefoniczni bez nazw.
- Surowe numery telefonów pozostają rozwiązaniem awaryjnym, gdy nie zostanie znalezione lokalne dopasowanie.

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

- Używa `agents.list[].groupChat.mentionPatterns` (albo `messages.groupChat.mentionPatterns`) do wykrywania wzmianek.
- Gdy dla grupy włączono `requireMention`, agent odpowiada tylko wtedy, gdy zostanie wspomniany.
- Polecenia sterujące od autoryzowanych nadawców omijają bramkowanie wzmianek.

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

### Bramkowanie poleceń

- Polecenia sterujące (np. `/config`, `/model`) wymagają autoryzacji.
- Używa `allowFrom` i `groupAllowFrom` do określenia autoryzacji poleceń.
- Autoryzowani nadawcy mogą uruchamiać polecenia sterujące nawet bez wzmianki w grupach.

### Systemowy prompt dla grupy

Każdy wpis w `channels.bluebubbles.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do systemowego promptu agenta przy każdej turze obsługującej wiadomość w tej grupie, dzięki czemu możesz ustawić personę lub reguły zachowania dla grupy bez edytowania promptów agenta:

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

Klucz odpowiada temu, co BlueBubbles zgłasza jako `chatGuid` / `chatIdentifier` / numeryczne `chatId` dla grupy, a wpis z symbolem wieloznacznym `"*"` zapewnia domyślne ustawienie dla każdej grupy bez dokładnego dopasowania (ten sam wzorzec używany przez `requireMention` i zasady narzędzi dla grupy). Dokładne dopasowania zawsze wygrywają z symbolem wieloznacznym. DM-y ignorują to pole; zamiast tego użyj dostosowywania promptu na poziomie agenta lub konta.

#### Przykład roboczy: odpowiedzi w wątkach i reakcje tapback (Private API)

Gdy BlueBubbles Private API jest włączone, wiadomości przychodzące docierają z krótkimi identyfikatorami wiadomości (na przykład `[[reply_to:5]]`), a agent może wywołać `action=reply`, aby odpowiedzieć w wątku konkretnej wiadomości, lub `action=react`, aby dodać tapback. `systemPrompt` dla grupy to niezawodny sposób, by agent wybierał właściwe narzędzie:

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

Reakcje tapback i odpowiedzi w wątkach wymagają BlueBubbles Private API; zobacz [Akcje zaawansowane](#advanced-actions) i [Identyfikatory wiadomości](#message-ids-short-vs-full), aby poznać podstawowe mechanizmy.

## Powiązania konwersacji ACP

Czaty BlueBubbles można zmienić w trwałe obszary robocze ACP bez zmiany warstwy transportu.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM-a lub dozwolonego czatu grupowego.
- Przyszłe wiadomości w tej samej konwersacji BlueBubbles są kierowane do uruchomionej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Obsługiwane są także skonfigurowane trwałe powiązania przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "bluebubbles"`.

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

## Pisanie + potwierdzenia odczytu

- **Wskaźniki pisania**: wysyłane automatycznie przed generowaniem odpowiedzi i w jego trakcie.
- **Potwierdzenia odczytu**: kontrolowane przez `channels.bluebubbles.sendReadReceipts` (domyślnie: `true`).
- **Wskaźniki pisania**: OpenClaw wysyła zdarzenia rozpoczęcia pisania; BlueBubbles automatycznie czyści pisanie przy wysyłce lub po przekroczeniu limitu czasu (ręczne zatrzymanie przez DELETE jest zawodne).

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
  <Accordion title="Dostępne akcje">
    - **react**: Dodaj/usuń reakcje tapback (`messageId`, `emoji`, `remove`). Natywny zestaw tapback iMessage to `love`, `like`, `dislike`, `laugh`, `emphasize` i `question`. Gdy agent wybierze emoji spoza tego zestawu (na przykład `👀`), narzędzie reakcji wraca do `love`, aby tapback nadal się wyświetlił zamiast powodować niepowodzenie całego żądania. Skonfigurowane reakcje potwierdzenia nadal są walidowane rygorystycznie i zwracają błąd dla nieznanych wartości.
    - **edit**: Edytuj wysłaną wiadomość (`messageId`, `text`).
    - **unsend**: Cofnij wysłanie wiadomości (`messageId`).
    - **reply**: Odpowiedz na konkretną wiadomość (`messageId`, `text`, `to`).
    - **sendWithEffect**: Wyślij z efektem iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Zmień nazwę czatu grupowego (`chatGuid`, `displayName`).
    - **setGroupIcon**: Ustaw ikonę/zdjęcie czatu grupowego (`chatGuid`, `media`) — niestabilne w macOS 26 Tahoe (API może zwrócić powodzenie, ale ikona się nie zsynchronizuje).
    - **addParticipant**: Dodaj kogoś do grupy (`chatGuid`, `address`).
    - **removeParticipant**: Usuń kogoś z grupy (`chatGuid`, `address`).
    - **leaveGroup**: Opuść czat grupowy (`chatGuid`).
    - **upload-file**: Wyślij multimedia/pliki (`to`, `buffer`, `filename`, `asVoice`).
      - Notatki głosowe: ustaw `asVoice: true` z dźwiękiem **MP3** lub **CAF**, aby wysłać jako wiadomość głosową iMessage. BlueBubbles konwertuje MP3 → CAF podczas wysyłania notatek głosowych.
    - Starszy alias: `sendAttachment` nadal działa, ale `upload-file` jest kanoniczną nazwą akcji.

  </Accordion>
</AccordionGroup>

### Identyfikatory wiadomości (krótkie vs pełne)

OpenClaw może udostępniać _krótkie_ identyfikatory wiadomości (np. `1`, `2`), aby oszczędzać tokeny.

- `MessageSid` / `ReplyToId` mogą być krótkimi identyfikatorami.
- `MessageSidFull` / `ReplyToIdFull` zawierają pełne identyfikatory dostawcy.
- Krótkie identyfikatory są przechowywane w pamięci; mogą wygasnąć po ponownym uruchomieniu lub eksmisji z pamięci podręcznej.
- Akcje akceptują krótki lub pełny `messageId`, ale krótkie identyfikatory zwrócą błąd, jeśli nie będą już dostępne.

Używaj pełnych identyfikatorów dla trwałych automatyzacji i przechowywania:

- Szablony: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontekst: `MessageSidFull` / `ReplyToIdFull` w przychodzących ładunkach

Zobacz [Konfiguracja](/pl/gateway/configuration), aby poznać zmienne szablonów.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Scalanie DM wysłanych jako podzielone wiadomości (polecenie + URL w jednej kompozycji)

Gdy użytkownik wpisze razem polecenie i URL w iMessage — np. `Dump https://example.com/article` — Apple dzieli wysyłkę na **dwa osobne dostarczenia Webhook**:

1. Wiadomość tekstową (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

Dwa Webhook docierają do OpenClaw w odstępie około 0,8–2,0 s w większości konfiguracji. Bez scalania agent otrzymuje samo polecenie w turze 1, odpowiada (często „wyślij mi URL”) i widzi URL dopiero w turze 2 — w tym momencie kontekst polecenia jest już utracony.

`channels.bluebubbles.coalesceSameSenderDms` włącza dla DM scalanie kolejnych Webhook od tego samego nadawcy w jedną turę agenta. Czaty grupowe nadal są kluczowane per wiadomość, dzięki czemu struktura tur wielu użytkowników zostaje zachowana.

<Tabs>
  <Tab title="Kiedy włączyć">
    Włącz, gdy:

    - Dostarczasz Skills, które oczekują `command + payload` w jednej wiadomości (dump, paste, save, queue itd.).
    - Twoi użytkownicy wklejają adresy URL, obrazy lub długą treść razem z poleceniami.
    - Możesz zaakceptować dodatkowe opóźnienie tury DM (patrz niżej).

    Pozostaw wyłączone, gdy:

    - Potrzebujesz minimalnego opóźnienia poleceń dla jednowyrazowych wyzwalaczy DM.
    - Wszystkie Twoje przepływy to jednorazowe polecenia bez późniejszych ładunków.

  </Tab>
  <Tab title="Włączanie">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Przy włączonej fladze i bez jawnego `messages.inbound.byChannel.bluebubbles` okno debounce rozszerza się do **2500 ms** (wartość domyślna bez scalania to 500 ms). Szersze okno jest wymagane — rytm podzielonej wysyłki Apple wynoszący 0,8–2,0 s nie mieści się w ciaśniejszej wartości domyślnej.

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
  <Tab title="Kompromisy">
    - **Dodatkowe opóźnienie dla poleceń sterujących DM.** Przy włączonej fladze wiadomości z poleceniami sterującymi DM (takie jak `Dump`, `Save` itd.) czekają teraz do długości okna debounce przed wysłaniem, na wypadek nadejścia Webhook z ładunkiem. Polecenia na czatach grupowych zachowują natychmiastowe wysyłanie.
    - **Scalone wyjście jest ograniczone** — scalony tekst ma limit 4000 znaków z jawnym znacznikiem `…[truncated]`; załączniki mają limit 20; wpisy źródłowe mają limit 10 (po przekroczeniu zachowywany jest pierwszy plus najnowsze). Każdy źródłowy `messageId` nadal trafia do deduplikacji przychodzącej, więc późniejsze odtworzenie dowolnego pojedynczego zdarzenia przez MessagePoller zostanie rozpoznane jako duplikat.
    - **Włączane opcjonalnie, per kanał.** Inne kanały (Telegram, WhatsApp, Slack, …) nie są naruszane.

  </Tab>
</Tabs>

### Scenariusze i to, co widzi agent

| Użytkownik komponuje                                               | Apple dostarcza           | Flaga wyłączona (domyślnie)             | Flaga włączona + okno 2500 ms                                           |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (jedna wysyłka)                         | 2 Webhook w odstępie ~1 s | Dwie tury agenta: samo „Dump”, potem URL | Jedna tura: scalony tekst `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (załącznik + tekst)                | 2 Webhook                 | Dwie tury                              | Jedna tura: tekst + obraz                                               |
| `/status` (samodzielne polecenie)                                  | 1 Webhook                 | Natychmiastowe wysłanie                | **Czekaj do długości okna, potem wyślij**                               |
| Sam URL wklejony osobno                                            | 1 Webhook                 | Natychmiastowe wysłanie                | Natychmiastowe wysłanie (tylko jeden wpis w wiadrze)                    |
| Tekst + URL wysłane jako dwie celowo osobne wiadomości, po minutach | 2 Webhook poza oknem      | Dwie tury                              | Dwie tury (okno wygasa między nimi)                                     |
| Szybki zalew (>10 małych DM w oknie)                                | N Webhook                 | N tur                                  | Jedna tura, ograniczone wyjście (pierwsze + najnowsze, zastosowane limity tekstu/załączników) |

### Rozwiązywanie problemów ze scalaniem podzielonej wysyłki

Jeśli flaga jest włączona, a podzielone wysyłki nadal przychodzą jako dwie tury, sprawdź każdą warstwę:

<AccordionGroup>
  <Accordion title="Konfiguracja faktycznie załadowana">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Następnie `openclaw gateway restart` — flaga jest odczytywana podczas tworzenia rejestru debouncerów.

  </Accordion>
  <Accordion title="Okno debounce wystarczająco szerokie dla Twojej konfiguracji">
    Sprawdź dziennik serwera BlueBubbles w `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Zmierz odstęp między wysłaniem tekstu w stylu `"Dump"` a następującym po nim wysłaniem `"https://..."; Attachments:`. Zwiększ `messages.inbound.byChannel.bluebubbles`, aby z zapasem pokryć ten odstęp.

  </Accordion>
  <Accordion title="Znaczniki czasu JSONL sesji ≠ nadejście Webhook">
    Znaczniki czasu zdarzeń sesji (`~/.openclaw/agents/<id>/sessions/*.jsonl`) odzwierciedlają moment, gdy Gateway przekazuje wiadomość agentowi, **nie** moment nadejścia Webhook. Druga wiadomość w kolejce oznaczona `[Queued messages while agent was busy]` znaczy, że pierwsza tura nadal trwała, gdy nadszedł drugi Webhook — wiadro scalania zostało już opróżnione. Dostrajaj okno względem dziennika serwera BB, nie dziennika sesji.
  </Accordion>
  <Accordion title="Presja pamięci spowalnia wysyłanie odpowiedzi">
    Na mniejszych maszynach (8 GB) tury agenta mogą trwać na tyle długo, że wiadro scalania opróżni się przed zakończeniem odpowiedzi, a URL trafi jako druga tura w kolejce. Sprawdź `memory_pressure` i `ps -o rss -p $(pgrep openclaw-gateway)`; jeśli Gateway ma ponad ~500 MB RSS i kompresor jest aktywny, zamknij inne ciężkie procesy lub przejdź na większy host.
  </Accordion>
  <Accordion title="Wysyłki z cytowaną odpowiedzią używają innej ścieżki">
    Jeśli użytkownik stuknął `Dump` jako **odpowiedź** na istniejący dymek URL (iMessage pokazuje plakietkę „1 Reply” na dymku Dump), URL znajduje się w `replyToBody`, a nie w drugim Webhook. Scalanie nie ma zastosowania — to kwestia umiejętności/promptu, nie debouncera.
  </Accordion>
</AccordionGroup>

## Strumieniowanie bloków

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

- Przychodzące załączniki są pobierane i przechowywane w pamięci podręcznej multimediów.
- Limit multimediów przez `channels.bluebubbles.mediaMaxMb` dla multimediów przychodzących i wychodzących (domyślnie: 8 MB).
- Tekst wychodzący jest dzielony na fragmenty zgodnie z `channels.bluebubbles.textChunkLimit` (domyślnie: 4000 znaków).

## Odniesienie konfiguracji

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

<AccordionGroup>
  <Accordion title="Połączenie i Webhook">
    - `channels.bluebubbles.enabled`: Włącz/wyłącz kanał.
    - `channels.bluebubbles.serverUrl`: Bazowy URL API REST BlueBubbles.
    - `channels.bluebubbles.password`: Hasło API.
    - `channels.bluebubbles.webhookPath`: Ścieżka punktu końcowego Webhook (domyślnie: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Polityka dostępu">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).
    - `channels.bluebubbles.allowFrom`: Lista dozwolonych nadawców DM (uchwyty, e-maile, numery E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (domyślnie: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Lista dozwolonych nadawców grupowych.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: W macOS opcjonalnie wzbogacaj nienazwanych uczestników grupy z lokalnych Kontaktów po przejściu bramkowania. Domyślnie: `false`.
    - `channels.bluebubbles.groups`: Konfiguracja per grupa (`requireMention` itd.).

  </Accordion>
  <Accordion title="Dostarczanie i dzielenie na fragmenty">
    - `channels.bluebubbles.sendReadReceipts`: Wysyłaj potwierdzenia odczytu (domyślnie: `true`).
    - `channels.bluebubbles.blockStreaming`: Włącz strumieniowanie blokowe (domyślnie: `false`; wymagane do odpowiedzi strumieniowanych).
    - `channels.bluebubbles.textChunkLimit`: Rozmiar fragmentu wychodzącego w znakach (domyślnie: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Limit czasu na żądanie w ms dla wychodzących wysyłek tekstu przez `/api/v1/message/text` (domyślnie: 30000). Zwiększ w konfiguracjach macOS 26, gdzie wysyłanie iMessage przez Private API może utknąć na ponad 60 sekund wewnątrz frameworka iMessage; na przykład `45000` lub `60000`. Sondy, wyszukiwania czatów, reakcje, edycje i kontrole kondycji obecnie zachowują krótszą domyślną wartość 10 s; rozszerzenie obsługi na reakcje i edycje jest planowane jako kolejny krok. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (domyślnie) dzieli tylko po przekroczeniu `textChunkLimit`; `newline` dzieli po pustych wierszach (granicach akapitów) przed dzieleniem według długości.

  </Accordion>
  <Accordion title="Media i historia">
    - `channels.bluebubbles.mediaMaxMb`: Limit mediów przychodzących/wychodzących w MB (domyślnie: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Jawna lista dozwolonych bezwzględnych katalogów lokalnych dopuszczonych dla wychodzących lokalnych ścieżek mediów. Wysyłki z lokalnych ścieżek są domyślnie odrzucane, chyba że ta opcja jest skonfigurowana. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Scalaj kolejne webhooki DM od tego samego nadawcy w jedną turę agenta, aby wysyłka Apple dzieląca tekst i URL dotarła jako jedna wiadomość (domyślnie: `false`). Zobacz [Scalanie DM dzielonych przy wysyłaniu](#coalescing-split-send-dms-command--url-in-one-composition), aby poznać scenariusze, strojenie okna i kompromisy. Po włączeniu bez jawnego `messages.inbound.byChannel.bluebubbles` poszerza domyślne okno debounce dla wiadomości przychodzących z 500 ms do 2500 ms.
    - `channels.bluebubbles.historyLimit`: Maksymalna liczba wiadomości grupowych dla kontekstu (0 wyłącza).
    - `channels.bluebubbles.dmHistoryLimit`: Limit historii DM.
    - `channels.bluebubbles.replyContextApiFallback`: Gdy odpowiedź przychodząca dociera bez `replyToBody`/`replyToSender`, a podręczna pamięć kontekstu odpowiedzi w pamięci nie trafi, pobierz oryginalną wiadomość z BlueBubbles HTTP API jako najlepszą dostępną rezerwę (domyślnie: `false`). Przydatne we wdrożeniach z wieloma instancjami współdzielącymi jedno konto BlueBubbles, po restartach procesu albo po eksmisji z długo żyjącej pamięci podręcznej TTL/LRU. Pobieranie jest chronione przed SSRF tą samą polityką co każde inne żądanie klienta BlueBubbles, nigdy nie zgłasza wyjątku i uzupełnia pamięć podręczną, dzięki czemu kolejne odpowiedzi amortyzują koszt. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Ustawienie na poziomie kanału propaguje się na konta, które pomijają tę flagę.

  </Accordion>
  <Accordion title="Akcje i konta">
    - `channels.bluebubbles.actions`: Włącz/wyłącz konkretne akcje.
    - `channels.bluebubbles.accounts`: Konfiguracja wielu kont.

  </Accordion>
</AccordionGroup>

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (lub `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adresowanie / cele dostarczania

Preferuj `chat_guid` do stabilnego routingu:

- `chat_guid:iMessage;-;+15555550123` (preferowane dla grup)
- `chat_id:123`
- `chat_identifier:...`
- Bezpośrednie uchwyty: `+15555550123`, `user@example.com`
  - Jeśli bezpośredni uchwyt nie ma istniejącego czatu DM, OpenClaw utworzy go przez `POST /api/v1/chat/new`. Wymaga to włączenia BlueBubbles Private API.

### Routing iMessage vs SMS

Gdy ten sam uchwyt ma na Macu zarówno czat iMessage, jak i SMS (na przykład numer telefonu zarejestrowany w iMessage, który otrzymywał też awaryjne wiadomości z zielonym dymkiem), OpenClaw preferuje czat iMessage i nigdy po cichu nie obniża do SMS. Aby wymusić czat SMS, użyj jawnego prefiksu celu `sms:` (na przykład `sms:+15555550123`). Uchwyty bez pasującego czatu iMessage nadal wysyłają przez dowolny czat zgłaszany przez BlueBubbles.

## Bezpieczeństwo

- Żądania Webhook są uwierzytelniane przez porównanie parametrów zapytania lub nagłówków `guid`/`password` z `channels.bluebubbles.password`.
- Utrzymuj hasło API i punkt końcowy Webhook w tajemnicy (traktuj je jak dane uwierzytelniające).
- Nie ma obejścia localhost dla uwierzytelniania Webhook BlueBubbles. Jeśli proksyujesz ruch Webhook, zachowaj hasło BlueBubbles w żądaniu od początku do końca. `gateway.trustedProxies` nie zastępuje tutaj `channels.bluebubbles.password`. Zobacz [bezpieczeństwo Gateway](/pl/gateway/security#reverse-proxy-configuration).
- Włącz reguły HTTPS i zapory na serwerze BlueBubbles, jeśli wystawiasz go poza swoją sieć LAN.

## Rozwiązywanie problemów

- Jeśli zdarzenia pisania/odczytu przestają działać, sprawdź logi Webhook BlueBubbles i zweryfikuj, czy ścieżka gateway pasuje do `channels.bluebubbles.webhookPath`.
- Kody parowania wygasają po jednej godzinie; użyj `openclaw pairing list bluebubbles` i `openclaw pairing approve bluebubbles <code>`.
- Reakcje wymagają prywatnego API BlueBubbles (`POST /api/v1/message/react`); upewnij się, że wersja serwera je udostępnia.
- Edycja/cofanie wysyłki wymaga macOS 13+ i zgodnej wersji serwera BlueBubbles. W macOS 26 (Tahoe) edycja jest obecnie uszkodzona z powodu zmian w prywatnym API.
- Aktualizacje ikony grupy mogą być zawodne w macOS 26 (Tahoe): API może zwrócić sukces, ale nowa ikona się nie zsynchronizuje.
- OpenClaw automatycznie ukrywa znane uszkodzone akcje na podstawie wersji macOS serwera BlueBubbles. Jeśli edycja nadal pojawia się w macOS 26 (Tahoe), wyłącz ją ręcznie za pomocą `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` jest włączone, ale wysyłki dzielone (np. `Dump` + URL) nadal docierają jako dwie tury: zobacz listę kontrolną [rozwiązywania problemów ze scalaniem wysyłek dzielonych](#split-send-coalescing-troubleshooting) — częste przyczyny to zbyt wąskie okno debounce, znaczniki czasu w logu sesji błędnie odczytane jako moment nadejścia Webhook albo wysyłka cytatu odpowiedzi (która używa `replyToBody`, a nie drugiego Webhook).
- Informacje o stanie/kondycji: `openclaw status --all` lub `openclaw status --deep`.

Ogólne informacje o przepływie pracy kanałów znajdziesz w przewodniku [Kanały](/pl/channels) oraz [Plugins](/pl/tools/plugin).

## Powiązane

- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
