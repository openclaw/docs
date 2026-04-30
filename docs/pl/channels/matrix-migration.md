---
read_when:
    - Aktualizacja istniejącej instalacji Matrix
    - Migracja zaszyfrowanej historii Matrix i stanu urządzenia
summary: Jak OpenClaw uaktualnia poprzedni Plugin Matrix w miejscu, w tym limity odzyskiwania zaszyfrowanego stanu i kroki ręcznego odzyskiwania.
title: Migracja Matrixa
x-i18n:
    generated_at: "2026-04-30T09:37:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: fff409eef1b7da7be4b63d8459a62b8365a04adf989f271a2f2c4aef46e90716
    source_path: channels/matrix-migration.md
    workflow: 16
---

Uaktualnij z poprzedniego publicznego pluginu `matrix` do bieżącej implementacji.

Dla większości użytkowników aktualizacja odbywa się w miejscu:

- plugin pozostaje `@openclaw/matrix`
- kanał pozostaje `matrix`
- konfiguracja pozostaje pod `channels.matrix`
- dane uwierzytelniające w pamięci podręcznej pozostają pod `~/.openclaw/credentials/matrix/`
- stan runtime pozostaje pod `~/.openclaw/matrix/`

Nie musisz zmieniać nazw kluczy konfiguracji ani ponownie instalować pluginu pod nową nazwą.

## Co migracja wykonuje automatycznie

Gdy Gateway się uruchamia oraz gdy uruchamiasz [`openclaw doctor --fix`](/pl/gateway/doctor), OpenClaw próbuje automatycznie naprawić stary stan Matrix.
Zanim jakikolwiek wykonywalny krok migracji Matrix zmieni stan na dysku, OpenClaw tworzy lub ponownie wykorzystuje ukierunkowaną migawkę odzyskiwania.

Gdy używasz `openclaw update`, dokładny wyzwalacz zależy od sposobu instalacji OpenClaw:

- instalacje ze źródeł uruchamiają `openclaw doctor --fix` podczas przepływu aktualizacji, a następnie domyślnie restartują Gateway
- instalacje przez menedżera pakietów aktualizują pakiet, uruchamiają nieinteraktywny przebieg doctor, a następnie polegają na domyślnym restarcie Gateway, aby uruchamianie mogło dokończyć migrację Matrix
- jeśli używasz `openclaw update --no-restart`, migracja Matrix wsparta uruchamianiem zostaje odroczona do czasu, gdy później uruchomisz `openclaw doctor --fix` i zrestartujesz Gateway

Automatyczna migracja obejmuje:

- tworzenie lub ponowne wykorzystanie migawki sprzed migracji pod `~/Backups/openclaw-migrations/`
- ponowne użycie danych uwierzytelniających Matrix z pamięci podręcznej
- zachowanie tego samego wyboru konta i konfiguracji `channels.matrix`
- przeniesienie najstarszego płaskiego magazynu synchronizacji Matrix do bieżącej lokalizacji powiązanej z kontem
- przeniesienie najstarszego płaskiego magazynu kryptograficznego Matrix do bieżącej lokalizacji powiązanej z kontem, gdy konto docelowe można bezpiecznie rozwiązać
- wyodrębnienie wcześniej zapisanego klucza deszyfrowania kopii zapasowej kluczy pokojów Matrix ze starego magazynu kryptograficznego rust, gdy taki klucz istnieje lokalnie
- ponowne wykorzystanie najbardziej kompletnego istniejącego katalogu głównego magazynu z hashem tokenu dla tego samego konta Matrix, homeservera i użytkownika, gdy token dostępu zmieni się później
- skanowanie sąsiednich katalogów głównych magazynu z hashem tokenu w poszukiwaniu oczekujących metadanych przywracania zaszyfrowanego stanu, gdy token dostępu Matrix się zmienił, ale tożsamość konta/urządzenia pozostała taka sama
- przywrócenie kluczy pokojów z kopii zapasowej do nowego magazynu kryptograficznego przy następnym uruchomieniu Matrix

Szczegóły migawki:

- OpenClaw zapisuje plik znacznika w `~/.openclaw/matrix/migration-snapshot.json` po udanej migawce, aby późniejsze przebiegi uruchamiania i naprawy mogły ponownie wykorzystać to samo archiwum.
- Te automatyczne migawki migracji Matrix tworzą kopię zapasową tylko konfiguracji i stanu (`includeWorkspace: false`).
- Jeśli Matrix ma tylko stan migracji wyłącznie z ostrzeżeniami, na przykład dlatego, że nadal brakuje `userId` lub `accessToken`, OpenClaw nie tworzy jeszcze migawki, ponieważ żadna mutacja Matrix nie jest wykonywalna.
- Jeśli krok migawki się nie powiedzie, OpenClaw pomija migrację Matrix w tym przebiegu zamiast zmieniać stan bez punktu odzyskiwania.

