---
read_when:
    - Planowanie przejścia z BlueBubbles na dołączony plugin iMessage
    - Tłumaczenie kluczy konfiguracji BlueBubbles na odpowiedniki iMessage
    - Weryfikowanie imsg przed włączeniem pluginu iMessage
summary: Migruj stare konfiguracje BlueBubbles do dołączonego Plugin iMessage bez utraty parowania, list dozwolonych ani powiązań grup.
title: Przechodzenie z BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Dołączony Plugin `imessage` uzyskuje teraz dostęp do tej samej powierzchni prywatnego API co BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, zarządzanie grupami, załączniki), sterując [`steipete/imsg`](https://github.com/steipete/imsg) przez JSON-RPC. Jeśli masz już Maca z zainstalowanym `imsg`, możesz porzucić serwer BlueBubbles i pozwolić Pluginowi rozmawiać bezpośrednio z Messages.app.

Obsługa BlueBubbles została usunięta. OpenClaw obsługuje iMessage wyłącznie przez `imsg`. Ten przewodnik służy do migracji starych konfiguracji `channels.bluebubbles` do `channels.imessage`; nie ma innej obsługiwanej ścieżki migracji.

## Kiedy ta migracja ma sens

- Masz już uruchomione `imsg` na tym samym Macu (lub na Macu osiągalnym przez SSH), na którym Messages.app jest zalogowana.
- Chcesz mieć o jeden element mniej — bez osobnego serwera BlueBubbles, bez punktu końcowego REST do uwierzytelniania, bez instalacji Webhook. Pojedynczy binarny plik CLI zamiast serwera + aplikacji klienckiej + pomocnika.
- Używasz [obsługiwanej wersji macOS / kompilacji `imsg`](/pl/channels/imessage#requirements-and-permissions-macos), w której sonda prywatnego API zgłasza `available: true`.

## Co robi imsg

`imsg` to lokalne CLI macOS dla Messages. OpenClaw uruchamia `imsg rpc` jako proces potomny i komunikuje się przez JSON-RPC na stdin/stdout. Nie ma serwera HTTP, adresu URL Webhook, demona działającego w tle, agenta uruchamiania ani portu do wystawienia.

- Odczyty pochodzą z `~/Library/Messages/chat.db` przy użyciu uchwytu SQLite tylko do odczytu.
- Aktywne wiadomości przychodzące pochodzą z `imsg watch` / `watch.subscribe`, które śledzi zdarzenia systemu plików `chat.db` z awaryjnym odpytywaniem.
- Wysyłanie używa automatyzacji Messages.app dla zwykłego tekstu i wysyłania plików.
- Zaawansowane działania używają `imsg launch`, aby wstrzyknąć pomocnika `imsg` do Messages.app. To odblokowuje potwierdzenia odczytu, wskaźniki pisania, rozbudowane wysyłanie, edycję, cofnięcie wysłania, odpowiedzi w wątkach, tapbacki i zarządzanie grupami.
- Kompilacje dla Linuksa mogą przeglądać skopiowany `chat.db`, ale nie mogą wysyłać, obserwować aktywnej bazy danych Maca ani sterować Messages.app. Dla OpenClaw iMessage uruchom `imsg` na zalogowanym Macu albo przez wrapper SSH do tego Maca.

## Zanim zaczniesz

1. Zainstaluj `imsg` na Macu, na którym działa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Jeśli `imsg chats` kończy się błędem `unable to open database file`, pustym wynikiem albo `authorization denied`, przyznaj Pełny dostęp do dysku terminalowi, edytorowi, procesowi Node, usłudze Gateway albo procesowi nadrzędnemu SSH, który uruchamia `imsg`, a następnie ponownie otwórz ten proces nadrzędny.

2. Zweryfikuj powierzchnie odczytu, obserwowania, wysyłania i RPC przed zmianą konfiguracji OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Zastąp `42` rzeczywistym identyfikatorem czatu z `imsg chats`. Wysyłanie wymaga uprawnienia Automatyzacja dla Messages.app. Jeśli OpenClaw będzie działać przez SSH, uruchom te polecenia przez ten sam wrapper SSH lub kontekst użytkownika, którego będzie używać OpenClaw.

3. Włącz most prywatnego API, gdy potrzebujesz zaawansowanych działań:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` wymaga wyłączenia SIP. Podstawowe wysyłanie, historia i obserwowanie działają bez `imsg launch`; zaawansowane działania nie.

4. Zweryfikuj most przez OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Oczekiwany wynik to `imessage.privateApi.available: true`. Jeśli zgłasza `false`, najpierw to napraw — zobacz [Wykrywanie możliwości](/pl/channels/imessage#private-api-actions).

5. Utwórz migawkę konfiguracji:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Tłumaczenie konfiguracji

iMessage i BlueBubbles współdzielą wiele konfiguracji na poziomie kanału. Klucze, które się zmieniają, dotyczą głównie transportu (serwer REST kontra lokalne CLI). Klucze zachowania (`dmPolicy`, `groupPolicy`, `allowFrom` itd.) zachowują to samo znaczenie.

| BlueBubbles                                                | dołączony iMessage                        | Uwagi                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Taka sama semantyka.                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.serverUrl`                           | _(usunięto)_                              | Brak serwera REST — plugin uruchamia `imsg rpc` przez stdio.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(usunięto)_                              | Uwierzytelnianie webhooka nie jest potrzebne.                                                                                                                                                                                                                                                                                                |
| _(niejawne)_                                               | `channels.imessage.cliPath`               | Ścieżka do `imsg` (domyślnie `imsg`); użyj skryptu opakowującego dla SSH.                                                                                                                                                                                                                                                                    |
| _(niejawne)_                                               | `channels.imessage.dbPath`                | Opcjonalne nadpisanie Messages.app `chat.db`; automatycznie wykrywane, gdy pominięte.                                                                                                                                                                                                                                                        |
| _(niejawne)_                                               | `channels.imessage.remoteHost`            | `host` albo `user@host` — potrzebne tylko wtedy, gdy `cliPath` jest skryptem opakowującym SSH i chcesz pobierać załączniki przez SCP.                                                                                                                                                                                                        |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Te same wartości (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Zatwierdzenia parowania są przenoszone według uchwytu, nie tokena.                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Te same wartości (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Tak samo.                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Skopiuj to dosłownie, w tym każdy wpis wieloznaczny `groups: { "*": { ... } }`.** Ustawienia per grupa `requireMention`, `tools`, `toolsBySender` są przenoszone. Przy `groupPolicy: "allowlist"` pusty lub brakujący blok `groups` po cichu odrzuca każdą wiadomość grupową — zobacz „Pułapka rejestru grup” poniżej.                   |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Domyślnie `true`. W dołączonym pluginie uruchamia się to tylko wtedy, gdy działa sonda prywatnego API.                                                                                                                                                                                                                                       |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Ten sam kształt, **tak samo domyślnie wyłączone**. Jeśli załączniki działały w BlueBubbles, musisz jawnie ustawić to ponownie w bloku iMessage — nie jest to przenoszone niejawnie, a przychodzące zdjęcia/media będą po cichu odrzucane bez wiersza dziennika `Inbound message`, dopóki tego nie zrobisz.                                 |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokalne katalogi główne; te same reguły wieloznaczne.                                                                                                                                                                                                                                                                                        |
| _(nie dotyczy)_                                            | `channels.imessage.remoteAttachmentRoots` | Używane tylko wtedy, gdy `remoteHost` jest ustawione dla pobrań przez SCP.                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Domyślnie 16 MB w iMessage (domyślną wartością BlueBubbles było 8 MB). Ustaw jawnie, jeśli chcesz zachować niższy limit.                                                                                                                                                                                                                     |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Domyślnie 4000 w obu.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | To samo ustawienie opt-in. Tylko DM — czaty grupowe zachowują natychmiastowe wysyłanie każdej wiadomości w obu kanałach. Po włączeniu bez jawnego `messages.inbound.byChannel.imessage` rozszerza domyślne opóźnienie wejściowe do 2500 ms. Zobacz [dokumentację iMessage § Scalanie DM wysyłanych w częściach](/pl/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(nie dotyczy)_                           | iMessage już odczytuje nazwy wyświetlane nadawców z `chat.db`.                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Przełączniki per akcja: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                      |

Konfiguracje z wieloma kontami (`channels.bluebubbles.accounts.*`) tłumaczą się jeden do jednego na `channels.imessage.accounts.*`.

## Pułapka rejestru grup

Dołączony plugin iMessage uruchamia **dwie** oddzielne bramki listy dozwolonych grup jedna po drugiej. Obie muszą przejść, aby wiadomość grupowa dotarła do agenta:

1. **Lista dozwolonych nadawców / celów czatu** (`channels.imessage.groupAllowFrom`) — sprawdzana przez `isAllowedIMessageSender`. Dopasowuje wiadomości przychodzące według uchwytu nadawcy, `chat_guid`, `chat_identifier` albo `chat_id`. Taki sam kształt jak w BlueBubbles.
2. **Rejestr grup** (`channels.imessage.groups`) — sprawdzany przez `resolveChannelGroupPolicy` z `inbound-processing.ts:199`. Przy `groupPolicy: "allowlist"` ta bramka wymaga jednego z poniższych:
   - wpisu wieloznacznego `groups: { "*": { ... } }` (ustawia `allowAll = true`), albo
   - jawnego wpisu per `chat_id` w `groups`.

Jeśli bramka 1 przejdzie, ale bramka 2 nie, wiadomość zostanie odrzucona. Plugin emituje dwa sygnały poziomu `warn`, więc nie jest to już ciche przy domyślnym poziomie logowania:

- Jednorazowy startowy `warn` per konto, gdy ustawiono `groupPolicy: "allowlist"`, ale `channels.imessage.groups` jest puste (brak wieloznacznika `"*"`, brak wpisów per `chat_id`) — wyzwalany przed nadejściem jakichkolwiek wiadomości.
- Jednorazowy per `chat_id` `warn` przy pierwszym odrzuceniu konkretnej grupy w czasie działania, wskazujący chat_id i dokładny klucz do dodania w `groups`, aby ją dopuścić.

DM nadal działają, ponieważ korzystają z innej ścieżki kodu.

To najczęstszy tryb awarii migracji BlueBubbles → dołączony iMessage: operatorzy kopiują `groupAllowFrom` i `groupPolicy`, ale pomijają blok `groups`, ponieważ `groups: { "*": { "requireMention": true } }` w BlueBubbles wygląda jak niezwiązane ustawienie wzmianki. W rzeczywistości jest kluczowy dla bramki rejestru.

Minimalna konfiguracja potrzebna do utrzymania przepływu wiadomości grupowych po `groupPolicy: "allowlist"`:

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

`requireMention: true` pod `*` jest nieszkodliwe, gdy nie skonfigurowano wzorców wzmianek: środowisko uruchomieniowe ustawia `canDetectMention = false` i pomija odrzucenie wzmianki w `inbound-processing.ts:512`. Gdy wzorce wzmianek są skonfigurowane (`agents.list[].groupChat.mentionPatterns`), działa to zgodnie z oczekiwaniami.

Jeśli logi Gateway zawierają `imessage: dropping group message from chat_id=<id>` albo wiersz startowy `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, odrzuca bramka 2 — dodaj blok `groups`.

## Krok po kroku

1. Dodaj blok iMessage obok istniejącego bloku BlueBubbles. Zachowaj stary blok tylko jako źródło do kopiowania, dopóki nowa ścieżka nie zostanie zweryfikowana:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
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

2. **Sonda dry-run** — uruchom Gateway i potwierdź, że iMessage zgłasza dobry stan:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   Ponieważ `imessage.enabled` nadal ma wartość `false`, żaden przychodzący ruch iMessage nie jest jeszcze routowany — ale `--probe` ćwiczy most, dzięki czemu wykryjesz problemy z uprawnieniami lub instalacją przed przełączeniem.

3. **Przełącz.** Usuń konfigurację BlueBubbles i włącz iMessage jedną edycją konfiguracji:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Uruchom ponownie Gateway. Przychodzący ruch iMessage przechodzi teraz przez dołączony Plugin.

4. **Zweryfikuj DM.** Wyślij agentowi wiadomość bezpośrednią; potwierdź, że odpowiedź dotarła.

5. **Zweryfikuj grupy osobno.** DM i grupy używają różnych ścieżek kodu — powodzenie DM nie dowodzi, że grupy są routowane. Wyślij agentowi wiadomość w sparowanym czacie grupowym i potwierdź, że odpowiedź dotarła. Jeśli grupa milknie (brak odpowiedzi agenta, brak błędu), sprawdź log Gateway pod kątem `imessage: dropping group message from chat_id=<id>` albo startowego wiersza `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — oba pojawiają się na domyślnym poziomie logowania. Jeśli którykolwiek się pojawi, blok `groups` jest brakujący lub pusty — zobacz powyżej „Pułapka rejestru grup”.

6. **Zweryfikuj powierzchnię akcji** — ze sparowanego DM poproś agenta o reakcję, edycję, cofnięcie wysłania, odpowiedź, wysłanie zdjęcia oraz (w grupie) zmianę nazwy grupy / dodanie lub usunięcie uczestnika. Każda akcja powinna natywnie pojawić się w Messages.app. Jeśli którakolwiek zgłasza „iMessage `<action>` requires the imsg private API bridge”, uruchom ponownie `imsg launch` i odśwież `channels status --probe`.

7. **Usuń serwer i konfigurację BlueBubbles**, gdy DM, grupy i akcje iMessage zostaną zweryfikowane. OpenClaw nie będzie używać `channels.bluebubbles`.

## Szybki przegląd parytetu akcji

| Akcja                                                      | starsze BlueBubbles                  | dołączone iMessage                                                                                                      |
| ---------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Wysyłanie tekstu / rezerwowy SMS                           | ✅                                   | ✅                                                                                                                      |
| Wysyłanie multimediów (zdjęcie, wideo, plik, głos)         | ✅                                   | ✅                                                                                                                      |
| Odpowiedź w wątku (`reply_to_guid`)                        | ✅                                   | ✅ (zamyka [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                 |
| Tapback (`react`)                                          | ✅                                   | ✅                                                                                                                      |
| Edycja / cofnięcie wysłania (odbiorcy macOS 13+)           | ✅                                   | ✅                                                                                                                      |
| Wysyłanie z efektem ekranowym                              | ✅                                   | ✅ (zamyka część [#9394](https://github.com/openclaw/openclaw/issues/9394))                                             |
| Tekst sformatowany: pogrubienie / kursywa / podkreślenie / przekreślenie | ✅                                  | ✅ (formatowanie przebiegów typowanych przez attributedBody)                                                            |
| Zmiana nazwy grupy / ustawienie ikony grupy                | ✅                                   | ✅                                                                                                                      |
| Dodanie / usunięcie uczestnika, opuszczenie grupy          | ✅                                   | ✅                                                                                                                      |
| Potwierdzenia odczytu i wskaźnik pisania                   | ✅                                   | ✅ (bramkowane sondą prywatnego API)                                                                                    |
| Scalanie DM od tego samego nadawcy                         | ✅                                   | ✅ (tylko DM; opcjonalnie przez `channels.imessage.coalesceSameSenderDms`)                                              |
| Nadrabianie przychodzących wiadomości odebranych, gdy Gateway był wyłączony | ✅ (powtórka Webhook + pobranie historii) | ✅ (opcjonalnie przez `channels.imessage.catchup.enabled`; zamyka [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

Nadrabianie iMessage jest teraz dostępne jako opcjonalna funkcja dołączonego Plugin. Przy starcie Gateway, jeśli `channels.imessage.catchup.enabled` ma wartość `true`, Gateway wykonuje jeden przebieg `chats.list` + `messages.history` dla każdego czatu wobec tego samego klienta JSON-RPC, którego używa `imsg watch`, odtwarza każdy pominięty przychodzący wiersz przez aktywną ścieżkę wysyłki (allowlisty, polityka grup, debouncer, cache echa) i utrwala kursor na konto, aby kolejne uruchomienia zaczynały od miejsca przerwania. Zobacz [Nadrabianie po przestoju Gateway](/pl/channels/imessage#catching-up-after-gateway-downtime), aby dostroić tę funkcję.

## Parowanie, sesje i powiązania ACP

- **Zatwierdzenia parowania** przenoszą się według uchwytu. Nie musisz ponownie zatwierdzać znanych nadawców — `channels.imessage.allowFrom` rozpoznaje te same ciągi `+15555550123` / `user@example.com`, których używało BlueBubbles.
- **Sesje** pozostają ograniczone do agenta + czatu. DM zwijają się do głównej sesji agenta przy domyślnym `session.dmScope=main`; sesje grup pozostają izolowane według `chat_id`. Klucze sesji różnią się (`agent:<id>:imessage:group:<chat_id>` względem odpowiednika BlueBubbles) — stara historia rozmów pod kluczami sesji BlueBubbles nie przechodzi do sesji iMessage.
- **Powiązania ACP** odwołujące się do `match.channel: "bluebubbles"` trzeba zaktualizować do `"imessage"`. Kształty `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, sam uchwyt) są identyczne.

## Brak kanału wycofania

Nie ma obsługiwanego środowiska uruchomieniowego BlueBubbles, do którego można wrócić. Jeśli weryfikacja iMessage się nie powiedzie, ustaw `channels.imessage.enabled: false`, uruchom ponownie Gateway, napraw blokadę `imsg` i spróbuj ponownie przełączenia.

Cache odpowiedzi znajduje się w `~/.openclaw/state/imessage/reply-cache.jsonl` (tryb `0600`, katalog nadrzędny `0700`). Możesz go bezpiecznie usunąć, jeśli chcesz zacząć od czystego stanu.

## Powiązane

- [iMessage](/pl/channels/imessage) — pełna dokumentacja kanału iMessage, w tym konfiguracja `imsg launch` i wykrywanie możliwości.
- `/channels/bluebubbles` — starszy URL przekierowujący do tego przewodnika migracji.
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania.
- [Routing kanałów](/pl/channels/channel-routing) — jak Gateway wybiera kanał dla odpowiedzi wychodzących.
