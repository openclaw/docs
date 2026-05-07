---
read_when:
    - Sie müssen Node.js installieren, bevor Sie OpenClaw installieren
    - Sie haben OpenClaw installiert, aber `openclaw` wird als Befehl nicht gefunden
    - npm install -g schlägt mit Berechtigungs- oder PATH-Problemen fehl
summary: Node.js für OpenClaw installieren und konfigurieren - Versionsanforderungen, Installationsoptionen und PATH-Fehlerbehebung
title: Node.js
x-i18n:
    generated_at: "2026-05-07T13:20:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8ef8d00c8996741187000f55d07d15a2d09e89b6deb99cf687b6b9128ad266
    source_path: install/node.md
    workflow: 16
---

OpenClaw benötigt **Node 22.16 oder neuer**. **Node 24 ist die standardmäßige und empfohlene Runtime** für Installationen, CI und Release-Workflows. Node 22 wird weiterhin über den aktiven LTS-Zweig unterstützt. Das [Installationsskript](/de/install#alternative-install-methods) erkennt und installiert Node automatisch - diese Seite ist für Fälle gedacht, in denen Sie Node selbst einrichten und sicherstellen möchten, dass alles korrekt verbunden ist (Versionen, PATH, globale Installationen).

## Ihre Version prüfen

```bash
node -v
```

Wenn dies `v24.x.x` oder höher ausgibt, verwenden Sie den empfohlenen Standard. Wenn es `v22.16.x` oder höher ausgibt, befinden Sie sich auf dem unterstützten Node-22-LTS-Pfad, wir empfehlen dennoch ein Upgrade auf Node 24, sobald es für Sie passt. Wenn Node nicht installiert ist oder die Version zu alt ist, wählen Sie unten eine Installationsmethode.

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

<Accordion title="Einen Versionsmanager verwenden (nvm, fnm, mise, asdf)">
  Mit Versionsmanagern können Sie einfach zwischen Node-Versionen wechseln. Beliebte Optionen:

- [**fnm**](https://github.com/Schniz/fnm) - schnell, plattformübergreifend
- [**nvm**](https://github.com/nvm-sh/nvm) - weit verbreitet auf macOS/Linux
- [**mise**](https://mise.jdx.dev/) - polyglott (Node, Python, Ruby usw.)

Beispiel mit fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Stellen Sie sicher, dass Ihr Versionsmanager in der Startdatei Ihrer Shell initialisiert wird (`~/.zshrc` oder `~/.bashrc`). Ist dies nicht der Fall, wird `openclaw` in neuen Terminal-Sitzungen möglicherweise nicht gefunden, da PATH das bin-Verzeichnis von Node nicht enthält.
  </Warning>
</Accordion>

## Fehlerbehebung

### `openclaw: command not found`

Das bedeutet fast immer, dass sich das globale bin-Verzeichnis von npm nicht in Ihrem PATH befindet.

<Steps>
  <Step title="Ihren globalen npm-Präfix finden">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Prüfen, ob er in Ihrem PATH liegt">
    ```bash
    echo "$PATH"
    ```

    Suchen Sie in der Ausgabe nach `<npm-prefix>/bin` (macOS/Linux) oder `<npm-prefix>` (Windows).

  </Step>
  <Step title="Ihn zur Startdatei Ihrer Shell hinzufügen">
    <Tabs>
      <Tab title="macOS / Linux">
        Zu `~/.zshrc` oder `~/.bashrc` hinzufügen:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Öffnen Sie anschließend ein neues Terminal (oder führen Sie `rehash` in zsh / `hash -r` in bash aus).
      </Tab>
      <Tab title="Windows">
        Fügen Sie die Ausgabe von `npm prefix -g` über Einstellungen → System → Umgebungsvariablen zu Ihrem System-PATH hinzu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Berechtigungsfehler bei `npm install -g` (Linux)

Wenn Sie `EACCES`-Fehler sehen, ändern Sie den globalen Präfix von npm auf ein Verzeichnis, in das Ihr Benutzer schreiben kann:

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
