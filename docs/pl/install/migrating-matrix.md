---
read_when:
    - Aktualizacja istniejącej instalacji Matrix
    - Migracja zaszyfrowanej historii Matrix i stanu urządzenia
summary: Jak OpenClaw aktualizuje poprzedni Plugin Matrix na miejscu, w tym ograniczenia odzyskiwania stanu szyfrowanego i ręczne kroki odzyskiwania.
title: Migracja Matrix
x-i18n:
    generated_at: "2026-04-24T09:17:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8210f5fbe476148736417eec29dfb5e27c132c6a0bb80753ce254129c14da4f
    source_path: install/migrating-matrix.md
    workflow: 15
---

Ta strona dotyczy aktualizacji z poprzedniego publicznego Pluginu `matrix` do bieżącej implementacji.

Dla większości użytkowników aktualizacja odbywa się na miejscu:

- Plugin pozostaje `@openclaw/matrix`
- kanał pozostaje `matrix`
- konfiguracja pozostaje w `channels.matrix`
- zbuforowane poświadczenia pozostają w `~/.openclaw/credentials/matrix/`
- stan runtime pozostaje w `~/.openclaw/matrix/`

Nie musisz zmieniać nazw kluczy konfiguracji ani ponownie instalować Pluginu pod nową nazwą.

## Co migracja robi automatycznie

Gdy gateway się uruchamia oraz gdy uruchamiasz [`openclaw doctor --fix`](/pl/gateway/doctor), OpenClaw próbuje automatycznie naprawić stary stan Matrix.
Zanim jakikolwiek wykonalny krok migracji Matrix zmieni stan na dysku, OpenClaw tworzy lub ponownie używa ukierunkowanej migawki odzyskiwania.

Gdy używasz `openclaw update`, dokładny wyzwalacz zależy od sposobu instalacji OpenClaw:

- instalacje ze źródła uruchamiają `openclaw doctor --fix` podczas procesu aktualizacji, a następnie domyślnie restartują gateway
- instalacje z menedżera pakietów aktualizują pakiet, uruchamiają nieinteraktywny przebieg doctora, a następnie polegają na domyślnym restarcie gateway, aby uruchamianie mogło zakończyć migrację Matrix
- jeśli używasz `openclaw update --no-restart`, migracja Matrix wykonywana podczas uruchamiania jest odkładana do czasu późniejszego uruchomienia `openclaw doctor --fix` i restartu gateway

Automatyczna migracja obejmuje:

- tworzenie lub ponowne użycie migawki przed migracją w `~/Backups/openclaw-migrations/`
- ponowne użycie zbuforowanych poświadczeń Matrix
- zachowanie tego samego wyboru konta i konfiguracji `channels.matrix`
- przeniesienie najstarszego płaskiego magazynu synchronizacji Matrix do bieżącej lokalizacji ograniczonej do konta
- przeniesienie najstarszego płaskiego magazynu kryptograficznego Matrix do bieżącej lokalizacji ograniczonej do konta, gdy konto docelowe można bezpiecznie rozwiązać
- wyodrębnienie wcześniej zapisanego klucza deszyfrowania kopii zapasowej kluczy pokojów Matrix ze starego magazynu rust crypto, gdy taki klucz istnieje lokalnie
- ponowne użycie najbardziej kompletnego istniejącego katalogu głównego magazynu token-hash dla tego samego konta Matrix, homeservera i użytkownika, gdy token dostępu później się zmieni
- skanowanie sąsiednich katalogów głównych magazynu token-hash w poszukiwaniu oczekujących metadanych przywracania stanu szyfrowanego, gdy token dostępu Matrix się zmienił, ale tożsamość konta/urządzenia pozostała taka sama
- przywrócenie zarchiwizowanych kluczy pokojów do nowego magazynu kryptograficznego przy następnym uruchomieniu Matrix

Szczegóły migawki:

