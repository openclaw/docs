---
read_when:
    - Kubernetes 클러스터에서 OpenClaw를 실행하려는 경우
    - Kubernetes 환경에서 OpenClaw를 테스트하려는 경우
summary: Kustomize로 Kubernetes 클러스터에 OpenClaw Gateway 배포하기
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:43:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

OpenClaw를 Kubernetes에서 실행하기 위한 최소 시작점입니다. 프로덕션 준비가 된 배포가 아닙니다. 핵심 리소스를 다루며, 사용자의 환경에 맞게 조정하는 것을 전제로 합니다.

## Helm을 사용하지 않는 이유

OpenClaw는 몇 가지 구성 파일이 있는 단일 컨테이너입니다. 중요한 사용자 지정은 인프라 템플릿이 아니라 에이전트 콘텐츠(마크다운 파일, Skills, 구성 재정의)에 있습니다. Kustomize는 Helm 차트의 부담 없이 오버레이를 처리합니다. 배포가 더 복잡해지면 이 매니페스트 위에 Helm 차트를 레이어로 올릴 수 있습니다.

## 필요한 것

- 실행 중인 Kubernetes 클러스터(AKS, EKS, GKE, k3s, kind, OpenShift 등)
- 클러스터에 연결된 `kubectl`
- 하나 이상의 모델 제공자용 API 키

## 빠른 시작

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Control UI에 대해 구성된 공유 시크릿을 가져옵니다. 이 배포 스크립트는
기본적으로 토큰 인증을 생성합니다.

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

로컬 디버깅의 경우, `./scripts/k8s/deploy.sh --show-token`은 배포 후 토큰을 출력합니다.

## Kind를 사용한 로컬 테스트

클러스터가 없다면 [Kind](https://kind.sigs.k8s.io/)로 로컬에 클러스터를 생성하세요.

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

그런 다음 평소처럼 `./scripts/k8s/deploy.sh`로 배포합니다.

## 단계별 안내

### 1) 배포

**옵션 A** — 환경 변수에 API 키 설정(한 단계):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

이 스크립트는 API 키와 자동 생성된 Gateway 토큰이 포함된 Kubernetes Secret을 만든 다음 배포합니다. Secret이 이미 있으면 현재 Gateway 토큰과 변경되지 않는 모든 제공자 키를 보존합니다.

**옵션 B** — 시크릿을 별도로 생성:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

로컬 테스트를 위해 토큰을 stdout에 출력하려면 어느 명령에서든 `--show-token`을 사용하세요.

### 2) Gateway에 접근

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 배포되는 항목

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## 사용자 지정

### 에이전트 지침

`scripts/k8s/manifests/configmap.yaml`의 `AGENTS.md`를 편집하고 다시 배포합니다.

```bash
./scripts/k8s/deploy.sh
```

### Gateway 구성

`scripts/k8s/manifests/configmap.yaml`의 `openclaw.json`을 편집합니다. 전체 참조는 [Gateway 구성](/ko/gateway/configuration)을 참조하세요.

### 제공자 추가

추가 키를 내보낸 상태로 다시 실행합니다.

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

기존 제공자 키는 덮어쓰지 않는 한 Secret에 유지됩니다.

또는 Secret을 직접 패치합니다.

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### 사용자 지정 네임스페이스

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### 사용자 지정 이미지

`scripts/k8s/manifests/deployment.yaml`의 `image` 필드를 편집합니다.

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### 포트 포워딩 너머로 노출

기본 매니페스트는 Gateway를 포드 내부의 루프백에 바인딩합니다. 이는 `kubectl port-forward`와 함께 동작하지만, 포드 IP에 도달해야 하는 Kubernetes `Service` 또는 Ingress 경로에서는 동작하지 않습니다.

Ingress 또는 로드 밸런서를 통해 Gateway를 노출하려면:

- `scripts/k8s/manifests/configmap.yaml`의 Gateway 바인딩을 `loopback`에서 배포 모델과 일치하는 비루프백 바인딩으로 변경합니다
- Gateway 인증을 활성화한 상태로 유지하고 적절한 TLS 종료 진입점을 사용합니다
- 지원되는 웹 보안 모델을 사용해 원격 액세스용 Control UI를 구성합니다(예: 필요한 경우 HTTPS/Tailscale Serve 및 명시적으로 허용된 오리진)

## 재배포

```bash
./scripts/k8s/deploy.sh
```

이 명령은 모든 매니페스트를 적용하고 구성 또는 시크릿 변경 사항을 반영하도록 포드를 다시 시작합니다.

## 제거

```bash
./scripts/k8s/deploy.sh --delete
```

이 명령은 PVC를 포함해 네임스페이스와 그 안의 모든 리소스를 삭제합니다.

## 아키텍처 참고 사항

- Gateway는 기본적으로 포드 내부의 루프백에 바인딩되므로 포함된 설정은 `kubectl port-forward`용입니다
- 클러스터 범위 리소스 없음 — 모든 것이 단일 네임스페이스에 있습니다
- 보안: `readOnlyRootFilesystem`, `drop: ALL` capabilities, 루트가 아닌 사용자(UID 1000)
- 기본 구성은 Control UI를 더 안전한 로컬 액세스 경로에 유지합니다: 루프백 바인딩과 `kubectl port-forward`를 통한 `http://127.0.0.1:18789`
- localhost 액세스를 넘어서는 경우 지원되는 원격 모델을 사용하세요: HTTPS/Tailscale과 적절한 Gateway 바인딩 및 Control UI 오리진 설정
- 시크릿은 임시 디렉터리에서 생성되어 클러스터에 직접 적용됩니다 — 시크릿 자료는 repo checkout에 기록되지 않습니다

## 파일 구조

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

## 관련 항목

- [Docker](/ko/install/docker)
- [Docker VM 런타임](/ko/install/docker-vm-runtime)
- [설치 개요](/ko/install)
