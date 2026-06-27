---
read_when:
    - Uaktualnianie istniejącej instalacji Matrix
    - Migrowanie zaszyfrowanej historii Matrix i stanu urządzenia
summary: Jak OpenClaw aktualizuje poprzedni Plugin Matrix w miejscu, w tym ograniczenia odzyskiwania zaszyfrowanego stanu i ręczne kroki odzyskiwania.
title: Migracja Matrix
x-i18n:
    generated_at: "2026-06-27T17:12:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

Uaktualnij poprzedni publiczny Plugin `matrix` do bieżącej implementacji.

Dla większości użytkowników aktualizacja odbywa się w miejscu:

- Plugin pozostaje `@openclaw/matrix`
- kanał pozostaje `matrix`
- konfiguracja pozostaje w `channels.matrix`
- zapisane w pamięci podręcznej dane uwierzytelniające pozostają w `~/.openclaw/credentials/matrix/`
- stan środowiska wykonawczego pozostaje w `~/.openclaw/matrix/`

Nie musisz zmieniać nazw kluczy konfiguracji ani ponownie instalować Plugin pod nową nazwą.
Główny pakiet `openclaw` nie zawiera już kodu środowiska wykonawczego Matrix ani zależności Matrix SDK. Jeśli `openclaw channels status` pokazuje, że Matrix jest skonfigurowany, ale po aktualizacji brakuje Plugin, uruchom `openclaw doctor --fix` albo `openclaw plugins install @openclaw/matrix`; nie instaluj pakietów Matrix SDK w głównym pakiecie OpenClaw.

## Co migracja wykonuje automatycznie

Gdy Gateway się uruchamia oraz gdy uruchamiasz [`openclaw doctor --fix`](/pl/gateway/doctor), OpenClaw próbuje automatycznie naprawić stary stan Matrix.
Zanim jakikolwiek wykonalny krok migracji Matrix zmodyfikuje stan na dysku, OpenClaw tworzy albo ponownie wykorzystuje ukierunkowaną migawkę odzyskiwania.

Gdy używasz `openclaw update`, dokładny wyzwalacz zależy od sposobu instalacji OpenClaw:

- instalacje ze źródeł uruchamiają `openclaw doctor --fix` podczas procesu aktualizacji, a następnie domyślnie restartują Gateway
- instalacje przez menedżera pakietów aktualizują pakiet, uruchamiają nieinteraktywny przebieg doctor, a następnie polegają na domyślnym restarcie Gateway, aby uruchamianie mogło dokończyć migrację Matrix
- jeśli używasz `openclaw update --no-restart`, migracja Matrix oparta na uruchamianiu zostaje odłożona do czasu, aż później uruchomisz `openclaw doctor --fix` i zrestartujesz Gateway

Automatyczna migracja obejmuje:

- utworzenie albo ponowne wykorzystanie migawki sprzed migracji w `~/Backups/openclaw-migrations/`
- ponowne użycie zapisanych w pamięci podręcznej danych uwierzytelniających Matrix
- zachowanie tego samego wyboru konta i konfiguracji `channels.matrix`
- przeniesienie najstarszego płaskiego magazynu synchronizacji Matrix do bieżącej lokalizacji o zakresie konta
- przeniesienie najstarszego płaskiego magazynu kryptograficznego Matrix do bieżącej lokalizacji o zakresie konta, gdy konto docelowe można bezpiecznie rozpoznać
- wyodrębnienie wcześniej zapisanego klucza odszyfrowywania kopii zapasowej kluczy pokoi Matrix ze starego magazynu kryptograficznego rust, gdy taki klucz istnieje lokalnie
- ponowne użycie najbardziej kompletnego istniejącego katalogu głównego magazynu z hashem tokenu dla tego samego konta Matrix, homeservera i użytkownika, gdy token dostępu zmieni się później
- skanowanie sąsiednich katalogów głównych magazynu z hashem tokenu w poszukiwaniu oczekujących metadanych przywracania zaszyfrowanego stanu, gdy token dostępu Matrix się zmienił, ale tożsamość konta/urządzenia pozostała taka sama
- przywrócenie zapisanych w kopii zapasowej kluczy pokoi do nowego magazynu kryptograficznego przy następnym uruchomieniu Matrix

Szczegóły migawki:

