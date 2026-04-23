---
read_when:
    - Render에 OpenClaw 배포하기
    - Render Blueprints를 사용한 선언적 클라우드 배포를 원합니다
summary: Infrastructure-as-Code로 Render에 OpenClaw 배포
title: Render
x-i18n:
    generated_at: "2026-04-23T14:04:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
---

# Render

Infrastructure as Code를 사용해 Render에 OpenClaw을 배포합니다. 포함된 `render.yaml` Blueprint는 서비스, 디스크, 환경 변수까지 전체 스택을 선언적으로 정의하므로, 한 번의 클릭으로 배포하고 코드와 함께 인프라 버전을 관리할 수 있습니다.

## 사전 준비

- [Render 계정](https://render.com)(무료 티어 사용 가능)
- 선호하는 [모델 provider](/ko/providers)의 API 키

## Render Blueprint로 배포

[Deploy to Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

이 링크를 클릭하면 다음이 수행됩니다:

1. 이 저장소 루트의 `render.yaml` Blueprint에서 새 Render 서비스를 생성합니다.
2. Docker 이미지를 빌드하고 배포합니다

배포가 완료되면 서비스 URL은 `https://<service-name>.onrender.com` 형식을 따릅니다.

## Blueprint 이해하기

Render Blueprint는 인프라를 정의하는 YAML 파일입니다. 이 저장소의 `render.yaml`은
OpenClaw 실행에 필요한 모든 것을 구성합니다:

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # 안전한 토큰 자동 생성
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

사용된 주요 Blueprint 기능:

| 기능               | 용도                                                    |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | 저장소의 Dockerfile에서 빌드                          |
| `healthCheckPath`     | Render가 `/health`를 모니터링하고 비정상 인스턴스를 재시작 |
| `generateValue: true` | 암호학적으로 안전한 값을 자동 생성            |
| `disk`                | 재배포 후에도 유지되는 영구 저장소                 |

## 플랜 선택

| 플랜      | 자동 중지         | 디스크          | 적합한 용도                      |
| --------- | ----------------- | ------------- | ----------------------------- |
| Free      | 15분 유휴 후 | 사용 불가 | 테스트, 데모                |
| Starter   | 없음             | 1GB+          | 개인 사용, 소규모 팀     |
| Standard+ | 없음             | 1GB+          | 프로덕션, 여러 채널 |

Blueprint의 기본값은 `starter`입니다. 무료 티어를 사용하려면
포크한 저장소의 `render.yaml`에서 `plan: free`로 변경하세요(단, 영구 디스크가 없으므로 OpenClaw 상태가
배포할 때마다 초기화된다는 점에 유의하세요).

## 배포 후

### Control UI 접속

웹 대시보드는 `https://<your-service>.onrender.com/`에서 사용할 수 있습니다.

구성된 공유 비밀을 사용해 연결하세요. 이 배포 템플릿은
`OPENCLAW_GATEWAY_TOKEN`을 자동 생성합니다(**Dashboard → your service →
Environment**에서 확인). 이를 비밀번호 인증으로 교체했다면 대신 해당 비밀번호를 사용하세요.

## Render Dashboard 기능

### 로그

**Dashboard → your service → Logs**에서 실시간 로그를 볼 수 있습니다. 다음으로 필터링할 수 있습니다:

- 빌드 로그(Docker 이미지 생성)
- 배포 로그(서비스 시작)
- 런타임 로그(애플리케이션 출력)

### Shell 접근

디버깅을 위해 **Dashboard → your service → Shell**을 통해 셸 세션을 열 수 있습니다. 영구 디스크는 `/data`에 마운트됩니다.

### 환경 변수

**Dashboard → your service → Environment**에서 변수를 수정합니다. 변경 사항은 자동 재배포를 트리거합니다.

### 자동 배포

원래 OpenClaw 저장소를 사용하는 경우, Render는 OpenClaw을 자동 배포하지 않습니다. 업데이트하려면 대시보드에서 수동 Blueprint 동기화를 실행하세요.

## 사용자 지정 도메인

1. **Dashboard → your service → Settings → Custom Domains**로 이동합니다
2. 도메인을 추가합니다
3. 안내에 따라 DNS를 구성합니다(`*.onrender.com`으로 CNAME)
4. Render가 TLS 인증서를 자동으로 프로비저닝합니다

## 스케일링

Render는 수평 및 수직 스케일링을 지원합니다:

- **수직**: 더 많은 CPU/RAM을 얻기 위해 플랜 변경
- **수평**: 인스턴스 수 증가(Standard 플랜 이상)

OpenClaw의 경우 일반적으로 수직 스케일링이면 충분합니다. 수평 스케일링에는 sticky session 또는 외부 상태 관리가 필요합니다.

## 백업 및 마이그레이션

Render Dashboard의 셸 접근을 사용해 언제든지 상태, 구성, auth profile, 워크스페이스를 내보낼 수 있습니다:

```bash
openclaw backup create
```

이 명령은 OpenClaw 상태와 구성된 워크스페이스를 포함하는 이식 가능한 백업 archive를 생성합니다. 자세한 내용은 [Backup](/ko/cli/backup)을 참조하세요.

## 문제 해결

### 서비스가 시작되지 않음

Render Dashboard의 배포 로그를 확인하세요. 일반적인 문제:

- `OPENCLAW_GATEWAY_TOKEN` 누락 — **Dashboard → Environment**에 설정되어 있는지 확인
- 포트 불일치 — Render가 기대하는 포트에 gateway가 바인드되도록 `OPENCLAW_GATEWAY_PORT=8080`이 설정되어 있는지 확인

### 느린 콜드 스타트(무료 티어)

무료 티어 서비스는 15분 동안 비활성 상태이면 자동 중지됩니다. 자동 중지 후 첫 번째 요청은 컨테이너가 시작되는 동안 몇 초가 걸립니다. 항상 켜두려면 Starter 플랜으로 업그레이드하세요.

### 재배포 후 데이터 손실

이 현상은 무료 티어(영구 디스크 없음)에서 발생합니다. 유료 플랜으로 업그레이드하거나,
Render 셸에서 `openclaw backup create`로 정기적으로 전체 백업을 내보내세요.

### 상태 확인 실패

Render는 30초 이내에 `/health`에서 200 응답을 기대합니다. 빌드는 성공하지만 배포가 실패한다면 서비스 시작에 너무 오래 걸리는 것일 수 있습니다. 다음을 확인하세요:

- 빌드 로그에 오류가 있는지
- 컨테이너가 로컬에서 `docker build && docker run`으로 실행되는지

## 다음 단계

- 메시징 채널 설정: [Channels](/ko/channels)
- Gateway 구성: [Gateway configuration](/ko/gateway/configuration)
- OpenClaw 최신 상태 유지: [Updating](/ko/install/updating)
