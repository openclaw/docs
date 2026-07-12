---
read_when:
    - Kubernetes 클러스터에서 OpenClaw를 실행하려고 합니다
    - Kubernetes 환경에서 OpenClaw를 테스트하려고 합니다
summary: Kustomize를 사용하여 Kubernetes 클러스터에 OpenClaw Gateway 배포하기
title: 쿠버네티스
x-i18n:
    generated_at: "2026-07-12T00:51:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

OpenClaw을 Kubernetes에서 실행하기 위한 최소한의 시작점이며, 프로덕션용으로 준비된 배포는 아닙니다. 핵심 리소스를 다루며 사용 환경에 맞게 조정하는 것을 전제로 합니다.

## Helm을 사용하지 않는 이유

OpenClaw은 몇 개의 구성 파일이 포함된 단일 컨테이너입니다. 중요한 사용자 지정 요소는 인프라 템플릿이 아니라 에이전트 콘텐츠(Markdown 파일, Skills, 구성 재정의)에 있습니다. Kustomize는 Helm 차트의 부가 부담 없이 오버레이를 처리합니다. 배포가 더 복잡해지면 이 매니페스트 위에 Helm 차트를 추가하세요.

## 필요한 항목

- 실행 중인 Kubernetes 클러스터(AKS, EKS, GKE, k3s, kind, OpenShift 등)
- 클러스터에 연결된 `kubectl`
- 하나 이상의 모델 제공자용 API 키

## 빠른 시작

```bash
# 사용 중인 제공자로 교체: ANTHROPIC, GEMINI, OPENAI 또는 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh`는 기본적으로 토큰 인증을 생성합니다. Control UI에서 사용할 생성된 Gateway 토큰을 가져오려면 다음을 실행하세요.

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

로컬 디버깅 시 `./scripts/k8s/deploy.sh --show-token`을 사용하면 배포 후 토큰이 출력됩니다.

## Kind를 사용한 로컬 테스트

클러스터가 없다면 [Kind](https://kind.sigs.k8s.io/)를 사용하여 로컬에 생성하세요.

```bash
./scripts/k8s/create-kind.sh           # docker 또는 podman 자동 감지
./scripts/k8s/create-kind.sh --delete  # 제거
```

그런 다음 평소처럼 `./scripts/k8s/deploy.sh`를 사용하여 배포하세요.

## 단계별 안내

### 1) 배포

**옵션 A: 환경 변수의 API 키 사용(한 단계)**

```bash
# 사용 중인 제공자로 교체: ANTHROPIC, GEMINI, OPENAI 또는 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

스크립트는 API 키와 자동 생성된 Gateway 토큰이 포함된 Kubernetes Secret을 생성한 후 배포합니다. Secret이 이미 존재하면 현재 Gateway 토큰과 변경하지 않는 제공자 키를 유지합니다.

**옵션 B: Secret을 별도로 생성**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

로컬 테스트를 위해 토큰을 표준 출력에 표시하려면 두 명령 중 하나에 `--show-token`을 추가하세요.

### 2) Gateway에 접근

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 배포되는 항목

```text
네임스페이스: openclaw (OPENCLAW_NAMESPACE로 구성 가능)
├── Deployment/openclaw        # 단일 파드, 초기화 컨테이너 + Gateway
├── Service/openclaw           # 포트 18789의 ClusterIP
├── PersistentVolumeClaim      # 에이전트 상태 및 구성용 10Gi
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway 토큰 + API 키
```

## 사용자 지정

### 에이전트 지침

`scripts/k8s/manifests/configmap.yaml`의 `AGENTS.md`를 편집하고 다시 배포하세요.

```bash
./scripts/k8s/deploy.sh
```

### Gateway 구성

`scripts/k8s/manifests/configmap.yaml`의 `openclaw.json`을 편집하세요. 전체 참조는 [Gateway 구성](/ko/gateway/configuration)을 확인하세요.

### 제공자 추가

추가 키를 내보낸 상태로 다시 실행하세요.

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

기존 제공자 키는 덮어쓰지 않는 한 Secret에 유지됩니다.

또는 Secret을 직접 패치하세요.

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

`scripts/k8s/manifests/deployment.yaml`의 `image` 필드를 편집하세요.

```yaml
image: ghcr.io/openclaw/openclaw:slim # 기본 이미지; 공식 Docker Hub 미러: openclaw/openclaw
```

### 포트 포워딩 외부로 공개

기본 매니페스트는 파드 내부에서 Gateway를 local loopback에 바인딩합니다. 이는 `kubectl port-forward`에서는 작동하지만, 파드 IP에 직접 연결해야 하는 Kubernetes `Service` 또는 Ingress 경로에서는 작동하지 않습니다.

Ingress 또는 로드 밸런서를 통해 Gateway를 공개하려면 다음을 수행하세요.

- `scripts/k8s/manifests/configmap.yaml`에서 Gateway 바인딩을 `loopback`에서 배포 모델에 맞는 비 local loopback 바인딩으로 변경합니다.
- Gateway 인증을 활성화된 상태로 유지하고 TLS가 적절히 종료되는 진입점을 사용합니다.
- 지원되는 웹 보안 모델을 사용하여 원격 접근용 Control UI를 구성합니다(예: HTTPS/Tailscale Serve 및 필요한 경우 명시적으로 허용된 출처).

## 재배포

```bash
./scripts/k8s/deploy.sh
```

이 명령은 모든 매니페스트를 적용하고 파드를 재시작하여 구성 또는 Secret 변경 사항을 반영합니다.

## 제거

```bash
./scripts/k8s/deploy.sh --delete
```

이 명령은 PVC를 포함하여 네임스페이스와 그 안의 모든 리소스를 삭제합니다.

## 아키텍처 참고 사항

- Gateway는 기본적으로 파드 내부의 local loopback에 바인딩되므로, 포함된 설정은 `kubectl port-forward`용입니다.
- 클러스터 범위 리소스는 없으며 모든 항목이 단일 네임스페이스에 존재합니다.
- 보안 강화: `readOnlyRootFilesystem`, `drop: ALL` 기능, 루트가 아닌 사용자(UID 1000).
- 기본 구성은 Control UI를 더 안전한 로컬 접근 경로에 유지합니다. local loopback 바인딩과 `http://127.0.0.1:18789`로 연결되는 `kubectl port-forward`를 함께 사용합니다.
- localhost 외부에서 접근하려면 지원되는 원격 모델을 사용하세요. HTTPS/Tailscale과 적절한 Gateway 바인딩 및 Control UI 출처 설정을 함께 사용합니다.
- Secret은 임시 디렉터리에서 생성되어 클러스터에 직접 적용되며, Secret 내용은 저장소 체크아웃에 기록되지 않습니다.

## 파일 구조

```text
scripts/k8s/
├── deploy.sh                   # 네임스페이스 + Secret 생성, kustomize를 통해 배포
├── create-kind.sh              # 로컬 Kind 클러스터(docker/podman 자동 감지)
└── manifests/
    ├── kustomization.yaml      # Kustomize 기반 구성
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # 보안 강화가 적용된 파드 사양
    ├── pvc.yaml                # 10Gi 영구 스토리지
    └── service.yaml            # 18789 포트의 ClusterIP
```

## 관련 문서

- [Docker](/ko/install/docker)
- [Docker VM 런타임](/ko/install/docker-vm-runtime)
- [설치 개요](/ko/install)
