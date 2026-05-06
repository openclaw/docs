---
read_when:
    - Sie müssen Node.js installieren, bevor Sie OpenClaw installieren
    - Sie haben OpenClaw installiert, aber `openclaw` wird nicht gefunden
    - npm install -g schlägt aufgrund von Berechtigungs- oder PATH-Problemen fehl
summary: Node.js für OpenClaw installieren und konfigurieren - Versionsanforderungen, Installationsoptionen und PATH-Fehlerbehebung
title: Node.js
x-i18n:
    generated_at: "2026-05-06T06:54:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa445f3b9e6472af755c2fc4c3f08b6134e308f290ab750549411f12d8d247db
    source_path: install/node.md
    workflow: 16
---

OpenClaw erfordert **Node 22.14 oder neuer**. **Node 24 ist die standardmäßige und empfohlene Runtime** für Installationen, CI und Release-Workflows. Node 22 bleibt über die aktive LTS-Linie unterstützt. Das [Installationsskript](/de/install#alternative-install-methods) erkennt und installiert Node automatisch - diese Seite ist für Fälle gedacht, in denen Sie Node selbst einrichten und sicherstellen möchten, dass alles korrekt verbunden ist (Versionen, PATH, globale Installationen).

## Version prüfen

```bash
node -v
```

Wenn dies `v24.x.x` oder höher ausgibt, verwenden Sie den empfohlenen Standard. Wenn es `v22.14.x` oder höher ausgibt, verwenden Sie den unterstützten Node-22-LTS-Pfad, wir empfehlen aber weiterhin ein Upgrade auf Node 24, sobald es für Sie passt. Wenn Node nicht installiert ist oder die Version zu alt ist, wählen Sie unten eine Installationsmethode aus.

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

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  Mit Versionsmanagern können Sie einfach zwischen Node-Versionen wechseln. Beliebte Optionen:

- [**fnm**](https://github.com/Schniz/fnm) - schnell, plattformübergreifend
- [**nvm**](https://github.com/nvm-sh/nvm) - weit verbreitet unter macOS/Linux
- [**mise**](https://mise.jdx.dev/) - polyglott (Node, Python, Ruby usw.)

Beispiel mit fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Stellen Sie sicher, dass Ihr Versionsmanager in Ihrer Shell-Startdatei (`~/.zshrc` oder `~/.bashrc`) initialisiert ist. Ist dies nicht der Fall, wird `openclaw` in neuen Terminal-Sitzungen möglicherweise nicht gefunden, weil PATH das bin-Verzeichnis von Node nicht enthält.
  </Warning>
</Accordion>

## Fehlerbehebung

### `openclaw: command not found`

Das bedeutet fast immer, dass das globale bin-Verzeichnis von npm nicht in Ihrem PATH enthalten ist.

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    Suchen Sie in der Ausgabe nach `<npm-prefix>/bin` (macOS/Linux) oder `<npm-prefix>` (Windows).

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        Zu `~/.zshrc` oder `~/.bashrc` hinzufügen:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Öffnen Sie anschließend ein neues Terminal (oder führen Sie `rehash` in zsh / `hash -r` in bash aus).
      </Tab>
      <Tab title="Windows">
        Fügen Sie die Ausgabe von `npm prefix -g` über Einstellungen → System → Umgebungsvariablen zum System-PATH hinzu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Berechtigungsfehler bei `npm install -g` (Linux)

Wenn `EACCES`-Fehler angezeigt werden, stellen Sie das globale Präfix von npm auf ein benutzerbeschreibbares Verzeichnis um:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Fügen Sie die Zeile `export PATH=...` zu Ihrer `~/.bashrc` oder `~/.zshrc` hinzu, um die Änderung dauerhaft zu machen.

## Verwandte Themen

- [Installationsübersicht](/de/install) - alle Installationsmethoden
- [Aktualisieren](/de/install/updating) - OpenClaw aktuell halten
- [Erste Schritte](/de/start/getting-started) - erste Schritte nach der Installation
