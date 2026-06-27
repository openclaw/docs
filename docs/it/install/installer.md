---
read_when:
    - Vuoi comprendere `openclaw.ai/install.sh`
    - Vuoi automatizzare le installazioni (CI / headless)
    - Vuoi installare da un checkout GitHub
summary: Come funzionano gli script di installazione (install.sh, install-cli.sh, install.ps1), flag e automazione
title: Interni dell'installer
x-i18n:
    generated_at: "2026-06-27T17:40:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw distribuisce tre script di installazione, serviti da `openclaw.ai`.

| Script                             | Piattaforma          | Cosa fa                                                                                                             |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installa Node se necessario, installa OpenClaw tramite npm (predefinito) o git e può eseguire l'onboarding.         |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installa Node + OpenClaw in un prefisso locale (`~/.openclaw`) con modalità npm o checkout git. Non richiede root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installa Node se necessario, installa OpenClaw tramite npm (predefinito) o git e può eseguire l'onboarding.         |

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
Se l'installazione riesce ma `openclaw` non viene trovato in un nuovo terminale, consulta [risoluzione dei problemi di Node.js](/it/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Consigliato per la maggior parte delle installazioni interattive su macOS/Linux/WSL.
</Tip>

### Flusso (install.sh)

<Steps>
  <Step title="Rileva il sistema operativo">
    Supporta macOS e Linux (incluso WSL).
  </Step>
  <Step title="Garantisce Node.js 24 per impostazione predefinita">
    Controlla la versione di Node e installa Node 24 se necessario (Homebrew su macOS, script di configurazione NodeSource su Linux apt/dnf/yum). Su macOS, Homebrew viene installato solo quando il programma di installazione ne ha bisogno per Node o Git. OpenClaw supporta ancora Node 22 LTS, attualmente `22.19+`, per compatibilità.
    Su Alpine/musl Linux, il programma di installazione usa i pacchetti apk invece di NodeSource; i repository Alpine configurati devono fornire Node `22.19+` (Alpine 3.21 o successiva al momento della stesura).
  </Step>
  <Step title="Garantisce Git">
    Installa Git se manca usando il gestore di pacchetti rilevato, inclusi Homebrew su macOS e apk su Alpine.
  </Step>
  <Step title="Installa OpenClaw">
    - metodo `npm` (predefinito): installazione npm globale
    - metodo `git`: clona/aggiorna il repository, installa le dipendenze con pnpm, compila, quindi installa il wrapper in `~/.local/bin/openclaw`

  </Step>
  <Step title="Attività post-installazione">
    - Aggiorna al meglio un servizio Gateway caricato (`openclaw gateway install --force`, quindi riavvio)
    - Esegue `openclaw doctor --non-interactive` durante aggiornamenti e installazioni git (al meglio)
    - Tenta l'onboarding quando appropriato (TTY disponibile, onboarding non disabilitato e controlli bootstrap/config superati)

  </Step>
</Steps>

### Rilevamento del checkout sorgente

Se eseguito all'interno di un checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), lo script offre:

- usare il checkout (`git`), oppure
- usare l'installazione globale (`npm`)

Se non è disponibile alcun TTY e non è impostato alcun metodo di installazione, usa `npm` come predefinito e mostra un avviso.

Lo script termina con codice `2` per una selezione del metodo non valida o valori `--install-method` non validi.

### Esempi (install.sh)

<Tabs>
  <Tab title="Predefinito">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Salta onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Installazione Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Checkout main di GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Riferimento dei flag">

