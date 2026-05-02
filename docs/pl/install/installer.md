---
read_when:
    - Chcesz zrozumieć `openclaw.ai/install.sh`
    - Chcesz zautomatyzować instalacje (CI / bez interfejsu graficznego)
    - Chcesz zainstalować z lokalnej kopii repozytorium GitHub
summary: Jak działają skrypty instalatora (install.sh, install-cli.sh, install.ps1), flagi i automatyzacja
title: Wewnętrzne mechanizmy instalatora
x-i18n:
    generated_at: "2026-05-02T09:55:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119d94edae8cae2460e1bce9fe6bb31dc3c91d23443090cd34bf10adde9e10f1
    source_path: install/installer.md
    workflow: 16
---

OpenClaw dostarcza trzy skrypty instalacyjne serwowane z `openclaw.ai`.

| Skrypt                             | Platforma            | Co robi                                                                                                           |
| ---------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instaluje Node w razie potrzeby, instaluje OpenClaw przez npm (domyślnie) lub git i może uruchomić onboarding.   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instaluje Node + OpenClaw w lokalnym prefiksie (`~/.openclaw`) w trybach npm lub git checkout. Bez wymagań root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instaluje Node w razie potrzeby, instaluje OpenClaw przez npm (domyślnie) lub git i może uruchomić onboarding.   |

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
Zalecane dla większości interaktywnych instalacji na macOS/Linux/WSL.
</Tip>

### Przebieg (install.sh)

<Steps>
  <Step title="Detect OS">
    Obsługuje macOS i Linux (w tym WSL). Jeśli wykryto macOS, instaluje Homebrew, jeśli go brakuje.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Sprawdza wersję Node i instaluje Node 24 w razie potrzeby (Homebrew na macOS, skrypty instalacyjne NodeSource w Linux apt/dnf/yum). OpenClaw nadal obsługuje Node 22 LTS, obecnie `22.14+`, dla zgodności.
  </Step>
  <Step title="Ensure Git">
    Instaluje Git, jeśli go brakuje.
  </Step>
  <Step title="Install OpenClaw">
    - metoda `npm` (domyślna): globalna instalacja npm
    - metoda `git`: klonuje/aktualizuje repozytorium, instaluje zależności za pomocą pnpm, buduje, a następnie instaluje wrapper w `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - Odświeża załadowaną usługę Gateway w trybie best-effort (`openclaw gateway install --force`, potem restart)
    - Uruchamia `openclaw doctor --non-interactive` przy aktualizacjach i instalacjach git (best effort)
    - Próbuje uruchomić onboarding, gdy jest to właściwe (dostępny TTY, onboarding nie jest wyłączony, a kontrole bootstrap/config przechodzą)
    - Domyślnie ustawia `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Wykrywanie checkoutu źródłowego

Jeśli uruchomiono wewnątrz checkoutu OpenClaw (`package.json` + `pnpm-workspace.yaml`), skrypt oferuje:

- użycie checkoutu (`git`), albo
- użycie globalnej instalacji (`npm`)

Jeśli TTY nie jest dostępny i nie ustawiono metody instalacji, domyślnie wybiera `npm` i wyświetla ostrzeżenie.

Skrypt kończy działanie z kodem `2` przy nieprawidłowym wyborze metody lub nieprawidłowych wartościach `--install-method`.

### Przykłady (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
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
  <Accordion title="Flags reference">

