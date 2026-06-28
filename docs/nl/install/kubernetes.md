---
read_when:
    - U wilt OpenClaw uitvoeren op een Kubernetes-cluster
    - U wilt OpenClaw testen in een Kubernetes-omgeving
summary: OpenClaw Gateway implementeren in een Kubernetes-cluster met Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-05-06T09:19:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c38e42ae9121864333574b668d95f4d1112cada30cd525613d2371f176de4505
    source_path: install/kubernetes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Een minimaal startpunt om OpenClaw op Kubernetes uit te voeren — geen productieklare deployment. Het behandelt de kernresources en is bedoeld om aan je omgeving te worden aangepast.

## Waarom geen Helm?

OpenClaw is één container met enkele configuratiebestanden. De interessante aanpassing zit in agentinhoud (Markdown-bestanden, Skills, configuratie-overschrijvingen), niet in infrastructuurtemplating. Kustomize verwerkt overlays zonder de overhead van een Helm chart. Als je deployment complexer wordt, kan een Helm chart bovenop deze manifests worden gelegd.

## Wat je nodig hebt

- Een draaiend Kubernetes-cluster (AKS, EKS, GKE, k3s, kind, OpenShift, enz.)
- `kubectl` verbonden met je cluster
- Een API-sleutel voor ten minste één modelprovider

## Snelle start

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Haal het geconfigureerde gedeelde geheim op voor de Control UI. Dit deploy-script
maakt standaard tokenauthenticatie aan:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Voor lokale debugging drukt `./scripts/k8s/deploy.sh --show-token` het token af na de deployment.

## Lokaal testen met Kind

Als je geen cluster hebt, maak er dan lokaal een aan met [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Deploy daarna zoals gebruikelijk met `./scripts/k8s/deploy.sh`.

## Stap voor stap

### 1) Deployen

**Optie A** — API-sleutel in de omgeving (één stap):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Het script maakt een Kubernetes Secret aan met de API-sleutel en een automatisch gegenereerd gateway-token, en deployt daarna. Als de Secret al bestaat, behoudt het script het huidige gateway-token en provider-sleutels die niet worden gewijzigd.

**Optie B** — maak het secret apart aan:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Gebruik `--show-token` met een van beide opdrachten als je het token voor lokale tests naar stdout wilt laten afdrukken.

### 2) Toegang tot de Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Wat wordt gedeployed

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Aanpassing

### Agentinstructies

Bewerk de `AGENTS.md` in `scripts/k8s/manifests/configmap.yaml` en deploy opnieuw:

```bash
./scripts/k8s/deploy.sh
```

### Gateway-configuratie

Bewerk `openclaw.json` in `scripts/k8s/manifests/configmap.yaml`. Zie [Gateway-configuratie](/nl/gateway/configuration) voor de volledige referentie.

### Providers toevoegen

Voer opnieuw uit met extra geëxporteerde sleutels:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Bestaande provider-sleutels blijven in de Secret staan, tenzij je ze overschrijft.

Of patch de Secret direct:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Aangepaste namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Aangepaste image

Bewerk het veld `image` in `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### Beschikbaar maken buiten port-forward

De standaardmanifests binden de Gateway binnen de pod aan loopback. Dat werkt met `kubectl port-forward`, maar niet met een Kubernetes `Service` of Ingress-pad dat het pod-IP moet kunnen bereiken.

Als je de Gateway via een Ingress of load balancer wilt beschikbaar maken:

- Wijzig de Gateway-bind in `scripts/k8s/manifests/configmap.yaml` van `loopback` naar een niet-loopback-bind die past bij je deploymentmodel
- Houd Gateway-authenticatie ingeschakeld en gebruik een passend TLS-beëindigd toegangspunt
- Configureer de Control UI voor externe toegang met het ondersteunde webbeveiligingsmodel (bijvoorbeeld HTTPS/Tailscale Serve en expliciet toegestane origins wanneer nodig)

## Opnieuw deployen

```bash
./scripts/k8s/deploy.sh
```

Dit past alle manifests toe en herstart de pod om eventuele configuratie- of secret-wijzigingen op te pakken.

## Verwijderen

```bash
./scripts/k8s/deploy.sh --delete
```

Dit verwijdert de namespace en alle resources daarin, inclusief de PVC.

## Architectuurnotities

- De Gateway bindt standaard binnen de pod aan loopback, dus de meegeleverde setup is bedoeld voor `kubectl port-forward`
- Geen cluster-scoped resources — alles staat in één namespace
- Beveiliging: `readOnlyRootFilesystem`, `drop: ALL`-capabilities, niet-rootgebruiker (UID 1000)
- De standaardconfiguratie houdt de Control UI op het veiligere pad voor lokale toegang: loopback-bind plus `kubectl port-forward` naar `http://127.0.0.1:18789`
- Als je verder gaat dan toegang via localhost, gebruik dan het ondersteunde externe model: HTTPS/Tailscale plus de juiste Gateway-bind en origin-instellingen voor de Control UI
- Secrets worden gegenereerd in een tijdelijke map en direct op het cluster toegepast — er wordt geen geheim materiaal naar de repo-checkout geschreven

## Bestandsstructuur

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

## Gerelateerd

- [Docker](/nl/install/docker)
- [Docker VM-runtime](/nl/install/docker-vm-runtime)
- [Installatieoverzicht](/nl/install)
