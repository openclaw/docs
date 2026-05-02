---
read_when:
    - Uaktualnianie istniejącej instalacji Matrix
    - Migrowanie zaszyfrowanej historii Matrix i stanu urządzenia
summary: Jak OpenClaw aktualizuje poprzedni plugin Matrix w miejscu, w tym ograniczenia odzyskiwania zaszyfrowanego stanu i ręczne kroki odzyskiwania.
title: Migracja Matrixa
x-i18n:
    generated_at: "2026-05-02T22:16:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bc9b875fef0ae08978061a9fc7cbb076617009d79487ca8329e03076103b32c
    source_path: channels/matrix-migration.md
    workflow: 16
---

Uaktualnij poprzedni publiczny plugin `matrix` do bieżącej implementacji.

Dla większości użytkowników aktualizacja odbywa się w miejscu:

- plugin pozostaje `@openclaw/matrix`
- kanał pozostaje `matrix`
- konfiguracja pozostaje w `channels.matrix`
- zapisane w pamięci podręcznej poświadczenia pozostają w `~/.openclaw/credentials/matrix/`
- stan środowiska uruchomieniowego pozostaje w `~/.openclaw/matrix/`

Nie musisz zmieniać nazw kluczy konfiguracji ani ponownie instalować pluginu pod nową nazwą.

## Co migracja robi automatycznie

Gdy Gateway się uruchamia oraz gdy uruchamiasz [`openclaw doctor --fix`](/pl/gateway/doctor), OpenClaw próbuje automatycznie naprawić stary stan Matrix.
Zanim jakikolwiek wykonalny krok migracji Matrix zmodyfikuje stan na dysku, OpenClaw tworzy albo ponownie używa ukierunkowanej migawki odzyskiwania.

Gdy używasz `openclaw update`, dokładny wyzwalacz zależy od sposobu instalacji OpenClaw:

- instalacje ze źródeł uruchamiają `openclaw doctor --fix` podczas procesu aktualizacji, a następnie domyślnie restartują Gateway
- instalacje przez menedżer pakietów aktualizują pakiet, uruchamiają nieinteraktywny przebieg doctor, a następnie polegają na domyślnym restarcie Gateway, aby uruchomienie mogło zakończyć migrację Matrix
- jeśli użyjesz `openclaw update --no-restart`, migracja Matrix wspierana przez uruchomienie zostanie odroczona do czasu, gdy później uruchomisz `openclaw doctor --fix` i zrestartujesz Gateway

Automatyczna migracja obejmuje:

- utworzenie albo ponowne użycie migawki sprzed migracji w `~/Backups/openclaw-migrations/`
- ponowne użycie zapisanych w pamięci podręcznej poświadczeń Matrix
- zachowanie tego samego wyboru konta i konfiguracji `channels.matrix`
- przeniesienie najstarszego płaskiego magazynu synchronizacji Matrix do bieżącej lokalizacji z zakresem konta
- przeniesienie najstarszego płaskiego magazynu kryptograficznego Matrix do bieżącej lokalizacji z zakresem konta, gdy konto docelowe można bezpiecznie ustalić
- wyodrębnienie wcześniej zapisanego klucza deszyfrującego kopię zapasową kluczy pokojów Matrix ze starego magazynu kryptograficznego rust, gdy ten klucz istnieje lokalnie
- ponowne użycie najbardziej kompletnego istniejącego katalogu głównego magazynu skrótu tokenu dla tego samego konta Matrix, homeservera i użytkownika, gdy token dostępu później się zmieni
- skanowanie sąsiednich katalogów głównych magazynu skrótu tokenu w poszukiwaniu oczekujących metadanych przywracania stanu szyfrowanego, gdy token dostępu Matrix się zmienił, ale tożsamość konta/urządzenia pozostała ta sama
- przywrócenie zapisanych w kopii zapasowej kluczy pokojów do nowego magazynu kryptograficznego przy następnym uruchomieniu Matrix

Szczegóły migawki:

- OpenClaw zapisuje plik znacznika w `~/.openclaw/matrix/migration-snapshot.json` po pomyślnym utworzeniu migawki, aby późniejsze przebiegi uruchamiania i naprawy mogły ponownie użyć tego samego archiwum.
- Te automatyczne migawki migracji Matrix obejmują kopię zapasową tylko konfiguracji i stanu (`includeWorkspace: false`).
- Jeśli Matrix ma tylko stan migracji z ostrzeżeniami, na przykład dlatego, że nadal brakuje `userId` lub `accessToken`, OpenClaw nie tworzy jeszcze migawki, ponieważ żadna mutacja Matrix nie jest wykonalna.
- Jeśli krok migawki się nie powiedzie, OpenClaw pomija migrację Matrix w tym przebiegu zamiast modyfikować stan bez punktu odzyskiwania.

Informacje o aktualizacjach wielokontowych:

- najstarszy płaski magazyn Matrix (`~/.openclaw/matrix/bot-storage.json` i `~/.openclaw/matrix/crypto/`) pochodził z układu pojedynczego magazynu, więc OpenClaw może zmigrować go tylko do jednego ustalonego celu konta Matrix
- istniejące starsze magazyny Matrix z zakresem konta są wykrywane i przygotowywane osobno dla każdego skonfigurowanego konta Matrix

## Czego migracja nie może zrobić automatycznie

Poprzedni publiczny plugin Matrix **nie** tworzył automatycznie kopii zapasowych kluczy pokojów Matrix. Utrwalał lokalny stan kryptograficzny i żądał weryfikacji urządzenia, ale nie gwarantował, że klucze pokojów są zapisane w kopii zapasowej na homeserverze.

Oznacza to, że niektóre instalacje szyfrowane można zmigrować tylko częściowo.

OpenClaw nie może automatycznie odzyskać:

- lokalnych kluczy pokojów, które nigdy nie zostały zapisane w kopii zapasowej
- stanu szyfrowanego, gdy docelowego konta Matrix nie można jeszcze ustalić, ponieważ `homeserver`, `userId` lub `accessToken` nadal są niedostępne
- automatycznej migracji jednego współdzielonego płaskiego magazynu Matrix, gdy skonfigurowano wiele kont Matrix, ale `channels.matrix.defaultAccount` nie jest ustawione
- niestandardowych instalacji pluginu ze ścieżki, które są przypięte do ścieżki repozytorium zamiast standardowego pakietu Matrix
- brakującego klucza odzyskiwania, gdy stary magazyn miał klucze zapisane w kopii zapasowej, ale nie przechowywał lokalnie klucza deszyfrującego

Bieżący zakres ostrzeżeń:

- niestandardowe instalacje pluginu Matrix ze ścieżki są zgłaszane zarówno przez uruchamianie Gateway, jak i przez `openclaw doctor`

Jeśli stara instalacja miała lokalną szyfrowaną historię, która nigdy nie została zapisana w kopii zapasowej, część starszych szyfrowanych wiadomości może pozostać nieczytelna po aktualizacji.

## Zalecany przebieg aktualizacji

1. Zaktualizuj OpenClaw i plugin Matrix w normalny sposób.
   Preferuj zwykłe `openclaw update` bez `--no-restart`, aby uruchomienie mogło natychmiast zakończyć migrację Matrix.
2. Uruchom:

   ```bash
   openclaw doctor --fix
   ```

   Jeśli Matrix ma wykonalne zadania migracji, doctor najpierw utworzy albo ponownie użyje migawki sprzed migracji i wypisze ścieżkę archiwum.

3. Uruchom lub zrestartuj Gateway.
4. Sprawdź bieżący stan weryfikacji i kopii zapasowej:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Umieść klucz odzyskiwania dla naprawianego konta Matrix w zmiennej środowiskowej specyficznej dla konta. Dla jednego domyślnego konta wystarczy `MATRIX_RECOVERY_KEY`. Dla wielu kont użyj jednej zmiennej na konto, na przykład `MATRIX_RECOVERY_KEY_ASSISTANT`, i dodaj `--account assistant` do polecenia.