Informacje o aktualizacjach wielokontowych:

- najstarszy płaski magazyn Matrix (`~/.openclaw/matrix/bot-storage.json` i `~/.openclaw/matrix/crypto/`) pochodził z układu z jednym magazynem, więc OpenClaw może zmigrować go tylko do jednego rozwiązanego celu konta Matrix
- już powiązane z kontem starsze magazyny Matrix są wykrywane i przygotowywane osobno dla każdego skonfigurowanego konta Matrix

## Czego migracja nie może zrobić automatycznie

Poprzedni publiczny Plugin Matrix **nie** tworzył automatycznie kopii zapasowych kluczy pokojów Matrix. Utrwalał lokalny stan kryptograficzny i żądał weryfikacji urządzenia, ale nie gwarantował, że klucze pokojów zostały zapisane w kopii zapasowej na homeserverze.

Oznacza to, że niektóre zaszyfrowane instalacje można zmigrować tylko częściowo.

OpenClaw nie może automatycznie odzyskać:

- wyłącznie lokalnych kluczy pokojów, których nigdy nie zapisano w kopii zapasowej
- zaszyfrowanego stanu, gdy docelowego konta Matrix nie można jeszcze rozwiązać, ponieważ `homeserver`, `userId` lub `accessToken` są nadal niedostępne
- automatycznej migracji jednego współdzielonego płaskiego magazynu Matrix, gdy skonfigurowano wiele kont Matrix, ale `channels.matrix.defaultAccount` nie jest ustawione
- instalacji z niestandardową ścieżką pluginu przypiętych do ścieżki repozytorium zamiast standardowego pakietu Matrix
- brakującego klucza odzyskiwania, gdy stary magazyn miał klucze w kopii zapasowej, ale nie zachował klucza deszyfrowania lokalnie

Bieżący zakres ostrzeżeń:

- instalacje z niestandardową ścieżką pluginu Matrix są zgłaszane zarówno przez uruchamianie Gateway, jak i `openclaw doctor`

Jeśli Twoja stara instalacja miała wyłącznie lokalną zaszyfrowaną historię, której nigdy nie zapisano w kopii zapasowej, niektóre starsze zaszyfrowane wiadomości mogą pozostać nieczytelne po aktualizacji.

## Zalecany przepływ aktualizacji

1. Zaktualizuj OpenClaw i Plugin Matrix w zwykły sposób.
   Preferuj zwykłe `openclaw update` bez `--no-restart`, aby uruchamianie mogło natychmiast dokończyć migrację Matrix.
2. Uruchom:

   ```bash
   openclaw doctor --fix
   ```

   Jeśli Matrix ma wykonywalną pracę migracyjną, doctor najpierw utworzy lub ponownie wykorzysta migawkę sprzed migracji i wypisze ścieżkę archiwum.

3. Uruchom lub zrestartuj Gateway.
4. Sprawdź bieżący stan weryfikacji i kopii zapasowej:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Umieść klucz odzyskiwania dla konta Matrix, które naprawiasz, w zmiennej środowiskowej specyficznej dla konta. Dla jednego konta domyślnego `MATRIX_RECOVERY_KEY` jest w porządku. Dla wielu kont użyj jednej zmiennej na konto, na przykład `MATRIX_RECOVERY_KEY_ASSISTANT`, i dodaj `--account assistant` do polecenia.

6. Jeśli OpenClaw poinformuje, że potrzebny jest klucz odzyskiwania, uruchom polecenie dla pasującego konta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Jeśli to urządzenie nadal nie jest zweryfikowane, uruchom polecenie dla pasującego konta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Jeśli klucz odzyskiwania zostanie zaakceptowany, a kopia zapasowa jest użyteczna, ale `Cross-signing verified`
   nadal ma wartość `no`, dokończ samoweryfikację z innego klienta Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Zaakceptuj żądanie w innym kliencie Matrix, porównaj emoji lub liczby dziesiętne
   i wpisz `yes` tylko wtedy, gdy się zgadzają. Polecenie kończy się pomyślnie dopiero
   po tym, jak `Cross-signing verified` stanie się `yes`.

