---
read_when:
    - Chcesz uruchomić OpenClaw w klastrze Kubernetes
    - Chcesz przetestować OpenClaw w środowisku Kubernetes
summary: Wdróż OpenClaw Gateway w klastrze Kubernetes za pomocą Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:44:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

Minimalny punkt startowy do uruchamiania OpenClaw na Kubernetes — nie jest to wdrożenie gotowe do produkcji. Obejmuje podstawowe zasoby i ma być dostosowany do Twojego środowiska.

## Dlaczego nie Helm?

OpenClaw to pojedynczy kontener z kilkoma plikami konfiguracyjnymi. Najważniejsze dostosowania dotyczą treści agenta (pliki markdown, Skills, nadpisania konfiguracji), a nie szablonowania infrastruktury. Kustomize obsługuje nakładki bez narzutu wykresu Helm. Jeśli Twoje wdrożenie stanie się bardziej złożone, wykres Helm można nałożyć na te manifesty.

## Czego potrzebujesz

- Działający klaster Kubernetes (AKS, EKS, GKE, k3s, kind, OpenShift itd.)
- `kubectl` połączony z Twoim klastrem
- Klucz API dla co najmniej jednego dostawcy modelu

## Szybki start

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Pobierz skonfigurowany współdzielony sekret dla Control UI. Ten skrypt wdrożeniowy
domyślnie tworzy uwierzytelnianie tokenem:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Do lokalnego debugowania `./scripts/k8s/deploy.sh --show-token` wypisuje token po wdrożeniu.

## Lokalne testowanie z Kind

Jeśli nie masz klastra, utwórz go lokalnie za pomocą [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Następnie wdróż jak zwykle za pomocą `./scripts/k8s/deploy.sh`.

## Krok po kroku

### 1) Wdróż

**Opcja A** — klucz API w środowisku (jeden krok):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Skrypt tworzy Kubernetes Secret z kluczem API i automatycznie wygenerowanym tokenem Gateway, a następnie wdraża. Jeśli Secret już istnieje, zachowuje bieżący token Gateway oraz wszystkie klucze dostawców, które nie są zmieniane.

**Opcja B** — utwórz sekret osobno:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Użyj `--show-token` z dowolnym poleceniem, jeśli chcesz wypisać token na stdout do lokalnego testowania.

### 2) Uzyskaj dostęp do Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Co zostaje wdrożone

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Dostosowywanie

### Instrukcje agenta

Edytuj `AGENTS.md` w `scripts/k8s/manifests/configmap.yaml` i wdróż ponownie:

```bash
./scripts/k8s/deploy.sh
```

### Konfiguracja Gateway

Edytuj `openclaw.json` w `scripts/k8s/manifests/configmap.yaml`. Pełną dokumentację znajdziesz w [konfiguracji Gateway](/pl/gateway/configuration).

### Dodawanie dostawców

Uruchom ponownie z wyeksportowanymi dodatkowymi kluczami:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Istniejące klucze dostawców pozostają w Secret, chyba że je nadpiszesz.

Możesz też spatchować Secret bezpośrednio:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Niestandardowa przestrzeń nazw

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Niestandardowy obraz

Edytuj pole `image` w `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### Udostępnienie poza port-forward

Domyślne manifesty wiążą Gateway z adresem loopback wewnątrz poda. Działa to z `kubectl port-forward`, ale nie działa ze ścieżką Kubernetes `Service` ani Ingress, która musi dotrzeć do adresu IP poda.

Jeśli chcesz udostępnić Gateway przez Ingress lub load balancer:

- Zmień wiązanie Gateway w `scripts/k8s/manifests/configmap.yaml` z `loopback` na wiązanie inne niż loopback, które pasuje do Twojego modelu wdrożenia
- Pozostaw włączone uwierzytelnianie Gateway i użyj właściwego punktu wejścia z zakończeniem TLS
- Skonfiguruj Control UI do zdalnego dostępu za pomocą obsługiwanego modelu bezpieczeństwa WWW (na przykład HTTPS/Tailscale Serve i jawnie dozwolone originy, gdy są potrzebne)

## Ponowne wdrożenie

```bash
./scripts/k8s/deploy.sh
```

To stosuje wszystkie manifesty i restartuje pod, aby uwzględnić wszelkie zmiany konfiguracji lub sekretów.

## Usuwanie wdrożenia

```bash
./scripts/k8s/deploy.sh --delete
```

To usuwa przestrzeń nazw i wszystkie znajdujące się w niej zasoby, w tym PVC.

## Uwagi architektoniczne

- Gateway domyślnie wiąże się z loopback wewnątrz poda, więc dołączona konfiguracja jest przeznaczona dla `kubectl port-forward`
- Brak zasobów o zasięgu klastra — wszystko znajduje się w jednej przestrzeni nazw
- Bezpieczeństwo: `readOnlyRootFilesystem`, uprawnienia `drop: ALL`, użytkownik inny niż root (UID 1000)
- Domyślna konfiguracja utrzymuje Control UI na bezpieczniejszej ścieżce dostępu lokalnego: wiązanie loopback plus `kubectl port-forward` do `http://127.0.0.1:18789`
- Jeśli wychodzisz poza dostęp z localhost, użyj obsługiwanego modelu zdalnego: HTTPS/Tailscale oraz odpowiednie ustawienia wiązania Gateway i originów Control UI
- Sekrety są generowane w katalogu tymczasowym i stosowane bezpośrednio do klastra — żaden materiał sekretów nie jest zapisywany w checkoutcie repozytorium

## Struktura plików

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

## Powiązane

- [Docker](/pl/install/docker)
- [Środowisko uruchomieniowe Docker VM](/pl/install/docker-vm-runtime)
- [Przegląd instalacji](/pl/install)
