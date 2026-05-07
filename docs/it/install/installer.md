---
read_when:
    - Vuoi comprendere `openclaw.ai/install.sh`
    - Vuoi automatizzare le installazioni (CI / senza interfaccia grafica)
    - Vuoi installare da un checkout di GitHub
summary: Come funzionano gli script di installazione (install.sh, install-cli.sh, install.ps1), i flag e l'automazione
title: Dettagli interni del programma di installazione
x-i18n:
    generated_at: "2026-05-07T13:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a62720526e2a5ffc94555f77e7e806d63768b849a9491b60f6fdc9cf070eed2f
    source_path: install/installer.md
    workflow: 16
---

OpenClaw distribuisce tre script di installazione, serviti da `openclaw.ai`.

| Script                             | Piattaforma          | Cosa fa                                                                                                           |
| ---------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installa Node se necessario, installa OpenClaw tramite npm (predefinito) o git, e può eseguire l’onboarding.      |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installa Node + OpenClaw in un prefisso locale (`~/.openclaw`) con modalità npm o checkout git. Root non richiesto. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installa Node se necessario, installa OpenClaw tramite npm (predefinito) o git, e può eseguire l’onboarding.      |

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
Se l’installazione riesce ma `openclaw` non viene trovato in un nuovo terminale, consulta [risoluzione dei problemi di Node.js](/it/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Consigliato per la maggior parte delle installazioni interattive su macOS/Linux/WSL.
</Tip>

### Flusso (install.sh)

<Steps>
  <Step title="Detect OS">
    Supporta macOS e Linux (incluso WSL). Se viene rilevato macOS, installa Homebrew se manca.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Controlla la versione di Node e installa Node 24 se necessario (Homebrew su macOS, script di configurazione NodeSource su Linux apt/dnf/yum). OpenClaw supporta ancora Node 22 LTS, attualmente `22.16+`, per compatibilità.
  </Step>
  <Step title="Ensure Git">
    Installa Git se manca.
  </Step>
  <Step title="Install OpenClaw">
    - metodo `npm` (predefinito): installazione npm globale
    - metodo `git`: clona/aggiorna il repo, installa le dipendenze con pnpm, compila, quindi installa il wrapper in `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - Aggiorna al meglio un servizio Gateway caricato (`openclaw gateway install --force`, quindi riavvio)
    - Esegue `openclaw doctor --non-interactive` sugli aggiornamenti e sulle installazioni git (al meglio)
    - Tenta l’onboarding quando appropriato (TTY disponibile, onboarding non disabilitato e controlli bootstrap/config superati)
    - Imposta per impostazione predefinita `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Rilevamento del checkout sorgente

Se eseguito dentro un checkout di OpenClaw (`package.json` + `pnpm-workspace.yaml`), lo script offre:

- usa il checkout (`git`), oppure
- usa l’installazione globale (`npm`)

Se non è disponibile alcun TTY e non è impostato alcun metodo di installazione, usa `npm` come predefinito e mostra un avviso.

Lo script termina con codice `2` per selezione del metodo non valida o valori `--install-method` non validi.

### Esempi (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                                  | Descrizione                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Sceglie il metodo di installazione (predefinito: `npm`). Alias: `--method` |
| `--npm`                               | Scorciatoia per il metodo npm                              |
| `--git`                               | Scorciatoia per il metodo git. Alias: `--github`           |
| `--version <version\|dist-tag\|spec>` | Versione npm, dist-tag o specifica pacchetto (predefinito: `latest`) |
| `--beta`                              | Usa il dist-tag beta se disponibile, altrimenti ripiega su `latest` |
| `--git-dir <path>`                    | Directory di checkout (predefinita: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Salta `git pull` per un checkout esistente                 |
| `--no-prompt`                         | Disabilita i prompt                                        |
| `--no-onboard`                        | Salta l’onboarding                                         |
| `--onboard`                           | Abilita l’onboarding                                       |
| `--dry-run`                           | Stampa le azioni senza applicare modifiche                 |
| `--verbose`                           | Abilita l’output di debug (`set -x`, log npm a livello notice) |
| `--help`                              | Mostra l’utilizzo (`-h`)                                   |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variabile                                               | Descrizione                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Metodo di installazione                       |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Versione npm, dist-tag o specifica pacchetto  |
| `OPENCLAW_BETA=0\|1`                                    | Usa beta se disponibile                       |
| `OPENCLAW_GIT_DIR=<path>`                               | Directory di checkout                         |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Attiva/disattiva gli aggiornamenti git        |
| `OPENCLAW_NO_PROMPT=1`                                  | Disabilita i prompt                           |
| `OPENCLAW_NO_ONBOARD=1`                                 | Salta l’onboarding                            |
| `OPENCLAW_DRY_RUN=1`                                    | Modalità dry run                              |
| `OPENCLAW_VERBOSE=1`                                    | Modalità debug                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Livello di log npm                            |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Controlla il comportamento sharp/libvips (predefinito: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Progettato per ambienti in cui vuoi tutto sotto un prefisso locale
(predefinito `~/.openclaw`) e nessuna dipendenza di sistema da Node. Supporta installazioni npm
per impostazione predefinita, oltre a installazioni da checkout git con lo stesso flusso di prefisso.
</Info>

### Flusso (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Scarica un tarball Node LTS supportato e fissato (la versione è incorporata nello script e aggiornata indipendentemente) in `<prefix>/tools/node-v<version>` e verifica SHA-256.
  </Step>
  <Step title="Ensure Git">
    Se Git manca, tenta l’installazione tramite apt/dnf/yum su Linux o Homebrew su macOS.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - metodo `npm` (predefinito): installa sotto il prefisso con npm, quindi scrive il wrapper in `<prefix>/bin/openclaw`
    - metodo `git`: clona/aggiorna un checkout (predefinito `~/openclaw`) e scrive comunque il wrapper in `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    Se un servizio Gateway è già caricato da quello stesso prefisso, lo script esegue
    `openclaw gateway install --force`, quindi `openclaw gateway restart`, e
    verifica al meglio lo stato di salute del Gateway.
  </Step>
</Steps>

### Esempi (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                        | Descrizione                                                                    |
| --------------------------- | ------------------------------------------------------------------------------ |
| `--prefix <path>`           | Prefisso di installazione (predefinito: `~/.openclaw`)                         |
| `--install-method npm\|git` | Sceglie il metodo di installazione (predefinito: `npm`). Alias: `--method`     |
| `--npm`                     | Scorciatoia per il metodo npm                                                  |
| `--git`, `--github`         | Scorciatoia per il metodo git                                                  |
| `--git-dir <path>`          | Directory di checkout Git (predefinita: `~/openclaw`). Alias: `--dir`          |
| `--version <ver>`           | Versione OpenClaw o dist-tag (predefinito: `latest`)                           |
| `--node-version <ver>`      | Versione Node (predefinita: `22.22.0`)                                         |
| `--json`                    | Emette eventi NDJSON                                                           |
| `--onboard`                 | Esegue `openclaw onboard` dopo l’installazione                                 |
| `--no-onboard`              | Salta l’onboarding (predefinito)                                               |
| `--set-npm-prefix`          | Su Linux, forza il prefisso npm a `~/.npm-global` se il prefisso corrente non è scrivibile |
| `--help`                    | Mostra l’utilizzo (`-h`)                                                       |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variabile                                   | Descrizione                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefisso di installazione                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metodo di installazione                       |
| `OPENCLAW_VERSION=<ver>`                    | Versione di OpenClaw o dist-tag               |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versione di Node                              |
| `OPENCLAW_GIT_DIR=<path>`                   | Directory di checkout Git per installazioni git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Attiva/disattiva gli aggiornamenti git per checkout esistenti |
| `OPENCLAW_NO_ONBOARD=1`                     | Salta l'onboarding                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Livello di log npm                            |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Controlla il comportamento di sharp/libvips (predefinito: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Flusso (install.ps1)

<Steps>
  <Step title="Verifica l'ambiente PowerShell + Windows">
    Richiede PowerShell 5+.
  </Step>
  <Step title="Assicura Node.js 24 per impostazione predefinita">
    Se manca, tenta l'installazione tramite winget, poi Chocolatey, poi Scoop. Node 22 LTS, attualmente `22.16+`, resta supportato per compatibilità.
  </Step>
  <Step title="Installa OpenClaw">
    - Metodo `npm` (predefinito): installazione npm globale usando il `-Tag` selezionato, avviata da una directory temporanea dell'installer scrivibile, così le shell aperte in cartelle protette come `C:\` funzionano comunque
    - Metodo `git`: clona/aggiorna il repo, installa/compila con pnpm e installa il wrapper in `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Attività post-installazione">
    - Aggiunge la directory bin necessaria al PATH utente quando possibile
    - Aggiorna al meglio un servizio Gateway caricato (`openclaw gateway install --force`, poi riavvio)
    - Esegue `openclaw doctor --non-interactive` sugli aggiornamenti e sulle installazioni git (al meglio)

  </Step>
  <Step title="Gestisce gli errori">
    Le installazioni con `iwr ... | iex` e scriptblock segnalano un errore terminante senza chiudere la sessione PowerShell corrente. Le installazioni dirette con `powershell -File` / `pwsh -File` continuano a terminare con codice diverso da zero per l'automazione.
  </Step>
</Steps>

### Esempi (install.ps1)

<Tabs>
  <Tab title="Predefinito">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Installazione git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Main di GitHub tramite npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
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
  <Tab title="Traccia di debug">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Riferimento dei flag">

| Flag                        | Descrizione                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metodo di installazione (predefinito: `npm`)               |
| `-Tag <tag\|version\|spec>` | dist-tag npm, versione o specifica del pacchetto (predefinito: `latest`) |
| `-GitDir <path>`            | Directory di checkout (predefinita: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Salta l'onboarding                                         |
| `-NoGitUpdate`              | Salta `git pull`                                           |
| `-DryRun`                   | Stampa solo le azioni                                      |

  </Accordion>

  <Accordion title="Riferimento delle variabili d'ambiente">

| Variabile                          | Descrizione             |
| ---------------------------------- | ----------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metodo di installazione |
| `OPENCLAW_GIT_DIR=<path>`          | Directory di checkout   |
| `OPENCLAW_NO_ONBOARD=1`            | Salta l'onboarding      |
| `OPENCLAW_GIT_UPDATE=0`            | Disabilita git pull     |
| `OPENCLAW_DRY_RUN=1`               | Modalità di prova       |

  </Accordion>
</AccordionGroup>

<Note>
Se viene usato `-InstallMethod git` e Git manca, lo script termina e stampa il link a Git for Windows.
</Note>

---

## CI e automazione

Usa flag/variabili d'ambiente non interattivi per esecuzioni prevedibili.

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
  <Tab title="install.ps1 (salta l'onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Perché è richiesto Git?">
    Git è richiesto per il metodo di installazione `git`. Per le installazioni `npm`, Git viene comunque controllato/installato per evitare errori `spawn git ENOENT` quando le dipendenze usano URL git.
  </Accordion>

  <Accordion title="Perché npm incontra EACCES su Linux?">
    Alcune configurazioni Linux puntano il prefisso globale di npm a percorsi di proprietà di root. `install.sh` può spostare il prefisso su `~/.npm-global` e aggiungere esportazioni PATH ai file rc della shell (quando tali file esistono).
  </Accordion>

  <Accordion title="Problemi con sharp/libvips">
    Gli script impostano per impostazione predefinita `SHARP_IGNORE_GLOBAL_LIBVIPS=1` per evitare che sharp venga compilato contro libvips di sistema. Per sovrascrivere:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Installa Git for Windows, riapri PowerShell, riesegui l'installer.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Esegui `npm config get prefix` e aggiungi quella directory al PATH utente (su Windows non è necessario il suffisso `\bin`), poi riapri PowerShell.
  </Accordion>

  <Accordion title="Windows: come ottenere output dettagliato dell'installer">
    `install.ps1` attualmente non espone un'opzione `-Verbose`.
    Usa il tracing di PowerShell per la diagnostica a livello di script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw non trovato dopo l'installazione">
    Di solito è un problema di PATH. Vedi [risoluzione dei problemi di Node.js](/it/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Aggiornamento](/it/install/updating)
- [Disinstallazione](/it/install/uninstall)
