---
read_when:
    - È necessario installare Node.js prima di installare OpenClaw
    - Hai installato OpenClaw ma il comando `openclaw` non viene trovato
    - npm install -g fallisce per problemi di autorizzazioni o di PATH
summary: Installa e configura Node.js per OpenClaw - requisiti di versione, opzioni di installazione e risoluzione dei problemi di PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-06T08:57:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa445f3b9e6472af755c2fc4c3f08b6134e308f290ab750549411f12d8d247db
    source_path: install/node.md
    workflow: 16
---

OpenClaw richiede **Node 22.14 o versione successiva**. **Node 24 è il runtime predefinito e consigliato** per installazioni, CI e workflow di rilascio. Node 22 resta supportato tramite la linea LTS attiva. Lo [script di installazione](/it/install#alternative-install-methods) rileverà e installerà Node automaticamente - questa pagina serve quando vuoi configurare Node manualmente e assicurarti che tutto sia collegato correttamente (versioni, PATH, installazioni globali).

## Controlla la tua versione

```bash
node -v
```

Se stampa `v24.x.x` o superiore, stai usando l'impostazione predefinita consigliata. Se stampa `v22.14.x` o superiore, stai usando il percorso Node 22 LTS supportato, ma consigliamo comunque di passare a Node 24 quando ti è comodo. Se Node non è installato o la versione è troppo vecchia, scegli un metodo di installazione qui sotto.

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

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  I gestori di versioni ti permettono di passare facilmente da una versione di Node all'altra. Opzioni comuni:

- [**fnm**](https://github.com/Schniz/fnm) - veloce, multipiattaforma
- [**nvm**](https://github.com/nvm-sh/nvm) - molto usato su macOS/Linux
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
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    Cerca `<npm-prefix>/bin` (macOS/Linux) o `<npm-prefix>` (Windows) nell'output.

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        Aggiungi a `~/.zshrc` o `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Quindi apri un nuovo terminale (oppure esegui `rehash` in zsh / `hash -r` in bash).
      </Tab>
      <Tab title="Windows">
        Aggiungi l'output di `npm prefix -g` al PATH di sistema tramite Impostazioni → Sistema → Variabili d'ambiente.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Errori di autorizzazione su `npm install -g` (Linux)

Se visualizzi errori `EACCES`, cambia il prefisso globale di npm impostandolo su una directory scrivibile dall'utente:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Aggiungi la riga `export PATH=...` al tuo `~/.bashrc` o `~/.zshrc` per renderla permanente.

## Correlati

- [Panoramica dell'installazione](/it/install) - tutti i metodi di installazione
- [Aggiornamento](/it/install/updating) - mantenere OpenClaw aggiornato
- [Introduzione](/it/start/getting-started) - primi passi dopo l'installazione