- OpenClaw zapisuje plik znacznika w `~/.openclaw/matrix/migration-snapshot.json` po pomyślnym utworzeniu migawki, aby późniejsze przebiegi uruchamiania i naprawy mogły ponownie użyć tego samego archiwum.
- Te automatyczne migawki migracji Matrix tworzą kopię zapasową tylko konfiguracji + stanu (`includeWorkspace: false`).
- Jeśli Matrix ma tylko stan migracji z ostrzeżeniami, na przykład dlatego, że nadal brakuje `userId` lub `accessToken`, OpenClaw nie tworzy jeszcze migawki, ponieważ żadna mutacja Matrix nie jest jeszcze wykonalna.
- Jeśli krok tworzenia migawki zakończy się błędem, OpenClaw pomija migrację Matrix w tym przebiegu zamiast modyfikować stan bez punktu odzyskiwania.

Informacje o aktualizacjach wielokontowych:

- najstarszy płaski magazyn Matrix (`~/.openclaw/matrix/bot-storage.json` i `~/.openclaw/matrix/crypto/`) pochodził z układu pojedynczego magazynu, więc OpenClaw może przenieść go tylko do jednego rozwiązanego celu konta Matrix
- starsze magazyny Matrix już ograniczone do konta są wykrywane i przygotowywane dla każdego skonfigurowanego konta Matrix

## Czego migracja nie może zrobić automatycznie

Poprzedni publiczny Plugin Matrix **nie** tworzył automatycznie kopii zapasowych kluczy pokojów Matrix. Utrwalał lokalny stan kryptograficzny i żądał weryfikacji urządzenia, ale nie gwarantował, że klucze pokojów zostały zarchiwizowane na homeserverze.

To oznacza, że niektóre zaszyfrowane instalacje można migrować tylko częściowo.

OpenClaw nie może automatycznie odzyskać:

- wyłącznie lokalnych kluczy pokojów, które nigdy nie zostały zarchiwizowane
- stanu szyfrowanego, gdy docelowego konta Matrix nie można jeszcze rozwiązać, ponieważ `homeserver`, `userId` lub `accessToken` są nadal niedostępne
- automatycznej migracji jednego współdzielonego płaskiego magazynu Matrix, gdy skonfigurowano wiele kont Matrix, ale `channels.matrix.defaultAccount` nie jest ustawione
- niestandardowych instalacji ścieżki Pluginu, które są przypięte do ścieżki repozytorium zamiast do standardowego pakietu Matrix
- brakującego klucza odzyskiwania, gdy stary magazyn miał zarchiwizowane klucze, ale nie zachował lokalnie klucza deszyfrującego

Bieżący zakres ostrzeżeń:

- niestandardowe instalacje ścieżki Pluginu Matrix są zgłaszane zarówno przy uruchamianiu gateway, jak i przez `openclaw doctor`

Jeśli Twoja stara instalacja miała wyłącznie lokalną zaszyfrowaną historię, która nigdy nie została zarchiwizowana, niektóre starsze zaszyfrowane wiadomości mogą pozostać nieczytelne po aktualizacji.

## Zalecany przebieg aktualizacji

1. Zaktualizuj OpenClaw i Plugin Matrix w zwykły sposób.
   Preferuj zwykłe `openclaw update` bez `--no-restart`, aby uruchamianie mogło od razu zakończyć migrację Matrix.
2. Uruchom:

   ```bash
   openclaw doctor --fix
   ```

   Jeśli Matrix ma wykonalną pracę migracyjną, doctor najpierw utworzy lub ponownie użyje migawki przed migracją i wypisze ścieżkę archiwum.

3. Uruchom lub zrestartuj gateway.
4. Sprawdź bieżący stan weryfikacji i kopii zapasowej:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Jeśli OpenClaw informuje, że potrzebny jest klucz odzyskiwania, uruchom:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Jeśli to urządzenie nadal nie jest zweryfikowane, uruchom:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Jeśli celowo porzucasz nieodzyskiwalną starą historię i chcesz utworzyć nową bazę odniesienia kopii zapasowej dla przyszłych wiadomości, uruchom:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Jeśli kopia zapasowa kluczy po stronie serwera jeszcze nie istnieje, utwórz ją na potrzeby przyszłych odzyskiwań:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Jak działa migracja szyfrowania