6. Jeśli OpenClaw poinformuje, że potrzebny jest klucz odzyskiwania, uruchom polecenie dla odpowiedniego konta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Jeśli to urządzenie nadal jest niezweryfikowane, uruchom polecenie dla odpowiedniego konta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Jeśli klucz odzyskiwania zostanie zaakceptowany, a kopia zapasowa jest użyteczna, ale `Cross-signing verified`
   nadal ma wartość `no`, dokończ samoweryfikację z innego klienta Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Zaakceptuj żądanie w innym kliencie Matrix, porównaj emoji albo liczby dziesiętne
   i wpisz `yes` tylko wtedy, gdy się zgadzają. Polecenie kończy się powodzeniem dopiero
   po tym, jak `Cross-signing verified` przyjmie wartość `yes`.

8. Jeśli celowo porzucasz niemożliwą do odzyskania starą historię i chcesz świeżej bazowej kopii zapasowej dla przyszłych wiadomości, uruchom:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Jeśli kopia zapasowa kluczy po stronie serwera jeszcze nie istnieje, utwórz ją na potrzeby przyszłego odzyskiwania:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Jak działa migracja szyfrowana

Migracja szyfrowana jest procesem dwuetapowym:

1. Uruchomienie albo `openclaw doctor --fix` tworzy lub ponownie używa migawki sprzed migracji, jeśli migracja szyfrowana jest wykonalna.
2. Uruchomienie albo `openclaw doctor --fix` sprawdza stary magazyn kryptograficzny Matrix przez aktywną instalację pluginu Matrix.
3. Jeśli zostanie znaleziony klucz deszyfrujący kopię zapasową, OpenClaw zapisuje go w nowym przepływie klucza odzyskiwania i oznacza przywracanie kluczy pokojów jako oczekujące.
4. Przy następnym uruchomieniu Matrix OpenClaw automatycznie przywraca zapisane w kopii zapasowej klucze pokojów do nowego magazynu kryptograficznego.

Jeśli stary magazyn zgłasza klucze pokojów, które nigdy nie zostały zapisane w kopii zapasowej, OpenClaw ostrzega zamiast udawać, że odzyskiwanie się powiodło.

## Typowe komunikaty i ich znaczenie

### Komunikaty aktualizacji i wykrywania

`Matrix plugin upgraded in place.`

- Znaczenie: stary stan Matrix na dysku został wykryty i zmigrowany do bieżącego układu.
- Co zrobić: nic, chyba że ten sam wynik zawiera również ostrzeżenia.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Znaczenie: OpenClaw utworzył archiwum odzyskiwania przed zmodyfikowaniem stanu Matrix.
- Co zrobić: zachowaj wypisaną ścieżkę archiwum, dopóki nie potwierdzisz, że migracja się powiodła.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Znaczenie: OpenClaw znalazł istniejący znacznik migawki migracji Matrix i ponownie użył tego archiwum zamiast tworzyć zduplikowaną kopię zapasową.
- Co zrobić: zachowaj wypisaną ścieżkę archiwum, dopóki nie potwierdzisz, że migracja się powiodła.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: istnieje stary stan Matrix, ale OpenClaw nie może przypisać go do bieżącego konta Matrix, ponieważ Matrix nie jest skonfigurowany.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: OpenClaw znalazł stary stan, ale nadal nie może określić dokładnego bieżącego katalogu głównego konta/urządzenia.
- Co zrobić: uruchom Gateway raz z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix` po pojawieniu się zapisanych w pamięci podręcznej poświadczeń.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski magazyn Matrix, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Znaczenie: nowa lokalizacja z zakresem konta ma już magazyn synchronizacji lub magazyn kryptograficzny, więc OpenClaw nie nadpisał jej automatycznie.
- Co zrobić: sprawdź, czy bieżące konto jest właściwe, zanim ręcznie usuniesz albo przeniesiesz kolidujący cel.

`Failed migrating Matrix legacy sync store (...)` albo `Failed migrating Matrix legacy crypto store (...)`

- Znaczenie: OpenClaw próbował przenieść stary stan Matrix, ale operacja systemu plików się nie powiodła.
- Co zrobić: sprawdź uprawnienia systemu plików i stan dysku, a następnie ponownie uruchom `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: OpenClaw znalazł stary szyfrowany magazyn Matrix, ale nie ma bieżącej konfiguracji Matrix, do której można go dołączyć.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: szyfrowany magazyn istnieje, ale OpenClaw nie może bezpiecznie zdecydować, do którego bieżącego konta/urządzenia należy.
- Co zrobić: uruchom Gateway raz z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix`, gdy zapisane w pamięci podręcznej poświadczenia będą dostępne.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski starszy magazyn kryptograficzny, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Znaczenie: OpenClaw wykrył stary stan Matrix, ale migracja nadal jest zablokowana przez brakujące dane tożsamości lub poświadczeń.
- Co zrobić: dokończ logowanie Matrix albo konfigurację, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Znaczenie: OpenClaw znalazł stary szyfrowany stan Matrix, ale nie mógł załadować punktu wejścia pomocnika z pluginu Matrix, który zwykle sprawdza ten magazyn.
- Co zrobić: zainstaluj ponownie albo napraw plugin Matrix (`openclaw plugins install @openclaw/matrix` albo `openclaw plugins install ./path/to/local/matrix-plugin` dla checkoutu repozytorium), a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Znaczenie: OpenClaw znalazł ścieżkę pliku pomocniczego, która wychodzi poza katalog główny pluginu lub nie przechodzi kontroli granic pluginu, więc odmówił jej zaimportowania.
- Co zrobić: zainstaluj ponownie plugin Matrix z zaufanej ścieżki, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Znaczenie: OpenClaw odmówił modyfikacji stanu Matrix, ponieważ najpierw nie mógł utworzyć migawki odzyskiwania.
- Co zrobić: rozwiąż błąd kopii zapasowej, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Failed migrating legacy Matrix client storage: ...`

