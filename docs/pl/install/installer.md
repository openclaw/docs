---
read_when:
    - Chcesz zrozumieć `openclaw.ai/install.sh`
    - Chcesz zautomatyzować instalacje (CI / tryb bez interfejsu)
    - Chcesz zainstalować z checkoutu GitHub
summary: Jak działają skrypty instalatora (install.sh, install-cli.sh, install.ps1), flagi i automatyzacja
title: Wewnętrzne mechanizmy instalatora
x-i18n:
    generated_at: "2026-06-27T17:43:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw dostarcza trzy skrypty instalacyjne, serwowane z `openclaw.ai`.

| Skrypt                             | Platforma             | Co robi                                                                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instaluje Node w razie potrzeby, instaluje OpenClaw przez npm (domyślnie) lub git i może uruchomić onboarding.                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instaluje Node + OpenClaw w lokalnym prefiksie (`~/.openclaw`) w trybach npm lub checkout git. Nie wymaga uprawnień root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instaluje Node w razie potrzeby, instaluje OpenClaw przez npm (domyślnie) lub git i może uruchomić onboarding.                   |

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
Jeśli instalacja się powiedzie, ale `openclaw` nie zostanie znalezione w nowym terminalu, zobacz [rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Zalecane dla większości interaktywnych instalacji w macOS/Linux/WSL.
</Tip>

### Przepływ (install.sh)

<Steps>
  <Step title="Wykryj system operacyjny">
    Obsługuje macOS i Linux (w tym WSL).
  </Step>
  <Step title="Domyślnie zapewnij Node.js 24">
    Sprawdza wersję Node i instaluje Node 24 w razie potrzeby (Homebrew w macOS, skrypty konfiguracyjne NodeSource w Linux apt/dnf/yum). W macOS Homebrew jest instalowany tylko wtedy, gdy instalator potrzebuje go dla Node lub Git. OpenClaw nadal obsługuje Node 22 LTS, obecnie `22.19+`, dla zgodności.
    W Alpine/musl Linux instalator używa pakietów apk zamiast NodeSource; skonfigurowane repozytoria Alpine muszą udostępniać Node `22.19+` (Alpine 3.21 lub nowszy w chwili pisania).
  </Step>
  <Step title="Zapewnij Git">
    Instaluje Git, jeśli go brakuje, używając wykrytego menedżera pakietów, w tym Homebrew w macOS i apk w Alpine.
  </Step>
  <Step title="Zainstaluj OpenClaw">
    - metoda `npm` (domyślna): globalna instalacja npm
    - metoda `git`: klonuje/aktualizuje repozytorium, instaluje zależności przez pnpm, buduje, a następnie instaluje wrapper w `~/.local/bin/openclaw`

  </Step>
  <Step title="Zadania po instalacji">
    - Odświeża załadowaną usługę gateway w trybie best-effort (`openclaw gateway install --force`, potem restart)
    - Uruchamia `openclaw doctor --non-interactive` przy aktualizacjach i instalacjach git (best effort)
    - Próbuje uruchomić onboarding, gdy jest to odpowiednie (dostępny TTY, onboarding nie jest wyłączony, a kontrole bootstrap/config przechodzą)

  </Step>
</Steps>

### Wykrywanie checkoutu źródłowego

Jeśli zostanie uruchomiony wewnątrz checkoutu OpenClaw (`package.json` + `pnpm-workspace.yaml`), skrypt oferuje:

- użycie checkoutu (`git`) albo
- użycie instalacji globalnej (`npm`)

Jeśli TTY nie jest dostępny i nie ustawiono metody instalacji, domyślnie używa `npm` i wyświetla ostrzeżenie.

Skrypt kończy działanie kodem `2` przy nieprawidłowym wyborze metody lub nieprawidłowych wartościach `--install-method`.

### Przykłady (install.sh)

<Tabs>
  <Tab title="Domyślnie">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Pomiń onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalacja git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Checkout main z GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Przebieg próbny">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Informacje o flagach">

| Flaga                                  | Opis                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Wybierz metodę instalacji (domyślnie: `npm`). Alias: `--method`  |
| `--npm`                               | Skrót dla metody npm                                    |
| `--git`                               | Skrót dla metody git. Alias: `--github`                 |
| `--version <version\|dist-tag\|spec>` | wersja npm, dist-tag lub specyfikacja pakietu (domyślnie: `latest`) |
| `--beta`                              | Użyj dist-tag beta, jeśli jest dostępny; w przeciwnym razie wróć do `latest`  |
| `--git-dir <path>`                    | Katalog checkoutu (domyślnie: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Pomiń `git pull` dla istniejącego checkoutu                      |
| `--no-prompt`                         | Wyłącz monity                                            |
| `--no-onboard`                        | Pomiń onboarding                                            |
| `--onboard`                           | Włącz onboarding                                          |
| `--dry-run`                           | Wypisz działania bez stosowania zmian                     |
| `--verbose`                           | Włącz dane wyjściowe debugowania (`set -x`, logi npm na poziomie notice)      |
| `--help`                              | Pokaż użycie (`-h`)                                          |

  </Accordion>

  <Accordion title="Informacje o zmiennych środowiskowych">

| Zmienna                                          | Opis                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Metoda instalacji                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | wersja npm, dist-tag lub specyfikacja pakietu                             |
| `OPENCLAW_BETA=0\|1`                              | Użyj beta, jeśli jest dostępna                                              |
| `OPENCLAW_HOME=<path>`                            | Katalog bazowy stanu OpenClaw oraz domyślnych ścieżek git/onboarding |
| `OPENCLAW_GIT_DIR=<path>`                         | Katalog checkoutu                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Przełącz aktualizacje git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | Wyłącz monity                                                    |
| `OPENCLAW_NO_ONBOARD=1`                           | Pomiń onboarding                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Tryb przebiegu próbnego                                                       |
| `OPENCLAW_VERBOSE=1`                              | Tryb debugowania                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Poziom logowania npm                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Zaprojektowany dla środowisk, w których chcesz mieć wszystko pod lokalnym prefiksem
(domyślnie `~/.openclaw`) i bez systemowej zależności Node. Domyślnie obsługuje instalacje npm,
a także instalacje z checkoutu git w tym samym przepływie prefiksu.
</Info>

### Przepływ (install-cli.sh)

<Steps>
  <Step title="Zainstaluj lokalne środowisko uruchomieniowe Node">
    Pobiera przypięty obsługiwany archiwum tarball Node LTS (wersja jest osadzona w skrypcie i aktualizowana niezależnie) do `<prefix>/tools/node-v<version>` i weryfikuje SHA-256.
    W Alpine/musl Linux, gdzie Node nie publikuje zgodnych archiwów tarball dla przypiętego środowiska uruchomieniowego, instaluje `nodejs` i `npm` przez `apk` oraz linkuje to środowisko uruchomieniowe do ścieżki wrappera prefiksu. Repozytoria Alpine muszą udostępniać Node `22.19+`; użyj Alpine 3.21 lub nowszego, jeśli starsze repozytoria udostępniają tylko Node 20 lub 21.
  </Step>
  <Step title="Zapewnij Git">
    Jeśli brakuje Git, próbuje zainstalować go przez apt/dnf/yum/apk w Linux lub Homebrew w macOS.
  </Step>
  <Step title="Zainstaluj OpenClaw pod prefiksem">
    - metoda `npm` (domyślna): instaluje pod prefiksem przez npm, a następnie zapisuje wrapper do `<prefix>/bin/openclaw`
    - metoda `git`: klonuje/aktualizuje checkout (domyślnie `~/openclaw`) i nadal zapisuje wrapper do `<prefix>/bin/openclaw`

  </Step>
  <Step title="Odśwież załadowaną usługę gateway">
    Jeśli usługa gateway jest już załadowana z tego samego prefiksu, skrypt uruchamia
    `openclaw gateway install --force`, następnie `openclaw gateway restart`, i
    sonduje kondycję gateway w trybie best-effort.
  </Step>
</Steps>

### Przykłady (install-cli.sh)

<Tabs>
  <Tab title="Domyślnie">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Niestandardowy prefiks + wersja">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Instalacja git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Dane wyjściowe JSON dla automatyzacji">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Uruchom onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Informacje o flagach">

| Flaga                       | Opis                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefiks instalacji (domyślnie: `~/.openclaw`)                                   |
| `--install-method npm\|git` | Wybierz metodę instalacji (domyślnie: `npm`). Alias: `--method`                 |
| `--npm`                     | Skrót dla metody npm                                                            |
| `--git`, `--github`         | Skrót dla metody git                                                            |
| `--git-dir <path>`          | Katalog checkoutu Git (domyślnie: `~/openclaw`). Alias: `--dir`                 |
| `--version <ver>`           | Wersja OpenClaw lub dist-tag (domyślnie: `latest`)                              |
| `--node-version <ver>`      | Wersja Node (domyślnie: `22.22.0`)                                               |
| `--json`                    | Emituj zdarzenia NDJSON                                                         |
| `--onboard`                 | Uruchom `openclaw onboard` po instalacji                                        |
| `--no-onboard`              | Pomiń onboarding (domyślnie)                                                    |
| `--set-npm-prefix`          | W systemie Linux wymuś prefiks npm `~/.npm-global`, jeśli bieżący prefiks nie jest zapisywalny |
| `--help`                    | Pokaż użycie (`-h`)                                                             |

  </Accordion>

  <Accordion title="Odwołanie do zmiennych środowiskowych">

| Zmienna                                     | Opis                                                               |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Prefiks instalacji                                                 |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metoda instalacji                                                  |
| `OPENCLAW_VERSION=<ver>`                    | Wersja OpenClaw lub dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Wersja Node                                                        |
| `OPENCLAW_HOME=<path>`                      | Katalog bazowy stanu OpenClaw oraz domyślnych ścieżek git/onboardingu |
| `OPENCLAW_GIT_DIR=<path>`                   | Katalog checkoutu Git dla instalacji git                           |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Przełącz aktualizacje git dla istniejących checkoutów              |
| `OPENCLAW_NO_ONBOARD=1`                     | Pomiń onboarding                                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Poziom logowania npm                                               |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Przebieg (install.ps1)

<Steps>
  <Step title="Zapewnij środowisko PowerShell + Windows">
    Wymaga PowerShell 5+.
  </Step>
  <Step title="Domyślnie zapewnij Node.js 24">
    Jeśli brakuje, próbuje instalacji przez winget, następnie Chocolatey, a potem Scoop. Jeśli żaden menedżer pakietów nie jest dostępny, skrypt pobiera oficjalne archiwum zip Node.js dla Windows do `%LOCALAPPDATA%\OpenClaw\deps\portable-node` i dodaje je do PATH bieżącego procesu oraz użytkownika. Node 22 LTS, obecnie `22.19+`, pozostaje obsługiwany dla zgodności.
  </Step>
  <Step title="Zainstaluj OpenClaw">
    - Metoda `npm` (domyślna): globalna instalacja npm z użyciem wybranego `-Tag`, uruchamiana z zapisywalnego katalogu tymczasowego instalatora, aby powłoki otwarte w chronionych folderach, takich jak `C:\`, nadal działały
    - Metoda `git`: klonuje/aktualizuje repozytorium, instaluje/buduje za pomocą pnpm i instaluje wrapper w `%USERPROFILE%\.local\bin\openclaw.cmd`. Jeśli brakuje Git, skrypt inicjuje lokalny dla użytkownika MinGit w `%LOCALAPPDATA%\OpenClaw\deps\portable-git` i dodaje go do PATH bieżącego procesu oraz użytkownika.

  </Step>
  <Step title="Zadania po instalacji">
    - Dodaje wymagany katalog bin do PATH użytkownika, gdy to możliwe
    - Odświeża załadowaną usługę Gateway w trybie best-effort (`openclaw gateway install --force`, następnie restart)
    - Uruchamia `openclaw doctor --non-interactive` przy aktualizacjach i instalacjach git (best effort)

  </Step>
  <Step title="Obsłuż awarie">
    Instalacje `iwr ... | iex` oraz scriptblock zgłaszają błąd kończący bez zamykania bieżącej sesji PowerShell. Bezpośrednie instalacje `powershell -File` / `pwsh -File` nadal kończą się kodem niezerowym na potrzeby automatyzacji.
  </Step>
</Steps>

### Przykłady (install.ps1)

<Tabs>
  <Tab title="Domyślne">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalacja git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Checkout GitHub main">
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
  <Tab title="Ślad debugowania">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Odwołanie do flag">

| Flaga                       | Opis                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metoda instalacji (domyślnie: `npm`)                       |
| `-Tag <tag\|version\|spec>` | dist-tag npm, wersja lub specyfikacja pakietu (domyślnie: `latest`) |
| `-GitDir <path>`            | Katalog checkoutu (domyślnie: `%USERPROFILE%\openclaw`)    |
| `-NoOnboard`                | Pomiń onboarding                                           |
| `-NoGitUpdate`              | Pomiń `git pull`                                           |
| `-DryRun`                   | Tylko wypisz działania                                     |

  </Accordion>

  <Accordion title="Odwołanie do zmiennych środowiskowych">

| Zmienna                            | Opis               |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metoda instalacji  |
| `OPENCLAW_GIT_DIR=<path>`          | Katalog checkoutu  |
| `OPENCLAW_NO_ONBOARD=1`            | Pomiń onboarding   |
| `OPENCLAW_GIT_UPDATE=0`            | Wyłącz git pull    |
| `OPENCLAW_DRY_RUN=1`               | Tryb przebiegu próbnego |

  </Accordion>
</AccordionGroup>

<Note>
Jeśli użyto `-InstallMethod git` i brakuje Git, skrypt próbuje zainicjować lokalny dla użytkownika MinGit przed wypisaniem linku do Git for Windows.
</Note>

---

## CI i automatyzacja

Używaj nieinteraktywnych flag/zmiennych środowiskowych, aby uzyskać przewidywalne uruchomienia.

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
  <Tab title="install.ps1 (pomiń onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Dlaczego Git jest wymagany?">
    Git jest wymagany dla metody instalacji `git`. W przypadku instalacji `npm` Git nadal jest sprawdzany/instalowany, aby uniknąć błędów `spawn git ENOENT`, gdy zależności używają URL-i git.
  </Accordion>

  <Accordion title="Dlaczego npm trafia na EACCES w systemie Linux?">
    Niektóre konfiguracje systemu Linux wskazują globalny prefiks npm na ścieżki należące do root. `install.sh` może przełączyć prefiks na `~/.npm-global` i dopisać eksporty PATH do plików rc powłoki (gdy te pliki istnieją).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Uruchom instalator ponownie, aby mógł zainicjować lokalny dla użytkownika MinGit, albo zainstaluj Git for Windows i ponownie otwórz PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Uruchom `npm config get prefix` i dodaj ten katalog do PATH użytkownika (w Windows nie jest potrzebny sufiks `\bin`), następnie ponownie otwórz PowerShell.
  </Accordion>

  <Accordion title="Windows: jak uzyskać szczegółowe dane wyjściowe instalatora">
    `install.ps1` obecnie nie udostępnia przełącznika `-Verbose`.
    Użyj śledzenia PowerShell do diagnostyki na poziomie skryptu:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw nie znaleziono po instalacji">
    Zwykle jest to problem z PATH. Zobacz [Rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Aktualizowanie](/pl/install/updating)
- [Odinstalowanie](/pl/install/uninstall)
