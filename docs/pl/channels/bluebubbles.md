---
read_when:
    - Konfigurowanie kanału BlueBubbles
    - Rozwiązywanie problemów z parowaniem webhooków
    - Konfigurowanie iMessage na macOS
summary: iMessage przez serwer BlueBubbles na macOS (REST wysyłanie/odbieranie, pisanie, reakcje, parowanie, zaawansowane działania).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-05T13:43:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed8e59a165bdfb8fd794ee2ad6e4dacd44aa02d512312c5f2fd7d15f863380bb
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST na macOS)

Status: dołączony plugin, który komunikuje się z serwerem BlueBubbles na macOS przez HTTP. **Zalecany do integracji z iMessage** ze względu na bogatsze API i łatwiejszą konfigurację w porównaniu ze starszym kanałem imsg.

## Dołączony plugin

Bieżące wydania OpenClaw zawierają BlueBubbles, więc zwykłe spakowane kompilacje nie
wymagają osobnego kroku `openclaw plugins install`.

## Omówienie

- Działa na macOS przez aplikację pomocniczą BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Zalecane/testowane: macOS Sequoia (15). macOS Tahoe (26) działa; edycja jest obecnie uszkodzona w Tahoe, a aktualizacje ikon grup mogą zgłaszać sukces, ale nie synchronizować się.
- OpenClaw komunikuje się z nim przez jego REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Wiadomości przychodzące docierają przez webhooki; odpowiedzi wychodzące, wskaźniki pisania, potwierdzenia odczytu i tapbacki są wywołaniami REST.
- Załączniki i naklejki są pobierane jako media przychodzące (i przekazywane agentowi, gdy to możliwe).
- Parowanie/lista dozwolonych działa tak samo jak w innych kanałach (`/channels/pairing` itd.) z `channels.bluebubbles.allowFrom` + kodami parowania.
- Reakcje są przedstawiane jako zdarzenia systemowe tak samo jak w Slack/Telegram, dzięki czemu agenci mogą o nich „wspomnieć” przed odpowiedzią.
- Funkcje zaawansowane: edycja, cofanie wysłania, wątki odpowiedzi, efekty wiadomości, zarządzanie grupą.

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