8. Jeśli celowo porzucasz nieodzyskiwalną starą historię i chcesz świeżej bazowej kopii zapasowej dla przyszłych wiadomości, uruchom:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Jeśli kopia zapasowa kluczy po stronie serwera jeszcze nie istnieje, utwórz ją dla przyszłego odzyskiwania:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Jak działa migracja szyfrowana

Migracja szyfrowana jest procesem dwuetapowym:

1. Uruchamianie lub `openclaw doctor --fix` tworzy albo ponownie wykorzystuje migawkę sprzed migracji, jeśli migracja szyfrowana jest wykonywalna.
2. Uruchamianie lub `openclaw doctor --fix` sprawdza stary magazyn kryptograficzny Matrix przez aktywną instalację pluginu Matrix.
3. Jeśli klucz deszyfrowania kopii zapasowej zostanie znaleziony, OpenClaw zapisuje go w nowym przepływie klucza odzyskiwania i oznacza przywracanie kluczy pokojów jako oczekujące.
4. Przy następnym uruchomieniu Matrix OpenClaw automatycznie przywraca klucze pokojów z kopii zapasowej do nowego magazynu kryptograficznego.

Jeśli stary magazyn zgłasza klucze pokojów, których nigdy nie zapisano w kopii zapasowej, OpenClaw ostrzega zamiast udawać, że odzyskiwanie się powiodło.

## Typowe komunikaty i ich znaczenie

### Komunikaty aktualizacji i wykrywania

`Matrix plugin upgraded in place.`

- Znaczenie: stary stan Matrix na dysku został wykryty i zmigrowany do bieżącego układu.
- Co zrobić: nic, chyba że ten sam wynik zawiera również ostrzeżenia.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Znaczenie: OpenClaw utworzył archiwum odzyskiwania przed zmianą stanu Matrix.
- Co zrobić: zachowaj wypisaną ścieżkę archiwum, dopóki nie potwierdzisz, że migracja się powiodła.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Znaczenie: OpenClaw znalazł istniejący znacznik migawki migracji Matrix i ponownie wykorzystał to archiwum zamiast tworzyć zduplikowaną kopię zapasową.
- Co zrobić: zachowaj wypisaną ścieżkę archiwum, dopóki nie potwierdzisz, że migracja się powiodła.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: istnieje stary stan Matrix, ale OpenClaw nie może zmapować go na bieżące konto Matrix, ponieważ Matrix nie jest skonfigurowany.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: OpenClaw znalazł stary stan, ale nadal nie może ustalić dokładnego bieżącego katalogu głównego konta/urządzenia.
- Co zrobić: uruchom Gateway raz z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix` po tym, jak dane uwierzytelniające w pamięci podręcznej będą istnieć.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski magazyn Matrix, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Znaczenie: nowa lokalizacja powiązana z kontem ma już magazyn synchronizacji lub kryptograficzny, więc OpenClaw nie nadpisał jej automatycznie.
- Co zrobić: sprawdź, czy bieżące konto jest właściwe, zanim ręcznie usuniesz lub przeniesiesz kolidujący cel.

`Failed migrating Matrix legacy sync store (...)` or `Failed migrating Matrix legacy crypto store (...)`

- Znaczenie: OpenClaw próbował przenieść stary stan Matrix, ale operacja systemu plików się nie powiodła.
- Co zrobić: sprawdź uprawnienia systemu plików i stan dysku, a następnie ponownie uruchom `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn Matrix, ale nie ma bieżącej konfiguracji Matrix, do której można go dołączyć.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: zaszyfrowany magazyn istnieje, ale OpenClaw nie może bezpiecznie zdecydować, do którego bieżącego konta/urządzenia należy.
- Co zrobić: uruchom Gateway raz z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix` po udostępnieniu danych uwierzytelniających w pamięci podręcznej.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski starszy magazyn kryptograficzny, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Znaczenie: OpenClaw wykrył stary stan Matrix, ale migracja nadal jest zablokowana przez brakujące dane tożsamości lub dane uwierzytelniające.
- Co zrobić: dokończ logowanie Matrix lub konfigurację, a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany stan Matrix, ale nie mógł wczytać pomocniczego punktu wejścia z Pluginu Matrix, który zwykle sprawdza ten magazyn.
- Co zrobić: zainstaluj ponownie lub napraw Plugin Matrix (`openclaw plugins install @openclaw/matrix` albo `openclaw plugins install ./path/to/local/matrix-plugin` dla kopii roboczej repozytorium), a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.
- Jeśli npm zgłasza należący do OpenClaw pakiet Matrix jako przestarzały, użyj dołączonego
  Pluginu z bieżącej spakowanej kompilacji OpenClaw albo lokalnej ścieżki kopii roboczej, dopóki
  nie zostanie opublikowany nowszy pakiet npm.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Znaczenie: OpenClaw znalazł ścieżkę pliku pomocniczego, która wychodzi poza katalog główny Pluginu albo nie przechodzi kontroli granic Pluginu, więc odmówił jej zaimportowania.
- Co zrobić: zainstaluj ponownie Plugin Matrix z zaufanej ścieżki, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Znaczenie: OpenClaw odmówił modyfikacji stanu Matrix, ponieważ najpierw nie mógł utworzyć migawki odzyskiwania.
- Co zrobić: rozwiąż błąd kopii zapasowej, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Failed migrating legacy Matrix client storage: ...`

