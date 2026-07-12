---
read_when:
    - Sie möchten `openclaw.ai/install.sh` verstehen
    - Sie möchten Installationen automatisieren (CI / ohne Benutzeroberfläche)
    - Sie möchten aus einem GitHub-Checkout installieren
summary: Funktionsweise der Installationsskripte (install.sh, install-cli.sh, install.ps1), Flags und Automatisierung
title: Interne Funktionsweise des Installationsprogramms
x-i18n:
    generated_at: "2026-07-12T01:46:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw stellt drei Installationsskripte bereit, die über `openclaw.ai` ausgeliefert werden.

| Skript                             | Plattform             | Funktion                                                                                                  |
| ---------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL   | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder Git und kann das Onboarding ausführen. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL   | Installiert Node und OpenClaw über npm oder Git in einem lokalen Präfix (`~/.openclaw`). Keine Root-Rechte erforderlich. |
| [`install.ps1`](#installps1)       | Windows (PowerShell)  | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder Git und kann das Onboarding ausführen. |

Alle drei unterstützen Node **22.19+, 23.11+ oder 24+**; Node 24 ist das Standardziel für Neuinstallationen.

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
Wenn die Installation erfolgreich war, `openclaw` aber in einem neuen Terminal nicht gefunden wird, lesen Sie den Abschnitt zur [Fehlerbehebung für Node.js](/de/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Für die meisten interaktiven Installationen unter macOS/Linux/WSL empfohlen.
</Tip>

### Ablauf (install.sh)

<Steps>
  <Step title="Betriebssystem erkennen">
    Unterstützt macOS und Linux (einschließlich WSL).
  </Step>
  <Step title="Standardmäßig Node.js 24 sicherstellen">
    Prüft die Node-Version und installiert bei Bedarf Node 24 (Homebrew unter macOS, NodeSource-Einrichtungsskripte unter Linux mit apt/dnf/yum). Unter macOS wird Homebrew nur installiert, wenn das Installationsprogramm es für Node oder Git benötigt. Node 22.19+ und 23.11+ werden aus Kompatibilitätsgründen weiterhin unterstützt.
    Unter Alpine/musl Linux verwendet das Installationsprogramm apk-Pakete anstelle von NodeSource; die konfigurierten Alpine-Paketquellen müssen eine unterstützte Node-Version bereitstellen (zum Zeitpunkt der Erstellung Alpine 3.21 oder neuer).
  </Step>
  <Step title="Git sicherstellen">
    Installiert Git bei Bedarf über den erkannten Paketmanager, einschließlich Homebrew unter macOS und apk unter Alpine.
  </Step>
  <Step title="OpenClaw installieren">
    - Methode `npm` (Standard): globale Installation mit npm
    - Methode `git`: Repository klonen/aktualisieren, Abhängigkeiten mit pnpm installieren, Build erstellen und anschließend den Wrapper unter `~/.local/bin/openclaw` installieren

  </Step>
  <Step title="Aufgaben nach der Installation">
    - Ermittelt die soeben installierte `openclaw`-Binärdatei für nachfolgende Befehle
    - Bei einer nicht konfigurierten Installation wird das Onboarding vor Doctor- oder Gateway-Prüfungen gestartet. Mit `--no-onboard` oder ohne TTY wird der Befehl ausgegeben, mit dem Sie die Einrichtung später abschließen können.
    - Bei einer konfigurierten Installation wird ein geladener Gateway-Dienst nach bestem Bemühen aktualisiert und neu gestartet und anschließend Doctor ausgeführt. Bei Upgrades werden Plugins nach Möglichkeit aktualisiert; andernfalls wird bei einer nicht interaktiven Ausführung mit aktivierten Eingabeaufforderungen der manuelle Befehl ausgegeben.
    - Wenn `--verify` ausgeführt wird, prüft das Skript die installierte Version und den Zustand des Gateways nur, wenn bereits eine Konfiguration vorhanden ist.

  </Step>
</Steps>

### Erkennung eines Quellcode-Checkouts

Bei Ausführung innerhalb eines OpenClaw-Checkouts (`package.json` + `pnpm-workspace.yaml`) bietet das Skript folgende Optionen an:

- Checkout verwenden (`git`) oder
- globale Installation verwenden (`npm`)

Wenn kein TTY verfügbar und keine Installationsmethode festgelegt ist, wird standardmäßig `npm` verwendet und eine Warnung ausgegeben.

Bei einer ungültigen Methodenauswahl oder ungültigen Werten für `--install-method` beendet sich das Skript mit Code `2`.

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
  <Tab title="Checkout des Hauptzweigs auf GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Testlauf">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Nach der Installation überprüfen">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referenz der Optionen">

| Option                                  | Beschreibung                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `--install-method \| --method npm\|git` | Installationsmethode auswählen (Standard: `npm`)                                      |
| `--npm`                                 | Kurzform für die npm-Methode                                                         |
| `--git \| --github`                     | Kurzform für die Git-Methode                                                         |
| `--version <version\|dist-tag\|spec>`   | npm-Version, Distributions-Tag oder Paketspezifikation (Standard: `latest`)           |
| `--beta`                                | Beta-Distributions-Tag verwenden, falls verfügbar, andernfalls auf `latest` zurückfallen |
| `--git-dir \| --dir <path>`             | Checkout-Verzeichnis (Standard: `~/openclaw`)                                        |
| `--no-git-update`                       | `git pull` für vorhandenen Checkout überspringen                                     |
| `--no-prompt`                           | Eingabeaufforderungen deaktivieren                                                   |
| `--no-onboard`                          | Onboarding überspringen                                                              |
| `--onboard`                             | Onboarding aktivieren                                                                |
| `--verify`                              | Kurzprüfung nach der Installation ausführen (`--version`, Zustand des Gateways, falls geladen) |
| `--dry-run`                             | Aktionen ausgeben, ohne Änderungen anzuwenden                                        |
| `--verbose`                             | Debug-Ausgabe aktivieren (`set -x`, npm-Protokolle auf Hinweisstufe)                  |
| `--help \| -h`                          | Verwendung anzeigen                                                                 |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                                          | Beschreibung                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Installationsmethode                                                              |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm-Version, Distributions-Tag oder Paketspezifikation                             |
| `OPENCLAW_BETA=0\|1`                              | Beta verwenden, falls verfügbar                                                   |
| `OPENCLAW_HOME=<path>`                            | Basisverzeichnis für den OpenClaw-Zustand und die standardmäßigen Git-/Onboarding-Pfade |
| `OPENCLAW_GIT_DIR=<path>`                         | Checkout-Verzeichnis                                                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Git-Aktualisierungen ein- oder ausschalten                                         |
| `OPENCLAW_NO_PROMPT=1`                            | Eingabeaufforderungen deaktivieren                                                 |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Kurzprüfung nach der Installation ausführen                                        |
| `OPENCLAW_NO_ONBOARD=1`                           | Onboarding überspringen                                                            |
| `OPENCLAW_DRY_RUN=1`                              | Testlaufmodus                                                                      |
| `OPENCLAW_VERBOSE=1`                              | Debug-Modus                                                                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm-Protokollstufe (Standard: `error`, blendet npm-Warnungen zu veralteten Funktionen aus) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Für Umgebungen konzipiert, in denen Sie alles unter einem lokalen Präfix
(standardmäßig `~/.openclaw`) und ohne systemweite Node-Abhängigkeit installieren möchten. Unterstützt
standardmäßig npm-Installationen sowie Git-Checkout-Installationen mit demselben Präfix-Ablauf.
</Info>

### Ablauf (install-cli.sh)

<Steps>
  <Step title="Lokale Node-Laufzeit installieren">
    Lädt ein festgelegtes unterstütztes Node-LTS-Tarball (die Version ist im Skript eingebettet und wird unabhängig aktualisiert, Standard: `22.22.2`) nach `<prefix>/tools/node-v<version>` herunter und überprüft SHA-256.
    Unter Alpine/musl Linux, für das Node keine kompatiblen Tarballs für die festgelegte Laufzeit veröffentlicht, werden `nodejs` und `npm` mit `apk` installiert und diese Laufzeit mit dem Wrapper-Pfad des Präfixes verknüpft. Die Alpine-Paketquellen müssen eine unterstützte Node-Version bereitstellen (22.19+, 23.11+ oder 24+); verwenden Sie Alpine 3.21 oder neuer, wenn ältere Paketquellen nur Node 20 oder 21 bereitstellen.
  </Step>
  <Step title="Git sicherstellen">
    Wenn Git fehlt, wird versucht, es unter Linux über apt/dnf/yum/apk oder unter macOS über Homebrew zu installieren.
  </Step>
  <Step title="OpenClaw unter dem Präfix installieren">
    - Methode `npm` (Standard): installiert OpenClaw mit npm unter dem Präfix und schreibt anschließend den Wrapper nach `<prefix>/bin/openclaw`
    - Methode `git`: klont/aktualisiert einen Checkout (Standard: `~/openclaw`) und schreibt den Wrapper ebenfalls nach `<prefix>/bin/openclaw`

  </Step>
  <Step title="Geladenen Gateway-Dienst aktualisieren">
    Wenn bereits ein Gateway-Dienst aus demselben Präfix geladen ist, führt das Skript
    `openclaw gateway install --force` und anschließend `openclaw gateway restart` aus und
    prüft den Zustand des Gateways nach bestem Bemühen.
  </Step>
</Steps>

### Beispiele (install-cli.sh)

<Tabs>
  <Tab title="Standard">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Benutzerdefiniertes Präfix und Version">
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
  <Accordion title="Referenz der Optionen">

| Flag                                    | Beschreibung                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Installationspräfix (Standard: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | Installationsmethode auswählen (Standard: `npm`)                                      |
| `--npm`                                 | Kurzform für die npm-Methode                                                          |
| `--git \| --github`                     | Kurzform für die git-Methode                                                          |
| `--git-dir \| --dir <path>`             | Verzeichnis für den Git-Checkout (Standard: `~/openclaw`)                             |
| `--version <ver>`                       | OpenClaw-Version oder Distributions-Tag (Standard: `latest`)                          |
| `--node-version <ver>`                  | Node-Version (Standard: `22.22.2`)                                                    |
| `--json`                                | NDJSON-Ereignisse ausgeben                                                            |
| `--onboard`                             | Nach der Installation `openclaw onboard` ausführen                                    |
| `--no-onboard`                          | Onboarding überspringen (Standard)                                                    |
| `--set-npm-prefix`                      | Unter Linux das npm-Präfix auf `~/.npm-global` setzen, wenn das aktuelle nicht beschreibbar ist |
| `--help \| -h`                          | Verwendung anzeigen                                                                  |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                                    | Beschreibung                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Installationspräfix                                                           |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Installationsmethode                                                          |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw-Version oder Distributions-Tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node-Version                                                                  |
| `OPENCLAW_HOME=<path>`                      | Basisverzeichnis für den OpenClaw-Zustand und die standardmäßigen Git-/Onboarding-Pfade |
| `OPENCLAW_GIT_DIR=<path>`                   | Verzeichnis für den Git-Checkout bei Git-Installationen                       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Git-Aktualisierungen für vorhandene Checkouts ein- oder ausschalten           |
| `OPENCLAW_NO_ONBOARD=1`                     | Onboarding überspringen                                                       |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm-Protokollierungsstufe (Standard: `error`)                                 |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` und andere GitHub-Quellspezifikationen sind keine gültigen `--version`-Ziele für npm-Installationen. Verwenden Sie stattdessen `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Ablauf (install.ps1)

<Steps>
  <Step title="PowerShell- und Windows-Umgebung sicherstellen">
    Erfordert PowerShell 5 oder höher.
  </Step>
  <Step title="Standardmäßig Node.js 24 sicherstellen">
    Falls Node.js fehlt, wird zunächst die Installation über winget, dann über Chocolatey und anschließend über Scoop versucht. Wenn kein Paketmanager verfügbar ist, lädt das Skript die offizielle ZIP-Datei von Node.js 24 für Windows nach `%LOCALAPPDATA%\OpenClaw\deps\portable-node` herunter und fügt das Verzeichnis dem PATH des aktuellen Prozesses und des Benutzers hinzu. Node 22.19 oder höher sowie 23.11 oder höher werden aus Kompatibilitätsgründen weiterhin unterstützt.
  </Step>
  <Step title="OpenClaw installieren">
    - `npm`-Methode (Standard): globale npm-Installation mit dem ausgewählten `-Tag`, ausgeführt aus einem beschreibbaren temporären Installationsverzeichnis, damit auch Shells funktionieren, die in geschützten Ordnern wie `C:\` geöffnet wurden
    - `git`-Methode: Repository klonen oder aktualisieren, mit pnpm installieren und erstellen sowie den Wrapper unter `%USERPROFILE%\.local\bin\openclaw.cmd` installieren. Falls Git fehlt, richtet das Skript eine benutzerlokale MinGit-Installation unter `%LOCALAPPDATA%\OpenClaw\deps\portable-git` ein und fügt sie dem PATH des aktuellen Prozesses und des Benutzers hinzu.

  </Step>
  <Step title="Aufgaben nach der Installation">
    - Fügt das erforderliche Binärverzeichnis nach Möglichkeit dem Benutzer-PATH hinzu
    - Aktualisiert nach bestem Bemühen einen geladenen Gateway-Dienst (`openclaw gateway install --force`, anschließend Neustart)
    - Führt bei Upgrades und Git-Installationen `openclaw doctor --non-interactive` aus (nach bestem Bemühen)

  </Step>
  <Step title="Fehler behandeln">
    Installationen über `iwr ... | iex` und Skriptblöcke melden einen terminierenden Fehler, ohne die aktuelle PowerShell-Sitzung zu schließen. Direkte Installationen über `powershell -File` / `pwsh -File` werden für Automatisierungszwecke weiterhin mit einem von null verschiedenen Statuscode beendet.
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
  <Tab title="Checkout des GitHub-Hauptzweigs">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
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
</Tabs>

<AccordionGroup>
  <Accordion title="Flag-Referenz">

| Flag                        | Beschreibung                                                        |
| --------------------------- | ------------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Installationsmethode (Standard: `npm`)                              |
| `-Tag <tag\|version\|spec>` | npm-Distributions-Tag, Version oder Paketspezifikation (Standard: `latest`) |
| `-GitDir <path>`            | Checkout-Verzeichnis (Standard: `%USERPROFILE%\openclaw`)           |
| `-NoOnboard`                | Onboarding überspringen                                             |
| `-NoGitUpdate`              | `git pull` überspringen                                             |
| `-DryRun`                   | Nur Aktionen ausgeben                                               |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                           | Beschreibung                   |
| ---------------------------------- | ------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Installationsmethode            |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout-Verzeichnis            |
| `OPENCLAW_NO_ONBOARD=1`            | Onboarding überspringen         |
| `OPENCLAW_GIT_UPDATE=0`            | `git pull` deaktivieren         |
| `OPENCLAW_DRY_RUN=1`               | Probelaufmodus                  |

  </Accordion>
</AccordionGroup>

<Note>
Wenn `-InstallMethod git` verwendet wird und Git fehlt, versucht das Skript zunächst, eine benutzerlokale MinGit-Installation einzurichten, bevor es den Link zu Git for Windows ausgibt.
</Note>

---

## CI und Automatisierung

Verwenden Sie nicht interaktive Flags und Umgebungsvariablen für vorhersagbare Ausführungen.

<Tabs>
  <Tab title="install.sh (nicht interaktives npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (nicht interaktives Git)">
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
    Git ist für die Installationsmethode `git` erforderlich. Bei `npm`-Installationen wird Git ebenfalls geprüft und installiert, um `spawn git ENOENT`-Fehler zu vermeiden, wenn Abhängigkeiten Git-URLs verwenden.
  </Accordion>

  <Accordion title="Warum tritt bei npm unter Linux EACCES auf?">
    Bei einigen Linux-Konfigurationen verweist das globale npm-Präfix auf Pfade, die root gehören. `install.sh` kann das Präfix auf `~/.npm-global` umstellen und PATH-Exporte an die RC-Dateien der Shell anhängen, sofern diese Dateien vorhanden sind.
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Führen Sie das Installationsprogramm erneut aus, damit es eine benutzerlokale MinGit-Installation einrichten kann, oder installieren Sie Git for Windows und öffnen Sie PowerShell erneut.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Führen Sie `npm config get prefix` aus und fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` erforderlich). Öffnen Sie anschließend PowerShell erneut.
  </Accordion>

  <Accordion title="Windows: ausführliche Ausgabe des Installationsprogramms abrufen">
    `install.ps1` stellt keinen Schalter `-Verbose` bereit.
    Verwenden Sie die PowerShell-Ablaufverfolgung für Diagnosen auf Skriptebene:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="OpenClaw nach der Installation nicht gefunden">
    In der Regel handelt es sich um ein PATH-Problem. Weitere Informationen finden Sie unter [Fehlerbehebung für Node.js](/de/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Aktualisieren](/de/install/updating)
- [Deinstallieren](/de/install/uninstall)
