---
read_when:
    - Aktualizowanie istniejącej instalacji Matrix
    - Migracja zaszyfrowanej historii Matrix i stanu urządzenia
summary: Jak OpenClaw uaktualnia istniejący Plugin Matrix na miejscu, w tym ograniczenia odzyskiwania zaszyfrowanego stanu i ręczne kroki odzyskiwania.
title: Migracja Matrix
x-i18n:
    generated_at: "2026-07-16T18:05:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

Uaktualnij poprzedni publiczny Plugin `matrix` do bieżącej implementacji.

W przypadku większości użytkowników aktualizacja odbywa się bez zmian:

- Plugin pozostaje `@openclaw/matrix`
- kanał pozostaje `matrix`
- konfiguracja pozostaje w `channels.matrix`
- poświadczenia w pamięci podręcznej pozostają w `~/.openclaw/credentials/matrix/`
- stan środowiska uruchomieniowego pozostaje w `~/.openclaw/matrix/`

Nie trzeba zmieniać nazw kluczy konfiguracji ani ponownie instalować Pluginu pod nową nazwą.
Główny pakiet `openclaw` nie zawiera już kodu środowiska uruchomieniowego Matrix ani zależności
od zestawu SDK Matrix. Jeśli `openclaw channels status` wskazuje, że Matrix jest skonfigurowany, ale
Plugin nie jest zainstalowany, uruchom `openclaw doctor --fix` lub
`openclaw plugins install @openclaw/matrix`; nie instaluj pakietów zestawu SDK Matrix
w głównym pakiecie OpenClaw.

## Co migracja wykonuje automatycznie

Migracja Matrix jest uruchamiana podczas wykonywania polecenia [`openclaw doctor --fix`](/pl/gateway/doctor), a także awaryjnie, gdy klient Matrix uruchamia się i nadal znajduje stan w plikach pomocniczych obok swojego magazynu SQLite.

Automatyczna migracja obejmuje:

- ponowne wykorzystanie poświadczeń Matrix z pamięci podręcznej
- zachowanie tego samego wyboru konta i konfiguracji `channels.matrix`
- importowanie stanu z plików pomocniczych (pamięci podręcznej synchronizacji `bot-storage.json`, `recovery-key.json`, `legacy-crypto-migration.json`, migawek IndexedDB) do stanu Matrix w SQLite; zmigrowane pliki są archiwizowane z przyrostkiem `.migrated`
- ponowne wykorzystanie najbardziej kompletnego istniejącego katalogu głównego magazynu skrótów tokenów dla tego samego konta Matrix, serwera domowego, użytkownika i urządzenia, gdy token dostępu zostanie później zmieniony

## Aktualizacja z wersji OpenClaw starszych niż 2026.4

Wersje do serii 2026.6 włącznie migrowały również pierwotny, płaski układ
pojedynczego magazynu Matrix (`~/.openclaw/matrix/bot-storage.json` oraz
`~/.openclaw/matrix/crypto/`) i przygotowywały odzyskiwanie zaszyfrowanego stanu ze
starego magazynu kryptograficznego Rust. Bieżące wersje nie obsługują już tej migracji.

Jeśli aktualizowana instalacja nadal używa płaskiego układu, najpierw
zaktualizuj ją do wersji z serii 2026.6, uruchom `openclaw doctor --fix` i uruchom Gateway
jeden raz, aby zmigrować płaski magazyn oraz wszystkie możliwe do odzyskania klucze pokojów. Następnie zaktualizuj
do najnowszej wersji.

Poprzedni publiczny Plugin Matrix **nie** tworzył automatycznie kopii zapasowych kluczy pokojów Matrix. Jeśli stara instalacja zawierała dostępną tylko lokalnie zaszyfrowaną historię, której nigdy nie uwzględniono w kopii zapasowej, niektóre starsze zaszyfrowane wiadomości mogą pozostać nieczytelne po aktualizacji niezależnie od ścieżki migracji.

## Zalecany przebieg aktualizacji

1. Zaktualizuj OpenClaw i Plugin Matrix w zwykły sposób.
2. Uruchom:

   ```bash
   openclaw doctor --fix
   ```

