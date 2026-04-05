---
read_when:
    - Aktualizujesz istniejącą instalację Matrix
    - Migrujesz zaszyfrowaną historię Matrix i stan urządzenia
summary: Jak OpenClaw aktualizuje poprzedni plugin Matrix na miejscu, w tym ograniczenia odzyskiwania stanu zaszyfrowanego i ręczne kroki odzyskiwania.
title: Migracja Matrix
x-i18n:
    generated_at: "2026-04-05T13:58:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b1ade057d90a524e09756bd981921988c980ea6259f5c4316a796a831e9f83b
    source_path: install/migrating-matrix.md
    workflow: 15
---

# Migracja Matrix

Ta strona opisuje aktualizacje z poprzedniego publicznego pluginu `matrix` do bieżącej implementacji.

Dla większości użytkowników aktualizacja odbywa się na miejscu:

- plugin pozostaje `@openclaw/matrix`
- kanał pozostaje `matrix`
- konfiguracja pozostaje pod `channels.matrix`
- zapisane poświadczenia pozostają pod `~/.openclaw/credentials/matrix/`
- stan środowiska uruchomieniowego pozostaje pod `~/.openclaw/matrix/`

Nie musisz zmieniać nazw kluczy konfiguracji ani instalować pluginu ponownie pod nową nazwą.

## Co migracja robi automatycznie

Gdy gateway się uruchamia oraz gdy uruchamiasz [`openclaw doctor --fix`](/gateway/doctor), OpenClaw próbuje automatycznie naprawić stary stan Matrix.
Zanim jakikolwiek praktyczny krok migracji Matrix zmodyfikuje stan na dysku, OpenClaw tworzy lub ponownie wykorzystuje ukierunkowaną migawkę odzyskiwania.

Gdy używasz `openclaw update`, dokładny wyzwalacz zależy od sposobu instalacji OpenClaw:

- instalacje ze źródeł uruchamiają `openclaw doctor --fix` podczas procesu aktualizacji, a następnie domyślnie restartują gateway
- instalacje przez menedżera pakietów aktualizują pakiet, uruchamiają nieinteraktywny przebieg doctor, a następnie polegają na domyślnym restarcie gateway, aby uruchamianie mogło dokończyć migrację Matrix
- jeśli użyjesz `openclaw update --no-restart`, migracja Matrix wspierana przez uruchomienie zostanie odroczona, dopóki później nie uruchomisz `openclaw doctor --fix` i nie zrestartujesz gateway

Automatyczna migracja obejmuje:

- utworzenie lub ponowne użycie migawki sprzed migracji w `~/Backups/openclaw-migrations/`
- ponowne użycie zapisanych poświadczeń Matrix
- zachowanie tego samego wyboru konta i konfiguracji `channels.matrix`
- przeniesienie najstarszego płaskiego magazynu synchronizacji Matrix do bieżącej lokalizacji ograniczonej do konta
- przeniesienie najstarszego płaskiego magazynu kryptograficznego Matrix do bieżącej lokalizacji ograniczonej do konta, gdy docelowe konto można bezpiecznie rozpoznać
- wyodrębnienie wcześniej zapisanych kluczy deszyfrowania kopii zapasowej kluczy pokoju Matrix ze starego magazynu rust crypto, jeśli taki klucz istnieje lokalnie
- ponowne użycie najbardziej kompletnego istniejącego katalogu głównego magazynu skrótu tokena dla tego samego konta Matrix, homeservera i użytkownika, gdy token dostępu później się zmieni
- skanowanie sąsiednich katalogów głównych magazynu skrótu tokena w poszukiwaniu oczekujących metadanych przywracania stanu zaszyfrowanego, gdy token dostępu Matrix się zmienił, ale tożsamość konta/urządzenia pozostała taka sama
- przywracanie zapisanych kluczy pokoju do nowego magazynu kryptograficznego przy następnym uruchomieniu Matrix

Szczegóły migawki:

