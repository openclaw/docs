---
read_when:
    - Vuoi comprendere `openclaw.ai/install.sh`
    - Vuoi automatizzare le installazioni (CI / senza interfaccia grafica)
    - Vuoi eseguire l'installazione da un checkout di GitHub
summary: Come funzionano gli script di installazione (install.sh, install-cli.sh, install.ps1), le opzioni e l'automazione
title: Componenti interni del programma di installazione
x-i18n:
    generated_at: "2026-07-12T07:10:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw distribuisce tre script di installazione, disponibili da `openclaw.ai`.

| Script                             | Piattaforma          | Funzione                                                                                                  |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installa Node se necessario, installa OpenClaw tramite npm (predefinito) o git e può avviare la configurazione iniziale. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installa Node e OpenClaw in un prefisso locale (`~/.openclaw`) tramite npm o git. Non richiede privilegi di root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installa Node se necessario, installa OpenClaw tramite npm (predefinito) o git e può avviare la configurazione iniziale. |

Tutti e tre supportano Node **22.19+, 23.11+ o 24+**; Node 24 è la destinazione predefinita per le nuove installazioni.

## Comandi rapidi

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Se l'installazione riesce ma `openclaw` non viene trovato in un nuovo terminale, consulta la [risoluzione dei problemi di Node.js](/it/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Consigliato per la maggior parte delle installazioni interattive su macOS/Linux/WSL.
</Tip>

### Flusso (install.sh)

<Steps>
  <Step title="Rilevamento del sistema operativo">
    Supporta macOS e Linux (incluso WSL).
  </Step>
  <Step title="Installazione predefinita di Node.js 24">
    Controlla la versione di Node e installa Node 24 se necessario (Homebrew su macOS, script di configurazione NodeSource su Linux con apt/dnf/yum). Su macOS, Homebrew viene installato solo quando il programma di installazione ne ha bisogno per Node o Git. Node 22.19+ e 23.11+ rimangono supportati per compatibilità.
    Su Alpine/Linux musl, il programma di installazione utilizza i pacchetti apk anziché NodeSource; i repository Alpine configurati devono fornire una versione di Node supportata (Alpine 3.21 o versioni successive al momento della stesura).
  </Step>
  <Step title="Installazione di Git">
    Installa Git se mancante tramite il gestore di pacchetti rilevato, inclusi Homebrew su macOS e apk su Alpine.
  </Step>
  <Step title="Installazione di OpenClaw">
    - Metodo `npm` (predefinito): installazione globale tramite npm
    - Metodo `git`: clona o aggiorna il repository, installa le dipendenze con pnpm, esegue la compilazione e infine installa il wrapper in `~/.local/bin/openclaw`

  </Step>
  <Step title="Operazioni successive all'installazione">
    - Individua il binario `openclaw` appena installato per i comandi successivi
    - Per un'installazione non configurata, avvia la configurazione iniziale prima delle verifiche di doctor o del Gateway. Con `--no-onboard` o senza TTY, stampa il comando per completare la configurazione in seguito.
    - Per un'installazione configurata, aggiorna e riavvia, con la massima diligenza possibile, un servizio Gateway caricato ed esegue doctor. Quando possibile, gli aggiornamenti aggiornano i Plugin; in alternativa, durante un'esecuzione senza interfaccia con richieste interattive abilitate, stampano il comando manuale.
    - Quando viene eseguito `--verify`, controlla la versione installata e verifica lo stato del Gateway solo dopo che è stata creata una configurazione.

  </Step>
</Steps>

### Rilevamento del checkout del codice sorgente

Se viene eseguito all'interno di un checkout di OpenClaw (`package.json` + `pnpm-workspace.yaml`), lo script propone:

- utilizzare il checkout (`git`), oppure
- utilizzare l'installazione globale (`npm`)

Se non è disponibile alcun TTY e non è stato impostato alcun metodo di installazione, utilizza `npm` come predefinito e mostra un avviso.

Lo script termina con il codice `2` in caso di selezione non valida del metodo o di valori non validi per `--install-method`.

### Esempi (install.sh)

