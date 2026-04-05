---
read_when:
    - Vuoi eseguire il Gateway su un server Linux o su un VPS cloud
    - Hai bisogno di una rapida panoramica delle guide di hosting
    - Vuoi indicazioni generiche di ottimizzazione per OpenClaw su server Linux
sidebarTitle: Linux Server
summary: Esegui OpenClaw su un server Linux o su un VPS cloud — selezione del provider, architettura e ottimizzazione
title: Server Linux
x-i18n:
    generated_at: "2026-04-05T14:08:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f2f26bbc116841a29055850ed5f491231554b90539bcbf91a6b519875d494fb
    source_path: vps.md
    workflow: 15
---

# Server Linux

Esegui il Gateway OpenClaw su qualsiasi server Linux o VPS cloud. Questa pagina ti aiuta a
scegliere un provider, spiega come funzionano i deployment cloud e copre le ottimizzazioni Linux
generiche che si applicano ovunque.

## Scegli un provider

<CardGroup cols={2}>
  <Card title="Railway" href="/it/install/railway">Configurazione nel browser con un clic</Card>
  <Card title="Northflank" href="/it/install/northflank">Configurazione nel browser con un clic</Card>
  <Card title="DigitalOcean" href="/it/install/digitalocean">VPS a pagamento semplice</Card>
  <Card title="Oracle Cloud" href="/it/install/oracle">Livello ARM Always Free</Card>
  <Card title="Fly.io" href="/it/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/it/install/hetzner">Docker su VPS Hetzner</Card>
  <Card title="GCP" href="/it/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/it/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/it/install/exe-dev">VM con proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/it/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

Anche **AWS (EC2 / Lightsail / free tier)** funziona bene.
È disponibile una guida video della comunità su
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(risorsa della comunità -- potrebbe non essere più disponibile).

## Come funzionano le configurazioni cloud

- Il **Gateway viene eseguito sul VPS** e gestisce stato + workspace.
- Ti connetti dal tuo laptop o telefono tramite la **Control UI** o **Tailscale/SSH**.
- Considera il VPS come fonte di verità ed esegui **backup** regolari di stato + workspace.
- Impostazione predefinita sicura: mantieni il Gateway su loopback e accedivi tramite tunnel SSH o Tailscale Serve.
  Se fai bind a `lan` o `tailnet`, richiedi `gateway.auth.token` o `gateway.auth.password`.

Pagine correlate: [Accesso remoto al Gateway](/it/gateway/remote), [Hub delle piattaforme](/it/platforms).

## Agente aziendale condiviso su un VPS

Eseguire un singolo agente per un team è una configurazione valida quando ogni utente si trova nello stesso confine di fiducia e l'agente è solo per uso aziendale.

- Mantienilo su un runtime dedicato (VPS/VM/container + utente/account OS dedicati).
- Non autenticare quel runtime con account Apple/Google personali o con profili personali di browser/password manager.
- Se gli utenti sono avversari tra loro, separa per gateway/host/utente OS.

Dettagli del modello di sicurezza: [Sicurezza](/it/gateway/security).

## Uso dei nodi con un VPS

Puoi mantenere il Gateway nel cloud e associare **nodi** sui tuoi dispositivi locali
(Mac/iOS/Android/headless). I nodi forniscono funzionalità locali di schermo/fotocamera/canvas e `system.run`
mentre il Gateway resta nel cloud.

Documentazione: [Nodi](/it/nodes), [CLI dei nodi](/cli/nodes).

## Ottimizzazione dell'avvio per piccole VM e host ARM

Se i comandi CLI sembrano lenti su VM poco potenti (o host ARM), abilita la cache di compilazione dei moduli di Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` migliora i tempi di avvio dei comandi ripetuti.
- `OPENCLAW_NO_RESPAWN=1` evita overhead aggiuntivo di avvio dovuto a un percorso di auto-respawn.
- La prima esecuzione di un comando riscalda la cache; le esecuzioni successive sono più rapide.
- Per dettagli specifici su Raspberry Pi, vedi [Raspberry Pi](/it/install/raspberry-pi).

### Checklist di ottimizzazione systemd (facoltativa)

Per host VM che usano `systemd`, considera quanto segue:

- Aggiungi variabili di ambiente del servizio per un percorso di avvio stabile:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Mantieni esplicito il comportamento di riavvio:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferisci dischi con SSD per i percorsi di stato/cache per ridurre le penalità di cold start dovute a I/O casuale.

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

Se invece hai installato deliberatamente un'unità di sistema, modifica
`openclaw-gateway.service` tramite `sudo systemctl edit openclaw-gateway.service`.

Come aiutano le policy `Restart=` nel recupero automatico:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).