- OpenClaw zapisuje plik znacznika w `~/.openclaw/matrix/migration-snapshot.json` po pomyślnym utworzeniu migawki, aby kolejne przebiegi uruchamiania i naprawy mogły ponownie użyć tego samego archiwum.
- Te automatyczne migawki migracji Matrix wykonują kopię zapasową tylko konfiguracji i stanu (`includeWorkspace: false`).
- Jeśli Matrix ma tylko stan migracji z ostrzeżeniami, na przykład dlatego, że nadal brakuje `userId` lub `accessToken`, OpenClaw nie tworzy jeszcze migawki, ponieważ żadna modyfikacja Matrix nie jest jeszcze możliwa do wykonania.
- Jeśli krok tworzenia migawki się nie powiedzie, OpenClaw pomija migrację Matrix w tym przebiegu zamiast modyfikować stan bez punktu odzyskiwania.

O aktualizacjach wielokontowych:

- najstarszy płaski magazyn Matrix (`~/.openclaw/matrix/bot-storage.json` i `~/.openclaw/matrix/crypto/`) pochodził z układu pojedynczego magazynu, więc OpenClaw może zmigrować go tylko do jednego rozpoznanego celu konta Matrix
- starsze magazyny Matrix już ograniczone do konta są wykrywane i przygotowywane osobno dla każdego skonfigurowanego konta Matrix

## Czego migracja nie może zrobić automatycznie

Poprzedni publiczny plugin Matrix **nie** tworzył automatycznie kopii zapasowych kluczy pokojów Matrix. Zapisywał lokalny stan kryptograficzny i żądał weryfikacji urządzenia, ale nie gwarantował, że Twoje klucze pokojów zostały zapisane na homeserverze.

To oznacza, że niektóre zaszyfrowane instalacje można zmigrować tylko częściowo.

OpenClaw nie może automatycznie odzyskać:

- lokalnych kluczy pokojów, które nigdy nie zostały zapisane w kopii zapasowej
- stanu zaszyfrowanego, gdy docelowego konta Matrix nie da się jeszcze rozpoznać, ponieważ `homeserver`, `userId` lub `accessToken` są nadal niedostępne
- automatycznej migracji jednego współdzielonego płaskiego magazynu Matrix, gdy skonfigurowano wiele kont Matrix, ale `channels.matrix.defaultAccount` nie jest ustawione
- instalacji niestandardowych ścieżek pluginu przypiętych do ścieżki repozytorium zamiast standardowego pakietu Matrix
- brakującego klucza odzyskiwania, gdy stary magazyn miał zapisane klucze, ale nie zachował lokalnie klucza deszyfrowania

Bieżący zakres ostrzeżeń:

- instalacje niestandardowych ścieżek pluginu Matrix są zgłaszane zarówno podczas uruchamiania gateway, jak i przez `openclaw doctor`

Jeśli Twoja stara instalacja miała lokalną zaszyfrowaną historię, która nigdy nie została zapisana w kopii zapasowej, niektóre starsze zaszyfrowane wiadomości mogą pozostać nieczytelne po aktualizacji.

## Zalecany przebieg aktualizacji

1. Zaktualizuj OpenClaw i plugin Matrix w zwykły sposób.
   Preferuj zwykłe `openclaw update` bez `--no-restart`, aby uruchamianie mogło od razu dokończyć migrację Matrix.
2. Uruchom:

   ```bash
   openclaw doctor --fix
   ```

   Jeśli Matrix ma możliwe do wykonania zadania migracyjne, doctor najpierw utworzy lub ponownie użyje migawki sprzed migracji i wypisze ścieżkę do archiwum.

3. Uruchom lub uruchom ponownie gateway.
4. Sprawdź bieżący stan weryfikacji i kopii zapasowej:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Jeśli OpenClaw poinformuje Cię, że potrzebny jest klucz odzyskiwania, uruchom:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Jeśli to urządzenie nadal nie jest zweryfikowane, uruchom:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Jeśli celowo porzucasz nieodzyskiwalną starą historię i chcesz ustawić nową bazę kopii zapasowej dla przyszłych wiadomości, uruchom:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Jeśli kopia zapasowa kluczy po stronie serwera jeszcze nie istnieje, utwórz ją na potrzeby przyszłych odzyskań:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Jak działa migracja zaszyfrowanych danych

