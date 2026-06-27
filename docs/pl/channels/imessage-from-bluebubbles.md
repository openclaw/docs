---
read_when:
    - Planowanie przejścia z BlueBubbles na dołączony Plugin iMessage
    - Tłumaczenie kluczy konfiguracji BlueBubbles na odpowiedniki iMessage
    - Weryfikowanie imsg przed włączeniem Plugin iMessage
summary: Migruj stare konfiguracje BlueBubbles do dołączonego Plugin iMessage bez utraty parowania, list dozwolonych ani powiązań grup.
title: Przechodzisz z BlueBubbles
x-i18n:
    generated_at: "2026-06-27T17:10:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Dołączony Plugin `imessage` uzyskuje teraz dostęp do tej samej powierzchni prywatnego API co BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, zarządzanie grupami, załączniki), sterując [`steipete/imsg`](https://github.com/steipete/imsg) przez JSON-RPC. Jeśli masz już Maca z zainstalowanym `imsg`, możesz zrezygnować z serwera BlueBubbles i pozwolić Pluginowi rozmawiać bezpośrednio z Messages.app.

Obsługa BlueBubbles została usunięta. OpenClaw obsługuje iMessage wyłącznie przez `imsg`. Ten przewodnik służy do migracji starych konfiguracji `channels.bluebubbles` do `channels.imessage`; nie ma innej obsługiwanej ścieżki migracji.

<Note>
Krótkie ogłoszenie i podsumowanie dla operatora znajdziesz w [Usunięcie BlueBubbles i ścieżka imsg dla iMessage](/pl/announcements/bluebubbles-imessage).
</Note>

## Lista kontrolna migracji

Użyj tej listy kontrolnej, gdy znasz już swoją starą konfigurację BlueBubbles i chcesz wybrać najkrótszą bezpieczną ścieżkę:

1. Zweryfikuj `imsg` bezpośrednio na Macu, na którym działa Messages.app (`imsg chats`, `imsg history`, `imsg send` oraz `imsg rpc --help`).
2. Skopiuj klucze zachowania z `channels.bluebubbles` do `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` i `actions`.
3. Usuń klucze transportu, które już nie istnieją: `serverUrl`, `password`, adresy URL Webhook oraz konfigurację serwera BlueBubbles.
4. Jeśli Gateway nie działa na Macu z Messages, ustaw `channels.imessage.cliPath` na wrapper SSH i ustaw `remoteHost` dla zdalnego pobierania załączników.
5. Przy zatrzymanym Gateway włącz `channels.imessage`, a następnie uruchom `openclaw channels status --probe --channel imessage`.
6. Przetestuj jedną wiadomość DM, jedną dozwoloną grupę, załączniki, jeśli są włączone, oraz każdą akcję prywatnego API, której agent ma używać.
7. Usuń serwer BlueBubbles i starą konfigurację `channels.bluebubbles` po zweryfikowaniu ścieżki iMessage.

## Kiedy ta migracja ma sens

