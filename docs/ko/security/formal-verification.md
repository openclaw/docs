---
permalink: /security/formal-verification/
read_when:
    - 정형 보안 모델의 보장 사항 또는 한계 검토
    - TLA+/TLC 보안 모델 검사를 재현하거나 업데이트하기
summary: OpenClaw의 위험도가 가장 높은 경로를 위한 기계 검증 보안 모델.
title: 정형 검증(보안 모델)
x-i18n:
    generated_at: "2026-05-06T06:39:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
    postprocess_version: locale-links-v1
---

이 페이지는 OpenClaw의 **공식 보안 모델**(현재 TLA+/TLC, 필요에 따라 추가)을 추적합니다.

> 참고: 일부 오래된 링크는 이전 프로젝트 이름을 가리킬 수 있습니다.

**목표(북극성):** 명시적 가정하에 OpenClaw가 의도한 보안 정책(권한 부여, 세션 격리, 도구 게이팅, 잘못된 구성 안전성)을 강제한다는 것을 기계 검증된 논거로 제공하는 것입니다.

**현재 이것의 의미:** 실행 가능한, 공격자 주도 **보안 회귀 스위트**입니다.

- 각 주장은 유한 상태 공간에서 실행 가능한 모델 검사를 포함합니다.
- 많은 주장에는 현실적인 버그 유형에 대한 반례 추적을 생성하는 짝지어진 **음성 모델**이 있습니다.

**아직 이것이 아닌 것:** "OpenClaw가 모든 측면에서 안전하다"는 증명이나 전체 TypeScript 구현이 올바르다는 증명은 아닙니다.

## 모델 위치

모델은 별도 저장소에서 관리됩니다: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## 중요한 주의 사항

- 이것들은 전체 TypeScript 구현이 아니라 **모델**입니다. 모델과 코드 사이에 차이가 생길 수 있습니다.
- 결과는 TLC가 탐색한 상태 공간에 의해 제한됩니다. "성공"은 모델링된 가정과 경계를 넘어서는 보안을 의미하지 않습니다.
- 일부 주장은 명시적인 환경 가정(예: 올바른 배포, 올바른 구성 입력)에 의존합니다.

## 결과 재현

현재 결과는 모델 저장소를 로컬에 클론하고 TLC를 실행하여 재현합니다(아래 참조). 향후 반복에서는 다음을 제공할 수 있습니다.

- 공개 아티팩트(반례 추적, 실행 로그)가 포함된 CI 실행 모델
- 작고 경계가 정해진 검사를 위한 호스팅된 "이 모델 실행" 워크플로

시작하기:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Gateway 노출 및 열린 Gateway 잘못된 구성

**주장:** 인증 없이 loopback을 넘어 바인딩하면 원격 침해가 가능해지거나 노출이 증가할 수 있습니다. 토큰/비밀번호는 (모델 가정에 따라) 인증되지 않은 공격자를 차단합니다.

- 성공 실행:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 실패(예상):
  - `make gateway-exposure-v2-negative`

참고 항목: 모델 저장소의 `docs/gateway-exposure-matrix.md`.

### Node 실행 파이프라인(가장 위험도가 높은 기능)

**주장:** `exec host=node`에는 (a) node 명령 허용 목록과 선언된 명령, 그리고 (b) 구성된 경우 실시간 승인이 필요합니다. 승인은 (모델에서) 재사용 공격을 방지하기 위해 토큰화됩니다.

- 성공 실행:
  - `make nodes-pipeline`
  - `make approvals-token`
- 실패(예상):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### 페어링 저장소(DM 게이팅)

**주장:** 페어링 요청은 TTL과 대기 중인 요청 한도를 준수합니다.

- 성공 실행:
  - `make pairing`
  - `make pairing-cap`
- 실패(예상):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 인그레스 게이팅(멘션 + 제어 명령 우회)

**주장:** 멘션이 필요한 그룹 컨텍스트에서 권한이 없는 "제어 명령"은 멘션 게이팅을 우회할 수 없습니다.

- 성공:
  - `make ingress-gating`
- 실패(예상):
  - `make ingress-gating-negative`

### 라우팅/세션 키 격리

**주장:** 서로 다른 피어의 DM은 명시적으로 연결/구성되지 않는 한 같은 세션으로 합쳐지지 않습니다.

- 성공:
  - `make routing-isolation`
- 실패(예상):
  - `make routing-isolation-negative`

## v1++: 추가 경계 모델(동시성, 재시도, 추적 정확성)

이들은 실제 장애 모드(비원자적 업데이트, 재시도, 메시지 팬아웃)에 대한 충실도를 높이는 후속 모델입니다.

### 페어링 저장소 동시성 / 멱등성

**주장:** 페어링 저장소는 인터리빙 상황에서도 `MaxPending`과 멱등성을 강제해야 합니다(즉, "확인 후 쓰기"는 원자적이거나 잠금 처리되어야 하며, 새로 고침이 중복을 만들면 안 됩니다).

의미:

- 동시 요청 상황에서 채널의 `MaxPending`을 초과할 수 없습니다.
- 같은 `(channel, sender)`에 대한 반복 요청/새로 고침은 중복된 활성 대기 행을 만들면 안 됩니다.

- 성공 실행:
  - `make pairing-race`(원자적/잠금된 한도 검사)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- 실패(예상):
  - `make pairing-race-negative`(비원자적 begin/commit 한도 경쟁)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 인그레스 추적 상관관계 / 멱등성

**주장:** 수집은 팬아웃 전반에서 추적 상관관계를 보존해야 하며, 제공자 재시도 상황에서도 멱등적이어야 합니다.

의미:

- 하나의 외부 이벤트가 여러 내부 메시지가 될 때 모든 부분은 같은 추적/이벤트 ID를 유지합니다.
- 재시도로 인해 이중 처리가 발생하지 않습니다.
- 제공자 이벤트 ID가 없는 경우, 서로 다른 이벤트를 삭제하지 않도록 중복 제거는 안전한 키(예: 추적 ID)로 폴백합니다.

- 성공:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- 실패(예상):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### 라우팅 dmScope 우선순위 + identityLinks

**주장:** 라우팅은 기본적으로 DM 세션을 격리 상태로 유지해야 하며, 명시적으로 구성된 경우에만 세션을 합쳐야 합니다(채널 우선순위 + identity links).

의미:

- 채널별 dmScope 오버라이드는 전역 기본값보다 우선해야 합니다.
- identityLinks는 명시적으로 연결된 그룹 내에서만 합쳐야 하며, 관련 없는 피어 간에는 합쳐서는 안 됩니다.

- 성공:
  - `make routing-precedence`
  - `make routing-identitylinks`
- 실패(예상):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## 관련 항목

- [위협 모델](/ko/security/THREAT-MODEL-ATLAS)
- [위협 모델에 기여하기](/ko/security/CONTRIBUTING-THREAT-MODEL)
