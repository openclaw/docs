---
read_when:
    - Sie möchten `openclaw.ai/install.sh` verstehen.
    - Sie möchten Installationen automatisieren (CI / headless).
    - Sie möchten aus einem GitHub-Checkout installieren.
summary: Wie die Installer-Skripte funktionieren (`install.sh`, `install-cli.sh`, `install.ps1`), Flags und Automatisierung
title: Installer-Interna
x-i18n:
    generated_at: "2026-04-26T11:33:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f932fb3713e8ecfa75215b05d7071b3b75e6d1135d7c326313739f294023e2
    source_path: install/installer.md
    workflow: 15
---

OpenClaw enthält drei Installer-Skripte, die von `openclaw.ai` bereitgestellt werden.

| Skript                             | Plattform            | Was es tut                                                                                                      |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder git und kann Onboarding ausführen.  |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installiert Node + OpenClaw in ein lokales Präfix (`~/.openclaw`) mit npm- oder Git-Checkout-Modi. Kein Root erforderlich. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder git und kann Onboarding ausführen.  |

## Schnelle Befehle

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
Wenn die Installation erfolgreich war, `openclaw` aber in einem neuen Terminal nicht gefunden wird, siehe [Node.js-Fehlerbehebung](/de/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Empfohlen für die meisten interaktiven Installationen auf macOS/Linux/WSL.
</Tip>

### Ablauf (install.sh)

<Steps>
  <Step title="Betriebssystem erkennen">
    Unterstützt macOS und Linux (einschließlich WSL). Wenn macOS erkannt wird, wird Homebrew installiert, falls es fehlt.
  </Step>
  <Step title="Standardmäßig Node.js 24 sicherstellen">
    Prüft die Node-Version und installiert bei Bedarf Node 24 (Homebrew auf macOS, NodeSource-Setup-Skripte auf Linux mit apt/dnf/yum). OpenClaw unterstützt aus Kompatibilitätsgründen weiterhin Node 22 LTS, derzeit `22.14+`.
  </Step>
  <Step title="Git sicherstellen">
    Installiert Git, falls es fehlt.
  </Step>
  <Step title="OpenClaw installieren">
    - Methode `npm` (Standard): globale npm-Installation
    - Methode `git`: Repository klonen/aktualisieren, Abhängigkeiten mit pnpm installieren, bauen und dann den Wrapper unter `~/.local/bin/openclaw` installieren
  </Step>
  <Step title="Aufgaben nach der Installation">
    - Aktualisiert einen geladenen Gateway-Dienst nach bestem Bemühen (`openclaw gateway install --force`, dann Neustart)
    - Führt bei Upgrades und Git-Installationen `openclaw doctor --non-interactive` aus (Best Effort)
    - Versucht bei Bedarf Onboarding (TTY verfügbar, Onboarding nicht deaktiviert und Bootstrap-/Konfigurationsprüfungen erfolgreich)
    - Setzt standardmäßig `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### Erkennung eines Source-Checkouts

Wenn es innerhalb eines OpenClaw-Checkouts ausgeführt wird (`package.json` + `pnpm-workspace.yaml`), bietet das Skript Folgendes an:

- Checkout verwenden (`git`), oder
- globale Installation verwenden (`npm`)

Wenn kein TTY verfügbar ist und keine Installationsmethode gesetzt ist, verwendet es standardmäßig `npm` und gibt eine Warnung aus.

Das Skript beendet sich mit Code `2` bei ungültiger Methodenauswahl oder ungültigen Werten für `--install-method`.

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
  <Tab title="GitHub main über npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry Run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referenz der Flags">

| Flag                                  | Beschreibung                                              |
| ------------------------------------- | --------------------------------------------------------- |
| `--install-method npm\|git`           | Installationsmethode wählen (Standard: `npm`). Alias: `--method` |
| `--npm`                               | Kurzform für die npm-Methode                              |
| `--git`                               | Kurzform für die git-Methode. Alias: `--github`           |
| `--version <version\|dist-tag\|spec>` | npm-Version, Dist-Tag oder Paketspezifikation (Standard: `latest`) |
| `--beta`                              | Beta-Dist-Tag verwenden, falls verfügbar, sonst Fallback auf `latest` |
| `--git-dir <path>`                    | Checkout-Verzeichnis (Standard: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | `git pull` für vorhandenen Checkout überspringen          |
| `--no-prompt`                         | Prompts deaktivieren                                      |
| `--no-onboard`                        | Onboarding überspringen                                   |
| `--onboard`                           | Onboarding aktivieren                                     |
| `--dry-run`                           | Aktionen ausgeben, ohne Änderungen anzuwenden             |
| `--verbose`                           | Debug-Ausgabe aktivieren (`set -x`, npm-Logs auf Notice-Ebene) |
| `--help`                              | Verwendung anzeigen (`-h`)                                |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                                                | Beschreibung                                  |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Installationsmethode                          |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm-Version, Dist-Tag oder Paketspezifikation |
| `OPENCLAW_BETA=0\|1`                                    | Beta verwenden, falls verfügbar               |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkout-Verzeichnis                          |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Git-Aktualisierungen ein-/ausschalten         |
| `OPENCLAW_NO_PROMPT=1`                                  | Prompts deaktivieren                          |
| `OPENCLAW_NO_ONBOARD=1`                                 | Onboarding überspringen                       |
| `OPENCLAW_DRY_RUN=1`                                    | Dry-Run-Modus                                 |
| `OPENCLAW_VERBOSE=1`                                    | Debug-Modus                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm-Log-Level                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp-/libvips-Verhalten steuern (Standard: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Konzipiert für Umgebungen, in denen Sie alles unter einem lokalen Präfix
(Standard `~/.openclaw`) halten möchten und keine systemweite Node-Abhängigkeit wünschen. Unterstützt standardmäßig npm-Installationen
sowie Git-Checkout-Installationen innerhalb desselben Präfix-Flows.
</Info>

### Ablauf (install-cli.sh)

<Steps>
  <Step title="Lokale Node-Laufzeit installieren">
    Lädt ein festgelegtes unterstütztes Node-LTS-Tarball herunter (die Version ist im Skript eingebettet und wird unabhängig aktualisiert) nach `<prefix>/tools/node-v<version>` und verifiziert SHA-256.
  </Step>
  <Step title="Git sicherstellen">
    Wenn Git fehlt, wird eine Installation über apt/dnf/yum auf Linux oder Homebrew auf macOS versucht.
  </Step>
  <Step title="OpenClaw unter dem Präfix installieren">
    - Methode `npm` (Standard): installiert unter dem Präfix mit npm und schreibt dann einen Wrapper nach `<prefix>/bin/openclaw`
    - Methode `git`: klont/aktualisiert ein Checkout (Standard `~/openclaw`) und schreibt dennoch den Wrapper nach `<prefix>/bin/openclaw`
  </Step>
  <Step title="Geladenen Gateway-Dienst aktualisieren">
    Wenn bereits ein Gateway-Dienst aus demselben Präfix geladen ist, führt das Skript
    `openclaw gateway install --force`, dann `openclaw gateway restart` aus und
    prüft den Gateway-Status nach bestem Bemühen.
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

| Flag                        | Beschreibung                                                                     |
| --------------------------- | -------------------------------------------------------------------------------- |
| `--prefix <path>`           | Installationspräfix (Standard: `~/.openclaw`)                                    |
| `--install-method npm\|git` | Installationsmethode wählen (Standard: `npm`). Alias: `--method`                 |
| `--npm`                     | Kurzform für die npm-Methode                                                      |
| `--git`, `--github`         | Kurzform für die git-Methode                                                      |
| `--git-dir <path>`          | Git-Checkout-Verzeichnis (Standard: `~/openclaw`). Alias: `--dir`                |
| `--version <ver>`           | OpenClaw-Version oder Dist-Tag (Standard: `latest`)                              |
| `--node-version <ver>`      | Node-Version (Standard: `22.22.0`)                                               |
| `--json`                    | NDJSON-Ereignisse ausgeben                                                        |
| `--onboard`                 | `openclaw onboard` nach der Installation ausführen                               |
| `--no-onboard`              | Onboarding überspringen (Standard)                                                |
| `--set-npm-prefix`          | Unter Linux das npm-Präfix auf `~/.npm-global` erzwingen, wenn das aktuelle Präfix nicht beschreibbar ist |
| `--help`                    | Verwendung anzeigen (`-h`)                                                        |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                                    | Beschreibung                                 |
| ------------------------------------------- | -------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Installationspräfix                          |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Installationsmethode                         |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw-Version oder Dist-Tag               |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node-Version                                 |
| `OPENCLAW_GIT_DIR=<path>`                   | Git-Checkout-Verzeichnis für Git-Installationen |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Git-Aktualisierungen für bestehende Checkouts ein-/ausschalten |
| `OPENCLAW_NO_ONBOARD=1`                     | Onboarding überspringen                      |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm-Log-Level                                |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp-/libvips-Verhalten steuern (Standard: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Ablauf (install.ps1)

<Steps>
  <Step title="PowerShell + Windows-Umgebung sicherstellen">
    Erfordert PowerShell 5+.
  </Step>
  <Step title="Standardmäßig Node.js 24 sicherstellen">
    Falls Node fehlt, wird eine Installation über winget, dann Chocolatey, dann Scoop versucht. Node 22 LTS, derzeit `22.14+`, bleibt aus Kompatibilitätsgründen unterstützt.
  </Step>
  <Step title="OpenClaw installieren">
    - Methode `npm` (Standard): globale npm-Installation mit dem ausgewählten `-Tag`
    - Methode `git`: Repository klonen/aktualisieren, mit pnpm installieren/bauen und den Wrapper unter `%USERPROFILE%\.local\bin\openclaw.cmd` installieren
  </Step>
  <Step title="Aufgaben nach der Installation">
    - Fügt das benötigte bin-Verzeichnis nach Möglichkeit dem Benutzer-PATH hinzu
    - Aktualisiert einen geladenen Gateway-Dienst nach bestem Bemühen (`openclaw gateway install --force`, dann Neustart)
    - Führt bei Upgrades und Git-Installationen `openclaw doctor --non-interactive` aus (Best Effort)
  </Step>
  <Step title="Fehler behandeln">
    Installationen mit `iwr ... | iex` und Scriptblock melden einen terminierenden Fehler, ohne die aktuelle PowerShell-Sitzung zu schließen. Direkte Installationen mit `powershell -File` / `pwsh -File` beenden sich für Automatisierung weiterhin mit einem Fehlercode ungleich null.
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
  <Tab title="Dry Run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug-Trace">
    ```powershell
    # install.ps1 hat derzeit noch kein eigenes -Verbose-Flag.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referenz der Flags">

| Flag                        | Beschreibung                                              |
| --------------------------- | --------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Installationsmethode (Standard: `npm`)                    |
| `-Tag <tag\|version\|spec>` | npm-Dist-Tag, Version oder Paketspezifikation (Standard: `latest`) |
| `-GitDir <path>`            | Checkout-Verzeichnis (Standard: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Onboarding überspringen                                   |
| `-NoGitUpdate`              | `git pull` überspringen                                   |
| `-DryRun`                   | Nur Aktionen ausgeben                                     |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                           | Beschreibung         |
| ---------------------------------- | -------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Installationsmethode |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout-Verzeichnis |
| `OPENCLAW_NO_ONBOARD=1`            | Onboarding überspringen |
| `OPENCLAW_GIT_UPDATE=0`            | git pull deaktivieren |
| `OPENCLAW_DRY_RUN=1`               | Dry-Run-Modus        |

  </Accordion>
</AccordionGroup>

<Note>
Wenn `-InstallMethod git` verwendet wird und Git fehlt, beendet sich das Skript und gibt den Link zu Git for Windows aus.
</Note>

---

## CI und Automatisierung

Verwenden Sie nicht interaktive Flags/Umgebungsvariablen für vorhersehbare Läufe.

<Tabs>
  <Tab title="install.sh (nicht interaktives npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (nicht interaktives git)">
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
  <Accordion title="Warum wird Git benötigt?">
    Git wird für die Installationsmethode `git` benötigt. Bei `npm`-Installationen wird Git dennoch geprüft/installiert, um Fehler vom Typ `spawn git ENOENT` zu vermeiden, wenn Abhängigkeiten Git-URLs verwenden.
  </Accordion>

  <Accordion title="Warum schlägt npm unter Linux mit EACCES fehl?">
    Einige Linux-Setups zeigen für das globale npm-Präfix auf Root-eigene Pfade. `install.sh` kann das Präfix auf `~/.npm-global` umstellen und PATH-Exporte an Shell-RC-Dateien anhängen (wenn diese Dateien vorhanden sind).
  </Accordion>

  <Accordion title="sharp-/libvips-Probleme">
    Die Skripte setzen standardmäßig `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, damit sharp nicht gegen systemweites libvips gebaut wird. Zum Überschreiben:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Installieren Sie Git for Windows, öffnen Sie PowerShell erneut und starten Sie den Installer noch einmal.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Führen Sie `npm config get prefix` aus und fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ohne Suffix `\bin`), dann öffnen Sie PowerShell erneut.
  </Accordion>

  <Accordion title="Windows: Wie bekomme ich ausführliche Installer-Ausgabe?">
    `install.ps1` bietet derzeit keinen Schalter `-Verbose`.
    Verwenden Sie PowerShell-Trace für Diagnosen auf Skriptebene:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw nach der Installation nicht gefunden">
    Meist ein PATH-Problem. Siehe [Node.js-Fehlerbehebung](/de/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Verwandte Inhalte

- [Installationsüberblick](/de/install)
- [Aktualisieren](/de/install/updating)
- [Deinstallieren](/de/install/uninstall)
