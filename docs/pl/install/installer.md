---
read_when:
    - Chcesz zrozumieć `openclaw.ai/install.sh`
    - Chcesz zautomatyzować instalacje (CI / bez interfejsu graficznego)
    - Chcesz zainstalować z kopii roboczej repozytorium GitHub
summary: Jak działają skrypty instalacyjne (install.sh, install-cli.sh, install.ps1), flagi i automatyzacja
title: Wewnętrzne mechanizmy instalatora
x-i18n:
    generated_at: "2026-07-16T18:36:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw jest dostarczany z trzema skryptami instalacyjnymi udostępnianymi z `openclaw.ai`.

| Skrypt                             | Platforma             | Działanie                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | W razie potrzeby instaluje Node, instaluje OpenClaw za pomocą npm (domyślnie) lub git i może uruchomić konfigurację początkową.       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instaluje Node i OpenClaw w lokalnym prefiksie (`~/.openclaw`) za pomocą npm lub git. Nie wymaga uprawnień administratora. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | W razie potrzeby instaluje Node, instaluje OpenClaw za pomocą npm (domyślnie) lub git i może uruchomić konfigurację początkową.       |

Wszystkie trzy obsługują Node **22.22.3+, 24.15+ lub 25.9+**; Node 24 jest domyślną wersją docelową dla nowych instalacji.

