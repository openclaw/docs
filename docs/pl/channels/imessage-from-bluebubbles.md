---
read_when:
    - Planowanie przejścia z BlueBubbles na dołączony Plugin iMessage
    - Tłumaczenie kluczy konfiguracji BlueBubbles na odpowiedniki iMessage
    - Weryfikowanie imsg przed włączeniem pluginu iMessage
summary: 'Przenieś stare konfiguracje BlueBubbles do dołączonego Pluginu iMessage: mapowanie kluczy, mechanizmy kontroli listy dozwolonych grup i weryfikacja przełączenia.'
title: Przejście z BlueBubbles
x-i18n:
    generated_at: "2026-07-12T14:48:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Usunięto obsługę BlueBubbles. OpenClaw obsługuje iMessage wyłącznie za pośrednictwem dołączonego pluginu `imessage`, który steruje [`steipete/imsg`](https://github.com/steipete/imsg) przez JSON-RPC i zapewnia dostęp do tego samego zakresu prywatnego API co BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, natywne ankiety, zarządzanie grupami, załączniki). Jeden plik wykonywalny CLI zastępuje serwer BlueBubbles, aplikację kliencką i obsługę webhooków: bez punktu końcowego REST i bez uwierzytelniania webhooków.

Ten przewodnik opisuje migrację starych konfiguracji `channels.bluebubbles` do `channels.imessage`. Nie istnieje żadna inna obsługiwana ścieżka migracji. W bieżącej wersji OpenClaw pozostawiony blok `channels.bluebubbles` jest nieaktywny — żaden komponent środowiska uruchomieniowego go nie odczytuje.

<Note>
Krótkie ogłoszenie i podsumowanie dla operatorów zawiera strona [Usunięcie BlueBubbles i obsługa iMessage przez imsg](/pl/announcements/bluebubbles-imessage).
</Note>

## Lista kontrolna migracji

Najkrótsza bezpieczna procedura, jeśli znasz już swoją starą konfigurację BlueBubbles:

1. Zweryfikuj działanie `imsg` bezpośrednio na Macu, na którym działa Messages.app (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Skopiuj klucze zachowania z `channels.bluebubbles` do `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` oraz `actions`.
3. Usuń nieistniejące już klucze transportu: `serverUrl`, `password`, adresy URL webhooków oraz konfigurację serwera BlueBubbles.
4. Jeśli Gateway nie działa na Macu z aplikacją Messages, ustaw `channels.imessage.cliPath` na wrapper SSH, a `remoteHost` na potrzeby zdalnego pobierania załączników.
5. Włącz `channels.imessage`, uruchom ponownie Gateway, a następnie wykonaj `openclaw channels status --probe --channel imessage`.
6. Przetestuj jedną wiadomość bezpośrednią, jedną dozwoloną grupę, załączniki, jeśli są włączone, oraz każdą akcję prywatnego API, której agent ma używać.
7. Po zweryfikowaniu ścieżki iMessage usuń serwer BlueBubbles i starą konfigurację `channels.bluebubbles`.

## Działanie imsg

`imsg` to lokalne narzędzie CLI dla systemu macOS obsługujące aplikację Messages. OpenClaw uruchamia `imsg rpc` jako proces potomny i komunikuje się z nim przez JSON-RPC za pośrednictwem standardowego wejścia i wyjścia. Nie ma serwera HTTP, adresu URL webhooka, demona działającego w tle, agenta uruchomieniowego ani portu, który trzeba udostępnić.

- Odczyt odbywa się z `~/Library/Messages/chat.db` za pomocą połączenia SQLite tylko do odczytu.
- Wiadomości przychodzące na żywo pochodzą z `imsg watch` / `watch.subscribe`, które śledzi zdarzenia systemu plików dotyczące `chat.db`, z mechanizmem rezerwowego cyklicznego odpytywania.
- Wysyłanie zwykłego tekstu i plików korzysta z automatyzacji Messages.app.
- Zaawansowane akcje wykorzystują `imsg launch` do wstrzyknięcia pomocnika `imsg` do Messages.app. Umożliwia to potwierdzenia odczytu, wskaźniki pisania, wysyłanie treści rozszerzonych, edycję, cofanie wysłania, odpowiedzi w wątkach, reakcje Tapback, ankiety oraz zarządzanie grupami.
- Kompilacje dla systemu Linux mogą analizować skopiowany plik `chat.db`, ale nie mogą wysyłać wiadomości, obserwować aktywnej bazy danych Maca ani sterować Messages.app. Aby korzystać z iMessage w OpenClaw, uruchom `imsg` na zalogowanym Macu lub za pośrednictwem wrappera SSH prowadzącego do tego Maca.

## Zanim rozpoczniesz

1. Zainstaluj `imsg` na Macu, na którym działa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   W typowej konfiguracji lokalnej kreator konfiguracji OpenClaw może, po potwierdzeniu przez użytkownika, zainstalować lub zaktualizować `imsg` przez Homebrew na Macu zalogowanym do Messages. Konfiguracjami ręcznymi i topologiami z wrapperem SSH nadal zarządza operator: powtórz aktualizację przez Homebrew w tym samym lokalnym lub zdalnym kontekście użytkownika, w którym będzie uruchamiane `imsg`. Jeśli `imsg chats` kończy się błędem `unable to open database file`, zwraca pusty wynik albo błąd `authorization denied`, przyznaj pełny dostęp do dysku terminalowi, edytorowi, procesowi Node, usłudze Gateway lub nadrzędnemu procesowi SSH, który uruchamia `imsg`, a następnie ponownie uruchom ten proces nadrzędny.

2. Przed zmianą konfiguracji OpenClaw zweryfikuj odczyt, obserwowanie, wysyłanie i interfejs RPC:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "Test OpenClaw imsg"
   imsg rpc --help
   ```

   Zastąp `42` rzeczywistym identyfikatorem czatu z `imsg chats`. Wysyłanie wymaga uprawnienia do automatyzacji Messages.app. Jeśli OpenClaw będzie działać przez SSH, wykonaj te polecenia za pośrednictwem tego samego wrappera SSH lub w tym samym kontekście użytkownika, którego będzie używać OpenClaw. Jeśli odczyt działa, ale wysyłanie kończy się błędem AppleEvents `-1743`, sprawdź, czy uprawnienie do automatyzacji zostało przyznane procesowi `/usr/libexec/sshd-keygen-wrapper`; zobacz [Wysyłanie przez wrapper SSH kończy się błędem AppleEvents -1743](/pl/channels/imessage#requirements-and-permissions-macos).

3. Włącz most prywatnego API. Jest on zdecydowanie zalecany dla iMessage w OpenClaw, ponieważ zależą od niego odpowiedzi, reakcje Tapback, efekty, ankiety, odpowiedzi z załącznikami i akcje grupowe:

   ```bash
   imsg launch
   imsg status --json
   ```

   Polecenie `imsg launch` wymaga wyłączenia SIP (a we współczesnych wersjach macOS także złagodzenia weryfikacji bibliotek — zobacz [Włączanie prywatnego API imsg](/pl/channels/imessage#enabling-the-imsg-private-api)). Podstawowe wysyłanie, historia i obserwowanie działają bez `imsg launch`; pełny zestaw akcji iMessage w OpenClaw nie działa.

4. Po włączeniu `channels.imessage` i uruchomieniu Gateway zweryfikuj most za pośrednictwem OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Konto iMessage powinno zgłaszać stan `works`; z opcją `--json` dane sondy zawierają `privateApi.available: true`. Jeśli wartość wynosi `false`, najpierw napraw ten problem — zobacz [Wykrywanie możliwości](/pl/channels/imessage#private-api-actions). Sondowanie wymaga osiągalnego Gateway (w przeciwnym razie CLI zwraca wyłącznie dane z konfiguracji) i obejmuje tylko skonfigurowane, włączone konta.

5. Utwórz kopię konfiguracji:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Przeniesienie konfiguracji

iMessage i BlueBubbles współdzielą większość kluczy zachowania na poziomie kanału. Zmienia się transport (serwer REST zamiast lokalnego CLI) oraz format kluczy rejestru grup.

| BlueBubbles                                                | dołączony iMessage                         | Uwagi                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`                | Ta sama semantyka (domyślnie `true`, gdy blok już istnieje).                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.serverUrl`                           | _(usunięto)_                               | Brak serwera REST — plugin uruchamia `imsg rpc` przez standardowe wejście i wyjście.                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.password`                            | _(usunięto)_                               | Uwierzytelnianie Webhooka nie jest potrzebne.                                                                                                                                                                                                                                                                                         |
| _(niejawne)_                                               | `channels.imessage.cliPath`                | Ścieżka do `imsg` (domyślnie `imsg`); w przypadku SSH użyj skryptu opakowującego.                                                                                                                                                                                                                                                      |
| _(niejawne)_                                               | `channels.imessage.dbPath`                 | Opcjonalne nadpisanie ścieżki do pliku `chat.db` aplikacji Messages.app; w razie pominięcia wykrywane automatycznie.                                                                                                                                                                                                                   |
| _(niejawne)_                                               | `channels.imessage.remoteHost`             | `host` lub `user@host` — potrzebne tylko wtedy, gdy `cliPath` jest skryptem opakowującym SSH i chcesz pobierać załączniki przez SCP.                                                                                                                                                                                                   |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`               | Te same wartości (`pairing` / `allowlist` / `open` / `disabled`); domyślnie `pairing`.                                                                                                                                                                                                                                                |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`              | Te same formaty identyfikatorów (`+15555550123`, `user@example.com`). Zatwierdzenia z magazynu parowania nie są przenoszone — zobacz poniżej.                                                                                                                                                                                           |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`            | Te same wartości (`allowlist` / `open` / `disabled`); domyślnie `allowlist`.                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`         | Tak samo. Jeśli nie ustawiono tej opcji, iMessage używa zastępczo `allowFrom`; jawnie puste `groupAllowFrom: []` blokuje wszystkie grupy przy `groupPolicy: "allowlist"`.                                                                                                                                                                |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                 | Skopiuj wpis symbolu wieloznacznego `"*"` bez zmian; zmień klucze wpisów poszczególnych grup na numeryczne wartości iMessage `chat_id` — zobacz „Pułapka rejestru grup”. Ustawienia `requireMention`, `tools`, `toolsBySender` i `systemPrompt` są przenoszone.                                                                              |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`       | Domyślnie `true`. W dołączonym pluginie działa to tylko wtedy, gdy sonda prywatnego API jest aktywna.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`     | Ten sam kształt i domyślnie wyłączone. Jeśli załączniki były przesyłane przez BlueBubbles, ustaw tę opcję jawnie — do tego czasu przychodzące zdjęcia i multimedia są po cichu odrzucane (bez wiersza `Inbound message` w dzienniku).                                                                                                        |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`        | Lokalne katalogi główne; te same reguły symboli wieloznacznych.                                                                                                                                                                                                                                                                       |
| _(nie dotyczy)_                                            | `channels.imessage.remoteAttachmentRoots`  | Używane tylko wtedy, gdy ustawiono `remoteHost` do pobierania przez SCP.                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`             | Domyślnie 16 MB w iMessage (wartość domyślna BlueBubbles wynosiła 8 MB). Ustaw jawnie, aby zachować niższy limit.                                                                                                                                                                                                                       |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`         | Domyślnie 4000 w obu przypadkach.                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms`  | Ta sama opcja wymagająca jawnego włączenia. Dotyczy tylko wiadomości prywatnych — grupy zachowują wysyłanie każdej wiadomości osobno. Zwiększa domyślne opóźnienie stabilizujące wiadomości przychodzące do 7000 ms, chyba że ustawiono `messages.inbound.byChannel.imessage` lub globalne `messages.inbound.debounceMs`. Zobacz [Scalanie dzielonych wiadomości prywatnych](/pl/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(nie dotyczy)_                            | `imsg` już udostępnia nazwy wyświetlane nadawców z `chat.db`.                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`              | Te same przełączniki poszczególnych akcji (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`) oraz nowe `polls`. Wszystkie są domyślnie włączone; akcje prywatnego API nadal wymagają mostu.                                  |

Konfiguracje wielu kont (`channels.bluebubbles.accounts.*`) przekładają się jeden do jednego na `channels.imessage.accounts.*`.

## Pułapka rejestru grup

Dołączony plugin iMessage stosuje kolejno dwie bramy grup. Wiadomość grupowa musi przejść przez obie, aby dotrzeć do agenta:

1. **Lista dozwolonych nadawców / celów czatu** (`channels.imessage.groupAllowFrom`) — dopasowuje identyfikator nadawcy lub cel czatu (wpisy `chat_id:`, `chat_guid:`, `chat_identifier:`). Jeśli `groupAllowFrom` nie jest ustawione, ta brama używa zastępczo `allowFrom`; jawne `groupAllowFrom: []` wyłącza ten mechanizm zastępczy i odrzuca każdą wiadomość grupową przy `groupPolicy: "allowlist"`.
2. **Rejestr grup** (`channels.imessage.groups`) — z kluczami będącymi numerycznymi wartościami iMessage `chat_id`:
   - Brak bloku `groups` (lub pusty blok): grupy przechodzą przez tę bramę, o ile brama 1 ma niepustą efektywną listę dozwolonych nadawców; filtrowanie nadawców kontroluje dostęp i nie pojawia się ostrzeżenie startowe o odrzucaniu wszystkich wiadomości.
   - `groups` z wpisami, ale bez `"*"`: przechodzą tylko wymienione klucze `chat_id`. Dodanie dowolnej grupy zmienia rejestr w listę dozwolonych nawet przy `groupPolicy: "open"`.
   - `groups: { "*": { ... } }`: każda grupa przechodzi przez tę bramę.

Pułapka migracji: BlueBubbles używał jako kluczy wpisów `groups` identyfikatorów GUID czatu lub identyfikatorów czatu, natomiast rejestr iMessage używa numerycznych wartości `chat_id`. Wpisy poszczególnych grup skopiowane bez zmian tworzą niepusty rejestr, którego klucze nigdy nie pasują, dlatego każda wiadomość grupowa jest odrzucana przez bramę 2. Skopiuj symbol wieloznaczny `"*"` bez zmian; zmień klucze wpisów konkretnych grup, używając wartości `chat_id` z polecenia `imsg chats`.

Obie ścieżki odrzucania są widoczne przy domyślnym poziomie rejestrowania jako wiersze `warn`:

- Raz dla każdego konta podczas uruchamiania, gdy ustawiono `groupPolicy: "allowlist"`, a efektywna lista dozwolonych nadawców grupowych jest pusta: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Ustaw `groupAllowFrom` (lub `allowFrom`), aby dopuścić nadawców; samo dodanie `groups` nie spełnia wymagań bramy nadawców.
- Raz dla każdego `chat_id` podczas działania, gdy rejestr odrzuca grupę: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`, ze wskazaniem dokładnego klucza, który należy dodać.

Wiadomości prywatne działają w obu przypadkach — korzystają z innej ścieżki kodu, więc ich poprawne działanie nie potwierdza prawidłowego kierowania wiadomości grupowych.

Minimalna konfiguracja ograniczona do nadawców z `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

Pozwala ona skonfigurowanym nadawcom pisać w dowolnej grupie. Dodaj wpisy `groups`, aby ograniczyć dozwolone czaty lub ustawić opcje poszczególnych czatów, takie jak `requireMention`; skopiuj wpis `"*"` z BlueBubbles bez zmian, lecz zmień klucze konkretnych wpisów na numeryczne wartości iMessage `chat_id`.

## Krok po kroku

1. Przenieś konfigurację. Podczas edycji pozostaw nowy blok wyłączony; stary blok `channels.bluebubbles` jest ignorowany przez bieżącą wersję OpenClaw i może pozostać obok jako punkt odniesienia:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // zmień na true, gdy wszystko będzie gotowe do przełączenia
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // skopiuj z bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // skopiuj z bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // symbol wieloznaczny skopiuj bez zmian; wpisom poszczególnych czatów nadaj klucze według chat_id
         // działania są domyślnie włączone; ustaw poszczególne przełączniki na false, aby je wyłączyć
       },
     },
   }
   ```

2. **Przełącz i wykonaj test.** Ustaw `channels.imessage.enabled: true`, uruchom ponownie Gateway i potwierdź, że kanał zgłasza prawidłowy stan:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # oczekiwane "works"; --json pokazuje privateApi.available: true
   ```

   Test wymaga dostępnego Gateway i sprawdza tylko skonfigurowane, włączone konta. Użyj bezpośrednich poleceń `imsg` z sekcji [Zanim zaczniesz](#before-you-start), aby sprawdzić samego Maca.

3. **Sprawdź wiadomości prywatne.** Wyślij agentowi wiadomość prywatną i potwierdź, że odpowiedź dotarła.

4. **Sprawdź grupy osobno.** Wiadomości prywatne i grupowe korzystają z różnych ścieżek kodu — powodzenie wiadomości prywatnych nie dowodzi, że routing grup działa. Wyślij wiadomość na dozwolonym czacie grupowym i potwierdź, że odpowiedź dotarła. Jeśli grupa zamilknie (brak odpowiedzi agenta i brak błędu), sprawdź dziennik Gateway pod kątem dwóch wierszy `warn` z opisanej wyżej sekcji „Pułapka rejestru grup”. Ostrzeżenie podczas uruchamiania oznacza, że efektywna lista dozwolonych nadawców jest pusta; ostrzeżenie dla konkretnego `chat_id` oznacza, że wypełniony rejestr `groups` nie zawiera tego czatu.

5. **Sprawdź dostępne działania.** W sparowanej wiadomości prywatnej poproś agenta o dodanie reakcji, edycję, cofnięcie wysłania, odpowiedź, wysłanie zdjęcia oraz — w grupie — zmianę nazwy grupy lub dodanie bądź usunięcie uczestnika. Każde działanie powinno zostać wykonane natywnie w Messages.app. Jeśli którekolwiek działanie zgłosi `iMessage <action> requires the imsg private API bridge`, ponownie uruchom `imsg launch` i odśwież stan za pomocą `openclaw channels status --probe`.

6. **Usuń serwer BlueBubbles i blok `channels.bluebubbles`**, gdy wiadomości prywatne, grupy i działania iMessage zostaną zweryfikowane. OpenClaw nie odczytuje `channels.bluebubbles`.

## Skrócone porównanie obsługiwanych działań

| Działanie                                            | starsze BlueBubbles | wbudowane iMessage                                                              |
| --------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Wysyłanie tekstu / awaryjne użycie SMS              | ✅                  | ✅                                                                              |
| Wysyłanie multimediów (zdjęcie, film, plik, głos)   | ✅                  | ✅                                                                              |
| Odpowiedź w wątku (`reply_to_guid`)                  | ✅                  | ✅ (rozwiązuje [#51892](https://github.com/openclaw/openclaw/issues/51892))      |
| Reakcja Tapback (`react`)                            | ✅                  | ✅                                                                              |
| Edycja / cofnięcie wysłania (odbiorcy z macOS 13+)  | ✅                  | ✅                                                                              |
| Wysyłanie z efektem ekranowym                        | ✅                  | ✅ (częściowo rozwiązuje [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Tekst sformatowany: pogrubienie / kursywa / podkreślenie / przekreślenie | ✅ | ✅ (formatowanie typowanych fragmentów przez attributedBody)               |
| Natywne ankiety Messages (tworzenie i głosowanie)    | ❌                  | ✅ (`actions.polls`; odbiorcy potrzebują iOS/macOS 26+ do natywnego wyświetlania) |
| Zmiana nazwy grupy / ustawienie ikony grupy          | ✅                  | ✅                                                                              |
| Dodawanie / usuwanie uczestnika, opuszczanie grupy   | ✅                  | ✅                                                                              |
| Potwierdzenia odczytu i wskaźnik pisania             | ✅                  | ✅ (zależne od testu prywatnego API)                                            |
| Scalanie wiadomości prywatnych od tego samego nadawcy | ✅                 | ✅ (tylko wiadomości prywatne; opcjonalnie przez `channels.imessage.coalesceSameSenderDms`) |
| Odzyskiwanie wiadomości przychodzących po ponownym uruchomieniu | ✅       | ✅ (automatycznie: odtwarzanie `since_rowid` + deduplikacja GUID; szersze okno lokalnie) |

iMessage odzyskuje wiadomości pominięte podczas niedostępności Gateway: podczas uruchamiania odtwarza wiadomości od ostatniego przekazanego identyfikatora wiersza za pomocą `imsg watch.subscribe` i `since_rowid`, deduplikuje je według GUID, a ograniczenie wieku nieaktualnego bufora zapobiega „bombardowaniu zaległościami” podczas opróżniania Push. Odbywa się to przez połączenie RPC `imsg`, więc działa również w zdalnych konfiguracjach SSH `cliPath`; konfiguracje lokalne mają szersze okno odzyskiwania, ponieważ mogą odczytywać `chat.db`. Zobacz [Odzyskiwanie wiadomości przychodzących po ponownym uruchomieniu mostu lub Gateway](/pl/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Parowanie, sesje i powiązania ACP

- **Listy dozwolonych są przenoszone według identyfikatora.** `channels.imessage.allowFrom` rozpoznaje te same ciągi `+15555550123` / `user@example.com`, których używało BlueBubbles — skopiuj je bez zmian.
- **Zatwierdzenia z magazynu parowania nie są przenoszone.** Magazyn parowania jest osobny dla każdego kanału i nic nie przenosi starego magazynu BlueBubbles. Nadawcy zatwierdzeni wyłącznie przez parowanie muszą ponownie sparować się w iMessage albo musisz dodać ich identyfikatory do `allowFrom`.
- **Sesje** pozostają ograniczone do agenta i czatu. Wiadomości prywatne są scalane z główną sesją agenta przy domyślnym ustawieniu `session.dmScope=main`; sesje grupowe pozostają odizolowane dla każdego `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`). Stara historia rozmów zapisana pod kluczami sesji BlueBubbles nie jest przenoszona do sesji iMessage.
- **Powiązania ACP** odwołujące się do `match.channel: "bluebubbles"` trzeba zmienić na `"imessage"`. Postacie `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, sam identyfikator) są identyczne.

## Brak kanału wycofania zmian

Nie istnieje obsługiwane środowisko wykonawcze BlueBubbles, do którego można się przełączyć z powrotem. Jeśli weryfikacja iMessage zakończy się niepowodzeniem, ustaw `channels.imessage.enabled: false`, uruchom ponownie Gateway, usuń przeszkodę dotyczącą `imsg` i ponów przełączenie.

Pamięć podręczna odpowiedzi znajduje się w stanie Pluginu w SQLite. Polecenie `openclaw doctor --fix` importuje i archiwizuje stary plik pomocniczy `imessage/reply-cache.jsonl`, jeśli jest obecny.

## Powiązane

- [Usunięcie BlueBubbles i ścieżka iMessage oparta na imsg](/pl/announcements/bluebubbles-imessage) — krótkie ogłoszenie i podsumowanie dla operatora.
- [iMessage](/pl/channels/imessage) — pełna dokumentacja kanału iMessage, w tym konfiguracja `imsg launch` i wykrywanie możliwości.
- `/channels/bluebubbles` — starszy adres URL przekierowujący do tego przewodnika migracji.
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i proces parowania.
- [Routing kanałów](/pl/channels/channel-routing) — sposób, w jaki Gateway wybiera kanał dla odpowiedzi wychodzących.