Migracja zaszyfrowanych danych to proces dwuetapowy:

1. Uruchamianie lub `openclaw doctor --fix` tworzy lub ponownie wykorzystuje migawkę sprzed migracji, jeśli migracja zaszyfrowanych danych jest możliwa do wykonania.
2. Uruchamianie lub `openclaw doctor --fix` sprawdza stary magazyn kryptograficzny Matrix przez aktywną instalację pluginu Matrix.
3. Jeśli zostanie znaleziony klucz deszyfrowania kopii zapasowej, OpenClaw zapisuje go w nowym przepływie klucza odzyskiwania i oznacza przywracanie kluczy pokojów jako oczekujące.
4. Przy następnym uruchomieniu Matrix OpenClaw automatycznie przywraca zapisane klucze pokojów do nowego magazynu kryptograficznego.

Jeśli stary magazyn zgłasza klucze pokojów, które nigdy nie zostały zapisane w kopii zapasowej, OpenClaw wyświetla ostrzeżenie zamiast udawać, że odzyskiwanie się powiodło.

## Typowe komunikaty i ich znaczenie

### Komunikaty dotyczące aktualizacji i wykrywania

`Matrix plugin upgraded in place.`

- Znaczenie: stary stan Matrix na dysku został wykryty i zmigrowany do bieżącego układu.
- Co zrobić: nic, chyba że ten sam wynik zawiera też ostrzeżenia.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Znaczenie: OpenClaw utworzył archiwum odzyskiwania przed modyfikacją stanu Matrix.
- Co zrobić: zachowaj wypisaną ścieżkę do archiwum, dopóki nie potwierdzisz powodzenia migracji.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Znaczenie: OpenClaw znalazł istniejący znacznik migawki migracji Matrix i ponownie użył tego archiwum zamiast tworzyć zduplikowaną kopię zapasową.
- Co zrobić: zachowaj wypisaną ścieżkę do archiwum, dopóki nie potwierdzisz powodzenia migracji.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: istnieje stary stan Matrix, ale OpenClaw nie może przypisać go do bieżącego konta Matrix, ponieważ Matrix nie jest skonfigurowany.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: OpenClaw znalazł stary stan, ale nadal nie może określić dokładnego bieżącego katalogu głównego konta/urządzenia.
- Co zrobić: uruchom gateway raz z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix`, gdy zapisane poświadczenia będą już dostępne.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski magazyn Matrix, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na docelowe konto, a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Znaczenie: nowa lokalizacja ograniczona do konta ma już magazyn synchronizacji lub kryptografii, więc OpenClaw nie nadpisał go automatycznie.
- Co zrobić: sprawdź, czy bieżące konto jest właściwe, zanim ręcznie usuniesz lub przeniesiesz konfliktowy cel.

`Failed migrating Matrix legacy sync store (...)` lub `Failed migrating Matrix legacy crypto store (...)`

- Znaczenie: OpenClaw próbował przenieść stary stan Matrix, ale operacja systemu plików się nie powiodła.
- Co zrobić: sprawdź uprawnienia systemu plików i stan dysku, a następnie ponownie uruchom `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn Matrix, ale nie ma bieżącej konfiguracji Matrix, do której można go przypisać.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: zaszyfrowany magazyn istnieje, ale OpenClaw nie może bezpiecznie ustalić, do którego bieżącego konta/urządzenia należy.
- Co zrobić: uruchom gateway raz z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix`, gdy zapisane poświadczenia będą dostępne.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski starszy magazyn kryptograficzny, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na docelowe konto, a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Znaczenie: OpenClaw wykrył stary stan Matrix, ale migracja jest nadal zablokowana przez brakujące dane tożsamości lub poświadczeń.
- Co zrobić: dokończ logowanie Matrix lub konfigurację, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany stan Matrix, ale nie mógł załadować pomocniczego punktu wejścia z pluginu Matrix, który zwykle sprawdza ten magazyn.
- Co zrobić: zainstaluj ponownie lub napraw plugin Matrix (`openclaw plugins install @openclaw/matrix` albo `openclaw plugins install ./path/to/local/matrix-plugin` dla checkoutu repozytorium), a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Znaczenie: OpenClaw znalazł ścieżkę pliku pomocniczego, która wychodzi poza katalog główny pluginu lub nie przechodzi kontroli granic pluginu, więc odmówił jej zaimportowania.
- Co zrobić: zainstaluj ponownie plugin Matrix z zaufanej ścieżki, a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Znaczenie: OpenClaw odmówił modyfikacji stanu Matrix, ponieważ najpierw nie mógł utworzyć migawki odzyskiwania.
- Co zrobić: rozwiąż błąd kopii zapasowej, a następnie ponownie uruchom `openclaw doctor --fix` lub zrestartuj gateway.

`Failed migrating legacy Matrix client storage: ...`

- Znaczenie: awaryjna ścieżka po stronie klienta Matrix wykryła stary płaski magazyn, ale przeniesienie się nie powiodło. OpenClaw teraz przerywa tę ścieżkę awaryjną zamiast po cichu startować z nowym magazynem.
- Co zrobić: sprawdź uprawnienia systemu plików lub konflikty, pozostaw stary stan nienaruszony i spróbuj ponownie po naprawieniu błędu.

`Matrix is installed from a custom path: ...`

- Znaczenie: Matrix jest przypięty do instalacji ze ścieżki, więc aktualizacje głównej linii nie zastępują go automatycznie standardowym pakietem Matrix z repozytorium.
- Co zrobić: zainstaluj ponownie przez `openclaw plugins install @openclaw/matrix`, gdy chcesz wrócić do domyślnego pluginu Matrix.

### Komunikaty odzyskiwania stanu zaszyfrowanego

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Znaczenie: zapisane klucze pokojów zostały pomyślnie przywrócone do nowego magazynu kryptograficznego.
- Co zrobić: zwykle nic.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Znaczenie: część starych kluczy pokojów istniała tylko w starym lokalnym magazynie i nigdy nie została przesłana do kopii zapasowej Matrix.
- Co zrobić: spodziewaj się, że część starej zaszyfrowanej historii pozostanie niedostępna, chyba że możesz ręcznie odzyskać te klucze z innego zweryfikowanego klienta.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Znaczenie: kopia zapasowa istnieje, ale OpenClaw nie mógł automatycznie odzyskać klucza odzyskiwania.
- Co zrobić: uruchom `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn, ale nie mógł go sprawdzić na tyle bezpiecznie, aby przygotować odzyskiwanie.
- Co zrobić: ponownie uruchom `openclaw doctor --fix`. Jeśli problem się powtórzy, zachowaj stary katalog stanu bez zmian i odzyskaj dane przy użyciu innego zweryfikowanego klienta Matrix oraz `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Znaczenie: OpenClaw wykrył konflikt klucza kopii zapasowej i odmówił automatycznego nadpisania bieżącego pliku recovery-key.
- Co zrobić: sprawdź, który klucz odzyskiwania jest poprawny, zanim ponownie spróbujesz jakiegokolwiek polecenia przywracania.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Znaczenie: to twarde ograniczenie starego formatu magazynu.
- Co zrobić: zapisane klucze nadal można przywrócić, ale lokalna zaszyfrowana historia może pozostać częściowo niedostępna.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Znaczenie: nowy plugin próbował przywrócić dane, ale Matrix zwrócił błąd.
- Co zrobić: uruchom `openclaw matrix verify backup status`, a następnie w razie potrzeby ponów próbę przez `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

