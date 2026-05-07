---
read_when:
    - Chcesz zrozumieć `openclaw.ai/install.sh`
    - Chcesz zautomatyzować instalacje (CI / tryb bez interfejsu)
    - Chcesz zainstalować z kopii roboczej GitHub
summary: Jak działają skrypty instalatora (install.sh, install-cli.sh, install.ps1), flagi i automatyzacja
title: Wewnętrzne mechanizmy instalatora
x-i18n:
    generated_at: "2026-05-07T13:21:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: a62720526e2a5ffc94555f77e7e806d63768b849a9491b60f6fdc9cf070eed2f
    source_path: install/installer.md
    workflow: 16
---

OpenClaw dostarcza trzy skrypty instalacyjne, serwowane z `openclaw.ai`.

| Skrypt                             | Platforma            | Co robi                                                                                                           |
| ---------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instaluje Node, jeśli jest potrzebny, instaluje OpenClaw przez npm (domyślnie) albo git i może uruchomić onboarding. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instaluje Node + OpenClaw w lokalnym prefiksie (`~/.openclaw`) w trybach npm albo checkout git. Nie wymaga uprawnień root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instaluje Node, jeśli jest potrzebny, instaluje OpenClaw przez npm (domyślnie) albo git i może uruchomić onboarding. |

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
Jeśli instalacja się powiedzie, ale `openclaw` nie zostanie znaleziony w nowym terminalu, zobacz [rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Zalecane dla większości interaktywnych instalacji w macOS/Linux/WSL.
</Tip>

### Przebieg (install.sh)

<Steps>
  <Step title="Wykryj system operacyjny">
    Obsługuje macOS i Linux (w tym WSL). Jeśli wykryje macOS, instaluje Homebrew, jeśli go brakuje.
  </Step>
  <Step title="Domyślnie zapewnij Node.js 24">
    Sprawdza wersję Node i instaluje Node 24, jeśli jest potrzebny (Homebrew w macOS, skrypty konfiguracyjne NodeSource w Linux apt/dnf/yum). OpenClaw nadal obsługuje Node 22 LTS, obecnie `22.16+`, dla zgodności.
  </Step>
  <Step title="Zapewnij Git">
    Instaluje Git, jeśli go brakuje.
  </Step>
  <Step title="Zainstaluj OpenClaw">
    - metoda `npm` (domyślna): globalna instalacja npm
    - metoda `git`: klonuje/aktualizuje repozytorium, instaluje zależności za pomocą pnpm, buduje, a następnie instaluje wrapper w `~/.local/bin/openclaw`

  </Step>
  <Step title="Zadania po instalacji">
    - Odświeża załadowaną usługę Gateway w trybie best-effort (`openclaw gateway install --force`, potem restart)
    - Uruchamia `openclaw doctor --non-interactive` przy aktualizacjach i instalacjach git (best effort)
    - Próbuje uruchomić onboarding, gdy jest to odpowiednie (TTY dostępne, onboarding nie jest wyłączony, a sprawdzenia bootstrap/config przechodzą)
    - Domyślnie ustawia `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Wykrywanie checkoutu źródeł

Jeśli skrypt zostanie uruchomiony wewnątrz checkoutu OpenClaw (`package.json` + `pnpm-workspace.yaml`), proponuje:

- użycie checkoutu (`git`), albo
- użycie instalacji globalnej (`npm`)

Jeśli TTY nie jest dostępne i nie ustawiono metody instalacji, domyślnie wybiera `npm` i wyświetla ostrzeżenie.

Skrypt kończy działanie kodem `2` przy nieprawidłowym wyborze metody lub nieprawidłowych wartościach `--install-method`.

### Przykłady (install.sh)

<Tabs>
  <Tab title="Domyślne">
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
  <Tab title="GitHub main przez npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Próba bez zmian">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Opis flag">

| Flaga                                 | Opis                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Wybierz metodę instalacji (domyślnie: `npm`). Alias: `--method` |
| `--npm`                               | Skrót dla metody npm                                       |
| `--git`                               | Skrót dla metody git. Alias: `--github`                    |
| `--version <version\|dist-tag\|spec>` | Wersja npm, dist-tag albo specyfikacja pakietu (domyślnie: `latest`) |
| `--beta`                              | Użyj dist-tag beta, jeśli dostępny, w przeciwnym razie wróć do `latest` |
| `--git-dir <path>`                    | Katalog checkoutu (domyślnie: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Pomiń `git pull` dla istniejącego checkoutu                |
| `--no-prompt`                         | Wyłącz monity                                              |
| `--no-onboard`                        | Pomiń onboarding                                           |
| `--onboard`                           | Włącz onboarding                                           |
| `--dry-run`                           | Wypisz działania bez stosowania zmian                      |
| `--verbose`                           | Włącz wyjście debugowania (`set -x`, logi npm na poziomie notice) |
| `--help`                              | Pokaż użycie (`-h`)                                        |

  </Accordion>

  <Accordion title="Opis zmiennych środowiskowych">

| Zmienna                                                 | Opis                                          |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Metoda instalacji                             |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Wersja npm, dist-tag albo specyfikacja pakietu |
| `OPENCLAW_BETA=0\|1`                                    | Użyj beta, jeśli dostępne                     |
| `OPENCLAW_GIT_DIR=<path>`                               | Katalog checkoutu                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Przełącz aktualizacje git                     |
| `OPENCLAW_NO_PROMPT=1`                                  | Wyłącz monity                                 |
| `OPENCLAW_NO_ONBOARD=1`                                 | Pomiń onboarding                              |
| `OPENCLAW_DRY_RUN=1`                                    | Tryb próby bez zmian                          |
| `OPENCLAW_VERBOSE=1`                                    | Tryb debugowania                              |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Poziom logowania npm                          |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Kontroluj zachowanie sharp/libvips (domyślnie: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Przeznaczone dla środowisk, w których wszystko ma znajdować się pod lokalnym prefiksem
(domyślnie `~/.openclaw`) i bez systemowej zależności Node. Domyślnie obsługuje instalacje npm
oraz instalacje z checkoutu git w tym samym przepływie prefiksu.
</Info>

### Przebieg (install-cli.sh)

<Steps>
  <Step title="Zainstaluj lokalne środowisko uruchomieniowe Node">
    Pobiera przypięte, obsługiwane archiwum tar Node LTS (wersja jest osadzona w skrypcie i aktualizowana niezależnie) do `<prefix>/tools/node-v<version>` i weryfikuje SHA-256.
  </Step>
  <Step title="Zapewnij Git">
    Jeśli brakuje Git, próbuje zainstalować go przez apt/dnf/yum w Linux albo Homebrew w macOS.
  </Step>
  <Step title="Zainstaluj OpenClaw pod prefiksem">
    - metoda `npm` (domyślna): instaluje pod prefiksem za pomocą npm, a następnie zapisuje wrapper do `<prefix>/bin/openclaw`
    - metoda `git`: klonuje/aktualizuje checkout (domyślnie `~/openclaw`) i nadal zapisuje wrapper do `<prefix>/bin/openclaw`

  </Step>
  <Step title="Odśwież załadowaną usługę Gateway">
    Jeśli usługa Gateway jest już załadowana z tego samego prefiksu, skrypt uruchamia
    `openclaw gateway install --force`, następnie `openclaw gateway restart` i
    sprawdza stan Gateway w trybie best-effort.
  </Step>
</Steps>

### Przykłady (install-cli.sh)

<Tabs>
  <Tab title="Domyślne">
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
  <Tab title="Wyjście JSON automatyzacji">
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
  <Accordion title="Opis flag">

| Flaga                       | Opis                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefiks instalacji (domyślnie: `~/.openclaw`)                                   |
| `--install-method npm\|git` | Wybierz metodę instalacji (domyślnie: `npm`). Alias: `--method`                 |
| `--npm`                     | Skrót dla metody npm                                                            |
| `--git`, `--github`         | Skrót dla metody git                                                            |
| `--git-dir <path>`          | Katalog checkoutu git (domyślnie: `~/openclaw`). Alias: `--dir`                 |
| `--version <ver>`           | Wersja OpenClaw albo dist-tag (domyślnie: `latest`)                             |
| `--node-version <ver>`      | Wersja Node (domyślnie: `22.22.0`)                                               |
| `--json`                    | Emituj zdarzenia NDJSON                                                         |
| `--onboard`                 | Uruchom `openclaw onboard` po instalacji                                        |
| `--no-onboard`              | Pomiń onboarding (domyślnie)                                                    |
| `--set-npm-prefix`          | W Linux wymuś prefiks npm na `~/.npm-global`, jeśli bieżący prefiks nie jest zapisywalny |
| `--help`                    | Pokaż użycie (`-h`)                                                             |

  </Accordion>

  <Accordion title="Opis zmiennych środowiskowych">

| Zmienna                                     | Opis                                          |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefiks instalacji                            |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metoda instalacji                             |
| `OPENCLAW_VERSION=<ver>`                    | Wersja OpenClaw lub dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | Wersja Node                                   |
| `OPENCLAW_GIT_DIR=<path>`                   | Katalog checkout Git dla instalacji git       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Przełącznik aktualizacji git dla istniejących checkoutów |
| `OPENCLAW_NO_ONBOARD=1`                     | Pomiń wprowadzanie                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Poziom logowania npm                          |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Kontroluj zachowanie sharp/libvips (domyślnie: `1`) |

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
    Jeśli go brakuje, próbuje zainstalować przez winget, następnie Chocolatey, a potem Scoop. Node 22 LTS, obecnie `22.16+`, pozostaje obsługiwany dla zgodności.
  </Step>
  <Step title="Zainstaluj OpenClaw">
    - Metoda `npm` (domyślna): globalna instalacja npm z użyciem wybranego `-Tag`, uruchamiana z zapisywalnego tymczasowego katalogu instalatora, dzięki czemu powłoki otwarte w chronionych folderach, takich jak `C:\`, nadal działają
    - Metoda `git`: klonowanie/aktualizacja repozytorium, instalacja/budowanie z pnpm oraz instalacja wrappera w `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Zadania po instalacji">
    - Dodaje wymagany katalog bin do PATH użytkownika, gdy to możliwe
    - Odświeża załadowaną usługę Gateway w trybie best-effort (`openclaw gateway install --force`, następnie restart)
    - Uruchamia `openclaw doctor --non-interactive` przy aktualizacjach i instalacjach git (best effort)

  </Step>
  <Step title="Obsłuż błędy">
    Instalacje `iwr ... | iex` i scriptblock zgłaszają błąd kończący bez zamykania bieżącej sesji PowerShell. Bezpośrednie instalacje `powershell -File` / `pwsh -File` nadal kończą się kodem niezerowym na potrzeby automatyzacji.
  </Step>
</Steps>

### Przykłady (install.ps1)

<Tabs>
  <Tab title="Domyślne">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalacja Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main przez npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
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
  <Tab title="Śledzenie debugowania">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Opis flag">

| Flaga                       | Opis                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metoda instalacji (domyślnie: `npm`)                       |
| `-Tag <tag\|version\|spec>` | npm dist-tag, wersja lub specyfikacja pakietu (domyślnie: `latest`) |
| `-GitDir <path>`            | Katalog checkout (domyślnie: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Pomiń wprowadzanie                                         |
| `-NoGitUpdate`              | Pomiń `git pull`                                           |
| `-DryRun`                   | Tylko wypisz działania                                     |

  </Accordion>

  <Accordion title="Opis zmiennych środowiskowych">

| Zmienna                            | Opis                 |
| ---------------------------------- | -------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metoda instalacji    |
| `OPENCLAW_GIT_DIR=<path>`          | Katalog checkout     |
| `OPENCLAW_NO_ONBOARD=1`            | Pomiń wprowadzanie   |
| `OPENCLAW_GIT_UPDATE=0`            | Wyłącz git pull      |
| `OPENCLAW_DRY_RUN=1`               | Tryb przebiegu próbnego |

  </Accordion>
</AccordionGroup>

<Note>
Jeśli użyto `-InstallMethod git`, a Git nie jest dostępny, skrypt kończy działanie i wypisuje link do Git for Windows.
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
  <Tab title="install.ps1 (pomiń wprowadzanie)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Dlaczego Git jest wymagany?">
    Git jest wymagany dla metody instalacji `git`. W przypadku instalacji `npm` Git nadal jest sprawdzany/instalowany, aby uniknąć błędów `spawn git ENOENT`, gdy zależności używają adresów URL git.
  </Accordion>

  <Accordion title="Dlaczego npm napotyka EACCES w systemie Linux?">
    Niektóre konfiguracje Linuksa wskazują globalny prefiks npm na ścieżki należące do root. `install.sh` może przełączyć prefiks na `~/.npm-global` i dopisać eksporty PATH do plików rc powłoki (gdy te pliki istnieją).
  </Accordion>

  <Accordion title="Problemy z sharp/libvips">
    Skrypty domyślnie ustawiają `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, aby uniknąć budowania sharp względem systemowego libvips. Aby nadpisać:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Zainstaluj Git for Windows, otwórz ponownie PowerShell, uruchom ponownie instalator.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Uruchom `npm config get prefix` i dodaj ten katalog do PATH użytkownika (w Windows nie jest wymagany sufiks `\bin`), a następnie otwórz ponownie PowerShell.
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

  <Accordion title="Nie znaleziono openclaw po instalacji">
    Zwykle jest to problem z PATH. Zobacz [rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Aktualizowanie](/pl/install/updating)
- [Odinstalowanie](/pl/install/uninstall)
