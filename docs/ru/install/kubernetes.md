---
read_when:
    - Вы хотите запустить OpenClaw в кластере Kubernetes
    - Вы хотите протестировать OpenClaw в среде Kubernetes
summary: Развертывание OpenClaw Gateway в кластере Kubernetes с помощью Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T23:07:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

Минимальная отправная точка для запуска OpenClaw в Kubernetes — не готовое к production-развертывание. Она охватывает основные ресурсы и рассчитана на адаптацию под вашу среду.

## Почему не Helm?

OpenClaw — это один контейнер с несколькими файлами конфигурации. Основная кастомизация находится в содержимом агента (Markdown-файлы, Skills, переопределения конфигурации), а не в шаблонизации инфраструктуры. Kustomize обрабатывает оверлеи без накладных расходов Helm-чарта. Если ваше развертывание станет сложнее, Helm-чарт можно наложить поверх этих манифестов.

## Что вам нужно

- Работающий кластер Kubernetes (AKS, EKS, GKE, k3s, kind, OpenShift и т. д.)
- `kubectl`, подключенный к вашему кластеру
- API-ключ хотя бы для одного поставщика моделей

## Быстрый старт

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Получите настроенный общий секрет для Control UI. Этот скрипт развертывания
по умолчанию создает аутентификацию по токену:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Для локальной отладки `./scripts/k8s/deploy.sh --show-token` выводит токен после развертывания.

## Локальное тестирование с Kind

Если у вас нет кластера, создайте его локально с помощью [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Затем разверните как обычно с помощью `./scripts/k8s/deploy.sh`.

## Пошагово

### 1) Развертывание

**Вариант A** — API-ключ в окружении (один шаг):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Скрипт создает Kubernetes Secret с API-ключом и автоматически сгенерированным токеном Gateway, а затем выполняет развертывание. Если Secret уже существует, он сохраняет текущий токен Gateway и все ключи поставщиков, которые не меняются.

**Вариант B** — создать секрет отдельно:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Используйте `--show-token` с любой из команд, если хотите вывести токен в stdout для локального тестирования.

### 2) Доступ к Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Что развертывается

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Кастомизация

### Инструкции агента

Отредактируйте `AGENTS.md` в `scripts/k8s/manifests/configmap.yaml` и разверните повторно:

```bash
./scripts/k8s/deploy.sh
```

### Конфигурация Gateway

Отредактируйте `openclaw.json` в `scripts/k8s/manifests/configmap.yaml`. Полный справочник см. в разделе [конфигурация Gateway](/ru/gateway/configuration).

### Добавление провайдеров

Запустите повторно с экспортированными дополнительными ключами:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Существующие ключи провайдеров останутся в Secret, если вы их не перезапишете.

Или измените Secret напрямую:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Пользовательское пространство имен

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Пользовательский образ

Отредактируйте поле `image` в `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### Открытие доступа за пределами port-forward

Манифесты по умолчанию привязывают Gateway к loopback внутри пода. Это работает с `kubectl port-forward`, но не работает с Kubernetes `Service` или путем Ingress, которому нужно обращаться к IP пода.

Если вы хотите открыть доступ к Gateway через Ingress или балансировщик нагрузки:

- Измените привязку Gateway в `scripts/k8s/manifests/configmap.yaml` с `loopback` на не-loopback-привязку, соответствующую вашей модели развертывания
- Оставьте аутентификацию Gateway включенной и используйте корректную точку входа с завершением TLS
- Настройте Control UI для удаленного доступа с использованием поддерживаемой модели веб-безопасности (например, HTTPS/Tailscale Serve и явно разрешенные источники при необходимости)

## Повторное развертывание

```bash
./scripts/k8s/deploy.sh
```

Это применяет все манифесты и перезапускает под, чтобы подхватить любые изменения конфигурации или секретов.

## Удаление

```bash
./scripts/k8s/deploy.sh --delete
```

Это удаляет пространство имен и все ресурсы в нем, включая PVC.

## Заметки об архитектуре

- По умолчанию Gateway привязывается к loopback внутри пода, поэтому включенная настройка предназначена для `kubectl port-forward`
- Нет ресурсов уровня кластера — все находится в одном пространстве имен
- Безопасность: `readOnlyRootFilesystem`, возможности `drop: ALL`, пользователь без root-прав (UID 1000)
- Конфигурация по умолчанию оставляет Control UI на более безопасном пути локального доступа: привязка к loopback плюс `kubectl port-forward` на `http://127.0.0.1:18789`
- Если вы выходите за пределы доступа с localhost, используйте поддерживаемую удаленную модель: HTTPS/Tailscale плюс подходящая привязка Gateway и настройки источников Control UI
- Секреты генерируются во временном каталоге и применяются напрямую к кластеру — секретные данные не записываются в рабочую копию репозитория

## Структура файлов

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

## Связанные материалы

- [Docker](/ru/install/docker)
- [Среда выполнения Docker VM](/ru/install/docker-vm-runtime)
- [Обзор установки](/ru/install)