3. Uruchom lub zrestartuj Gateway.
4. Sprawdź bieżący stan weryfikacji i kopii zapasowej:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Umieść klucz odzyskiwania naprawianego konta Matrix w zmiennej środowiskowej właściwej dla tego konta. W przypadku jednego konta domyślnego wystarczy `MATRIX_RECOVERY_KEY`. W przypadku wielu kont użyj jednej zmiennej na konto, na przykład `MATRIX_RECOVERY_KEY_ASSISTANT`, i dodaj `--account assistant` do polecenia.

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

   Jeśli klucz odzyskiwania zostanie zaakceptowany i można użyć kopii zapasowej, ale `Cross-signing verified`
   nadal ma wartość `no`, dokończ samoweryfikację w innym kliencie Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Zaakceptuj żądanie w innym kliencie Matrix, porównaj emoji lub liczby dziesiętne
   i wpisz `yes` tylko wtedy, gdy są zgodne. Polecenie czeka na pełne
   zaufanie tożsamości Matrix przed zgłoszeniem powodzenia.

8. Jeśli celowo rezygnujesz z niemożliwej do odzyskania starej historii i chcesz utworzyć nową bazową kopię zapasową przyszłych wiadomości, uruchom:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Dodaj `--rotate-recovery-key` tylko wtedy, gdy stary klucz odzyskiwania nie powinien już umożliwiać odblokowania nowej kopii zapasowej.

9. Jeśli kopia zapasowa kluczy po stronie serwera jeszcze nie istnieje, utwórz ją na potrzeby przyszłego odzyskiwania:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Typowe komunikaty i ich znaczenie

`Failed migrating legacy Matrix client storage: ...`

- Znaczenie: mechanizm awaryjny po stronie klienta Matrix znalazł stan w plikach pomocniczych, ale import do SQLite nie powiódł się. OpenClaw wycofuje ukończone przeniesienia i przerywa ten mechanizm awaryjny, zamiast po cichu uruchamiać się z nowym magazynem.
- Co zrobić: sprawdź uprawnienia systemu plików lub konflikty, zachowaj stary stan bez zmian i ponów próbę po usunięciu błędu.

`Matrix is installed from a custom path: ...`

- Znaczenie: Matrix jest przypięty do instalacji ze ścieżki, dlatego aktualizacje głównej wersji nie zastępują go automatycznie domyślnym pakietem Matrix.
- Co zrobić: gdy chcesz wrócić do domyślnego Pluginu Matrix, zainstaluj go ponownie za pomocą `openclaw plugins install @openclaw/matrix`.

`Matrix is installed from a custom path that no longer exists: ...`

- Znaczenie: rekord instalacji Pluginu wskazuje lokalną ścieżkę, która już nie istnieje.
- Co zrobić: zainstaluj ponownie za pomocą `openclaw plugins install @openclaw/matrix` albo, jeśli uruchamiasz system z kopii roboczej repozytorium, `openclaw plugins install ./path/to/local/matrix-plugin`. Polecenie `openclaw doctor --fix` może również usunąć nieaktualne odwołania do Pluginu Matrix.

### Komunikaty dotyczące ręcznego odzyskiwania

Polecenia `openclaw matrix verify status` i `openclaw matrix verify backup status` wyświetlają wiersz `Backup issue:` wraz ze wskazówkami `Next steps:`, gdy kopia zapasowa kluczy pokojów nie działa prawidłowo na tym urządzeniu:

