---
read_when:
    - Chcesz zrozumieć `openclaw.ai/install.sh`
    - Chcesz zautomatyzować instalacje (CI / bez interfejsu graficznego)
    - Chcesz zainstalować z kopii roboczej repozytorium GitHub
summary: Jak działają skrypty instalacyjne (install.sh, install-cli.sh, install.ps1), flagi i automatyzacja
title: Wewnętrzne mechanizmy instalatora
x-i18n:
    generated_at: "2026-07-12T15:16:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw udostępnia trzy skrypty instalacyjne, serwowane z `openclaw.ai`.

| Skrypt                             | Platforma             | Działanie                                                                                                     |
| ---------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL   | W razie potrzeby instaluje Node, instaluje OpenClaw przez npm (domyślnie) lub git i może uruchomić konfigurację początkową. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL   | Instaluje Node i OpenClaw w lokalnym prefiksie (`~/.openclaw`) przez npm lub git. Nie wymaga uprawnień roota. |
| [`install.ps1`](#installps1)       | Windows (PowerShell)  | W razie potrzeby instaluje Node, instaluje OpenClaw przez npm (domyślnie) lub git i może uruchomić konfigurację początkową. |

Wszystkie trzy obsługują Node **22.19+, 23.11+ lub 24+**; Node 24 jest domyślną wersją docelową dla nowych instalacji.

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
Jeśli instalacja zakończy się powodzeniem, ale polecenie `openclaw` nie zostanie znalezione w nowym terminalu, zobacz [rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Zalecany do większości interaktywnych instalacji w systemach macOS/Linux/WSL.
</Tip>

### Przebieg (install.sh)

<Steps>
  <Step title="Wykrywanie systemu operacyjnego">
    Obsługuje systemy macOS i Linux (w tym WSL).
  </Step>
  <Step title="Domyślne zapewnienie Node.js 24">
    Sprawdza wersję Node i w razie potrzeby instaluje Node 24 (Homebrew w systemie macOS, skrypty konfiguracyjne NodeSource w systemach Linux używających apt/dnf/yum). W systemie macOS Homebrew jest instalowany tylko wtedy, gdy instalator potrzebuje go do instalacji Node lub Git. Wersje Node 22.19+ i 23.11+ pozostają obsługiwane w celu zachowania zgodności.
    W systemie Alpine/musl Linux instalator używa pakietów apk zamiast NodeSource; skonfigurowane repozytoria Alpine muszą udostępniać obsługiwaną wersję Node (w chwili pisania dokumentacji Alpine 3.21 lub nowszy).
  </Step>
  <Step title="Zapewnienie Git">
    Jeśli Git nie jest dostępny, instaluje go za pomocą wykrytego menedżera pakietów, w tym Homebrew w systemie macOS i apk w systemie Alpine.
  </Step>
  <Step title="Instalacja OpenClaw">
    - Metoda `npm` (domyślna): globalna instalacja npm
    - Metoda `git`: klonuje lub aktualizuje repozytorium, instaluje zależności za pomocą pnpm, kompiluje, a następnie instaluje skrypt opakowujący w `~/.local/bin/openclaw`

  </Step>
  <Step title="Zadania poinstalacyjne">
    - Ustala ścieżkę do właśnie zainstalowanego pliku wykonywalnego `openclaw` na potrzeby kolejnych poleceń
    - W przypadku nieskonfigurowanej instalacji rozpoczyna konfigurację początkową przed uruchomieniem diagnostyki lub testów Gateway. Przy użyciu `--no-onboard` lub braku TTY wyświetla polecenie pozwalające później dokończyć konfigurację.
    - W przypadku skonfigurowanej instalacji podejmuje próbę odświeżenia i ponownego uruchomienia załadowanej usługi Gateway oraz uruchamia diagnostykę. Podczas aktualizacji w miarę możliwości aktualizuje pluginy albo wyświetla ręczne polecenie w działającym bez interfejsu graficznego trybie z włączonymi monitami.
    - Po uruchomieniu z opcją `--verify` sprawdza zainstalowaną wersję, a stan Gateway sprawdza tylko wtedy, gdy konfiguracja już istnieje.

  </Step>
</Steps>

### Wykrywanie kopii roboczej źródeł

Jeśli skrypt zostanie uruchomiony wewnątrz kopii roboczej OpenClaw (`package.json` + `pnpm-workspace.yaml`), oferuje:

- użycie kopii roboczej (`git`) albo
- użycie instalacji globalnej (`npm`)

Jeśli TTY nie jest dostępny i nie określono metody instalacji, domyślnie wybiera `npm` i wyświetla ostrzeżenie.

Skrypt kończy działanie z kodem `2` w przypadku wybrania nieprawidłowej metody lub podania nieprawidłowej wartości `--install-method`.

### Przykłady (install.sh)

<Tabs>
  <Tab title="Domyślna">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Pomiń konfigurację początkową">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalacja przez Git">
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

| Flaga                                   | Opis                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Wybór metody instalacji (domyślnie: `npm`)                              |
| `--npm`                                 | Skrót do metody npm                                                     |
| `--git \| --github`                     | Skrót do metody git                                                     |
| `--version <version\|dist-tag\|spec>`   | Wersja npm, znacznik dystrybucji lub specyfikacja pakietu (domyślnie: `latest`) |
| `--beta`                                | Użycie znacznika dystrybucji beta, jeśli jest dostępny; w przeciwnym razie użycie `latest` |
| `--git-dir \| --dir <path>`             | Katalog kopii roboczej (domyślnie: `~/openclaw`)                        |
| `--no-git-update`                       | Pominięcie `git pull` dla istniejącej kopii roboczej                     |
| `--no-prompt`                           | Wyłączenie monitów                                                      |
| `--no-onboard`                          | Pominięcie konfiguracji początkowej                                     |
| `--onboard`                             | Włączenie konfiguracji początkowej                                      |
| `--verify`                              | Uruchomienie poinstalacyjnego testu podstawowego (`--version`, stan Gateway, jeśli jest załadowany) |
| `--dry-run`                             | Wyświetlenie działań bez wprowadzania zmian                             |
| `--verbose`                             | Włączenie danych wyjściowych debugowania (`set -x`, dzienniki npm na poziomie notice) |
| `--help \| -h`                          | Wyświetlenie instrukcji użycia                                          |

  </Accordion>

  <Accordion title="Opis zmiennych środowiskowych">

| Zmienna                                           | Opis                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Metoda instalacji                                                  |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Wersja npm, znacznik dystrybucji lub specyfikacja pakietu          |
| `OPENCLAW_BETA=0\|1`                              | Użycie wersji beta, jeśli jest dostępna                             |
| `OPENCLAW_HOME=<path>`                            | Katalog bazowy stanu OpenClaw oraz domyślnych ścieżek git i konfiguracji początkowej |
| `OPENCLAW_GIT_DIR=<path>`                         | Katalog kopii roboczej                                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Włączanie lub wyłączanie aktualizacji git                           |
| `OPENCLAW_NO_PROMPT=1`                            | Wyłączenie monitów                                                  |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Uruchomienie poinstalacyjnego testu podstawowego                    |
| `OPENCLAW_NO_ONBOARD=1`                           | Pominięcie konfiguracji początkowej                                 |
| `OPENCLAW_DRY_RUN=1`                              | Tryb przebiegu próbnego                                             |
| `OPENCLAW_VERBOSE=1`                              | Tryb debugowania                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Poziom dziennika npm (domyślnie: `error`, ukrywa komunikaty npm o wycofaniu funkcji) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Przeznaczony do środowisk, w których wszystkie elementy mają znajdować się pod lokalnym prefiksem
(domyślnie `~/.openclaw`) bez zależności od systemowej instalacji Node. Domyślnie obsługuje instalacje
przez npm, a także instalacje z kopii roboczej git w ramach tego samego przepływu prefiksu.
</Info>

### Przebieg (install-cli.sh)

<Steps>
  <Step title="Instalacja lokalnego środowiska uruchomieniowego Node">
    Pobiera archiwum tar przypiętej, obsługiwanej wersji Node LTS (wersja jest osadzona w skrypcie i aktualizowana niezależnie; domyślnie `22.22.2`) do `<prefix>/tools/node-v<version>` i weryfikuje sumę SHA-256.
    W systemie Alpine/musl Linux, dla którego Node nie publikuje zgodnych archiwów tar przypiętego środowiska uruchomieniowego, instaluje `nodejs` i `npm` za pomocą `apk`, a następnie łączy to środowisko uruchomieniowe ze ścieżką skryptu opakowującego w prefiksie. Repozytoria Alpine muszą udostępniać obsługiwaną wersję Node (22.19+, 23.11+ lub 24+); użyj Alpine 3.21 lub nowszego, jeśli starsze repozytoria udostępniają tylko Node 20 lub 21.
  </Step>
  <Step title="Zapewnienie Git">
    Jeśli Git nie jest dostępny, podejmuje próbę instalacji za pomocą apt/dnf/yum/apk w systemie Linux lub Homebrew w systemie macOS.
  </Step>
  <Step title="Instalacja OpenClaw pod prefiksem">
    - Metoda `npm` (domyślna): instaluje w obrębie prefiksu za pomocą npm, a następnie zapisuje skrypt opakowujący w `<prefix>/bin/openclaw`
    - Metoda `git`: klonuje lub aktualizuje kopię roboczą (domyślnie `~/openclaw`) i również zapisuje skrypt opakowujący w `<prefix>/bin/openclaw`

  </Step>
  <Step title="Odświeżenie załadowanej usługi Gateway">
    Jeśli usługa Gateway jest już załadowana z tego samego prefiksu, skrypt uruchamia
    `openclaw gateway install --force`, następnie `openclaw gateway restart`, po czym
    podejmuje próbę sprawdzenia stanu Gateway.
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
  <Tab title="Instalacja przez Git">
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

| Flaga                                   | Opis                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Prefiks instalacji (domyślnie: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | Wybór metody instalacji (domyślnie: `npm`)                                             |
| `--npm`                                 | Skrót dla metody npm                                                                  |
| `--git \| --github`                     | Skrót dla metody git                                                                  |
| `--git-dir \| --dir <path>`             | Katalog kopii roboczej Git (domyślnie: `~/openclaw`)                                  |
| `--version <ver>`                       | Wersja OpenClaw lub znacznik dystrybucji (domyślnie: `latest`)                         |
| `--node-version <ver>`                  | Wersja Node (domyślnie: `22.22.2`)                                                     |
| `--json`                                | Emitowanie zdarzeń NDJSON                                                             |
| `--onboard`                             | Uruchomienie `openclaw onboard` po instalacji                                          |
| `--no-onboard`                          | Pominięcie konfiguracji początkowej (domyślnie)                                        |
| `--set-npm-prefix`                      | W systemie Linux wymusza prefiks npm `~/.npm-global`, jeśli bieżący nie jest zapisywalny |
| `--help \| -h`                          | Wyświetlenie informacji o użyciu                                                      |

  </Accordion>

  <Accordion title="Dokumentacja zmiennych środowiskowych">

| Zmienna                                     | Opis                                                                       |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefiks instalacji                                                         |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metoda instalacji                                                          |
| `OPENCLAW_VERSION=<ver>`                    | Wersja OpenClaw lub znacznik dystrybucji                                   |
| `OPENCLAW_NODE_VERSION=<ver>`               | Wersja Node                                                                |
| `OPENCLAW_HOME=<path>`                      | Katalog bazowy stanu OpenClaw oraz domyślnych ścieżek git i konfiguracji początkowej |
| `OPENCLAW_GIT_DIR=<path>`                   | Katalog kopii roboczej Git dla instalacji metodą git                       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Włączanie lub wyłączanie aktualizacji git istniejących kopii roboczych     |
| `OPENCLAW_NO_ONBOARD=1`                     | Pominięcie konfiguracji początkowej                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Poziom rejestrowania npm (domyślnie: `error`)                               |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` i inne specyfikacje źródeł z GitHub nie są prawidłowymi wartościami docelowymi `--version` dla instalacji npm. Zamiast tego użyj `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Przebieg (install.ps1)

<Steps>
  <Step title="Zapewnienie środowiska PowerShell i Windows">
    Wymaga PowerShell 5 lub nowszego.
  </Step>
  <Step title="Domyślne zapewnienie Node.js 24">
    Jeśli go brakuje, skrypt próbuje zainstalować go kolejno przez winget, Chocolatey i Scoop. Jeśli żaden menedżer pakietów nie jest dostępny, skrypt pobiera oficjalne archiwum zip Node.js 24 dla Windows do `%LOCALAPPDATA%\OpenClaw\deps\portable-node` i dodaje je do PATH bieżącego procesu oraz użytkownika. Wersje Node 22.19+ i 23.11+ pozostają obsługiwane ze względu na zgodność.
  </Step>
  <Step title="Instalacja OpenClaw">
    - Metoda `npm` (domyślna): globalna instalacja npm z użyciem wybranego parametru `-Tag`, uruchamiana z zapisywalnego katalogu tymczasowego instalatora, dzięki czemu powłoki otwarte w chronionych folderach, takich jak `C:\`, nadal działają
    - Metoda `git`: klonuje lub aktualizuje repozytorium, instaluje i kompiluje za pomocą pnpm oraz instaluje skrypt opakowujący w `%USERPROFILE%\.local\bin\openclaw.cmd`. Jeśli brakuje Git, skrypt uruchamia lokalną dla użytkownika wersję MinGit w `%LOCALAPPDATA%\OpenClaw\deps\portable-git` i dodaje ją do PATH bieżącego procesu oraz użytkownika.

  </Step>
  <Step title="Zadania po instalacji">
    - W miarę możliwości dodaje wymagany katalog plików wykonywalnych do PATH użytkownika
    - Podejmuje próbę odświeżenia załadowanej usługi Gateway (`openclaw gateway install --force`, a następnie ponowne uruchomienie)
    - Uruchamia `openclaw doctor --non-interactive` przy aktualizacjach i instalacjach metodą git (w miarę możliwości)

  </Step>
  <Step title="Obsługa błędów">
    Instalacje za pomocą `iwr ... | iex` i bloków skryptów zgłaszają błąd kończący działanie polecenia bez zamykania bieżącej sesji PowerShell. Bezpośrednie instalacje przez `powershell -File` / `pwsh -File` nadal kończą się niezerowym kodem wyjścia na potrzeby automatyzacji.
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
  <Tab title="Niestandardowy katalog git">
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

| Flaga                       | Opis                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metoda instalacji (domyślnie: `npm`)                                  |
| `-Tag <tag\|version\|spec>` | Znacznik dystrybucji npm, wersja lub specyfikacja pakietu (domyślnie: `latest`) |
| `-GitDir <path>`            | Katalog kopii roboczej (domyślnie: `%USERPROFILE%\openclaw`)          |
| `-NoOnboard`                | Pominięcie konfiguracji początkowej                                    |
| `-NoGitUpdate`              | Pominięcie `git pull`                                                  |
| `-DryRun`                   | Wyświetlenie tylko wykonywanych czynności                              |

  </Accordion>

  <Accordion title="Dokumentacja zmiennych środowiskowych">

| Zmienna                            | Opis                               |
| ---------------------------------- | ---------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metoda instalacji                  |
| `OPENCLAW_GIT_DIR=<path>`          | Katalog kopii roboczej             |
| `OPENCLAW_NO_ONBOARD=1`            | Pominięcie konfiguracji początkowej |
| `OPENCLAW_GIT_UPDATE=0`            | Wyłączenie `git pull`              |
| `OPENCLAW_DRY_RUN=1`               | Tryb przebiegu próbnego            |

  </Accordion>
</AccordionGroup>

<Note>
Jeśli użyto `-InstallMethod git`, a Git nie jest dostępny, przed wyświetleniem odnośnika do Git for Windows skrypt próbuje uruchomić lokalną dla użytkownika wersję MinGit.
</Note>

---

## CI i automatyzacja

Aby zapewnić przewidywalne uruchomienia, używaj nieinteraktywnych flag i zmiennych środowiskowych.

<Tabs>
  <Tab title="install.sh (nieinteraktywne npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (nieinteraktywne git)">
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
    Git jest wymagany dla metody instalacji `git`. W przypadku instalacji `npm` Git jest nadal sprawdzany i instalowany, aby uniknąć błędów `spawn git ENOENT`, gdy zależności używają adresów URL git.
  </Accordion>

  <Accordion title="Dlaczego npm zgłasza EACCES w systemie Linux?">
    W niektórych konfiguracjach systemu Linux globalny prefiks npm wskazuje ścieżki należące do użytkownika root. `install.sh` może zmienić prefiks na `~/.npm-global` i dopisać instrukcje eksportowania PATH do plików konfiguracyjnych powłoki (jeśli te pliki istnieją).
  </Accordion>

  <Accordion title='Windows: „npm error spawn git / ENOENT”'>
    Uruchom instalator ponownie, aby mógł skonfigurować lokalną dla użytkownika wersję MinGit, albo zainstaluj Git for Windows i ponownie otwórz PowerShell.
  </Accordion>

  <Accordion title='Windows: „openclaw is not recognized”'>
    Uruchom `npm config get prefix`, dodaj zwrócony katalog do PATH użytkownika (w systemie Windows przyrostek `\bin` nie jest potrzebny), a następnie ponownie otwórz PowerShell.
  </Accordion>

  <Accordion title="Windows: jak uzyskać szczegółowe dane wyjściowe instalatora">
    `install.ps1` nie udostępnia przełącznika `-Verbose`.
    Do diagnostyki na poziomie skryptu użyj śledzenia PowerShell:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="Nie znaleziono openclaw po instalacji">
    Zwykle jest to problem z PATH. Zobacz [rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Aktualizowanie](/pl/install/updating)
- [Odinstalowywanie](/pl/install/uninstall)
