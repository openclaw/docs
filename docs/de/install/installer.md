---
read_when:
    - Sie möchten `openclaw.ai/install.sh` verstehen
    - Sie möchten Installationen automatisieren (CI / Headless-Betrieb)
    - Sie möchten aus einem GitHub-Checkout installieren
summary: Funktionsweise der Installationsskripte (install.sh, install-cli.sh, install.ps1), Flags und Automatisierung
title: Installer-Interna
x-i18n:
    generated_at: "2026-04-30T07:00:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw liefert drei Installationsskripte, die über `openclaw.ai` bereitgestellt werden.

| Skript                             | Plattform            | Was es tut                                                                                                                    |
| ---------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder git und kann das Onboarding ausführen.             |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installiert Node + OpenClaw mit npm- oder git-Checkout-Modus in ein lokales Präfix (`~/.openclaw`). Kein Root erforderlich.   |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder git und kann das Onboarding ausführen.             |

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
Wenn die Installation erfolgreich ist, `openclaw` in einem neuen Terminal aber nicht gefunden wird, lesen Sie [Node.js-Fehlerbehebung](/de/install/node#troubleshooting).
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
    Prüft die Node-Version und installiert bei Bedarf Node 24 (Homebrew unter macOS, NodeSource-Einrichtungsskripte unter Linux mit apt/dnf/yum). OpenClaw unterstützt aus Kompatibilitätsgründen weiterhin Node 22 LTS, derzeit `22.14+`.
  </Step>
  <Step title="Ensure Git">
    Installiert Git, falls es fehlt.
  </Step>
  <Step title="Install OpenClaw">
    - Methode `npm` (Standard): globale npm-Installation
    - Methode `git`: Repository klonen/aktualisieren, Abhängigkeiten mit pnpm installieren, bauen und anschließend den Wrapper unter `~/.local/bin/openclaw` installieren

  </Step>
  <Step title="Post-install tasks">
    - Aktualisiert nach bestem Aufwand einen geladenen Gateway-Dienst (`openclaw gateway install --force`, dann Neustart)
    - Führt bei Upgrades und git-Installationen `openclaw doctor --non-interactive` aus (nach bestem Aufwand)
    - Versucht das Onboarding, wenn es angemessen ist (TTY verfügbar, Onboarding nicht deaktiviert und Bootstrap-/Konfigurationsprüfungen erfolgreich)
    - Setzt standardmäßig `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Erkennung des Quell-Checkouts

Wenn das Skript innerhalb eines OpenClaw-Checkouts ausgeführt wird (`package.json` + `pnpm-workspace.yaml`), bietet es Folgendes an:

- Checkout verwenden (`git`), oder
- globale Installation verwenden (`npm`)

Wenn kein TTY verfügbar und keine Installationsmethode festgelegt ist, wird standardmäßig `npm` verwendet und eine Warnung ausgegeben.

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

| Flag                                  | Beschreibung                                                       |
| ------------------------------------- | ------------------------------------------------------------------ |
| `--install-method npm\|git`           | Installationsmethode wählen (Standard: `npm`). Alias: `--method`  |
| `--npm`                               | Kurzform für die npm-Methode                                       |
| `--git`                               | Kurzform für die git-Methode. Alias: `--github`                    |
| `--version <version\|dist-tag\|spec>` | npm-Version, dist-tag oder Paketspezifikation (Standard: `latest`) |
| `--beta`                              | Beta-dist-tag verwenden, falls verfügbar, sonst Fallback auf `latest` |
| `--git-dir <path>`                    | Checkout-Verzeichnis (Standard: `~/openclaw`). Alias: `--dir`      |
| `--no-git-update`                     | `git pull` für vorhandenen Checkout überspringen                   |
| `--no-prompt`                         | Eingabeaufforderungen deaktivieren                                 |
| `--no-onboard`                        | Onboarding überspringen                                            |
| `--onboard`                           | Onboarding aktivieren                                              |
| `--dry-run`                           | Aktionen ausgeben, ohne Änderungen anzuwenden                      |
| `--verbose`                           | Debug-Ausgabe aktivieren (`set -x`, npm-Logs auf notice-Stufe)     |
| `--help`                              | Verwendung anzeigen (`-h`)                                         |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variable                                                | Beschreibung                                |
| ------------------------------------------------------- | ------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Installationsmethode                        |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm-Version, dist-tag oder Paketspezifikation |
| `OPENCLAW_BETA=0\|1`                                    | Beta verwenden, falls verfügbar             |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkout-Verzeichnis                        |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | git-Aktualisierungen umschalten             |
| `OPENCLAW_NO_PROMPT=1`                                  | Eingabeaufforderungen deaktivieren          |
| `OPENCLAW_NO_ONBOARD=1`                                 | Onboarding überspringen                     |
| `OPENCLAW_DRY_RUN=1`                                    | Trockenlaufmodus                            |
| `OPENCLAW_VERBOSE=1`                                    | Debug-Modus                                 |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm-Logstufe                                |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp/libvips-Verhalten steuern (Standard: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Entwickelt für Umgebungen, in denen Sie alles unter einem lokalen Präfix
(Standard `~/.openclaw`) und keine systemweite Node-Abhängigkeit möchten. Unterstützt standardmäßig npm-Installationen
sowie git-Checkout-Installationen unter demselben Präfix-Ablauf.
</Info>

### Ablauf (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Lädt einen festgelegten unterstützten Node-LTS-Tarball herunter (die Version ist im Skript eingebettet und wird unabhängig aktualisiert) nach `<prefix>/tools/node-v<version>` und prüft SHA-256.
  </Step>
  <Step title="Ensure Git">
    Wenn Git fehlt, wird die Installation über apt/dnf/yum unter Linux oder Homebrew unter macOS versucht.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - Methode `npm` (Standard): installiert unter dem Präfix mit npm und schreibt anschließend den Wrapper nach `<prefix>/bin/openclaw`
    - Methode `git`: klont/aktualisiert einen Checkout (Standard `~/openclaw`) und schreibt den Wrapper weiterhin nach `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    Wenn ein Gateway-Dienst bereits von demselben Präfix geladen ist, führt das Skript
    `openclaw gateway install --force`, dann `openclaw gateway restart` aus und
    prüft den Gateway-Zustand nach bestem Aufwand.
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

| Flag                        | Beschreibung                                                                  |
| --------------------------- | ----------------------------------------------------------------------------- |
| `--prefix <path>`           | Installationspräfix (Standard: `~/.openclaw`)                                 |
| `--install-method npm\|git` | Installationsmethode wählen (Standard: `npm`). Alias: `--method`             |
| `--npm`                     | Kurzform für die npm-Methode                                                  |
| `--git`, `--github`         | Kurzform für die git-Methode                                                  |
| `--git-dir <path>`          | Git-Checkout-Verzeichnis (Standard: `~/openclaw`). Alias: `--dir`             |
| `--version <ver>`           | OpenClaw-Version oder dist-tag (Standard: `latest`)                           |
| `--node-version <ver>`      | Node-Version (Standard: `22.22.0`)                                             |
| `--json`                    | NDJSON-Ereignisse ausgeben                                                    |
| `--onboard`                 | Nach der Installation `openclaw onboard` ausführen                            |
| `--no-onboard`              | Onboarding überspringen (Standard)                                            |
| `--set-npm-prefix`          | Unter Linux npm-Präfix auf `~/.npm-global` erzwingen, wenn das aktuelle Präfix nicht beschreibbar ist |
| `--help`                    | Verwendung anzeigen (`-h`)                                                    |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variable                                    | Beschreibung                                  |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Installationspräfix                           |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Installationsmethode                          |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw-Version oder dist-tag                |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node-Version                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | Git-Checkout-Verzeichnis für Git-Installationen |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Git-Updates für vorhandene Checkouts umschalten |
| `OPENCLAW_NO_ONBOARD=1`                     | Onboarding überspringen                       |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm-Protokollstufe                            |
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
    Falls nicht vorhanden, wird eine Installation über winget, dann Chocolatey und dann Scoop versucht. Node 22 LTS, derzeit `22.14+`, wird aus Kompatibilitätsgründen weiterhin unterstützt.
  </Step>
  <Step title="OpenClaw installieren">
    - `npm`-Methode (Standard): globale npm-Installation mit ausgewähltem `-Tag`
    - `git`-Methode: Repository klonen/aktualisieren, mit pnpm installieren/builden und Wrapper unter `%USERPROFILE%\.local\bin\openclaw.cmd` installieren

  </Step>
  <Step title="Aufgaben nach der Installation">
    - Fügt das benötigte bin-Verzeichnis nach Möglichkeit zum Benutzer-PATH hinzu
    - Aktualisiert einen geladenen Gateway-Dienst nach bestem Aufwand (`openclaw gateway install --force`, dann Neustart)
    - Führt `openclaw doctor --non-interactive` bei Upgrades und Git-Installationen aus (nach bestem Aufwand)

  </Step>
  <Step title="Fehler behandeln">
    `iwr ... | iex` und Scriptblock-Installationen melden einen terminierenden Fehler, ohne die aktuelle PowerShell-Sitzung zu schließen. Direkte Installationen mit `powershell -File` / `pwsh -File` beenden sich für Automatisierung weiterhin mit einem von null verschiedenen Exit-Code.
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
  <Tab title="Benutzerdefiniertes Git-Verzeichnis">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Probelauf">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug-Ablaufverfolgung">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flag-Referenz">

| Flag                        | Beschreibung                                              |
| --------------------------- | --------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Installationsmethode (Standard: `npm`)                    |
| `-Tag <tag\|version\|spec>` | npm-dist-tag, Version oder Paketspezifikation (Standard: `latest`) |
| `-GitDir <path>`            | Checkout-Verzeichnis (Standard: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Onboarding überspringen                                   |
| `-NoGitUpdate`              | `git pull` überspringen                                   |
| `-DryRun`                   | Nur Aktionen ausgeben                                     |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                           | Beschreibung          |
| ---------------------------------- | --------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Installationsmethode  |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout-Verzeichnis  |
| `OPENCLAW_NO_ONBOARD=1`            | Onboarding überspringen |
| `OPENCLAW_GIT_UPDATE=0`            | git pull deaktivieren |
| `OPENCLAW_DRY_RUN=1`               | Probelaufmodus        |

  </Accordion>
</AccordionGroup>

<Note>
Wenn `-InstallMethod git` verwendet wird und Git fehlt, beendet sich das Skript und gibt den Link zu Git for Windows aus.
</Note>

---

## CI und Automatisierung

Verwenden Sie nicht interaktive Flags/Umgebungsvariablen für vorhersagbare Läufe.

<Tabs>
  <Tab title="install.sh (nicht interaktiv, npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (nicht interaktiv, Git)">
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
    Git ist für die `git`-Installationsmethode erforderlich. Bei `npm`-Installationen wird Git weiterhin geprüft/installiert, um `spawn git ENOENT`-Fehler zu vermeiden, wenn Abhängigkeiten Git-URLs verwenden.
  </Accordion>

  <Accordion title="Warum tritt bei npm unter Linux EACCES auf?">
    Einige Linux-Konfigurationen verweisen beim globalen npm-Präfix auf Pfade, die root gehören. `install.sh` kann das Präfix auf `~/.npm-global` umstellen und PATH-Exporte an Shell-rc-Dateien anhängen (wenn diese Dateien vorhanden sind).
  </Accordion>

  <Accordion title="sharp/libvips-Probleme">
    Die Skripte setzen standardmäßig `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, um zu vermeiden, dass sharp gegen das System-libvips gebaut wird. Zum Überschreiben:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Installieren Sie Git for Windows, öffnen Sie PowerShell erneut und führen Sie den Installer noch einmal aus.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Führen Sie `npm config get prefix` aus und fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein `\bin`-Suffix erforderlich), öffnen Sie dann PowerShell erneut.
  </Accordion>

  <Accordion title="Windows: So erhalten Sie ausführliche Installer-Ausgabe">
    `install.ps1` stellt derzeit keinen `-Verbose`-Schalter bereit.
    Verwenden Sie PowerShell-Tracing für Diagnosen auf Skriptebene:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw nach der Installation nicht gefunden">
    Normalerweise ein PATH-Problem. Siehe [Node.js-Fehlerbehebung](/de/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Verwandt

- [Installationsübersicht](/de/install)
- [Aktualisieren](/de/install/updating)
- [Deinstallieren](/de/install/uninstall)
