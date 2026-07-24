---
read_when:
    - Sie müssen Node.js installieren, bevor Sie OpenClaw installieren.
    - 'Sie haben OpenClaw installiert, aber `openclaw`: Befehl nicht gefunden'
    - npm install -g schlägt aufgrund von Berechtigungs- oder PATH-Problemen fehl
summary: Node.js für OpenClaw installieren und konfigurieren – Versionsanforderungen, Installationsoptionen und Fehlerbehebung für PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-24T03:55:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw erfordert **Node 22.22.3+, Node 24.15+ oder Node 25.9+**. **Node 24 ist die standardmäßige und empfohlene Laufzeitumgebung** für Installationen, CI und Release-Workflows; Node 22 wird weiterhin über die aktive LTS-Linie unterstützt. Node 23 wird nicht unterstützt. Das [Installationsskript](/de/install#alternative-install-methods) erkennt und installiert Node automatisch — verwenden Sie diese Seite, wenn Sie Node selbst einrichten möchten (Versionen, PATH, globale Installationen).

## Version überprüfen

```bash
node -v
```

`v24.15.0` oder eine neuere 24.x-Version ist die empfohlene Standardeinstellung. `v22.22.3` oder eine neuere 22.x-Version ist der unterstützte Node-22-LTS-Pfad; Node `v25.9.0+` wird ebenfalls unterstützt. Node 23 wird nicht unterstützt. Wenn Node fehlt oder außerhalb des unterstützten Bereichs liegt, wählen Sie unten eine Installationsmethode aus.

## Node installieren

<Tabs>
  <Tab title="macOS">
    **Homebrew** (empfohlen):

    ```bash
    brew install node
    ```

    Oder laden Sie das macOS-Installationsprogramm von [nodejs.org](https://nodejs.org/) herunter.

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Oder verwenden Sie einen Versionsmanager (siehe unten).

  </Tab>
  <Tab title="Windows">
    **winget** (empfohlen):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Oder laden Sie das Windows-Installationsprogramm von [nodejs.org](https://nodejs.org/) herunter.

  </Tab>
</Tabs>

<Accordion title="Versionsmanager verwenden (nvm, fnm, mise, asdf)">
  Mit Versionsmanagern können Sie einfach zwischen Node-Versionen wechseln. Beliebte Optionen:

- [**fnm**](https://github.com/Schniz/fnm) - schnell, plattformübergreifend
- [**nvm**](https://github.com/nvm-sh/nvm) - unter macOS/Linux weit verbreitet
- [**mise**](https://mise.jdx.dev/) - mehrsprachig (Node, Python, Ruby usw.)

Beispiel mit fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Initialisieren Sie Ihren Versionsmanager in der Startdatei Ihrer Shell (`~/.zshrc` oder `~/.bashrc`). Wenn Sie diesen Schritt überspringen, wird `openclaw` in neuen Terminalsitzungen möglicherweise nicht gefunden, weil PATH das bin-Verzeichnis von Node nicht enthält.
  </Warning>
</Accordion>

## Fehlerbehebung

### `openclaw: command not found`

Dies bedeutet fast immer, dass sich das globale bin-Verzeichnis von npm nicht in Ihrem PATH befindet.

<Steps>
  <Step title="Globales npm-Präfix ermitteln">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Prüfen, ob es sich in Ihrem PATH befindet">
    ```bash
    echo "$PATH"
    ```

    Suchen Sie in der Ausgabe nach `<npm-prefix>/bin` (macOS/Linux) oder `<npm-prefix>` (Windows).

  </Step>
  <Step title="Zur Startdatei Ihrer Shell hinzufügen">
    <Tabs>
      <Tab title="macOS / Linux">
        Fügen Sie Folgendes zu `~/.zshrc` oder `~/.bashrc` hinzu:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Öffnen Sie anschließend ein neues Terminal (oder führen Sie `rehash` in zsh beziehungsweise `hash -r` in bash aus).
      </Tab>
      <Tab title="Windows">
        Fügen Sie die Ausgabe von `npm prefix -g` über Settings → System → Environment Variables zum System-PATH hinzu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Berechtigungsfehler bei `npm install -g` (Linux)

Wenn `EACCES`-Fehler auftreten, ändern Sie das globale Präfix von npm in ein Verzeichnis, in das der Benutzer schreiben kann:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Fügen Sie die Zeile `export PATH=...` zu Ihrer `~/.bashrc` oder `~/.zshrc` hinzu, um die Änderung dauerhaft zu machen.

## Verwandte Themen

- [Installationsübersicht](/de/install) - alle Installationsmethoden
- [Aktualisierung](/de/install/updating) - OpenClaw auf dem neuesten Stand halten
- [Erste Schritte](/de/start/getting-started) - erste Schritte nach der Installation
