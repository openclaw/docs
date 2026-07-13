---
read_when:
    - Вы хотите запустить OpenClaw в кластере Kubernetes
    - Вы хотите протестировать OpenClaw в среде Kubernetes
summary: Развёртывание OpenClaw Gateway в кластере Kubernetes с помощью Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-13T19:53:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Минимальная отправная точка для запуска OpenClaw в Kubernetes, а не готовое к промышленной эксплуатации развертывание. Здесь рассматриваются основные ресурсы; предполагается, что вы адаптируете их к своей среде.

## Почему не Helm

OpenClaw — это один контейнер с несколькими файлами конфигурации. Основные возможности настройки относятся к содержимому агента (файлам Markdown, skills, переопределениям конфигурации), а не к шаблонизации инфраструктуры. Kustomize позволяет использовать наложения без дополнительных сложностей Helm-чарта. Если развертывание станет более сложным, добавьте Helm-чарт поверх этих манифестов.

## Что потребуется

- Работающий кластер Kubernetes (AKS, EKS, GKE, k3s, kind, OpenShift и т. д.)
- `kubectl`, подключенный к вашему кластеру
- Ключ API хотя бы одного поставщика моделей

## Быстрый старт

```bash
# Замените на своего поставщика: ANTHROPIC, GEMINI, OPENAI или OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh` по умолчанию создает аутентификацию по токену. Получите сгенерированный токен Gateway для интерфейса управления:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Для локальной отладки `./scripts/k8s/deploy.sh --show-token` выводит токен после развертывания.

## Локальное тестирование с Kind

Если у вас нет кластера, создайте его локально с помощью [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # автоматически определяет docker или podman
./scripts/k8s/create-kind.sh --delete  # удаление кластера
```

Затем выполните развертывание обычным способом с помощью `./scripts/k8s/deploy.sh`.

## Пошаговая инструкция

### 1) Развертывание

**Вариант A: ключ API в переменной среды (один шаг)**

```bash
# Замените на своего поставщика: ANTHROPIC, GEMINI, OPENAI или OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Скрипт создает Secret Kubernetes с ключом API и автоматически сгенерированным токеном Gateway, а затем выполняет развертывание. Если Secret уже существует, скрипт сохраняет текущий токен Gateway и все неизменяемые ключи поставщиков.

**Вариант B: отдельное создание секрета**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Добавьте `--show-token` к любой из команд, чтобы вывести токен в stdout для локального тестирования.

### 2) Доступ к Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Развертываемые ресурсы

```text
Пространство имен: openclaw (настраивается через OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Один под, init-контейнер + Gateway
├── Service/openclaw           # ClusterIP на порту 18789
├── PersistentVolumeClaim      # 10Gi для состояния и конфигурации агента
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Токен Gateway + ключи API
```

## Настройка

### Инструкции агента

Измените `AGENTS.md` в `scripts/k8s/manifests/configmap.yaml` и выполните повторное развертывание:

```bash
./scripts/k8s/deploy.sh
```

### Конфигурация Gateway

Измените `openclaw.json` в `scripts/k8s/manifests/configmap.yaml`. Полное справочное описание см. в разделе [Конфигурация Gateway](/ru/gateway/configuration).

### Добавление поставщиков

Повторно запустите развертывание, экспортировав дополнительные ключи:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Существующие ключи поставщиков остаются в Secret, если вы их не перезапишете.

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

Измените поле `image` в `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:slim # основной; официальное зеркало Docker Hub: openclaw/openclaw
```

### Доступ за пределами перенаправления портов

Манифесты по умолчанию привязывают Gateway к loopback-интерфейсу внутри пода. Это работает с `kubectl port-forward`, но не с Kubernetes `Service` или маршрутом Ingress, которому необходим прямой доступ к IP-адресу пода.

Чтобы открыть доступ к Gateway через Ingress или балансировщик нагрузки:

- Измените привязку Gateway в `scripts/k8s/manifests/configmap.yaml` с `loopback` на привязку не к loopback-интерфейсу, соответствующую вашей модели развертывания.
- Не отключайте аутентификацию Gateway и используйте надлежащую точку входа с терминацией TLS.
- Настройте интерфейс управления для удаленного доступа с использованием поддерживаемой модели веб-безопасности (например, HTTPS/Tailscale Serve и явно разрешенных источников, когда это необходимо).

## Повторное развертывание

```bash
./scripts/k8s/deploy.sh
```

Команда применяет все манифесты и перезапускает под, чтобы задействовать изменения конфигурации или секретов.

## Удаление

```bash
./scripts/k8s/deploy.sh --delete
```

Команда удаляет пространство имен и все его ресурсы, включая PVC.

## Примечания об архитектуре

- По умолчанию Gateway привязан к loopback-интерфейсу внутри пода, поэтому включенная конфигурация предназначена для `kubectl port-forward`.
- Ресурсы уровня кластера отсутствуют; все находится в одном пространстве имен.
- Усиление безопасности: `readOnlyRootFilesystem`, возможности `drop: ALL`, пользователь без прав root (UID 1000).
- Конфигурация по умолчанию оставляет интерфейс управления на более безопасном пути локального доступа: привязка к loopback-интерфейсу и `kubectl port-forward` со значением `http://127.0.0.1:18789`.
- Если требуется доступ не только с localhost, используйте поддерживаемую модель удаленного доступа: HTTPS/Tailscale, соответствующую привязку Gateway и настройки источников интерфейса управления.
- Секреты генерируются во временном каталоге и применяются непосредственно к кластеру; секретные данные не записываются в рабочую копию репозитория.

## Структура файлов

```text
scripts/k8s/
├── deploy.sh                   # Создает пространство имен и секрет, развертывает через kustomize
├── create-kind.sh              # Локальный кластер Kind (автоматически определяет docker/podman)
└── manifests/
    ├── kustomization.yaml      # Базовая конфигурация Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Спецификация пода с усиленной безопасностью
    ├── pvc.yaml                # Постоянное хранилище объемом 10Gi
    └── service.yaml            # ClusterIP на порту 18789
```

## Связанные разделы

- [Docker](/ru/install/docker)
- [Среда выполнения виртуальной машины Docker](/ru/install/docker-vm-runtime)
- [Обзор установки](/ru/install)
