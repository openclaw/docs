---
read_when:
    - Vuoi eseguire OpenClaw su un cluster Kubernetes
    - Vuoi testare OpenClaw in un ambiente Kubernetes
summary: Distribuire OpenClaw Gateway in un cluster Kubernetes con Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-05-06T08:56:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c38e42ae9121864333574b668d95f4d1112cada30cd525613d2371f176de4505
    source_path: install/kubernetes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Un punto di partenza minimale per eseguire OpenClaw su Kubernetes: non un deployment pronto per la produzione. Copre le risorse principali ed è pensato per essere adattato al tuo ambiente.

## Perché non Helm?

OpenClaw è un singolo container con alcuni file di configurazione. La personalizzazione più rilevante riguarda il contenuto degli agenti (file Markdown, Skills, override di configurazione), non il templating dell’infrastruttura. Kustomize gestisce gli overlay senza il sovraccarico di un chart Helm. Se il deployment diventa più complesso, è possibile aggiungere un chart Helm sopra questi manifest.

## Cosa serve

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

Recupera il segreto condiviso configurato per la Control UI. Questo script di deployment crea l’autenticazione tramite token per impostazione predefinita:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Per il debug locale, `./scripts/k8s/deploy.sh --show-token` stampa il token dopo il deployment.

## Test locale con Kind

Se non hai un cluster, creane uno in locale con [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Poi esegui il deployment come di consueto con `./scripts/k8s/deploy.sh`.

## Passo per passo

### 1) Esegui il deployment

**Opzione A** — chiave API nell’ambiente (un solo passaggio):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Lo script crea un Secret Kubernetes con la chiave API e un token Gateway generato automaticamente, poi esegue il deployment. Se il Secret esiste già, conserva il token Gateway corrente e le eventuali chiavi provider che non vengono modificate.

**Opzione B** — crea il secret separatamente:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Usa `--show-token` con uno dei due comandi se vuoi stampare il token su stdout per il test locale.

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

### Istruzioni per l’agente

Modifica `AGENTS.md` in `scripts/k8s/manifests/configmap.yaml` ed esegui di nuovo il deployment:

```bash
./scripts/k8s/deploy.sh
```

### Configurazione del Gateway

Modifica `openclaw.json` in `scripts/k8s/manifests/configmap.yaml`. Consulta [Configurazione del Gateway](/it/gateway/configuration) per il riferimento completo.

### Aggiungere provider

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
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### Esporre oltre il port-forward

I manifest predefiniti associano il Gateway a loopback all’interno del pod. Questo funziona con `kubectl port-forward`, ma non funziona con un `Service` Kubernetes o un percorso Ingress che deve raggiungere l’IP del pod.

Se vuoi esporre il Gateway tramite un Ingress o un bilanciatore di carico:

- Cambia il bind del Gateway in `scripts/k8s/manifests/configmap.yaml` da `loopback` a un bind non loopback compatibile con il tuo modello di deployment
- Mantieni l’autenticazione del Gateway abilitata e usa un entrypoint adeguato con terminazione TLS
- Configura la Control UI per l’accesso remoto usando il modello di sicurezza web supportato (per esempio HTTPS/Tailscale Serve e origini consentite esplicite quando necessario)

## Rieseguire il deployment

```bash
./scripts/k8s/deploy.sh
```

Questo applica tutti i manifest e riavvia il pod per acquisire eventuali modifiche alla configurazione o ai secret.

## Rimozione

```bash
./scripts/k8s/deploy.sh --delete
```

Questo elimina il namespace e tutte le risorse al suo interno, incluso il PVC.

## Note sull’architettura

- Il Gateway si associa per impostazione predefinita a loopback all’interno del pod, quindi la configurazione inclusa è per `kubectl port-forward`
- Nessuna risorsa con ambito cluster: tutto risiede in un singolo namespace
- Sicurezza: `readOnlyRootFilesystem`, capability `drop: ALL`, utente non root (UID 1000)
- La configurazione predefinita mantiene la Control UI sul percorso più sicuro di accesso locale: bind loopback più `kubectl port-forward` verso `http://127.0.0.1:18789`
- Se passi oltre l’accesso localhost, usa il modello remoto supportato: HTTPS/Tailscale più il bind Gateway appropriato e le impostazioni di origine della Control UI
- I secret vengono generati in una directory temporanea e applicati direttamente al cluster: nessun materiale segreto viene scritto nel checkout del repository

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
- [Panoramica dell’installazione](/it/install)
