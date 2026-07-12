---
read_when:
    - Sie müssen Node.js installieren, bevor Sie OpenClaw installieren.
    - Sie haben OpenClaw installiert, aber `openclaw` wird als Befehl nicht gefunden.
    - npm install -g schlägt aufgrund von Berechtigungs- oder PATH-Problemen fehl
summary: Node.js für OpenClaw installieren und konfigurieren – Versionsanforderungen, Installationsoptionen und Fehlerbehebung für PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-12T15:27:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw erfordert **Node 22.19+, Node 23.11+ oder Node 24+**. **Node 24 ist die standardmäßige und empfohlene Laufzeitumgebung** für Installationen, CI und Release-Workflows; Node 22 wird weiterhin über die aktive LTS-Linie unterstützt. Das [Installationsskript](/de/install#alternative-install-methods) erkennt und installiert Node automatisch — verwenden Sie diese Seite, wenn Sie Node selbst einrichten möchten (Versionen, PATH, globale Installationen).

## Version prüfen

```bash
node -v
```

`v24.x.x` oder höher ist der empfohlene Standard. `v22.19.x` oder höher ist der unterstützte Node-22-LTS-Pfad (führen Sie bei Gelegenheit ein Upgrade auf Node 24 durch). Node-23-Builds vor `v23.11.0` werden nicht unterstützt. Wenn Node fehlt oder außerhalb des unterstützten Bereichs liegt, wählen Sie unten eine Installationsmethode aus.

## Node installieren

<Tabs>
  <Tab title="macOS">
    **Homebrew** (empfohlen):

    ```bash
    brew install node
    ```

    Alternativ können Sie das macOS-Installationsprogramm von [nodejs.org](https://nodejs.org/) herunterladen.

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

    Alternativ können Sie einen Versionsmanager verwenden (siehe unten).

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

    Alternativ können Sie das Windows-Installationsprogramm von [nodejs.org](https://nodejs.org/) herunterladen.

  </Tab>
</Tabs>

<Accordion title="Versionsmanager verwenden (nvm, fnm, mise, asdf)">
  Mit Versionsmanagern können Sie einfach zwischen Node-Versionen wechseln. Beliebte Optionen:

- [**fnm**](https://github.com/Schniz/fnm) - schnell und plattformübergreifend
- [**nvm**](https://github.com/nvm-sh/nvm) - unter macOS/Linux weit verbreitet
- [**mise**](https://mise.jdx.dev/) - mehrsprachig (Node, Python, Ruby usw.)

Beispiel mit fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Initialisieren Sie Ihren Versionsmanager in der Startdatei Ihrer Shell (`~/.zshrc` oder `~/.bashrc`). Wenn Sie dies überspringen, wird `openclaw` in neuen Terminalsitzungen möglicherweise nicht gefunden, da PATH das bin-Verzeichnis von Node nicht enthält.
  </Warning>
</Accordion>

## Fehlerbehebung

### `openclaw: command not found`

Dies bedeutet fast immer, dass das globale bin-Verzeichnis von npm nicht in Ihrem PATH enthalten ist.

<Steps>
  <Step title="Globales npm-Präfix ermitteln">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Prüfen, ob es in Ihrem PATH enthalten ist">
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
        Fügen Sie die Ausgabe von `npm prefix -g` über Settings → System → Environment Variables zum PATH Ihres Systems hinzu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Berechtigungsfehler bei `npm install -g` (Linux)

Wenn `EACCES`-Fehler angezeigt werden, ändern Sie das globale Präfix von npm in ein Verzeichnis, in das der Benutzer schreiben kann:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Fügen Sie die Zeile `export PATH=...` zu Ihrer `~/.bashrc` oder `~/.zshrc` hinzu, um die Änderung dauerhaft zu übernehmen.

## Verwandte Themen

- [Installationsübersicht](/de/install) - alle Installationsmethoden
- [Aktualisierung](/de/install/updating) - OpenClaw auf dem neuesten Stand halten
- [Erste Schritte](/de/start/getting-started) - erste Schritte nach der Installation
