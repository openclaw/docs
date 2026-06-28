---
read_when:
    - Ви хочете запустити OpenClaw у кластері Kubernetes
    - Ви хочете протестувати OpenClaw у середовищі Kubernetes
summary: Розгортання OpenClaw Gateway у кластері Kubernetes за допомогою Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:44:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

Мінімальна відправна точка для запуску OpenClaw на Kubernetes — не готове до production розгортання. Вона охоплює основні ресурси й призначена для адаптації до вашого середовища.

## Чому не Helm?

OpenClaw — це один контейнер із кількома файлами конфігурації. Найважливіша кастомізація міститься у вмісті агентів (Markdown-файли, Skills, перевизначення конфігурації), а не в шаблонізації інфраструктури. Kustomize обробляє оверлеї без накладних витрат Helm chart. Якщо ваше розгортання стане складнішим, Helm chart можна накласти поверх цих маніфестів.

## Що потрібно

- Запущений кластер Kubernetes (AKS, EKS, GKE, k3s, kind, OpenShift тощо)
- `kubectl`, підключений до вашого кластера
- API-ключ принаймні для одного постачальника моделей

## Швидкий старт

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Отримайте налаштований спільний секрет для Control UI. Цей скрипт розгортання
за замовчуванням створює автентифікацію через токен:

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

Потім розгортайте як зазвичай за допомогою `./scripts/k8s/deploy.sh`.

## Крок за кроком

### 1) Розгортання

**Варіант A** — API-ключ у середовищі (один крок):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Скрипт створює Kubernetes Secret з API-ключем і автоматично згенерованим токеном Gateway, а потім виконує розгортання. Якщо Secret уже існує, він зберігає поточний токен Gateway і всі ключі постачальників, які не змінюються.

**Варіант B** — створіть секрет окремо:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Використовуйте `--show-token` з будь-якою командою, якщо хочете вивести токен у stdout для локального тестування.

### 2) Доступ до Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Що розгортається

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Кастомізація

### Інструкції агента

Відредагуйте `AGENTS.md` у `scripts/k8s/manifests/configmap.yaml` і повторно розгорніть:

```bash
./scripts/k8s/deploy.sh
```

### Конфігурація Gateway

Відредагуйте `openclaw.json` у `scripts/k8s/manifests/configmap.yaml`. Повну довідку див. у [конфігурації Gateway](/uk/gateway/configuration).

### Додавання постачальників

Повторно запустіть із додатковими експортованими ключами:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Наявні ключі постачальників залишаються в Secret, якщо ви їх не перезапишете.

Або пропатчіть Secret напряму:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Користувацький namespace

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Користувацький образ

Відредагуйте поле `image` у `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### Відкриття доступу поза port-forward

Стандартні маніфести прив’язують Gateway до loopback усередині pod. Це працює з `kubectl port-forward`, але не працює з Kubernetes `Service` або шляхом Ingress, якому потрібно досягати IP pod.

Якщо ви хочете відкрити Gateway через Ingress або балансувальник навантаження:

- Змініть прив’язку Gateway у `scripts/k8s/manifests/configmap.yaml` з `loopback` на не-loopback-прив’язку, яка відповідає вашій моделі розгортання
- Залиште автентифікацію Gateway увімкненою та використовуйте належну TLS-терміновану точку входу
- Налаштуйте Control UI для віддаленого доступу з використанням підтримуваної моделі веббезпеки (наприклад, HTTPS/Tailscale Serve і явні дозволені origins, коли це потрібно)

## Повторне розгортання

```bash
./scripts/k8s/deploy.sh
```

Це застосовує всі маніфести й перезапускає pod, щоб підхопити будь-які зміни конфігурації або секретів.

## Видалення

```bash
./scripts/k8s/deploy.sh --delete
```

Це видаляє namespace і всі ресурси в ньому, включно з PVC.

## Архітектурні примітки

- Gateway за замовчуванням прив’язується до loopback усередині pod, тому включене налаштування призначене для `kubectl port-forward`
- Немає ресурсів на рівні кластера — усе розміщено в одному namespace
- Безпека: `readOnlyRootFilesystem`, можливості `drop: ALL`, користувач без root-прав (UID 1000)
- Стандартна конфігурація тримає Control UI на безпечнішому шляху локального доступу: прив’язка до loopback плюс `kubectl port-forward` до `http://127.0.0.1:18789`
- Якщо ви виходите за межі доступу з localhost, використовуйте підтримувану віддалену модель: HTTPS/Tailscale плюс відповідну прив’язку Gateway і налаштування origin для Control UI
- Секрети генеруються в тимчасовій директорії та застосовуються безпосередньо до кластера — жоден секретний матеріал не записується в checkout репозиторію

## Структура файлів

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

## Пов’язане

- [Docker](/uk/install/docker)
- [Docker VM runtime](/uk/install/docker-vm-runtime)
- [Огляд встановлення](/uk/install)
