---
read_when:
    - Render에 OpenClaw 배포하기
    - Render Blueprints를 사용한 선언적 클라우드 배포를 원하는 경우
summary: 코드형 인프라로 Render에 OpenClaw 배포하기
title: 렌더링
x-i18n:
    generated_at: "2026-07-12T00:51:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

저장소의 `render.yaml` Blueprint를 사용하여 [Render](https://render.com)에 OpenClaw를 배포합니다. 이 파일 하나에 서비스, 디스크 및 환경 변수가 정의되어 있습니다.

## 사전 요구 사항

- [Render 계정](https://render.com)(무료 요금제 사용 가능)
- 선호하는 [모델 제공업체](/ko/providers)의 API 키

## 배포

[Render에 배포](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

이 작업은 `render.yaml`에서 Render 서비스를 생성하고 Docker 이미지를 빌드한 후 배포합니다. 서비스 URL은 `https://<service-name>.onrender.com` 형식을 따릅니다.

## Blueprint

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
        generateValue: true # 보안 토큰을 자동 생성
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| 기능                  | 용도                                                        |
| --------------------- | ----------------------------------------------------------- |
| `runtime: docker`     | 저장소의 Dockerfile에서 빌드                                |
| `healthCheckPath`     | Render가 `/health`를 모니터링하고 비정상 인스턴스를 재시작  |
| `generateValue: true` | 암호학적으로 안전한 값을 자동 생성                          |
| `disk`                | 재배포 후에도 유지되는 영구 스토리지                        |

## 요금제 선택

| 요금제    | 유휴 시 중지       | 디스크       | 적합한 용도                    |
| --------- | ------------------ | ------------ | ------------------------------ |
| 무료      | 15분 유휴 후       | 사용 불가    | 테스트, 데모                   |
| Starter   | 중지하지 않음      | 1GB 이상     | 개인용, 소규모 팀              |
| Standard+ | 중지하지 않음      | 1GB 이상     | 프로덕션, 여러 채널            |

Blueprint의 기본값은 `starter`입니다. 무료 요금제를 사용하려면 포크의 `render.yaml`에서 `plan: free`로 변경하세요. 영구 디스크가 없으므로 배포할 때마다 OpenClaw 상태가 초기화된다는 점에 유의하세요.

## 배포 후

### 제어 UI에 액세스

웹 대시보드는 `https://<your-service>.onrender.com/`에서 사용할 수 있습니다. 공유 비밀인 자동 생성된 `OPENCLAW_GATEWAY_TOKEN`(**Dashboard → your service → Environment**에서 확인)을 사용하거나, 비밀번호 인증으로 전환한 경우 비밀번호를 사용하여 연결하세요.

### 로그

**Dashboard → your service → Logs**에는 빌드 로그(Docker 이미지 생성), 배포 로그(서비스 시작), 런타임 로그(애플리케이션 출력)가 표시됩니다.

### 셸 액세스

**Dashboard → your service → Shell**에서 셸 세션을 엽니다. 영구 디스크는 `/data`에 마운트됩니다.

### 환경 변수

**Dashboard → your service → Environment**에서 변수를 편집합니다. 변경하면 자동으로 재배포됩니다.

### 자동 배포

연결된 저장소의 브랜치에 새 커밋이 추가되면 Render가 자동으로 재배포합니다. 자체 포크가 아닌 `openclaw/openclaw`에서 직접 배포한 경우 재배포를 트리거할 푸시 권한이 없으므로, Dashboard에서 수동으로 Blueprint 동기화를 실행하거나 서비스가 자체 포크를 가리키도록 설정하세요.

## 사용자 지정 도메인

1. **Dashboard → your service → Settings → Custom Domains**
2. 도메인을 추가합니다.
3. 안내에 따라 DNS를 구성합니다(`*.onrender.com`을 가리키는 CNAME).
4. Render가 TLS 인증서를 자동으로 프로비저닝합니다.

## 확장

- **수직 확장**: CPU/RAM을 늘리려면 요금제를 변경합니다. 일반적으로 OpenClaw에는 이 방식으로 충분합니다.
- **수평 확장**: 인스턴스 수를 늘립니다(Standard 요금제 이상). OpenClaw가 런타임 상태를 로컬 디스크에 보관하므로 고정 세션 또는 외부 상태 관리가 필요합니다.

## 백업 및 마이그레이션

Render Dashboard 셸에서 언제든지 상태, 구성, 인증 프로필 및 작업 공간을 내보낼 수 있습니다.

```bash
openclaw backup create
```

이 명령은 이동 가능한 백업 아카이브를 생성합니다. [백업](/ko/cli/backup)을 참조하세요.

## 문제 해결

### 서비스가 시작되지 않음

Render Dashboard에서 배포 로그를 확인하세요. 일반적인 문제는 다음과 같습니다.

- `OPENCLAW_GATEWAY_TOKEN` 누락 — **Dashboard → Environment**에 설정되어 있는지 확인하세요.
- 포트 불일치 — Gateway가 Render에서 예상하는 포트에 바인딩되도록 `OPENCLAW_GATEWAY_PORT=8080`인지 확인하세요.

### 느린 콜드 스타트(무료 요금제)

무료 요금제 서비스는 15분 동안 활동이 없으면 중지됩니다. 중지 후 첫 번째 요청에서는 컨테이너가 시작되는 동안 몇 초가 걸립니다. 상시 실행하려면 Starter로 업그레이드하세요.

### 재배포 후 데이터 손실

무료 요금제에서는 영구 디스크가 없어 이 문제가 발생합니다. 유료 요금제로 업그레이드하거나 Render 셸에서 `openclaw backup create`를 사용하여 정기적으로 백업을 내보내세요.

### 상태 확인 실패

빌드는 성공하지만 배포가 실패하는 경우 서비스 시작 시간이 너무 오래 걸리거나 `/health`에 연결할 수 없는 것일 수 있습니다. 다음을 확인하세요.

- 빌드 로그의 오류
- `docker build && docker run`을 사용하여 컨테이너가 로컬에서 실행되는지 여부

## 다음 단계

- 메시징 채널 설정: [채널](/ko/channels)
- Gateway 구성: [Gateway 구성](/ko/gateway/configuration)
- OpenClaw를 최신 상태로 유지: [업데이트](/ko/install/updating)
