---
read_when:
    - Chcesz uruchomić OpenClaw w klastrze Kubernetes
    - Chcesz przetestować OpenClaw w środowisku Kubernetes
summary: Wdróż OpenClaw Gateway w klastrze Kubernetes za pomocą Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-12T15:13:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Minimalny punkt wyjścia do uruchamiania OpenClaw w Kubernetes, a nie wdrożenie gotowe do użycia produkcyjnego. Obejmuje podstawowe zasoby i jest przeznaczony do dostosowania do Twojego środowiska.

## Dlaczego nie Helm

OpenClaw to pojedynczy kontener z kilkoma plikami konfiguracyjnymi. Istotne możliwości dostosowania dotyczą zawartości agenta (plików Markdown, Skills i nadpisań konfiguracji), a nie szablonów infrastruktury. Kustomize obsługuje nakładki bez narzutu związanego z wykresem Helm. Jeśli wdrożenie stanie się bardziej złożone, możesz utworzyć wykres Helm oparty na tych manifestach.

## Czego potrzebujesz

- Działającego klastra Kubernetes (AKS, EKS, GKE, k3s, kind, OpenShift itp.)
- Narzędzia `kubectl` połączonego z klastrem
- Klucza API co najmniej jednego dostawcy modeli

## Szybki start

```bash
# Zastąp nazwą dostawcy: ANTHROPIC, GEMINI, OPENAI lub OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Skrypt `deploy.sh` domyślnie tworzy uwierzytelnianie za pomocą tokenu. Pobierz wygenerowany token Gateway dla interfejsu sterowania:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Na potrzeby lokalnego debugowania polecenie `./scripts/k8s/deploy.sh --show-token` wyświetla token po wdrożeniu.

## Testowanie lokalne za pomocą Kind

Jeśli nie masz klastra, utwórz go lokalnie za pomocą narzędzia [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # automatycznie wykrywa docker lub podman
./scripts/k8s/create-kind.sh --delete  # usuwa środowisko
```

Następnie wykonaj wdrożenie w zwykły sposób za pomocą polecenia `./scripts/k8s/deploy.sh`.

## Krok po kroku

### 1) Wdróż

**Opcja A: klucz API w środowisku (jeden krok)**

```bash
# Zastąp nazwą dostawcy: ANTHROPIC, GEMINI, OPENAI lub OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Skrypt tworzy obiekt Kubernetes Secret z kluczem API i automatycznie wygenerowanym tokenem Gateway, a następnie wykonuje wdrożenie. Jeśli obiekt Secret już istnieje, zachowuje bieżący token Gateway oraz klucze dostawców, które nie są zmieniane.

**Opcja B: utwórz sekret osobno**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Dodaj `--show-token` do dowolnego z tych poleceń, aby na potrzeby lokalnego testowania wyświetlić token na standardowym wyjściu.

### 2) Uzyskaj dostęp do Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Co zostanie wdrożone

```text
Przestrzeń nazw: openclaw (konfigurowalna za pomocą OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pojedynczy pod, kontener inicjujący + Gateway
├── Service/openclaw           # ClusterIP na porcie 18789
├── PersistentVolumeClaim      # 10 GiB na stan i konfigurację agenta
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Token Gateway + klucze API
```

## Dostosowywanie

### Instrukcje agenta

Edytuj plik `AGENTS.md` w `scripts/k8s/manifests/configmap.yaml` i ponownie wykonaj wdrożenie:

```bash
./scripts/k8s/deploy.sh
```

### Konfiguracja Gateway

Edytuj plik `openclaw.json` w `scripts/k8s/manifests/configmap.yaml`. Pełne informacje znajdziesz w [dokumentacji konfiguracji Gateway](/pl/gateway/configuration).

### Dodawanie dostawców

Uruchom ponownie po wyeksportowaniu dodatkowych kluczy:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Istniejące klucze dostawców pozostają w obiekcie Secret, chyba że je nadpiszesz.

Możesz też bezpośrednio zmodyfikować obiekt Secret:

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
image: ghcr.io/openclaw/openclaw:slim # główny; oficjalny mirror Docker Hub: openclaw/openclaw
```

### Udostępnianie poza przekierowaniem portów

Domyślne manifesty wiążą Gateway z local loopback wewnątrz poda. Działa to z poleceniem `kubectl port-forward`, ale nie ze ścieżką Kubernetes `Service` ani Ingress, która musi uzyskać bezpośredni dostęp do adresu IP poda.

Aby udostępnić Gateway przez Ingress lub moduł równoważenia obciążenia:

- Zmień powiązanie Gateway w `scripts/k8s/manifests/configmap.yaml` z `loopback` na powiązanie inne niż local loopback, zgodne z modelem wdrożenia.
- Pozostaw włączone uwierzytelnianie Gateway i użyj odpowiedniego punktu wejścia z terminacją TLS.
- Skonfiguruj interfejs sterowania do dostępu zdalnego przy użyciu obsługiwanego modelu zabezpieczeń sieciowych (na przykład HTTPS/Tailscale Serve oraz jawnie dozwolonych źródeł, gdy jest to wymagane).

## Ponowne wdrożenie

```bash
./scripts/k8s/deploy.sh
```

Spowoduje to zastosowanie wszystkich manifestów i ponowne uruchomienie poda w celu uwzględnienia zmian konfiguracji lub sekretów.

## Usuwanie wdrożenia

```bash
./scripts/k8s/deploy.sh --delete
```

Spowoduje to usunięcie przestrzeni nazw i wszystkich znajdujących się w niej zasobów, w tym PVC.

## Uwagi dotyczące architektury

- Gateway domyślnie wiąże się z local loopback wewnątrz poda, dlatego dołączona konfiguracja jest przeznaczona dla polecenia `kubectl port-forward`.
- Brak zasobów o zasięgu klastra; wszystko znajduje się w jednej przestrzeni nazw.
- Wzmocnienie zabezpieczeń: `readOnlyRootFilesystem`, możliwości `drop: ALL`, użytkownik inny niż root (UID 1000).
- Domyślna konfiguracja utrzymuje interfejs sterowania na bezpieczniejszej ścieżce dostępu lokalnego: powiązanie z local loopback oraz `kubectl port-forward` do `http://127.0.0.1:18789`.
- Jeśli rozszerzysz dostęp poza localhost, użyj obsługiwanego modelu zdalnego: HTTPS/Tailscale wraz z odpowiednim powiązaniem Gateway i ustawieniami źródeł interfejsu sterowania.
- Sekrety są generowane w katalogu tymczasowym i stosowane bezpośrednio w klastrze; żadne dane poufne nie są zapisywane w kopii roboczej repozytorium.

## Struktura plików

```text
scripts/k8s/
├── deploy.sh                   # Tworzy przestrzeń nazw i sekret, wdraża za pomocą kustomize
├── create-kind.sh              # Lokalny klaster Kind (automatycznie wykrywa docker/podman)
└── manifests/
    ├── kustomization.yaml      # Baza Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Specyfikacja poda ze wzmocnionymi zabezpieczeniami
    ├── pvc.yaml                # 10 GiB trwałej pamięci masowej
    └── service.yaml            # ClusterIP na porcie 18789
```

## Powiązane

- [Docker](/pl/install/docker)
- [Środowisko uruchomieniowe maszyny wirtualnej Docker](/pl/install/docker-vm-runtime)
- [Omówienie instalacji](/pl/install)