- OpenClaw zapisuje plik znacznika w `~/.openclaw/matrix/migration-snapshot.json` po udanej migawce, aby późniejsze przebiegi uruchamiania i naprawy mogły ponownie użyć tego samego archiwum.
- Te automatyczne migawki migracji Matrix zapisują tylko konfigurację i stan (`includeWorkspace: false`).
- Jeśli Matrix ma tylko ostrzegawczy stan migracji, na przykład dlatego, że nadal brakuje `userId` albo `accessToken`, OpenClaw nie tworzy jeszcze migawki, ponieważ żadna mutacja Matrix nie jest wykonalna.
- Jeśli krok migawki się nie powiedzie, OpenClaw pomija migrację Matrix w tym przebiegu zamiast modyfikować stan bez punktu odzyskiwania.

Informacje o aktualizacjach wielu kont:

- najstarszy płaski magazyn Matrix (`~/.openclaw/matrix/bot-storage.json` i `~/.openclaw/matrix/crypto/`) pochodził z układu jednego magazynu, więc OpenClaw może przenieść go tylko do jednego rozpoznanego celu konta Matrix
- starsze magazyny Matrix już o zakresie konta są wykrywane i przygotowywane osobno dla każdego skonfigurowanego konta Matrix

## Czego migracja nie może zrobić automatycznie

Poprzedni publiczny Plugin Matrix **nie** tworzył automatycznie kopii zapasowych kluczy pokoi Matrix. Utrwalał lokalny stan kryptograficzny i żądał weryfikacji urządzenia, ale nie gwarantował, że klucze pokoi zostały zapisane w kopii zapasowej na homeserverze.

Oznacza to, że niektóre zaszyfrowane instalacje można przenieść tylko częściowo.

OpenClaw nie może automatycznie odzyskać:

- kluczy pokoi dostępnych tylko lokalnie, które nigdy nie zostały zapisane w kopii zapasowej
- zaszyfrowanego stanu, gdy docelowego konta Matrix nie można jeszcze rozpoznać, ponieważ `homeserver`, `userId` albo `accessToken` nadal są niedostępne
- automatycznej migracji jednego współdzielonego płaskiego magazynu Matrix, gdy skonfigurowano wiele kont Matrix, ale `channels.matrix.defaultAccount` nie jest ustawione
- niestandardowych instalacji Plugin ze ścieżki, przypiętych do ścieżki repozytorium zamiast do standardowego pakietu Matrix
- brakującego klucza odzyskiwania, gdy stary magazyn miał klucze zapisane w kopii zapasowej, ale nie zachował lokalnie klucza odszyfrowywania

Bieżący zakres ostrzeżeń:

- niestandardowe instalacje Plugin Matrix ze ścieżki są zgłaszane zarówno przez uruchamianie Gateway, jak i `openclaw doctor`

Jeśli stara instalacja miała zaszyfrowaną historię dostępną tylko lokalnie, która nigdy nie została zapisana w kopii zapasowej, niektóre starsze zaszyfrowane wiadomości mogą pozostać nieczytelne po aktualizacji.

## Zalecany przebieg aktualizacji

1. Zaktualizuj OpenClaw i Plugin Matrix w zwykły sposób.
   Preferuj zwykłe `openclaw update` bez `--no-restart`, aby uruchamianie mogło od razu dokończyć migrację Matrix.
2. Uruchom:

   ```bash
   openclaw doctor --fix
   ```

   Jeśli Matrix ma wykonalną pracę migracyjną, doctor najpierw utworzy albo ponownie wykorzysta migawkę sprzed migracji i wypisze ścieżkę archiwum.

3. Uruchom albo zrestartuj Gateway.
4. Sprawdź bieżący stan weryfikacji i kopii zapasowej:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Umieść klucz odzyskiwania dla naprawianego konta Matrix w zmiennej środowiskowej właściwej dla konta. Dla jednego konta domyślnego `MATRIX_RECOVERY_KEY` jest w porządku. Dla wielu kont użyj jednej zmiennej na konto, na przykład `MATRIX_RECOVERY_KEY_ASSISTANT`, i dodaj `--account assistant` do polecenia.

6. Jeśli OpenClaw poinformuje, że potrzebny jest klucz odzyskiwania, uruchom polecenie dla odpowiedniego konta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Jeśli to urządzenie nadal nie jest zweryfikowane, uruchom polecenie dla odpowiedniego konta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Jeśli klucz odzyskiwania zostanie zaakceptowany i kopia zapasowa jest użyteczna, ale `Cross-signing verified` nadal ma wartość `no`, dokończ samoweryfikację z innego klienta Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Zaakceptuj żądanie w innym kliencie Matrix, porównaj emoji albo liczby dziesiętne i wpisz `yes` tylko wtedy, gdy się zgadzają. Polecenie kończy się powodzeniem dopiero po tym, jak `Cross-signing verified` zmieni się na `yes`.

