---
read_when:
    - Sie möchten `openclaw.ai/install.sh` verstehen
    - Sie möchten Installationen automatisieren (CI / ohne Benutzeroberfläche)
    - Sie möchten aus einem GitHub-Checkout installieren
summary: Funktionsweise der Installationsskripte (install.sh, install-cli.sh, install.ps1), Flags und Automatisierung
title: Interna des Installationsprogramms
x-i18n:
    generated_at: "2026-07-16T12:58:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw umfasst drei Installationsskripte, die über `openclaw.ai` bereitgestellt werden.

| Skript                             | Plattform             | Funktionsweise                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder Git und kann das Onboarding ausführen.       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installiert Node + OpenClaw über npm oder Git in einem lokalen Präfix (`~/.openclaw`). Keine Root-Rechte erforderlich. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder Git und kann das Onboarding ausführen.       |

Alle drei unterstützen Node **22.22.3+, 24.15+ oder 25.9+**; Node 24 ist das Standardziel für Neuinstallationen.

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
Wenn die Installation erfolgreich ist, `openclaw` aber in einem neuen Terminal nicht gefunden wird, lesen Sie den Abschnitt zur [Fehlerbehebung bei Node.js](/de/install/node#troubleshooting).
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
    Prüft die Node-Version und installiert bei Bedarf Node 24 (Homebrew unter macOS, NodeSource-Einrichtungsskripte unter Linux mit apt/dnf/yum). Unter macOS wird Homebrew nur installiert, wenn das Installationsprogramm es für Node oder Git benötigt. Node 22.22.3+, Node 24.15+ und Node 25.9+ werden unterstützt; Node 23 wird nicht unterstützt.
    Unter Alpine/musl Linux verwendet das Installationsprogramm anstelle von NodeSource apk-Pakete und überprüft die tatsächlich eingebundene SQLite-Version. Aktuelle stabile Alpine-Paketquellen können eine ausreichend neue Node-Version mit einer anfälligen Systemversion von SQLite bereitstellen; verwenden Sie in diesem Fall stattdessen einen offiziellen `node:24-alpine`-Container oder einen glibc-basierten Host.
  </Step>
  <Step title="Git sicherstellen">
    Installiert Git bei Bedarf mit dem erkannten Paketmanager, einschließlich Homebrew unter macOS und apk unter Alpine.
  </Step>
  <Step title="OpenClaw installieren">
    - `npm`-Methode (Standard): globale Installation mit npm
    - `git`-Methode: Repository klonen/aktualisieren, Abhängigkeiten mit pnpm installieren, Build erstellen und anschließend Wrapper unter `~/.local/bin/openclaw` installieren

  </Step>
  <Step title="Aufgaben nach der Installation">
    - Ermittelt das soeben installierte `openclaw`-Binary für nachfolgende Befehle
    - Startet bei einer nicht konfigurierten Installation das Onboarding vor Doctor- oder Gateway-Prüfungen. Mit `--no-onboard` oder ohne TTY wird der Befehl ausgegeben, mit dem die Einrichtung später abgeschlossen werden kann.
    - Aktualisiert bei einer konfigurierten Installation einen geladenen Gateway-Dienst nach bestem Bemühen, startet ihn neu und führt Doctor aus. Bei Upgrades werden Plugins nach Möglichkeit aktualisiert; andernfalls wird bei einem Headless-Lauf mit aktivierten Eingabeaufforderungen der manuelle Befehl ausgegeben.
    - Wenn `--verify` ausgeführt wird, prüft es die installierte Version und den Zustand des Gateways erst, nachdem eine Konfiguration vorhanden ist.

  </Step>
</Steps>

### Erkennung eines Source-Checkouts

Bei Ausführung innerhalb eines OpenClaw-Checkouts (`package.json` + `pnpm-workspace.yaml`) bietet das Skript Folgendes an:

- Checkout verwenden (`git`) oder
- globale Installation verwenden (`npm`)

Wenn kein TTY verfügbar und keine Installationsmethode festgelegt ist, wird standardmäßig `npm` verwendet und eine Warnung ausgegeben.

Das Skript wird bei Auswahl einer ungültigen Methode oder bei ungültigen `--install-method`-Werten mit dem Code `2` beendet.

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
  <Accordion title="Flag-Referenz">

| Flag                                    | Beschreibung                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Installationsmethode auswählen (Standard: `npm`)                                  |
| `--npm`                                 | Kurzform für die npm-Methode                                                 |
| `--git \| --github`                     | Kurzform für die Git-Methode                                                 |
| `--version <version\|dist-tag\|spec>`   | npm-Version, Dist-Tag oder Paketspezifikation (Standard: `latest`)              |
| `--beta`                                | Beta-Dist-Tag verwenden, falls verfügbar, andernfalls auf `latest` zurückfallen              |
| `--git-dir \| --dir <path>`             | Checkout-Verzeichnis (Standard: `~/openclaw`)                              |
| `--no-git-update`                       | `git pull` für vorhandenen Checkout überspringen                                   |
| `--no-prompt`                           | Eingabeaufforderungen deaktivieren                                                         |
| `--no-onboard`                          | Onboarding überspringen                                                         |
| `--onboard`                             | Onboarding aktivieren                                                       |
| `--verify`                              | Smoke-Test nach der Installation ausführen (`--version`, Gateway-Zustand, falls geladen) |
| `--dry-run`                             | Aktionen ausgeben, ohne Änderungen anzuwenden                                  |
| `--verbose`                             | Debug-Ausgabe aktivieren (`set -x`, npm-Protokolle auf Notice-Ebene)                   |
| `--help \| -h`                          | Verwendung anzeigen                                                              |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                                          | Beschreibung                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Installationsmethode                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm-Version, Dist-Tag oder Paketspezifikation                             |
| `OPENCLAW_BETA=0\|1`                              | Beta verwenden, falls verfügbar                                              |
| `OPENCLAW_HOME=<path>`                            | Basisverzeichnis für den OpenClaw-Zustand und die standardmäßigen Git-/Onboarding-Pfade |
| `OPENCLAW_GIT_DIR=<path>`                         | Checkout-Verzeichnis                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Git-Aktualisierungen umschalten                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | Eingabeaufforderungen deaktivieren                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Smoke-Test nach der Installation ausführen                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | Onboarding überspringen                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Testlaufmodus                                                       |
| `OPENCLAW_VERBOSE=1`                              | Debug-Modus                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm-Protokollierungsstufe (Standard: `error`, blendet npm-Hinweise zu veralteten Funktionen aus)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Für Umgebungen konzipiert, in denen sich alles unter einem lokalen Präfix
(Standard: `~/.openclaw`) befinden und keine systemweite Node-Abhängigkeit bestehen soll. Unterstützt
standardmäßig npm-Installationen sowie Git-Checkout-Installationen mit demselben Präfixablauf.
</Info>

### Ablauf (install-cli.sh)

<Steps>
  <Step title="Lokale Node-Laufzeit installieren">
    Lädt ein festgelegtes unterstütztes Node-LTS-Tarball (die Version ist in das Skript eingebettet und wird unabhängig aktualisiert, Standard: `24.15.0`) nach `<prefix>/tools/node-v<version>` herunter und überprüft SHA-256.
    Linux ARMv7 verwendet Node `22.22.3`, da keine offiziellen Node-24+-Binärdateien für ARMv7 verfügbar sind.
    Unter Alpine/musl Linux, für das Node keine kompatiblen Tarballs für die festgelegte Laufzeit veröffentlicht, werden `nodejs` und `npm` mit `apk` installiert; anschließend werden sowohl Node als auch die tatsächlich eingebundene SQLite-Bibliothek überprüft. Aktuelle stabile Alpine-Paketquellen können trotz einer ausreichend neuen Node-Version weiterhin eine anfällige SQLite-Version einbinden; verwenden Sie einen offiziellen `node:24-alpine`-Container oder einen glibc-basierten Host, wenn die Sicherheitsprüfung das Paket ablehnt.
  </Step>
  <Step title="Git sicherstellen">
    Falls Git fehlt, wird versucht, es unter Linux über apt/dnf/yum/apk oder unter macOS über Homebrew zu installieren.
  </Step>
  <Step title="OpenClaw unter dem Präfix installieren">
    - `npm`-Methode (Standard): installiert mit npm unter dem Präfix und schreibt anschließend den Wrapper nach `<prefix>/bin/openclaw`
    - `git`-Methode: klont/aktualisiert einen Checkout (Standard: `~/openclaw`) und schreibt den Wrapper weiterhin nach `<prefix>/bin/openclaw`

  </Step>
  <Step title="Geladenen Gateway-Dienst aktualisieren">
    Wenn bereits ein Gateway-Dienst aus demselben Präfix geladen ist, führt das Skript
    `openclaw gateway install --force` aus, wodurch der Ersatzdienst aktiviert wird,
    und prüft anschließend nach bestem Bemühen den Zustand des Gateways.
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
  <Accordion title="Flag-Referenz">

| Flag                                    | Beschreibung                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Installationspräfix (Standard: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | Installationsmethode auswählen (Standard: `npm`)                                          |
| `--npm`                                 | Kurzform für die npm-Methode                                                         |
| `--git \| --github`                     | Kurzform für die Git-Methode                                                         |
| `--git-dir \| --dir <path>`             | Git-Checkout-Verzeichnis (Standard: `~/openclaw`)                                  |
| `--version <ver>`                       | OpenClaw-Version oder Dist-Tag (Standard: `latest`)                                |
| `--node-version <ver>`                  | Node-Version (Standard: `24.15.0`; `22.22.3` unter Linux ARMv7)                     |
| `--json`                                | NDJSON-Ereignisse ausgeben                                                              |
| `--onboard`                             | `openclaw onboard` nach der Installation ausführen                                            |
| `--no-onboard`                          | Onboarding überspringen (Standard)                                                       |
| `--set-npm-prefix`                      | Unter Linux das npm-Präfix auf `~/.npm-global` setzen, wenn das aktuelle Präfix nicht beschreibbar ist |
| `--help \| -h`                          | Verwendung anzeigen                                                                      |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                                    | Beschreibung                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Installationspräfix                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Installationsmethode                                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw-Version oder Dist-Tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node-Version                                                       |
| `OPENCLAW_HOME=<path>`                      | Basisverzeichnis für den OpenClaw-Zustand und die standardmäßigen Git-/Onboarding-Pfade |
| `OPENCLAW_GIT_DIR=<path>`                   | Git-Checkout-Verzeichnis für Git-Installationen                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Git-Aktualisierungen für vorhandene Checkouts ein- oder ausschalten                          |
| `OPENCLAW_NO_ONBOARD=1`                     | Onboarding überspringen                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm-Protokollierungsstufe (Standard: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` und andere GitHub-Quellangaben sind keine gültigen `--version`-Ziele für npm-Installationen. Verwenden Sie stattdessen `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Ablauf (install.ps1)

<Steps>
  <Step title="PowerShell- und Windows-Umgebung sicherstellen">
    Erfordert PowerShell 5+.
  </Step>
  <Step title="Standardmäßig Node.js 24 sicherstellen">
    Falls nicht vorhanden, wird die Installation zunächst über winget, dann über Chocolatey und anschließend über Scoop versucht. Ist kein Paketmanager verfügbar, lädt das Skript die offizielle Windows-ZIP-Datei von Node.js 24 in `%LOCALAPPDATA%\OpenClaw\deps\portable-node` herunter und fügt sie dem PATH des aktuellen Prozesses und des Benutzers hinzu. Node 22.22.3+, Node 24.15+ und Node 25.9+ werden unterstützt; Node 23 wird nicht unterstützt.
  </Step>
  <Step title="OpenClaw installieren">
    - `npm`-Methode (Standard): globale npm-Installation mit dem ausgewählten `-Tag`, gestartet aus einem beschreibbaren temporären Installationsverzeichnis, damit auch Shells funktionieren, die in geschützten Ordnern wie `C:\` geöffnet wurden
    - `git`-Methode: Repository klonen/aktualisieren, mit pnpm installieren/erstellen und Wrapper unter `%USERPROFILE%\.local\bin\openclaw.cmd` installieren. Fehlt Git, richtet das Skript benutzerlokal MinGit unter `%LOCALAPPDATA%\OpenClaw\deps\portable-git` ein und fügt es dem PATH des aktuellen Prozesses und des Benutzers hinzu.

  </Step>
  <Step title="Aufgaben nach der Installation">
    - Fügt das erforderliche Binärverzeichnis nach Möglichkeit dem Benutzer-PATH hinzu
    - Aktualisiert nach bestem Bemühen einen geladenen Gateway-Dienst (`openclaw gateway install --force`, anschließend Neustart)
    - Führt bei Upgrades und Git-Installationen `openclaw doctor --non-interactive` aus (nach bestem Bemühen)

  </Step>
  <Step title="Fehler behandeln">
    `iwr ... | iex`- und Skriptblock-Installationen melden einen beendenden Fehler, ohne die aktuelle PowerShell-Sitzung zu schließen. Direkte Installationen über `powershell -File` / `pwsh -File` werden für die Automatisierung weiterhin mit einem Exitcode ungleich null beendet.
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
  <Tab title="Testlauf">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flag-Referenz">

| Flag                        | Beschreibung                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Installationsmethode (Standard: `npm`)                            |
| `-Tag <tag\|version\|spec>` | npm-Dist-Tag, Version oder Paketangabe (Standard: `latest`) |
| `-GitDir <path>`            | Checkout-Verzeichnis (Standard: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Onboarding überspringen                                            |
| `-NoGitUpdate`              | `git pull` überspringen                                            |
| `-DryRun`                   | Nur Aktionen ausgeben                                         |

  </Accordion>

  <Accordion title="Referenz der Umgebungsvariablen">

| Variable                           | Beschreibung        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Installationsmethode     |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout-Verzeichnis |
| `OPENCLAW_NO_ONBOARD=1`            | Onboarding überspringen    |
| `OPENCLAW_GIT_UPDATE=0`            | Git-Pull deaktivieren   |
| `OPENCLAW_DRY_RUN=1`               | Testlaufmodus       |

  </Accordion>
</AccordionGroup>

<Note>
Wenn `-InstallMethod git` verwendet wird und Git fehlt, versucht das Skript, benutzerlokal MinGit einzurichten, bevor es den Link zu Git für Windows ausgibt.
</Note>

---

## CI und Automatisierung

Verwenden Sie nicht interaktive Flags/Umgebungsvariablen für vorhersehbare Ausführungen.

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
    Git ist für die Installationsmethode `git` erforderlich. Bei `npm`-Installationen wird Git dennoch geprüft/installiert, um `spawn git ENOENT`-Fehler zu vermeiden, wenn Abhängigkeiten Git-URLs verwenden.
  </Accordion>

  <Accordion title="Warum tritt bei npm unter Linux EACCES auf?">
    Bei einigen Linux-Konfigurationen verweist das globale Präfix von npm auf Pfade, die root gehören. `install.sh` kann das Präfix auf `~/.npm-global` umstellen und PATH-Exporte an die RC-Dateien der Shell anhängen (wenn diese Dateien vorhanden sind).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Führen Sie das Installationsprogramm erneut aus, damit es benutzerlokal MinGit einrichten kann, oder installieren Sie Git für Windows und öffnen Sie PowerShell erneut.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Führen Sie `npm config get prefix` aus, fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` erforderlich) und öffnen Sie PowerShell anschließend erneut.
  </Accordion>

  <Accordion title="Windows: ausführliche Ausgabe des Installationsprogramms erhalten">
    `install.ps1` bietet keinen Schalter `-Verbose`.
    Verwenden Sie PowerShell-Tracing für Diagnosen auf Skriptebene:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw nach der Installation nicht gefunden">
    In der Regel liegt ein PATH-Problem vor. Siehe [Fehlerbehebung für Node.js](/de/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Aktualisierung](/de/install/updating)
- [Deinstallation](/de/install/uninstall)