| Flag                                  | Descrizione                                                    |
| ------------------------------------- | -------------------------------------------------------------- |
| `--install-method npm\|git`           | Scegli il metodo di installazione (predefinito: `npm`). Alias: `--method` |
| `--npm`                               | Scorciatoia per il metodo npm                                  |
| `--git`                               | Scorciatoia per il metodo git. Alias: `--github`               |
| `--version <version\|dist-tag\|spec>` | Versione npm, dist-tag o specifica del pacchetto (predefinito: `latest`) |
| `--beta`                              | Usa il dist-tag beta se disponibile, altrimenti ripiega su `latest` |
| `--git-dir <path>`                    | Directory di checkout (predefinita: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Salta `git pull` per un checkout esistente                     |
| `--no-prompt`                         | Disabilita i prompt                                           |
| `--no-onboard`                        | Salta l'onboarding                                            |
| `--onboard`                           | Abilita l'onboarding                                          |
| `--dry-run`                           | Stampa le azioni senza applicare modifiche                    |
| `--verbose`                           | Abilita l'output di debug (`set -x`, log npm a livello notice) |
| `--help`                              | Mostra l'utilizzo (`-h`)                                      |

  </Accordion>

  <Accordion title="Riferimento delle variabili d'ambiente">

| Variabile                                         | Descrizione                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Metodo di installazione                                            |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Versione npm, dist-tag o specifica del pacchetto                   |
| `OPENCLAW_BETA=0\|1`                              | Usa beta se disponibile                                            |
| `OPENCLAW_HOME=<path>`                            | Directory base per lo stato OpenClaw e i percorsi git/onboarding predefiniti |
| `OPENCLAW_GIT_DIR=<path>`                         | Directory di checkout                                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Attiva/disattiva gli aggiornamenti git                             |
| `OPENCLAW_NO_PROMPT=1`                            | Disabilita i prompt                                                |
| `OPENCLAW_NO_ONBOARD=1`                           | Salta l'onboarding                                                 |
| `OPENCLAW_DRY_RUN=1`                              | Modalità dry run                                                   |
| `OPENCLAW_VERBOSE=1`                              | Modalità debug                                                     |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Livello di log npm                                                 |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Progettato per ambienti in cui vuoi tutto sotto un prefisso locale
(predefinito `~/.openclaw`) e nessuna dipendenza Node di sistema. Supporta le installazioni npm
per impostazione predefinita, più installazioni da checkout git nello stesso flusso con prefisso.
</Info>

### Flusso (install-cli.sh)

<Steps>
  <Step title="Installa il runtime Node locale">
    Scarica un tarball Node LTS supportato e fissato (la versione è incorporata nello script e aggiornata indipendentemente) in `<prefix>/tools/node-v<version>` e verifica SHA-256.
    Su Alpine/musl Linux, dove Node non pubblica tarball compatibili per il runtime fissato, installa `nodejs` e `npm` con `apk` e collega quel runtime nel percorso del wrapper del prefisso. I repository Alpine devono fornire Node `22.19+`; usa Alpine 3.21 o successiva se repository più vecchi forniscono solo Node 20 o 21.
  </Step>
  <Step title="Garantisce Git">
    Se Git manca, tenta l'installazione tramite apt/dnf/yum/apk su Linux o Homebrew su macOS.
  </Step>
  <Step title="Installa OpenClaw sotto il prefisso">
    - metodo `npm` (predefinito): installa sotto il prefisso con npm, quindi scrive il wrapper in `<prefix>/bin/openclaw`
    - metodo `git`: clona/aggiorna un checkout (predefinito `~/openclaw`) e scrive comunque il wrapper in `<prefix>/bin/openclaw`

  </Step>
  <Step title="Aggiorna il servizio Gateway caricato">
    Se un servizio Gateway è già caricato dallo stesso prefisso, lo script esegue
    `openclaw gateway install --force`, quindi `openclaw gateway restart`, e
    controlla al meglio l'integrità del Gateway.
  </Step>
</Steps>

### Esempi (install-cli.sh)

<Tabs>
  <Tab title="Predefinito">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefisso personalizzato + versione">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Installazione Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Output JSON per automazione">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Esegui onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Riferimento dei flag">

| Flag                        | Descrizione                                                                    |
| --------------------------- | ------------------------------------------------------------------------------ |
| `--prefix <path>`           | Prefisso di installazione (predefinito: `~/.openclaw`)                         |
| `--install-method npm\|git` | Scegli il metodo di installazione (predefinito: `npm`). Alias: `--method`      |
| `--npm`                     | Scorciatoia per il metodo npm                                                  |
| `--git`, `--github`         | Scorciatoia per il metodo git                                                  |
| `--git-dir <path>`          | Directory del checkout Git (predefinita: `~/openclaw`). Alias: `--dir`         |
| `--version <ver>`           | Versione di OpenClaw o dist-tag (predefinito: `latest`)                        |
| `--node-version <ver>`      | Versione di Node (predefinita: `22.22.0`)                                      |
| `--json`                    | Emetti eventi NDJSON                                                           |
| `--onboard`                 | Esegui `openclaw onboard` dopo l'installazione                                 |
| `--no-onboard`              | Salta l'onboarding (predefinito)                                               |
| `--set-npm-prefix`          | Su Linux, forza il prefisso npm a `~/.npm-global` se il prefisso attuale non è scrivibile |
| `--help`                    | Mostra l'utilizzo (`-h`)                                                       |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variabile                                   | Descrizione                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Prefisso di installazione                                          |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metodo di installazione                                            |
| `OPENCLAW_VERSION=<ver>`                    | Versione di OpenClaw o dist-tag                                    |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versione di Node                                                   |
| `OPENCLAW_HOME=<path>`                      | Directory di base per lo stato di OpenClaw e i percorsi git/onboarding predefiniti |
| `OPENCLAW_GIT_DIR=<path>`                   | Directory del checkout Git per le installazioni git                |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Attiva o disattiva gli aggiornamenti git per i checkout esistenti  |
| `OPENCLAW_NO_ONBOARD=1`                     | Salta l'onboarding                                                 |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Livello di log npm                                                 |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Flusso (install.ps1)

<Steps>
  <Step title="Ensure PowerShell + Windows environment">
    Richiede PowerShell 5+.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Se manca, tenta l'installazione tramite winget, poi Chocolatey, poi Scoop. Se non è disponibile alcun gestore di pacchetti, lo script scarica lo zip ufficiale di Node.js per Windows in `%LOCALAPPDATA%\OpenClaw\deps\portable-node` e lo aggiunge al PATH del processo corrente e dell'utente. Node 22 LTS, attualmente `22.19+`, rimane supportato per compatibilità.
  </Step>
  <Step title="Install OpenClaw">
    - Metodo `npm` (predefinito): installazione npm globale usando il `-Tag` selezionato, avviata da una directory temporanea del programma di installazione scrivibile, così le shell aperte in cartelle protette come `C:\` funzionano comunque
    - Metodo `git`: clona/aggiorna il repo, installa/compila con pnpm e installa il wrapper in `%USERPROFILE%\.local\bin\openclaw.cmd`. Se Git manca, lo script esegue il bootstrap di MinGit locale per l'utente in `%LOCALAPPDATA%\OpenClaw\deps\portable-git` e lo aggiunge al PATH del processo corrente e dell'utente.

  </Step>
  <Step title="Post-install tasks">
    - Aggiunge la directory bin necessaria al PATH dell'utente quando possibile
    - Aggiorna al meglio un servizio gateway caricato (`openclaw gateway install --force`, poi riavvio)
    - Esegue `openclaw doctor --non-interactive` sugli aggiornamenti e sulle installazioni git (al meglio)

  </Step>
  <Step title="Handle failures">
    `iwr ... | iex` e le installazioni tramite scriptblock segnalano un errore terminante senza chiudere la sessione PowerShell corrente. Le installazioni dirette `powershell -File` / `pwsh -File` continuano a uscire con codice diverso da zero per l'automazione.
  </Step>
</Steps>

### Esempi (install.ps1)

<Tabs>
  <Tab title="Default">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git install">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main checkout">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Custom git directory">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                        | Descrizione                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metodo di installazione (predefinito: `npm`)               |
| `-Tag <tag\|version\|spec>` | dist-tag npm, versione o specifica del pacchetto (predefinito: `latest`) |
| `-GitDir <path>`            | Directory del checkout (predefinita: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Salta l'onboarding                                         |
| `-NoGitUpdate`              | Salta `git pull`                                           |
| `-DryRun`                   | Stampa solo le azioni                                      |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variabile                          | Descrizione             |
| ---------------------------------- | ----------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metodo di installazione |
| `OPENCLAW_GIT_DIR=<path>`          | Directory del checkout  |
| `OPENCLAW_NO_ONBOARD=1`            | Salta l'onboarding      |
| `OPENCLAW_GIT_UPDATE=0`            | Disabilita git pull     |
| `OPENCLAW_DRY_RUN=1`               | Modalità dry run        |

  </Accordion>
</AccordionGroup>

<Note>
Se viene usato `-InstallMethod git` e Git manca, lo script prova un bootstrap di MinGit locale per l'utente prima di stampare il link a Git for Windows.
</Note>

---

## CI e automazione

Usa flag/variabili d'ambiente non interattivi per esecuzioni prevedibili.

<Tabs>
  <Tab title="install.sh (non-interactive npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (non-interactive git)">
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
  <Tab title="install.ps1 (skip onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Why is Git required?">
    Git è richiesto per il metodo di installazione `git`. Per le installazioni `npm`, Git viene comunque controllato/installato per evitare errori `spawn git ENOENT` quando le dipendenze usano URL git.
  </Accordion>

  <Accordion title="Why does npm hit EACCES on Linux?">
    Alcune configurazioni Linux puntano il prefisso globale npm a percorsi di proprietà di root. `install.sh` può cambiare il prefisso in `~/.npm-global` e aggiungere esportazioni PATH ai file rc della shell (quando tali file esistono).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Riesegui il programma di installazione affinché possa eseguire il bootstrap di MinGit locale per l'utente, oppure installa Git for Windows e riapri PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Esegui `npm config get prefix` e aggiungi quella directory al PATH dell'utente (su Windows non serve il suffisso `\bin`), poi riapri PowerShell.
  </Accordion>

  <Accordion title="Windows: how to get verbose installer output">
    `install.ps1` attualmente non espone uno switch `-Verbose`.
    Usa il tracing di PowerShell per la diagnostica a livello di script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw not found after install">
    Di solito è un problema di PATH. Vedi [risoluzione dei problemi di Node.js](/it/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Aggiornamento](/it/install/updating)
- [Disinstallazione](/it/install/uninstall)
