---
read_when:
    - Vuoi eseguire OpenClaw su un cluster Kubernetes
    - Vuoi testare OpenClaw in un ambiente Kubernetes
summary: Distribuire OpenClaw Gateway su un cluster Kubernetes con Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T08:47:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw su Kubernetes

Un punto di partenza minimo per eseguire OpenClaw su Kubernetes — non una distribuzione pronta per la produzione. Copre le risorse principali ed è pensato per essere adattato al tuo ambiente.

## Perché non Helm?

OpenClaw è un singolo container con alcuni file di configurazione. La personalizzazione interessante è nel contenuto dell'agente (file markdown, Skills, override di configurazione), non nel templating dell'infrastruttura. Kustomize gestisce gli overlay senza il sovraccarico di un chart Helm. Se la tua distribuzione diventa più complessa, un chart Helm può essere aggiunto sopra questi manifest.

## Cosa ti serve

- Un cluster Kubernetes in esecuzione (AKS, EKS, GKE, k3s, kind, OpenShift, ecc.)
- `kubectl` collegato al tuo cluster
- Una chiave API per almeno un provider di modelli

## Avvio rapido

```bash
# Sostituisci con il tuo provider: ANTHROPIC, GEMINI, OPENAI, oppure OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Recupera il segreto condiviso configurato per l'interfaccia Control. Questo script di deploy
crea per impostazione predefinita l'autenticazione con token:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Per debug locale, `./scripts/k8s/deploy.sh --show-token` stampa il token dopo il deploy.

## Test locale con Kind

Se non hai un cluster, creane uno localmente con [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # rileva automaticamente docker o podman
./scripts/k8s/create-kind.sh --delete  # smantella
```

Poi esegui il deploy come di consueto con `./scripts/k8s/deploy.sh`.

## Passo dopo passo

### 1) Deploy

**Opzione A** — chiave API nell'ambiente (un solo passaggio):

```bash
# Sostituisci con il tuo provider: ANTHROPIC, GEMINI, OPENAI, oppure OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Lo script crea un Secret Kubernetes con la chiave API e un token gateway generato automaticamente, quindi esegue il deploy. Se il Secret esiste già, preserva il token gateway corrente e tutte le chiavi provider che non vengono modificate.

**Opzione B** — crea il secret separatamente:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Usa `--show-token` con uno dei due comandi se vuoi che il token venga stampato su stdout per test locali.

### 2) Accedi al gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Cosa viene distribuito

```
Namespace: openclaw (configurabile tramite OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pod singolo, init container + gateway
├── Service/openclaw           # ClusterIP sulla porta 18789
├── PersistentVolumeClaim      # 10Gi per stato e configurazione dell'agente
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Token gateway + chiavi API
```

## Personalizzazione

### Istruzioni dell'agente

Modifica `AGENTS.md` in `scripts/k8s/manifests/configmap.yaml` ed esegui di nuovo il deploy:

```bash
./scripts/k8s/deploy.sh
```

### Configurazione del Gateway

Modifica `openclaw.json` in `scripts/k8s/manifests/configmap.yaml`. Vedi [Gateway configuration](/it/gateway/configuration) per il riferimento completo.

### Aggiungi provider

Esegui di nuovo con chiavi aggiuntive esportate:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Le chiavi provider esistenti restano nel Secret a meno che tu non le sovrascriva.

Oppure applica una patch direttamente al Secret:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace personalizzato

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Immagine personalizzata

Modifica il campo `image` in `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # oppure fissa una versione specifica da https://github.com/openclaw/openclaw/releases
```

### Esponi oltre `port-forward`

I manifest predefiniti collegano il gateway al loopback dentro il pod. Questo funziona con `kubectl port-forward`, ma non funziona con un `Service` Kubernetes o un percorso Ingress che deve raggiungere l'IP del pod.

Se vuoi esporre il gateway tramite un Ingress o un load balancer:

- Cambia il bind del gateway in `scripts/k8s/manifests/configmap.yaml` da `loopback` a un bind non-loopback che corrisponda al tuo modello di distribuzione
- Mantieni abilitata l'autenticazione del gateway e usa un entrypoint correttamente terminato TLS
- Configura l'interfaccia Control per l'accesso remoto usando il modello di sicurezza web supportato (ad esempio HTTPS/Tailscale Serve e origini consentite esplicite quando necessario)

## Ridistribuzione

```bash
./scripts/k8s/deploy.sh
```

Questo applica tutti i manifest e riavvia il pod per recepire eventuali modifiche a configurazione o segreti.

## Smantellamento

```bash
./scripts/k8s/deploy.sh --delete
```

Questo elimina il namespace e tutte le risorse al suo interno, incluso il PVC.

## Note di architettura

- Il gateway si collega al loopback dentro il pod per impostazione predefinita, quindi la configurazione inclusa è pensata per `kubectl port-forward`
- Nessuna risorsa a livello cluster — tutto vive in un singolo namespace
- Sicurezza: `readOnlyRootFilesystem`, capability `drop: ALL`, utente non-root (UID 1000)
- La configurazione predefinita mantiene l'interfaccia Control sul percorso più sicuro di accesso locale: bind loopback più `kubectl port-forward` verso `http://127.0.0.1:18789`
- Se vai oltre l'accesso localhost, usa il modello remoto supportato: HTTPS/Tailscale più il bind gateway appropriato e le impostazioni di origine dell'interfaccia Control
- I segreti vengono generati in una directory temporanea e applicati direttamente al cluster — nessun materiale segreto viene scritto nel checkout del repository

## Struttura dei file

```
scripts/k8s/
├── deploy.sh                   # Crea namespace + secret, distribuisce tramite kustomize
├── create-kind.sh              # Cluster Kind locale (rileva automaticamente docker/podman)
└── manifests/
    ├── kustomization.yaml      # Base Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Specifica del pod con hardening di sicurezza
    ├── pvc.yaml                # 10Gi di archiviazione persistente
    └── service.yaml            # ClusterIP su 18789
```

## Correlati

- [Docker](/it/install/docker)
- [Docker VM runtime](/it/install/docker-vm-runtime)
- [Install overview](/it/install)
