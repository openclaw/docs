---
permalink: /security/formal-verification/
read_when:
    - 공식 보안 모델의 보장 사항 또는 한계 검토하기
    - TLA+/TLC 보안 모델 검사 재현 또는 업데이트
summary: OpenClaw의 최고 위험 경로를 위한 기계 검증 보안 모델.
title: 정형 검증(보안 모델)
x-i18n:
    generated_at: "2026-07-12T01:11:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

OpenClaw의 형식적 보안 모델(현재 TLA+/TLC)은 명시적으로 기술된 가정 아래에서 권한 부여, 세션 격리, 도구 게이팅, 잘못된 구성에 대한 안전성 등 위험도가 가장 높은 특정 경로가 의도한 정책을 시행한다는 것을 기계적으로 검증된 논증으로 제공합니다.

> 참고: 일부 이전 링크에서는 과거 프로젝트 이름을 사용할 수 있습니다.

## 개요

실행 가능하며 공격자 관점에서 구성된 보안 회귀 테스트 모음입니다.

- 각 주장은 유한한 상태 공간에서 실행 가능한 모델 검사를 포함합니다.
- 많은 주장에는 현실적인 버그 유형에 대한 반례 추적을 생성하는 대응 부정 모델이 있습니다.

이는 OpenClaw가 모든 측면에서 안전하다는 **증명은 아니며**, 전체 TypeScript 구현을 검증하지도 않습니다.

## 모델 위치

모델은 별도의 저장소인 [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)에서 관리됩니다.

<Note>
현재 해당 저장소에 접근할 수 없습니다(이 글을 작성하는 시점에 GitHub에서 "Repository not found"를 반환함). 계속 접근할 수 없다면 모델이 제거되었다고 단정하기 전에 OpenClaw 유지관리자 채널에서 현재 위치를 문의하세요.
</Note>

## 주의 사항

- 이는 전체 TypeScript 구현이 아닌 모델이므로 모델과 코드 사이에 차이가 발생할 수 있습니다.
- 결과는 TLC가 탐색하는 상태 공간으로 제한됩니다. 통과 결과가 모델링된 가정과 범위를 벗어난 보안까지 보장하지는 않습니다.
- 일부 주장은 명시적인 환경 가정(예: 올바른 배포 및 올바른 구성 입력)에 의존합니다.

## 결과 재현

모델 저장소를 복제하고 TLC를 실행합니다.

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned tla2tools.jar and provides bin/tlc plus Make targets.

