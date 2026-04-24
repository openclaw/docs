---
read_when:
    - Devi installare Node.js prima di installare OpenClaw
    - Hai installato OpenClaw ma `openclaw` restituisce comando non trovato
    - '`npm install -g` fallisce con problemi di permessi o PATH'
summary: Installare e configurare Node.js per OpenClaw — requisiti di versione, opzioni di installazione e risoluzione dei problemi del PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-24T08:47:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 15
---

OpenClaw richiede **Node 22.14 o più recente**. **Node 24 è il runtime predefinito e consigliato** per installazioni, CI e workflow di rilascio. Node 22 resta supportato tramite il ramo LTS attivo. Lo [script di installazione](/it/install#alternative-install-methods) rileverà e installerà automaticamente Node — questa pagina serve quando vuoi configurare Node da solo e assicurarti che tutto sia collegato correttamente (versioni, PATH, installazioni globali).

## Controlla la tua versione

```bash
node -v
```

Se questo stampa `v24.x.x` o superiore, stai usando il valore predefinito consigliato. Se stampa `v22.14.x` o superiore, stai usando il percorso supportato Node 22 LTS, ma consigliamo comunque di passare a Node 24 quando ti è comodo. Se Node non è installato o la versione è troppo vecchia, scegli uno dei metodi di installazione qui sotto.

## Installa Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (consigliato):

    ```bash
    brew install node
    ```

    Oppure scarica l’installer macOS da [nodejs.org](https://nodejs.org/).

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

    Oppure scarica l’installer Windows da [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Usare un gestore di versioni (nvm, fnm, mise, asdf)">
  I gestori di versioni ti permettono di passare facilmente tra versioni diverse di Node. Opzioni popolari:

- [**fnm**](https://github.com/Schniz/fnm) — veloce, multipiattaforma
- [**nvm**](https://github.com/nvm-sh/nvm) — molto usato su macOS/Linux
- [**mise**](https://mise.jdx.dev/) — poliglotta (Node, Python, Ruby, ecc.)

Esempio con fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Assicurati che il tuo gestore di versioni sia inizializzato nel file di avvio della shell (`~/.zshrc` o `~/.bashrc`). Se non lo è, `openclaw` potrebbe non essere trovato nelle nuove sessioni del terminale perché il PATH non includerà la directory bin di Node.
  </Warning>
</Accordion>

## Risoluzione dei problemi

### `openclaw: command not found`

Questo significa quasi sempre che la directory bin globale di npm non è nel tuo PATH.

<Steps>
  <Step title="Trova il tuo prefisso npm globale">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Controlla se è nel tuo PATH">
    ```bash
    echo "$PATH"
    ```

    Cerca `<npm-prefix>/bin` (macOS/Linux) oppure `<npm-prefix>` (Windows) nell’output.

  </Step>
  <Step title="Aggiungilo al file di avvio della shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Aggiungi a `~/.zshrc` oppure `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Poi apri un nuovo terminale (oppure esegui `rehash` in zsh / `hash -r` in bash).
      </Tab>
      <Tab title="Windows">
        Aggiungi l’output di `npm prefix -g` al PATH di sistema tramite Impostazioni → Sistema → Variabili d’ambiente.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Errori di permesso con `npm install -g` (Linux)

Se vedi errori `EACCES`, passa il prefisso globale di npm a una directory scrivibile dall’utente:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Aggiungi la riga `export PATH=...` al tuo `~/.bashrc` oppure `~/.zshrc` per renderla permanente.

## Correlati

- [Panoramica installazione](/it/install) — tutti i metodi di installazione
- [Updating](/it/install/updating) — mantenere OpenClaw aggiornato
- [Getting Started](/it/start/getting-started) — primi passi dopo l’installazione