8. Jeśli celowo porzucasz niemożliwą do odzyskania starą historię i chcesz świeżą bazę kopii zapasowej dla przyszłych wiadomości, uruchom:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Jeśli kopia zapasowa kluczy po stronie serwera jeszcze nie istnieje, utwórz ją na potrzeby przyszłego odzyskiwania:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Jak działa migracja szyfrowania

Migracja szyfrowania to proces dwuetapowy:

1. Uruchamianie albo `openclaw doctor --fix` tworzy albo ponownie wykorzystuje migawkę sprzed migracji, jeśli migracja szyfrowania jest wykonalna.
2. Uruchamianie albo `openclaw doctor --fix` sprawdza stary magazyn kryptograficzny Matrix przez aktywną instalację Plugin Matrix.
3. Jeśli zostanie znaleziony klucz odszyfrowywania kopii zapasowej, OpenClaw zapisuje go w nowym przepływie klucza odzyskiwania i oznacza przywracanie kluczy pokoi jako oczekujące.
4. Przy następnym uruchomieniu Matrix OpenClaw automatycznie przywraca zapisane w kopii zapasowej klucze pokoi do nowego magazynu kryptograficznego.

Jeśli stary magazyn zgłasza klucze pokoi, które nigdy nie zostały zapisane w kopii zapasowej, OpenClaw ostrzega zamiast udawać, że odzyskiwanie się powiodło.

## Typowe komunikaty i ich znaczenie

### Komunikaty aktualizacji i wykrywania

`Matrix plugin upgraded in place.`