### Ręczne komunikaty odzyskiwania

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Znaczenie: OpenClaw wie, że to urządzenie powinno mieć klucz kopii zapasowej, ale nie jest on na nim aktywny.
- Co zrobić: uruchom `openclaw matrix verify backup restore` albo przekaż `--recovery-key`, jeśli to potrzebne.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Znaczenie: to urządzenie nie ma obecnie zapisanego klucza odzyskiwania.
- Co zrobić: najpierw zweryfikuj urządzenie swoim kluczem odzyskiwania, a następnie przywróć kopię zapasową.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Znaczenie: zapisany klucz nie pasuje do aktywnej kopii zapasowej Matrix.
- Co zrobić: ponownie uruchom `openclaw matrix verify device "<your-recovery-key>"` z poprawnym kluczem.

Jeśli akceptujesz utratę nieodzyskiwalnej starej zaszyfrowanej historii, możesz zamiast tego zresetować
bieżącą bazę kopii zapasowej przez `openclaw matrix verify backup reset --yes`. Gdy
zapisany sekret kopii zapasowej jest uszkodzony, taki reset może również odtworzyć magazyn sekretów, aby nowy klucz kopii zapasowej mógł poprawnie załadować się po restarcie.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Znaczenie: kopia zapasowa istnieje, ale to urządzenie nie ufa jeszcze wystarczająco silnie łańcuchowi cross-signing.
- Co zrobić: ponownie uruchom `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Znaczenie: próbowałeś wykonać krok odzyskiwania bez podania klucza odzyskiwania tam, gdzie był wymagany.
- Co zrobić: uruchom polecenie ponownie z kluczem odzyskiwania.

`Invalid Matrix recovery key: ...`

- Znaczenie: podanego klucza nie udało się sparsować albo nie pasował do oczekiwanego formatu.
- Co zrobić: spróbuj ponownie, używając dokładnego klucza odzyskiwania z klienta Matrix lub pliku recovery-key.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Znaczenie: klucz został zastosowany, ale urządzenie nadal nie mogło ukończyć weryfikacji.
- Co zrobić: potwierdź, że użyłeś właściwego klucza i że cross-signing jest dostępny na koncie, a następnie spróbuj ponownie.

`Matrix key backup is not active on this device after loading from secret storage.`

- Znaczenie: magazyn sekretów nie utworzył aktywnej sesji kopii zapasowej na tym urządzeniu.
- Co zrobić: najpierw zweryfikuj urządzenie, a potem sprawdź ponownie przez `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Znaczenie: to urządzenie nie może przywracać danych z magazynu sekretów, dopóki weryfikacja urządzenia nie zostanie ukończona.
- Co zrobić: najpierw uruchom `openclaw matrix verify device "<your-recovery-key>"`.

