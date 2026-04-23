---
read_when:
    - Vuoi eseguire il Gateway su un server Linux o VPS cloud
    - Ti serve una rapida mappa delle guide di hosting
    - Vuoi un'ottimizzazione generica di OpenClaw per server Linux
sidebarTitle: Linux Server
summary: Eseguire OpenClaw su un server Linux o VPS cloud — selezione del provider, architettura e ottimizzazione
title: Server Linux
x-i18n:
    generated_at: "2026-04-23T08:38:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# Server Linux

Esegui il Gateway OpenClaw su qualsiasi server Linux o VPS cloud. Questa pagina ti aiuta a
scegliere un provider, spiega come funzionano i deployment cloud e copre l'ottimizzazione Linux generica valida ovunque.

## Scegli un provider

<CardGroup cols={2}>
  <Card title="Railway" href="/it/install/railway">One-click, configurazione da browser</Card>
  <Card title="Northflank" href="/it/install/northflank">One-click, configurazione da browser</Card>
  <Card title="DigitalOcean" href="/it/install/digitalocean">VPS a pagamento semplice</Card>
  <Card title="Oracle Cloud" href="/it/install/oracle">Tier ARM Always Free</Card>
  <Card title="Fly.io" href="/it/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/it/install/hetzner">Docker su VPS Hetzner</Card>
  <Card title="Hostinger" href="/it/install/hostinger">VPS con configurazione one-click</Card>
  <Card title="GCP" href="/it/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/it/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/it/install/exe-dev">VM con proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/it/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

Anche **AWS (EC2 / Lightsail / free tier)** funziona bene.
È disponibile una video guida della community su
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(risorsa della community -- potrebbe non essere più disponibile).

## Come funzionano le configurazioni cloud

- Il **Gateway viene eseguito sul VPS** e possiede stato + workspace.
- Ti connetti dal tuo laptop o telefono tramite la **Control UI** o **Tailscale/SSH**.
- Tratta il VPS come fonte di verità ed esegui regolarmente il **backup** di stato + workspace.
- Impostazione sicura predefinita: mantieni il Gateway su loopback e accedivi tramite tunnel SSH o Tailscale Serve.
  Se esegui il bind a `lan` o `tailnet`, richiedi `gateway.auth.token` o `gateway.auth.password`.

Pagine correlate: [Accesso remoto al Gateway](/it/gateway/remote), [Hub delle piattaforme](/it/platforms).

## Agente aziendale condiviso su un VPS

Eseguire un singolo agente per un team è una configurazione valida quando ogni utente si trova nello stesso confine di fiducia e l'agente è solo aziendale.

- Mantienilo su un runtime dedicato (VPS/VM/container + utente/account OS dedicati).
- Non far accedere quel runtime a account Apple/Google personali o a profili personali di browser/password manager.
- Se gli utenti sono avversari tra loro, separa per gateway/host/utente OS.

Dettagli del modello di sicurezza: [Sicurezza](/it/gateway/security).

## Usare i Node con un VPS

Puoi mantenere il Gateway nel cloud e abbinare **Node** sui tuoi dispositivi locali
(Mac/iOS/Android/headless). I Node forniscono schermo/camera/canvas locali e capacità `system.run`
mentre il Gateway resta nel cloud.

Documentazione: [Node](/it/nodes), [CLI dei Node](/it/cli/nodes).

## Ottimizzazione dell'avvio per VM piccole e host ARM

Se i comandi CLI sembrano lenti su VM a bassa potenza (o host ARM), abilita la cache di compilazione dei moduli di Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` migliora i tempi di avvio dei comandi ripetuti.
- `OPENCLAW_NO_RESPAWN=1` evita overhead di avvio aggiuntivo da un percorso di auto-respawn.
- La prima esecuzione di un comando riscalda la cache; le esecuzioni successive sono più rapide.
- Per dettagli specifici su Raspberry Pi, vedi [Raspberry Pi](/it/install/raspberry-pi).

### Checklist di ottimizzazione systemd (facoltativa)

Per host VM che usano `systemd`, considera:

- Aggiungi env del servizio per un percorso di avvio stabile:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Mantieni esplicito il comportamento di riavvio:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferisci dischi supportati da SSD per i percorsi state/cache, per ridurre le penalità di cold-start da I/O casuale.

Per il percorso standard `openclaw onboard --install-daemon`, modifica l'unità utente:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Se invece hai deliberatamente installato un'unità di sistema, modifica
`openclaw-gateway.service` tramite `sudo systemctl edit openclaw-gateway.service`.

Come le policy `Restart=` aiutano il recupero automatico:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Per il comportamento Linux OOM, la selezione del processo figlio come vittima e la diagnostica di `exit 137`,
vedi [Linux memory pressure and OOM kills](/it/platforms/linux#memory-pressure-and-oom-kills).
