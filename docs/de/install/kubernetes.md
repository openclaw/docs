---
read_when:
    - Sie möchten OpenClaw auf einem Kubernetes-Cluster ausführen
    - Sie möchten OpenClaw in einer Kubernetes-Umgebung testen
summary: OpenClaw Gateway mit Kustomize in einem Kubernetes-Cluster bereitstellen
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:43:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

Ein minimaler Ausgangspunkt für den Betrieb von OpenClaw auf Kubernetes — keine produktionsreife Bereitstellung. Er deckt die zentralen Ressourcen ab und ist dafür gedacht, an Ihre Umgebung angepasst zu werden.

## Warum nicht Helm?

OpenClaw ist ein einzelner Container mit einigen Konfigurationsdateien. Die relevante Anpassung liegt in Agent-Inhalten (Markdown-Dateien, Skills, Konfigurationsüberschreibungen), nicht im Infrastruktur-Templating. Kustomize verwaltet Overlays ohne den Overhead eines Helm-Charts. Wenn Ihre Bereitstellung komplexer wird, kann ein Helm-Chart auf diese Manifeste aufgesetzt werden.

## Was Sie benötigen

- Einen laufenden Kubernetes-Cluster (AKS, EKS, GKE, k3s, kind, OpenShift usw.)
- `kubectl`, verbunden mit Ihrem Cluster
- Einen API-Schlüssel für mindestens einen Modell-Provider

## Schnellstart

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Rufen Sie das konfigurierte gemeinsame Secret für die Steuerungsoberfläche ab. Dieses Bereitstellungsskript erstellt standardmäßig Token-Authentifizierung:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Für lokales Debugging gibt `./scripts/k8s/deploy.sh --show-token` das Token nach der Bereitstellung aus.

## Lokales Testen mit Kind

Wenn Sie keinen Cluster haben, erstellen Sie lokal einen mit [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Stellen Sie anschließend wie gewohnt mit `./scripts/k8s/deploy.sh` bereit.

## Schritt für Schritt

### 1) Bereitstellen

**Option A** — API-Schlüssel in der Umgebung (ein Schritt):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Das Skript erstellt ein Kubernetes-Secret mit dem API-Schlüssel und einem automatisch generierten Gateway-Token und stellt dann bereit. Wenn das Secret bereits existiert, behält es das aktuelle Gateway-Token und alle Provider-Schlüssel bei, die nicht geändert werden.

**Option B** — Secret separat erstellen:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Verwenden Sie `--show-token` mit einem der beiden Befehle, wenn Sie das Token für lokale Tests auf stdout ausgeben möchten.

### 2) Auf das Gateway zugreifen

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Was bereitgestellt wird

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Anpassung

### Agent-Anweisungen

Bearbeiten Sie die `AGENTS.md` in `scripts/k8s/manifests/configmap.yaml` und stellen Sie erneut bereit:

```bash
./scripts/k8s/deploy.sh
```

### Gateway-Konfiguration

Bearbeiten Sie `openclaw.json` in `scripts/k8s/manifests/configmap.yaml`. Die vollständige Referenz finden Sie unter [Gateway-Konfiguration](/de/gateway/configuration).

### Provider hinzufügen

Führen Sie die Bereitstellung mit zusätzlichen exportierten Schlüsseln erneut aus:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Vorhandene Provider-Schlüssel bleiben im Secret, sofern Sie sie nicht überschreiben.

Oder patchen Sie das Secret direkt:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Benutzerdefinierter Namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Benutzerdefiniertes Image

Bearbeiten Sie das Feld `image` in `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### Über Port-Forwarding hinaus freigeben

Die Standardmanifeste binden das Gateway im Pod an Loopback. Das funktioniert mit `kubectl port-forward`, aber nicht mit einem Kubernetes-`Service` oder einem Ingress-Pfad, der die Pod-IP erreichen muss.

Wenn Sie das Gateway über Ingress oder einen Load Balancer freigeben möchten:

- Ändern Sie die Gateway-Bindung in `scripts/k8s/manifests/configmap.yaml` von `loopback` zu einer Nicht-Loopback-Bindung, die zu Ihrem Bereitstellungsmodell passt
- Lassen Sie die Gateway-Authentifizierung aktiviert und verwenden Sie einen ordnungsgemäß TLS-terminierten Einstiegspunkt
- Konfigurieren Sie die Steuerungsoberfläche für Remotezugriff mit dem unterstützten Web-Sicherheitsmodell (zum Beispiel HTTPS/Tailscale Serve und bei Bedarf explizit erlaubte Ursprünge)

## Erneut bereitstellen

```bash
./scripts/k8s/deploy.sh
```

Dies wendet alle Manifeste an und startet den Pod neu, damit Konfigurations- oder Secret-Änderungen übernommen werden.

## Entfernen

```bash
./scripts/k8s/deploy.sh --delete
```

Dies löscht den Namespace und alle darin enthaltenen Ressourcen, einschließlich des PVC.

## Architekturhinweise

- Das Gateway bindet standardmäßig im Pod an Loopback, daher ist das enthaltene Setup für `kubectl port-forward` vorgesehen
- Keine clusterweiten Ressourcen — alles befindet sich in einem einzelnen Namespace
- Sicherheit: `readOnlyRootFilesystem`, `drop: ALL`-Capabilities, Nicht-Root-Benutzer (UID 1000)
- Die Standardkonfiguration hält die Steuerungsoberfläche auf dem sichereren Pfad für lokalen Zugriff: Loopback-Bindung plus `kubectl port-forward` zu `http://127.0.0.1:18789`
- Wenn Sie über localhost-Zugriff hinausgehen, verwenden Sie das unterstützte Remote-Modell: HTTPS/Tailscale plus die passende Gateway-Bindung und Ursprungseinstellungen der Steuerungsoberfläche
- Secrets werden in einem temporären Verzeichnis generiert und direkt auf den Cluster angewendet — es wird kein Secret-Material in den Repo-Checkout geschrieben

## Dateistruktur

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

## Verwandte Themen

- [Docker](/de/install/docker)
- [Docker-VM-Laufzeit](/de/install/docker-vm-runtime)
- [Installationsübersicht](/de/install)