- Masz już uruchomione `imsg` na tym samym Macu (lub na takim, do którego można dotrzeć przez SSH), na którym zalogowano Messages.app.
- Chcesz mieć o jeden element mniej — bez osobnego serwera BlueBubbles, bez punktu końcowego REST do uwierzytelniania, bez instalacji Webhook. Jeden binarny plik CLI zamiast serwera + aplikacji klienckiej + pomocnika.
- Używasz [obsługiwanej wersji macOS / kompilacji `imsg`](/pl/channels/imessage#requirements-and-permissions-macos), w której sonda prywatnego API zwraca `available: true`.

## Co robi imsg

`imsg` to lokalne CLI macOS dla Messages. OpenClaw uruchamia `imsg rpc` jako proces potomny i komunikuje się przez JSON-RPC po stdin/stdout. Nie ma serwera HTTP, adresu URL Webhook, demona w tle, agenta uruchomieniowego ani portu do wystawienia.

- Odczyty pochodzą z `~/Library/Messages/chat.db` przy użyciu uchwytu SQLite tylko do odczytu.
- Wiadomości przychodzące na żywo pochodzą z `imsg watch` / `watch.subscribe`, które śledzi zdarzenia systemu plików `chat.db` z awaryjnym odpytywaniem.
- Wysyłanie używa automatyzacji Messages.app dla zwykłego tekstu i wysyłania plików.
- Zaawansowane akcje używają `imsg launch`, aby wstrzyknąć pomocnika `imsg` do Messages.app. To odblokowuje potwierdzenia odczytu, wskaźniki pisania, bogate wysyłki, edycję, cofnięcie wysłania, odpowiedź w wątku, tapbacki i zarządzanie grupami.
- Kompilacje dla Linuksa mogą sprawdzać skopiowane `chat.db`, ale nie mogą wysyłać, obserwować żywej bazy danych Maca ani sterować Messages.app. Dla iMessage w OpenClaw uruchamiaj `imsg` na zalogowanym Macu albo przez wrapper SSH do tego Maca.

## Zanim zaczniesz

1. Zainstaluj `imsg` na Macu, na którym działa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Jeśli `imsg chats` kończy się błędem `unable to open database file`, pustym wyjściem albo `authorization denied`, przyznaj Pełny dostęp do dysku terminalowi, edytorowi, procesowi Node, usłudze Gateway albo procesowi nadrzędnemu SSH, który uruchamia `imsg`, a następnie ponownie otwórz ten proces nadrzędny.

2. Zweryfikuj powierzchnie odczytu, obserwacji, wysyłania i RPC przed zmianą konfiguracji OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Zastąp `42` rzeczywistym identyfikatorem czatu z `imsg chats`. Wysyłanie wymaga uprawnienia Automation dla Messages.app. Jeśli OpenClaw będzie działać przez SSH, uruchom te polecenia przez ten sam wrapper SSH lub kontekst użytkownika, którego będzie używać OpenClaw. Jeśli odczyty/sondy działają, ale wysyłanie kończy się błędem AppleEvents `-1743`, sprawdź, czy Automation trafiło na `/usr/libexec/sshd-keygen-wrapper`; zobacz [Wysyłanie przez wrapper SSH kończy się błędem AppleEvents -1743](/pl/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. Włącz most prywatnego API, gdy potrzebujesz zaawansowanych akcji:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` wymaga wyłączenia SIP. Podstawowe wysyłanie, historia i obserwacja działają bez `imsg launch`; zaawansowane akcje nie działają.

4. Po dodaniu włączonej konfiguracji `channels.imessage` zweryfikuj most przez OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Oczekiwany wynik to `imessage.privateApi.available: true`. Jeśli zwraca `false`, najpierw to napraw — zobacz [Wykrywanie możliwości](/pl/channels/imessage#private-api-actions). `channels status --probe` sprawdza tylko skonfigurowane, włączone konta.

5. Zrób snapshot konfiguracji:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Tłumaczenie konfiguracji

iMessage i BlueBubbles współdzielą wiele konfiguracji na poziomie kanału. Klucze, które się zmieniają, dotyczą głównie transportu (serwer REST kontra lokalne CLI). Klucze zachowania (`dmPolicy`, `groupPolicy`, `allowFrom` itd.) zachowują to samo znaczenie.

| BlueBubbles                                                | dołączony iMessage                       | Uwagi                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`              | Ta sama semantyka.                                                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.serverUrl`                           | _(usunięto)_                             | Brak serwera REST — Plugin uruchamia `imsg rpc` przez stdio.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.password`                            | _(usunięto)_                             | Uwierzytelnianie webhooka nie jest potrzebne.                                                                                                                                                                                                                                                                                                                                       |
| _(domyślne)_                                               | `channels.imessage.cliPath`              | Ścieżka do `imsg` (domyślnie `imsg`); użyj skryptu opakowującego dla SSH.                                                                                                                                                                                                                                                                                                           |
| _(domyślne)_                                               | `channels.imessage.dbPath`               | Opcjonalne nadpisanie Messages.app `chat.db`; wykrywane automatycznie, gdy pominięte.                                                                                                                                                                                                                                                                                               |
| _(domyślne)_                                               | `channels.imessage.remoteHost`           | `host` lub `user@host` — potrzebne tylko wtedy, gdy `cliPath` jest skryptem opakowującym SSH i chcesz pobierać załączniki przez SCP.                                                                                                                                                                                                                                                |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`             | Te same wartości (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`            | Zatwierdzenia parowania przenoszą się według uchwytu, nie według tokenu.                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`          | Te same wartości (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`       | Tak samo.                                                                                                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`               | **Skopiuj to dosłownie, w tym każdy wpis wieloznaczny `groups: { "*": { ... } }`.** Ustawienia dla grup `requireMention`, `tools`, `toolsBySender` przenoszą się. Przy `groupPolicy: "allowlist"` pusty lub brakujący blok `groups` po cichu odrzuca każdą wiadomość grupową — zobacz „Pułapka rejestru grup” poniżej. |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`     | Domyślnie `true`. W dołączonym Pluginie działa to tylko wtedy, gdy sonda prywatnego API jest uruchomiona.                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`   | Ten sam kształt, **tak samo domyślnie wyłączone**. Jeśli załączniki przepływały w BlueBubbles, musisz jawnie ustawić to ponownie w bloku iMessage — nie przenosi się to domyślnie, a przychodzące zdjęcia/multimedia będą po cichu odrzucane bez wiersza dziennika `Inbound message`, dopóki tego nie zrobisz.       |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`      | Lokalne katalogi główne; te same reguły symboli wieloznacznych.                                                                                                                                                                                                                                                                                                                     |
| _(nie dotyczy)_                                            | `channels.imessage.remoteAttachmentRoots` | Używane tylko wtedy, gdy ustawiono `remoteHost` na potrzeby pobierania przez SCP.                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`           | Domyślnie 16 MB w iMessage (domyślną wartością BlueBubbles było 8 MB). Ustaw jawnie, jeśli chcesz zachować niższy limit.                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`       | Domyślnie 4000 w obu.                                                                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | To samo ustawienie opcjonalne. Tylko DM — czaty grupowe zachowują natychmiastowe wysyłanie każdej wiadomości w obu kanałach. Gdy włączone bez jawnego `messages.inbound.byChannel.imessage` lub globalnego `messages.inbound.debounceMs`, rozszerza domyślne opóźnienie przychodzące do 7000 ms. Zobacz [dokumentację iMessage § Scalanie wiadomości DM wysyłanych w częściach](/pl/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(nie dotyczy)_                          | iMessage już odczytuje nazwy wyświetlane nadawców z `chat.db`.                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`            | Przełączniki dla poszczególnych akcji: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                             |

Konfiguracje wielu kont (`channels.bluebubbles.accounts.*`) mapują się jeden do jednego na `channels.imessage.accounts.*`.

## Pułapka rejestru grup

Dołączony Plugin iMessage uruchamia **dwie** osobne bramki listy dozwolonych grup jedna po drugiej. Obie muszą przepuścić wiadomość, aby wiadomość grupowa dotarła do agenta:

1. **Lista dozwolonych nadawców / celów czatu** (`channels.imessage.groupAllowFrom`) — sprawdzana przez `isAllowedIMessageSender`. Dopasowuje wiadomości przychodzące według uchwytu nadawcy, `chat_guid`, `chat_identifier` lub `chat_id`. Ten sam kształt co w BlueBubbles.
2. **Rejestr grup** (`channels.imessage.groups`) — sprawdzany przez `resolveChannelGroupPolicy` z `inbound-processing.ts:199`. Przy `groupPolicy: "allowlist"` ta bramka wymaga jednego z poniższych:
   - wpisu wieloznacznego `groups: { "*": { ... } }` (ustawia `allowAll = true`), lub
   - jawnego wpisu dla danego `chat_id` w `groups`.

Jeśli bramka 1 przepuszcza, ale bramka 2 odrzuca, wiadomość zostaje odrzucona. Plugin emituje dwa sygnały poziomu `warn`, więc na domyślnym poziomie dziennika nie jest to już ciche:

- Jednorazowy startowy sygnał `warn` dla każdego konta, gdy ustawiono `groupPolicy: "allowlist"`, ale `channels.imessage.groups` jest puste (brak symbolu wieloznacznego `"*"`, brak wpisów dla poszczególnych `chat_id`) — wyzwalany przed nadejściem jakichkolwiek wiadomości.
- Jednorazowy sygnał `warn` dla każdego `chat_id`, gdy konkretna grupa zostaje odrzucona po raz pierwszy w czasie działania, z nazwą `chat_id` i dokładnym kluczem, który trzeba dodać do `groups`, aby ją dopuścić.

DM-y nadal działają, ponieważ korzystają z innej ścieżki kodu.

To najczęstszy tryb niepowodzenia migracji BlueBubbles → wbudowany iMessage: operatorzy kopiują `groupAllowFrom` i `groupPolicy`, ale pomijają blok `groups`, ponieważ `groups: { "*": { "requireMention": true } }` w BlueBubbles wygląda jak niepowiązane ustawienie wzmianki. W rzeczywistości jest kluczowy dla bramki rejestru.

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

`requireMention: true` pod `*` jest nieszkodliwe, gdy nie skonfigurowano wzorców wzmianek: runtime ustawia `canDetectMention = false` i skraca odrzucanie wzmianki w `inbound-processing.ts:512`. Ze skonfigurowanymi wzorcami wzmianek (`agents.list[].groupChat.mentionPatterns`) działa zgodnie z oczekiwaniami.

Jeśli logi Gateway pokazują `imessage: dropping group message from chat_id=<id>` albo wiersz startowy `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, odrzuca bramka 2 — dodaj blok `groups`.

## Krok po kroku

1. Dodaj blok iMessage obok istniejącego bloku BlueBubbles. Pozostaw go wyłączonego, dopóki Gateway nadal kieruje ruch BlueBubbles:

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

2. **Sprawdź, zanim ruch zacznie mieć znaczenie** — zatrzymaj Gateway, tymczasowo włącz blok iMessage i potwierdź z CLI, że iMessage zgłasza stan zdrowy:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` sprawdza tylko skonfigurowane, włączone konta. Nie uruchamiaj ponownie Gateway z jednocześnie włączonymi BlueBubbles i iMessage, chyba że celowo chcesz, aby działały oba monitory kanałów. Jeśli nie przełączasz się natychmiast, ustaw `channels.imessage.enabled` z powrotem na `false` przed ponownym uruchomieniem Gateway. Użyj bezpośrednich poleceń `imsg` z sekcji [Zanim zaczniesz](#before-you-start), aby zweryfikować Maca przed włączeniem ruchu OpenClaw.

3. **Przełącz.** Gdy włączone konto iMessage zgłasza stan zdrowy, usuń konfigurację BlueBubbles i pozostaw iMessage włączony:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Uruchom ponownie gateway. Ruch przychodzący iMessage przepływa teraz przez wbudowany plugin.

4. **Zweryfikuj DM-y.** Wyślij agentowi wiadomość bezpośrednią; potwierdź, że odpowiedź dotarła.

5. **Zweryfikuj grupy osobno.** DM-y i grupy korzystają z różnych ścieżek kodu — powodzenie DM nie dowodzi, że grupy są routowane. Wyślij agentowi wiadomość w sparowanym czacie grupowym i potwierdź, że odpowiedź dotarła. Jeśli grupa zamilknie (brak odpowiedzi agenta, brak błędu), sprawdź log Gateway pod kątem `imessage: dropping group message from chat_id=<id>` albo wiersza startowego `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — oba pojawiają się na domyślnym poziomie logowania. Jeśli pojawi się którykolwiek, brakuje bloku `groups` albo jest pusty — zobacz „Pułapka rejestru grup” powyżej.

6. **Zweryfikuj powierzchnię akcji** — ze sparowanego DM poproś agenta, aby zareagował, edytował, cofnął wysłanie, odpowiedział, wysłał zdjęcie oraz (w grupie) zmienił nazwę grupy / dodał lub usunął uczestnika. Każda akcja powinna trafić natywnie do Messages.app. Jeśli jakakolwiek zgłosi „iMessage `<action>` requires the imsg private API bridge”, uruchom ponownie `imsg launch` i odśwież `channels status --probe`.

7. **Usuń serwer i konfigurację BlueBubbles**, gdy DM-y, grupy i akcje iMessage zostaną zweryfikowane. OpenClaw nie użyje `channels.bluebubbles`.

## Szybki przegląd zgodności akcji

| Akcja                                               | starszy BlueBubbles                  | wbudowany iMessage                                                            |
| --------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| Wysyłanie tekstu / fallback SMS                     | ✅                                   | ✅                                                                            |
| Wysyłanie multimediów (zdjęcie, wideo, plik, głos)  | ✅                                   | ✅                                                                            |
| Odpowiedź w wątku (`reply_to_guid`)                 | ✅                                   | ✅ (zamyka [#51892](https://github.com/openclaw/openclaw/issues/51892))       |
| Tapback (`react`)                                   | ✅                                   | ✅                                                                            |
| Edycja / cofnięcie wysłania (odbiorcy macOS 13+)    | ✅                                   | ✅                                                                            |
| Wysyłanie z efektem ekranowym                       | ✅                                   | ✅ (zamyka część [#9394](https://github.com/openclaw/openclaw/issues/9394))   |
| Tekst sformatowany pogrubienie / kursywa / podkreślenie / przekreślenie | ✅                                  | ✅ (formatowanie typed-run przez attributedBody)                              |
| Zmiana nazwy grupy / ustawienie ikony grupy         | ✅                                   | ✅                                                                            |
| Dodanie / usunięcie uczestnika, opuszczenie grupy   | ✅                                   | ✅                                                                            |
| Potwierdzenia odczytu i wskaźnik pisania            | ✅                                   | ✅ (bramkowane sprawdzeniem prywatnego API)                                   |
| Scalanie DM od tego samego nadawcy                  | ✅                                   | ✅ (tylko DM; opt-in przez `channels.imessage.coalesceSameSenderDms`)         |
| Odzyskiwanie przychodzących po restarcie            | ✅ (powtórka Webhook + pobieranie historii) | ✅ (automatyczne: powtórka pominiętych przez since_rowid + dedupe; szersze okno lokalnie) |

iMessage odzyskuje wiadomości pominięte, gdy gateway był wyłączony: podczas startu odtwarza od ostatnio wysłanego rowid przez `imsg watch.subscribe` `since_rowid` i deduplikuje po GUID, a ograniczenie wieku starych zaległości tłumi „bombę zaległości” Push-flush. Działa to przez połączenie RPC `imsg`, więc działa również dla zdalnych konfiguracji SSH `cliPath`; konfiguracje lokalne dostają szersze okno odzyskiwania, ponieważ mogą czytać `chat.db`. Zobacz [Odzyskiwanie przychodzących po restarcie mostka lub gateway](/pl/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Parowanie, sesje i powiązania ACP

- **Zatwierdzenia parowania** przenoszą się według uchwytu. Nie musisz ponownie zatwierdzać znanych nadawców — `channels.imessage.allowFrom` rozpoznaje te same ciągi `+15555550123` / `user@example.com`, których używał BlueBubbles.
- **Sesje** pozostają zakresowane według agent + czat. DM-y zwijają się do głównej sesji agenta przy domyślnym `session.dmScope=main`; sesje grupowe pozostają izolowane według `chat_id`. Klucze sesji różnią się (`agent:<id>:imessage:group:<chat_id>` vs odpowiednik BlueBubbles) — stara historia rozmów pod kluczami sesji BlueBubbles nie przenosi się do sesji iMessage.
- **Powiązania ACP** odwołujące się do `match.channel: "bluebubbles"` trzeba zaktualizować do `"imessage"`. Kształty `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, goły uchwyt) są identyczne.

## Brak kanału wycofania

Nie ma obsługiwanego runtime BlueBubbles, na który można się przełączyć z powrotem. Jeśli weryfikacja iMessage się nie powiedzie, ustaw `channels.imessage.enabled: false`, uruchom ponownie Gateway, napraw blokadę `imsg` i ponów przełączenie.

Pamięć podręczna odpowiedzi znajduje się w stanie pluginu SQLite. `openclaw doctor --fix` importuje i archiwizuje stary sidecar `imessage/reply-cache.jsonl`, gdy jest obecny.

## Powiązane

- [Usunięcie BlueBubbles i ścieżka imsg iMessage](/pl/announcements/bluebubbles-imessage) — krótki komunikat i podsumowanie dla operatora.
- [iMessage](/pl/channels/imessage) — pełne odniesienie kanału iMessage, w tym konfiguracja `imsg launch` i wykrywanie możliwości.
- `/channels/bluebubbles` — starszy URL, który przekierowuje do tego przewodnika migracji.
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania.
- [Routing kanałów](/pl/channels/channel-routing) — jak gateway wybiera kanał dla odpowiedzi wychodzących.
