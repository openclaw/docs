---
read_when:
    - Si desidera comprendere `openclaw.ai/install.sh`
    - Si desidera automatizzare le installazioni (CI / headless)
    - Si desidera eseguire l'installazione da un checkout di GitHub
summary: Come funzionano gli script di installazione (install.sh, install-cli.sh, install.ps1), le opzioni e l'automazione
title: Meccanismi interni del programma di installazione
x-i18n:
    generated_at: "2026-07-16T14:30:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw include tre script di installazione, distribuiti da `openclaw.ai`.

| Script                             | Piattaforma          | Funzione                                                                                       |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installa Node se necessario, installa OpenClaw tramite npm (predefinito) o git e può avviare la configurazione iniziale. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installa Node + OpenClaw in un prefisso locale (`~/.openclaw`) tramite npm o git. Non richiede privilegi di root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installa Node se necessario, installa OpenClaw tramite npm (predefinito) o git e può avviare la configurazione iniziale. |

Tutti e tre supportano Node **22.22.3+, 24.15+ o 25.9+**; Node 24 è la destinazione predefinita per le nuove installazioni.

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
Se l'installazione riesce ma `openclaw` non viene trovato in un nuovo terminale, consultare [Risoluzione dei problemi di Node.js](/it/install/node#troubleshooting).
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
  <Step title="Verifica di Node.js 24 per impostazione predefinita">
    Controlla la versione di Node e installa Node 24 se necessario (Homebrew su macOS, script di configurazione NodeSource su Linux apt/dnf/yum). Su macOS, Homebrew viene installato solo quando il programma di installazione ne ha bisogno per Node o Git. Sono supportati Node 22.22.3+, Node 24.15+ e Node 25.9+; Node 23 non è supportato.
    Su Alpine/musl Linux, il programma di installazione usa i pacchetti apk anziché NodeSource e verifica l'effettiva versione collegata di SQLite. Gli attuali flussi di pacchetti stabili di Alpine possono fornire una versione di Node sufficientemente recente con una SQLite di sistema vulnerabile; in tal caso, utilizzare un container `node:24-alpine` ufficiale o un host basato su glibc.
  </Step>
  <Step title="Verifica di Git">
    Installa Git se assente usando il gestore di pacchetti rilevato, inclusi Homebrew su macOS e apk su Alpine.
  </Step>
  <Step title="Installazione di OpenClaw">
    - Metodo `npm` (predefinito): installazione npm globale
    - Metodo `git`: clona/aggiorna il repository, installa le dipendenze con pnpm, esegue la compilazione, quindi installa il wrapper in `~/.local/bin/openclaw`

  </Step>
  <Step title="Attività successive all'installazione">
    - Individua il binario `openclaw` appena installato per i comandi successivi
    - Per un'installazione non configurata, avvia la configurazione iniziale prima dei controlli di doctor o del Gateway. Con `--no-onboard` o senza TTY, visualizza il comando per completare la configurazione in seguito.
    - Per un'installazione configurata, aggiorna e riavvia, per quanto possibile, un servizio Gateway caricato ed esegue doctor. Gli aggiornamenti aggiornano i Plugin quando possibile oppure visualizzano il comando manuale in un'esecuzione headless con prompt abilitati.
    - Quando viene eseguito `--verify`, controlla la versione installata e verifica l'integrità del Gateway solo dopo che la configurazione è presente.

  </Step>
</Steps>

### Rilevamento del checkout del codice sorgente

Se viene eseguito all'interno di un checkout di OpenClaw (`package.json` + `pnpm-workspace.yaml`), lo script propone:

- usare il checkout (`git`), oppure
- usare l'installazione globale (`npm`)

Se non è disponibile alcun TTY e non è impostato alcun metodo di installazione, viene usato per impostazione predefinita `npm` e viene mostrato un avviso.