- Znaczenie: stary stan Matrix na dysku został wykryty i przeniesiony do bieżącego układu.
- Co zrobić: nic, chyba że ten sam wynik zawiera też ostrzeżenia.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Znaczenie: OpenClaw utworzył archiwum odzyskiwania przed zmodyfikowaniem stanu Matrix.
- Co zrobić: zachowaj wypisaną ścieżkę archiwum do czasu potwierdzenia, że migracja się powiodła.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Znaczenie: OpenClaw znalazł istniejący znacznik migawki migracji Matrix i ponownie użył tego archiwum zamiast tworzyć duplikat kopii zapasowej.
- Co zrobić: zachowaj wypisaną ścieżkę archiwum do czasu potwierdzenia, że migracja się powiodła.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: istnieje stary stan Matrix, ale OpenClaw nie może odwzorować go na bieżące konto Matrix, ponieważ Matrix nie jest skonfigurowany.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: OpenClaw znalazł stary stan, ale nadal nie może określić dokładnego bieżącego katalogu głównego konta/urządzenia.
- Co zrobić: uruchom raz Gateway z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix`, gdy zapisane w pamięci podręcznej dane uwierzytelniające już istnieją.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski magazyn Matrix, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Znaczenie: nowa lokalizacja o zakresie konta ma już magazyn synchronizacji albo magazyn kryptograficzny, więc OpenClaw nie nadpisał go automatycznie.
- Co zrobić: sprawdź, czy bieżące konto jest właściwe, zanim ręcznie usuniesz albo przeniesiesz konfliktujący cel.

`Failed migrating Matrix legacy sync store (...)` albo `Failed migrating Matrix legacy crypto store (...)`

- Znaczenie: OpenClaw próbował przenieść stary stan Matrix, ale operacja na systemie plików się nie powiodła.
- Co zrobić: sprawdź uprawnienia systemu plików i stan dysku, a następnie ponownie uruchom `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn Matrix, ale nie ma bieżącej konfiguracji Matrix, do której można go dołączyć.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: zaszyfrowany magazyn istnieje, ale OpenClaw nie może bezpiecznie zdecydować, do którego bieżącego konta/urządzenia należy.
- Co zrobić: uruchom raz Gateway z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix`, gdy zapisane w pamięci podręcznej dane uwierzytelniające są dostępne.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski starszy magazyn kryptograficzny, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Znaczenie: OpenClaw wykrył stary stan Matrix, ale migracja nadal jest zablokowana przez brakujące dane tożsamości albo dane uwierzytelniające.
- Co zrobić: dokończ logowanie Matrix albo konfigurację, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany stan Matrix, ale nie mógł załadować punktu wejścia pomocnika z pluginu Matrix, który normalnie sprawdza ten magazyn.
- Co zrobić: zainstaluj ponownie lub napraw plugin Matrix (`openclaw plugins install @openclaw/matrix` albo `openclaw plugins install ./path/to/local/matrix-plugin` w przypadku checkoutu repozytorium), a następnie uruchom ponownie `openclaw doctor --fix` albo zrestartuj gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Znaczenie: OpenClaw znalazł ścieżkę pliku pomocnika, która wychodzi poza katalog główny pluginu albo nie przechodzi kontroli granic pluginu, więc odmówił jej zaimportowania.
- Co zrobić: zainstaluj ponownie plugin Matrix z zaufanej ścieżki, a następnie uruchom ponownie `openclaw doctor --fix` albo zrestartuj gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Znaczenie: OpenClaw odmówił zmodyfikowania stanu Matrix, ponieważ nie mógł najpierw utworzyć migawki odzyskiwania.
- Co zrobić: rozwiąż błąd kopii zapasowej, a następnie uruchom ponownie `openclaw doctor --fix` albo zrestartuj gateway.

`Failed migrating legacy Matrix client storage: ...`

- Znaczenie: awaryjny mechanizm po stronie klienta Matrix znalazł stary płaski magazyn, ale przeniesienie się nie powiodło. OpenClaw teraz przerywa ten mechanizm awaryjny zamiast po cichu uruchamiać się ze świeżym magazynem.
- Co zrobić: sprawdź uprawnienia systemu plików lub konflikty, zachowaj stary stan bez zmian i spróbuj ponownie po naprawieniu błędu.

`Matrix is installed from a custom path: ...`

- Znaczenie: Matrix jest przypięty do instalacji ze ścieżki, więc aktualizacje głównej linii nie zastąpią go automatycznie standardowym pakietem Matrix z repozytorium.
- Co zrobić: zainstaluj ponownie za pomocą `openclaw plugins install @openclaw/matrix`, gdy chcesz wrócić do domyślnego pluginu Matrix.

### Komunikaty odzyskiwania zaszyfrowanego stanu

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Znaczenie: klucze pokoi z kopii zapasowej zostały pomyślnie przywrócone do nowego magazynu kryptograficznego.
- Co zrobić: zwykle nic.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Znaczenie: niektóre stare klucze pokoi istniały tylko w starym lokalnym magazynie i nigdy nie zostały przesłane do kopii zapasowej Matrix.
- Co zrobić: należy się spodziewać, że część starej zaszyfrowanej historii pozostanie niedostępna, chyba że możesz ręcznie odzyskać te klucze z innego zweryfikowanego klienta.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Znaczenie: kopia zapasowa istnieje, ale OpenClaw nie mógł automatycznie odzyskać klucza odzyskiwania.
- Co zrobić: uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn, ale nie mógł sprawdzić go wystarczająco bezpiecznie, aby przygotować odzyskiwanie.
- Co zrobić: uruchom ponownie `openclaw doctor --fix`. Jeśli problem się powtórzy, pozostaw stary katalog stanu bez zmian i odzyskaj dane za pomocą innego zweryfikowanego klienta Matrix oraz `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Znaczenie: OpenClaw wykrył konflikt klucza kopii zapasowej i odmówił automatycznego nadpisania bieżącego pliku klucza odzyskiwania.
- Co zrobić: sprawdź, który klucz odzyskiwania jest poprawny, zanim ponownie spróbujesz wykonać polecenie przywracania.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Znaczenie: to twarde ograniczenie starego formatu magazynu.
- Co zrobić: klucze z kopii zapasowej nadal można przywrócić, ale lokalna zaszyfrowana historia może pozostać niedostępna.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Znaczenie: nowy plugin próbował przywrócić dane, ale Matrix zwrócił błąd.
- Co zrobić: uruchom `openclaw matrix verify backup status`, a następnie w razie potrzeby spróbuj ponownie z `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

### Komunikaty ręcznego odzyskiwania

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Znaczenie: OpenClaw wie, że powinieneś mieć klucz kopii zapasowej, ale nie jest on aktywny na tym urządzeniu.
- Co zrobić: uruchom `openclaw matrix verify backup restore` albo ustaw `MATRIX_RECOVERY_KEY` i w razie potrzeby uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Znaczenie: to urządzenie nie ma obecnie zapisanego klucza odzyskiwania.
- Co zrobić: ustaw `MATRIX_RECOVERY_KEY`, uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, a następnie przywróć kopię zapasową.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Znaczenie: zapisany klucz nie pasuje do aktywnej kopii zapasowej Matrix.
- Co zrobić: ustaw `MATRIX_RECOVERY_KEY` na poprawny klucz i uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Jeśli akceptujesz utratę niemożliwej do odzyskania starej zaszyfrowanej historii, możesz zamiast tego zresetować
bieżącą bazową kopię zapasową poleceniem `openclaw matrix verify backup reset --yes`. Gdy
zapisany sekret kopii zapasowej jest uszkodzony, ten reset może także odtworzyć magazyn sekretów, aby
nowy klucz kopii zapasowej mógł poprawnie załadować się po restarcie.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Znaczenie: kopia zapasowa istnieje, ale to urządzenie nie ufa jeszcze wystarczająco mocno łańcuchowi cross-signing.
- Co zrobić: ustaw `MATRIX_RECOVERY_KEY` i uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Znaczenie: podjęto próbę kroku odzyskiwania bez podania klucza odzyskiwania, choć był wymagany.
- Co zrobić: uruchom polecenie ponownie z `--recovery-key-stdin`, na przykład `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Znaczenie: podanego klucza nie można było sparsować albo nie pasował do oczekiwanego formatu.
- Co zrobić: spróbuj ponownie z dokładnym kluczem odzyskiwania z klienta Matrix albo pliku klucza odzyskiwania.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Znaczenie: OpenClaw mógł zastosować klucz odzyskiwania, ale Matrix nadal nie
  ustanowił pełnego zaufania tożsamości cross-signing dla tego urządzenia. Sprawdź
  wynik polecenia pod kątem `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` i `Device verified by owner`.