Migracja szyfrowania to proces dwuetapowy:

1. Uruchamianie lub `openclaw doctor --fix` tworzy albo ponownie używa migawki przed migracją, jeśli migracja szyfrowania jest wykonalna.
2. Uruchamianie lub `openclaw doctor --fix` sprawdza stary magazyn kryptograficzny Matrix przez aktywną instalację Pluginu Matrix.
3. Jeśli zostanie znaleziony klucz deszyfrowania kopii zapasowej, OpenClaw zapisuje go do nowego przepływu klucza odzyskiwania i oznacza przywracanie kluczy pokojów jako oczekujące.
4. Przy następnym uruchomieniu Matrix OpenClaw automatycznie przywraca zarchiwizowane klucze pokojów do nowego magazynu kryptograficznego.

Jeśli stary magazyn zgłasza klucze pokojów, które nigdy nie zostały zarchiwizowane, OpenClaw ostrzega zamiast udawać, że odzyskiwanie się powiodło.

## Typowe komunikaty i ich znaczenie

### Komunikaty aktualizacji i wykrywania

`Matrix plugin upgraded in place.`

- Znaczenie: stary stan Matrix na dysku został wykryty i zmigrowany do bieżącego układu.
- Co robić: nic, chyba że te same dane wyjściowe zawierają również ostrzeżenia.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Znaczenie: OpenClaw utworzył archiwum odzyskiwania przed zmianą stanu Matrix.
- Co robić: zachowaj wypisaną ścieżkę archiwum, dopóki nie potwierdzisz, że migracja się powiodła.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Znaczenie: OpenClaw znalazł istniejący znacznik migawki migracji Matrix i ponownie użył tego archiwum zamiast tworzyć duplikat kopii zapasowej.
- Co robić: zachowaj wypisaną ścieżkę archiwum, dopóki nie potwierdzisz, że migracja się powiodła.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: istnieje stary stan Matrix, ale OpenClaw nie może go przypisać do bieżącego konta Matrix, ponieważ Matrix nie jest skonfigurowany.
- Co robić: skonfiguruj `channels.matrix`, a następnie uruchom ponownie `openclaw doctor --fix` lub zrestartuj gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: OpenClaw znalazł stary stan, ale nadal nie może ustalić dokładnego bieżącego katalogu głównego konta/urządzenia.
- Co robić: uruchom gateway raz z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix`, gdy będą już istniały zbuforowane poświadczenia.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski magazyn Matrix, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co robić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie uruchom ponownie `openclaw doctor --fix` lub zrestartuj gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Znaczenie: nowa lokalizacja ograniczona do konta ma już magazyn synchronizacji lub kryptograficzny, więc OpenClaw nie nadpisał go automatycznie.
- Co robić: zweryfikuj, że bieżące konto jest właściwe, zanim ręcznie usuniesz lub przeniesiesz kolidujący cel.

`Failed migrating Matrix legacy sync store (...)` lub `Failed migrating Matrix legacy crypto store (...)`

- Znaczenie: OpenClaw próbował przenieść stary stan Matrix, ale operacja systemu plików zakończyła się błędem.
- Co robić: sprawdź uprawnienia systemu plików i stan dysku, a następnie uruchom ponownie `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn Matrix, ale nie ma bieżącej konfiguracji Matrix, do której można go przypiąć.
- Co robić: skonfiguruj `channels.matrix`, a następnie uruchom ponownie `openclaw doctor --fix` lub zrestartuj gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: zaszyfrowany magazyn istnieje, ale OpenClaw nie może bezpiecznie ustalić, do którego bieżącego konta/urządzenia należy.
- Co robić: uruchom gateway raz z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix`, gdy dostępne będą zbuforowane poświadczenia.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski starszy magazyn kryptograficzny, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co robić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie uruchom ponownie `openclaw doctor --fix` lub zrestartuj gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Znaczenie: OpenClaw wykrył stary stan Matrix, ale migracja jest nadal zablokowana z powodu brakujących danych tożsamości lub poświadczeń.
- Co robić: dokończ logowanie Matrix lub konfigurację, a następnie uruchom ponownie `openclaw doctor --fix` lub zrestartuj gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany stan Matrix, ale nie mógł załadować pomocniczego entrypointu z Pluginu Matrix, który zwykle sprawdza ten magazyn.
- Co robić: przeinstaluj lub napraw Plugin Matrix (`openclaw plugins install @openclaw/matrix` albo `openclaw plugins install ./path/to/local/matrix-plugin` dla checkoutu repozytorium), a następnie uruchom ponownie `openclaw doctor --fix` lub zrestartuj gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Znaczenie: OpenClaw znalazł ścieżkę pliku pomocniczego, która wychodzi poza katalog główny Pluginu lub nie przechodzi kontroli granic Pluginu, więc odmówił jej importu.
- Co robić: przeinstaluj Plugin Matrix z zaufanej ścieżki, a następnie uruchom ponownie `openclaw doctor --fix` lub zrestartuj gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Znaczenie: OpenClaw odmówił zmiany stanu Matrix, ponieważ najpierw nie mógł utworzyć migawki odzyskiwania.
- Co robić: rozwiąż błąd kopii zapasowej, a następnie uruchom ponownie `openclaw doctor --fix` lub zrestartuj gateway.

`Failed migrating legacy Matrix client storage: ...`

- Znaczenie: fallback po stronie klienta Matrix znalazł stary płaski magazyn, ale przeniesienie zakończyło się błędem. OpenClaw przerywa teraz ten fallback zamiast po cichu uruchamiać się ze świeżym magazynem.
- Co robić: sprawdź uprawnienia systemu plików lub konflikty, zachowaj stary stan bez zmian i spróbuj ponownie po naprawieniu błędu.

`Matrix is installed from a custom path: ...`

- Znaczenie: Matrix jest przypięty do instalacji ścieżkowej, więc aktualizacje z głównej linii nie zastępują go automatycznie standardowym pakietem Matrix z repozytorium.
- Co robić: przeinstaluj za pomocą `openclaw plugins install @openclaw/matrix`, gdy chcesz wrócić do domyślnego Pluginu Matrix.

### Komunikaty odzyskiwania stanu szyfrowanego

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Znaczenie: zarchiwizowane klucze pokojów zostały pomyślnie przywrócone do nowego magazynu kryptograficznego.
- Co robić: zwykle nic.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Znaczenie: niektóre stare klucze pokojów istniały tylko w starym lokalnym magazynie i nigdy nie zostały przesłane do kopii zapasowej Matrix.
- Co robić: spodziewaj się, że część starej zaszyfrowanej historii pozostanie niedostępna, chyba że uda Ci się ręcznie odzyskać te klucze z innego zweryfikowanego klienta.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Znaczenie: kopia zapasowa istnieje, ale OpenClaw nie mógł automatycznie odzyskać klucza odzyskiwania.
- Co robić: uruchom `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn, ale nie mógł go wystarczająco bezpiecznie sprawdzić, aby przygotować odzyskiwanie.
- Co robić: uruchom ponownie `openclaw doctor --fix`. Jeśli problem się powtarza, zachowaj stary katalog stanu bez zmian i odzyskaj dane przy użyciu innego zweryfikowanego klienta Matrix oraz `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Znaczenie: OpenClaw wykrył konflikt kluczy kopii zapasowej i odmówił automatycznego nadpisania bieżącego pliku recovery-key.
- Co robić: zweryfikuj, który klucz odzyskiwania jest poprawny, zanim ponowisz jakiekolwiek polecenie przywracania.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Znaczenie: to twarde ograniczenie starego formatu przechowywania.
- Co robić: zarchiwizowane klucze nadal można przywrócić, ale wyłącznie lokalna zaszyfrowana historia może pozostać niedostępna.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Znaczenie: nowy Plugin próbował przywrócić dane, ale Matrix zwrócił błąd.
- Co robić: uruchom `openclaw matrix verify backup status`, a następnie w razie potrzeby ponów próbę przez `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