<Tabs>
  <Tab title="Predefinito">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Ignora la configurazione iniziale">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Installazione tramite Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Checkout del ramo main di GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Simulazione">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Verifica dopo l'installazione">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Riferimento delle opzioni">

| Opzione                                 | Descrizione                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Sceglie il metodo di installazione (predefinito: `npm`)                         |
| `--npm`                                 | Scorciatoia per il metodo npm                                                   |
| `--git \| --github`                     | Scorciatoia per il metodo git                                                   |
| `--version <version\|dist-tag\|spec>`   | Versione npm, dist-tag o specifica del pacchetto (predefinito: `latest`)        |
| `--beta`                                | Usa il dist-tag beta se disponibile, altrimenti ripiega su `latest`             |
| `--git-dir \| --dir <path>`             | Directory di checkout (predefinita: `~/openclaw`)                               |
| `--no-git-update`                       | Ignora `git pull` per un checkout esistente                                     |
| `--no-prompt`                           | Disabilita le richieste interattive                                             |
| `--no-onboard`                          | Ignora la configurazione iniziale                                               |
| `--onboard`                             | Abilita la configurazione iniziale                                              |
| `--verify`                              | Esegue una verifica rapida successiva all'installazione (`--version`, stato del Gateway se caricato) |
| `--dry-run`                             | Stampa le operazioni senza applicare modifiche                                  |
| `--verbose`                             | Abilita l'output di debug (`set -x`, log npm di livello notice)                 |
| `--help \| -h`                          | Mostra le istruzioni per l'uso                                                  |

  </Accordion>

  <Accordion title="Riferimento delle variabili d'ambiente">

| Variabile                                         | Descrizione                                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Metodo di installazione                                                            |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Versione npm, dist-tag o specifica del pacchetto                                   |
| `OPENCLAW_BETA=0\|1`                              | Usa la versione beta se disponibile                                                |
| `OPENCLAW_HOME=<path>`                            | Directory di base per lo stato di OpenClaw e i percorsi predefiniti di git/configurazione iniziale |
| `OPENCLAW_GIT_DIR=<path>`                         | Directory di checkout                                                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Attiva o disattiva gli aggiornamenti git                                           |
| `OPENCLAW_NO_PROMPT=1`                            | Disabilita le richieste interattive                                                |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Esegue la verifica rapida successiva all'installazione                             |
| `OPENCLAW_NO_ONBOARD=1`                           | Ignora la configurazione iniziale                                                  |
| `OPENCLAW_DRY_RUN=1`                              | Modalità di simulazione                                                            |
| `OPENCLAW_VERBOSE=1`                              | Modalità di debug                                                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Livello di log npm (predefinito: `error`, nasconde i messaggi di deprecazione di npm) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Progettato per gli ambienti in cui si desidera mantenere tutto in un prefisso locale
(predefinito: `~/.openclaw`) senza dipendere da un'installazione di Node a livello di sistema. Supporta per impostazione predefinita le installazioni
tramite npm, oltre alle installazioni da checkout git nello stesso flusso basato sul prefisso.
</Info>

### Flusso (install-cli.sh)

<Steps>
  <Step title="Installazione del runtime Node locale">
    Scarica un archivio tar di una versione LTS di Node supportata e fissata (la versione è incorporata nello script e aggiornata in modo indipendente; il valore predefinito è `22.22.2`) in `<prefix>/tools/node-v<version>` e ne verifica l'hash SHA-256.
    Su Alpine/Linux musl, per cui Node non pubblica archivi tar compatibili con il runtime fissato, installa `nodejs` e `npm` tramite `apk` e collega tale runtime al percorso del wrapper nel prefisso. I repository Alpine devono fornire una versione di Node supportata (22.19+, 23.11+ o 24+); utilizza Alpine 3.21 o versioni successive se i repository meno recenti forniscono solo Node 20 o 21.
  </Step>
  <Step title="Installazione di Git">
    Se Git è mancante, tenta di installarlo tramite apt/dnf/yum/apk su Linux o Homebrew su macOS.
  </Step>
  <Step title="Installazione di OpenClaw nel prefisso">
    - Metodo `npm` (predefinito): esegue l'installazione nel prefisso tramite npm, quindi scrive il wrapper in `<prefix>/bin/openclaw`
    - Metodo `git`: clona o aggiorna un checkout (predefinito: `~/openclaw`) e scrive comunque il wrapper in `<prefix>/bin/openclaw`

  </Step>
  <Step title="Aggiornamento del servizio Gateway caricato">
    Se un servizio Gateway è già caricato dallo stesso prefisso, lo script esegue
    `openclaw gateway install --force`, quindi `openclaw gateway restart` e
    verifica lo stato del Gateway con la massima diligenza possibile.
  </Step>