Lo script termina con il codice `2` in caso di selezione non valida del metodo o di valori `--install-method` non validi.

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
  <Tab title="Esecuzione di prova">
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
  <Accordion title="Riferimento dei flag">

| Flag                                    | Descrizione                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Sceglie il metodo di installazione (predefinito: `npm`)                                  |
| `--npm`                                 | Scorciatoia per il metodo npm                                                 |
| `--git \| --github`                     | Scorciatoia per il metodo git                                                 |
| `--version <version\|dist-tag\|spec>`   | Versione npm, dist-tag o specifica del pacchetto (predefinito: `latest`)              |
| `--beta`                                | Usa il dist-tag beta se disponibile, altrimenti ripiega su `latest`              |
| `--git-dir \| --dir <path>`             | Directory di checkout (predefinita: `~/openclaw`)                              |
| `--no-git-update`                       | Ignora `git pull` per un checkout esistente                                   |
| `--no-prompt`                           | Disabilita i prompt                                                         |
| `--no-onboard`                          | Ignora la configurazione iniziale                                                         |
| `--onboard`                             | Abilita la configurazione iniziale                                                       |
| `--verify`                              | Esegue una verifica rapida successiva all'installazione (`--version`, integrità del Gateway se caricato) |
| `--dry-run`                             | Visualizza le azioni senza applicare modifiche                                  |
| `--verbose`                             | Abilita l'output di debug (`set -x`, log npm a livello notice)                   |
| `--help \| -h`                          | Mostra le istruzioni d'uso                                                              |

  </Accordion>

  <Accordion title="Riferimento delle variabili di ambiente">

| Variabile                                         | Descrizione                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Metodo di installazione                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Versione npm, dist-tag o specifica del pacchetto                             |
| `OPENCLAW_BETA=0\|1`                              | Usa la versione beta se disponibile                                              |
| `OPENCLAW_HOME=<path>`                            | Directory di base per lo stato di OpenClaw e i percorsi git/configurazione iniziale predefiniti |
| `OPENCLAW_GIT_DIR=<path>`                         | Directory di checkout                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Attiva o disattiva gli aggiornamenti git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | Disabilita i prompt                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Esegue la verifica rapida successiva all'installazione                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | Ignora la configurazione iniziale                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Modalità di esecuzione di prova                                                       |
| `OPENCLAW_VERBOSE=1`                              | Modalità di debug                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Livello dei log npm (predefinito: `error`, nasconde i messaggi di deprecazione npm)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Progettato per ambienti in cui si desidera mantenere tutto in un prefisso locale
(predefinito `~/.openclaw`) senza dipendere da un'installazione di sistema di Node. Supporta per impostazione predefinita le installazioni
tramite npm, oltre alle installazioni da checkout git nello stesso flusso basato sul prefisso.
</Info>

### Flusso (install-cli.sh)

<Steps>
  <Step title="Installazione del runtime Node locale">
    Scarica un archivio tar di una versione Node LTS supportata e bloccata (la versione è incorporata nello script e aggiornata indipendentemente, predefinita `24.15.0`) in `<prefix>/tools/node-v<version>` e ne verifica il valore SHA-256.
    Linux ARMv7 usa Node `22.22.3` perché i binari ufficiali di Node 24+ per ARMv7 non sono disponibili.
    Su Alpine/musl Linux, dove Node non pubblica archivi tar compatibili con il runtime bloccato, installa `nodejs` e `npm` con `apk`, quindi verifica sia Node sia l'effettiva libreria SQLite collegata. Gli attuali flussi di pacchetti stabili di Alpine possono comunque collegare una SQLite vulnerabile anche con una versione di Node sufficientemente recente; quando il controllo di sicurezza rifiuta il pacchetto, usare un container `node:24-alpine` ufficiale o un host basato su glibc.
  </Step>
  <Step title="Verifica di Git">
    Se Git non è presente, tenta l'installazione tramite apt/dnf/yum/apk su Linux o Homebrew su macOS.
  </Step>
  <Step title="Installazione di OpenClaw nel prefisso">
    - Metodo `npm` (predefinito): esegue l'installazione nel prefisso con npm, quindi scrive il wrapper in `<prefix>/bin/openclaw`
    - Metodo `git`: clona/aggiorna un checkout (predefinito `~/openclaw`) e scrive comunque il wrapper in `<prefix>/bin/openclaw`

  </Step>
  <Step title="Aggiornamento del servizio Gateway caricato">
    Se un servizio Gateway è già caricato dallo stesso prefisso, lo script esegue
    `openclaw gateway install --force`, che attiva il servizio sostitutivo,
    quindi verifica, per quanto possibile, l'integrità del Gateway.
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
  <Accordion title="Riferimento dei flag">

