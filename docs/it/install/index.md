---
read_when:
    - Hai bisogno di un metodo di installazione diverso dal quickstart di Getting Started
    - Vuoi eseguire il deployment su una piattaforma cloud
    - Hai bisogno di aggiornare, migrare o disinstallare
summary: Installa OpenClaw — script di installazione, npm/pnpm/bun, dal sorgente, Docker e altro
title: Installazione
x-i18n:
    generated_at: "2026-04-05T13:55:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: eca17c76a2a66166b3d8cda9dc3144ab920d30ad0ed2a220eb9389d7a383ba5d
    source_path: install/index.md
    workflow: 15
---

# Installazione

## Consigliato: script di installazione

Il modo più rapido per installare. Rileva il tuo sistema operativo, installa Node se necessario, installa OpenClaw e avvia l'onboarding.

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

Per tutti i flag e le opzioni CI/automazione, vedi [Elementi interni dell'installer](/install/installer).

## Requisiti di sistema

- **Node 24** (consigliato) oppure Node 22.14+ — lo script di installazione se ne occupa automaticamente
- **macOS, Linux o Windows** — sono supportati sia Windows nativo sia WSL2; WSL2 è più stabile. Vedi [Windows](/platforms/windows).
- `pnpm` è necessario solo se compili dal sorgente

## Metodi di installazione alternativi

### Installer con prefisso locale (`install-cli.sh`)

Usalo quando vuoi mantenere OpenClaw e Node sotto un prefisso locale come
`~/.openclaw`, senza dipendere da un'installazione Node a livello di sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Supporta per impostazione predefinita le installazioni npm, oltre alle
installazioni da checkout git nello stesso flusso basato su prefisso locale. Riferimento completo: [Elementi interni dell'installer](/install/installer#install-clish).

### npm, pnpm o bun

Se gestisci già Node in autonomia:

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
    pnpm richiede un'approvazione esplicita per i pacchetti con script di build. Esegui `pnpm approve-builds -g` dopo la prima installazione.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    bun è supportato per il percorso di installazione globale della CLI. Per il runtime del Gateway, Node resta il runtime daemon consigliato.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Risoluzione dei problemi: errori di build di sharp (npm)">
  Se `sharp` fallisce a causa di una libvips installata globalmente:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Dal sorgente

Per i contributori o per chiunque voglia eseguire da un checkout locale:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

Oppure salta il link e usa `pnpm openclaw ...` dall'interno del repository. Vedi [Configurazione](/start/setup) per i flussi di lavoro di sviluppo completi.

### Installa da GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Container e package manager

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    Deployment containerizzati o headless.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Alternativa container rootless a Docker.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Installazione dichiarativa tramite flake Nix.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Provisioning automatizzato di fleet.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Uso solo CLI tramite il runtime Bun.
  </Card>
</CardGroup>

## Verifica l'installazione

```bash
openclaw --version      # conferma che la CLI sia disponibile
openclaw doctor         # controlla eventuali problemi di configurazione
openclaw gateway status # verifica che il Gateway sia in esecuzione
```

Se vuoi un avvio gestito dopo l'installazione:

- macOS: LaunchAgent tramite `openclaw onboard --install-daemon` o `openclaw gateway install`
- Linux/WSL2: servizio utente systemd tramite gli stessi comandi
- Windows nativo: prima Scheduled Task, con fallback a un elemento di accesso nella cartella Startup per utente se la creazione dell'attività viene negata

## Hosting e deployment

Esegui il deployment di OpenClaw su un server cloud o VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">Qualsiasi VPS Linux</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">Passaggi Docker condivisi</Card>
  <Card title="Kubernetes" href="/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/install/azure">Azure</Card>
  <Card title="Railway" href="/install/railway">Railway</Card>
  <Card title="Render" href="/install/render">Render</Card>
  <Card title="Northflank" href="/install/northflank">Northflank</Card>
</CardGroup>

## Aggiornare, migrare o disinstallare

<CardGroup cols={3}>
  <Card title="Aggiornamento" href="/install/updating" icon="refresh-cw">
    Mantieni OpenClaw aggiornato.
  </Card>
  <Card title="Migrazione" href="/install/migrating" icon="arrow-right">
    Spostati su una nuova macchina.
  </Card>
  <Card title="Disinstallazione" href="/install/uninstall" icon="trash-2">
    Rimuovi completamente OpenClaw.
  </Card>
</CardGroup>

## Risoluzione dei problemi: `openclaw` non trovato

Se l'installazione è riuscita ma `openclaw` non viene trovato nel terminale:

```bash
node -v           # Node installato?
npm prefix -g     # Dove si trovano i pacchetti globali?
echo "$PATH"      # La directory bin globale è in PATH?
```

Se `$(npm prefix -g)/bin` non è nel tuo `$PATH`, aggiungilo al file di avvio della shell (`~/.zshrc` o `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Poi apri un nuovo terminale. Vedi [Configurazione di Node](/install/node) per maggiori dettagli.
