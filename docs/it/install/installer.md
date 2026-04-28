---
read_when:
    - Vuoi comprendere `openclaw.ai/install.sh`
    - Vuoi automatizzare le installazioni (CI / headless)
    - Vuoi installare da un checkout GitHub
summary: Come funzionano gli script di installazione (install.sh, install-cli.sh, install.ps1), i flag e l'automazione
title: Dettagli interni dell'installer
x-i18n:
    generated_at: "2026-04-26T11:32:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f932fb3713e8ecfa75215b05d7071b3b75e6d1135d7c326313739f294023e2
    source_path: install/installer.md
    workflow: 15
---

OpenClaw include tre script di installazione, serviti da `openclaw.ai`.

| Script                             | Piattaforma          | Cosa fa                                                                                                             |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installa Node se necessario, installa OpenClaw tramite npm (predefinito) o git e può eseguire l'onboarding.       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installa Node + OpenClaw in un prefisso locale (`~/.openclaw`) con modalità npm o checkout git. Non richiede root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installa Node se necessario, installa OpenClaw tramite npm (predefinito) o git e può eseguire l'onboarding.       |

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
Se l'installazione riesce ma `openclaw` non viene trovato in un nuovo terminale, vedi [Risoluzione dei problemi Node.js](/it/install/node#troubleshooting).
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
    Supporta macOS e Linux (incluso WSL). Se viene rilevato macOS, installa Homebrew se manca.
  </Step>
  <Step title="Garantisce Node.js 24 per impostazione predefinita">
    Controlla la versione di Node e installa Node 24 se necessario (Homebrew su macOS, script di setup NodeSource su Linux apt/dnf/yum). OpenClaw continua a supportare Node 22 LTS, attualmente `22.14+`, per compatibilità.
  </Step>
  <Step title="Garantisce Git">
    Installa Git se manca.
  </Step>
  <Step title="Installa OpenClaw">
    - Metodo `npm` (predefinito): installazione npm globale
    - Metodo `git`: clona/aggiorna il repo, installa le dipendenze con pnpm, esegue la build, poi installa il wrapper in `~/.local/bin/openclaw`

  </Step>
  <Step title="Attività post-installazione">
    - Aggiorna al meglio un servizio gateway già caricato (`openclaw gateway install --force`, poi restart)
    - Esegue `openclaw doctor --non-interactive` sugli aggiornamenti e sulle installazioni git (best effort)
    - Tenta l'onboarding quando appropriato (TTY disponibile, onboarding non disabilitato e controlli bootstrap/config superati)
    - Usa come predefinito `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Rilevamento del checkout sorgente

Se eseguito all'interno di un checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), lo script propone:

- usare il checkout (`git`), oppure
- usare l'installazione globale (`npm`)

Se non è disponibile alcun TTY e non è impostato alcun metodo di installazione, usa come predefinito `npm` e mostra un avviso.

Lo script esce con codice `2` per selezioni di metodo non valide o valori `--install-method` non validi.

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
  <Tab title="Installazione git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main tramite npm">
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
  <Accordion title="Riferimento dei flag">

| Flag                                  | Descrizione                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Sceglie il metodo di installazione (predefinito: `npm`). Alias: `--method` |
| `--npm`                               | Scorciatoia per il metodo npm                              |
| `--git`                               | Scorciatoia per il metodo git. Alias: `--github`          |
| `--version <version\|dist-tag\|spec>` | Versione npm, dist-tag o package spec (predefinito: `latest`) |
| `--beta`                              | Usa il dist-tag beta se disponibile, altrimenti fallback a `latest` |
| `--git-dir <path>`                    | Directory del checkout (predefinita: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Salta `git pull` per un checkout esistente                 |
| `--no-prompt`                         | Disabilita i prompt                                        |
| `--no-onboard`                        | Salta l'onboarding                                         |
| `--onboard`                           | Abilita l'onboarding                                       |
| `--dry-run`                           | Stampa le azioni senza applicare modifiche                |
| `--verbose`                           | Abilita l'output di debug (`set -x`, log npm a livello notice) |
| `--help`                              | Mostra l'uso (`-h`)                                        |

  </Accordion>

  <Accordion title="Riferimento delle variabili d'ambiente">

| Variabile                                              | Descrizione                                  |
| ------------------------------------------------------ | -------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                     | Metodo di installazione                      |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Versione npm, dist-tag o package spec       |
| `OPENCLAW_BETA=0\|1`                                   | Usa beta se disponibile                      |
| `OPENCLAW_GIT_DIR=<path>`                              | Directory del checkout                       |
| `OPENCLAW_GIT_UPDATE=0\|1`                             | Attiva/disattiva aggiornamenti git           |
| `OPENCLAW_NO_PROMPT=1`                                 | Disabilita i prompt                          |
| `OPENCLAW_NO_ONBOARD=1`                                | Salta l'onboarding                           |
| `OPENCLAW_DRY_RUN=1`                                   | Modalità dry run                             |
| `OPENCLAW_VERBOSE=1`                                   | Modalità debug                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`            | Livello di log npm                           |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                     | Controlla il comportamento sharp/libvips (predefinito: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Progettato per ambienti in cui vuoi tutto sotto un prefisso locale
(predefinito `~/.openclaw`) e nessuna dipendenza da Node di sistema. Supporta per impostazione predefinita installazioni npm
e anche installazioni da checkout git nello stesso flusso con prefisso.
</Info>

### Flusso (install-cli.sh)

<Steps>
  <Step title="Installa il runtime Node locale">
    Scarica un tarball Node LTS supportato e fissato (la versione è incorporata nello script e aggiornata in modo indipendente) in `<prefix>/tools/node-v<version>` e ne verifica lo SHA-256.
  </Step>
  <Step title="Garantisce Git">
    Se Git manca, tenta l'installazione tramite apt/dnf/yum su Linux o Homebrew su macOS.
  </Step>
  <Step title="Installa OpenClaw sotto il prefisso">
    - Metodo `npm` (predefinito): installa sotto il prefisso con npm, poi scrive il wrapper in `<prefix>/bin/openclaw`
    - Metodo `git`: clona/aggiorna un checkout (predefinito `~/openclaw`) e scrive comunque il wrapper in `<prefix>/bin/openclaw`

  </Step>
  <Step title="Aggiorna il servizio gateway caricato">
    Se un servizio gateway è già caricato da quello stesso prefisso, lo script esegue
    `openclaw gateway install --force`, poi `openclaw gateway restart`, e
    verifica al meglio lo stato di salute del gateway.
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
  <Tab title="Installazione git">
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

| Flag                        | Descrizione                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefisso di installazione (predefinito: `~/.openclaw`)                         |
| `--install-method npm\|git` | Sceglie il metodo di installazione (predefinito: `npm`). Alias: `--method`     |
| `--npm`                     | Scorciatoia per il metodo npm                                                   |
| `--git`, `--github`         | Scorciatoia per il metodo git                                                   |
| `--git-dir <path>`          | Directory del checkout git (predefinita: `~/openclaw`). Alias: `--dir`         |
| `--version <ver>`           | Versione OpenClaw o dist-tag (predefinito: `latest`)                            |
| `--node-version <ver>`      | Versione Node (predefinita: `22.22.0`)                                          |
| `--json`                    | Emette eventi NDJSON                                                            |
| `--onboard`                 | Esegue `openclaw onboard` dopo l'installazione                                  |
| `--no-onboard`              | Salta l'onboarding (predefinito)                                                |
| `--set-npm-prefix`          | Su Linux, forza il prefisso npm a `~/.npm-global` se il prefisso attuale non è scrivibile |
| `--help`                    | Mostra l'uso (`-h`)                                                             |

  </Accordion>

  <Accordion title="Riferimento delle variabili d'ambiente">

| Variabile                                  | Descrizione                                   |
| ------------------------------------------ | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                   | Prefisso di installazione                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`         | Metodo di installazione                       |
| `OPENCLAW_VERSION=<ver>`                   | Versione OpenClaw o dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`              | Versione Node                                 |
| `OPENCLAW_GIT_DIR=<path>`                  | Directory del checkout git per installazioni git |
| `OPENCLAW_GIT_UPDATE=0\|1`                 | Attiva/disattiva aggiornamenti git per checkout esistenti |
| `OPENCLAW_NO_ONBOARD=1`                    | Salta l'onboarding                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Livello di log npm                           |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`         | Controlla il comportamento sharp/libvips (predefinito: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Flusso (install.ps1)

<Steps>
  <Step title="Garantisce PowerShell + ambiente Windows">
    Richiede PowerShell 5+.
  </Step>
  <Step title="Garantisce Node.js 24 per impostazione predefinita">
    Se manca, tenta l'installazione tramite winget, poi Chocolatey, poi Scoop. Node 22 LTS, attualmente `22.14+`, resta supportato per compatibilità.
  </Step>
  <Step title="Installa OpenClaw">
    - Metodo `npm` (predefinito): installazione npm globale usando il `-Tag` selezionato
    - Metodo `git`: clona/aggiorna il repo, installa/esegue la build con pnpm e installa il wrapper in `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Attività post-installazione">
    - Aggiunge la directory bin necessaria al PATH utente quando possibile
    - Aggiorna al meglio un servizio gateway già caricato (`openclaw gateway install --force`, poi restart)
    - Esegue `openclaw doctor --non-interactive` sugli aggiornamenti e sulle installazioni git (best effort)

  </Step>
  <Step title="Gestisce gli errori">
    Le installazioni `iwr ... | iex` e scriptblock riportano un errore terminante senza chiudere l'attuale sessione PowerShell. Le installazioni dirette `powershell -File` / `pwsh -File` continuano invece a uscire con codice non zero per l'automazione.
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
  <Tab title="GitHub main tramite npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Directory git personalizzata">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Traccia di debug">
    ```powershell
    # install.ps1 non ha ancora un flag -Verbose dedicato.
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
| `-InstallMethod npm\|git`   | Metodo di installazione (predefinito: `npm`)              |
| `-Tag <tag\|version\|spec>` | Dist-tag npm, versione o package spec (predefinito: `latest`) |
| `-GitDir <path>`            | Directory del checkout (predefinita: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Salta l'onboarding                                         |
| `-NoGitUpdate`              | Salta `git pull`                                           |
| `-DryRun`                   | Stampa solo le azioni                                      |

  </Accordion>

  <Accordion title="Riferimento delle variabili d'ambiente">

| Variabile                          | Descrizione         |
| ---------------------------------- | ------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metodo di installazione |
| `OPENCLAW_GIT_DIR=<path>`          | Directory del checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Salta l'onboarding  |
| `OPENCLAW_GIT_UPDATE=0`            | Disabilita git pull |
| `OPENCLAW_DRY_RUN=1`               | Modalità dry run    |

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
  <Tab title="install.ps1 (salta onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Perché Git è richiesto?">
    Git è richiesto per il metodo di installazione `git`. Per le installazioni `npm`, Git viene comunque controllato/installato per evitare errori `spawn git ENOENT` quando le dipendenze usano URL git.
  </Accordion>

  <Accordion title="Perché npm incontra EACCES su Linux?">
    Alcune configurazioni Linux puntano il prefisso globale npm a percorsi posseduti da root. `install.sh` può cambiare il prefisso in `~/.npm-global` e aggiungere esportazioni PATH ai file rc della shell (quando tali file esistono).
  </Accordion>

  <Accordion title="Problemi sharp/libvips">
    Gli script usano come predefinito `SHARP_IGNORE_GLOBAL_LIBVIPS=1` per evitare che sharp venga compilato contro il libvips di sistema. Per sovrascrivere:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Installa Git for Windows, riapri PowerShell, riesegui l'installer.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Esegui `npm config get prefix` e aggiungi quella directory al PATH utente (su Windows non serve il suffisso `\bin`), poi riapri PowerShell.
  </Accordion>

  <Accordion title="Windows: come ottenere output dettagliato dell'installer">
    `install.ps1` attualmente non espone uno switch `-Verbose`.
    Usa il tracing PowerShell per la diagnostica a livello di script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw non trovato dopo l'installazione">
    Di solito è un problema di PATH. Vedi [Risoluzione dei problemi Node.js](/it/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica installazione](/it/install)
- [Aggiornamento](/it/install/updating)
- [Disinstallazione](/it/install/uninstall)