</Steps>

### Esempi (install-cli.sh)

<Tabs>
  <Tab title="Predefinito">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefisso e versione personalizzati">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Installazione tramite Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Output JSON per l'automazione">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Esecuzione della configurazione iniziale">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Riferimento delle opzioni">

| Flag                                    | Descrizione                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Prefisso di installazione (predefinito: `~/.openclaw`)                                |
| `--install-method \| --method npm\|git` | Sceglie il metodo di installazione (predefinito: `npm`)                               |
| `--npm`                                 | Scorciatoia per il metodo npm                                                         |
| `--git \| --github`                     | Scorciatoia per il metodo git                                                         |
| `--git-dir \| --dir <path>`             | Directory di checkout Git (predefinita: `~/openclaw`)                                 |
| `--version <ver>`                       | Versione o dist-tag di OpenClaw (predefinito: `latest`)                               |
| `--node-version <ver>`                  | Versione di Node (predefinita: `22.22.2`)                                             |
| `--json`                                | Emette eventi NDJSON                                                                  |
| `--onboard`                             | Esegue `openclaw onboard` dopo l'installazione                                        |
| `--no-onboard`                          | Salta la configurazione iniziale (impostazione predefinita)                           |
| `--set-npm-prefix`                      | Su Linux, forza il prefisso npm a `~/.npm-global` se quello attuale non è scrivibile |
| `--help \| -h`                          | Mostra le istruzioni d'uso                                                            |

  </Accordion>

  <Accordion title="Riferimento delle variabili d'ambiente">

| Variabile                                   | Descrizione                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Prefisso di installazione                                                            |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metodo di installazione                                                              |
| `OPENCLAW_VERSION=<ver>`                    | Versione o dist-tag di OpenClaw                                                      |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versione di Node                                                                     |
| `OPENCLAW_HOME=<path>`                      | Directory di base per lo stato di OpenClaw e i percorsi git/configurazione iniziale predefiniti |
| `OPENCLAW_GIT_DIR=<path>`                   | Directory di checkout Git per le installazioni git                                   |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Attiva o disattiva gli aggiornamenti git per i checkout esistenti                    |
| `OPENCLAW_NO_ONBOARD=1`                     | Salta la configurazione iniziale                                                     |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Livello dei log npm (predefinito: `error`)                                           |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` e le altre specifiche del sorgente GitHub non sono destinazioni `--version` valide per le installazioni npm. Usa invece `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Flusso (install.ps1)

