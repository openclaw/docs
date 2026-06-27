---
read_when:
    - Ti serve un metodo di installazione diverso dal quickstart di Getting Started
    - Vuoi distribuire su una piattaforma cloud
    - È necessario aggiornare, migrare o disinstallare
summary: Installa OpenClaw - script di installazione, npm/pnpm/bun, da sorgente, Docker e altro
title: Installazione
x-i18n:
    generated_at: "2026-06-27T17:40:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## Requisiti di sistema

- **Node 24** (consigliato) o Node 22.19+ - lo script di installazione lo gestisce automaticamente
- **macOS, Linux o Windows** - gli utenti Windows possono iniziare con l'app nativa Windows Hub, il programma di installazione CLI PowerShell o un Gateway WSL2. Vedi [Windows](/it/platforms/windows).
- `pnpm` è necessario solo se compili dal sorgente

## Consigliato: script di installazione

Il modo più rapido per installare. Rileva il tuo sistema operativo, installa Node se necessario, installa OpenClaw e avvia l'onboarding.

<Note>
Gli utenti desktop Windows possono anche installare l'app companion nativa [Windows Hub](/it/platforms/windows#recommended-windows-hub), che include configurazione, stato nella tray, chat, modalità node e modalità MCP locale.
</Note>

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

Per tutti i flag e le opzioni di CI/automazione, vedi [Interni del programma di installazione](/it/install/installer).

## Metodi di installazione alternativi

### Programma di installazione con prefisso locale (`install-cli.sh`)

Usalo quando vuoi mantenere OpenClaw e Node sotto un prefisso locale come
`~/.openclaw`, senza dipendere da un'installazione di Node a livello di sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Supporta installazioni npm per impostazione predefinita, oltre a installazioni da checkout git nello stesso
flusso con prefisso. Riferimento completo: [Interni del programma di installazione](/it/install/installer#install-clish).

Già installato? Passa tra installazioni da pacchetto e da git con
`openclaw update --channel dev` e `openclaw update --channel stable`. Vedi
[Aggiornamento](/it/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm o bun

Se gestisci già Node autonomamente:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Il programma di installazione ospitato disattiva i filtri di freschezza npm come `min-release-age`
    per l'installazione del pacchetto OpenClaw. Se installi manualmente con npm, si applica comunque
    la tua policy npm.
    </Note>

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
    Bun è supportato per il percorso di installazione della CLI globale. Per il runtime Gateway, Node rimane il runtime daemon consigliato.
    </Note>

  </Tab>
</Tabs>

### Dal sorgente

Per i contributori o chiunque voglia eseguire da un checkout locale:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Oppure salta il link e usa `pnpm openclaw ...` dall'interno del repo. Vedi [Configurazione](/it/start/setup) per i flussi di sviluppo completi.

### Installa dal checkout main di GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Container e gestori di pacchetti

<CardGroup cols={2}>
  <Card title="Docker" href="/it/install/docker" icon="container">
    Distribuzioni containerizzate o headless.
  </Card>
  <Card title="Podman" href="/it/install/podman" icon="container">
    Alternativa a Docker con container rootless.
  </Card>
  <Card title="Nix" href="/it/install/nix" icon="snowflake">
    Installazione dichiarativa tramite flake Nix.
  </Card>
  <Card title="Ansible" href="/it/install/ansible" icon="server">
    Provisioning automatizzato di flotte.
  </Card>
  <Card title="Bun" href="/it/install/bun" icon="zap">
    Uso solo CLI tramite il runtime Bun.
  </Card>
</CardGroup>

## Verifica l'installazione

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Se vuoi l'avvio gestito dopo l'installazione:

- macOS: LaunchAgent tramite `openclaw onboard --install-daemon` o `openclaw gateway install`
- Linux/WSL2: servizio utente systemd tramite gli stessi comandi
- Windows nativo: prima Attività pianificata, con fallback a un elemento di login nella cartella Esecuzione automatica per utente se la creazione dell'attività viene negata

## Hosting e distribuzione

Distribuisci OpenClaw su un server cloud o VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/it/vps">
    Qualsiasi VPS Linux.
  </Card>
  <Card title="Docker VM" href="/it/install/docker-vm-runtime">
    Passaggi Docker condivisi.
  </Card>
  <Card title="Kubernetes" href="/it/install/kubernetes">
    Distribuzione K8s.
  </Card>
  <Card title="Fly.io" href="/it/install/fly">
    Distribuisci su Fly.io.
  </Card>
  <Card title="Hetzner" href="/it/install/hetzner">
    Distribuzione Hetzner.
  </Card>
  <Card title="GCP" href="/it/install/gcp">
    Distribuzione Google Cloud.
  </Card>
  <Card title="Azure" href="/it/install/azure">
    Distribuzione Azure.
  </Card>
  <Card title="Railway" href="/it/install/railway">
    Distribuzione Railway.
  </Card>
  <Card title="Render" href="/it/install/render">
    Distribuzione Render.
  </Card>
  <Card title="Northflank" href="/it/install/northflank">
    Distribuzione Northflank.
  </Card>
</CardGroup>

## Aggiorna, migra o disinstalla

<CardGroup cols={3}>
  <Card title="Updating" href="/it/install/updating" icon="refresh-cw">
    Mantieni OpenClaw aggiornato.
  </Card>
  <Card title="Migrating" href="/it/install/migrating" icon="arrow-right">
    Sposta su una nuova macchina.
  </Card>
  <Card title="Uninstall" href="/it/install/uninstall" icon="trash-2">
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

Poi apri un nuovo terminale. Vedi [Configurazione di Node](/it/install/node) per maggiori dettagli.