make <target>
```

아직 이 저장소로 연동되는 CI는 없습니다. 향후에는 공개 결과물(반례 추적, 실행 로그)을 제공하는 CI 실행 모델이나 소규모의 제한된 검사를 위한 호스팅형 "이 모델 실행" 워크플로를 추가할 수 있습니다.

## 주장 및 대상

### Gateway 노출 및 개방형 Gateway의 잘못된 구성

**주장:** 인증 없이 루프백 외부에 바인딩하면 원격 침해가 가능해지고 노출이 증가할 수 있습니다. 모델의 가정에 따르면 토큰이나 비밀번호는 인증되지 않은 공격자를 차단합니다.

| 결과        | 대상                                                             |
| ----------- | ---------------------------------------------------------------- |
| 통과        | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| 실패(예상) | `make gateway-exposure-v2-negative`                              |

모델 저장소의 `docs/gateway-exposure-matrix.md`도 참조하세요.

### Node 실행 파이프라인(위험도가 가장 높은 기능)

**주장:** 모델에서 `exec host=node`를 사용하려면 (a) 선언된 명령과 함께 Node 명령 허용 목록이 필요하고, (b) 그렇게 구성된 경우 실시간 승인이 필요합니다. 승인은 재사용 공격을 방지하도록 토큰화됩니다.

| 결과        | 대상                                                            |
| ----------- | --------------------------------------------------------------- |
| 통과        | `make nodes-pipeline`, `make approvals-token`                   |
| 실패(예상) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### 페어링 저장소(DM 게이팅)

**주장:** 페어링 요청은 TTL과 대기 중인 요청 수 제한을 준수합니다.

| 결과        | 대상                                                 |
| ----------- | ---------------------------------------------------- |
| 통과        | `make pairing`, `make pairing-cap`                   |
| 실패(예상) | `make pairing-negative`, `make pairing-cap-negative` |

### 인그레스 게이팅(멘션 및 제어 명령 우회)

**주장:** 멘션이 필요한 그룹 컨텍스트에서 권한이 없는 제어 명령은 멘션 게이팅을 우회할 수 없습니다.

| 결과        | 대상                           |
| ----------- | ------------------------------ |
| 통과        | `make ingress-gating`          |
| 실패(예상) | `make ingress-gating-negative` |

### 라우팅 및 세션 키 격리

**주장:** 서로 다른 상대의 DM은 명시적으로 연결하거나 구성하지 않는 한 같은 세션으로 합쳐지지 않습니다.

| 결과        | 대상                              |
| ----------- | --------------------------------- |
| 통과        | `make routing-isolation`          |
| 실패(예상) | `make routing-isolation-negative` |

## v1++ 모델: 동시성, 재시도, 추적 정확성

비원자적 업데이트, 재시도, 메시지 팬아웃 등 실제 환경의 실패 모드에 대한 충실도를 강화하는 후속 모델입니다.

### 페어링 저장소의 동시성 및 멱등성

**주장:** 페어링 저장소는 실행 순서가 뒤섞이는 상황에서도 `MaxPending`과 멱등성을 보장합니다. 즉, 확인 후 쓰기 작업은 원자적이거나 잠금으로 보호되어야 하며 새로 고침은 중복을 생성해서는 안 됩니다. 구체적으로 동시 요청은 채널의 `MaxPending`을 초과할 수 없으며, 동일한 `(channel, sender)`에 대한 반복 요청이나 새로 고침은 활성 상태인 대기 행을 중복 생성하지 않습니다.

| 결과        | 대상                                                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 통과        | `make pairing-race`(원자적/잠금 기반 제한 검사), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                                            |
| 실패(예상) | `make pairing-race-negative`(비원자적 시작/커밋 제한 경합), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative`       |

### 인그레스 추적 상관관계 및 멱등성

**주장:** 수집 과정은 팬아웃 전체에서 추적 상관관계를 유지하며 공급자의 재시도에도 멱등성을 보장합니다. 하나의 외부 이벤트가 여러 내부 메시지로 변환될 때 모든 부분은 동일한 추적/이벤트 ID를 유지하고, 재시도로 인해 중복 처리되지 않습니다. 공급자 이벤트 ID가 없으면 서로 다른 이벤트가 누락되지 않도록 중복 제거에 안전한 키(예: 추적 ID)를 대신 사용합니다.

| 결과        | 대상                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 통과        | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| 실패(예상) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### 라우팅 `dmScope` 우선순위 및 `identityLinks`

**주장:** 라우팅은 기본적으로 DM 세션을 격리하며, 채널 우선순위와 ID 연결을 통해 명시적으로 구성된 경우에만 세션을 통합합니다. 채널별 `dmScope` 재정의는 전역 기본값보다 우선하며, `identityLinks`는 명시적으로 연결된 그룹 내에서만 세션을 통합하고 서로 관련 없는 상대 간에는 통합하지 않습니다.

| 결과        | 대상                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| 통과        | `make routing-precedence`, `make routing-identitylinks`                   |
| 실패(예상) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## 관련 문서

- [위협 모델](/ko/security/THREAT-MODEL-ATLAS)
- [위협 모델 기여 방법](/ko/security/CONTRIBUTING-THREAT-MODEL)
- [인시던트 대응](/ko/security/incident-response)