<Steps>
  <Step title="Verificare l'ambiente PowerShell e Windows">
    Richiede PowerShell 5 o versione successiva.
  </Step>
  <Step title="Garantire Node.js 24 per impostazione predefinita">
    Se non è presente, tenta l'installazione tramite winget, quindi Chocolatey e infine Scoop. Se non è disponibile alcun gestore di pacchetti, lo script scarica il file zip ufficiale di Node.js 24 per Windows in `%LOCALAPPDATA%\OpenClaw\deps\portable-node` e lo aggiunge al PATH del processo corrente e dell'utente. Node 22.19+ e 23.11+ rimangono supportati per compatibilità.
  </Step>
  <Step title="Installare OpenClaw">
    - Metodo `npm` (predefinito): installazione npm globale con il `-Tag` selezionato, avviata da una directory temporanea scrivibile del programma di installazione, in modo che funzionino anche le shell aperte in cartelle protette come `C:\`
    - Metodo `git`: clona o aggiorna il repository, installa e compila con pnpm e installa il wrapper in `%USERPROFILE%\.local\bin\openclaw.cmd`. Se Git non è presente, lo script configura MinGit localmente per l'utente in `%LOCALAPPDATA%\OpenClaw\deps\portable-git` e lo aggiunge al PATH del processo corrente e dell'utente.

  </Step>
  <Step title="Attività successive all'installazione">
    - Aggiunge al PATH dell'utente la directory dei binari necessaria, quando possibile
    - Aggiorna, con il massimo impegno possibile, un servizio Gateway caricato (`openclaw gateway install --force`, quindi lo riavvia)
    - Esegue `openclaw doctor --non-interactive` durante gli aggiornamenti e le installazioni git (con il massimo impegno possibile)

  </Step>
  <Step title="Gestire gli errori">
    Le installazioni tramite `iwr ... | iex` e blocco di script segnalano un errore irreversibile senza chiudere la sessione PowerShell corrente. Le installazioni dirette tramite `powershell -File` / `pwsh -File` continuano a terminare con un codice diverso da zero per l'automazione.
  </Step>
</Steps>

### Esempi (install.ps1)

<Tabs>
  <Tab title="Predefinito">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Installazione Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Checkout del ramo main di GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Directory git personalizzata">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Esecuzione di prova">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Riferimento dei flag">

| Flag                        | Descrizione                                                           |
| --------------------------- | --------------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metodo di installazione (predefinito: `npm`)                           |
| `-Tag <tag\|version\|spec>` | Dist-tag npm, versione o specifica del pacchetto (predefinito: `latest`) |
| `-GitDir <path>`            | Directory di checkout (predefinita: `%USERPROFILE%\openclaw`)         |
| `-NoOnboard`                | Salta la configurazione iniziale                                      |
| `-NoGitUpdate`              | Salta `git pull`                                                       |
| `-DryRun`                   | Stampa solamente le azioni                                            |

  </Accordion>

  <Accordion title="Riferimento delle variabili d'ambiente">

| Variabile                          | Descrizione                         |
| ---------------------------------- | ----------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metodo di installazione             |
| `OPENCLAW_GIT_DIR=<path>`          | Directory di checkout              |
| `OPENCLAW_NO_ONBOARD=1`            | Salta la configurazione iniziale    |
| `OPENCLAW_GIT_UPDATE=0`            | Disabilita `git pull`               |
| `OPENCLAW_DRY_RUN=1`               | Modalità di esecuzione di prova     |

  </Accordion>
</AccordionGroup>

<Note>
Se viene utilizzato `-InstallMethod git` e Git non è presente, lo script tenta di configurare MinGit localmente per l'utente prima di mostrare il collegamento a Git per Windows.
</Note>

---

## CI e automazione

Usa flag e variabili d'ambiente non interattivi per ottenere esecuzioni prevedibili.

<Tabs>
  <Tab title="install.sh (npm non interattivo)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git non interattivo)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (salta la configurazione iniziale)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Perché è richiesto Git?">
    Git è richiesto per il metodo di installazione `git`. Per le installazioni `npm`, Git viene comunque verificato o installato per evitare errori `spawn git ENOENT` quando le dipendenze utilizzano URL git.
  </Accordion>

  <Accordion title="Perché npm genera un errore EACCES su Linux?">
    Alcune configurazioni Linux impostano il prefisso globale di npm su percorsi di proprietà di root. `install.sh` può cambiare il prefisso in `~/.npm-global` e aggiungere le esportazioni del PATH ai file rc della shell, quando tali file esistono.
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Esegui nuovamente il programma di installazione affinché possa configurare MinGit localmente per l'utente, oppure installa Git per Windows e riapri PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Esegui `npm config get prefix` e aggiungi tale directory al PATH dell'utente (su Windows non è necessario il suffisso `\bin`), quindi riapri PowerShell.
  </Accordion>

  <Accordion title="Windows: come ottenere un output dettagliato dal programma di installazione">
    `install.ps1` non espone un'opzione `-Verbose`.
    Usa la traccia di PowerShell per la diagnostica a livello di script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw non trovato dopo l'installazione">
    Di solito si tratta di un problema del PATH. Consulta [Risoluzione dei problemi di Node.js](/it/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Aggiornamento](/it/install/updating)
- [Disinstallazione](/it/install/uninstall)
