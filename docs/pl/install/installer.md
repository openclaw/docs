---
read_when:
    - Chcesz zrozumieć `openclaw.ai/install.sh`
    - Chcesz zautomatyzować instalacje (CI / bezgłowo)
    - Chcesz zainstalować z checkoutu GitHub
summary: Jak działają skrypty instalacyjne (`install.sh`, `install-cli.sh`, `install.ps1`), flagi i automatyzacja
title: Wewnętrzne działanie instalatora
x-i18n:
    generated_at: "2026-04-26T11:34:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f932fb3713e8ecfa75215b05d7071b3b75e6d1135d7c326313739f294023e2
    source_path: install/installer.md
    workflow: 15
---

OpenClaw dostarcza trzy skrypty instalacyjne, serwowane z `openclaw.ai`.

| Skrypt                            | Platforma            | Co robi                                                                                                             |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instaluje Node w razie potrzeby, instaluje OpenClaw przez npm (domyślnie) albo git i może uruchomić onboarding.    |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instaluje Node + OpenClaw do lokalnego prefiksu (`~/.openclaw`) w trybie npm albo checkoutu git. Nie wymaga roota. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instaluje Node w razie potrzeby, instaluje OpenClaw przez npm (domyślnie) albo git i może uruchomić onboarding.    |

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
Jeśli instalacja się powiedzie, ale `openclaw` nie zostanie znalezione w nowym terminalu, zobacz [Node.js troubleshooting](/pl/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Zalecany do większości interaktywnych instalacji na macOS/Linux/WSL.
</Tip>

### Przepływ (install.sh)

<Steps>
  <Step title="Wykrywanie systemu operacyjnego">
    Obsługuje macOS i Linux (w tym WSL). Jeśli wykryty zostanie macOS, instaluje Homebrew, jeśli go brakuje.
  </Step>
  <Step title="Zapewnienie domyślnie Node.js 24">
    Sprawdza wersję Node i w razie potrzeby instaluje Node 24 (Homebrew na macOS, skrypty konfiguracyjne NodeSource na Linux apt/dnf/yum). OpenClaw nadal obsługuje Node 22 LTS, obecnie `22.14+`, dla zgodności.
  </Step>
  <Step title="Zapewnienie Git">
    Instaluje Git, jeśli go brakuje.
  </Step>
  <Step title="Instalacja OpenClaw">
    - metoda `npm` (domyślna): globalna instalacja npm
    - metoda `git`: klonuje/aktualizuje repozytorium, instaluje zależności przez pnpm, buduje, a następnie instaluje wrapper w `~/.local/bin/openclaw`

  </Step>
  <Step title="Zadania po instalacji">
    - Odświeża załadowaną usługę Gateway w trybie best effort (`openclaw gateway install --force`, a następnie restart)
    - Uruchamia `openclaw doctor --non-interactive` przy aktualizacjach i instalacjach git (best effort)
    - Próbuje wykonać onboarding, gdy jest to właściwe (dostępne TTY, onboarding nie jest wyłączony, a kontrole bootstrap/config przechodzą)
    - Domyślnie ustawia `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Wykrywanie checkoutu źródłowego

Jeśli skrypt jest uruchamiany wewnątrz checkoutu OpenClaw (`package.json` + `pnpm-workspace.yaml`), oferuje:

- użycie checkoutu (`git`), albo
- użycie instalacji globalnej (`npm`)

Jeśli TTY nie jest dostępne i nie ustawiono metody instalacji, domyślnie wybiera `npm` i wyświetla ostrzeżenie.

Skrypt kończy się kodem `2` przy nieprawidłowym wyborze metody albo nieprawidłowych wartościach `--install-method`.

### Przykłady (install.sh)

<Tabs>
  <Tab title="Domyślna">
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

| Flaga                                 | Opis                                                          |
| ------------------------------------- | ------------------------------------------------------------- |
| `--install-method npm\|git`           | Wybór metody instalacji (domyślnie: `npm`). Alias: `--method` |
| `--npm`                               | Skrót dla metody npm                                          |
| `--git`                               | Skrót dla metody git. Alias: `--github`                       |
| `--version <version\|dist-tag\|spec>` | Wersja npm, dist-tag lub spec pakietu (domyślnie: `latest`)   |
| `--beta`                              | Użyj dist-tagu beta, jeśli dostępny, w przeciwnym razie fallback do `latest` |
| `--git-dir <path>`                    | Katalog checkoutu (domyślnie: `~/openclaw`). Alias: `--dir`   |
| `--no-git-update`                     | Pomiń `git pull` dla istniejącego checkoutu                   |
| `--no-prompt`                         | Wyłącz prompty                                                |
| `--no-onboard`                        | Pomiń onboarding                                              |
| `--onboard`                           | Włącz onboarding                                              |
| `--dry-run`                           | Wypisz działania bez stosowania zmian                         |
| `--verbose`                           | Włącz wyjście debug (`set -x`, logi npm na poziomie notice)   |
| `--help`                              | Pokaż użycie (`-h`)                                           |

  </Accordion>

  <Accordion title="Dokumentacja zmiennych środowiskowych">

| Zmienna                                                | Opis                                         |
| ------------------------------------------------------ | -------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Metoda instalacji                            |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Wersja npm, dist-tag lub spec pakietu        |
| `OPENCLAW_BETA=0\|1`                                    | Użyj beta, jeśli dostępne                    |
| `OPENCLAW_GIT_DIR=<path>`                               | Katalog checkoutu                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Włączanie/wyłączanie aktualizacji git        |
| `OPENCLAW_NO_PROMPT=1`                                  | Wyłącz prompty                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | Pomiń onboarding                             |
| `OPENCLAW_DRY_RUN=1`                                    | Tryb dry run                                 |
| `OPENCLAW_VERBOSE=1`                                    | Tryb debug                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Poziom logów npm                             |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Sterowanie zachowaniem sharp/libvips (domyślnie: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Przeznaczony do środowisk, w których chcesz mieć wszystko pod lokalnym prefiksem
(domyślnie `~/.openclaw`) i bez zależności od systemowego Node. Domyślnie obsługuje instalacje npm,
a także instalacje z checkoutu git w tym samym przepływie opartym o prefiks.
</Info>

### Przepływ (install-cli.sh)

<Steps>
  <Step title="Instalacja lokalnego środowiska uruchomieniowego Node">
    Pobiera przypięte obsługiwane archiwum tarball Node LTS (wersja jest osadzona w skrypcie i aktualizowana niezależnie) do `<prefix>/tools/node-v<version>` i weryfikuje SHA-256.
  </Step>
  <Step title="Zapewnienie Git">
    Jeśli Git nie jest dostępny, próbuje instalacji przez apt/dnf/yum na Linux albo Homebrew na macOS.
  </Step>
  <Step title="Instalacja OpenClaw pod prefiksem">
    - metoda `npm` (domyślna): instaluje pod prefiksem przez npm, a następnie zapisuje wrapper do `<prefix>/bin/openclaw`
    - metoda `git`: klonuje/aktualizuje checkout (domyślnie `~/openclaw`) i nadal zapisuje wrapper do `<prefix>/bin/openclaw`

  </Step>
  <Step title="Odświeżanie załadowanej usługi Gateway">
    Jeśli usługa Gateway jest już załadowana z tego samego prefiksu, skrypt uruchamia
    `openclaw gateway install --force`, a następnie `openclaw gateway restart`, i
    sonduje kondycję Gateway w trybie best effort.
  </Step>
</Steps>

### Przykłady (install-cli.sh)

<Tabs>
  <Tab title="Domyślna">
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
  <Tab title="Uruchamianie onboardingu">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Dokumentacja flag">

| Flaga                       | Opis                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefiks instalacji (domyślnie: `~/.openclaw`)                                   |
| `--install-method npm\|git` | Wybór metody instalacji (domyślnie: `npm`). Alias: `--method`                   |
| `--npm`                     | Skrót dla metody npm                                                            |
| `--git`, `--github`         | Skrót dla metody git                                                            |
| `--git-dir <path>`          | Katalog checkoutu git (domyślnie: `~/openclaw`). Alias: `--dir`                 |
| `--version <ver>`           | Wersja OpenClaw albo dist-tag (domyślnie: `latest`)                             |
| `--node-version <ver>`      | Wersja Node (domyślnie: `22.22.0`)                                              |
| `--json`                    | Emituje zdarzenia NDJSON                                                        |
| `--onboard`                 | Uruchamia `openclaw onboard` po instalacji                                      |
| `--no-onboard`              | Pomija onboarding (domyślnie)                                                   |
| `--set-npm-prefix`          | Na Linux wymusza prefiks npm na `~/.npm-global`, jeśli bieżący prefiks nie jest zapisywalny |
| `--help`                    | Pokazuje użycie (`-h`)                                                          |

  </Accordion>

  <Accordion title="Dokumentacja zmiennych środowiskowych">

| Zmienna                                   | Opis                                                |
| ----------------------------------------- | --------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefiks instalacji                                  |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metoda instalacji                                   |
| `OPENCLAW_VERSION=<ver>`                    | Wersja OpenClaw albo dist-tag                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Wersja Node                                         |
| `OPENCLAW_GIT_DIR=<path>`                   | Katalog checkoutu git dla instalacji git            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Włączanie/wyłączanie aktualizacji git dla istniejących checkoutów |
| `OPENCLAW_NO_ONBOARD=1`                     | Pomija onboarding                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Poziom logów npm                                    |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Sterowanie zachowaniem sharp/libvips (domyślnie: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Przepływ (install.ps1)

<Steps>
  <Step title="Zapewnienie PowerShell + środowiska Windows">
    Wymaga PowerShell 5+.
  </Step>
  <Step title="Zapewnienie domyślnie Node.js 24">
    Jeśli Node nie jest obecny, skrypt próbuje instalacji przez winget, następnie Chocolatey, a potem Scoop. Node 22 LTS, obecnie `22.14+`, pozostaje obsługiwany dla zgodności.
  </Step>
  <Step title="Instalacja OpenClaw">
    - metoda `npm` (domyślna): globalna instalacja npm z użyciem wybranego `-Tag`
    - metoda `git`: klonuje/aktualizuje repozytorium, instaluje/buduje przez pnpm i instaluje wrapper w `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Zadania po instalacji">
    - Dodaje wymagany katalog bin do użytkownika PATH, gdy to możliwe
    - Odświeża załadowaną usługę Gateway w trybie best effort (`openclaw gateway install --force`, a następnie restart)
    - Uruchamia `openclaw doctor --non-interactive` przy aktualizacjach i instalacjach git (best effort)

  </Step>
  <Step title="Obsługa błędów">
    Instalacje `iwr ... | iex` i scriptblock zgłaszają błąd kończący bez zamykania bieżącej sesji PowerShell. Bezpośrednie instalacje `powershell -File` / `pwsh -File` nadal kończą się kodem różnym od zera na potrzeby automatyzacji.
  </Step>
</Steps>

### Przykłady (install.ps1)

<Tabs>
  <Tab title="Domyślna">
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
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Dokumentacja flag">

| Flaga                      | Opis                                                         |
| -------------------------- | ------------------------------------------------------------ |
| `-InstallMethod npm\|git`   | Metoda instalacji (domyślnie: `npm`)                         |
| `-Tag <tag\|version\|spec>` | npm dist-tag, wersja albo spec pakietu (domyślnie: `latest`) |
| `-GitDir <path>`            | Katalog checkoutu (domyślnie: `%USERPROFILE%\openclaw`)      |
| `-NoOnboard`                | Pomija onboarding                                            |
| `-NoGitUpdate`              | Pomija `git pull`                                            |
| `-DryRun`                   | Tylko wypisuje działania                                     |

  </Accordion>

  <Accordion title="Dokumentacja zmiennych środowiskowych">

| Zmienna                          | Opis               |
| -------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metoda instalacji  |
| `OPENCLAW_GIT_DIR=<path>`          | Katalog checkoutu  |
| `OPENCLAW_NO_ONBOARD=1`            | Pomija onboarding  |
| `OPENCLAW_GIT_UPDATE=0`            | Wyłącza git pull   |
| `OPENCLAW_DRY_RUN=1`               | Tryb dry run       |

  </Accordion>
</AccordionGroup>

<Note>
Jeśli użyto `-InstallMethod git`, a Git nie jest zainstalowany, skrypt kończy działanie i wypisuje link do Git for Windows.
</Note>

---

## CI i automatyzacja

Używaj nieinteraktywnych flag/zmiennych env, aby uzyskać przewidywalne uruchomienia.

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
  <Tab title="install.ps1 (pomijanie onboardingu)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Dlaczego wymagany jest Git?">
    Git jest wymagany dla metody instalacji `git`. Przy instalacjach `npm` Git nadal jest sprawdzany/instalowany, aby uniknąć błędów `spawn git ENOENT`, gdy zależności używają URL git.
  </Accordion>

  <Accordion title="Dlaczego npm trafia na EACCES w Linux?">
    Niektóre konfiguracje Linux kierują globalny prefiks npm do ścieżek należących do roota. `install.sh` może przełączyć prefiks na `~/.npm-global` i dopisać eksporty PATH do plików rc powłoki (gdy te pliki istnieją).
  </Accordion>

  <Accordion title="Problemy z sharp/libvips">
    Skrypty domyślnie ustawiają `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, aby uniknąć budowania sharp względem systemowego libvips. Aby to nadpisać:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Zainstaluj Git for Windows, otwórz ponownie PowerShell i uruchom instalator jeszcze raz.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Uruchom `npm config get prefix` i dodaj ten katalog do PATH użytkownika (na Windows bez sufiksu `\bin`), a następnie otwórz ponownie PowerShell.
  </Accordion>

  <Accordion title="Windows: jak uzyskać szczegółowe wyjście instalatora">
    `install.ps1` obecnie nie udostępnia przełącznika `-Verbose`.
    Użyj śledzenia PowerShell do diagnostyki na poziomie skryptu:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="Po instalacji nie znaleziono openclaw">
    Zwykle jest to problem z PATH. Zobacz [Node.js troubleshooting](/pl/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Powiązane

- [Install overview](/pl/install)
- [Updating](/pl/install/updating)
- [Uninstall](/pl/install/uninstall)
