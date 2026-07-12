---
read_when:
    - 로컬 개인 에이전트 안정성 검사 실행하기
    - 저장소 기반 QA 시나리오 카탈로그 확장하기
    - 리마인더, 답변, 메모리, 비식별화, 안전한 도구 후속 처리, 작업 상태, 안전하게 공유 가능한 진단 정보, 증거로 뒷받침되는 완료 주장 및 실패 복구를 검증합니다
summary: 개인정보 보호형 개인 비서 워크플로 점검을 위한 로컬 qa-channel 시나리오입니다.
title: 개인 에이전트 벤치마크 팩
x-i18n:
    generated_at: "2026-07-12T15:08:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Personal Agent Benchmark Pack은 로컬 개인 비서 워크플로를 위한, 저장소 기반의 소규모 QA 시나리오 팩입니다. 일반적인 모델 벤치마크가 아니며 새로운 실행기도 필요하지 않습니다. 비공개 QA 스택([QA 개요](/ko/concepts/qa-e2e-automation)), 합성 [QA 채널](/ko/channels/qa-channel), 기존 `qa/scenarios` YAML 카탈로그를 재사용합니다.

## 시나리오

`qa/scenarios/personal/*.yaml`에 정의된 10개 시나리오는 다음과 같습니다.

| 시나리오 ID                                | 검사 항목                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | 로컬 Cron 전송을 통한 가짜 개인 미리 알림                                                               |
| `personal-channel-thread-reply`            | `qa-channel`을 통한 가짜 DM 및 스레드 답글 라우팅                                                       |
| `personal-memory-preference-recall`        | 임시 QA 작업 공간 메모리 파일에서 가짜 선호 사항 불러오기                                               |
| `personal-redaction-no-secret-leak`        | 가짜 비밀 정보가 그대로 출력되지 않는지 검사                                                            |
| `personal-tool-safety-followthrough`       | 짧은 승인 형식 대화 후 읽기 결과를 기반으로 안전하게 도구 작업을 후속 수행                              |
| `personal-approval-denial-stop`            | 민감한 로컬 읽기 요청의 승인이 거부되었을 때 중단하는 동작                                              |
| `personal-task-followthrough-status`       | 대기 중, 차단됨, 완료를 구분하여 유지하는 증거 기반 작업 상태 보고                                      |
| `personal-share-safe-diagnostics-artifact` | 원시 개인 콘텐츠는 생략하면서 유용한 상태를 유지하는 안전하게 공유 가능한 진단 아티팩트                 |
| `personal-no-fake-progress`                | 로컬 증거가 존재하기 전에 진행 상황을 허위로 보고하지 않는 증거 기반 완료 보고                          |
| `personal-failure-recovery`                | 부분적인 상태를 보고하고 재시도 경계를 명확하게 유지하는 실패 복구                                      |

머신 리더블 팩 메타데이터(ID 목록, 제목, 설명)는 `extensions/qa-lab/src/scenario-packs.ts`의 `QA_PERSONAL_AGENT_SCENARIO_IDS`에 있습니다. `--pack personal-agent`로 팩을 실행하십시오.

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack`은 반복되는 `--scenario` 플래그와 함께 추가 방식으로 작동합니다. 명시적 시나리오가 먼저 실행된 다음, 중복이 제거된 팩 시나리오가 `QA_PERSONAL_AGENT_SCENARIO_IDS` 순서로 실행됩니다.

이 팩은 `mock-openai` 또는 다른 로컬 QA 제공자 레인과 함께 `qa-channel`을 대상으로 합니다. 라이브 채팅 서비스나 실제 개인 계정을 대상으로 지정하지 마십시오.

## 개인정보 보호 모델

시나리오에서는 가짜 사용자, 가짜 선호 사항, 가짜 비밀 정보와 제품군이 생성한 임시 QA Gateway 작업 공간만 사용합니다. 실제 OpenClaw 사용자 메모리, 세션, 자격 증명, 시작 에이전트, 전역 구성 또는 라이브 Gateway 상태를 읽거나 써서는 안 됩니다.

아티팩트는 기존 QA 제품군 아티팩트 디렉터리 아래에 유지되며 테스트 출력처럼 취급됩니다. 마스킹 검사는 가짜 마커를 사용하므로 실패 결과를 안전하게 검사하고 이슈에 등록할 수 있습니다.

## 팩 확장

`qa/scenarios/personal/` 아래에 새 `.yaml` 사례를 추가한 다음, 시나리오 ID를 `QA_PERSONAL_AGENT_SCENARIO_IDS`에 추가하십시오. 각 사례는 작고 로컬에서 실행되며 `mock-openai`에서 결정론적으로 동작해야 하고, 하나의 개인 비서 동작에 초점을 맞춰야 합니다.

적절한 후속 후보로는 마스킹된 실행 궤적 내보내기 검사와 로컬 전용 Plugin 워크플로 검사가 있습니다.

시나리오 카탈로그에 해당 표면을 정당화할 만큼 안정적인 사례가 충분히 쌓이기 전까지는 새 실행기, Plugin, 종속성, 라이브 전송 또는 모델 판정기를 추가하지 마십시오.