- Znaczenie: awaryjny mechanizm po stronie klienta Matrix znalazł starą płaską pamięć, ale przeniesienie się nie powiodło. OpenClaw teraz przerywa ten mechanizm awaryjny zamiast po cichu uruchamiać się ze świeżym magazynem.
- Co zrobić: sprawdź uprawnienia systemu plików lub konflikty, zachowaj stary stan bez zmian i spróbuj ponownie po naprawieniu błędu.

`Matrix is installed from a custom path: ...`

- Znaczenie: Matrix jest przypięty do instalacji ze ścieżki, więc aktualizacje głównej linii nie zastępują go automatycznie standardowym pakietem Matrix z repozytorium.
- Co zrobić: zainstaluj ponownie za pomocą `openclaw plugins install @openclaw/matrix`, gdy chcesz wrócić do domyślnego pluginu Matrix.

### Komunikaty odzyskiwania stanu szyfrowanego

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Znaczenie: zapisane w kopii zapasowej klucze pokojów zostały pomyślnie przywrócone do nowego magazynu kryptograficznego.
- Co zrobić: zwykle nic.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Znaczenie: część starych kluczy pokojów istniała tylko w starym magazynie lokalnym i nigdy nie została przesłana do kopii zapasowej Matrix.
- Co zrobić: spodziewaj się, że część starej szyfrowanej historii pozostanie niedostępna, chyba że możesz ręcznie odzyskać te klucze z innego zweryfikowanego klienta.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Znaczenie: kopia zapasowa istnieje, ale OpenClaw nie mógł automatycznie odzyskać klucza odzyskiwania.
- Co zrobić: uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Znaczenie: OpenClaw znalazł stary szyfrowany magazyn, ale nie mógł sprawdzić go wystarczająco bezpiecznie, aby przygotować odzyskiwanie.
- Co zrobić: ponownie uruchom `openclaw doctor --fix`. Jeśli problem się powtarza, zachowaj stary katalog stanu bez zmian i odzyskaj dane przy użyciu innego zweryfikowanego klienta Matrix oraz `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Znaczenie: OpenClaw wykrył konflikt kluczy kopii zapasowej i odmówił automatycznego nadpisania bieżącego pliku klucza odzyskiwania.
- Co zrobić: sprawdź, który klucz odzyskiwania jest poprawny, zanim ponowisz jakiekolwiek polecenie przywracania.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Znaczenie: to twarde ograniczenie starego formatu magazynu.
- Co zrobić: klucze z kopii zapasowej nadal można przywrócić, ale szyfrowana historia dostępna tylko lokalnie może pozostać niedostępna.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Znaczenie: nowy plugin próbował przywrócić dane, ale Matrix zwrócił błąd.
- Co zrobić: uruchom `openclaw matrix verify backup status`, a następnie w razie potrzeby spróbuj ponownie za pomocą `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

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

