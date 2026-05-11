---
read_when:
    - Planowanie migracji z BlueBubbles do dołączonego Plugin iMessage
    - Tłumaczenie kluczy konfiguracji BlueBubbles na odpowiedniki iMessage
    - Weryfikowanie imsg przed włączeniem Plugin dla iMessage
summary: Przenieś stare konfiguracje BlueBubbles do dołączonego Pluginu iMessage bez utraty parowania, list dozwolonych ani powiązań grup.
title: Migracja z BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Dołączony Plugin `imessage` sięga teraz do tego samego zakresu prywatnego API co BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, zarządzanie grupami, załączniki), sterując [`steipete/imsg`](https://github.com/steipete/imsg) przez JSON-RPC. Jeśli masz już Maca z zainstalowanym `imsg`, możesz zrezygnować z serwera BlueBubbles i pozwolić Pluginowi komunikować się bezpośrednio z Messages.app.

Obsługa BlueBubbles została usunięta. OpenClaw obsługuje iMessage wyłącznie przez `imsg`. Ten przewodnik służy do migracji starych konfiguracji `channels.bluebubbles` do `channels.imessage`; nie ma innej obsługiwanej ścieżki migracji.

<Note>
Krótki komunikat i podsumowanie dla operatorów znajdziesz w [Usunięcie BlueBubbles i ścieżka iMessage przez imsg](/pl/announcements/bluebubbles-imessage).
</Note>

## Lista kontrolna migracji

Użyj tej listy kontrolnej, jeśli znasz już swoją starą konfigurację BlueBubbles i chcesz wybrać najkrótszą bezpieczną ścieżkę:

1. Zweryfikuj `imsg` bezpośrednio na Macu, na którym działa Messages.app (`imsg chats`, `imsg history`, `imsg send` i `imsg rpc --help`).
2. Skopiuj klucze zachowania z `channels.bluebubbles` do `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` i `actions`.
3. Usuń klucze transportu, które już nie istnieją: `serverUrl`, `password`, adresy URL Webhook oraz konfigurację serwera BlueBubbles.
4. Jeśli Gateway nie działa na Macu z Messages, ustaw `channels.imessage.cliPath` na opakowanie SSH i ustaw `remoteHost` dla zdalnego pobierania załączników.
5. Przy zatrzymanym Gateway włącz `channels.imessage`, a następnie uruchom `openclaw channels status --probe --channel imessage`.
6. Przetestuj jedną wiadomość DM, jedną dozwoloną grupę, załączniki, jeśli są włączone, oraz każdą akcję prywatnego API, której agent ma używać.
7. Usuń serwer BlueBubbles i starą konfigurację `channels.bluebubbles` po zweryfikowaniu ścieżki iMessage.

## Kiedy ta migracja ma sens

- Masz już uruchomione `imsg` na tym samym Macu (albo na dostępnym przez SSH), na którym Messages.app jest zalogowane.
- Chcesz mieć o jeden element mniej do utrzymania — bez oddzielnego serwera BlueBubbles, bez punktu końcowego REST do uwierzytelniania, bez instalacji Webhook. Pojedynczy plik binarny CLI zamiast serwera + aplikacji klienckiej + pomocnika.
- Korzystasz z [obsługiwanej wersji macOS / kompilacji `imsg`](/pl/channels/imessage#requirements-and-permissions-macos), w której sonda prywatnego API zgłasza `available: true`.

## Co robi imsg

`imsg` to lokalne CLI macOS dla Messages. OpenClaw uruchamia `imsg rpc` jako proces potomny i komunikuje się przez JSON-RPC na stdin/stdout. Nie ma serwera HTTP, adresu URL Webhook, demona w tle, agenta uruchamiania ani portu do wystawienia.

- Odczyty pochodzą z `~/Library/Messages/chat.db` przy użyciu uchwytu SQLite tylko do odczytu.
- Przychodzące wiadomości na żywo pochodzą z `imsg watch` / `watch.subscribe`, które śledzi zdarzenia systemu plików `chat.db` z awaryjnym odpytywaniem.
- Wysyłanie używa automatyzacji Messages.app dla zwykłego tekstu i wysyłania plików.
- Zaawansowane akcje używają `imsg launch`, aby wstrzyknąć pomocnika `imsg` do Messages.app. To odblokowuje potwierdzenia odczytu, wskaźniki pisania, bogate wysyłki, edycję, cofanie wysłania, odpowiedź w wątku, tapbacki i zarządzanie grupami.
- Kompilacje dla Linux mogą sprawdzać skopiowany `chat.db`, ale nie mogą wysyłać, obserwować aktywnej bazy danych Maca ani sterować Messages.app. Dla iMessage w OpenClaw uruchom `imsg` na zalogowanym Macu albo przez opakowanie SSH do tego Maca.

## Zanim zaczniesz

1. Zainstaluj `imsg` na Macu, na którym działa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Jeśli `imsg chats` kończy się błędem `unable to open database file`, pustym wyjściem albo `authorization denied`, przyznaj pełny dostęp do dysku terminalowi, edytorowi, procesowi Node, usłudze Gateway albo procesowi nadrzędnemu SSH uruchamiającemu `imsg`, a następnie ponownie otwórz ten proces nadrzędny.

2. Zweryfikuj odczyt, obserwowanie, wysyłanie i powierzchnie RPC przed zmianą konfiguracji OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Zastąp `42` rzeczywistym identyfikatorem czatu z `imsg chats`. Wysyłanie wymaga uprawnienia automatyzacji dla Messages.app. Jeśli OpenClaw będzie działać przez SSH, uruchom te polecenia przez to samo opakowanie SSH lub w tym samym kontekście użytkownika, którego będzie używać OpenClaw.

3. Włącz most prywatnego API, gdy potrzebujesz zaawansowanych akcji:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` wymaga wyłączenia SIP. Podstawowe wysyłanie, historia i obserwowanie działają bez `imsg launch`; zaawansowane akcje nie działają.

4. Po dodaniu włączonej konfiguracji `channels.imessage` zweryfikuj most przez OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Oczekiwany wynik to `imessage.privateApi.available: true`. Jeśli zgłasza `false`, najpierw to napraw — zobacz [Wykrywanie możliwości](/pl/channels/imessage#private-api-actions). `channels status --probe` sonduje tylko skonfigurowane, włączone konta.

5. Utwórz migawkę konfiguracji:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Tłumaczenie konfiguracji

iMessage i BlueBubbles współdzielą wiele konfiguracji na poziomie kanału. Klucze, które się zmieniają, dotyczą głównie transportu (serwer REST kontra lokalne CLI). Klucze zachowania (`dmPolicy`, `groupPolicy`, `allowFrom` itd.) zachowują to samo znaczenie.

| BlueBubbles                                                | dołączony iMessage                        | Uwagi                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Ta sama semantyka.                                                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.serverUrl`                           | _(usunięte)_                              | Brak serwera REST — plugin uruchamia `imsg rpc` przez stdio.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(usunięte)_                              | Uwierzytelnianie webhooka nie jest potrzebne.                                                                                                                                                                                                                                                                                                |
| _(niejawne)_                                               | `channels.imessage.cliPath`               | Ścieżka do `imsg` (domyślnie `imsg`); dla SSH użyj skryptu opakowującego.                                                                                                                                                                                                                                                                    |
| _(niejawne)_                                               | `channels.imessage.dbPath`                | Opcjonalne nadpisanie `chat.db` z Messages.app; wykrywane automatycznie, gdy pominięte.                                                                                                                                                                                                                                                      |
| _(niejawne)_                                               | `channels.imessage.remoteHost`            | `host` albo `user@host` — potrzebne tylko wtedy, gdy `cliPath` jest skryptem opakowującym SSH i chcesz pobierać załączniki przez SCP.                                                                                                                                                                                                        |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Te same wartości (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Zatwierdzenia parowania są przenoszone według uchwytu, nie według tokena.                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Te same wartości (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Tak samo.                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Skopiuj to dosłownie, łącznie z dowolnym wpisem wieloznacznym `groups: { "*": { ... } }`.** Ustawienia dla grup `requireMention`, `tools`, `toolsBySender` są przenoszone. Przy `groupPolicy: "allowlist"` pusty lub brakujący blok `groups` po cichu odrzuca każdą wiadomość grupową — zobacz „Pułapka rejestru grup” poniżej.             |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Domyślnie `true`. W dołączonym pluginie działa to tylko wtedy, gdy działa sonda prywatnego API.                                                                                                                                                                                                                                               |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Ten sam kształt, **tak samo domyślnie wyłączone**. Jeśli w BlueBubbles załączniki były przesyłane, musisz jawnie ustawić to ponownie w bloku iMessage — nie jest przenoszone niejawnie, a przychodzące zdjęcia/media będą po cichu odrzucane bez wiersza dziennika `Inbound message`, dopóki tego nie zrobisz.                             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokalne katalogi główne; te same reguły wieloznaczne.                                                                                                                                                                                                                                                                                        |
| _(nie dotyczy)_                                            | `channels.imessage.remoteAttachmentRoots` | Używane tylko wtedy, gdy ustawiono `remoteHost` dla pobrań przez SCP.                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Domyślnie 16 MB w iMessage (domyślna wartość BlueBubbles wynosiła 8 MB). Ustaw jawnie, jeśli chcesz zachować niższy limit.                                                                                                                                                                                                                   |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Domyślnie 4000 w obu.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | To samo ustawienie opt-in. Tylko dla DM — czaty grupowe zachowują natychmiastową wysyłkę każdej wiadomości w obu kanałach. Gdy włączone bez jawnego `messages.inbound.byChannel.imessage`, rozszerza domyślny debounce przychodzący do 2500 ms. Zobacz [dokumentację iMessage § Scalanie dzielonych wysyłek DM](/pl/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(nie dotyczy)_                           | iMessage już odczytuje wyświetlane nazwy nadawców z `chat.db`.                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Przełączniki dla poszczególnych akcji: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                       |

Konfiguracje wielu kont (`channels.bluebubbles.accounts.*`) tłumaczą się jeden do jednego na `channels.imessage.accounts.*`.

## Pułapka rejestru grup

Dołączony plugin iMessage uruchamia **dwie** osobne bramki listy dozwolonych grup jedna po drugiej. Obie muszą przejść, aby wiadomość grupowa dotarła do agenta:

1. **Lista dozwolonych nadawców / celów czatu** (`channels.imessage.groupAllowFrom`) — sprawdzana przez `isAllowedIMessageSender`. Dopasowuje wiadomości przychodzące według uchwytu nadawcy, `chat_guid`, `chat_identifier` albo `chat_id`. Ten sam kształt co w BlueBubbles.
2. **Rejestr grup** (`channels.imessage.groups`) — sprawdzany przez `resolveChannelGroupPolicy` z `inbound-processing.ts:199`. Przy `groupPolicy: "allowlist"` ta bramka wymaga jednego z poniższych:
   - wpisu wieloznacznego `groups: { "*": { ... } }` (ustawia `allowAll = true`), albo
   - jawnego wpisu dla danego `chat_id` w `groups`.

Jeśli bramka 1 przejdzie, ale bramka 2 nie, wiadomość zostaje odrzucona. Plugin emituje dwa sygnały na poziomie `warn`, więc nie jest to już ciche przy domyślnym poziomie logowania:

- Jednorazowe początkowe `warn` na konto, gdy ustawiono `groupPolicy: "allowlist"`, ale `channels.imessage.groups` jest puste (brak wieloznacznika `"*"`, brak wpisów dla poszczególnych `chat_id`) — uruchamiane zanim dotrą jakiekolwiek wiadomości.
- Jednorazowe `warn` dla danego `chat_id` przy pierwszym odrzuceniu konkretnej grupy w czasie działania, z nazwą chat_id i dokładnym kluczem do dodania w `groups`, aby ją dopuścić.

DM nadal działają, ponieważ korzystają z innej ścieżki kodu.

To najczęstszy tryb awarii migracji BlueBubbles → dołączony iMessage: operatorzy kopiują `groupAllowFrom` i `groupPolicy`, ale pomijają blok `groups`, ponieważ `groups: { "*": { "requireMention": true } }` z BlueBubbles wygląda jak niepowiązane ustawienie wzmianki. W rzeczywistości jest kluczowe dla bramki rejestru.

Minimalna konfiguracja, aby wiadomości grupowe nadal przepływały po `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` pod `*` jest nieszkodliwe, gdy nie skonfigurowano wzorców wzmianek: runtime ustawia `canDetectMention = false` i pomija odrzucanie wzmianek w `inbound-processing.ts:512`. Po skonfigurowaniu wzorców wzmianek (`agents.list[].groupChat.mentionPatterns`) działa zgodnie z oczekiwaniami.

Jeśli logi gatewaya zawierają `imessage: dropping group message from chat_id=<id>` albo wiersz startowy `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, odrzuca bramka 2 — dodaj blok `groups`.

## Krok po kroku

1. Dodaj blok iMessage obok istniejącego bloku BlueBubbles. Pozostaw go wyłączonego, gdy Gateway nadal kieruje ruch BlueBubbles:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Sprawdź sondą, zanim ruch będzie istotny** — zatrzymaj Gateway, tymczasowo włącz blok iMessage i potwierdź z poziomu CLI, że iMessage zgłasza stan prawidłowy:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` sprawdza sondą tylko skonfigurowane, włączone konta. Nie restartuj Gateway z włączonymi jednocześnie BlueBubbles i iMessage, chyba że celowo chcesz uruchomić oba monitory kanałów. Jeśli nie przełączasz ruchu natychmiast, przed restartem Gateway ustaw `channels.imessage.enabled` z powrotem na `false`. Użyj bezpośrednich poleceń `imsg` z sekcji [Zanim zaczniesz](#before-you-start), aby zweryfikować Maca przed włączeniem ruchu OpenClaw.

3. **Przełącz ruch.** Gdy włączone konto iMessage zgłasza stan prawidłowy, usuń konfigurację BlueBubbles i pozostaw iMessage włączone:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Zrestartuj Gateway. Ruch przychodzący iMessage przepływa teraz przez dołączony Plugin.

4. **Zweryfikuj wiadomości prywatne.** Wyślij agentowi wiadomość bezpośrednią; potwierdź, że odpowiedź dochodzi.

5. **Zweryfikuj grupy osobno.** Wiadomości prywatne i grupy korzystają z różnych ścieżek kodu — powodzenie wiadomości prywatnych nie dowodzi, że grupy są routowane. Wyślij agentowi wiadomość w sparowanym czacie grupowym i potwierdź, że odpowiedź dochodzi. Jeśli grupa milknie (brak odpowiedzi agenta, brak błędu), sprawdź log gatewaya pod kątem `imessage: dropping group message from chat_id=<id>` albo startowego wiersza `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — oba pojawiają się na domyślnym poziomie logowania. Jeśli którykolwiek się pojawi, blok `groups` jest brakujący albo pusty — zobacz „Group registry footgun” powyżej.

6. **Zweryfikuj powierzchnię akcji** — ze sparowanej wiadomości prywatnej poproś agenta o reakcję, edycję, cofnięcie wysłania, odpowiedź, wysłanie zdjęcia oraz (w grupie) zmianę nazwy grupy / dodanie albo usunięcie uczestnika. Każda akcja powinna natywnie pojawić się w Messages.app. Jeśli dowolna zgłasza „iMessage `<action>` requires the imsg private API bridge”, uruchom ponownie `imsg launch` i odśwież `channels status --probe`.

7. **Usuń serwer i konfigurację BlueBubbles**, gdy wiadomości prywatne iMessage, grupy oraz akcje zostaną zweryfikowane. OpenClaw nie będzie używać `channels.bluebubbles`.

## Szybki przegląd parytetu akcji

| Akcja                                                      | starsze BlueBubbles                  | dołączone iMessage                                                                                                      |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Wysyłanie tekstu / awaryjne użycie SMS                     | ✅                                  | ✅                                                                                                                      |
| Wysyłanie multimediów (zdjęcie, wideo, plik, głos)         | ✅                                  | ✅                                                                                                                      |
| Odpowiedź w wątku (`reply_to_guid`)                        | ✅                                  | ✅ (zamyka [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                 |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Edycja / cofnięcie wysłania (odbiorcy macOS 13+)           | ✅                                  | ✅                                                                                                                      |
| Wysyłanie z efektem ekranowym                              | ✅                                  | ✅ (zamyka część [#9394](https://github.com/openclaw/openclaw/issues/9394))                                             |
| Tekst sformatowany: pogrubienie / kursywa / podkreślenie / przekreślenie | ✅                         | ✅ (formatowanie przebiegów typograficznych przez attributedBody)                                                       |
| Zmiana nazwy grupy / ustawienie ikony grupy                | ✅                                  | ✅                                                                                                                      |
| Dodanie / usunięcie uczestnika, opuszczenie grupy          | ✅                                  | ✅                                                                                                                      |
| Potwierdzenia odczytu i wskaźnik pisania                   | ✅                                  | ✅ (uzależnione od sondy prywatnego API)                                                                                |
| Scalanie wiadomości prywatnych od tego samego nadawcy      | ✅                                  | ✅ (tylko wiadomości prywatne; opcjonalnie przez `channels.imessage.coalesceSameSenderDms`)                             |
| Nadrabianie wiadomości przychodzących odebranych, gdy gateway był wyłączony | ✅ (odtworzenie webhooka + pobranie historii) | ✅ (opcjonalnie przez `channels.imessage.catchup.enabled`; zamyka [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

Nadrabianie zaległych wiadomości iMessage jest teraz dostępne jako funkcja opcjonalna w dołączonym Plugin. Przy starcie gatewaya, jeśli `channels.imessage.catchup.enabled` ma wartość `true`, gateway wykonuje jedno przejście `chats.list` + `messages.history` na czat wobec tego samego klienta JSON-RPC używanego przez `imsg watch`, odtwarza każdy pominięty wiersz przychodzący przez aktywną ścieżkę wysyłki (listy dozwolonych, politykę grup, debouncer, pamięć podręczną echo) i utrwala kursor per konto, aby kolejne uruchomienia zaczynały od miejsca, w którym poprzednio skończyły. Zobacz [Nadrabianie po przestoju gatewaya](/pl/channels/imessage#catching-up-after-gateway-downtime), aby dostroić ustawienia.

## Parowanie, sesje i powiązania ACP

- **Zatwierdzenia parowania** przenoszą się według uchwytu. Nie musisz ponownie zatwierdzać znanych nadawców — `channels.imessage.allowFrom` rozpoznaje te same ciągi `+15555550123` / `user@example.com`, których używało BlueBubbles.
- **Sesje** pozostają zakresowane per agent + czat. Wiadomości prywatne zwijają się do głównej sesji agenta przy domyślnym `session.dmScope=main`; sesje grup pozostają izolowane per `chat_id`. Klucze sesji różnią się (`agent:<id>:imessage:group:<chat_id>` kontra odpowiednik BlueBubbles) — stara historia rozmów pod kluczami sesji BlueBubbles nie przechodzi do sesji iMessage.
- **Powiązania ACP** odwołujące się do `match.channel: "bluebubbles"` trzeba zaktualizować do `"imessage"`. Kształty `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, sam uchwyt) są identyczne.

## Brak kanału wycofania

Nie ma obsługiwanego runtime BlueBubbles, na który można się przełączyć z powrotem. Jeśli weryfikacja iMessage się nie powiedzie, ustaw `channels.imessage.enabled: false`, zrestartuj Gateway, napraw blokadę `imsg` i ponów przełączenie.

Pamięć podręczna odpowiedzi znajduje się w `~/.openclaw/state/imessage/reply-cache.jsonl` (tryb `0600`, katalog nadrzędny `0700`). Można ją bezpiecznie usunąć, jeśli chcesz zacząć od czystego stanu.

## Powiązane

- [Usunięcie BlueBubbles i ścieżka iMessage przez imsg](/pl/announcements/bluebubbles-imessage) — krótkie ogłoszenie i podsumowanie dla operatora.
- [iMessage](/pl/channels/imessage) — pełna dokumentacja kanału iMessage, w tym konfiguracja `imsg launch` i wykrywanie możliwości.
- `/channels/bluebubbles` — starszy URL, który przekierowuje do tego przewodnika migracji.
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania.
- [Routing kanałów](/pl/channels/channel-routing) — jak gateway wybiera kanał dla odpowiedzi wychodzących.
