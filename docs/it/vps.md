---
read_when:
    - Vuoi eseguire il Gateway su un server Linux o su un VPS cloud
    - Ti serve una mappa rapida delle guide all'hosting
    - Vuoi un'ottimizzazione generica del server Linux per OpenClaw
sidebarTitle: Linux Server
summary: Esegui OpenClaw su un server Linux o una VPS cloud — selettore di provider, architettura e ottimizzazione
title: Server Linux
x-i18n:
    generated_at: "2026-04-30T09:19:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

Esegui il Gateway OpenClaw su qualsiasi server Linux o VPS cloud. Questa pagina ti aiuta a
scegliere un provider, spiega come funzionano le distribuzioni cloud e copre la configurazione
generica di Linux applicabile ovunque.

## Scegli un provider

<CardGroup cols={2}>
  <Card title="Railway" href="/it/install/railway">Configurazione nel browser con un clic</Card>
  <Card title="Northflank" href="/it/install/northflank">Configurazione nel browser con un clic</Card>
  <Card title="DigitalOcean" href="/it/install/digitalocean">VPS semplice a pagamento</Card>
  <Card title="Oracle Cloud" href="/it/install/oracle">Livello ARM sempre gratuito</Card>
  <Card title="Fly.io" href="/it/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/it/install/hetzner">Docker su VPS Hetzner</Card>
  <Card title="Hostinger" href="/it/install/hostinger">VPS con configurazione con un clic</Card>
  <Card title="GCP" href="/it/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/it/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/it/install/exe-dev">VM con proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/it/install/raspberry-pi">Self-hosting ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / livello gratuito)** funziona bene anche.
Una guida video della community è disponibile all'indirizzo
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(risorsa della community -- potrebbe diventare non disponibile).

## Come funzionano le configurazioni cloud

- Il **Gateway viene eseguito sul VPS** e possiede stato + workspace.
- Ti connetti dal laptop o dal telefono tramite la **UI di controllo** o **Tailscale/SSH**.
- Tratta il VPS come fonte di verità ed esegui regolarmente il **backup** dello stato + workspace.
- Impostazione predefinita sicura: mantieni il Gateway su loopback e accedivi tramite tunnel SSH o Tailscale Serve.
  Se esegui il bind a `lan` o `tailnet`, richiedi `gateway.auth.token` o `gateway.auth.password`.

Pagine correlate: [Accesso remoto al Gateway](/it/gateway/remote), [Hub delle piattaforme](/it/platforms).

## Proteggi prima l'accesso di amministrazione

Prima di installare OpenClaw su un VPS pubblico, decidi come vuoi amministrare
la macchina stessa.

- Se vuoi un accesso di amministrazione solo tramite tailnet, installa prima Tailscale, aggiungi il VPS
  alla tua tailnet, verifica una seconda sessione SSH tramite l'IP Tailscale o
  il nome MagicDNS, quindi limita l'SSH pubblico.
- Se non usi Tailscale, applica l'hardening equivalente per il tuo percorso SSH
  prima di esporre altri servizi.
- Questo è separato dall'accesso al Gateway. Puoi comunque mantenere OpenClaw associato al
  loopback e usare un tunnel SSH o Tailscale Serve per la dashboard.

Le opzioni del Gateway specifiche per Tailscale si trovano in [Tailscale](/it/gateway/tailscale).

## Agente aziendale condiviso su un VPS

Eseguire un singolo agente per un team è una configurazione valida quando ogni utente rientra nello stesso perimetro di fiducia e l'agente è solo per uso aziendale.

- Mantienilo su un runtime dedicato (VPS/VM/container + utente/account del sistema operativo dedicati).
- Non accedere da quel runtime ad account Apple/Google personali o a profili personali del browser/gestore password.
- Se gli utenti sono avversari tra loro, separali per gateway/host/utente del sistema operativo.

Dettagli sul modello di sicurezza: [Sicurezza](/it/gateway/security).

## Uso dei nodi con un VPS

Puoi mantenere il Gateway nel cloud e associare **nodi** sui tuoi dispositivi locali
(Mac/iOS/Android/headless). I nodi forniscono funzionalità locali di schermo/fotocamera/canvas e `system.run`
mentre il Gateway resta nel cloud.

Documentazione: [Nodi](/it/nodes), [CLI dei nodi](/it/cli/nodes).

## Ottimizzazione dell'avvio per VM piccole e host ARM

Se i comandi CLI risultano lenti su VM a bassa potenza (o host ARM), abilita la cache di compilazione dei moduli di Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` migliora i tempi di avvio dei comandi ripetuti.
- `OPENCLAW_NO_RESPAWN=1` evita l'overhead di avvio aggiuntivo dovuto a un percorso di self-respawn.
- La prima esecuzione del comando riscalda la cache; le esecuzioni successive sono più rapide.
- Per le specificità di Raspberry Pi, consulta [Raspberry Pi](/it/install/raspberry-pi).

### Checklist di ottimizzazione di systemd (facoltativa)

Per host VM che usano `systemd`, considera quanto segue:

- Aggiungi variabili di ambiente del servizio per un percorso di avvio stabile:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Mantieni esplicito il comportamento di riavvio:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferisci dischi basati su SSD per i percorsi di stato/cache per ridurre le penalizzazioni di avvio a freddo dovute a I/O casuale.

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

Se hai installato deliberatamente un'unità di sistema, modifica invece
`openclaw-gateway.service` tramite `sudo systemctl edit openclaw-gateway.service`.

Come le policy `Restart=` aiutano il ripristino automatizzato:
[systemd può automatizzare il ripristino dei servizi](https://www.redhat.com/en/blog/systemd-automate-recovery).

Per il comportamento OOM di Linux, la selezione del processo figlio vittima e la diagnostica di `exit 137`,
consulta [Pressione di memoria Linux e terminazioni OOM](/it/platforms/linux#memory-pressure-and-oom-kills).

## Correlati

- [Panoramica dell'installazione](/it/install)
- [DigitalOcean](/it/install/digitalocean)
- [Fly.io](/it/install/fly)
- [Hetzner](/it/install/hetzner)