Jeśli akceptujesz utratę nieodzyskiwalnej starej szyfrowanej historii, możesz zamiast tego zresetować
bieżącą bazę kopii zapasowej za pomocą `openclaw matrix verify backup reset --yes`. Gdy
zapisany sekret kopii zapasowej jest uszkodzony, ten reset może też odtworzyć magazyn sekretów, aby
nowy klucz kopii zapasowej mógł poprawnie wczytać się po restarcie.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Znaczenie: kopia zapasowa istnieje, ale to urządzenie jeszcze nie ufa wystarczająco mocno łańcuchowi podpisywania krzyżowego.
- Co zrobić: ustaw `MATRIX_RECOVERY_KEY` i uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Znaczenie: próbowano wykonać krok odzyskiwania bez podania klucza odzyskiwania, gdy był on wymagany.
- Co zrobić: uruchom polecenie ponownie z `--recovery-key-stdin`, na przykład `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Znaczenie: podanego klucza nie można było sparsować albo nie pasował do oczekiwanego formatu.
- Co zrobić: spróbuj ponownie z dokładnym kluczem odzyskiwania z klienta Matrix albo z pliku klucza odzyskiwania.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Znaczenie: OpenClaw mógł zastosować klucz odzyskiwania, ale Matrix nadal nie
  ustanowił pełnego zaufania tożsamości podpisywania krzyżowego dla tego urządzenia. Sprawdź
  wynik polecenia pod kątem `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` i `Device verified by owner`.
- Co zrobić: uruchom `openclaw matrix verify self`, zaakceptuj żądanie w innym
  kliencie Matrix, porównaj SAS i wpisz `yes` tylko wtedy, gdy się zgadza. Polecenie
  czeka na pełne zaufanie tożsamości Matrix przed zgłoszeniem powodzenia. Użyj
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  tylko wtedy, gdy celowo chcesz zastąpić bieżącą tożsamość podpisywania krzyżowego.

`Matrix key backup is not active on this device after loading from secret storage.`

- Znaczenie: magazyn sekretów nie utworzył aktywnej sesji kopii zapasowej na tym urządzeniu.
- Co zrobić: najpierw zweryfikuj urządzenie, a potem sprawdź ponownie za pomocą `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Znaczenie: to urządzenie nie może przywracać z magazynu sekretów, dopóki weryfikacja urządzenia nie zostanie ukończona.
- Co zrobić: najpierw uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Komunikaty instalacji niestandardowego pluginu

`Matrix is installed from a custom path that no longer exists: ...`

- Znaczenie: rekord instalacji pluginu wskazuje lokalną ścieżkę, która już nie istnieje.
- Co zrobić: zainstaluj ponownie za pomocą `openclaw plugins install @openclaw/matrix` albo, jeśli uruchamiasz z checkoutu repozytorium, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Jeśli szyfrowana historia nadal nie wraca

Uruchom te kontrole po kolei:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Jeśli kopia zapasowa przywraca się pomyślnie, ale w części starych pokojów nadal brakuje historii, brakujące klucze prawdopodobnie nigdy nie zostały zapisane w kopii zapasowej przez poprzedni plugin.

## Jeśli chcesz zacząć od nowa dla przyszłych wiadomości

Jeśli akceptujesz utratę nieodzyskiwalnej starej szyfrowanej historii i chcesz tylko mieć czystą bazę kopii zapasowej na przyszłość, uruchom te polecenia po kolei:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jeśli urządzenie nadal jest potem niezweryfikowane, dokończ weryfikację z klienta Matrix, porównując emoji SAS albo kody dziesiętne i potwierdzając, że się zgadzają.

## Powiązane

- [Matrix](/pl/channels/matrix): konfiguracja kanału.
- [Reguły push Matrix](/pl/channels/matrix-push-rules): kierowanie powiadomień.
- [Doctor](/pl/gateway/doctor): kontrola stanu i wyzwalacz automatycznej migracji.
- [Przewodnik migracji](/pl/install/migrating): wszystkie ścieżki migracji (przenoszenie maszyn, importy między systemami).
- [Plugins](/pl/tools/plugin): instalacja i rejestracja pluginów.