- Znaczenie: awaryjny mechanizm po stronie klienta Matrix znalazł stary płaski magazyn, ale przenoszenie się nie powiodło. OpenClaw przerywa teraz ten awaryjny mechanizm zamiast po cichu uruchamiać się ze świeżym magazynem.
- Co zrobić: sprawdź uprawnienia systemu plików lub konflikty, zachowaj stary stan bez zmian i ponów próbę po naprawieniu błędu.

`Matrix is installed from a custom path: ...`

- Znaczenie: Matrix jest przypięty do instalacji ze ścieżki, więc główne aktualizacje nie zastąpią go automatycznie standardowym pakietem Matrix z repozytorium.
- Co zrobić: zainstaluj ponownie za pomocą `openclaw plugins install @openclaw/matrix`, gdy chcesz wrócić do domyślnego Pluginu Matrix.
- Jeśli npm zgłasza należący do OpenClaw pakiet Matrix jako przestarzały, użyj dołączonego
  Pluginu z bieżącej spakowanej kompilacji OpenClaw, dopóki nie zostanie opublikowany
  nowszy pakiet npm.

### Komunikaty odzyskiwania zaszyfrowanego stanu

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Znaczenie: zapisane w kopii zapasowej klucze pokojów zostały pomyślnie przywrócone do nowego magazynu kryptograficznego.
- Co zrobić: zwykle nic.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Znaczenie: część starych kluczy pokojów istniała tylko w starym magazynie lokalnym i nigdy nie została przesłana do kopii zapasowej Matrix.
- Co zrobić: spodziewaj się, że część starej zaszyfrowanej historii pozostanie niedostępna, chyba że możesz ręcznie odzyskać te klucze z innego zweryfikowanego klienta.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Znaczenie: kopia zapasowa istnieje, ale OpenClaw nie mógł automatycznie odzyskać klucza odzyskiwania.
- Co zrobić: uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn, ale nie mógł sprawdzić go wystarczająco bezpiecznie, aby przygotować odzyskiwanie.
- Co zrobić: ponownie uruchom `openclaw doctor --fix`. Jeśli problem się powtórzy, zachowaj katalog starego stanu bez zmian i odzyskaj dane przy użyciu innego zweryfikowanego klienta Matrix oraz `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Znaczenie: OpenClaw wykrył konflikt klucza kopii zapasowej i odmówił automatycznego nadpisania bieżącego pliku recovery-key.
- Co zrobić: sprawdź, który klucz odzyskiwania jest poprawny, zanim ponowisz dowolne polecenie przywracania.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Znaczenie: to twarde ograniczenie starego formatu magazynu.
- Co zrobić: klucze z kopii zapasowej nadal można przywrócić, ale lokalna zaszyfrowana historia może pozostać niedostępna.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Znaczenie: nowy Plugin podjął próbę przywrócenia, ale Matrix zwrócił błąd.
- Co zrobić: uruchom `openclaw matrix verify backup status`, a następnie w razie potrzeby ponów próbę za pomocą `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

