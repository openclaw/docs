---
read_when:
    - È necessario installare Node.js prima di installare OpenClaw
    - Hai installato OpenClaw, ma `openclaw` restituisce «comando non trovato»
    - npm install -g non riesce a causa di problemi di autorizzazioni o di PATH
summary: 'Installare e configurare Node.js per OpenClaw: requisiti di versione, opzioni di installazione e risoluzione dei problemi relativi al PATH'
title: Node.js
x-i18n:
    generated_at: "2026-07-16T14:32:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw richiede **Node 22.22.3+, Node 24.15+ o Node 25.9+**. **Node 24 è il runtime predefinito e consigliato** per installazioni, CI e flussi di rilascio; Node 22 rimane supportato tramite la linea LTS attiva. Node 23 non è supportato. Lo [script di installazione](/it/install#alternative-install-methods) rileva e installa Node automaticamente: usare questa pagina quando si desidera configurare Node manualmente (versioni, PATH, installazioni globali).

## Verificare la versione

```bash
node -v
```

`v24.15.0` o una versione 24.x più recente è l'opzione predefinita consigliata. `v22.22.3` o una versione 22.x più recente è il percorso Node 22 LTS supportato; è supportato anche Node `v25.9.0+`. Node 23 non è supportato. Se Node non è installato o non rientra nell'intervallo supportato, scegliere uno dei metodi di installazione seguenti.

## Installare Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (consigliato):

    ```bash
    brew install node
    ```

    In alternativa, scaricare il programma di installazione per macOS da [nodejs.org](https://nodejs.org/).

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

    In alternativa, usare un gestore di versioni (vedere di seguito).

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

    In alternativa, scaricare il programma di installazione per Windows da [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Utilizzo di un gestore di versioni (nvm, fnm, mise, asdf)">
  I gestori di versioni consentono di passare facilmente da una versione di Node all'altra. Opzioni comuni:

- [**fnm**](https://github.com/Schniz/fnm) - veloce e multipiattaforma
- [**nvm**](https://github.com/nvm-sh/nvm) - ampiamente utilizzato su macOS/Linux
- [**mise**](https://mise.jdx.dev/) - poliglotta (Node, Python, Ruby e così via)

Esempio con fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Inizializzare il gestore di versioni nel file di avvio della shell (`~/.zshrc` o `~/.bashrc`). Se si salta questo passaggio, `openclaw` potrebbe non essere trovato nelle nuove sessioni del terminale perché PATH non includerà la directory bin di Node.
  </Warning>
</Accordion>

## Risoluzione dei problemi

### `openclaw: command not found`

Questo significa quasi sempre che la directory bin globale di npm non è inclusa nel PATH.

<Steps>
  <Step title="Individuare il prefisso globale di npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Verificare se è incluso nel PATH">
    ```bash
    echo "$PATH"
    ```

    Cercare `<npm-prefix>/bin` (macOS/Linux) o `<npm-prefix>` (Windows) nell'output.

  </Step>
  <Step title="Aggiungerlo al file di avvio della shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Aggiungere a `~/.zshrc` o `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Quindi aprire un nuovo terminale (oppure eseguire `rehash` in zsh / `hash -r` in bash).
      </Tab>
      <Tab title="Windows">
        Aggiungere l'output di `npm prefix -g` al PATH di sistema tramite Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Errori di autorizzazione con `npm install -g` (Linux)

Se vengono visualizzati errori `EACCES`, impostare come prefisso globale di npm una directory in cui l'utente dispone dei permessi di scrittura:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Aggiungere la riga `export PATH=...` al file `~/.bashrc` o `~/.zshrc` per rendere permanente la modifica.

## Risorse correlate

- [Panoramica dell'installazione](/it/install) - tutti i metodi di installazione
- [Aggiornamento](/it/install/updating) - mantenere OpenClaw aggiornato
- [Guida introduttiva](/it/start/getting-started) - primi passi dopo l'installazione