- Co zrobić: uruchom `openclaw matrix verify self`, zaakceptuj żądanie w innym
  kliencie Matrix, porównaj SAS i wpisz `yes` tylko wtedy, gdy się zgadza. To
  polecenie czeka na pełne zaufanie tożsamości Matrix przed zgłoszeniem sukcesu. Użyj
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  tylko wtedy, gdy celowo chcesz zastąpić bieżącą tożsamość cross-signing.

`Matrix key backup is not active on this device after loading from secret storage.`

- Znaczenie: magazyn sekretów nie utworzył aktywnej sesji kopii zapasowej na tym urządzeniu.
- Co zrobić: najpierw zweryfikuj urządzenie, a następnie sprawdź ponownie za pomocą `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Znaczenie: to urządzenie nie może przywrócić danych z magazynu sekretów, dopóki weryfikacja urządzenia nie zostanie ukończona.
- Co zrobić: najpierw uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Komunikaty instalacji niestandardowego pluginu

`Matrix is installed from a custom path that no longer exists: ...`

- Znaczenie: rekord instalacji pluginu wskazuje lokalną ścieżkę, która już nie istnieje.
- Co zrobić: zainstaluj ponownie za pomocą `openclaw plugins install @openclaw/matrix` albo, jeśli uruchamiasz z checkoutu repozytorium, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Jeśli zaszyfrowana historia nadal nie wraca

Uruchom te kontrole w kolejności:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Jeśli kopia zapasowa zostanie pomyślnie przywrócona, ale w niektórych starych pokojach nadal brakuje historii, brakujące klucze prawdopodobnie nigdy nie zostały zapisane w kopii zapasowej przez poprzedni plugin.

## Jeśli chcesz zacząć od nowa dla przyszłych wiadomości

Jeśli akceptujesz utratę niemożliwej do odzyskania starej zaszyfrowanej historii i chcesz tylko czystej bazowej kopii zapasowej na przyszłość, uruchom te polecenia w kolejności:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jeśli po tym urządzenie nadal nie jest zweryfikowane, dokończ weryfikację z klienta Matrix, porównując emoji SAS albo kody dziesiętne i potwierdzając, że się zgadzają.

## Powiązane

- [Matrix](/pl/channels/matrix): konfiguracja i ustawienie kanału.
- [Reguły push Matrix](/pl/channels/matrix-push-rules): routing powiadomień.
- [Doctor](/pl/gateway/doctor): kontrola stanu i wyzwalacz automatycznej migracji.
- [Przewodnik migracji](/pl/install/migrating): wszystkie ścieżki migracji (przenoszenie maszyn, importy między systemami).
- [Plugins](/pl/tools/plugin): instalacja i rejestracja pluginów.
