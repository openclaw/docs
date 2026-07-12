---
read_when:
    - Ви хочете запустити OpenClaw у кластері Kubernetes
    - Ви хочете протестувати OpenClaw у середовищі Kubernetes
summary: Розгорніть OpenClaw Gateway у кластері Kubernetes за допомогою Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-12T13:18:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Мінімальна відправна точка для запуску OpenClaw у Kubernetes, а не готове до промислової експлуатації розгортання. Вона охоплює основні ресурси та призначена для адаптації до вашого середовища.

## Чому не Helm

OpenClaw — це один контейнер із кількома файлами конфігурації. Основні можливості налаштування стосуються вмісту агента (файлів Markdown, skills, перевизначень конфігурації), а не шаблонізації інфраструктури. Kustomize дає змогу використовувати накладення без додаткової складності Helm-чарту. Якщо ваше розгортання стане складнішим, побудуйте Helm-чарт поверх цих маніфестів.

## Що вам потрібно

- Працюючий кластер Kubernetes (AKS, EKS, GKE, k3s, kind, OpenShift тощо)
- `kubectl`, підключений до вашого кластера
- Ключ API принаймні одного постачальника моделей

## Швидкий початок

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

За замовчуванням `deploy.sh` створює автентифікацію за токеном. Отримайте згенерований токен Gateway для інтерфейсу керування:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Для локального налагодження `./scripts/k8s/deploy.sh --show-token` виводить токен після розгортання.

## Локальне тестування з Kind

Якщо у вас немає кластера, створіть його локально за допомогою [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Потім виконайте розгортання у звичайний спосіб за допомогою `./scripts/k8s/deploy.sh`.

## Покрокова інструкція

### 1) Розгортання

**Варіант A: ключ API у середовищі (один крок)**

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Скрипт створює Kubernetes Secret із ключем API та автоматично згенерованим токеном Gateway, а потім виконує розгортання. Якщо Secret уже існує, скрипт зберігає поточний токен Gateway і всі ключі постачальників, які не змінюються.

**Варіант B: створення секрету окремо**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Додайте `--show-token` до будь-якої команди, щоб вивести токен у стандартний потік виведення для локального тестування.

### 2) Доступ до Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Що розгортається

```text
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Налаштування

### Інструкції агента

Відредагуйте `AGENTS.md` у `scripts/k8s/manifests/configmap.yaml` і повторно виконайте розгортання:

```bash
./scripts/k8s/deploy.sh
```

### Конфігурація Gateway

Відредагуйте `openclaw.json` у `scripts/k8s/manifests/configmap.yaml`. Повний довідник наведено в розділі [Конфігурація Gateway](/uk/gateway/configuration).

### Додавання постачальників

Повторно запустіть скрипт, попередньо експортувавши додаткові ключі:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Наявні ключі постачальників залишаються в Secret, якщо ви їх не перезапишете.

Або безпосередньо оновіть Secret:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Власний простір імен

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Власний образ

Відредагуйте поле `image` у `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:slim # primary; official Docker Hub mirror: openclaw/openclaw
```

### Доступ поза межами перенаправлення порту

Стандартні маніфести прив’язують Gateway до local loopback усередині пода. Це працює з `kubectl port-forward`, але не з Kubernetes `Service` або маршрутом Ingress, якому потрібен прямий доступ до IP-адреси пода.

Щоб надати доступ до Gateway через Ingress або балансувальник навантаження:

- Змініть прив’язку Gateway у `scripts/k8s/manifests/configmap.yaml` з `loopback` на прив’язку, відмінну від loopback, яка відповідає вашій моделі розгортання.
- Залиште автентифікацію Gateway увімкненою та використовуйте належну точку входу із завершенням TLS.
- Налаштуйте інтерфейс керування для віддаленого доступу за допомогою підтримуваної моделі веббезпеки (наприклад, HTTPS/Tailscale Serve та явно дозволених джерел, коли це потрібно).

## Повторне розгортання

```bash
./scripts/k8s/deploy.sh
```

Ця команда застосовує всі маніфести та перезапускає под, щоб застосувати всі зміни конфігурації або секретів.

## Видалення

```bash
./scripts/k8s/deploy.sh --delete
```

Ця команда видаляє простір імен і всі ресурси в ньому, включно з PVC.

## Примітки щодо архітектури

- За замовчуванням Gateway прив’язується до local loopback усередині пода, тому включене налаштування призначене для `kubectl port-forward`.
- Ресурси рівня кластера відсутні; усе розміщується в одному просторі імен.
- Посилення безпеки: `readOnlyRootFilesystem`, можливості `drop: ALL`, користувач без прав root (UID 1000).
- Стандартна конфігурація залишає інтерфейс керування на безпечнішому шляху локального доступу: прив’язка до loopback і `kubectl port-forward` до `http://127.0.0.1:18789`.
- Якщо ви переходите від доступу через localhost до віддаленого доступу, використовуйте підтримувану віддалену модель: HTTPS/Tailscale разом із відповідною прив’язкою Gateway та налаштуваннями джерел інтерфейсу керування.
- Секрети генеруються в тимчасовому каталозі та застосовуються безпосередньо до кластера; жодні секретні дані не записуються до робочої копії репозиторію.

## Структура файлів

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

## Пов’язані матеріали

- [Docker](/uk/install/docker)
- [Середовище виконання віртуальної машини Docker](/uk/install/docker-vm-runtime)
- [Огляд встановлення](/uk/install)