| Problem z kopią zapasową                                              | Znaczenie                                          | Rozwiązanie                                                                                                                               |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | brak danych, z których można przywrócić            | `openclaw matrix verify bootstrap`, aby utworzyć kopię zapasową kluczy pokojów                                                                            |
| `backup decryption key is not loaded on this device`                  | klucz istnieje, ale nie jest tutaj aktywny         | `openclaw matrix verify backup restore`; jeśli nadal nie można wczytać klucza, przekaż klucz odzyskiwania potokiem przez `--recovery-key-stdin`                |
| `backup decryption key could not be loaded from secret storage (...)` | wczytywanie magazynu sekretów nie powiodło się lub nie jest obsługiwane | przekaż klucz odzyskiwania potokiem: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`               |
| `backup key mismatch (...)`                                           | przechowywany klucz nie odpowiada aktywnej kopii zapasowej na serwerze | ponownie uruchom `verify backup restore --recovery-key-stdin` z kluczem aktywnej kopii zapasowej na serwerze albo `verify backup reset --yes`, aby utworzyć nową bazę |
| `backup signature chain is not trusted by this device`                | urządzenie nie ufa jeszcze łańcuchowi podpisywania krzyżowego | `verify device --recovery-key-stdin`, a następnie `verify self` z innego zweryfikowanego klienta, jeśli zaufanie nadal jest niepełne                        |
| `backup exists but is not active on this device`                      | kopia zapasowa na serwerze istnieje, sesja lokalna jest nieaktywna | najpierw zweryfikuj urządzenie, a następnie sprawdź ponownie za pomocą `openclaw matrix verify backup status`                                                         |
| `backup trust state could not be fully determined`                    | diagnostyka nie przyniosła jednoznacznego wyniku   | `openclaw matrix verify status --verbose`                                                                                                 |

Inne błędy odzyskiwania:

`Matrix recovery key is required`

- Znaczenie: podjęto próbę odzyskiwania bez podania klucza odzyskiwania, mimo że był wymagany.
- Co zrobić: uruchom polecenie ponownie z `--recovery-key-stdin`, na przykład `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Znaczenie: nie udało się przeanalizować podanego klucza lub nie był on zgodny z oczekiwanym formatem.
- Co zrobić: spróbuj ponownie, używając dokładnego klucza odzyskiwania z klienta Matrix lub eksportu klucza odzyskiwania.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Znaczenie: klucz odzyskiwania odblokował użyteczne dane kopii zapasowej, ale Matrix nie ustanowił pełnego zaufania tożsamości opartego na podpisywaniu krzyżowym dla tego urządzenia. Sprawdź w danych wyjściowych polecenia wartości `Recovery key accepted`, `Backup usable`, `Cross-signing verified` oraz `Device verified by owner`.
- Co zrobić: uruchom `openclaw matrix verify self`, zaakceptuj żądanie w innym kliencie Matrix, porównaj SAS i wpisz `yes` tylko wtedy, gdy jest zgodny. Użyj `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` tylko wtedy, gdy celowo chcesz zastąpić bieżącą tożsamość podpisywania krzyżowego.

Jeśli akceptujesz utratę niemożliwej do odzyskania starej zaszyfrowanej historii, możesz zamiast tego zresetować
bieżącą bazową kopię zapasową za pomocą `openclaw matrix verify backup reset --yes`. Gdy
przechowywany sekret kopii zapasowej jest uszkodzony, reset naprawia również magazyn sekretów, aby
po ponownym uruchomieniu można było prawidłowo wczytać nowy klucz kopii zapasowej.

## Jeśli zaszyfrowana historia nadal nie zostanie przywrócona

Wykonaj kolejno następujące sprawdzenia:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Jeśli kopia zapasowa zostanie pomyślnie przywrócona, ale w niektórych starych pokojach nadal brakuje historii, prawdopodobnie poprzedni Plugin nigdy nie utworzył kopii zapasowej tych brakujących kluczy.

## Jeśli chcesz zacząć od nowa dla przyszłych wiadomości

Jeśli akceptujesz utratę niemożliwej do odzyskania starej zaszyfrowanej historii i chcesz jedynie utworzyć od nowa bazową kopię zapasową na przyszłość, uruchom kolejno następujące polecenia:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jeśli urządzenie nadal nie jest zweryfikowane, dokończ weryfikację w kliencie Matrix, porównując emoji SAS lub kody dziesiętne i potwierdzając ich zgodność.

## Powiązane materiały

- [Matrix](/pl/channels/matrix): konfiguracja kanału.
- [Reguły wypychania Matrix](/pl/channels/matrix-push-rules): kierowanie powiadomień.
- [Doctor](/pl/gateway/doctor): kontrola stanu i wyzwalanie automatycznej migracji.
- [Przewodnik po migracji](/pl/install/migrating): wszystkie ścieżki migracji (przenoszenie między maszynami, import między systemami).
- [Pluginy](/pl/tools/plugin): instalowanie i rejestrowanie Pluginów.
