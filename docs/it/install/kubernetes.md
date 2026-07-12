---
read_when:
    - Vuoi eseguire OpenClaw su un cluster Kubernetes
    - Vuoi testare OpenClaw in un ambiente Kubernetes
summary: Distribuisci OpenClaw Gateway in un cluster Kubernetes con Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-12T07:08:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Un punto di partenza minimale per eseguire OpenClaw su Kubernetes, non una distribuzione pronta per la produzione. Include le risorse principali ed è pensato per essere adattato al proprio ambiente.

## Perché non Helm

OpenClaw è un singolo container con alcuni file di configurazione. La personalizzazione più rilevante riguarda i contenuti dell'agente (file Markdown, Skills, sostituzioni della configurazione), non i modelli dell'infrastruttura. Kustomize gestisce le sovrapposizioni senza il sovraccarico di un chart Helm. Se la distribuzione diventa più complessa, è possibile aggiungere un chart Helm sopra questi manifest.

## Requisiti

- Un cluster Kubernetes in esecuzione (AKS, EKS, GKE, k3s, kind, OpenShift, ecc.)
- `kubectl` connesso al cluster
- Una chiave API per almeno un fornitore di modelli

## Avvio rapido

```bash
# Sostituire con il proprio fornitore: ANTHROPIC, GEMINI, OPENAI o OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Per impostazione predefinita, `deploy.sh` crea l'autenticazione tramite token. Recuperare il token del Gateway generato per l'interfaccia di controllo:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Per il debug locale, `./scripts/k8s/deploy.sh --show-token` stampa il token dopo la distribuzione.

## Test locale con Kind

Se non si dispone di un cluster, crearne uno localmente con [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # rileva automaticamente docker o podman
./scripts/k8s/create-kind.sh --delete  # elimina il cluster
```

Quindi eseguire normalmente la distribuzione con `./scripts/k8s/deploy.sh`.

## Procedura dettagliata

### 1) Distribuzione

**Opzione A: chiave API nell'ambiente (un solo passaggio)**

```bash
# Sostituire con il proprio fornitore: ANTHROPIC, GEMINI, OPENAI o OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Lo script crea un Secret Kubernetes con la chiave API e un token del Gateway generato automaticamente, quindi esegue la distribuzione. Se il Secret esiste già, mantiene il token del Gateway corrente e tutte le chiavi dei fornitori che non vengono modificate.

**Opzione B: creare il Secret separatamente**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Aggiungere `--show-token` a uno dei comandi per stampare il token su stdout durante i test locali.

### 2) Accesso al Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Risorse distribuite

```text
Spazio dei nomi: openclaw (configurabile tramite OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Singolo pod, container di inizializzazione + Gateway
├── Service/openclaw           # ClusterIP sulla porta 18789
├── PersistentVolumeClaim      # 10 GiB per stato e configurazione dell'agente
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Token del Gateway + chiavi API
```

## Personalizzazione

### Istruzioni dell'agente

Modificare `AGENTS.md` in `scripts/k8s/manifests/configmap.yaml` e ridistribuire:

```bash
./scripts/k8s/deploy.sh
```

### Configurazione del Gateway

Modificare `openclaw.json` in `scripts/k8s/manifests/configmap.yaml`. Consultare [Configurazione del Gateway](/it/gateway/configuration) per il riferimento completo.

### Aggiunta di fornitori

Eseguire nuovamente i comandi dopo aver esportato le chiavi aggiuntive:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Le chiavi dei fornitori esistenti rimangono nel Secret, a meno che non vengano sovrascritte.

In alternativa, modificare direttamente il Secret:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Spazio dei nomi personalizzato

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Immagine personalizzata

Modificare il campo `image` in `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:slim # principale; mirror ufficiale su Docker Hub: openclaw/openclaw
```

### Esposizione oltre il port forwarding

I manifest predefiniti associano il Gateway al local loopback all'interno del pod. Questa configurazione funziona con `kubectl port-forward`, ma non con un `Service` Kubernetes o un percorso Ingress che debba raggiungere direttamente l'indirizzo IP del pod.

Per esporre il Gateway tramite un Ingress o un bilanciatore del carico:

- Modificare l'associazione del Gateway in `scripts/k8s/manifests/configmap.yaml` da `loopback` a un'associazione non loopback compatibile con il proprio modello di distribuzione.
- Mantenere abilitata l'autenticazione del Gateway e utilizzare un punto di ingresso appropriato con terminazione TLS.
- Configurare l'interfaccia di controllo per l'accesso remoto utilizzando il modello di sicurezza web supportato (ad esempio HTTPS/Tailscale Serve e origini consentite esplicite, quando necessarie).

## Ridistribuzione

```bash
./scripts/k8s/deploy.sh
```

Questo comando applica tutti i manifest e riavvia il pod per caricare eventuali modifiche alla configurazione o ai Secret.

## Rimozione

```bash
./scripts/k8s/deploy.sh --delete
```

Questo comando elimina lo spazio dei nomi e tutte le risorse al suo interno, incluso il PVC.

## Note sull'architettura

- Per impostazione predefinita, il Gateway è associato al local loopback all'interno del pod, quindi la configurazione inclusa è destinata a `kubectl port-forward`.
- Non vengono utilizzate risorse con ambito cluster; tutto risiede in un singolo spazio dei nomi.
- Rafforzamento della sicurezza: `readOnlyRootFilesystem`, funzionalità `drop: ALL`, utente non root (UID 1000).
- La configurazione predefinita mantiene l'interfaccia di controllo sul percorso di accesso locale più sicuro: associazione al loopback più `kubectl port-forward` verso `http://127.0.0.1:18789`.
- Se si estende l'accesso oltre localhost, utilizzare il modello remoto supportato: HTTPS/Tailscale insieme all'associazione appropriata del Gateway e alle impostazioni delle origini dell'interfaccia di controllo.
- I segreti vengono generati in una directory temporanea e applicati direttamente al cluster; nessun materiale segreto viene scritto nel checkout del repository.

## Struttura dei file

```text
scripts/k8s/
├── deploy.sh                   # Crea lo spazio dei nomi e il Secret, distribuisce tramite kustomize
├── create-kind.sh              # Cluster Kind locale (rileva automaticamente docker/podman)
└── manifests/
    ├── kustomization.yaml      # Base Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Specifica del pod con rafforzamento della sicurezza
    ├── pvc.yaml                # 10 GiB di spazio di archiviazione persistente
    └── service.yaml            # ClusterIP sulla porta 18789
```

## Contenuti correlati

- [Docker](/it/install/docker)
- [Runtime Docker per macchine virtuali](/it/install/docker-vm-runtime)
- [Panoramica dell'installazione](/it/install)