### Ręczne komunikaty odzyskiwania

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Znaczenie: OpenClaw wie, że powinieneś mieć klucz kopii zapasowej, ale nie jest on aktywny na tym urządzeniu.
- Co robić: uruchom `openclaw matrix verify backup restore` lub w razie potrzeby przekaż `--recovery-key`.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Znaczenie: to urządzenie nie ma obecnie zapisanego klucza odzyskiwania.
- Co robić: najpierw zweryfikuj urządzenie przy użyciu klucza odzyskiwania, a potem przywróć kopię zapasową.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Znaczenie: zapisany klucz nie pasuje do aktywnej kopii zapasowej Matrix.
- Co robić: uruchom ponownie `openclaw matrix verify device "<your-recovery-key>"` z poprawnym kluczem.

Jeśli akceptujesz utratę nieodzyskiwalnej starej zaszyfrowanej historii, możesz zamiast tego zresetować
bieżącą bazę odniesienia kopii zapasowej przez `openclaw matrix verify backup reset --yes`. Gdy
zapisany sekret kopii zapasowej jest uszkodzony, ten reset może również odtworzyć magazyn sekretów, aby
nowy klucz kopii zapasowej mógł poprawnie załadować się po restarcie.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Znaczenie: kopia zapasowa istnieje, ale to urządzenie nie ufa jeszcze wystarczająco silnie łańcuchowi cross-signing.
- Co robić: uruchom ponownie `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Znaczenie: próbowałeś wykonać krok odzyskiwania bez podania klucza odzyskiwania tam, gdzie był wymagany.
- Co robić: uruchom polecenie ponownie z kluczem odzyskiwania.

`Invalid Matrix recovery key: ...`

- Znaczenie: podanego klucza nie dało się sparsować albo nie pasował do oczekiwanego formatu.
- Co robić: spróbuj ponownie z dokładnym kluczem odzyskiwania z klienta Matrix lub pliku recovery-key.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Znaczenie: klucz został zastosowany, ale urządzenie nadal nie mogło ukończyć weryfikacji.
- Co robić: potwierdź, że użyto poprawnego klucza i że cross-signing jest dostępny na koncie, a następnie spróbuj ponownie.

`Matrix key backup is not active on this device after loading from secret storage.`

- Znaczenie: magazyn sekretów nie utworzył aktywnej sesji kopii zapasowej na tym urządzeniu.
- Co robić: najpierw zweryfikuj urządzenie, a następnie ponownie sprawdź przez `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Znaczenie: to urządzenie nie może przywracać danych z magazynu sekretów, dopóki nie zakończy się weryfikacja urządzenia.
- Co robić: najpierw uruchom `openclaw matrix verify device "<your-recovery-key>"`.