## Szybkie polecenia

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Jeśli instalacja zakończy się powodzeniem, ale w nowym terminalu nie można znaleźć `openclaw`, zobacz [rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Zalecany w przypadku większości interaktywnych instalacji w systemach macOS/Linux/WSL.
</Tip>

### Przebieg (install.sh)

<Steps>
  <Step title="Wykrywanie systemu operacyjnego">
    Obsługuje macOS i Linux (w tym WSL).
  </Step>
  <Step title="Domyślne zapewnienie Node.js 24">
    Sprawdza wersję Node i w razie potrzeby instaluje Node 24 (Homebrew w systemie macOS, skrypty konfiguracyjne NodeSource dla apt/dnf/yum w systemie Linux). W systemie macOS Homebrew jest instalowany tylko wtedy, gdy instalator potrzebuje go do instalacji Node lub Git. Obsługiwane są Node 22.22.3+, Node 24.15+ i Node 25.9+; Node 23 nie jest obsługiwany.
    W systemie Alpine/musl Linux instalator używa pakietów apk zamiast NodeSource i sprawdza rzeczywistą wersję podłączonej biblioteki SQLite. Bieżące stabilne strumienie pakietów Alpine mogą udostępniać dostatecznie nową wersję Node z podatną na ataki systemową biblioteką SQLite; w takim przypadku należy zamiast tego użyć oficjalnego kontenera `node:24-alpine` lub hosta opartego na glibc.
  </Step>
  <Step title="Zapewnienie Git">
    Jeśli brakuje Git, instaluje go za pomocą wykrytego menedżera pakietów, w tym Homebrew w systemie macOS i apk w systemie Alpine.
  </Step>
  <Step title="Instalacja OpenClaw">
    - Metoda `npm` (domyślna): globalna instalacja za pomocą npm
    - Metoda `git`: klonuje lub aktualizuje repozytorium, instaluje zależności za pomocą pnpm, kompiluje, a następnie instaluje skrypt opakowujący w `~/.local/bin/openclaw`

  </Step>
  <Step title="Zadania poinstalacyjne">
    - Ustala położenie właśnie zainstalowanego pliku wykonywalnego `openclaw` na potrzeby kolejnych poleceń
    - W przypadku nieskonfigurowanej instalacji uruchamia konfigurację początkową przed diagnostyką lub testami Gateway. Przy ustawieniu `--no-onboard` lub braku TTY wyświetla polecenie umożliwiające późniejsze dokończenie konfiguracji.
    - W przypadku skonfigurowanej instalacji w miarę możliwości odświeża i ponownie uruchamia załadowaną usługę Gateway oraz przeprowadza diagnostykę. Podczas aktualizacji aktualizuje pluginy, gdy jest to możliwe, albo wyświetla ręczne polecenie w uruchomieniu bez interfejsu, w którym włączono monity.
    - Po uruchomieniu `--verify` sprawdza zainstalowaną wersję, a kondycję Gateway sprawdza tylko wtedy, gdy istnieje konfiguracja.

  </Step>
</Steps>

### Wykrywanie kopii roboczej źródeł

W przypadku uruchomienia wewnątrz kopii roboczej OpenClaw (`package.json` + `pnpm-workspace.yaml`) skrypt proponuje:

- użycie kopii roboczej (`git`) albo
- użycie instalacji globalnej (`npm`)

Jeśli TTY nie jest dostępny i nie ustawiono metody instalacji, skrypt domyślnie wybiera `npm` i wyświetla ostrzeżenie.

Skrypt kończy działanie z kodem `2` w przypadku wybrania nieprawidłowej metody lub podania nieprawidłowych wartości `--install-method`.

### Przykłady (install.sh)

<Tabs>
  <Tab title="Domyślna">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Pominięcie konfiguracji początkowej">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalacja za pomocą Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Kopia robocza głównej gałęzi GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Przebieg próbny">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Weryfikacja po instalacji">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Opis flag">

| Flaga                                    | Opis                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Wybór metody instalacji (domyślnie: `npm`)                                  |
| `--npm`                                 | Skrót dla metody npm                                                 |
| `--git \| --github`                     | Skrót dla metody git                                                 |
| `--version <version\|dist-tag\|spec>`   | Wersja npm, znacznik dystrybucji lub specyfikacja pakietu (domyślnie: `latest`)              |
| `--beta`                                | Użycie znacznika dystrybucji beta, jeśli jest dostępny; w przeciwnym razie użycie `latest`              |
| `--git-dir \| --dir <path>`             | Katalog kopii roboczej (domyślnie: `~/openclaw`)                              |
| `--no-git-update`                       | Pominięcie `git pull` dla istniejącej kopii roboczej                                   |
| `--no-prompt`                           | Wyłączenie monitów                                                         |
| `--no-onboard`                          | Pominięcie konfiguracji początkowej                                                         |
| `--onboard`                             | Włączenie konfiguracji początkowej                                                       |
| `--verify`                              | Uruchomienie poinstalacyjnego testu kontrolnego (`--version`, kondycja Gateway, jeśli jest załadowany) |
| `--dry-run`                             | Wyświetlenie działań bez stosowania zmian                                  |
| `--verbose`                             | Włączenie danych wyjściowych debugowania (`set -x`, dzienniki npm na poziomie notice)                   |
| `--help \| -h`                          | Wyświetlenie instrukcji użycia                                                              |

  </Accordion>

  <Accordion title="Opis zmiennych środowiskowych">

| Zmienna                                          | Opis                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Metoda instalacji                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Wersja npm, znacznik dystrybucji lub specyfikacja pakietu                             |
| `OPENCLAW_BETA=0\|1`                              | Użycie wersji beta, jeśli jest dostępna                                              |
| `OPENCLAW_HOME=<path>`                            | Katalog bazowy stanu OpenClaw oraz domyślnych ścieżek git i konfiguracji początkowej |
| `OPENCLAW_GIT_DIR=<path>`                         | Katalog kopii roboczej                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Przełączanie aktualizacji git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | Wyłączenie monitów                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Uruchomienie poinstalacyjnego testu kontrolnego                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | Pominięcie konfiguracji początkowej                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Tryb przebiegu próbnego                                                       |
| `OPENCLAW_VERBOSE=1`                              | Tryb debugowania                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Poziom dziennika npm (domyślnie: `error`, ukrywa komunikaty npm o wycofaniu)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Przeznaczony do środowisk, w których wszystkie elementy mają znajdować się pod lokalnym prefiksem
(domyślnie `~/.openclaw`) bez zależności od systemowej instalacji Node. Domyślnie obsługuje instalacje
za pomocą npm, a także instalacje z kopii roboczej git w ramach tego samego przepływu prefiksu.
</Info>

### Przebieg (install-cli.sh)

<Steps>
  <Step title="Instalacja lokalnego środowiska uruchomieniowego Node">
    Pobiera przypisane archiwum tar obsługiwanej wersji Node LTS (wersja jest osadzona w skrypcie i aktualizowana niezależnie; domyślnie `24.15.0`) do `<prefix>/tools/node-v<version>` i weryfikuje sumę SHA-256.
    Linux ARMv7 używa Node `22.22.3`, ponieważ oficjalne pliki binarne Node 24+ dla ARMv7 są niedostępne.
    W systemie Alpine/musl Linux, dla którego Node nie publikuje archiwów tar zgodnych z przypisaną wersją środowiska uruchomieniowego, instaluje `nodejs` i `npm` za pomocą `apk`, a następnie sprawdza zarówno Node, jak i rzeczywiście podłączoną bibliotekę SQLite. Bieżące stabilne strumienie pakietów Alpine mogą nadal łączyć podatną na ataki bibliotekę SQLite nawet z dostatecznie nową wersją Node; jeśli kontrola bezpieczeństwa odrzuci pakiet, należy użyć oficjalnego kontenera `node:24-alpine` lub hosta opartego na glibc.
  </Step>
  <Step title="Zapewnienie Git">
    Jeśli brakuje Git, podejmuje próbę instalacji za pomocą apt/dnf/yum/apk w systemie Linux lub Homebrew w systemie macOS.
  </Step>
  <Step title="Instalacja OpenClaw pod prefiksem">
    - Metoda `npm` (domyślna): instaluje pod prefiksem za pomocą npm, a następnie zapisuje skrypt opakowujący w `<prefix>/bin/openclaw`
    - Metoda `git`: klonuje lub aktualizuje kopię roboczą (domyślnie `~/openclaw`) i również zapisuje skrypt opakowujący w `<prefix>/bin/openclaw`

  </Step>
  <Step title="Odświeżenie załadowanej usługi Gateway">
    Jeśli usługa Gateway jest już załadowana z tego samego prefiksu, skrypt uruchamia
    `openclaw gateway install --force`, co aktywuje usługę zastępczą,
    a następnie w miarę możliwości sprawdza kondycję Gateway.
  </Step>
</Steps>

### Przykłady (install-cli.sh)

<Tabs>
  <Tab title="Domyślna">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Niestandardowy prefiks i wersja">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Instalacja za pomocą Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Dane wyjściowe JSON dla automatyzacji">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Uruchomienie konfiguracji początkowej">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Opis flag">

| Flaga                                   | Opis                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Prefiks instalacji (domyślnie: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | Wybór metody instalacji (domyślnie: `npm`)                                          |
| `--npm`                                 | Skrót dla metody npm                                                         |
| `--git \| --github`                     | Skrót dla metody git                                                         |
| `--git-dir \| --dir <path>`             | Katalog kopii roboczej Git (domyślnie: `~/openclaw`)                                  |
| `--version <ver>`                       | Wersja lub znacznik dist-tag OpenClaw (domyślnie: `latest`)                                |
| `--node-version <ver>`                  | Wersja Node (domyślnie: `24.15.0`; `22.22.3` w systemie Linux ARMv7)                     |
| `--json`                                | Emitowanie zdarzeń NDJSON                                                              |
| `--onboard`                             | Uruchomienie `openclaw onboard` po instalacji                                            |
| `--no-onboard`                          | Pominięcie konfiguracji początkowej (domyślnie)                                                       |
| `--set-npm-prefix`                      | W systemie Linux wymuszenie prefiksu npm `~/.npm-global`, jeśli bieżący prefiks nie jest zapisywalny |
| `--help \| -h`                          | Wyświetlenie informacji o użyciu                                                                      |

  </Accordion>

  <Accordion title="Dokumentacja zmiennych środowiskowych">

| Zmienna                                    | Opis                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Prefiks instalacji                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metoda instalacji                                                     |
| `OPENCLAW_VERSION=<ver>`                    | Wersja lub znacznik dist-tag OpenClaw                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Wersja Node                                                       |
| `OPENCLAW_HOME=<path>`                      | Katalog bazowy stanu OpenClaw oraz domyślnych ścieżek git/konfiguracji początkowej |
| `OPENCLAW_GIT_DIR=<path>`                   | Katalog kopii roboczej Git dla instalacji metodą git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Przełączanie aktualizacji git dla istniejących kopii roboczych                          |
| `OPENCLAW_NO_ONBOARD=1`                     | Pominięcie konfiguracji początkowej                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Poziom rejestrowania npm (domyślnie: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` i inne specyfikacje źródłowe GitHub nie są prawidłowymi celami `--version` dla instalacji npm. Zamiast tego należy użyć `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Przebieg (install.ps1)

<Steps>
  <Step title="Zapewnienie środowiska PowerShell i Windows">
    Wymaga PowerShell 5+.
  </Step>
  <Step title="Domyślne zapewnienie Node.js 24">
    Jeśli go brakuje, podejmowana jest próba instalacji kolejno przez winget, Chocolatey i Scoop. Jeśli żaden menedżer pakietów nie jest dostępny, skrypt pobiera oficjalne archiwum zip Node.js 24 dla systemu Windows do `%LOCALAPPDATA%\OpenClaw\deps\portable-node` i dodaje je do zmiennej PATH bieżącego procesu i użytkownika. Obsługiwane są Node 22.22.3+, Node 24.15+ i Node 25.9+; Node 23 nie jest obsługiwany.
  </Step>
  <Step title="Instalacja OpenClaw">
    - Metoda `npm` (domyślna): globalna instalacja npm przy użyciu wybranego `-Tag`, uruchamiana z zapisywalnego katalogu tymczasowego instalatora, dzięki czemu działają również powłoki otwarte w chronionych folderach, takich jak `C:\`
    - Metoda `git`: klonowanie/aktualizacja repozytorium, instalacja/kompilacja za pomocą pnpm oraz instalacja skryptu opakowującego w `%USERPROFILE%\.local\bin\openclaw.cmd`. Jeśli brakuje Git, skrypt konfiguruje lokalny dla użytkownika MinGit w `%LOCALAPPDATA%\OpenClaw\deps\portable-git` i dodaje go do zmiennej PATH bieżącego procesu i użytkownika.

  </Step>
  <Step title="Zadania poinstalacyjne">
    - W miarę możliwości dodaje wymagany katalog plików wykonywalnych do zmiennej PATH użytkownika
    - Podejmuje próbę odświeżenia załadowanej usługi Gateway (`openclaw gateway install --force`, a następnie ponowne uruchomienie)
    - Uruchamia `openclaw doctor --non-interactive` podczas aktualizacji i instalacji metodą git (w miarę możliwości)

  </Step>
  <Step title="Obsługa niepowodzeń">
    Instalacje za pomocą `iwr ... | iex` i bloku skryptu zgłaszają błąd kończący działanie polecenia bez zamykania bieżącej sesji PowerShell. Bezpośrednie instalacje `powershell -File` / `pwsh -File` nadal kończą się niezerowym kodem na potrzeby automatyzacji.
  </Step>
</Steps>

### Przykłady (install.ps1)

<Tabs>
  <Tab title="Domyślna">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalacja metodą Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Kopia robocza głównej gałęzi GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Niestandardowy katalog Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Przebieg próbny">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Dokumentacja flag">

| Flaga                       | Opis                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metoda instalacji (domyślnie: `npm`)                            |
| `-Tag <tag\|version\|spec>` | Znacznik dist-tag, wersja lub specyfikacja pakietu npm (domyślnie: `latest`) |
| `-GitDir <path>`            | Katalog kopii roboczej (domyślnie: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Pominięcie konfiguracji początkowej                                            |
| `-NoGitUpdate`              | Pominięcie `git pull`                                            |
| `-DryRun`                   | Tylko wyświetlenie działań                                         |

  </Accordion>

  <Accordion title="Dokumentacja zmiennych środowiskowych">

| Zmienna                          | Opis               |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metoda instalacji     |
| `OPENCLAW_GIT_DIR=<path>`          | Katalog kopii roboczej |
| `OPENCLAW_NO_ONBOARD=1`            | Pominięcie konfiguracji początkowej    |
| `OPENCLAW_GIT_UPDATE=0`            | Wyłączenie git pull   |
| `OPENCLAW_DRY_RUN=1`               | Tryb przebiegu próbnego       |

  </Accordion>
</AccordionGroup>

<Note>
Jeśli użyto `-InstallMethod git`, a Git nie jest zainstalowany, skrypt podejmuje próbę skonfigurowania lokalnego dla użytkownika MinGit przed wyświetleniem odnośnika do Git for Windows.
</Note>

---

## CI i automatyzacja

Aby zapewnić przewidywalne uruchomienia, należy używać nieinteraktywnych flag/zmiennych środowiskowych.

<Tabs>
  <Tab title="install.sh (nieinteraktywna instalacja npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (nieinteraktywna instalacja git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (pominięcie konfiguracji początkowej)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Dlaczego Git jest wymagany?">
    Git jest wymagany dla metody instalacji `git`. W przypadku instalacji `npm` Git jest nadal sprawdzany/instalowany, aby uniknąć błędów `spawn git ENOENT`, gdy zależności używają adresów URL git.
  </Accordion>

  <Accordion title="Dlaczego npm zgłasza EACCES w systemie Linux?">
    W niektórych konfiguracjach systemu Linux globalny prefiks npm wskazuje ścieżki należące do użytkownika root. `install.sh` może zmienić prefiks na `~/.npm-global` i dopisać instrukcje eksportu PATH do plików rc powłoki (jeśli te pliki istnieją).
  </Accordion>

  <Accordion title='Windows: „npm error spawn git / ENOENT”'>
    Należy ponownie uruchomić instalator, aby mógł skonfigurować lokalny dla użytkownika MinGit, albo zainstalować Git for Windows i ponownie otworzyć PowerShell.
  </Accordion>

  <Accordion title='Windows: „openclaw is not recognized”'>
    Należy uruchomić `npm config get prefix` i dodać ten katalog do zmiennej PATH użytkownika (w systemie Windows przyrostek `\bin` nie jest potrzebny), a następnie ponownie otworzyć PowerShell.
  </Accordion>

  <Accordion title="Windows: jak uzyskać szczegółowe dane wyjściowe instalatora">
    `install.ps1` nie udostępnia przełącznika `-Verbose`.
    Do diagnostyki na poziomie skryptu należy użyć śledzenia PowerShell:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="Nie znaleziono openclaw po instalacji">
    Zwykle jest to problem ze zmienną PATH. Zobacz [rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Aktualizowanie](/pl/install/updating)
- [Odinstalowywanie](/pl/install/uninstall)