### Komunikaty ręcznego odzyskiwania

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Znaczenie: OpenClaw wie, że powinien istnieć klucz kopii zapasowej, ale nie jest on aktywny na tym urządzeniu.
- Co zrobić: uruchom `openclaw matrix verify backup restore` albo ustaw `MATRIX_RECOVERY_KEY` i w razie potrzeby uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Znaczenie: to urządzenie nie ma obecnie zapisanego klucza odzyskiwania.
- Co zrobić: ustaw `MATRIX_RECOVERY_KEY`, uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, a następnie przywróć kopię zapasową.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Znaczenie: zapisany klucz nie pasuje do aktywnej kopii zapasowej Matrix.
- Co zrobić: ustaw `MATRIX_RECOVERY_KEY` na poprawny klucz i uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Jeśli akceptujesz utratę niemożliwej do odzyskania starej zaszyfrowanej historii, możesz zamiast tego zresetować
bieżącą bazę kopii zapasowej za pomocą `openclaw matrix verify backup reset --yes`. Gdy
zapisany sekret kopii zapasowej jest uszkodzony, ten reset może też odtworzyć magazyn sekretów, aby
nowy klucz kopii zapasowej mógł poprawnie wczytać się po restarcie.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Znaczenie: kopia zapasowa istnieje, ale to urządzenie nie ufa jeszcze wystarczająco mocno łańcuchowi podpisywania krzyżowego.
- Co zrobić: ustaw `MATRIX_RECOVERY_KEY` i uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Znaczenie: próbowano wykonać krok odzyskiwania bez podania klucza odzyskiwania, gdy był on wymagany.
- Co zrobić: uruchom polecenie ponownie z `--recovery-key-stdin`, na przykład `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Znaczenie: podanego klucza nie można było sparsować albo nie pasował do oczekiwanego formatu.
- Co zrobić: ponów próbę z dokładnym kluczem odzyskiwania z klienta Matrix albo z pliku recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Znaczenie: OpenClaw mógł zastosować klucz odzyskiwania, ale Matrix nadal nie
  ustanowił pełnego zaufania tożsamości podpisywania krzyżowego dla tego urządzenia. Sprawdź
  wyjście polecenia pod kątem `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` i `Device verified by owner`.
- Co zrobić: uruchom `openclaw matrix verify self`, zaakceptuj żądanie w innym
  kliencie Matrix, porównaj SAS i wpisz `yes` tylko wtedy, gdy się zgadza.
  Polecenie czeka na pełne zaufanie tożsamości Matrix przed zgłoszeniem sukcesu. Użyj
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  tylko wtedy, gdy celowo chcesz zastąpić bieżącą tożsamość podpisywania krzyżowego.

`Matrix key backup is not active on this device after loading from secret storage.`

- Znaczenie: magazyn sekretów nie utworzył aktywnej sesji kopii zapasowej na tym urządzeniu.
- Co zrobić: najpierw zweryfikuj urządzenie, a następnie sprawdź ponownie za pomocą `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Znaczenie: to urządzenie nie może przywracać z magazynu sekretów, dopóki weryfikacja urządzenia nie zostanie ukończona.
- Co zrobić: najpierw uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Komunikaty instalacji niestandardowego Pluginu

`Matrix is installed from a custom path that no longer exists: ...`

- Znaczenie: rekord instalacji Pluginu wskazuje na lokalną ścieżkę, która już nie istnieje.
- Co zrobić: zainstaluj ponownie za pomocą `openclaw plugins install @openclaw/matrix`, albo jeśli uruchamiasz z kopii roboczej repozytorium, `openclaw plugins install ./path/to/local/matrix-plugin`.
- Jeśli npm zgłasza należący do OpenClaw pakiet Matrix jako przestarzały, użyj dołączonego
  Pluginu z bieżącej spakowanej kompilacji OpenClaw albo lokalnej ścieżki kopii roboczej, dopóki
  nie zostanie opublikowany nowszy pakiet npm.

## Jeśli zaszyfrowana historia nadal nie wraca

Uruchom te kontrole po kolei:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Jeśli kopia zapasowa zostanie pomyślnie przywrócona, ale w niektórych starych pokojach nadal brakuje historii, brakujące klucze prawdopodobnie nigdy nie zostały zapisane w kopii zapasowej przez poprzedni Plugin.

## Jeśli chcesz zacząć od nowa dla przyszłych wiadomości

Jeśli akceptujesz utratę niemożliwej do odzyskania starej zaszyfrowanej historii i chcesz tylko mieć czystą bazę kopii zapasowej na przyszłość, uruchom te polecenia po kolei:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jeśli po tym urządzenie nadal jest niezweryfikowane, dokończ weryfikację z klienta Matrix, porównując emoji SAS albo kody dziesiętne i potwierdzając, że są zgodne.

## Powiązane

- [Matrix](/pl/channels/matrix): konfiguracja kanału.
- [Reguły push Matrix](/pl/channels/matrix-push-rules): kierowanie powiadomień.
- [Doctor](/pl/gateway/doctor): kontrola kondycji i wyzwalacz automatycznej migracji.
- [Przewodnik migracji](/pl/install/migrating): wszystkie ścieżki migracji (przeniesienia maszyn, importy między systemami).
- [Plugins](/pl/tools/plugin): instalacja i rejestracja Pluginu.