### Komunikaty niestandardowej instalacji Pluginu

`Matrix is installed from a custom path that no longer exists: ...`

- Znaczenie: rekord instalacji Pluginu wskazuje lokalną ścieżkę, która już nie istnieje.
- Co robić: przeinstaluj przez `openclaw plugins install @openclaw/matrix`, albo jeśli działasz z checkoutu repozytorium, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Jeśli zaszyfrowana historia nadal nie wraca

Uruchom te kontrole po kolei:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Jeśli kopia zapasowa przywróci się pomyślnie, ale w niektórych starych pokojach nadal brakuje historii, prawdopodobnie te brakujące klucze nigdy nie zostały zarchiwizowane przez poprzedni Plugin.

## Jeśli chcesz zacząć od nowa dla przyszłych wiadomości

Jeśli akceptujesz utratę nieodzyskiwalnej starej zaszyfrowanej historii i chcesz tylko czystej bazy odniesienia kopii zapasowej na przyszłość, uruchom te polecenia po kolei:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jeśli po tym urządzenie nadal nie jest zweryfikowane, dokończ weryfikację ze swojego klienta Matrix, porównując emoji SAS lub kody dziesiętne i potwierdzając, że się zgadzają.

## Powiązane strony

- [Matrix](/pl/channels/matrix)
- [Doctor](/pl/gateway/doctor)
- [Migrating](/pl/install/migrating)
- [Plugins](/pl/tools/plugin)
