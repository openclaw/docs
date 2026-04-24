---
read_when:
    - Chcesz uruchomić OpenClaw w klastrze Kubernetes.
    - Chcesz testować OpenClaw w środowisku Kubernetes.
summary: Wdrażanie Gateway OpenClaw do klastra Kubernetes za pomocą Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T09:17:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw w Kubernetes

Minimalny punkt wyjścia do uruchamiania OpenClaw w Kubernetes — nie jest to wdrożenie gotowe do produkcji. Obejmuje podstawowe zasoby i ma być dostosowane do twojego środowiska.

## Dlaczego nie Helm?

OpenClaw to pojedynczy kontener z kilkoma plikami konfiguracyjnymi. Ciekawa personalizacja dotyczy treści agentów (pliki markdown, Skills, nadpisania konfiguracji), a nie templatyzacji infrastruktury. Kustomize obsługuje overlays bez narzutu wykresu Helm. Jeśli twoje wdrożenie stanie się bardziej złożone, można dołożyć chart Helm na bazie tych manifestów.

## Czego potrzebujesz

- działającego klastra Kubernetes (AKS, EKS, GKE, k3s, kind, OpenShift itd.)
- `kubectl` połączonego z twoim klastrem
- klucza API do co najmniej jednego dostawcy modeli

## Szybki start

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Pobierz skonfigurowany shared secret dla Control UI. Ten skrypt wdrożeniowy
domyślnie tworzy auth tokenem:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Do lokalnego debugowania `./scripts/k8s/deploy.sh --show-token` wypisuje token po wdrożeniu.

## Testy lokalne z Kind

Jeśli nie masz klastra, utwórz go lokalnie za pomocą [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Następnie wdrażaj jak zwykle przez `./scripts/k8s/deploy.sh`.

## Krok po kroku

### 1) Wdrożenie

**Opcja A** — klucz API w środowisku (jeden krok):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Skrypt tworzy Kubernetes Secret z kluczem API i automatycznie wygenerowanym tokenem gateway, a następnie wdraża wszystko. Jeśli Secret już istnieje, zachowuje bieżący token gateway i wszystkie klucze dostawców, które nie są zmieniane.

**Opcja B** — utwórz sekret osobno:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Użyj `--show-token` z dowolnym z tych poleceń, jeśli chcesz wypisać token na stdout do testów lokalnych.

### 2) Uzyskaj dostęp do gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Co jest wdrażane

```text
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Dostosowywanie

### Instrukcje agenta

Edytuj `AGENTS.md` w `scripts/k8s/manifests/configmap.yaml` i wdroż ponownie:

```bash
./scripts/k8s/deploy.sh
```

### Konfiguracja Gateway

Edytuj `openclaw.json` w `scripts/k8s/manifests/configmap.yaml`. Pełną dokumentację znajdziesz w [Konfiguracji Gateway](/pl/gateway/configuration).

### Dodawanie dostawców

Uruchom ponownie z wyeksportowanymi dodatkowymi kluczami:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Istniejące klucze dostawców pozostają w Secret, dopóki ich nie nadpiszesz.

Albo spatchuj Secret bezpośrednio:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Niestandardowy namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Niestandardowy obraz

Edytuj pole `image` w `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### Udostępnienie poza port-forward

Domyślne manifesty wiążą gateway z loopback wewnątrz poda. To działa z `kubectl port-forward`, ale nie działa z Kubernetes `Service` ani ścieżką Ingress, która musi dotrzeć do IP poda.

Jeśli chcesz wystawić gateway przez Ingress albo load balancer:

- Zmień bind gateway w `scripts/k8s/manifests/configmap.yaml` z `loopback` na bind nie-loopback zgodny z twoim modelem wdrożenia
- Utrzymaj włączone auth gateway i użyj właściwego punktu wejścia z terminacją TLS
- Skonfiguruj Control UI dla dostępu zdalnego przy użyciu obsługiwanego modelu bezpieczeństwa web (na przykład HTTPS/Tailscale Serve i jawnie dozwolone originy, gdy są potrzebne)

## Ponowne wdrożenie

```bash
./scripts/k8s/deploy.sh
```

To stosuje wszystkie manifesty i restartuje pod, aby pobrać wszelkie zmiany konfiguracji albo sekretów.

## Usuwanie

```bash
./scripts/k8s/deploy.sh --delete
```

To usuwa namespace i wszystkie zasoby w nim, w tym PVC.

## Uwagi architektoniczne

- Domyślnie gateway wiąże się z loopback wewnątrz poda, więc dołączona konfiguracja jest przeznaczona do `kubectl port-forward`
- Brak zasobów scoped do klastra — wszystko znajduje się w jednym namespace
- Bezpieczeństwo: `readOnlyRootFilesystem`, capability `drop: ALL`, użytkownik bez uprawnień root (UID 1000)
- Domyślna konfiguracja utrzymuje Control UI na bezpieczniejszej ścieżce dostępu lokalnego: bind loopback plus `kubectl port-forward` do `http://127.0.0.1:18789`
- Jeśli wychodzisz poza dostęp localhost, użyj obsługiwanego modelu zdalnego: HTTPS/Tailscale plus odpowiedni bind gateway i ustawienia originów Control UI
- Sekrety są generowane w katalogu tymczasowym i stosowane bezpośrednio do klastra — żaden materiał sekretów nie jest zapisywany do checkoutu repozytorium

## Struktura plików

```text
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

## Powiązane

- [Docker](/pl/install/docker)
- [Docker VM runtime](/pl/install/docker-vm-runtime)
- [Przegląd instalacji](/pl/install)
