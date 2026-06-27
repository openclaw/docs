---
read_when:
    - Vuoi eseguire il Gateway su un server Linux o un VPS cloud
    - Serve una rapida panoramica delle guide all'hosting
    - Vuoi un'ottimizzazione generica del server Linux per OpenClaw
sidebarTitle: Linux Server
summary: Esegui OpenClaw su un server Linux o un VPS cloud — selezione del provider, architettura e ottimizzazione
title: Server Linux
x-i18n:
    generated_at: "2026-06-27T18:25:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

Esegui OpenClaw Gateway su qualsiasi server Linux o VPS cloud. Questa pagina ti aiuta a
scegliere un provider, spiega come funzionano le distribuzioni cloud e tratta l'ottimizzazione
generica di Linux applicabile ovunque.

## Scegli un provider

<CardGroup cols={2}>
  <Card title="Railway" href="/it/install/railway">Configurazione dal browser con un clic</Card>
  <Card title="Northflank" href="/it/install/northflank">Configurazione dal browser con un clic</Card>
  <Card title="DigitalOcean" href="/it/install/digitalocean">VPS a pagamento semplice</Card>
  <Card title="Oracle Cloud" href="/it/install/oracle">Livello ARM Always Free</Card>
  <Card title="Fly.io" href="/it/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/it/install/hetzner">Docker su VPS Hetzner</Card>
  <Card title="Hostinger" href="/it/install/hostinger">VPS con configurazione con un clic</Card>
  <Card title="GCP" href="/it/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/it/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/it/install/exe-dev">VM con proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/it/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

Anche **AWS (EC2 / Lightsail / livello gratuito)** funziona bene.
Una guida video dettagliata della community è disponibile su
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(risorsa della community -- potrebbe diventare non disponibile).

## Come funzionano le configurazioni cloud

- Il **Gateway viene eseguito sulla VPS** e gestisce stato + workspace.
- Ti connetti dal laptop o dal telefono tramite la **Control UI** o **Tailscale/SSH**.
- Considera la VPS come fonte attendibile e **fai il backup** regolarmente di stato + workspace.
- Impostazione predefinita sicura: mantieni il Gateway su loopback e accedivi tramite tunnel SSH o Tailscale Serve.
  Se esegui il bind a `lan` o `tailnet`, richiedi `gateway.auth.token` o `gateway.auth.password`.

Pagine correlate: [accesso remoto al Gateway](/it/gateway/remote), [hub delle piattaforme](/it/platforms).

## Rafforza prima l'accesso amministrativo

Prima di installare OpenClaw su una VPS pubblica, decidi come vuoi amministrare
la macchina stessa.

- Se vuoi un accesso amministrativo solo tramite Tailnet, installa prima Tailscale, collega la VPS
  alla tua tailnet, verifica una seconda sessione SSH sull'IP Tailscale o sul nome
  MagicDNS, quindi limita l'SSH pubblico.
- Se non usi Tailscale, applica un rafforzamento equivalente al tuo percorso SSH
  prima di esporre altri servizi.
- Questo è separato dall'accesso al Gateway. Puoi comunque mantenere OpenClaw in bind a
  loopback e usare un tunnel SSH o Tailscale Serve per la dashboard.

Le opzioni del Gateway specifiche per Tailscale sono in [Tailscale](/it/gateway/tailscale).

## Agent aziendale condiviso su una VPS

Eseguire un singolo agent per un team è una configurazione valida quando ogni utente rientra nello stesso perimetro di fiducia e l'agent è solo aziendale.

- Mantienilo su un runtime dedicato (VPS/VM/container + utente/account OS dedicati).
- Non accedere da quel runtime ad account personali Apple/Google o a profili personali di browser/password manager.
- Se gli utenti sono antagonisti tra loro, separali per gateway/host/utente OS.

Dettagli sul modello di sicurezza: [Sicurezza](/it/gateway/security).

## Usare i node con una VPS

Puoi mantenere il Gateway nel cloud e associarvi **node** sui tuoi dispositivi locali
(Mac/iOS/Android/headless). I node forniscono schermo/camera/canvas locali e capacità `system.run`
mentre il Gateway rimane nel cloud.

Documentazione: [Node](/it/nodes), [CLI dei node](/it/cli/nodes).

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
- `OPENCLAW_NO_RESPAWN=1` mantiene i riavvii di routine del Gateway nello stesso processo, evitando passaggi di consegna a processi aggiuntivi e mantenendo semplice il tracciamento del PID su host piccoli.
- La prima esecuzione di un comando riscalda la cache; le esecuzioni successive sono più veloci.
- Per i dettagli specifici di Raspberry Pi, vedi [Raspberry Pi](/it/install/raspberry-pi).

### Checklist di ottimizzazione systemd (opzionale)

Per host VM che usano `systemd`, considera di:

- Aggiungere variabili env del servizio per un percorso di avvio stabile:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Mantenere esplicito il comportamento di riavvio:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferire dischi basati su SSD per i percorsi di stato/cache, così da ridurre le penalità di avvio a freddo dovute a I/O casuale.

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

In che modo le policy `Restart=` aiutano il ripristino automatizzato:
[systemd può automatizzare il ripristino dei servizi](https://www.redhat.com/en/blog/systemd-automate-recovery).

Per il comportamento OOM di Linux, la selezione del processo figlio vittima e la diagnostica di `exit 137`,
vedi [pressione di memoria Linux e terminazioni OOM](/it/platforms/linux#memory-pressure-and-oom-kills).

## Correlati

- [Panoramica dell'installazione](/it/install)
- [DigitalOcean](/it/install/digitalocean)
- [Fly.io](/it/install/fly)
- [Hetzner](/it/install/hetzner)
