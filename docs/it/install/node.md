---
read_when:
    - È necessario installare Node.js prima di installare OpenClaw
    - Hai installato OpenClaw ma `openclaw` risulta comando non trovato
    - npm install -g non riesce a causa di problemi di permessi o di PATH
summary: Installare e configurare Node.js per OpenClaw - requisiti di versione, opzioni di installazione e risoluzione dei problemi di PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-07T13:21:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8ef8d00c8996741187000f55d07d15a2d09e89b6deb99cf687b6b9128ad266
    source_path: install/node.md
    workflow: 16
---

OpenClaw richiede **Node 22.16 o versioni successive**. **Node 24 è il runtime predefinito e consigliato** per installazioni, CI e flussi di rilascio. Node 22 resta supportato tramite il ramo LTS attivo. Lo [script di installazione](/it/install#alternative-install-methods) rileverà e installerà Node automaticamente: questa pagina serve quando vuoi configurare Node autonomamente e assicurarti che tutto sia collegato correttamente (versioni, PATH, installazioni globali).

## Controlla la tua versione

```bash
node -v
```

Se stampa `v24.x.x` o superiore, stai usando l’impostazione predefinita consigliata. Se stampa `v22.16.x` o superiore, stai usando il percorso Node 22 LTS supportato, ma consigliamo comunque di passare a Node 24 quando ti è comodo. Se Node non è installato o la versione è troppo vecchia, scegli un metodo di installazione qui sotto.

## Installa Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (consigliato):

    ```bash
    brew install node
    ```

    Oppure scarica l’installer per macOS da [nodejs.org](https://nodejs.org/).

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

    Oppure scarica l’installer per Windows da [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Uso di un gestore di versioni (nvm, fnm, mise, asdf)">
  I gestori di versioni ti permettono di passare facilmente da una versione di Node all’altra. Opzioni popolari:

- [**fnm**](https://github.com/Schniz/fnm) - veloce, multipiattaforma
- [**nvm**](https://github.com/nvm-sh/nvm) - ampiamente usato su macOS/Linux
- [**mise**](https://mise.jdx.dev/) - poliglotta (Node, Python, Ruby, ecc.)

Esempio con fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Assicurati che il tuo gestore di versioni sia inizializzato nel file di avvio della shell (`~/.zshrc` o `~/.bashrc`). In caso contrario, `openclaw` potrebbe non essere trovato nelle nuove sessioni del terminale perché il PATH non includerà la directory bin di Node.
  </Warning>
</Accordion>

## Risoluzione dei problemi

### `openclaw: command not found`

Questo significa quasi sempre che la directory bin globale di npm non è nel tuo PATH.

<Steps>
  <Step title="Trova il prefisso globale di npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Controlla se è nel tuo PATH">
    ```bash
    echo "$PATH"
    ```

    Cerca `<npm-prefix>/bin` (macOS/Linux) o `<npm-prefix>` (Windows) nell’output.

  </Step>
  <Step title="Aggiungilo al file di avvio della shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Aggiungi a `~/.zshrc` o `~/.bashrc`:

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

### Errori di permesso su `npm install -g` (Linux)

Se vedi errori `EACCES`, cambia il prefisso globale di npm impostandolo su una directory scrivibile dall’utente:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Aggiungi la riga `export PATH=...` al tuo `~/.bashrc` o `~/.zshrc` per renderla permanente.

## Correlati

- [Panoramica dell’installazione](/it/install) - tutti i metodi di installazione
- [Aggiornamento](/it/install/updating) - mantenere OpenClaw aggiornato
- [Primi passi](/it/start/getting-started) - primi passi dopo l’installazione