4. Skieruj webhooki BlueBubbles do swojego gatewaya (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Uruchom gateway; zarejestruje obsługę webhooka i rozpocznie parowanie.

Uwaga dotycząca bezpieczeństwa:

- Zawsze ustawiaj hasło webhooka.
- Uwierzytelnianie webhooka jest zawsze wymagane. OpenClaw odrzuca żądania webhooka BlueBubbles, jeśli nie zawierają hasła/guid zgodnego z `channels.bluebubbles.password` (na przykład `?password=<password>` lub `x-password`), niezależnie od topologii local loopback/proxy.
- Uwierzytelnianie hasłem jest sprawdzane przed odczytem/przetwarzaniem pełnych treści webhooka.

## Utrzymywanie aktywności Messages.app (konfiguracje VM / bezgłowe)

W niektórych konfiguracjach macOS VM / always-on może się zdarzyć, że Messages.app przejdzie w stan „idle” (zdarzenia przychodzące zatrzymują się, dopóki aplikacja nie zostanie otwarta/przeniesiona na pierwszy plan). Prostym obejściem jest **szturchanie Messages co 5 minut** za pomocą AppleScript + LaunchAgent.

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
- Zatwierdź przez:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Parowanie jest domyślnym mechanizmem wymiany tokenów. Szczegóły: [Parowanie](/channels/pairing)

Grupy:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (domyślnie: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` określa, kto może uruchamiać w grupach, gdy ustawiono `allowlist`.

### Wzbogacanie nazw kontaktów (macOS, opcjonalne)

Webhooki grup BlueBubbles często zawierają tylko surowe adresy uczestników. Jeśli chcesz, aby kontekst `GroupMembers` pokazywał zamiast tego lokalne nazwy kontaktów, możesz opcjonalnie włączyć lokalne wzbogacanie z Kontaktów na macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` włącza wyszukiwanie. Domyślnie: `false`.
- Wyszukiwania są uruchamiane dopiero po tym, jak dostęp do grupy, autoryzacja poleceń i bramkowanie wzmianek przepuszczą wiadomość.
- Wzbogacani są tylko nienazwani uczestnicy z numerami telefonów.
- Surowe numery telefonów pozostają opcją zapasową, gdy nie zostanie znalezione lokalne dopasowanie.

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
- Gdy `requireMention` jest włączone dla grupy, agent odpowiada tylko wtedy, gdy zostanie wspomniany.
- Polecenia sterujące od autoryzowanych nadawców omijają bramkowanie wzmianek.

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

### Bramkowanie poleceń

- Polecenia sterujące (np. `/config`, `/model`) wymagają autoryzacji.
- Używa `allowFrom` i `groupAllowFrom` do określenia autoryzacji poleceń.
- Autoryzowani nadawcy mogą uruchamiać polecenia sterujące nawet bez wzmianki w grupach.

## Powiązania konwersacji ACP

Czaty BlueBubbles można przekształcić w trwałe obszary robocze ACP bez zmiany warstwy transportowej.

Szybki przepływ dla operatora:

- Uruchom `/acp spawn codex --bind here` w DM-ie lub dozwolonym czacie grupowym.
- Przyszłe wiadomości w tej samej konwersacji BlueBubbles będą kierowane do uruchomionej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są również obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "bluebubbles"`.

`match.peer.id` może używać dowolnej obsługiwanej formy celu BlueBubbles:

- znormalizowany identyfikator DM, taki jak `+15555550123` lub `user@example.com`
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

Zobacz [Agenci ACP](/tools/acp-agents), aby poznać wspólne zachowanie powiązań ACP.

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

## Zaawansowane działania

BlueBubbles obsługuje zaawansowane działania na wiadomościach, gdy są włączone w konfiguracji:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacki (domyślnie: true)
        edit: true, // edytuj wysłane wiadomości (macOS 13+, uszkodzone na macOS 26 Tahoe)
        unsend: true, // cofnij wysłanie wiadomości (macOS 13+)
        reply: true, // wątki odpowiedzi według GUID wiadomości
        sendWithEffect: true, // efekty wiadomości (slam, loud itd.)
        renameGroup: true, // zmień nazwę czatów grupowych
        setGroupIcon: true, // ustaw ikonę/zdjęcie czatu grupowego (niestabilne na macOS 26 Tahoe)
        addParticipant: true, // dodaj uczestników do grup
        removeParticipant: true, // usuń uczestników z grup
        leaveGroup: true, // opuść czaty grupowe
        sendAttachment: true, // wyślij załączniki/media
      },
    },
  },
}
```

Dostępne działania:

- **react**: dodaj/usuń reakcje tapback (`messageId`, `emoji`, `remove`)
- **edit**: edytuj wysłaną wiadomość (`messageId`, `text`)
- **unsend**: cofnij wysłanie wiadomości (`messageId`)
- **reply**: odpowiedz na konkretną wiadomość (`messageId`, `text`, `to`)
- **sendWithEffect**: wyślij z efektem iMessage (`text`, `to`, `effectId`)
- **renameGroup**: zmień nazwę czatu grupowego (`chatGuid`, `displayName`)
- **setGroupIcon**: ustaw ikonę/zdjęcie czatu grupowego (`chatGuid`, `media`) — niestabilne na macOS 26 Tahoe (API może zwrócić sukces, ale ikona się nie synchronizuje).
- **addParticipant**: dodaj kogoś do grupy (`chatGuid`, `address`)
- **removeParticipant**: usuń kogoś z grupy (`chatGuid`, `address`)
- **leaveGroup**: opuść czat grupowy (`chatGuid`)
- **upload-file**: wyślij media/pliki (`to`, `buffer`, `filename`, `asVoice`)
  - Notatki głosowe: ustaw `asVoice: true` z dźwiękiem **MP3** lub **CAF**, aby wysłać jako wiadomość głosową iMessage. BlueBubbles konwertuje MP3 → CAF podczas wysyłania notatek głosowych.
- Starszy alias: `sendAttachment` nadal działa, ale `upload-file` to kanoniczna nazwa działania.

### Identyfikatory wiadomości (krótkie vs pełne)

OpenClaw może udostępniać _krótkie_ identyfikatory wiadomości (np. `1`, `2`), aby oszczędzać tokeny.

- `MessageSid` / `ReplyToId` mogą być krótkimi identyfikatorami.
- `MessageSidFull` / `ReplyToIdFull` zawierają pełne identyfikatory dostawcy.
- Krótkie identyfikatory są przechowywane w pamięci; mogą wygasnąć po restarcie lub usunięciu z pamięci podręcznej.
- Działania akceptują krótki lub pełny `messageId`, ale krótkie identyfikatory spowodują błąd, jeśli nie są już dostępne.

Używaj pełnych identyfikatorów dla trwałych automatyzacji i przechowywania:

- Szablony: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontekst: `MessageSidFull` / `ReplyToIdFull` w ładunkach przychodzących

Zobacz [Konfiguracja](/gateway/configuration), aby poznać zmienne szablonów.

## Blokowe strumieniowanie

Kontroluj, czy odpowiedzi są wysyłane jako pojedyncza wiadomość, czy strumieniowane w blokach:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // włącz blokowe strumieniowanie (domyślnie wyłączone)
    },
  },
}
```

## Media + limity

- Załączniki przychodzące są pobierane i przechowywane w pamięci podręcznej mediów.
- Limit mediów przez `channels.bluebubbles.mediaMaxMb` dla mediów przychodzących i wychodzących (domyślnie: 8 MB).
- Tekst wychodzący jest dzielony na fragmenty według `channels.bluebubbles.textChunkLimit` (domyślnie: 4000 znaków).

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja](/gateway/configuration)

Opcje dostawcy:

- `channels.bluebubbles.enabled`: włącz/wyłącz kanał.
- `channels.bluebubbles.serverUrl`: podstawowy URL REST API BlueBubbles.
- `channels.bluebubbles.password`: hasło API.
- `channels.bluebubbles.webhookPath`: ścieżka punktu końcowego webhooka (domyślnie: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).
- `channels.bluebubbles.allowFrom`: lista dozwolonych dla DM-ów (identyfikatory, e-maile, numery E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (domyślnie: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: lista dozwolonych nadawców grupowych.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: na macOS opcjonalnie wzbogaca nienazwanych uczestników grupy z lokalnych Kontaktów po przejściu bramek. Domyślnie: `false`.
- `channels.bluebubbles.groups`: konfiguracja per grupa (`requireMention` itd.).
- `channels.bluebubbles.sendReadReceipts`: wysyłaj potwierdzenia odczytu (domyślnie: `true`).
- `channels.bluebubbles.blockStreaming`: włącz blokowe strumieniowanie (domyślnie: `false`; wymagane dla odpowiedzi strumieniowych).
- `channels.bluebubbles.textChunkLimit`: rozmiar fragmentu wychodzącego w znakach (domyślnie: 4000).
- `channels.bluebubbles.chunkMode`: `length` (domyślnie) dzieli tylko po przekroczeniu `textChunkLimit`; `newline` dzieli po pustych liniach (granice akapitów) przed dzieleniem według długości.
- `channels.bluebubbles.mediaMaxMb`: limit mediów przychodzących/wychodzących w MB (domyślnie: 8).
- `channels.bluebubbles.mediaLocalRoots`: jawna lista dozwolonych bezwzględnych katalogów lokalnych dla wychodzących lokalnych ścieżek mediów. Wysyłanie lokalnych ścieżek jest domyślnie odrzucane, chyba że to zostanie skonfigurowane. Nadpisanie per konto: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: maksymalna liczba wiadomości grupowych dla kontekstu (0 wyłącza).
- `channels.bluebubbles.dmHistoryLimit`: limit historii DM.
- `channels.bluebubbles.actions`: włącz/wyłącz konkretne działania.
- `channels.bluebubbles.accounts`: konfiguracja wielu kont.

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (lub `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adresowanie / cele dostarczania