| Flaga                                 | Opis                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Wybiera metodę instalacji (domyślnie: `npm`). Alias: `--method` |
| `--npm`                               | Skrót dla metody npm                                      |
| `--git`                               | Skrót dla metody git. Alias: `--github`                   |
| `--version <version\|dist-tag\|spec>` | Wersja npm, dist-tag lub specyfikacja pakietu (domyślnie: `latest`) |
| `--beta`                              | Używa dist-tag beta, jeśli dostępny, w przeciwnym razie wraca do `latest` |
| `--git-dir <path>`                    | Katalog checkoutu (domyślnie: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Pomija `git pull` dla istniejącego checkoutu              |
| `--no-prompt`                         | Wyłącza prompty                                          |
| `--no-onboard`                        | Pomija onboarding                                        |
| `--onboard`                           | Włącza onboarding                                        |
| `--dry-run`                           | Wypisuje działania bez stosowania zmian                   |
| `--verbose`                           | Włącza wyjście debugowania (`set -x`, logi npm na poziomie notice) |
| `--help`                              | Pokazuje użycie (`-h`)                                   |

  </Accordion>

  <Accordion title="Environment variables reference">

| Zmienna                                                | Opis                                      |
| ------------------------------------------------------ | ----------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                     | Metoda instalacji                         |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Wersja npm, dist-tag lub specyfikacja pakietu |
| `OPENCLAW_BETA=0\|1`                                   | Użyj beta, jeśli dostępna                 |
| `OPENCLAW_GIT_DIR=<path>`                              | Katalog checkoutu                         |
| `OPENCLAW_GIT_UPDATE=0\|1`                             | Przełącza aktualizacje git                |
| `OPENCLAW_NO_PROMPT=1`                                 | Wyłącza prompty                           |
| `OPENCLAW_NO_ONBOARD=1`                                | Pomija onboarding                         |
| `OPENCLAW_DRY_RUN=1`                                   | Tryb dry run                              |
| `OPENCLAW_VERBOSE=1`                                   | Tryb debugowania                          |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`            | Poziom logowania npm                      |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                     | Kontroluje zachowanie sharp/libvips (domyślnie: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Zaprojektowany dla środowisk, w których chcesz mieć wszystko pod lokalnym prefiksem
(domyślnie `~/.openclaw`) i bez systemowej zależności Node. Domyślnie obsługuje instalacje npm,
a także instalacje git-checkout w ramach tego samego przepływu prefiksu.
</Info>

### Przebieg (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Pobiera przypięty, obsługiwany tarball Node LTS (wersja jest osadzona w skrypcie i aktualizowana niezależnie) do `<prefix>/tools/node-v<version>` i weryfikuje SHA-256.
  </Step>
  <Step title="Ensure Git">
    Jeśli brakuje Git, próbuje zainstalować go przez apt/dnf/yum na Linux lub Homebrew na macOS.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - metoda `npm` (domyślna): instaluje pod prefiksem za pomocą npm, a następnie zapisuje wrapper do `<prefix>/bin/openclaw`
    - metoda `git`: klonuje/aktualizuje checkout (domyślnie `~/openclaw`) i nadal zapisuje wrapper do `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    Jeśli usługa Gateway jest już załadowana z tego samego prefiksu, skrypt uruchamia
    `openclaw gateway install --force`, potem `openclaw gateway restart`, oraz
    sprawdza stan Gateway w trybie best-effort.
  </Step>
</Steps>

### Przykłady (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flaga                       | Opis                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefiks instalacji (domyślnie: `~/.openclaw`)                                   |
| `--install-method npm\|git` | Wybiera metodę instalacji (domyślnie: `npm`). Alias: `--method`                 |
| `--npm`                     | Skrót dla metody npm                                                            |
| `--git`, `--github`         | Skrót dla metody git                                                            |
| `--git-dir <path>`          | Katalog checkoutu Git (domyślnie: `~/openclaw`). Alias: `--dir`                 |
| `--version <ver>`           | Wersja OpenClaw lub dist-tag (domyślnie: `latest`)                              |
| `--node-version <ver>`      | Wersja Node (domyślnie: `22.22.0`)                                              |
| `--json`                    | Emituje zdarzenia NDJSON                                                        |
| `--onboard`                 | Uruchamia `openclaw onboard` po instalacji                                      |
| `--no-onboard`              | Pomija onboarding (domyślnie)                                                   |
| `--set-npm-prefix`          | W Linux wymusza prefiks npm na `~/.npm-global`, jeśli bieżący prefiks nie jest zapisywalny |
| `--help`                    | Pokazuje użycie (`-h`)                                                          |

  </Accordion>

  <Accordion title="Environment variables reference">

| Zmienna                                     | Opis                                          |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefiks instalacji                            |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metoda instalacji                             |
| `OPENCLAW_VERSION=<ver>`                    | Wersja OpenClaw lub dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | Wersja Node                                   |
| `OPENCLAW_GIT_DIR=<path>`                   | Katalog checkout Git dla instalacji z git     |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Przełącznik aktualizacji git dla istniejących checkoutów |
| `OPENCLAW_NO_ONBOARD=1`                     | Pomiń onboarding                              |
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
    Jeśli go brakuje, próbuje zainstalować przez winget, potem Chocolatey, a następnie Scoop. Node 22 LTS, obecnie `22.14+`, pozostaje obsługiwany dla zgodności.
  </Step>
  <Step title="Zainstaluj OpenClaw">
    - Metoda `npm` (domyślna): globalna instalacja npm z użyciem wybranego `-Tag`, uruchamiana z zapisywalnego katalogu tymczasowego instalatora, aby powłoki otwarte w chronionych folderach, takich jak `C:\`, nadal działały
    - Metoda `git`: sklonowanie/zaktualizowanie repozytorium, instalacja/kompilacja z pnpm oraz instalacja wrappera w `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Wykonaj zadania poinstalacyjne">
    - Gdy to możliwe, dodaje wymagany katalog bin do PATH użytkownika
    - Odświeża załadowaną usługę Gateway w trybie best-effort (`openclaw gateway install --force`, potem restart)
    - Uruchamia `openclaw doctor --non-interactive` przy aktualizacjach i instalacjach z git (best effort)

  </Step>
  <Step title="Obsłuż błędy">
    Instalacje `iwr ... | iex` i scriptblock zgłaszają błąd kończący bez zamykania bieżącej sesji PowerShell. Bezpośrednie instalacje `powershell -File` / `pwsh -File` nadal kończą się kodem niezerowym dla automatyzacji.
  </Step>
</Steps>

### Przykłady (install.ps1)

<Tabs>
  <Tab title="Domyślnie">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalacja z Git">
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
  <Tab title="Uruchomienie próbne">
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
  <Accordion title="Informacje o flagach">

| Flaga                       | Opis                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metoda instalacji (domyślnie: `npm`)                       |
| `-Tag <tag\|version\|spec>` | dist-tag npm, wersja lub specyfikacja pakietu (domyślnie: `latest`) |
| `-GitDir <path>`            | Katalog checkout (domyślnie: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Pomiń onboarding                                           |
| `-NoGitUpdate`              | Pomiń `git pull`                                           |
| `-DryRun`                   | Tylko wypisz działania                                     |

  </Accordion>

  <Accordion title="Informacje o zmiennych środowiskowych">

| Zmienna                            | Opis                  |
| ---------------------------------- | --------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metoda instalacji     |
| `OPENCLAW_GIT_DIR=<path>`          | Katalog checkout      |
| `OPENCLAW_NO_ONBOARD=1`            | Pomiń onboarding      |
| `OPENCLAW_GIT_UPDATE=0`            | Wyłącz git pull       |
| `OPENCLAW_DRY_RUN=1`               | Tryb uruchomienia próbnego |

  </Accordion>
</AccordionGroup>

<Note>
Jeśli użyto `-InstallMethod git`, a Git nie jest dostępny, skrypt kończy działanie i wypisuje link do Git for Windows.
</Note>

---

## CI i automatyzacja

Używaj nieinteraktywnych flag/zmiennych środowiskowych, aby uzyskać przewidywalne uruchomienia.

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
    Git jest wymagany dla metody instalacji `git`. W przypadku instalacji `npm` Git nadal jest sprawdzany/instalowany, aby uniknąć błędów `spawn git ENOENT`, gdy zależności używają adresów URL git.
  </Accordion>

  <Accordion title="Dlaczego npm trafia na EACCES w Linux?">
    Niektóre konfiguracje Linux wskazują globalny prefiks npm na ścieżki należące do roota. `install.sh` może przełączyć prefiks na `~/.npm-global` i dopisać eksporty PATH do plików rc powłoki (gdy te pliki istnieją).
  </Accordion>

  <Accordion title="Problemy z sharp/libvips">
    Skrypty domyślnie ustawiają `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, aby uniknąć budowania sharp względem systemowego libvips. Aby nadpisać:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Zainstaluj Git for Windows, ponownie otwórz PowerShell i uruchom instalator ponownie.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Uruchom `npm config get prefix` i dodaj ten katalog do PATH użytkownika (w Windows nie jest potrzebny sufiks `\bin`), a następnie ponownie otwórz PowerShell.
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

  <Accordion title="openclaw nie znaleziono po instalacji">
    Zwykle jest to problem z PATH. Zobacz [rozwiązywanie problemów z Node.js](/pl/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Aktualizacja](/pl/install/updating)
- [Odinstalowanie](/pl/install/uninstall)
