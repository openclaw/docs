---
read_when:
    - Vuoi eseguire OpenClaw su un cluster Kubernetes
    - Vuoi testare OpenClaw in un ambiente Kubernetes
summary: Distribuisci OpenClaw Gateway in un cluster Kubernetes con Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:44:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

Un punto di partenza minimale per eseguire OpenClaw su Kubernetes: non è una distribuzione pronta per la produzione. Copre le risorse principali ed è pensato per essere adattato al tuo ambiente.

## Perché non Helm?

OpenClaw è un singolo container con alcuni file di configurazione. La personalizzazione interessante riguarda i contenuti degli agenti (file markdown, skills, override di configurazione), non il templating dell'infrastruttura. Kustomize gestisce gli overlay senza il sovraccarico di un chart Helm. Se la tua distribuzione diventa più complessa, un chart Helm può essere aggiunto sopra questi manifest.

## Cosa ti serve

- Un cluster Kubernetes in esecuzione (AKS, EKS, GKE, k3s, kind, OpenShift, ecc.)
- `kubectl` connesso al tuo cluster
- Una chiave API per almeno un provider di modelli

## Avvio rapido

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Recupera il segreto condiviso configurato per la Control UI. Questo script di distribuzione
crea l'autenticazione tramite token per impostazione predefinita:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Per il debug locale, `./scripts/k8s/deploy.sh --show-token` stampa il token dopo la distribuzione.

## Test locale con Kind

Se non hai un cluster, creane uno localmente con [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Poi distribuisci come di consueto con `./scripts/k8s/deploy.sh`.

## Passo dopo passo

### 1) Distribuisci

**Opzione A** — chiave API nell'ambiente (un passaggio):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Lo script crea un Secret Kubernetes con la chiave API e un token gateway generato automaticamente, quindi distribuisce. Se il Secret esiste già, conserva il token gateway corrente e tutte le chiavi provider che non vengono modificate.

**Opzione B** — crea il secret separatamente:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Usa `--show-token` con uno dei due comandi se vuoi che il token venga stampato su stdout per i test locali.

### 2) Accedi al gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Cosa viene distribuito

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Personalizzazione

### Istruzioni per gli agenti

Modifica `AGENTS.md` in `scripts/k8s/manifests/configmap.yaml` e ridistribuisci:

```bash
./scripts/k8s/deploy.sh
```

### Configurazione del Gateway

Modifica `openclaw.json` in `scripts/k8s/manifests/configmap.yaml`. Consulta [Configurazione del Gateway](/it/gateway/configuration) per il riferimento completo.

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
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### Esporre oltre il port-forward

I manifest predefiniti collegano il gateway al loopback all'interno del pod. Questo funziona con `kubectl port-forward`, ma non funziona con un `Service` Kubernetes o un percorso Ingress che deve raggiungere l'IP del pod.

Se vuoi esporre il gateway tramite un Ingress o un load balancer:

- Cambia il bind del gateway in `scripts/k8s/manifests/configmap.yaml` da `loopback` a un bind non-loopback che corrisponda al tuo modello di distribuzione
- Mantieni abilitata l'autenticazione del gateway e usa un entrypoint appropriato con terminazione TLS
- Configura la Control UI per l'accesso remoto usando il modello di sicurezza web supportato (ad esempio HTTPS/Tailscale Serve e origini consentite esplicite quando necessario)

## Ridistribuzione

```bash
./scripts/k8s/deploy.sh
```

Questo applica tutti i manifest e riavvia il pod per recepire eventuali modifiche alla configurazione o ai secret.

## Rimozione

```bash
./scripts/k8s/deploy.sh --delete
```

Questo elimina il namespace e tutte le risorse al suo interno, incluso il PVC.

## Note sull'architettura

- Il gateway si collega al loopback all'interno del pod per impostazione predefinita, quindi la configurazione inclusa è per `kubectl port-forward`
- Nessuna risorsa con ambito cluster: tutto risiede in un singolo namespace
- Sicurezza: `readOnlyRootFilesystem`, funzionalità `drop: ALL`, utente non root (UID 1000)
- La configurazione predefinita mantiene la Control UI sul percorso di accesso locale più sicuro: bind loopback più `kubectl port-forward` verso `http://127.0.0.1:18789`
- Se vai oltre l'accesso localhost, usa il modello remoto supportato: HTTPS/Tailscale più il bind gateway appropriato e le impostazioni di origine della Control UI
- I secret vengono generati in una directory temporanea e applicati direttamente al cluster: nessun materiale segreto viene scritto nel checkout del repo

## Struttura dei file

```
scripts/k8s/
├── deploy.sh                   # Creates namespace + secret, deploys via kustomize
├── create-kind.sh              # Local Kind cluster (auto-detects docker/podman)
└── manifests/
    ├── kustomization.yaml      # Kustomize base
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod spec with security hardening
    ├── pvc.yaml                # 10Gi persistent storage
    └── service.yaml            # ClusterIP on 18789
```

## Correlati

- [Docker](/it/install/docker)
- [Runtime Docker VM](/it/install/docker-vm-runtime)
- [Panoramica dell'installazione](/it/install)
