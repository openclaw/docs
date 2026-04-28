---
read_when:
    - Vuoi eseguire il Gateway su un server Linux o su un VPS cloud
    - Ti serve una rapida panoramica delle guide di hosting
    - Vuoi indicazioni generali di ottimizzazione per OpenClaw su server Linux
sidebarTitle: Linux Server
summary: Esegui OpenClaw su un server Linux o VPS cloud — selettore provider, architettura e ottimizzazione
title: Server Linux
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T09:09:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

Esegui il Gateway OpenClaw su qualsiasi server Linux o VPS cloud. Questa pagina ti aiuta
a scegliere un provider, spiega come funzionano i deployment cloud e copre l'ottimizzazione
generica Linux applicabile ovunque.

## Scegli un provider

<CardGroup cols={2}>
  <Card title="Railway" href="/it/install/railway">Configurazione one-click dal browser</Card>
  <Card title="Northflank" href="/it/install/northflank">Configurazione one-click dal browser</Card>
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
- Ti connetti dal laptop o dal telefono tramite la **Control UI** o **Tailscale/SSH**.
- Tratta il VPS come fonte di verità ed esegui regolarmente il **backup** di stato + workspace.
- Impostazione predefinita sicura: mantieni il Gateway su loopback e accedivi tramite tunnel SSH o Tailscale Serve.
  Se lo esponi su `lan` o `tailnet`, richiedi `gateway.auth.token` o `gateway.auth.password`.

Pagine correlate: [Gateway remote access](/it/gateway/remote), [Platforms hub](/it/platforms).

## Agente aziendale condiviso su un VPS

Eseguire un singolo agente per un team è una configurazione valida quando ogni utente si trova nello stesso confine di fiducia e l'agente è solo per uso aziendale.

- Mantienilo su un runtime dedicato (VPS/VM/container + utente/account OS dedicati).
- Non collegare quel runtime ad account Apple/Google personali o a profili browser/password manager personali.
- Se gli utenti sono avversariali tra loro, separa per gateway/host/utente OS.

Dettagli del modello di sicurezza: [Security](/it/gateway/security).

## Uso dei Node con un VPS

Puoi mantenere il Gateway nel cloud e associare **Node** sui tuoi dispositivi locali
(Mac/iOS/Android/headless). I Node forniscono capability locali di schermo/fotocamera/canvas e `system.run`
mentre il Gateway resta nel cloud.

Documentazione: [Nodes](/it/nodes), [Nodes CLI](/it/cli/nodes).

## Ottimizzazione dell'avvio per piccole VM e host ARM

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
- `OPENCLAW_NO_RESPAWN=1` evita overhead aggiuntivo all'avvio dovuto a un percorso di self-respawn.
- La prima esecuzione di un comando riscalda la cache; le esecuzioni successive sono più veloci.
- Per dettagli specifici su Raspberry Pi, vedi [Raspberry Pi](/it/install/raspberry-pi).

### Checklist di ottimizzazione systemd (facoltativa)

Per host VM che usano `systemd`, considera:

- Aggiungi env di servizio per un percorso di avvio stabile:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Mantieni esplicito il comportamento di riavvio:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferisci dischi basati su SSD per i percorsi di stato/cache per ridurre le penalità di cold-start dovute a I/O casuale.

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

Se hai installato deliberatamente invece un'unità di sistema, modifica
`openclaw-gateway.service` tramite `sudo systemctl edit openclaw-gateway.service`.

Come le policy `Restart=` aiutano il recupero automatico:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Per il comportamento Linux OOM, la selezione delle vittime tra i processi figli e la diagnostica di `exit 137`,
vedi [Linux memory pressure and OOM kills](/it/platforms/linux#memory-pressure-and-oom-kills).

## Correlati

- [Install overview](/it/install)
- [DigitalOcean](/it/install/digitalocean)
- [Fly.io](/it/install/fly)
- [Hetzner](/it/install/hetzner)
