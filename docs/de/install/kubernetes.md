---
read_when:
    - Sie möchten OpenClaw in einem Kubernetes-Cluster ausführen
    - Sie möchten OpenClaw in einer Kubernetes-Umgebung testen
summary: OpenClaw Gateway mit Kustomize in einem Kubernetes-Cluster bereitstellen
title: Kubernetes
x-i18n:
    generated_at: "2026-07-24T03:52:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Ein minimaler Ausgangspunkt für den Betrieb von OpenClaw auf Kubernetes, keine produktionsreife Bereitstellung. Er deckt die grundlegenden Ressourcen ab und ist für die Anpassung an Ihre Umgebung vorgesehen.

## Warum nicht Helm?

OpenClaw besteht aus einem einzelnen Container mit einigen Konfigurationsdateien. Die wesentlichen Anpassungen betreffen Agent-Inhalte (Markdown-Dateien, Skills, Konfigurationsüberschreibungen), nicht die Vorlagenerstellung für die Infrastruktur. Kustomize ermöglicht Overlays ohne den Zusatzaufwand eines Helm-Charts. Ergänzen Sie diese Manifeste um ein Helm-Chart, wenn Ihre Bereitstellung komplexer wird.

## Voraussetzungen

- Ein laufender Kubernetes-Cluster (AKS, EKS, GKE, k3s, kind, OpenShift usw.)
- `kubectl`, verbunden mit Ihrem Cluster
- Ein API-Schlüssel für mindestens einen Modell-Provider

## Schnellstart

```bash
# Durch Ihren Provider ersetzen: ANTHROPIC, GEMINI, OPENAI oder OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh` erstellt standardmäßig eine Token-Authentifizierung. Rufen Sie das generierte Gateway-Token für die Control UI ab:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Für die lokale Fehlerdiagnose gibt `./scripts/k8s/deploy.sh --show-token` das Token nach der Bereitstellung aus.

## Lokale Tests mit Kind

Wenn Sie keinen Cluster haben, erstellen Sie mit [Kind](https://kind.sigs.k8s.io/) einen lokalen Cluster:

```bash
./scripts/k8s/create-kind.sh           # erkennt docker oder podman automatisch
./scripts/k8s/create-kind.sh --delete  # baut den Cluster ab
```

Stellen Sie anschließend wie gewohnt mit `./scripts/k8s/deploy.sh` bereit.

## Schritt für Schritt

### 1) Bereitstellen

**Option A: API-Schlüssel in der Umgebung (ein Schritt)**

```bash
# Durch Ihren Provider ersetzen: ANTHROPIC, GEMINI, OPENAI oder OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Das Skript erstellt ein Kubernetes-Secret mit dem API-Schlüssel und einem automatisch generierten Gateway-Token und führt anschließend die Bereitstellung durch. Wenn das Secret bereits vorhanden ist, bleiben das aktuelle Gateway-Token und alle nicht geänderten Provider-Schlüssel erhalten.

**Option B: Secret separat erstellen**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Fügen Sie einem der Befehle `--show-token` hinzu, um das Token für lokale Tests auf stdout auszugeben.

### 2) Auf das Gateway zugreifen

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Bereitgestellte Ressourcen

```text
Namespace: openclaw (über OPENCLAW_NAMESPACE konfigurierbar)
├── Deployment/openclaw        # Einzelner Pod, Init-Container + Gateway
├── Service/openclaw           # ClusterIP an Port 18789
├── PersistentVolumeClaim      # 10Gi für Agent-Status und Konfiguration
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway-Token + API-Schlüssel
```

## Anpassung

### Agent-Anweisungen

Bearbeiten Sie `AGENTS.md` in `scripts/k8s/manifests/configmap.yaml` und stellen Sie erneut bereit:

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

Vorhandene Provider-Schlüssel bleiben im Secret erhalten, sofern Sie sie nicht überschreiben.

Alternativ können Sie das Secret direkt patchen:

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
image: ghcr.io/openclaw/openclaw:slim # primär; offizieller Docker-Hub-Spiegel: openclaw/openclaw
```

### Zugriff über Port-Forwarding hinaus ermöglichen

Die Standardmanifeste binden das Gateway innerhalb des Pods an die Loopback-Schnittstelle. Dies funktioniert mit `kubectl port-forward`, jedoch nicht mit einem Kubernetes-`Service` oder einem Ingress-Pfad, der die Pod-IP direkt erreichen muss.

So machen Sie das Gateway über einen Ingress oder Load-Balancer verfügbar:

- Ändern Sie die Gateway-Bindung in `scripts/k8s/manifests/configmap.yaml` von `loopback` in eine Nicht-Loopback-Bindung, die Ihrem Bereitstellungsmodell entspricht.
- Lassen Sie die Gateway-Authentifizierung aktiviert und verwenden Sie einen geeigneten Einstiegspunkt mit TLS-Terminierung.
- Konfigurieren Sie die Control UI für den Remotezugriff gemäß dem unterstützten Websicherheitsmodell (beispielsweise HTTPS/Tailscale Serve und bei Bedarf explizit zugelassene Ursprünge).

## Erneut bereitstellen

```bash
./scripts/k8s/deploy.sh
```

Dadurch werden alle Manifeste angewendet und der Pod neu gestartet, damit Änderungen an Konfiguration oder Secrets übernommen werden.

## Abbau

```bash
./scripts/k8s/deploy.sh --delete
```

Dadurch werden der Namespace und alle darin enthaltenen Ressourcen einschließlich des PVC gelöscht.

## Architekturhinweise

- Das Gateway wird innerhalb des Pods standardmäßig an die Loopback-Schnittstelle gebunden. Daher ist die enthaltene Einrichtung für `kubectl port-forward` vorgesehen.
- Keine clusterweiten Ressourcen; alles befindet sich in einem einzelnen Namespace.
- Sicherheitshärtung: `readOnlyRootFilesystem`, `drop: ALL`-Fähigkeiten, Benutzer ohne Root-Rechte (UID 1000).
- Die Standardkonfiguration belässt die Control UI auf dem sichereren Pfad für lokalen Zugriff: Loopback-Bindung plus `kubectl port-forward` auf `http://127.0.0.1:18789`.
- Wenn Sie über den localhost-Zugriff hinausgehen, verwenden Sie das unterstützte Remote-Modell: HTTPS/Tailscale sowie die geeignete Gateway-Bindung und die Ursprungseinstellungen der Control UI.
- Secrets werden in einem temporären Verzeichnis generiert und direkt auf den Cluster angewendet; es wird kein Secret-Material in den Repository-Checkout geschrieben.

## Dateistruktur

```text
scripts/k8s/
├── deploy.sh                   # Erstellt Namespace + Secret, stellt über kustomize bereit
├── create-kind.sh              # Lokaler Kind-Cluster (erkennt docker/podman automatisch)
└── manifests/
    ├── kustomization.yaml      # Kustomize-Basis
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod-Spezifikation mit Sicherheitshärtung
    ├── pvc.yaml                # 10Gi persistenter Speicher
    └── service.yaml            # ClusterIP an 18789
```

## Verwandte Themen

- [Docker](/de/install/docker)
- [Docker-VM-Laufzeit](/de/install/docker-vm-runtime)
- [Installationsübersicht](/de/install)
