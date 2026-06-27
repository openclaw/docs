---
read_when:
    - Sie möchten `openclaw.ai/install.sh` verstehen
    - Sie möchten Installationen automatisieren (CI / Headless)
    - Sie möchten aus einem GitHub-Checkout installieren
summary: Funktionsweise der Installationsskripte (install.sh, install-cli.sh, install.ps1), Flags und Automatisierung
title: Installer-Interna
x-i18n:
    generated_at: "2026-06-27T17:38:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw liefert drei Installationsskripte aus, die über `openclaw.ai` bereitgestellt werden.

| Skript                             | Plattform            | Funktion                                                                                                             |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installiert Node bei Bedarf, installiert OpenClaw über npm (Standard) oder git und kann das Onboarding ausführen.    |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installiert Node + OpenClaw in ein lokales Präfix (`~/.openclaw`) mit npm- oder git-Checkout-Modi. Kein Root nötig. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installiert Node bei Bedarf, installiert OpenClaw über npm (Standard) oder git und kann das Onboarding ausführen.    |

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
Wenn die Installation erfolgreich ist, aber `openclaw` in einem neuen Terminal nicht gefunden wird, siehe [Node.js-Fehlerbehebung](/de/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Empfohlen für die meisten interaktiven Installationen unter macOS/Linux/WSL.
</Tip>

### Ablauf (install.sh)

<Steps>
  <Step title="Betriebssystem erkennen">
    Unterstützt macOS und Linux (einschließlich WSL).
  </Step>
  <Step title="Standardmäßig Node.js 24 sicherstellen">
    Prüft die Node-Version und installiert Node 24 bei Bedarf (Homebrew unter macOS, NodeSource-Setup-Skripte unter Linux apt/dnf/yum). Unter macOS wird Homebrew nur installiert, wenn der Installer es für Node oder Git benötigt. OpenClaw unterstützt aus Kompatibilitätsgründen weiterhin Node 22 LTS, derzeit `22.19+`.
    Unter Alpine/musl Linux verwendet der Installer apk-Pakete statt NodeSource; die konfigurierten Alpine-Repositorys müssen Node `22.19+` bereitstellen (zum Zeitpunkt der Erstellung Alpine 3.21 oder neuer).
  </Step>
  <Step title="Git sicherstellen">
    Installiert Git, falls es fehlt, mit dem erkannten Paketmanager, einschließlich Homebrew unter macOS und apk unter Alpine.
  </Step>
  <Step title="OpenClaw installieren">
    - `npm`-Methode (Standard): globale npm-Installation
    - `git`-Methode: Repository klonen/aktualisieren, Abhängigkeiten mit pnpm installieren, bauen, dann Wrapper unter `~/.local/bin/openclaw` installieren

  </Step>
  <Step title="Aufgaben nach der Installation">
    - Aktualisiert einen geladenen Gateway-Dienst nach bestem Aufwand (`openclaw gateway install --force`, dann Neustart)
    - Führt `openclaw doctor --non-interactive` bei Upgrades und git-Installationen aus (nach bestem Aufwand)
    - Versucht das Onboarding, wenn geeignet (TTY verfügbar, Onboarding nicht deaktiviert und Bootstrap-/Konfigurationsprüfungen erfolgreich)

  </Step>
</Steps>

### Erkennung eines Source-Checkouts

Wenn das Skript innerhalb eines OpenClaw-Checkouts (`package.json` + `pnpm-workspace.yaml`) ausgeführt wird, bietet es Folgendes an:

- Checkout verwenden (`git`) oder
- globale Installation verwenden (`npm`)

Wenn kein TTY verfügbar ist und keine Installationsmethode festgelegt wurde, verwendet es standardmäßig `npm` und gibt eine Warnung aus.

Das Skript beendet sich mit Code `2` bei ungültiger Methodenauswahl oder ungültigen `--install-method`-Werten.

### Beispiele (install.sh)

<Tabs>
  <Tab title="Standard">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Onboarding überspringen">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git-Installation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub-main-Checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Probelauf">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referenz der Flags">

| Flag                                  | Beschreibung                                                |
| ------------------------------------- | ----------------------------------------------------------- |
| `--install-method npm\|git`           | Installationsmethode wählen (Standard: `npm`). Alias: `--method` |
| `--npm`                               | Kurzform für npm-Methode                                    |
| `--git`                               | Kurzform für git-Methode. Alias: `--github`                 |
| `--version <version\|dist-tag\|spec>` | npm-Version, Dist-Tag oder Paket-Spezifikation (Standard: `latest`) |
| `--beta`                              | Beta-Dist-Tag verwenden, falls verfügbar, sonst Fallback auf `latest` |
| `--git-dir <path>`                    | Checkout-Verzeichnis (Standard: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | `git pull` für bestehenden Checkout überspringen            |
| `--no-prompt`                         | Eingabeaufforderungen deaktivieren                          |
| `--no-onboard`                        | Onboarding überspringen                                     |
| `--onboard`                           | Onboarding aktivieren                                       |
| `--dry-run`                           | Aktionen ausgeben, ohne Änderungen anzuwenden               |
| `--verbose`                           | Debug-Ausgabe aktivieren (`set -x`, npm notice-level logs)  |
| `--help`                              | Verwendung anzeigen (`-h`)                                  |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                                          | Beschreibung                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Installationsmethode                                                |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm-Version, Dist-Tag oder Paket-Spezifikation                      |
| `OPENCLAW_BETA=0\|1`                              | Beta verwenden, falls verfügbar                                     |
| `OPENCLAW_HOME=<path>`                            | Basisverzeichnis für OpenClaw-Zustand und standardmäßige git-/Onboarding-Pfade |
| `OPENCLAW_GIT_DIR=<path>`                         | Checkout-Verzeichnis                                                |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | git-Updates umschalten                                              |
| `OPENCLAW_NO_PROMPT=1`                            | Eingabeaufforderungen deaktivieren                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | Onboarding überspringen                                             |
| `OPENCLAW_DRY_RUN=1`                              | Probelauf-Modus                                                     |
| `OPENCLAW_VERBOSE=1`                              | Debug-Modus                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm-Protokollstufe                                                  |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Entwickelt für Umgebungen, in denen alles unter einem lokalen Präfix
(Standard `~/.openclaw`) liegen soll und keine systemweite Node-Abhängigkeit bestehen soll. Unterstützt standardmäßig npm-Installationen
sowie git-Checkout-Installationen im selben Präfix-Ablauf.
</Info>

### Ablauf (install-cli.sh)

<Steps>
  <Step title="Lokale Node-Laufzeit installieren">
    Lädt ein festgelegtes unterstütztes Node-LTS-Tarball (die Version ist im Skript eingebettet und wird unabhängig aktualisiert) nach `<prefix>/tools/node-v<version>` herunter und prüft SHA-256.
    Unter Alpine/musl Linux, wo Node keine kompatiblen Tarballs für die festgelegte Laufzeit veröffentlicht, installiert es `nodejs` und `npm` mit `apk` und verknüpft diese Laufzeit in den Präfix-Wrapper-Pfad. Die Alpine-Repositorys müssen Node `22.19+` bereitstellen; verwenden Sie Alpine 3.21 oder neuer, wenn ältere Repositorys nur Node 20 oder 21 bereitstellen.
  </Step>
  <Step title="Git sicherstellen">
    Wenn Git fehlt, versucht das Skript die Installation über apt/dnf/yum/apk unter Linux oder Homebrew unter macOS.
  </Step>
  <Step title="OpenClaw unter Präfix installieren">
    - `npm`-Methode (Standard): installiert unter dem Präfix mit npm und schreibt dann den Wrapper nach `<prefix>/bin/openclaw`
    - `git`-Methode: klont/aktualisiert einen Checkout (Standard `~/openclaw`) und schreibt den Wrapper dennoch nach `<prefix>/bin/openclaw`

  </Step>
  <Step title="Geladenen Gateway-Dienst aktualisieren">
    Wenn ein Gateway-Dienst bereits aus demselben Präfix geladen ist, führt das Skript
    `openclaw gateway install --force`, dann `openclaw gateway restart` aus und
    prüft den Gateway-Zustand nach bestem Aufwand.
  </Step>
</Steps>

### Beispiele (install-cli.sh)

<Tabs>
  <Tab title="Standard">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Benutzerdefiniertes Präfix + Version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git-Installation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="JSON-Ausgabe für Automatisierung">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Onboarding ausführen">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referenz der Flags">

| Flag                        | Beschreibung                                                                      |
| --------------------------- | --------------------------------------------------------------------------------- |
| `--prefix <path>`           | Installationspräfix (Standard: `~/.openclaw`)                                     |
| `--install-method npm\|git` | Installationsmethode wählen (Standard: `npm`). Alias: `--method`                  |
| `--npm`                     | Kurzform für die npm-Methode                                                      |
| `--git`, `--github`         | Kurzform für die git-Methode                                                      |
| `--git-dir <path>`          | Git-Checkout-Verzeichnis (Standard: `~/openclaw`). Alias: `--dir`                 |
| `--version <ver>`           | OpenClaw-Version oder dist-tag (Standard: `latest`)                               |
| `--node-version <ver>`      | Node-Version (Standard: `22.22.0`)                                                |
| `--json`                    | NDJSON-Ereignisse ausgeben                                                        |
| `--onboard`                 | Nach der Installation `openclaw onboard` ausführen                                |
| `--no-onboard`              | Onboarding überspringen (Standard)                                                |
| `--set-npm-prefix`          | Unter Linux npm-Präfix auf `~/.npm-global` erzwingen, wenn das aktuelle Präfix nicht beschreibbar ist |
| `--help`                    | Nutzung anzeigen (`-h`)                                                           |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                                    | Beschreibung                                                       |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Installationspräfix                                                |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Installationsmethode                                               |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw-Version oder dist-tag                                     |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node-Version                                                       |
| `OPENCLAW_HOME=<path>`                      | Basisverzeichnis für OpenClaw-Status und Standardpfade für git/Onboarding |
| `OPENCLAW_GIT_DIR=<path>`                   | Git-Checkout-Verzeichnis für git-Installationen                    |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Git-Updates für vorhandene Checkouts umschalten                    |
| `OPENCLAW_NO_ONBOARD=1`                     | Onboarding überspringen                                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm-Protokollstufe                                                 |

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
    Falls nicht vorhanden, versucht das Skript die Installation über winget, dann Chocolatey, dann Scoop. Wenn kein Paketmanager verfügbar ist, lädt das Skript das offizielle Node.js-Windows-Zip nach `%LOCALAPPDATA%\OpenClaw\deps\portable-node` herunter und fügt es dem aktuellen Prozess und dem Benutzer-PATH hinzu. Node 22 LTS, derzeit `22.19+`, bleibt aus Kompatibilitätsgründen unterstützt.
  </Step>
  <Step title="OpenClaw installieren">
    - `npm`-Methode (Standard): globale npm-Installation mit dem ausgewählten `-Tag`, gestartet aus einem beschreibbaren temporären Installer-Verzeichnis, sodass Shells, die in geschützten Ordnern wie `C:\` geöffnet wurden, weiterhin funktionieren
    - `git`-Methode: Repo klonen/aktualisieren, mit pnpm installieren/bauen und Wrapper unter `%USERPROFILE%\.local\bin\openclaw.cmd` installieren. Wenn Git fehlt, richtet das Skript benutzerlokales MinGit unter `%LOCALAPPDATA%\OpenClaw\deps\portable-git` ein und fügt es dem aktuellen Prozess und dem Benutzer-PATH hinzu.

  </Step>
  <Step title="Aufgaben nach der Installation">
    - Fügt das benötigte bin-Verzeichnis nach Möglichkeit dem Benutzer-PATH hinzu
    - Aktualisiert bestmöglich einen geladenen Gateway-Dienst (`openclaw gateway install --force`, dann Neustart)
    - Führt bei Upgrades und git-Installationen `openclaw doctor --non-interactive` aus (bestmöglich)

  </Step>
  <Step title="Fehler behandeln">
    `iwr ... | iex` und Scriptblock-Installationen melden einen beendenden Fehler, ohne die aktuelle PowerShell-Sitzung zu schließen. Direkte Installationen mit `powershell -File` / `pwsh -File` beenden sich für Automatisierung weiterhin mit einem Exit-Code ungleich null.
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
  <Tab title="GitHub-main-Checkout">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Benutzerdefiniertes git-Verzeichnis">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Probelauf">
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

| Variable                           | Beschreibung        |
| ---------------------------------- | ------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Installationsmethode |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout-Verzeichnis |
| `OPENCLAW_NO_ONBOARD=1`            | Onboarding überspringen |
| `OPENCLAW_GIT_UPDATE=0`            | git pull deaktivieren |
| `OPENCLAW_DRY_RUN=1`               | Probelaufmodus      |

  </Accordion>
</AccordionGroup>

<Note>
Wenn `-InstallMethod git` verwendet wird und Git fehlt, versucht das Skript eine benutzerlokale MinGit-Einrichtung, bevor es den Link zu Git for Windows ausgibt.
</Note>

---

## CI und Automatisierung

Verwenden Sie nicht-interaktive Flags/Umgebungsvariablen für vorhersagbare Läufe.

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
    Git ist für die `git`-Installationsmethode erforderlich. Bei `npm`-Installationen wird Git dennoch geprüft/installiert, um `spawn git ENOENT`-Fehler zu vermeiden, wenn Abhängigkeiten git-URLs verwenden.
  </Accordion>

  <Accordion title="Warum tritt bei npm unter Linux EACCES auf?">
    Einige Linux-Setups verweisen das globale npm-Präfix auf root-eigene Pfade. `install.sh` kann das Präfix auf `~/.npm-global` umstellen und PATH-Exporte an Shell-rc-Dateien anhängen (wenn diese Dateien vorhanden sind).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Führen Sie den Installer erneut aus, damit er benutzerlokales MinGit einrichten kann, oder installieren Sie Git for Windows und öffnen Sie PowerShell erneut.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Führen Sie `npm config get prefix` aus und fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein `\bin`-Suffix erforderlich), öffnen Sie anschließend PowerShell erneut.
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

## Verwandt

- [Installationsübersicht](/de/install)
- [Aktualisieren](/de/install/updating)
- [Deinstallieren](/de/install/uninstall)
