---
read_when:
    - 메모리 승격이 자동으로 실행되길 원합니다
    - 각 dreaming 단계가 무엇을 하는지 이해하고 싶습니다
    - MEMORY.md를 오염시키지 않고 통합을 조정하고 싶습니다
summary: Dream Diary와 함께 light, deep, REM 단계로 이루어진 백그라운드 메모리 통합
title: Dreaming (실험적)
x-i18n:
    generated_at: "2026-04-06T06:00:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36c4b1e70801d662090dc8ce20608c2f141c23cd7ce53c54e3dcf332c801fd4e
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (실험적)

Dreaming은 `memory-core`의 백그라운드 메모리 통합 시스템입니다.
이 기능은 OpenClaw가 강한 단기 신호를 오래 유지되는 메모리로 옮기도록 도우면서,
그 과정이 설명 가능하고 검토 가능하도록 유지합니다.

Dreaming은 **옵트인** 기능이며 기본적으로 비활성화되어 있습니다.

## dreaming이 기록하는 내용

Dreaming은 두 종류의 출력을 유지합니다.

- `memory/.dreams/`의 **머신 상태**(리콜 저장소, 단계 신호, 수집 체크포인트, 잠금).
- `DREAMS.md`(또는 기존 `dreams.md`)의 **사람이 읽을 수 있는 출력**, 그리고 선택적으로 `memory/dreaming/<phase>/YYYY-MM-DD.md` 아래의 단계 보고서 파일.

장기 승격은 계속해서 `MEMORY.md`에만 기록됩니다.

## 단계 모델

Dreaming은 협력적으로 동작하는 세 단계로 이루어져 있습니다.

| 단계 | 목적 | 영구 기록 |
| ----- | ---- | --------- |
| Light | 최근 단기 자료를 정렬하고 준비 | 아니요 |
| Deep  | 오래 유지할 후보를 점수화하고 승격 | 예 (`MEMORY.md`) |
| REM   | 주제와 반복되는 아이디어를 되돌아봄 | 아니요 |

이 단계들은 별도의 사용자 설정 "모드"가 아니라 내부 구현 세부 사항입니다.

### Light 단계

Light 단계는 최근 일일 메모리 신호와 리콜 추적을 수집하고, 중복을 제거한 뒤,
후보 줄을 준비합니다.

- 단기 리콜 상태와 최근 일일 메모리 파일에서 읽습니다.
- 저장소에 인라인 출력이 포함된 경우 관리되는 `## Light Sleep` 블록을 기록합니다.
- 이후 deep 순위 산정에 사용할 강화 신호를 기록합니다.
- 절대 `MEMORY.md`에 기록하지 않습니다.

### Deep 단계

Deep 단계는 무엇이 장기 메모리가 될지 결정합니다.

- 가중치가 적용된 점수와 임계값 게이트를 사용해 후보의 순위를 매깁니다.
- `minScore`, `minRecallCount`, `minUniqueQueries`를 모두 통과해야 합니다.
- 기록 전에 실제 일일 파일에서 스니펫을 다시 불러오므로, 오래되었거나 삭제된 스니펫은 건너뜁니다.
- 승격된 항목을 `MEMORY.md`에 추가합니다.
- `DREAMS.md`에 `## Deep Sleep` 요약을 기록하고, 선택적으로 `memory/dreaming/deep/YYYY-MM-DD.md`도 기록합니다.

### REM 단계

REM 단계는 패턴과 성찰 신호를 추출합니다.

- 최근 단기 추적에서 주제 및 성찰 요약을 만듭니다.
- 저장소에 인라인 출력이 포함된 경우 관리되는 `## REM Sleep` 블록을 기록합니다.
- deep 순위 산정에 사용되는 REM 강화 신호를 기록합니다.
- 절대 `MEMORY.md`에 기록하지 않습니다.

## Dream Diary

Dreaming은 또한 `DREAMS.md`에 서술형 **Dream Diary**를 유지합니다.
각 단계에 충분한 자료가 쌓이면 `memory-core`는 최선 노력 방식의 백그라운드
서브에이전트 턴을 실행하고(기본 런타임 모델 사용), 짧은 일지 항목을 추가합니다.

이 일지는 Dreams UI에서 사람이 읽기 위한 것이며, 승격 소스는 아닙니다.

## Deep 순위 산정 신호

Deep 순위 산정은 6개의 가중 기본 신호와 단계 강화 신호를 사용합니다.

| 신호 | 가중치 | 설명 |
| ------------------- | ------ | ------------------------------------------------- |
| 빈도 | 0.24 | 항목이 누적한 단기 신호 수 |
| 관련성 | 0.30 | 해당 항목의 평균 검색 품질 |
| 쿼리 다양성 | 0.15 | 해당 항목이 드러난 서로 다른 쿼리/일 컨텍스트 |
| 최신성 | 0.15 | 시간 감쇠가 적용된 최신성 점수 |
| 통합도 | 0.10 | 여러 날에 걸친 반복 강도 |
| 개념적 풍부함 | 0.06 | 스니펫/경로의 개념 태그 밀도 |

Light 및 REM 단계 적중은
`memory/.dreams/phase-signals.json`에서 작은 최신성 감쇠 부스트를 추가합니다.

## 일정 관리

활성화되면 `memory-core`는 전체 dreaming 스윕을 위한 cron 작업 하나를 자동 관리합니다.
각 스윕은 단계를 순서대로 실행합니다: light -> REM -> deep.

기본 주기 동작:

| 설정 | 기본값 |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## 빠른 시작

dreaming 활성화:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

사용자 지정 스윕 주기로 dreaming 활성화:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## 슬래시 명령어

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI 워크플로

미리 보기 또는 수동 적용에는 CLI 승격을 사용하세요.

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

수동 `memory promote`는 CLI 플래그로 재정의하지 않는 한 기본적으로 deep 단계 임계값을 사용합니다.

특정 후보가 왜 승격되거나 승격되지 않는지 설명합니다.

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

아무것도 기록하지 않고 REM 성찰, 후보 사실, deep 승격 출력을 미리 봅니다.

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 주요 기본값

모든 설정은 `plugins.entries.memory-core.config.dreaming` 아래에 있습니다.

| 키 | 기본값 |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

단계 정책, 임계값, 저장소 동작은 내부 구현 세부 사항이며
사용자 대상 설정이 아닙니다.

전체 키 목록은 [메모리 구성 참조](/ko/reference/memory-config#dreaming-experimental)를 참조하세요.

## Dreams UI

활성화되면 Gateway의 **Dreams** 탭에 다음이 표시됩니다.

- 현재 dreaming 활성화 상태
- 단계별 상태와 관리형 스윕 존재 여부
- 단기, 장기, 오늘 승격된 항목 수
- 다음 예약 실행 시각
- `doctor.memory.dreamDiary`를 기반으로 하는 확장 가능한 Dream Diary 리더

## 관련 항목

- [메모리](/ko/concepts/memory)
- [메모리 검색](/ko/concepts/memory-search)
- [memory CLI](/cli/memory)
- [메모리 구성 참조](/ko/reference/memory-config)
