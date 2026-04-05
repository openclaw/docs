---
read_when:
    - Devi installare Node.js prima di installare OpenClaw
    - Hai installato OpenClaw ma `openclaw` restituisce command not found
    - '`npm install -g` fallisce con problemi di permessi o PATH'
summary: Installare e configurare Node.js per OpenClaw — requisiti di versione, opzioni di installazione e risoluzione dei problemi PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-05T13:56:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e880f6132359dba8720638669df2d71cf857d516cbf5df2589ffeed269b5120
    source_path: install/node.md
    workflow: 15
---

# Node.js

OpenClaw richiede **Node 22.14 o versione successiva**. **Node 24 è il runtime predefinito e consigliato** per installazioni, CI e flussi di rilascio. Node 22 continua a essere supportato tramite il ramo LTS attivo. Lo [script di installazione](/install#alternative-install-methods) rileverà e installerà Node automaticamente — questa pagina è per quando vuoi configurare Node da solo e assicurarti che tutto sia collegato correttamente (versioni, PATH, installazioni globali).

## Controlla la tua versione

```bash
node -v
```

Se questo stampa `v24.x.x` o superiore, stai usando il valore predefinito consigliato. Se stampa `v22.14.x` o superiore, stai usando il percorso supportato di Node 22 LTS, ma consigliamo comunque di passare a Node 24 quando possibile. Se Node non è installato o la versione è troppo vecchia, scegli uno dei metodi di installazione qui sotto.

## Installa Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (consigliato):

    ```bash
    brew install node
    ```

    Oppure scarica il programma di installazione per macOS da [nodejs.org](https://nodejs.org/).

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

    Oppure usa un gestore di versioni (vedi sotto).

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

    Oppure scarica il programma di installazione per Windows da [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Usare un gestore di versioni (nvm, fnm, mise, asdf)">
  I gestori di versioni ti permettono di passare facilmente da una versione di Node all'altra. Opzioni comuni:

- [**fnm**](https://github.com/Schniz/fnm) — veloce, multipiattaforma
- [**nvm**](https://github.com/nvm-sh/nvm) — molto usato su macOS/Linux
- [**mise**](https://mise.jdx.dev/) — poliglotta (Node, Python, Ruby, ecc.)

Esempio con fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Assicurati che il tuo gestore di versioni sia inizializzato nel file di avvio della shell (`~/.zshrc` o `~/.bashrc`). In caso contrario, `openclaw` potrebbe non essere trovato nelle nuove sessioni del terminale perché PATH non includerà la directory bin di Node.
  </Warning>
</Accordion>

## Risoluzione dei problemi

### `openclaw: command not found`

Questo significa quasi sempre che la directory bin globale di npm non è nel tuo PATH.

<Steps>
  <Step title="Trova il tuo prefisso globale npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Controlla se è nel tuo PATH">
    ```bash
    echo "$PATH"
    ```

    Cerca `<npm-prefix>/bin` (macOS/Linux) oppure `<npm-prefix>` (Windows) nell'output.

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
        Aggiungi l'output di `npm prefix -g` al tuo PATH di sistema tramite Impostazioni → Sistema → Variabili di ambiente.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Errori di permessi con `npm install -g` (Linux)

Se vedi errori `EACCES`, cambia il prefisso globale di npm in una directory scrivibile dall'utente:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Aggiungi la riga `export PATH=...` al tuo `~/.bashrc` o `~/.zshrc` per renderla permanente.

## Correlati

- [Panoramica dell'installazione](/install) — tutti i metodi di installazione
- [Aggiornamento](/install/updating) — come mantenere OpenClaw aggiornato
- [Per iniziare](/start/getting-started) — primi passi dopo l'installazione
