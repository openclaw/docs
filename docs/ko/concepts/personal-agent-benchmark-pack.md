---
read_when:
    - 로컬 개인 에이전트 안정성 검사 실행하기
    - 리포지토리 기반 QA 시나리오 카탈로그 확장하기
    - 미리 알림, 답장, 메모리, 민감 정보 삭제, 안전한 도구 후속 처리, 작업 상태, 안전하게 공유 가능한 진단 정보, 증거로 뒷받침되는 완료 주장 및 실패 복구 검증
summary: 개인정보 보호형 개인 비서 워크플로 검사를 위한 로컬 qa-channel 시나리오.
title: 개인 에이전트 벤치마크 팩
x-i18n:
    generated_at: "2026-07-12T00:42:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Personal Agent Benchmark Pack은 로컬 개인 비서 워크플로를 위한 저장소 기반의 소규모 QA 시나리오 팩입니다. 범용 모델 벤치마크가 아니며 새 러너도 필요하지 않습니다. 비공개 QA 스택([QA 개요](/ko/concepts/qa-e2e-automation)), 합성 [QA 채널](/ko/channels/qa-channel), 기존 `qa/scenarios` YAML 카탈로그를 재사용합니다.

## 시나리오

`qa/scenarios/personal/*.yaml`에 정의된 10개의 시나리오:

| 시나리오 ID                                | 검사 항목                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | 로컬 cron 전달을 통한 가상 개인 알림                                                               |
| `personal-channel-thread-reply`            | `qa-channel`을 통한 가상 DM 및 스레드 답장 라우팅                                                   |
| `personal-memory-preference-recall`        | 임시 QA 작업 공간 메모리 파일에서 가상 기본 설정 불러오기                                           |
| `personal-redaction-no-secret-leak`        | 가상 비밀 정보가 출력되지 않는지 검사                                                               |
| `personal-tool-safety-followthrough`       | 짧은 승인 형식의 대화 후 안전한 읽기 기반 도구 후속 실행                                            |
| `personal-approval-denial-stop`            | 민감한 로컬 읽기 요청에 대한 승인 거부 시 중단 동작                                                 |
| `personal-task-followthrough-status`       | 대기 중, 차단됨, 완료를 구분하여 유지하는 증거 기반 작업 상태 보고                                  |
| `personal-share-safe-diagnostics-artifact` | 원본 개인 콘텐츠는 생략하면서 유용한 상태를 유지하는 안전하게 공유 가능한 진단 아티팩트             |
| `personal-no-fake-progress`                | 로컬 증거가 존재하기 전에 허위 진행 상황을 보고하지 않는 증거 기반 완료 주장                        |
| `personal-failure-recovery`                | 부분 상태를 보고하고 재시도 경계를 명확히 유지하는 실패 복구                                        |

기계 판독 가능한 팩 메타데이터(ID 목록, 제목, 설명)는 `extensions/qa-lab/src/scenario-packs.ts`의 `QA_PERSONAL_AGENT_SCENARIO_IDS`에 있습니다. `--pack personal-agent`로 팩을 실행합니다.

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack`은 반복되는 `--scenario` 플래그와 함께 추가로 적용됩니다. 명시적 시나리오가 먼저 실행된 다음, 중복을 제거한 팩 시나리오가 `QA_PERSONAL_AGENT_SCENARIO_IDS` 순서대로 실행됩니다.

이 팩은 `mock-openai` 또는 다른 로컬 QA 제공자 실행 경로와 함께 `qa-channel`을 대상으로 합니다. 라이브 채팅 서비스나 실제 개인 계정을 대상으로 지정하지 마세요.

## 개인정보 보호 모델

시나리오는 가상 사용자, 가상 기본 설정, 가상 비밀 정보와 제품군이 생성한 임시 QA Gateway 작업 공간만 사용합니다. 실제 OpenClaw 사용자의 메모리, 세션, 자격 증명, 시작 에이전트, 전역 구성 또는 라이브 Gateway 상태를 읽거나 쓰면 안 됩니다.

아티팩트는 기존 QA 제품군 아티팩트 디렉터리 아래에 유지되며 테스트 출력처럼 취급됩니다. 삭제 처리는 가상 마커를 사용하므로 실패 결과를 안전하게 검사하고 이슈에 등록할 수 있습니다.

## 팩 확장

`qa/scenarios/personal/` 아래에 새 `.yaml` 사례를 추가한 다음 시나리오 ID를 `QA_PERSONAL_AGENT_SCENARIO_IDS`에 추가합니다. 각 사례는 작고 로컬에서 실행되며 `mock-openai`에서 결정론적으로 동작하고, 하나의 개인 비서 동작에 집중해야 합니다.

적합한 후속 후보: 삭제 처리된 궤적 내보내기 검사, 로컬 전용 Plugin 워크플로 검사.

시나리오 카탈로그에 해당 표면을 정당화할 만큼 안정적인 사례가 충분히 쌓이기 전까지는 새 러너, Plugin, 종속성, 라이브 전송 수단 또는 모델 판정기를 추가하지 마세요.
