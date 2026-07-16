---
read_when:
    - Serve un metodo di installazione diverso dalla guida rapida introduttiva
    - Si desidera eseguire il deployment su una piattaforma cloud
    - È necessario aggiornare, migrare o disinstallare
summary: 'Installare OpenClaw: script di installazione, npm/pnpm/bun, dal codice sorgente, Docker e altro ancora'
title: Installa
x-i18n:
    generated_at: "2026-07-16T14:32:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## Requisiti di sistema

- **Node 22.22.3+, 24.15+ o 25.9+** - Node 24 è la versione di destinazione predefinita; lo script di installazione la gestisce automaticamente.
- **macOS, Linux o Windows** - Gli utenti Windows possono iniziare con l'app nativa Windows Hub, il programma di installazione della CLI per PowerShell o un Gateway WSL2. Consultare [Windows](/it/platforms/windows).
- `pnpm` è necessario solo per la compilazione dal codice sorgente.

## Metodo consigliato: script di installazione

È il modo più rapido per eseguire l'installazione. Rileva il sistema operativo, installa Node se necessario, installa OpenClaw e avvia la configurazione iniziale.

<Note>
Gli utenti desktop Windows possono anche installare l'app complementare nativa [Windows Hub](/it/platforms/windows#recommended-windows-hub), che include configurazione, stato nell'area di notifica, chat, modalità Node e modalità MCP locale.
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

Per installare senza eseguire la configurazione iniziale:

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

Per tutti i flag e le opzioni di CI/automazione, consultare [Dettagli interni del programma di installazione](/it/install/installer).

## Metodi di installazione alternativi

### Programma di installazione con prefisso locale (`install-cli.sh`)

Utilizzare questo metodo per mantenere OpenClaw e Node in un prefisso locale come
`~/.openclaw`, senza dipendere da un'installazione di Node a livello di sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Supporta per impostazione predefinita le installazioni npm, oltre alle installazioni da checkout git nello stesso
flusso basato sul prefisso. Riferimento completo: [Dettagli interni del programma di installazione](/it/install/installer#install-clish).

OpenClaw è già installato? È possibile passare dalle installazioni tramite pacchetto a quelle tramite git e viceversa con
`openclaw update --channel dev` e `openclaw update --channel stable`. Consultare
[Aggiornamento](/it/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm o bun

Se Node è già gestito autonomamente:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Il programma di installazione ospitato elimina i filtri di aggiornamento di npm come `min-release-age`
    per l'installazione del pacchetto OpenClaw. Se l'installazione viene eseguita manualmente con npm, continua ad applicarsi
    la propria politica npm.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm richiede un'approvazione esplicita per i pacchetti con script di compilazione. Eseguire `pnpm approve-builds -g` dopo la prima installazione.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun può installare il pacchetto globale, ma l'eseguibile `openclaw` risultante richiede un runtime Node supportato perché lo stato di OpenClaw utilizza `node:sqlite`.
    </Note>

  </Tab>
</Tabs>

### Dal codice sorgente

Per i collaboratori o per chiunque desideri eseguire OpenClaw da un checkout locale:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

In alternativa, è possibile ignorare il collegamento e utilizzare `pnpm openclaw ...` dall'interno del repository. Consultare [Configurazione](/it/start/setup) per i flussi di sviluppo completi.

### Installazione dal checkout main di GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Container e gestori di pacchetti

<CardGroup cols={2}>
  <Card title="Docker" href="/it/install/docker" icon="container">
    Distribuzioni containerizzate o senza interfaccia grafica.
  </Card>
  <Card title="Podman" href="/it/install/podman" icon="container">
    Alternativa a Docker per container senza privilegi di root.
  </Card>
  <Card title="Nix" href="/it/install/nix" icon="snowflake">
    Installazione dichiarativa tramite flake Nix.
  </Card>
  <Card title="Ansible" href="/it/install/ansible" icon="server">
    Provisioning automatizzato di un parco macchine.
  </Card>
  <Card title="Bun" href="/it/install/bun" icon="zap">
    Programma facoltativo per installare le dipendenze ed eseguire gli script dei pacchetti.
  </Card>
</CardGroup>

## Verifica dell'installazione

```bash
openclaw --version      # conferma che la CLI sia disponibile
openclaw doctor         # verifica la presenza di problemi di configurazione
openclaw gateway status # verifica che il Gateway sia in esecuzione
```

Per configurare l'avvio gestito dopo l'installazione:

- macOS: LaunchAgent tramite `openclaw onboard --install-daemon` o `openclaw gateway install`
- Linux/WSL2: servizio utente systemd tramite gli stessi comandi
- Windows nativo: prima un'attività pianificata, con un elemento di accesso per utente nella cartella Esecuzione automatica come soluzione di riserva se la creazione dell'attività viene negata

## Hosting e distribuzione

È possibile distribuire OpenClaw su un server cloud o VPS. Consultare [Server Linux](/it/vps) per il selettore
completo dei fornitori (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi e altri) oppure eseguire una distribuzione dichiarativa su
[Render](/it/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/it/vps">
    Scegliere un fornitore.
  </Card>
  <Card title="VM Docker" href="/it/install/docker-vm-runtime">
    Passaggi condivisi per Docker.
  </Card>
  <Card title="Kubernetes" href="/it/install/kubernetes">
    Distribuzione K8s.
  </Card>
</CardGroup>

## Aggiornamento, migrazione o disinstallazione

<CardGroup cols={3}>
  <Card title="Aggiornamento" href="/it/install/updating" icon="refresh-cw">
    Mantenere OpenClaw aggiornato.
  </Card>
  <Card title="Migrazione" href="/it/install/migrating" icon="arrow-right">
    Eseguire il passaggio a un nuovo computer.
  </Card>
  <Card title="Disinstallazione" href="/it/install/uninstall" icon="trash-2">
    Rimuovere completamente OpenClaw.
  </Card>
</CardGroup>

## Risoluzione dei problemi: `openclaw` non trovato

Si tratta quasi sempre di un problema relativo a PATH: la directory globale dei file binari di npm non è inclusa in `PATH` della shell. Consultare [Risoluzione dei problemi di Node.js](/it/install/node#troubleshooting) per la soluzione completa, incluso il percorso di Windows.

```bash
node -v           # Node è installato?
npm prefix -g     # Dove si trovano i pacchetti globali?
echo "$PATH"      # La directory globale dei file binari è inclusa in PATH?
```