Dla stabilnego routingu preferuj `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (preferowane dla grup)
- `chat_id:123`
- `chat_identifier:...`
- Bezpośrednie identyfikatory: `+15555550123`, `user@example.com`
  - Jeśli bezpośredni identyfikator nie ma istniejącego czatu DM, OpenClaw utworzy go przez `POST /api/v1/chat/new`. Wymaga to włączenia BlueBubbles Private API.

## Bezpieczeństwo

- Żądania webhooka są uwierzytelniane przez porównanie parametrów zapytania lub nagłówków `guid`/`password` z `channels.bluebubbles.password`.
- Zachowaj hasło API i punkt końcowy webhooka w tajemnicy (traktuj je jak poświadczenia).
- Nie ma obejścia localhost dla uwierzytelniania webhooka BlueBubbles. Jeśli przekazujesz ruch webhooka przez proxy, zachowaj hasło BlueBubbles w żądaniu od końca do końca. `gateway.trustedProxies` nie zastępuje tutaj `channels.bluebubbles.password`. Zobacz [Bezpieczeństwo gatewaya](/gateway/security#reverse-proxy-configuration).
- Włącz HTTPS + reguły zapory na serwerze BlueBubbles, jeśli udostępniasz go poza swoją siecią LAN.

## Rozwiązywanie problemów

- Jeśli zdarzenia pisania/odczytu przestaną działać, sprawdź logi webhooka BlueBubbles i zweryfikuj, czy ścieżka gatewaya odpowiada `channels.bluebubbles.webhookPath`.
- Kody parowania wygasają po godzinie; użyj `openclaw pairing list bluebubbles` i `openclaw pairing approve bluebubbles <code>`.
- Reakcje wymagają BlueBubbles private API (`POST /api/v1/message/react`); upewnij się, że wersja serwera je udostępnia.
- Edycja/cofanie wysłania wymagają macOS 13+ i zgodnej wersji serwera BlueBubbles. W macOS 26 (Tahoe) edycja jest obecnie uszkodzona z powodu zmian w private API.
- Aktualizacje ikon grup mogą być niestabilne na macOS 26 (Tahoe): API może zwrócić sukces, ale nowa ikona się nie synchronizuje.
- OpenClaw automatycznie ukrywa znane uszkodzone działania na podstawie wersji macOS serwera BlueBubbles. Jeśli edycja nadal pojawia się na macOS 26 (Tahoe), wyłącz ją ręcznie przez `channels.bluebubbles.actions.edit=false`.
- Informacje o stanie/zdrowiu: `openclaw status --all` lub `openclaw status --deep`.

Ogólne informacje o przepływie pracy kanałów znajdziesz w [Kanały](/channels) i przewodniku [Plugins](/tools/plugin).

## Powiązane

- [Przegląd kanałów](/channels) — wszystkie obsługiwane kanały
- [Parowanie](/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/gateway/security) — model dostępu i utwardzanie
