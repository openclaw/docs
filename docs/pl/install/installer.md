---
read_when:
    - Chcesz zrozumieć `openclaw.ai/install.sh`
    - Chcesz zautomatyzować instalacje (CI / headless)
    - Chcesz zainstalować z checkoutu GitHub
summary: Jak działają skrypty instalacyjne (`install.sh`, `install-cli.sh`, `install.ps1`), flagi i automatyzacja
title: Wewnętrzne działanie instalatora
x-i18n:
    generated_at: "2026-04-24T09:17:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc54080bb93ffab3dc7827f568a0a44cda89c6d3c5f9d485c6dde7ca42837807
    source_path: install/installer.md
    workflow: 15
---

OpenClaw dostarcza trzy skrypty instalacyjne, serwowane z `openclaw.ai`.

| Script                             | Platforma            | Co robi                                                                                                        |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instaluje Node, jeśli to potrzebne, instaluje OpenClaw przez npm (domyślnie) albo git i może uruchomić onboarding. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instaluje Node + OpenClaw do lokalnego prefiksu (`~/.openclaw`) w trybie npm lub checkout git. Nie wymaga roota. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instaluje Node, jeśli to potrzebne, instaluje OpenClaw przez npm (domyślnie) albo git i może uruchomić onboarding. |

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
Jeśli instalacja się powiedzie, ale w nowym terminalu nie ma polecenia `openclaw`, zobacz [Rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Zalecany dla większości interaktywnych instalacji na macOS/Linux/WSL.
</Tip>

### Przepływ (install.sh)

<Steps>
  <Step title="Wykryj system operacyjny">
    Obsługuje macOS i Linux (w tym WSL). Jeśli wykryty zostanie macOS, instaluje Homebrew, jeśli go brakuje.
  </Step>
  <Step title="Domyślnie zapewnij Node.js 24">
    Sprawdza wersję Node i instaluje Node 24, jeśli to potrzebne (Homebrew na macOS, skrypty konfiguracji NodeSource na Linux apt/dnf/yum). OpenClaw nadal obsługuje Node 22 LTS, obecnie `22.14+`, dla zgodności.
  </Step>
  <Step title="Zapewnij Git">
    Instaluje Git, jeśli go brakuje.
  </Step>
  <Step title="Zainstaluj OpenClaw">
    - metoda `npm` (domyślna): globalna instalacja npm
    - metoda `git`: klonuje/aktualizuje repozytorium, instaluje zależności przez pnpm, buduje, a następnie instaluje wrapper w `~/.local/bin/openclaw`
  </Step>
  <Step title="Zadania po instalacji">
    - Odświeża załadowaną usługę gateway w trybie best-effort (`openclaw gateway install --force`, a potem restart)
    - Uruchamia `openclaw doctor --non-interactive` przy aktualizacjach i instalacjach git (best effort)
    - Próbuje uruchomić onboarding, gdy to właściwe (dostępne TTY, onboarding niewyłączony i przechodzą kontrole bootstrap/konfiguracji)
    - Domyślnie ustawia `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### Wykrywanie checkoutu źródłowego

Jeśli skrypt jest uruchamiany wewnątrz checkoutu OpenClaw (`package.json` + `pnpm-workspace.yaml`), oferuje:

- użycie checkoutu (`git`), albo
- użycie instalacji globalnej (`npm`)

Jeśli TTY nie jest dostępne i nie ustawiono metody instalacji, domyślnie wybiera `npm` i wyświetla ostrzeżenie.

Skrypt kończy się kodem `2` dla nieprawidłowego wyboru metody lub nieprawidłowych wartości `--install-method`.

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
  <Tab title="GitHub main przez npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Dokumentacja flag">

| Flag                                  | Description                                                      |
| ------------------------------------- | ---------------------------------------------------------------- |
| `--install-method npm\|git`           | Wybierz metodę instalacji (domyślnie: `npm`). Alias: `--method`  |
| `--npm`                               | Skrót dla metody npm                                             |
| `--git`                               | Skrót dla metody git. Alias: `--github`                          |
| `--version <version\|dist-tag\|spec>` | Wersja npm, dist-tag lub specyfikacja pakietu (domyślnie: `latest`) |
| `--beta`                              | Użyj dist-tag beta, jeśli jest dostępny, w przeciwnym razie wróć do `latest` |
| `--git-dir <path>`                    | Katalog checkoutu (domyślnie: `~/openclaw`). Alias: `--dir`      |
| `--no-git-update`                     | Pomiń `git pull` dla istniejącego checkoutu                      |
| `--no-prompt`                         | Wyłącz prompty                                                   |
| `--no-onboard`                        | Pomiń onboarding                                                 |
| `--onboard`                           | Włącz onboarding                                                 |
| `--dry-run`                           | Wypisz działania bez ich wykonywania                             |
| `--verbose`                           | Włącz szczegółowe wyjście debug (`set -x`, logi npm na poziomie notice) |
| `--help`                              | Pokaż użycie (`-h`)                                              |

  </Accordion>

  <Accordion title="Dokumentacja zmiennych środowiskowych">

| Variable                                                | Description                                      |
| ------------------------------------------------------- | ------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Metoda instalacji                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Wersja npm, dist-tag lub specyfikacja pakietu    |
| `OPENCLAW_BETA=0\|1`                                    | Użyj beta, jeśli jest dostępna                   |
| `OPENCLAW_GIT_DIR=<path>`                               | Katalog checkoutu                                |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Przełącz aktualizacje git                        |
| `OPENCLAW_NO_PROMPT=1`                                  | Wyłącz prompty                                   |
| `OPENCLAW_NO_ONBOARD=1`                                 | Pomiń onboarding                                 |
| `OPENCLAW_DRY_RUN=1`                                    | Tryb dry run                                     |
| `OPENCLAW_VERBOSE=1`                                    | Tryb debug                                       |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Poziom logów npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Sterowanie zachowaniem sharp/libvips (domyślnie: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Przeznaczony dla środowisk, w których chcesz mieć wszystko pod lokalnym prefiksem
(domyslnie `~/.openclaw`) i bez systemowej zależności od Node. Domyślnie obsługuje instalacje npm,
a także instalacje z checkoutu git w tym samym przepływie prefiksu.
</Info>

### Przepływ (install-cli.sh)

<Steps>
  <Step title="Zainstaluj lokalne środowisko wykonawcze Node">
    Pobiera przypięty, obsługiwany tarball Node LTS (wersja jest osadzona w skrypcie i aktualizowana niezależnie) do `<prefix>/tools/node-v<version>` i weryfikuje SHA-256.
  </Step>
  <Step title="Zapewnij Git">
    Jeśli brakuje Git, próbuje go zainstalować przez apt/dnf/yum na Linux albo Homebrew na macOS.
  </Step>
  <Step title="Zainstaluj OpenClaw pod prefiksem">
    - metoda `npm` (domyślna): instaluje pod prefiksem przez npm, a potem zapisuje wrapper do `<prefix>/bin/openclaw`
    - metoda `git`: klonuje/aktualizuje checkout (domyślnie `~/openclaw`) i nadal zapisuje wrapper do `<prefix>/bin/openclaw`
  </Step>
  <Step title="Odśwież załadowaną usługę gateway">
    Jeśli usługa gateway jest już załadowana z tego samego prefiksu, skrypt uruchamia
    `openclaw gateway install --force`, potem `openclaw gateway restart`, a następnie
    wykonuje best-effort probe kondycji gateway.
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
  <Tab title="Wyjście JSON do automatyzacji">
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
  <Accordion title="Dokumentacja flag">

| Flag                        | Description                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefiks instalacji (domyślnie: `~/.openclaw`)                                   |
| `--install-method npm\|git` | Wybierz metodę instalacji (domyślnie: `npm`). Alias: `--method`                 |
| `--npm`                     | Skrót dla metody npm                                                            |
| `--git`, `--github`         | Skrót dla metody git                                                            |
| `--git-dir <path>`          | Katalog checkoutu Git (domyślnie: `~/openclaw`). Alias: `--dir`                 |
| `--version <ver>`           | Wersja OpenClaw lub dist-tag (domyślnie: `latest`)                              |
| `--node-version <ver>`      | Wersja Node (domyślnie: `22.22.0`)                                              |
| `--json`                    | Emituj zdarzenia NDJSON                                                         |
| `--onboard`                 | Uruchom `openclaw onboard` po instalacji                                        |
| `--no-onboard`              | Pomiń onboarding (domyślnie)                                                    |
| `--set-npm-prefix`          | Na Linux wymuś prefiks npm na `~/.npm-global`, jeśli bieżący prefiks nie jest zapisywalny |
| `--help`                    | Pokaż użycie (`-h`)                                                             |

  </Accordion>

  <Accordion title="Dokumentacja zmiennych środowiskowych">

| Variable                                    | Description                                     |
| ------------------------------------------- | ----------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefiks instalacji                              |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metoda instalacji                               |
| `OPENCLAW_VERSION=<ver>`                    | Wersja OpenClaw lub dist-tag                    |
| `OPENCLAW_NODE_VERSION=<ver>`               | Wersja Node                                     |
| `OPENCLAW_GIT_DIR=<path>`                   | Katalog checkoutu Git dla instalacji git        |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Przełącz aktualizacje git dla istniejących checkoutów |
| `OPENCLAW_NO_ONBOARD=1`                     | Pomiń onboarding                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Poziom logów npm                                |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Sterowanie zachowaniem sharp/libvips (domyślnie: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Przepływ (install.ps1)

<Steps>
  <Step title="Zapewnij środowisko PowerShell + Windows">
    Wymaga PowerShell 5+.
  </Step>
  <Step title="Domyślnie zapewnij Node.js 24">
    Jeśli go brakuje, próbuje instalacji przez winget, potem Chocolatey, a następnie Scoop. Node 22 LTS, obecnie `22.14+`, nadal pozostaje obsługiwany dla zgodności.
  </Step>
  <Step title="Zainstaluj OpenClaw">
    - metoda `npm` (domyślna): globalna instalacja npm z użyciem wybranego `-Tag`
    - metoda `git`: klonuje/aktualizuje repozytorium, instaluje/buduje przez pnpm i instaluje wrapper do `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="Zadania po instalacji">
    - Dodaje wymagany katalog bin do PATH użytkownika, gdy to możliwe
    - Odświeża załadowaną usługę gateway w trybie best-effort (`openclaw gateway install --force`, a potem restart)
    - Uruchamia `openclaw doctor --non-interactive` przy aktualizacjach i instalacjach git (best effort)
  </Step>
</Steps>

### Przykłady (install.ps1)

<Tabs>
  <Tab title="Domyślnie">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalacja git">
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
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Ślad debug">
    ```powershell
    # install.ps1 nie ma jeszcze dedykowanej flagi -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Dokumentacja flag">

| Flag                        | Description                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metoda instalacji (domyślnie: `npm`)                             |
| `-Tag <tag\|version\|spec>` | npm dist-tag, wersja lub specyfikacja pakietu (domyślnie: `latest`) |
| `-GitDir <path>`            | Katalog checkoutu (domyślnie: `%USERPROFILE%\openclaw`)          |
| `-NoOnboard`                | Pomiń onboarding                                                 |
| `-NoGitUpdate`              | Pomiń `git pull`                                                 |
| `-DryRun`                   | Tylko wypisz działania                                           |

  </Accordion>

  <Accordion title="Dokumentacja zmiennych środowiskowych">

| Variable                           | Description          |
| ---------------------------------- | -------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metoda instalacji    |
| `OPENCLAW_GIT_DIR=<path>`          | Katalog checkoutu    |
| `OPENCLAW_NO_ONBOARD=1`            | Pomiń onboarding     |
| `OPENCLAW_GIT_UPDATE=0`            | Wyłącz `git pull`    |
| `OPENCLAW_DRY_RUN=1`               | Tryb dry run         |

  </Accordion>
</AccordionGroup>

<Note>
Jeśli użyto `-InstallMethod git` i brakuje Git, skrypt kończy działanie i wypisuje link do Git for Windows.
</Note>

---

## CI i automatyzacja

Używaj nieinteraktywnych flag/zmiennych środowiskowych dla przewidywalnych przebiegów.

<Tabs>
  <Tab title="install.sh (nieinteraktywny npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (nieinteraktywny git)">
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
    Git jest wymagany dla metody instalacji `git`. Przy instalacjach `npm` Git nadal jest sprawdzany/instalowany, aby uniknąć błędów `spawn git ENOENT`, gdy zależności używają URL-i git.
  </Accordion>

  <Accordion title="Dlaczego npm trafia na EACCES na Linux?">
    Niektóre konfiguracje Linux kierują globalny prefiks npm do ścieżek należących do roota. `install.sh` może przełączyć prefiks na `~/.npm-global` i dopisać eksporty PATH do plików rc powłoki (gdy te pliki istnieją).
  </Accordion>

  <Accordion title="Problemy sharp/libvips">
    Skrypty domyślnie ustawiają `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, aby uniknąć budowania sharp względem systemowego libvips. Aby to nadpisać:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Zainstaluj Git for Windows, otwórz ponownie PowerShell i uruchom instalator jeszcze raz.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Uruchom `npm config get prefix` i dodaj ten katalog do PATH użytkownika (na Windows nie potrzeba sufiksu `\bin`), a następnie otwórz ponownie PowerShell.
  </Accordion>

  <Accordion title="Windows: jak uzyskać szczegółowe wyjście instalatora">
    `install.ps1` nie udostępnia obecnie przełącznika `-Verbose`.
    Użyj śledzenia PowerShell do diagnostyki na poziomie skryptu:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="Po instalacji nie znaleziono openclaw">
    Zwykle jest to problem z PATH. Zobacz [Rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Aktualizowanie](/pl/install/updating)
- [Odinstalowanie](/pl/install/uninstall)