| Flag                                    | Descrizione                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Prefisso di installazione (predefinito: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | Sceglie il metodo di installazione (predefinito: `npm`)                                          |
| `--npm`                                 | Scorciatoia per il metodo npm                                                         |
| `--git \| --github`                     | Scorciatoia per il metodo git                                                         |
| `--git-dir \| --dir <path>`             | Directory di checkout Git (predefinita: `~/openclaw`)                                  |
| `--version <ver>`                       | Versione o dist-tag di OpenClaw (predefinito: `latest`)                                |
| `--node-version <ver>`                  | Versione di Node (predefinita: `24.15.0`; `22.22.3` su Linux ARMv7)                     |
| `--json`                                | Genera eventi NDJSON                                                              |
| `--onboard`                             | Esegue `openclaw onboard` dopo l'installazione                                            |
| `--no-onboard`                          | Salta la configurazione iniziale (impostazione predefinita)                                                       |
| `--set-npm-prefix`                      | Su Linux, forza il prefisso npm su `~/.npm-global` se il prefisso corrente non è scrivibile |
| `--help \| -h`                          | Mostra le istruzioni per l'uso                                                                      |

  </Accordion>

  <Accordion title="Riferimento delle variabili di ambiente">

| Variabile                                    | Descrizione                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Prefisso di installazione                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metodo di installazione                                                     |
| `OPENCLAW_VERSION=<ver>`                    | Versione o dist-tag di OpenClaw                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versione di Node                                                       |
| `OPENCLAW_HOME=<path>`                      | Directory di base per lo stato di OpenClaw e i percorsi git/configurazione iniziale predefiniti |
| `OPENCLAW_GIT_DIR=<path>`                   | Directory di checkout Git per le installazioni git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Attiva o disattiva gli aggiornamenti git per i checkout esistenti                          |
| `OPENCLAW_NO_ONBOARD=1`                     | Salta la configurazione iniziale                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Livello di log di npm (predefinito: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` e le altre specifiche del codice sorgente GitHub non sono destinazioni `--version` valide per le installazioni npm. Usare invece `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Flusso (install.ps1)

<Steps>
  <Step title="Verifica dell'ambiente PowerShell + Windows">
    Richiede PowerShell 5+.
  </Step>
  <Step title="Verifica di Node.js 24 per impostazione predefinita">
    Se non è presente, tenta l'installazione tramite winget, quindi Chocolatey e infine Scoop. Se non è disponibile alcun gestore di pacchetti, lo script scarica il file zip ufficiale di Node.js 24 per Windows in `%LOCALAPPDATA%\OpenClaw\deps\portable-node` e lo aggiunge al PATH del processo corrente e dell'utente. Sono supportati Node 22.22.3+, Node 24.15+ e Node 25.9+; Node 23 non è supportato.
  </Step>
  <Step title="Installazione di OpenClaw">
    - Metodo `npm` (predefinito): installazione npm globale mediante il valore `-Tag` selezionato, avviata da una directory temporanea scrivibile del programma di installazione, in modo che funzionino anche le shell aperte in cartelle protette come `C:\`
    - Metodo `git`: clona/aggiorna il repository, esegue l'installazione/la compilazione con pnpm e installa il wrapper in `%USERPROFILE%\.local\bin\openclaw.cmd`. Se Git non è presente, lo script configura MinGit locale per l'utente in `%LOCALAPPDATA%\OpenClaw\deps\portable-git` e lo aggiunge al PATH del processo corrente e dell'utente.

  </Step>
  <Step title="Attività successive all'installazione">
    - Aggiunge la directory bin necessaria al PATH dell'utente quando possibile
    - Aggiorna, per quanto possibile, un servizio Gateway caricato (`openclaw gateway install --force`, quindi riavvio)
    - Esegue `openclaw doctor --non-interactive` durante gli aggiornamenti e le installazioni git (per quanto possibile)

  </Step>
  <Step title="Gestione degli errori">
    Le installazioni `iwr ... | iex` e tramite blocco di script segnalano un errore terminante senza chiudere la sessione PowerShell corrente. Le installazioni dirette `powershell -File` / `pwsh -File` continuano invece a terminare con un codice diverso da zero per l'automazione.
  </Step>
</Steps>

### Esempi (install.ps1)

<Tabs>
  <Tab title="Predefinita">
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
  <Tab title="Esecuzione simulata">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Riferimento dei flag">

| Flag                        | Descrizione                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metodo di installazione (predefinito: `npm`)                            |
| `-Tag <tag\|version\|spec>` | dist-tag, versione o specifica del pacchetto npm (predefinito: `latest`) |
| `-GitDir <path>`            | Directory di checkout (predefinita: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Salta la configurazione iniziale                                            |
| `-NoGitUpdate`              | Salta `git pull`                                            |
| `-DryRun`                   | Stampa soltanto le azioni                                         |

  </Accordion>

  <Accordion title="Riferimento delle variabili di ambiente">

| Variabile                           | Descrizione        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metodo di installazione     |
| `OPENCLAW_GIT_DIR=<path>`          | Directory di checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Salta la configurazione iniziale    |
| `OPENCLAW_GIT_UPDATE=0`            | Disabilita git pull   |
| `OPENCLAW_DRY_RUN=1`               | Modalità di esecuzione simulata       |

  </Accordion>
</AccordionGroup>

<Note>
Se si usa `-InstallMethod git` e Git non è presente, lo script tenta di configurare MinGit localmente per l'utente prima di mostrare il collegamento a Git for Windows.
</Note>

---

## CI e automazione

Usare flag/variabili di ambiente non interattivi per ottenere esecuzioni prevedibili.

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
    Git è richiesto per il metodo di installazione `git`. Per le installazioni `npm`, Git viene comunque verificato/installato per evitare errori `spawn git ENOENT` quando le dipendenze usano URL git.
  </Accordion>

  <Accordion title="Perché npm genera un errore EACCES su Linux?">
    Alcune configurazioni Linux impostano il prefisso globale di npm su percorsi di proprietà di root. `install.sh` può impostare il prefisso su `~/.npm-global` e aggiungere le esportazioni di PATH ai file rc della shell (se tali file esistono).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Eseguire nuovamente il programma di installazione in modo che possa configurare MinGit localmente per l'utente, oppure installare Git for Windows e riaprire PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Eseguire `npm config get prefix` e aggiungere tale directory al PATH dell'utente (su Windows non è necessario il suffisso `\bin`), quindi riaprire PowerShell.
  </Accordion>

  <Accordion title="Windows: come ottenere un output dettagliato del programma di installazione">
    `install.ps1` non espone un'opzione `-Verbose`.
    Usare il tracciamento di PowerShell per la diagnostica a livello di script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw non trovato dopo l'installazione">
    Di solito si tratta di un problema relativo al PATH. Consultare [Risoluzione dei problemi di Node.js](/it/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Aggiornamento](/it/install/updating)
- [Disinstallazione](/it/install/uninstall)
