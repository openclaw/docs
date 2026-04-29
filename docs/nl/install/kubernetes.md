---
read_when:
    - Je wilt OpenClaw op een Kubernetes-cluster draaien
    - Je wilt OpenClaw testen in een Kubernetes-omgeving
summary: OpenClaw Gateway uitrollen naar een Kubernetes-cluster met Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-29T22:54:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 16
---

# OpenClaw op Kubernetes

Een minimaal startpunt om OpenClaw op Kubernetes uit te voeren — geen productierijpe deployment. Het behandelt de kernresources en is bedoeld om aan je omgeving te worden aangepast.

## Waarom geen Helm?

OpenClaw is één container met enkele configuratiebestanden. De interessante aanpassing zit in agentinhoud (markdownbestanden, Skills, configuratie-overschrijvingen), niet in infrastructuurtemplating. Kustomize verwerkt overlays zonder de overhead van een Helm-chart. Als je deployment complexer wordt, kan een Helm-chart boven op deze manifests worden geplaatst.

## Wat je nodig hebt

- Een draaiend Kubernetes-cluster (AKS, EKS, GKE, k3s, kind, OpenShift, enz.)
- `kubectl` verbonden met je cluster
- Een API-sleutel voor ten minste één modelprovider

## Snel starten

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Haal het geconfigureerde gedeelde geheim op voor de Control UI. Dit deployscript
maakt standaard tokenauthenticatie aan:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Voor lokaal debuggen print `./scripts/k8s/deploy.sh --show-token` het token na de deployment.

## Lokaal testen met Kind

Als je geen cluster hebt, maak er lokaal een aan met [Kind](https://kind.sigs.k8s.io/):

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

Het script maakt een Kubernetes Secret met de API-sleutel en een automatisch gegenereerd Gateway-token, en voert daarna de deployment uit. Als de Secret al bestaat, behoudt het script het huidige Gateway-token en alle providersleutels die niet worden gewijzigd.

**Optie B** — maak het geheim apart aan:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Gebruik `--show-token` bij beide commando's als je het token voor lokaal testen naar stdout wilt laten printen.

### 2) Toegang tot de Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Wat er wordt gedeployed

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

Voer opnieuw uit met aanvullende geëxporteerde sleutels:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Bestaande providersleutels blijven in de Secret staan, tenzij je ze overschrijft.

Of patch de Secret rechtstreeks:

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

De standaardmanifests binden de Gateway aan loopback binnen de pod. Dat werkt met `kubectl port-forward`, maar niet met een Kubernetes `Service` of Ingress-pad dat het pod-IP moet kunnen bereiken.

Als je de Gateway via een Ingress of loadbalancer wilt beschikbaar maken:

- Wijzig de Gateway-bind in `scripts/k8s/manifests/configmap.yaml` van `loopback` naar een niet-loopback-bind die past bij je deploymentmodel
- Houd Gateway-authenticatie ingeschakeld en gebruik een correct TLS-beëindigd toegangspunt
- Configureer de Control UI voor externe toegang met het ondersteunde webbeveiligingsmodel (bijvoorbeeld HTTPS/Tailscale Serve en expliciet toegestane origins wanneer nodig)

## Opnieuw deployen

```bash
./scripts/k8s/deploy.sh
```

Dit past alle manifests toe en herstart de pod om eventuele configuratie- of geheimwijzigingen op te pakken.

## Verwijderen

```bash
./scripts/k8s/deploy.sh --delete
```

Dit verwijdert de namespace en alle resources daarin, inclusief de PVC.

## Architectuurnotities

- De Gateway bindt standaard aan loopback binnen de pod, dus de meegeleverde setup is bedoeld voor `kubectl port-forward`
- Geen cluster-scoped resources — alles staat in één namespace
- Beveiliging: `readOnlyRootFilesystem`, `drop: ALL`-capabilities, niet-rootgebruiker (UID 1000)
- De standaardconfiguratie houdt de Control UI op het veiligere pad voor lokale toegang: loopback-bind plus `kubectl port-forward` naar `http://127.0.0.1:18789`
- Als je verder gaat dan localhost-toegang, gebruik dan het ondersteunde externe model: HTTPS/Tailscale plus de juiste Gateway-bind en origin-instellingen voor de Control UI
- Geheimen worden in een tijdelijke map gegenereerd en rechtstreeks op het cluster toegepast — er wordt geen geheim materiaal naar de repo-checkout geschreven

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
