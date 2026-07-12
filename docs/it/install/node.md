---
read_when:
    - Devi installare Node.js prima di installare OpenClaw
    - Hai installato OpenClaw, ma il comando `openclaw` non è stato trovato
    - npm install -g non riesce a causa di problemi di autorizzazioni o di PATH
summary: 'Installa e configura Node.js per OpenClaw: requisiti di versione, opzioni di installazione e risoluzione dei problemi relativi a PATH'
title: Node.js
x-i18n:
    generated_at: "2026-07-12T07:08:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw richiede **Node 22.19+, Node 23.11+ o Node 24+**. **Node 24 è il runtime predefinito e consigliato** per installazioni, CI e flussi di rilascio; Node 22 rimane supportato tramite il ramo LTS attivo. Lo [script di installazione](/it/install#alternative-install-methods) rileva e installa automaticamente Node: usa questa pagina quando vuoi configurare Node autonomamente (versioni, PATH, installazioni globali).

## Verifica la versione

```bash
node -v
```

`v24.x.x` o una versione successiva è l'opzione predefinita consigliata. `v22.19.x` o una versione successiva è il percorso supportato per Node 22 LTS (esegui l'aggiornamento a Node 24 quando possibile). Le build di Node 23 precedenti alla `v23.11.0` non sono supportate. Se Node non è installato o la versione non rientra nell'intervallo supportato, scegli uno dei metodi di installazione seguenti.

## Installa Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (consigliato):

    ```bash
    brew install node
    ```

    In alternativa, scarica il programma di installazione per macOS da [nodejs.org](https://nodejs.org/).

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

    In alternativa, usa un gestore di versioni (vedi sotto).

  </Tab>
  <Tab title="Windows">
    **winget** (consigliato):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    In alternativa, scarica il programma di installazione per Windows da [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Uso di un gestore di versioni (nvm, fnm, mise, asdf)">
  I gestori di versioni consentono di passare facilmente da una versione di Node all'altra. Opzioni diffuse:

- [**fnm**](https://github.com/Schniz/fnm) - veloce e multipiattaforma
- [**nvm**](https://github.com/nvm-sh/nvm) - ampiamente utilizzato su macOS/Linux
- [**mise**](https://mise.jdx.dev/) - poliglotta (Node, Python, Ruby e così via)

Esempio con fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Inizializza il gestore di versioni nel file di avvio della shell (`~/.zshrc` o `~/.bashrc`). Se salti questo passaggio, `openclaw` potrebbe non essere trovato nelle nuove sessioni del terminale perché PATH non includerà la directory bin di Node.
  </Warning>
</Accordion>

## Risoluzione dei problemi

### `openclaw: command not found`

Questo significa quasi sempre che la directory bin globale di npm non è inclusa nel PATH.

<Steps>
  <Step title="Trova il prefisso npm globale">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Verifica se è incluso nel PATH">
    ```bash
    echo "$PATH"
    ```

    Cerca `<npm-prefix>/bin` (macOS/Linux) o `<npm-prefix>` (Windows) nell'output.

  </Step>
  <Step title="Aggiungilo al file di avvio della shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Aggiungi a `~/.zshrc` o `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Quindi apri un nuovo terminale (oppure esegui `rehash` in zsh / `hash -r` in bash).
      </Tab>
      <Tab title="Windows">
        Aggiungi l'output di `npm prefix -g` al PATH di sistema tramite Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Errori di autorizzazione durante `npm install -g` (Linux)

Se vengono visualizzati errori `EACCES`, imposta il prefisso globale di npm su una directory scrivibile dall'utente:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Aggiungi la riga `export PATH=...` al file `~/.bashrc` o `~/.zshrc` per rendere permanente la modifica.

## Argomenti correlati

- [Panoramica dell'installazione](/it/install) - tutti i metodi di installazione
- [Aggiornamento](/it/install/updating) - come mantenere OpenClaw aggiornato
- [Guida introduttiva](/it/start/getting-started) - primi passaggi dopo l'installazione
