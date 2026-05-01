---
read_when:
    - Konfigurowanie kanału BlueBubbles
    - Rozwiązywanie problemów z parowaniem Webhook
    - Konfigurowanie iMessage na macOS
sidebarTitle: BlueBubbles
summary: iMessage za pośrednictwem serwera macOS BlueBubbles (wysyłanie/odbieranie przez REST, wskaźniki pisania, reakcje, parowanie, zaawansowane działania).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T09:56:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: dołączony Plugin komunikujący się z serwerem BlueBubbles macOS przez HTTP. **Zalecany do integracji z iMessage** ze względu na bogatsze API i łatwiejszą konfigurację w porównaniu ze starszym kanałem imsg.

<Note>
Bieżące wydania OpenClaw zawierają BlueBubbles, więc normalne spakowane kompilacje nie wymagają osobnego kroku `openclaw plugins install`.
</Note>

## Omówienie

- Działa na macOS za pośrednictwem aplikacji pomocniczej BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Zalecane/testowane: macOS Sequoia (15). macOS Tahoe (26) działa; edycja jest obecnie uszkodzona w Tahoe, a aktualizacje ikon grup mogą zgłaszać powodzenie, ale się nie synchronizować.
- OpenClaw komunikuje się z nim przez REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Wiadomości przychodzące docierają przez webhooks; odpowiedzi wychodzące, wskaźniki pisania, potwierdzenia odczytu i tapbacki są wywołaniami REST.
- Załączniki i naklejki są pobierane jako przychodzące multimedia (i udostępniane agentowi, gdy to możliwe).
- Automatyczne odpowiedzi TTS, które syntetyzują dźwięk MP3 lub CAF, są dostarczane jako dymki notatek głosowych iMessage zamiast zwykłych załączników plików.
- Parowanie/lista dozwolonych działa tak samo jak w innych kanałach (`/channels/pairing` itp.) z `channels.bluebubbles.allowFrom` + kodami parowania.
- Reakcje są udostępniane jako zdarzenia systemowe tak jak w Slack/Telegram, więc agenci mogą je „wzmiankować” przed odpowiedzią.
- Funkcje zaawansowane: edycja, cofanie wysłania, wątki odpowiedzi, efekty wiadomości, zarządzanie grupami.

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
  <Step title="Skieruj webhooks do gateway">
    Skieruj webhooks BlueBubbles do swojego gateway (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Uruchom gateway">
    Uruchom gateway; zarejestruje obsługę webhook i rozpocznie parowanie.
  </Step>
</Steps>

<Warning>
**Bezpieczeństwo**

- Zawsze ustaw hasło webhook.
- Uwierzytelnianie webhook jest zawsze wymagane. OpenClaw odrzuca żądania webhook BlueBubbles, chyba że zawierają hasło/guid pasujące do `channels.bluebubbles.password` (na przykład `?password=<password>` lub `x-password`), niezależnie od topologii loopback/proxy.
- Uwierzytelnianie hasłem jest sprawdzane przed odczytaniem/przeanalizowaniem pełnych treści webhook.

</Warning>

## Utrzymywanie Messages.app przy życiu (VM / konfiguracje headless)

Niektóre konfiguracje macOS VM / zawsze włączone mogą doprowadzić do przejścia Messages.app w stan „bezczynności” (zdarzenia przychodzące zatrzymują się, dopóki aplikacja nie zostanie otwarta/przeniesiona na pierwszy plan). Prostym obejściem jest **pobudzanie Messages co 5 minut** za pomocą AppleScript + LaunchAgent.

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

    To uruchamia się **co 300 sekund** i **przy logowaniu**. Pierwsze uruchomienie może wywołać monity macOS **Automatyzacja** (`osascript` → Messages). Zatwierdź je w tej samej sesji użytkownika, która uruchamia LaunchAgent.

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
<ParamField path="Ścieżka webhook" type="string" default="/bluebubbles-webhook">
  Ścieżka punktu końcowego webhook.
</ParamField>
<ParamField path="Zasada DM" type="string">
  `pairing`, `allowlist`, `open` lub `disabled`.
</ParamField>
<ParamField path="Lista dozwolonych" type="string[]">
  Numery telefonów, adresy e-mail lub cele czatów.
</ParamField>

Możesz też dodać BlueBubbles przez CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kontrola dostępu (DM + grupy)

<Tabs>
  <Tab title="DM">
    - Domyślnie: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
    - Zatwierdź przez:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Parowanie jest domyślną wymianą tokenów. Szczegóły: [Parowanie](/pl/channels/pairing)

  </Tab>
  <Tab title="Grupy">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (domyślnie: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` kontroluje, kto może wyzwalać w grupach, gdy ustawione jest `allowlist`.

  </Tab>
</Tabs>

### Wzbogacanie nazw kontaktów (macOS, opcjonalnie)

Webhooks grup BlueBubbles często zawierają tylko surowe adresy uczestników. Jeśli chcesz, aby kontekst `GroupMembers` pokazywał zamiast tego lokalne nazwy kontaktów, możesz włączyć lokalne wzbogacanie z Kontaktów na macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` włącza wyszukiwanie. Domyślnie: `false`.
- Wyszukiwania uruchamiają się dopiero po tym, jak dostęp grupowy, autoryzacja poleceń i bramka wzmianki przepuszczą wiadomość.
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

### Bramka wzmianki (grupy)

BlueBubbles obsługuje bramkę wzmianki dla czatów grupowych, zgodnie z zachowaniem iMessage/WhatsApp:

- Używa `agents.list[].groupChat.mentionPatterns` (lub `messages.groupChat.mentionPatterns`) do wykrywania wzmianek.
- Gdy `requireMention` jest włączone dla grupy, agent odpowiada tylko po wzmiance.
- Polecenia sterujące od autoryzowanych nadawców omijają bramkę wzmianki.

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

### Bramka poleceń

- Polecenia sterujące (np. `/config`, `/model`) wymagają autoryzacji.
- Używa `allowFrom` i `groupAllowFrom` do określenia autoryzacji poleceń.
- Autoryzowani nadawcy mogą uruchamiać polecenia sterujące nawet bez wzmiankowania w grupach.

### Systemowy prompt dla grupy

Każdy wpis w `channels.bluebubbles.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do systemowego promptu agenta w każdej turze obsługującej wiadomość w tej grupie, dzięki czemu możesz ustawić osobowość lub reguły zachowania dla grupy bez edytowania promptów agenta:

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

Klucz odpowiada temu, co BlueBubbles zgłasza jako `chatGuid` / `chatIdentifier` / numeryczne `chatId` dla grupy, a wpis wieloznaczny `"*"` zapewnia domyślne ustawienie dla każdej grupy bez dokładnego dopasowania (ten sam wzorzec używany przez `requireMention` i zasady narzędzi dla grup). Dokładne dopasowania zawsze wygrywają z wieloznacznikiem. DM ignorują to pole; zamiast tego użyj dostosowania promptu na poziomie agenta lub konta.

#### Przykład praktyczny: odpowiedzi w wątkach i reakcje tapback (Private API)

Po włączeniu BlueBubbles Private API wiadomości przychodzące docierają z krótkimi identyfikatorami wiadomości (na przykład `[[reply_to:5]]`), a agent może wywołać `action=reply`, aby odpowiedzieć w wątku na konkretną wiadomość, albo `action=react`, aby dodać tapback. `systemPrompt` dla grupy to niezawodny sposób, aby agent wybierał właściwe narzędzie:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reakcje tapback i odpowiedzi w wątkach wymagają BlueBubbles Private API; zobacz [Akcje zaawansowane](#advanced-actions) i [Identyfikatory wiadomości](#message-ids-short-vs-full), aby poznać podstawową mechanikę.

## Powiązania konwersacji ACP

Czaty BlueBubbles można przekształcać w trwałe obszary robocze ACP bez zmiany warstwy transportowej.

Szybki przepływ operatora:

- Uruchom `/acp spawn codex --bind here` w DM lub dozwolonym czacie grupowym.
- Przyszłe wiadomości w tej samej konwersacji BlueBubbles będą kierowane do utworzonej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są też obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "bluebubbles"`.

`match.peer.id` może używać dowolnej obsługiwanej formy celu BlueBubbles:

- znormalizowany uchwyt DM, taki jak `+15555550123` lub `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Dla stabilnych powiązań grup preferuj `chat_id:*` lub `chat_identifier:*`.

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

- **Wskaźniki pisania**: Wysyłane automatycznie przed generowaniem odpowiedzi i w jego trakcie.
- **Potwierdzenia odczytu**: Kontrolowane przez `channels.bluebubbles.sendReadReceipts` (domyślnie: `true`).
- **Wskaźniki pisania**: OpenClaw wysyła zdarzenia rozpoczęcia pisania; BlueBubbles automatycznie czyści stan pisania po wysłaniu lub przekroczeniu limitu czasu (ręczne zatrzymanie przez DELETE jest zawodne).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
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
  <Accordion title="Dostępne działania">
    - **react**: Dodaj/usuń reakcje tapback (`messageId`, `emoji`, `remove`). Natywny zestaw tapback iMessage to `love`, `like`, `dislike`, `laugh`, `emphasize` i `question`. Gdy agent wybierze emoji spoza tego zestawu (na przykład `👀`), narzędzie reakcji używa awaryjnie `love`, aby tapback nadal się wyrenderował zamiast powodować niepowodzenie całego żądania. Skonfigurowane reakcje potwierdzenia nadal są walidowane ściśle i zwracają błąd dla nieznanych wartości.
    - **edit**: Edytuj wysłaną wiadomość (`messageId`, `text`).
    - **unsend**: Cofnij wysłanie wiadomości (`messageId`).
    - **reply**: Odpowiedz na konkretną wiadomość (`messageId`, `text`, `to`).
    - **sendWithEffect**: Wyślij z efektem iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Zmień nazwę czatu grupowego (`chatGuid`, `displayName`).
    - **setGroupIcon**: Ustaw ikonę/zdjęcie czatu grupowego (`chatGuid`, `media`) — zawodne na macOS 26 Tahoe (API może zwrócić sukces, ale ikona się nie zsynchronizuje).
    - **addParticipant**: Dodaj kogoś do grupy (`chatGuid`, `address`).
    - **removeParticipant**: Usuń kogoś z grupy (`chatGuid`, `address`).
    - **leaveGroup**: Opuść czat grupowy (`chatGuid`).
    - **upload-file**: Wyślij multimedia/pliki (`to`, `buffer`, `filename`, `asVoice`).
      - Notatki głosowe: ustaw `asVoice: true` z dźwiękiem **MP3** lub **CAF**, aby wysłać jako wiadomość głosową iMessage. BlueBubbles konwertuje MP3 → CAF podczas wysyłania notatek głosowych.
    - Starszy alias: `sendAttachment` nadal działa, ale kanoniczną nazwą działania jest `upload-file`.

  </Accordion>
</AccordionGroup>

### Identyfikatory wiadomości (krótkie i pełne)

OpenClaw może udostępniać _krótkie_ identyfikatory wiadomości (np. `1`, `2`), aby oszczędzać tokeny.

- `MessageSid` / `ReplyToId` mogą być krótkimi identyfikatorami.
- `MessageSidFull` / `ReplyToIdFull` zawierają pełne identyfikatory dostawcy.
- Krótkie identyfikatory są przechowywane w pamięci; mogą wygasnąć po restarcie lub usunięciu z pamięci podręcznej.
- Działania akceptują krótki albo pełny `messageId`, ale krótkie identyfikatory zwrócą błąd, jeśli nie będą już dostępne.

Używaj pełnych identyfikatorów w trwałych automatyzacjach i magazynach danych:

- Szablony: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontekst: `MessageSidFull` / `ReplyToIdFull` w przychodzących ładunkach

Zobacz [Konfiguracja](/pl/gateway/configuration), aby poznać zmienne szablonów.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Scalanie rozdzielonych wiadomości DM (polecenie + URL w jednej kompozycji)

Gdy użytkownik wpisze razem polecenie i URL w iMessage — np. `Dump https://example.com/article` — Apple rozdziela wysyłkę na **dwa osobne dostarczenia Webhook**:

1. Wiadomość tekstową (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

W większości konfiguracji oba Webhooki docierają do OpenClaw w odstępie około 0,8-2,0 s. Bez scalania agent otrzymuje samo polecenie w turze 1, odpowiada (często „wyślij mi URL”) i widzi URL dopiero w turze 2 — wtedy kontekst polecenia jest już utracony.

`channels.bluebubbles.coalesceSameSenderDms` włącza dla DM scalanie kolejnych Webhooków od tego samego nadawcy w jedną turę agenta. Czaty grupowe nadal są kluczowane według wiadomości, więc struktura tur wielu użytkowników zostaje zachowana.

<Tabs>
  <Tab title="Kiedy włączyć">
    Włącz, gdy:

    - Dostarczasz Skills, które oczekują `command + payload` w jednej wiadomości (dump, paste, save, queue itd.).
    - Twoi użytkownicy wklejają URL-e, obrazy lub długą treść obok poleceń.
    - Możesz zaakceptować dodatkowe opóźnienie tury DM (zobacz niżej).

    Pozostaw wyłączone, gdy:

    - Potrzebujesz minimalnego opóźnienia poleceń dla jednowyrazowych wyzwalaczy DM.
    - Wszystkie Twoje przepływy to jednorazowe polecenia bez następujących po nich ładunków.

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

    Przy włączonej fladze i bez jawnego `messages.inbound.byChannel.bluebubbles` okno debounce rozszerza się do **2500 ms** (domyślna wartość bez scalania to 500 ms). Szersze okno jest wymagane — kadencja rozdzielonej wysyłki Apple wynosząca 0,8-2,0 s nie mieści się w ciaśniejszej wartości domyślnej.

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
    - **Dodatkowe opóźnienie dla poleceń sterujących DM.** Przy włączonej fladze wiadomości poleceń sterujących DM (takie jak `Dump`, `Save` itd.) czekają teraz do końca okna debounce przed wysłaniem, na wypadek gdyby nadchodził Webhook z ładunkiem. Polecenia z czatów grupowych zachowują natychmiastowe wysyłanie.
    - **Scalony wynik jest ograniczony** — scalony tekst ma limit 4000 znaków z jawnym znacznikiem `…[truncated]`; załączniki mają limit 20; wpisy źródłowe mają limit 10 (powyżej tego progu zachowywane są pierwszy i najnowszy). Każde źródłowe `messageId` nadal trafia do deduplikacji przychodzących, więc późniejsze odtworzenie dowolnego pojedynczego zdarzenia przez MessagePoller zostanie rozpoznane jako duplikat.
    - **Włączane opcjonalnie, per kanał.** Inne kanały (Telegram, WhatsApp, Slack, …) pozostają bez zmian.

  </Tab>
</Tabs>

### Scenariusze i to, co widzi agent

| Użytkownik komponuje                                                | Apple dostarcza                         | Flaga wyłączona (domyślnie)                    | Flaga włączona + okno 2500 ms                                           |
| ------------------------------------------------------------------ | --------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (jedna wysyłka)                         | 2 Webhooki w odstępie około 1 s         | Dwie tury agenta: samo „Dump”, potem URL        | Jedna tura: scalony tekst `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (załącznik + tekst)                | 2 Webhooki                              | Dwie tury                                      | Jedna tura: tekst + obraz                                               |
| `/status` (samodzielne polecenie)                                  | 1 Webhook                               | Natychmiastowe wysłanie                        | **Czekaj do końca okna, potem wyślij**                                  |
| URL wklejony samodzielnie                                          | 1 Webhook                               | Natychmiastowe wysłanie                        | Natychmiastowe wysłanie (tylko jeden wpis w kubełku)                    |
| Tekst + URL wysłane jako dwie celowo osobne wiadomości, w odstępie minut | 2 Webhooki poza oknem                   | Dwie tury                                      | Dwie tury (okno wygasa między nimi)                                     |
| Szybki zalew (>10 małych DM w oknie)                               | N Webhooków                             | N tur                                          | Jedna tura, ograniczony wynik (pierwsze + najnowsze, zastosowane limity tekstu/załączników) |

### Rozwiązywanie problemów ze scalaniem rozdzielonej wysyłki

Jeśli flaga jest włączona, a rozdzielone wysyłki nadal docierają jako dwie tury, sprawdź każdą warstwę:

<AccordionGroup>
  <Accordion title="Konfiguracja rzeczywiście załadowana">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Następnie `openclaw gateway restart` — flaga jest odczytywana przy tworzeniu rejestru debouncerów.

  </Accordion>
  <Accordion title="Okno debounce wystarczająco szerokie dla Twojej konfiguracji">
    Sprawdź dziennik serwera BlueBubbles pod `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Zmierz odstęp między wysłaniem tekstu w stylu `"Dump"` a następującym po nim wysłaniem `"https://..."; Attachments:`. Podnieś `messages.inbound.byChannel.bluebubbles`, aby z zapasem obejmował ten odstęp.

  </Accordion>
  <Accordion title="Znaczniki czasu JSONL sesji ≠ nadejście Webhooka">
    Znaczniki czasu zdarzeń sesji (`~/.openclaw/agents/<id>/sessions/*.jsonl`) odzwierciedlają moment, w którym Gateway przekazuje wiadomość agentowi, **a nie** moment nadejścia Webhooka. Druga wiadomość w kolejce oznaczona `[Queued messages while agent was busy]` znaczy, że pierwsza tura nadal działała, gdy nadszedł drugi Webhook — kubełek scalania został już opróżniony. Dostrajaj okno względem dziennika serwera BB, a nie dziennika sesji.
  </Accordion>
  <Accordion title="Presja pamięci spowalnia wysyłanie odpowiedzi">
    Na mniejszych maszynach (8 GB) tury agenta mogą trwać na tyle długo, że kubełek scalania zostanie opróżniony przed zakończeniem odpowiedzi, a URL trafi jako druga tura w kolejce. Sprawdź `memory_pressure` i `ps -o rss -p $(pgrep openclaw-gateway)`; jeśli Gateway przekracza około 500 MB RSS, a kompresor jest aktywny, zamknij inne ciężkie procesy albo przejdź na większy host.
  </Accordion>
  <Accordion title="Wysyłki z cytowaną odpowiedzią to inna ścieżka">
    Jeśli użytkownik stuknął `Dump` jako **odpowiedź** na istniejący dymek URL (iMessage pokazuje znaczek „1 odpowiedź” na dymku Dump), URL znajduje się w `replyToBody`, a nie w drugim Webhooku. Scalanie nie ma tu zastosowania — to kwestia Skills/promptu, a nie debouncera.
  </Accordion>
</AccordionGroup>

## Strumieniowanie blokowe

Kontroluj, czy odpowiedzi są wysyłane jako pojedyncza wiadomość, czy strumieniowane w blokach:

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
- Tekst wychodzący jest dzielony na fragmenty do `channels.bluebubbles.textChunkLimit` (domyślnie: 4000 znaków).

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

<AccordionGroup>
  <Accordion title="Połączenie i Webhook">
    - `channels.bluebubbles.enabled`: Włącz/wyłącz kanał.
    - `channels.bluebubbles.serverUrl`: Bazowy URL API REST BlueBubbles.
    - `channels.bluebubbles.password`: Hasło API.
    - `channels.bluebubbles.webhookPath`: Ścieżka punktu końcowego Webhooka (domyślnie: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Zasady dostępu">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).
    - `channels.bluebubbles.allowFrom`: Lista dozwolonych DM (uchwyty, adresy e-mail, numery E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (domyślnie: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Lista dozwolonych nadawców grupowych.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Na macOS opcjonalnie wzbogacaj nienazwanych uczestników grup z lokalnych Kontaktów po przejściu bramek. Domyślnie: `false`.
    - `channels.bluebubbles.groups`: Konfiguracja per grupa (`requireMention` itd.).

  </Accordion>
  <Accordion title="Dostarczanie i dzielenie na fragmenty">
    - `channels.bluebubbles.sendReadReceipts`: Wysyłaj potwierdzenia odczytu (domyślnie: `true`).
    - `channels.bluebubbles.blockStreaming`: Włącz strumieniowanie blokowe (domyślnie: `false`; wymagane dla odpowiedzi strumieniowych).
    - `channels.bluebubbles.textChunkLimit`: Rozmiar fragmentu wychodzącego w znakach (domyślnie: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Limit czasu na żądanie w ms dla wysyłek tekstu wychodzącego przez `/api/v1/message/text` (domyślnie: 30000). Zwiększ w konfiguracjach macOS 26, w których wysyłki Private API iMessage mogą zatrzymywać się na ponad 60 sekund wewnątrz frameworka iMessage; na przykład `45000` albo `60000`. Sondy, wyszukiwania czatów, reakcje, edycje i kontrole kondycji obecnie zachowują krótszą wartość domyślną 10 s; rozszerzenie zakresu na reakcje i edycje jest planowane jako kolejny krok. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (domyślnie) dzieli tylko po przekroczeniu `textChunkLimit`; `newline` dzieli po pustych wierszach (granicach akapitów) przed dzieleniem według długości.

  </Accordion>
  <Accordion title="Media i historia">
    - `channels.bluebubbles.mediaMaxMb`: Limit mediów przychodzących/wychodzących w MB (domyślnie: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Jawna lista dozwolonych bezwzględnych katalogów lokalnych dopuszczonych dla wychodzących lokalnych ścieżek mediów. Wysyłki ścieżek lokalnych są domyślnie odrzucane, chyba że ta opcja jest skonfigurowana. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Scal kolejne Webhooki DM od tego samego nadawcy w jedną turę agenta, aby podzielona wysyłka tekst+URL Apple dotarła jako jedna wiadomość (domyślnie: `false`). Zobacz [Scalanie podzielonych wysyłek DM](#coalescing-split-send-dms-command--url-in-one-composition), aby poznać scenariusze, strojenie okna i kompromisy. Po włączeniu bez jawnego `messages.inbound.byChannel.bluebubbles` rozszerza domyślne okno opóźnienia przychodzącego z 500 ms do 2500 ms.
    - `channels.bluebubbles.historyLimit`: Maksymalna liczba wiadomości grupowych dla kontekstu (0 wyłącza).
    - `channels.bluebubbles.dmHistoryLimit`: Limit historii DM.
    - `channels.bluebubbles.replyContextApiFallback`: Gdy odpowiedź przychodząca dociera bez `replyToBody`/`replyToSender`, a pamięciowa pamięć podręczna kontekstu odpowiedzi nie trafia, pobierz oryginalną wiadomość z BlueBubbles HTTP API jako awaryjne rozwiązanie typu best effort (domyślnie: `false`). Przydatne dla wdrożeń z wieloma instancjami współdzielącymi jedno konto BlueBubbles, po restartach procesu albo po eksmisji z długotrwałej pamięci podręcznej TTL/LRU. Pobieranie jest chronione przed SSRF tą samą polityką co każde inne żądanie klienta BlueBubbles, nigdy nie zgłasza wyjątku i wypełnia pamięć podręczną, aby kolejne odpowiedzi amortyzowały koszt. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Ustawienie na poziomie kanału propaguje się do kont, które pomijają tę flagę.

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

Preferuj `chat_guid` dla stabilnego routingu:

- `chat_guid:iMessage;-;+15555550123` (preferowane dla grup)
- `chat_id:123`
- `chat_identifier:...`
- Bezpośrednie uchwyty: `+15555550123`, `user@example.com`
  - Jeśli bezpośredni uchwyt nie ma istniejącego czatu DM, OpenClaw utworzy go przez `POST /api/v1/chat/new`. Wymaga to włączenia BlueBubbles Private API.

### Routing iMessage a SMS

Gdy ten sam uchwyt ma na Macu zarówno czat iMessage, jak i SMS (na przykład numer telefonu zarejestrowany w iMessage, który otrzymał też awaryjne wiadomości zielonego dymku), OpenClaw preferuje czat iMessage i nigdy po cichu nie obniża routingu do SMS. Aby wymusić czat SMS, użyj jawnego prefiksu celu `sms:` (na przykład `sms:+15555550123`). Uchwyty bez pasującego czatu iMessage nadal wysyłają przez dowolny czat zgłoszony przez BlueBubbles.

## Bezpieczeństwo

- Żądania Webhook są uwierzytelniane przez porównanie parametrów zapytania lub nagłówków `guid`/`password` z `channels.bluebubbles.password`.
- Utrzymuj hasło API i endpoint Webhook w tajemnicy (traktuj je jak dane uwierzytelniające).
- Nie ma obejścia localhost dla uwierzytelniania Webhook BlueBubbles. Jeśli proxyujesz ruch Webhook, zachowaj hasło BlueBubbles w żądaniu od początku do końca. `gateway.trustedProxies` nie zastępuje tutaj `channels.bluebubbles.password`. Zobacz [bezpieczeństwo Gateway](/pl/gateway/security#reverse-proxy-configuration).
- Włącz HTTPS i reguły zapory na serwerze BlueBubbles, jeśli wystawiasz go poza swoją sieć LAN.

## Rozwiązywanie problemów

- Jeśli zdarzenia pisania/odczytu przestają działać, sprawdź logi Webhook BlueBubbles i zweryfikuj, czy ścieżka Gateway odpowiada `channels.bluebubbles.webhookPath`.
- Kody parowania wygasają po godzinie; użyj `openclaw pairing list bluebubbles` i `openclaw pairing approve bluebubbles <code>`.
- Reakcje wymagają prywatnego API BlueBubbles (`POST /api/v1/message/react`); upewnij się, że wersja serwera je udostępnia.
- Edycja/cofnięcie wysłania wymagają macOS 13+ i zgodnej wersji serwera BlueBubbles. Na macOS 26 (Tahoe) edycja jest obecnie zepsuta z powodu zmian w prywatnym API.
- Aktualizacje ikon grup mogą być niestabilne na macOS 26 (Tahoe): API może zwrócić sukces, ale nowa ikona się nie synchronizuje.
- OpenClaw automatycznie ukrywa znane zepsute akcje na podstawie wersji macOS serwera BlueBubbles. Jeśli edycja nadal pojawia się na macOS 26 (Tahoe), wyłącz ją ręcznie za pomocą `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` jest włączone, ale podzielone wysyłki (np. `Dump` + URL) nadal docierają jako dwie tury: zobacz listę kontrolną [rozwiązywania problemów ze scalaniem podzielonych wysyłek](#split-send-coalescing-troubleshooting) — częste przyczyny to zbyt krótkie okno opóźnienia, znaczniki czasu logu sesji błędnie odczytane jako przybycie Webhook albo wysyłka z cytatem odpowiedzi (która używa `replyToBody`, a nie drugiego Webhooka).
- Informacje o statusie/kondycji: `openclaw status --all` lub `openclaw status --deep`.

Ogólny opis przepływu pracy kanałów znajdziesz w [Kanałach](/pl/channels) i przewodniku [Plugins](/pl/tools/plugin).

## Powiązane

- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Omówienie kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