### Komunikaty instalacji niestandardowego pluginu

`Matrix is installed from a custom path that no longer exists: ...`

- Znaczenie: rekord instalacji pluginu wskazuje na lokalną ścieżkę, która już nie istnieje.
- Co zrobić: zainstaluj ponownie przez `openclaw plugins install @openclaw/matrix`, albo jeśli uruchamiasz z checkoutu repozytorium, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Jeśli zaszyfrowana historia nadal nie wraca

Uruchom te sprawdzenia po kolei:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Jeśli kopia zapasowa przywróci się pomyślnie, ale w niektórych starych pokojach nadal brakuje historii, prawdopodobnie te brakujące klucze nigdy nie zostały zapisane w kopii zapasowej przez poprzedni plugin.

## Jeśli chcesz zacząć od nowa dla przyszłych wiadomości

Jeśli akceptujesz utratę nieodzyskiwalnej starej zaszyfrowanej historii i chcesz mieć tylko czystą bazę kopii zapasowej na przyszłość, uruchom te polecenia po kolei:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jeśli po tym urządzenie nadal nie jest zweryfikowane, dokończ weryfikację ze swojego klienta Matrix, porównując emoji SAS lub kody dziesiętne i potwierdzając, że są zgodne.

## Powiązane strony

- [Matrix](/pl/channels/matrix)
- [Doctor](/gateway/doctor)
- [Migracja](/install/migrating)
- [Plugins](/tools/plugin)
