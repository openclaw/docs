---
read_when:
    - 로컬 개인 에이전트 안정성 검사 실행
    - repo 기반 QA 시나리오 카탈로그 확장하기
    - 알림, 답장, 메모리, 비공개 처리, 안전한 도구 후속 처리, 작업 상태, 공유하기 안전한 진단, 증거 기반 완료 주장, 실패 복구 검증
summary: 개인정보를 보호하는 개인 비서 워크플로 검사에 사용하는 로컬 qa-channel 시나리오.
title: 개인용 에이전트 벤치마크 팩
x-i18n:
    generated_at: "2026-06-27T17:24:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

개인 에이전트 벤치마크 팩은 로컬 개인 비서 워크플로를 위한 작은 저장소 기반 QA 시나리오 팩입니다. 이는 일반 모델 벤치마크가 아니며 새 러너가 필요하지 않습니다. 이 팩은 [QA 개요](/ko/concepts/qa-e2e-automation)에 설명된 비공개 QA 스택, 합성 [QA 채널](/ko/channels/qa-channel), 기존 `qa/scenarios` YAML 카탈로그를 재사용합니다.

첫 번째 팩은 의도적으로 범위가 좁습니다.

- 로컬 cron 전달을 통한 가짜 개인 알림
- `qa-channel`을 통한 가짜 DM 및 스레드 답장 라우팅
- 임시 QA 워크스페이스 메모리 파일에서 가짜 선호도 회상
- 가짜 비밀 무반복 출력 검사
- 짧은 승인 스타일 턴 이후 안전한 읽기 기반 도구 후속 처리
- 민감한 로컬 읽기 요청에 대한 승인 거부 중지 동작
- 대기 중, 차단됨, 완료를 분리해서 유지하는 증거 기반 작업 상태 보고
- 원본 개인 콘텐츠를 생략하면서 유용한 상태를 유지하는 공유 안전 진단 아티팩트
- 로컬 증거가 존재하기 전에 가짜 진행 상황을 피하는 증거 기반 완료 주장
- 부분 상태를 보고하고 재시도 경계를 명확하게 유지하는 실패 복구

## 시나리오

기계가 읽을 수 있는 팩 메타데이터는 `extensions/qa-lab/src/scenario-packs.ts`에 있습니다. `--pack personal-agent`로 팩을 실행하세요.

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack`은 반복되는 `--scenario` 플래그와 함께 추가적으로 적용됩니다. 명시적 시나리오가 먼저 실행된 다음, 중복이 제거된 상태로 `QA_PERSONAL_AGENT_SCENARIO_IDS` 순서에 따라 팩 시나리오가 실행됩니다.

이 팩은 `mock-openai` 또는 다른 로컬 QA 제공자 레인과 함께 `qa-channel`용으로 설계되었습니다. 라이브 채팅 서비스나 실제 개인 계정을 대상으로 지정해서는 안 됩니다.

## 개인정보 모델

시나리오는 가짜 사용자, 가짜 선호도, 가짜 비밀, 그리고 스위트가 생성한 임시 QA Gateway 워크스페이스만 사용합니다. 실제 OpenClaw 사용자 메모리, 세션, 자격 증명, launch agent, 전역 구성 또는 라이브 Gateway 상태를 읽거나 쓰면 안 됩니다.

아티팩트는 기존 QA 스위트 아티팩트 디렉터리 아래에 유지되며 테스트 출력처럼 취급해야 합니다. 수정 검사에는 가짜 마커를 사용하므로 실패를 안전하게 검사하고 이슈에 등록할 수 있습니다.

## 팩 확장

새 `.yaml` 케이스를 `qa/scenarios/personal/` 아래에 추가한 다음, 시나리오 ID를 `QA_PERSONAL_AGENT_SCENARIO_IDS`에 추가하세요. 각 케이스는 작고, 로컬이며, `mock-openai`에서 결정적이고, 하나의 개인 비서 동작에 집중해야 합니다.

좋은 후속 후보:

- 수정된 trajectory 내보내기 검사
- 로컬 전용 plugin 워크플로 검사

시나리오 카탈로그에 해당 표면을 정당화할 만큼 안정적인 케이스가 충분히 쌓이기 전까지는 새 러너, plugin, 의존성, 라이브 전송 또는 모델 판정기를 추가하지 마세요.
