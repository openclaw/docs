---
read_when:
    - Je wilt OpenClaw uitvoeren op een Kubernetes-cluster
    - U wilt OpenClaw testen in een Kubernetes-omgeving
summary: Implementeer OpenClaw Gateway in een Kubernetes-cluster met Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-12T08:55:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Een minimaal uitgangspunt om OpenClaw op Kubernetes uit te voeren, geen productieklare implementatie. Het omvat de belangrijkste resources en is bedoeld om aan uw omgeving te worden aangepast.

## Waarom geen Helm

OpenClaw is één container met enkele configuratiebestanden. De relevante aanpassingen bevinden zich in de agentinhoud (Markdown-bestanden, Skills, configuratieoverschrijvingen), niet in infrastructuursjablonen. Kustomize verwerkt overlays zonder de overhead van een Helm-chart. Plaats een Helm-chart boven op deze manifests als uw implementatie complexer wordt.

## Wat u nodig hebt

- Een actief Kubernetes-cluster (AKS, EKS, GKE, k3s, kind, OpenShift enzovoort)
- `kubectl` verbonden met uw cluster
- Een API-sleutel voor ten minste één modelprovider

## Snel aan de slag

```bash
# Vervang door uw provider: ANTHROPIC, GEMINI, OPENAI of OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh` maakt standaard tokenauthenticatie aan. Haal het gegenereerde Gateway-token op voor de Control UI:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Voor lokale foutopsporing drukt `./scripts/k8s/deploy.sh --show-token` het token na de implementatie af.

## Lokaal testen met Kind

Als u geen cluster hebt, maakt u er lokaal een met [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # detecteert automatisch docker of podman
./scripts/k8s/create-kind.sh --delete  # ruimt alles op
```

Implementeer vervolgens zoals gebruikelijk met `./scripts/k8s/deploy.sh`.

## Stap voor stap

### 1) Implementeren

**Optie A: API-sleutel in de omgeving (één stap)**

```bash
# Vervang door uw provider: ANTHROPIC, GEMINI, OPENAI of OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Het script maakt een Kubernetes Secret met de API-sleutel en een automatisch gegenereerd Gateway-token en voert vervolgens de implementatie uit. Als het Secret al bestaat, behoudt het het huidige Gateway-token en alle providersleutels die niet worden gewijzigd.

**Optie B: het Secret afzonderlijk aanmaken**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Voeg `--show-token` aan een van beide opdrachten toe om het token voor lokale tests naar stdout te schrijven.

### 2) Toegang tot de Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Wat wordt geïmplementeerd

```text
Namespace: openclaw (configureerbaar via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Eén pod, init-container + Gateway
├── Service/openclaw           # ClusterIP op poort 18789
├── PersistentVolumeClaim      # 10 Gi voor agentstatus en configuratie
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway-token + API-sleutels
```

## Aanpassingen

### Agentinstructies

Bewerk `AGENTS.md` in `scripts/k8s/manifests/configmap.yaml` en implementeer opnieuw:

```bash
./scripts/k8s/deploy.sh
```

### Gateway-configuratie

Bewerk `openclaw.json` in `scripts/k8s/manifests/configmap.yaml`. Raadpleeg [Gateway-configuratie](/nl/gateway/configuration) voor de volledige referentie.

### Providers toevoegen

Voer opnieuw uit nadat u aanvullende sleutels hebt geëxporteerd:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Bestaande providersleutels blijven in het Secret staan, tenzij u ze overschrijft.

Of patch het Secret rechtstreeks:

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
image: ghcr.io/openclaw/openclaw:slim # primary; official Docker Hub mirror: openclaw/openclaw
```

### Beschikbaar maken buiten port-forward

De standaardmanifests binden de Gateway aan local loopback binnen de pod. Dat werkt met `kubectl port-forward`, maar niet met een Kubernetes-`Service` of Ingress-pad dat het IP-adres van de pod rechtstreeks moet bereiken.

Om de Gateway via een Ingress of loadbalancer beschikbaar te maken:

- Wijzig de Gateway-binding in `scripts/k8s/manifests/configmap.yaml` van `loopback` in een binding zonder loopback die overeenkomt met uw implementatiemodel.
- Houd Gateway-authenticatie ingeschakeld en gebruik een geschikt toegangspunt met TLS-beëindiging.
- Configureer de Control UI voor externe toegang met het ondersteunde webbeveiligingsmodel (bijvoorbeeld HTTPS/Tailscale Serve en expliciet toegestane origins wanneer dat nodig is).

## Opnieuw implementeren

```bash
./scripts/k8s/deploy.sh
```

Hiermee worden alle manifests toegepast en wordt de pod opnieuw gestart om configuratie- of Secret-wijzigingen op te halen.

## Verwijderen

```bash
./scripts/k8s/deploy.sh --delete
```

Hiermee worden de namespace en alle resources daarin verwijderd, inclusief de PVC.

## Architectuurnotities

- De Gateway bindt standaard aan local loopback binnen de pod, dus de meegeleverde configuratie is bedoeld voor `kubectl port-forward`.
- Er zijn geen clusterbrede resources; alles bevindt zich in één namespace.
- Beveiligingsversterking: `readOnlyRootFilesystem`, `drop: ALL`-capabilities, gebruiker zonder rootrechten (UID 1000).
- De standaardconfiguratie houdt de Control UI op het veiligere pad voor lokale toegang: loopback-binding plus `kubectl port-forward` naar `http://127.0.0.1:18789`.
- Als u verdergaat dan localhost-toegang, gebruikt u het ondersteunde externe model: HTTPS/Tailscale plus de juiste Gateway-binding en origin-instellingen van de Control UI.
- Secrets worden in een tijdelijke map gegenereerd en rechtstreeks op het cluster toegepast; er wordt geen geheim materiaal naar de checkout van de repository geschreven.

## Bestandsstructuur

```text
scripts/k8s/
├── deploy.sh                   # Maakt namespace + Secret aan, implementeert via Kustomize
├── create-kind.sh              # Lokaal Kind-cluster (detecteert automatisch docker/podman)
└── manifests/
    ├── kustomization.yaml      # Kustomize-basis
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod-specificatie met beveiligingsversterking
    ├── pvc.yaml                # 10 Gi permanente opslag
    └── service.yaml            # ClusterIP op 18789
```

## Gerelateerd

- [Docker](/nl/install/docker)
- [Docker VM-runtime](/nl/install/docker-vm-runtime)
- [Installatieoverzicht](/nl/install)
