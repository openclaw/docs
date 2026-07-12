---
read_when:
    - Vuoi eseguire il Gateway su un server Linux o su un VPS cloud
    - Ti serve una rapida panoramica delle guide all’hosting
    - Vuoi ottimizzare in modo generico un server Linux per OpenClaw
sidebarTitle: Linux Server
summary: Esegui OpenClaw su un server Linux o un VPS cloud — selezione del provider, architettura e ottimizzazione
title: Server Linux
x-i18n:
    generated_at: "2026-07-12T07:39:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Esegui il Gateway OpenClaw su qualsiasi server Linux o VPS cloud. Questa pagina ti aiuta a
scegliere un provider, spiega il funzionamento delle distribuzioni nel cloud e tratta le
ottimizzazioni generiche per Linux applicabili ovunque.

## Scegli un provider

<CardGroup cols={2}>
  <Card title="Azure" href="/it/install/azure">VM Linux</Card>
  <Card title="DigitalOcean" href="/it/install/digitalocean">VPS a pagamento semplice</Card>
  <Card title="exe.dev" href="/it/install/exe-dev">VM con proxy HTTPS</Card>
  <Card title="Fly.io" href="/it/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/it/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/it/install/hetzner">Docker su VPS Hetzner</Card>
  <Card title="Hostinger" href="/it/install/hostinger">VPS con configurazione in un clic</Card>
  <Card title="Northflank" href="/it/install/northflank">Configurazione dal browser in un clic</Card>
  <Card title="Oracle Cloud" href="/it/install/oracle">Fascia ARM sempre gratuita</Card>
  <Card title="Railway" href="/it/install/railway">Configurazione dal browser in un clic</Card>
  <Card title="Raspberry Pi" href="/it/install/raspberry-pi">ARM con hosting autonomo</Card>
</CardGroup>

Anche **AWS (EC2 / Lightsail / fascia gratuita)** funziona bene.
È disponibile una guida video della community all'indirizzo
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(risorsa della community: potrebbe non essere più disponibile in futuro).

## Come funzionano le configurazioni cloud

- Il **Gateway viene eseguito sul VPS** e gestisce lo stato e l'area di lavoro.
- Puoi connetterti dal portatile o dal telefono tramite l'**interfaccia di controllo** o **Tailscale/SSH**.
- Considera il VPS come fonte autorevole ed esegui regolarmente il **backup** dello stato e dell'area di lavoro.
- Impostazione predefinita sicura: mantieni il Gateway su local loopback e accedi tramite un tunnel SSH o Tailscale Serve.
  Se esegui il binding a `lan` o `tailnet`, il Gateway richiede un segreto condiviso
  (`gateway.auth.token` o `gateway.auth.password`), a meno che l'autenticazione non sia delegata a un
  proxy attendibile.

Pagine correlate: [Accesso remoto al Gateway](/it/gateway/remote), [Hub delle piattaforme](/it/platforms).

## Rafforza prima l'accesso amministrativo

Prima di installare OpenClaw su un VPS pubblico, stabilisci come amministrare
la macchina stessa.

- Per l'accesso amministrativo limitato alla tailnet: installa prima Tailscale, collega il VPS alla
  tua tailnet, verifica una seconda sessione SSH tramite l'indirizzo IP Tailscale o il nome MagicDNS,
  quindi limita l'accesso SSH pubblico.
- Senza Tailscale: applica misure di sicurezza equivalenti al percorso SSH prima
  di esporre altri servizi.
- Questa configurazione è distinta dall'accesso al Gateway. Puoi comunque mantenere OpenClaw associato al
  local loopback e utilizzare un tunnel SSH o Tailscale Serve per il pannello di controllo.

Le opzioni del Gateway specifiche per Tailscale sono descritte in [Tailscale](/it/gateway/tailscale).

## Agente aziendale condiviso su un VPS

L'esecuzione di un singolo agente per un team è una configurazione valida quando tutti gli utenti appartengono allo
stesso perimetro di attendibilità e l'agente viene utilizzato esclusivamente per scopi aziendali.

- Mantienilo in un ambiente di esecuzione dedicato (VPS/VM/container e utente/account del sistema operativo dedicati).
- Non accedere da tale ambiente ad account Apple/Google personali o a profili personali del browser o del gestore di password.
- Se gli utenti possono comportarsi in modo ostile tra loro, separali per Gateway, host o utente del sistema operativo.

Dettagli sul modello di sicurezza: [Sicurezza](/it/gateway/security).

## Utilizzo dei nodi con un VPS

Puoi mantenere il Gateway nel cloud e associare **nodi** sui tuoi dispositivi locali
(Mac/iOS/Android/headless). I nodi forniscono funzionalità locali per schermo, fotocamera, canvas e `system.run`,
mentre il Gateway rimane nel cloud.

Documentazione: [Nodi](/it/nodes), [CLI dei nodi](/it/cli/nodes).

## Ottimizzazione dell'avvio per VM di piccole dimensioni e host ARM

Se i comandi della CLI risultano lenti su VM a bassa potenza (o host ARM), abilita la cache di compilazione dei moduli di Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` riduce i tempi di avvio dei comandi ripetuti; la prima esecuzione inizializza la cache.
- `OPENCLAW_NO_RESPAWN=1` mantiene i normali riavvii del Gateway nello stesso processo, evitando ulteriori passaggi tra processi e semplificando il monitoraggio del PID sugli host di piccole dimensioni.
- Per informazioni specifiche su Raspberry Pi, consulta [Raspberry Pi](/it/install/raspberry-pi).

### Elenco di controllo per l'ottimizzazione di systemd (facoltativo)

Per gli host VM che utilizzano `systemd`, valuta:

- Variabili d'ambiente del servizio per un percorso di avvio stabile: `OPENCLAW_NO_RESPAWN=1` e
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Comportamento di riavvio esplicito: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Dischi SSD per i percorsi di stato e cache, in modo da ridurre le penalizzazioni dell'avvio a freddo dovute alle operazioni di I/O casuali.

Il percorso standard `openclaw onboard --install-daemon` installa un'unità utente
systemd; modificala con:

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

Se invece hai installato deliberatamente un'unità di sistema, modificala tramite
`sudo systemctl edit openclaw-gateway.service`.

In che modo i criteri `Restart=` facilitano il ripristino automatico:
[systemd può automatizzare il ripristino dei servizi](https://www.redhat.com/en/blog/systemd-automate-recovery).

Per il comportamento OOM di Linux, la selezione del processo figlio da terminare e la
diagnostica di `exit 137`, consulta [Pressione sulla memoria e terminazioni OOM in Linux](/it/platforms/linux#memory-pressure-and-oom-kills).

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [DigitalOcean](/it/install/digitalocean)
- [Fly.io](/it/install/fly)
- [Hetzner](/it/install/hetzner)
