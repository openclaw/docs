---
read_when:
    - Sie möchten `openclaw.ai/install.sh` verstehen
    - Sie möchten Installationen automatisieren (CI / ohne Benutzeroberfläche)
    - Sie möchten aus einem GitHub-Checkout installieren
summary: Funktionsweise der Installationsskripte (install.sh, install-cli.sh, install.ps1), Flags und Automatisierung
title: Installer-Interna
x-i18n:
    generated_at: "2026-05-07T13:21:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: a62720526e2a5ffc94555f77e7e806d63768b849a9491b60f6fdc9cf070eed2f
    source_path: install/installer.md
    workflow: 16
---

OpenClaw liefert drei Installationsskripte aus, die von `openclaw.ai` bereitgestellt werden.

| Skript                             | Plattform             | Funktion                                                                                                       |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder git und kann das Onboarding ausführen. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installiert Node + OpenClaw mit npm- oder git-Checkout-Modus in ein lokales Präfix (`~/.openclaw`). Kein root erforderlich. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder git und kann das Onboarding ausführen. |

## Schnellbefehle

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
Wenn die Installation erfolgreich ist, `openclaw` aber in einem neuen Terminal nicht gefunden wird, lesen Sie [Problembehandlung für Node.js](/de/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Empfohlen für die meisten interaktiven Installationen unter macOS/Linux/WSL.
</Tip>

### Ablauf (install.sh)

<Steps>
  <Step title="Detect OS">
    Unterstützt macOS und Linux (einschließlich WSL). Wenn macOS erkannt wird, wird Homebrew installiert, falls es fehlt.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Prüft die Node-Version und installiert bei Bedarf Node 24 (Homebrew unter macOS, NodeSource-Setup-Skripte unter Linux apt/dnf/yum). Aus Kompatibilitätsgründen unterstützt OpenClaw weiterhin Node 22 LTS, derzeit `22.16+`.
  </Step>
  <Step title="Ensure Git">
    Installiert Git, falls es fehlt.
  </Step>
  <Step title="Install OpenClaw">
    - `npm`-Methode (Standard): globale npm-Installation
    - `git`-Methode: Repository klonen/aktualisieren, Abhängigkeiten mit pnpm installieren, bauen, dann Wrapper unter `~/.local/bin/openclaw` installieren

  </Step>
  <Step title="Post-install tasks">
    - Aktualisiert nach bestem Aufwand einen geladenen Gateway-Dienst (`openclaw gateway install --force`, dann Neustart)
    - Führt `openclaw doctor --non-interactive` bei Upgrades und git-Installationen aus (nach bestem Aufwand)
    - Versucht bei geeigneten Bedingungen das Onboarding (TTY verfügbar, Onboarding nicht deaktiviert und Bootstrap-/Konfigurationsprüfungen erfolgreich)
    - Setzt standardmäßig `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Erkennung eines Source-Checkouts

Wenn das Skript innerhalb eines OpenClaw-Checkouts ausgeführt wird (`package.json` + `pnpm-workspace.yaml`), bietet es Folgendes an:

- Checkout verwenden (`git`) oder
- globale Installation verwenden (`npm`)

Wenn kein TTY verfügbar ist und keine Installationsmethode festgelegt wurde, verwendet es standardmäßig `npm` und gibt eine Warnung aus.

Das Skript beendet sich mit Code `2` bei ungültiger Methodenauswahl oder ungültigen `--install-method`-Werten.

### Beispiele (install.sh)

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

| Flag                                  | Beschreibung                                              |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Installationsmethode auswählen (Standard: `npm`). Alias: `--method` |
| `--npm`                               | Kurzbefehl für die npm-Methode                             |
| `--git`                               | Kurzbefehl für die git-Methode. Alias: `--github`          |
| `--version <version\|dist-tag\|spec>` | npm-Version, dist-tag oder Paketangabe (Standard: `latest`) |
| `--beta`                              | Beta-dist-tag verwenden, falls verfügbar, sonst Fallback auf `latest` |
| `--git-dir <path>`                    | Checkout-Verzeichnis (Standard: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | `git pull` für vorhandenen Checkout überspringen           |
| `--no-prompt`                         | Eingabeaufforderungen deaktivieren                         |
| `--no-onboard`                        | Onboarding überspringen                                    |
| `--onboard`                           | Onboarding aktivieren                                      |
| `--dry-run`                           | Aktionen ausgeben, ohne Änderungen anzuwenden              |
| `--verbose`                           | Debug-Ausgabe aktivieren (`set -x`, npm-Logs auf notice-Level) |
| `--help`                              | Verwendung anzeigen (`-h`)                                 |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variable                                                | Beschreibung                                  |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Installationsmethode                          |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm-Version, dist-tag oder Paketangabe        |
| `OPENCLAW_BETA=0\|1`                                    | Beta verwenden, falls verfügbar               |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkout-Verzeichnis                          |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | git-Aktualisierungen umschalten               |
| `OPENCLAW_NO_PROMPT=1`                                  | Eingabeaufforderungen deaktivieren            |
| `OPENCLAW_NO_ONBOARD=1`                                 | Onboarding überspringen                       |
| `OPENCLAW_DRY_RUN=1`                                    | Probelaufmodus                                |
| `OPENCLAW_VERBOSE=1`                                    | Debug-Modus                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm-Log-Level                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp/libvips-Verhalten steuern (Standard: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Entwickelt für Umgebungen, in denen Sie alles unter einem lokalen Präfix
(Standard `~/.openclaw`) und ohne Systemabhängigkeit von Node haben möchten. Unterstützt standardmäßig npm-Installationen
sowie git-Checkout-Installationen im selben Präfix-Ablauf.
</Info>

### Ablauf (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Lädt ein fest gepinntes unterstütztes Node-LTS-Tarball (die Version ist im Skript eingebettet und wird unabhängig aktualisiert) nach `<prefix>/tools/node-v<version>` herunter und verifiziert SHA-256.
  </Step>
  <Step title="Ensure Git">
    Wenn Git fehlt, wird eine Installation über apt/dnf/yum unter Linux oder Homebrew unter macOS versucht.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - `npm`-Methode (Standard): installiert unter dem Präfix mit npm und schreibt dann den Wrapper nach `<prefix>/bin/openclaw`
    - `git`-Methode: klont/aktualisiert einen Checkout (Standard `~/openclaw`) und schreibt den Wrapper dennoch nach `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    Wenn ein Gateway-Dienst bereits aus demselben Präfix geladen ist, führt das Skript
    `openclaw gateway install --force`, dann `openclaw gateway restart` aus und
    prüft die Gateway-Integrität nach bestem Aufwand.
  </Step>
</Steps>

### Beispiele (install-cli.sh)

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

| Flag                        | Beschreibung                                                                    |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Installationspräfix (Standard: `~/.openclaw`)                                   |
| `--install-method npm\|git` | Installationsmethode auswählen (Standard: `npm`). Alias: `--method`             |
| `--npm`                     | Kurzbefehl für die npm-Methode                                                  |
| `--git`, `--github`         | Kurzbefehl für die git-Methode                                                  |
| `--git-dir <path>`          | Git-Checkout-Verzeichnis (Standard: `~/openclaw`). Alias: `--dir`               |
| `--version <ver>`           | OpenClaw-Version oder dist-tag (Standard: `latest`)                             |
| `--node-version <ver>`      | Node-Version (Standard: `22.22.0`)                                              |
| `--json`                    | NDJSON-Ereignisse ausgeben                                                      |
| `--onboard`                 | Nach der Installation `openclaw onboard` ausführen                              |
| `--no-onboard`              | Onboarding überspringen (Standard)                                              |
| `--set-npm-prefix`          | Unter Linux npm-Präfix auf `~/.npm-global` erzwingen, wenn das aktuelle Präfix nicht beschreibbar ist |
| `--help`                    | Verwendung anzeigen (`-h`)                                                      |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variable                                    | Beschreibung                                  |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Installationspräfix                           |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Installationsmethode                          |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw-Version oder dist-tag                |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node-Version                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | Git-Checkout-Verzeichnis für git-Installationen |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | git-Updates für vorhandene Checkouts umschalten |
| `OPENCLAW_NO_ONBOARD=1`                     | Onboarding überspringen                       |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm-Protokollierungsstufe                     |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips-Verhalten steuern (Standard: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Ablauf (install.ps1)

<Steps>
  <Step title="PowerShell- und Windows-Umgebung sicherstellen">
    Erfordert PowerShell 5+.
  </Step>
  <Step title="Standardmäßig Node.js 24 sicherstellen">
    Falls es fehlt, wird eine Installation über winget versucht, danach über Chocolatey, danach über Scoop. Node 22 LTS, derzeit `22.16+`, bleibt aus Kompatibilitätsgründen unterstützt.
  </Step>
  <Step title="OpenClaw installieren">
    - `npm`-Methode (Standard): globale npm-Installation mit dem ausgewählten `-Tag`, gestartet aus einem beschreibbaren temporären Installer-Verzeichnis, damit auch Shells funktionieren, die in geschützten Ordnern wie `C:\` geöffnet wurden
    - `git`-Methode: Repo klonen/aktualisieren, mit pnpm installieren/builden und Wrapper unter `%USERPROFILE%\.local\bin\openclaw.cmd` installieren

  </Step>
  <Step title="Aufgaben nach der Installation">
    - Fügt das benötigte bin-Verzeichnis nach Möglichkeit zum Benutzer-PATH hinzu
    - Aktualisiert nach bestem Bemühen einen geladenen Gateway-Dienst (`openclaw gateway install --force`, dann Neustart)
    - Führt `openclaw doctor --non-interactive` bei Upgrades und git-Installationen aus (nach bestem Bemühen)

  </Step>
  <Step title="Fehler behandeln">
    `iwr ... | iex` und Scriptblock-Installationen melden einen terminierenden Fehler, ohne die aktuelle PowerShell-Sitzung zu schließen. Direkte Installationen mit `powershell -File` / `pwsh -File` beenden sich für Automatisierung weiterhin mit einem Nicht-Null-Status.
  </Step>
</Steps>

### Beispiele (install.ps1)

<Tabs>
  <Tab title="Standard">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git-Installation">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main über npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Benutzerdefiniertes git-Verzeichnis">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Testlauf">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug-Trace">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags-Referenz">

| Flag                        | Beschreibung                                             |
| --------------------------- | -------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Installationsmethode (Standard: `npm`)                   |
| `-Tag <tag\|version\|spec>` | npm-dist-tag, Version oder Paketspezifikation (Standard: `latest`) |
| `-GitDir <path>`            | Checkout-Verzeichnis (Standard: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Onboarding überspringen                                  |
| `-NoGitUpdate`              | `git pull` überspringen                                  |
| `-DryRun`                   | Nur Aktionen ausgeben                                    |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                           | Beschreibung           |
| ---------------------------------- | ---------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Installationsmethode   |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout-Verzeichnis   |
| `OPENCLAW_NO_ONBOARD=1`            | Onboarding überspringen |
| `OPENCLAW_GIT_UPDATE=0`            | git pull deaktivieren  |
| `OPENCLAW_DRY_RUN=1`               | Testlaufmodus          |

  </Accordion>
</AccordionGroup>

<Note>
Wenn `-InstallMethod git` verwendet wird und Git fehlt, beendet sich das Skript und gibt den Link zu Git for Windows aus.
</Note>

---

## CI und Automatisierung

Verwenden Sie nicht-interaktive Flags/Umgebungsvariablen für vorhersehbare Ausführungen.

<Tabs>
  <Tab title="install.sh (nicht-interaktives npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (nicht-interaktives git)">
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
  <Tab title="install.ps1 (Onboarding überspringen)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Warum ist Git erforderlich?">
    Git ist für die `git`-Installationsmethode erforderlich. Bei `npm`-Installationen wird Git weiterhin geprüft/installiert, um `spawn git ENOENT`-Fehler zu vermeiden, wenn Abhängigkeiten git-URLs verwenden.
  </Accordion>

  <Accordion title="Warum trifft npm unter Linux auf EACCES?">
    Einige Linux-Setups verweisen das globale npm-Präfix auf root-eigene Pfade. `install.sh` kann das Präfix auf `~/.npm-global` umstellen und PATH-Exporte an Shell-rc-Dateien anhängen (wenn diese Dateien vorhanden sind).
  </Accordion>

  <Accordion title="sharp/libvips-Probleme">
    Die Skripte setzen standardmäßig `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, um zu vermeiden, dass sharp gegen das systemweite libvips gebaut wird. Zum Überschreiben:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Installieren Sie Git for Windows, öffnen Sie PowerShell erneut und führen Sie den Installer erneut aus.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Führen Sie `npm config get prefix` aus und fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein `\bin`-Suffix erforderlich), öffnen Sie danach PowerShell erneut.
  </Accordion>

  <Accordion title="Windows: ausführliche Installer-Ausgabe erhalten">
    `install.ps1` stellt derzeit keinen `-Verbose`-Schalter bereit.
    Verwenden Sie PowerShell-Tracing für Diagnosen auf Skriptebene:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw nach der Installation nicht gefunden">
    In der Regel ist dies ein PATH-Problem. Siehe [Node.js-Fehlerbehebung](/de/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Aktualisierung](/de/install/updating)
- [Deinstallation](/de/install/uninstall)
