---
read_when:
    - Ti serve un metodo di installazione diverso dalla guida rapida Per iniziare
    - Vuoi distribuire su una piattaforma cloud
    - È necessario aggiornare, migrare o disinstallare
summary: Installa OpenClaw - script di installazione, npm/pnpm/bun, da sorgente, Docker e altro ancora
title: Installazione
x-i18n:
    generated_at: "2026-05-06T08:56:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## Requisiti di sistema

- **Node 24** (consigliato) oppure Node 22.14+ - lo script di installazione gestisce automaticamente questo aspetto
- **macOS, Linux o Windows** - sono supportati sia Windows nativo sia WSL2; WSL2 è più stabile. Vedi [Windows](/it/platforms/windows).
- `pnpm` è necessario solo se compili dal sorgente

## Consigliato: script di installazione

Il modo più rapido per installare. Rileva il tuo OS, installa Node se necessario, installa OpenClaw e avvia l'onboarding.

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Per installare senza eseguire l'onboarding:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Per tutti i flag e le opzioni di CI/automazione, vedi [dettagli interni dell'installer](/it/install/installer).

## Metodi di installazione alternativi

### Installer con prefisso locale (`install-cli.sh`)

Usalo quando vuoi mantenere OpenClaw e Node sotto un prefisso locale come
`~/.openclaw`, senza dipendere da un'installazione di Node a livello di sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Supporta installazioni npm per impostazione predefinita, oltre a installazioni da git checkout nello stesso
flusso con prefisso. Riferimento completo: [dettagli interni dell'installer](/it/install/installer#install-clish).

Già installato? Passa tra installazioni da pacchetto e da git con
`openclaw update --channel dev` e `openclaw update --channel stable`. Vedi
[aggiornamento](/it/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm o bun

Se gestisci già Node autonomamente:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm richiede l'approvazione esplicita per i pacchetti con script di build. Esegui `pnpm approve-builds -g` dopo la prima installazione.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun è supportato per il percorso di installazione della CLI globale. Per il runtime del Gateway, Node rimane il runtime del demone consigliato.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Risoluzione dei problemi: errori di build di sharp (npm)">
  Se `sharp` non riesce a causa di una libvips installata globalmente:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Dal sorgente

Per contributor o chiunque voglia eseguire da un checkout locale:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

In alternativa, salta il collegamento e usa `pnpm openclaw ...` dall'interno del repo. Vedi [configurazione](/it/start/setup) per i flussi di sviluppo completi.

### Installare da GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Container e gestori di pacchetti

<CardGroup cols={2}>
  <Card title="Docker" href="/it/install/docker" icon="container">
    Distribuzioni containerizzate o headless.
  </Card>
  <Card title="Podman" href="/it/install/podman" icon="container">
    Alternativa rootless a Docker per i container.
  </Card>
  <Card title="Nix" href="/it/install/nix" icon="snowflake">
    Installazione dichiarativa tramite Nix flake.
  </Card>
  <Card title="Ansible" href="/it/install/ansible" icon="server">
    Provisioning automatizzato del parco macchine.
  </Card>
  <Card title="Bun" href="/it/install/bun" icon="zap">
    Uso solo CLI tramite il runtime Bun.
  </Card>
</CardGroup>

## Verificare l'installazione

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Se vuoi l'avvio gestito dopo l'installazione:

- macOS: LaunchAgent tramite `openclaw onboard --install-daemon` o `openclaw gateway install`
- Linux/WSL2: servizio utente systemd tramite gli stessi comandi
- Windows nativo: prima Scheduled Task, con fallback a un elemento di accesso nella cartella Startup per utente se la creazione dell'attività viene negata

## Hosting e deployment

Distribuisci OpenClaw su un server cloud o VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/it/vps">Qualsiasi VPS Linux</Card>
  <Card title="Docker VM" href="/it/install/docker-vm-runtime">Passaggi Docker condivisi</Card>
  <Card title="Kubernetes" href="/it/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/it/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/it/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/it/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/it/install/azure">Azure</Card>
  <Card title="Railway" href="/it/install/railway">Railway</Card>
  <Card title="Render" href="/it/install/render">Render</Card>
  <Card title="Northflank" href="/it/install/northflank">Northflank</Card>
</CardGroup>

## Aggiornare, migrare o disinstallare

<CardGroup cols={3}>
  <Card title="Aggiornamento" href="/it/install/updating" icon="refresh-cw">
    Mantieni OpenClaw aggiornato.
  </Card>
  <Card title="Migrazione" href="/it/install/migrating" icon="arrow-right">
    Sposta su una nuova macchina.
  </Card>
  <Card title="Disinstalla" href="/it/install/uninstall" icon="trash-2">
    Rimuovi completamente OpenClaw.
  </Card>
</CardGroup>

## Risoluzione dei problemi: `openclaw` non trovato

Se l'installazione è riuscita ma `openclaw` non viene trovato nel tuo terminale:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Se `$(npm prefix -g)/bin` non è nel tuo `$PATH`, aggiungilo al file di avvio della tua shell (`~/.zshrc` o `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Poi apri un nuovo terminale. Vedi [configurazione di Node](/it/install/node) per maggiori dettagli.
