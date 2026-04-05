---
read_when:
    - Chcesz uruchomić OpenClaw w klastrze Kubernetes
    - Chcesz przetestować OpenClaw w środowisku Kubernetes
summary: Wdróż OpenClaw Gateway w klastrze Kubernetes za pomocą Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-05T13:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa39127de5a5571f117db3a1bfefd5815b5e6b594cc1df553e30fda882b2a408
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw w Kubernetes

Minimalny punkt wyjścia do uruchamiania OpenClaw w Kubernetes — nie jest to wdrożenie gotowe do produkcji. Obejmuje podstawowe zasoby i ma być dostosowane do Twojego środowiska.

## Dlaczego nie Helm?

OpenClaw to pojedynczy kontener z kilkoma plikami konfiguracyjnymi. Najciekawsze dostosowania dotyczą zawartości agenta (pliki markdown, Skills, nadpisania konfiguracji), a nie szablonowania infrastruktury. Kustomize obsługuje overlaye bez narzutu związanego z chartem Helm. Jeśli Twoje wdrożenie stanie się bardziej złożone, chart Helm można nałożyć na te manifesty.

## Czego potrzebujesz

- Działającego klastra Kubernetes (AKS, EKS, GKE, k3s, kind, OpenShift itd.)
- `kubectl` połączonego z Twoim klastrem
- Klucza API do co najmniej jednego providera modeli

## Szybki start

```bash
# Zastąp swoim providerem: ANTHROPIC, GEMINI, OPENAI lub OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Pobierz skonfigurowany współdzielony sekret dla interfejsu Control UI. Ten skrypt wdrożeniowy
domyślnie tworzy uwierzytelnianie tokenem:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Do lokalnego debugowania `./scripts/k8s/deploy.sh --show-token` wypisuje token po wdrożeniu.

## Lokalne testy z Kind

Jeśli nie masz klastra, utwórz go lokalnie za pomocą [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # automatycznie wykrywa docker lub podman
./scripts/k8s/create-kind.sh --delete  # usuwa klaster
```

Następnie wdrażaj jak zwykle za pomocą `./scripts/k8s/deploy.sh`.

## Krok po kroku

### 1) Wdrożenie

**Opcja A** — klucz API w środowisku (jeden krok):

```bash
# Zastąp swoim providerem: ANTHROPIC, GEMINI, OPENAI lub OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Skrypt tworzy Kubernetes Secret z kluczem API i automatycznie wygenerowanym tokenem gateway, a następnie wdraża zasoby. Jeśli Secret już istnieje, zachowuje bieżący token gateway oraz wszelkie klucze providerów, które nie są zmieniane.

**Opcja B** — utwórz sekret osobno:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Użyj `--show-token` z dowolnym poleceniem, jeśli chcesz wypisać token na stdout do lokalnych testów.

### 2) Dostęp do gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Co zostanie wdrożone

```
Namespace: openclaw (konfigurowane przez OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pojedynczy pod, kontener init + gateway
├── Service/openclaw           # ClusterIP na porcie 18789
├── PersistentVolumeClaim      # 10Gi na stan agenta i konfigurację
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Token gateway + klucze API
```

## Dostosowywanie

### Instrukcje agenta

Edytuj `AGENTS.md` w `scripts/k8s/manifests/configmap.yaml` i wdroż ponownie:

```bash
./scripts/k8s/deploy.sh
```

### Konfiguracja gateway

Edytuj `openclaw.json` w `scripts/k8s/manifests/configmap.yaml`. Pełną dokumentację referencyjną znajdziesz w [Gateway configuration](/gateway/configuration).

### Dodawanie providerów

Uruchom ponownie z dodatkowymi wyeksportowanymi kluczami:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Istniejące klucze providerów pozostają w Secret, chyba że je nadpiszesz.

Lub bezpośrednio zaktualizuj Secret:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Własna przestrzeń nazw

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Własny obraz

Edytuj pole `image` w `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # lub przypnij do konkretnej wersji z https://github.com/openclaw/openclaw/releases
```

### Udostępnienie poza port-forward

Domyślne manifesty wiążą gateway do loopback wewnątrz poda. To działa z `kubectl port-forward`, ale nie działa z Kubernetes `Service` ani ze ścieżką Ingress, która musi dotrzeć do IP poda.

Jeśli chcesz udostępnić gateway przez Ingress lub load balancer:

- Zmień bind gateway w `scripts/k8s/manifests/configmap.yaml` z `loopback` na bind inny niż loopback, zgodny z Twoim modelem wdrożenia
- Pozostaw uwierzytelnianie gateway włączone i użyj poprawnego entrypointu z terminacją TLS
- Skonfiguruj Control UI do zdalnego dostępu przy użyciu obsługiwanego modelu bezpieczeństwa webowego (na przykład HTTPS/Tailscale Serve i jawnie dozwolone origins, gdy są potrzebne)

## Ponowne wdrożenie

```bash
./scripts/k8s/deploy.sh
```

Spowoduje to zastosowanie wszystkich manifestów i restart poda, aby przejąć wszelkie zmiany konfiguracji lub sekretów.

## Usuwanie

```bash
./scripts/k8s/deploy.sh --delete
```

Usuwa to przestrzeń nazw i wszystkie zasoby w niej, w tym PVC.

## Uwagi architektoniczne

- Domyślnie gateway wiąże się do loopback wewnątrz poda, więc dołączona konfiguracja jest przeznaczona do `kubectl port-forward`
- Brak zasobów o zasięgu klastra — wszystko znajduje się w jednej przestrzeni nazw
- Bezpieczeństwo: `readOnlyRootFilesystem`, capabilities `drop: ALL`, użytkownik nie-root (UID 1000)
- Domyślna konfiguracja utrzymuje Control UI na bezpieczniejszej ścieżce dostępu lokalnego: bind loopback plus `kubectl port-forward` do `http://127.0.0.1:18789`
- Jeśli chcesz wyjść poza dostęp localhost, użyj obsługiwanego modelu zdalnego: HTTPS/Tailscale plus odpowiedni bind gateway i ustawienia origin dla Control UI
- Sekrety są generowane w katalogu tymczasowym i stosowane bezpośrednio do klastra — żadne materiały sekretów nie są zapisywane w checkout repozytorium

## Struktura plików

```
scripts/k8s/
├── deploy.sh                   # Tworzy przestrzeń nazw + sekret, wdraża przez kustomize
├── create-kind.sh              # Lokalny klaster Kind (automatycznie wykrywa docker/podman)
└── manifests/
    ├── kustomization.yaml      # Baza Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Spec poda z utwardzeniem bezpieczeństwa
    ├── pvc.yaml                # 10Gi trwałej pamięci
    └── service.yaml            # ClusterIP na 18789
```
