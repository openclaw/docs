---
read_when:
    - 텔레메트리 / 개인정보 보호 제어 작업 중
    - 수집되는 데이터에 대한 질문
summary: 설치 텔레메트리는 `clawhub sync` + 옵트아웃을 통해 수집됩니다.
x-i18n:
    generated_at: "2026-05-11T22:20:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetry

ClawHub은 **최소한의 Telemetry**를 사용하여 **설치 수**(실제로 사용 중인 항목)를 계산하고 더 나은 정렬/필터링을 제공합니다.
이는 CLI `clawhub sync` 명령을 기반으로 합니다.

## Telemetry가 수집되는 시점

Telemetry는 다음 경우에만 전송됩니다.

- CLI에 **로그인되어** 있습니다(동기화/게시 흐름에는 이미 인증이 필요합니다).
- `clawhub sync`를 실행합니다.
- Telemetry가 **비활성화되어 있지 않습니다**(아래의 “비활성화 방법” 참고).

로그인되어 있지 않으면 아무것도 보고되지 않습니다.

## 수집하는 항목

각 `clawhub sync`에서 CLI는 스캔 루트(“폴더/루트”)별로 그룹화하여 발견한 항목의 **전체 스냅샷**을 보고합니다.

각 루트에 대해 다음을 저장합니다.

- `rootId`: 정규 루트 경로의 **SHA-256 해시**(서버는 원시 경로를 절대 보지 않습니다).
- `label`: 마지막 두 경로 세그먼트에서 파생된 사람이 읽을 수 있는 레이블(홈 경로는 `~`로 표시됩니다).
- `firstSeenAt`, `lastSeenAt`, 선택적 `expiredAt`.

루트 아래에서 발견된 각 skill에 대해 다음을 저장합니다.

- `skillId`(슬러그로 해석됨; 레지스트리에 존재하는 skill만 추적됩니다).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion`(최선의 추정; 현재는 알려진 경우 레지스트리와 일치한 버전).
- 이전에 보고된 설치가 루트에서 사라질 때 선택적 `removedAt`.

### 수집하지 _않는_ 항목

- 원시 절대 폴더 경로 없음(해시된 `rootId` + 짧은 표시 레이블만).
- 파일 내용 없음.
- 실행별 로그, 프롬프트 또는 기타 CLI 출력 없음.
- 레지스트리에 업로드되지 않은 skill은 추적하지 않음(알 수 없는 슬러그는 무시됩니다).

## 설치 수

skill마다 두 개의 카운터를 유지합니다.

- `installsCurrent`: 현재 하나 이상의 활성 루트에 해당 skill이 설치되어 있는 고유 사용자.
- `installsAllTime`: 해당 skill이 설치되어 있다고 보고한 적이 있는 고유 사용자.

### 여러 루트

여러 폴더에서 동기화하는 경우 각 스캔 루트를 독립적으로 처리합니다. skill이 **어느** 활성 루트에라도 존재하면 “현재 설치됨”으로 간주합니다.

### 제거 감지

`sync`가 루트별 전체 집합을 보고하므로:

- 다음 동기화에서 skill이 루트에서 사라지면 해당 루트에서 제거된 것으로 표시합니다.
- skill이 모든 루트에서 제거되면 더 이상 `installsCurrent`에 집계되지 않습니다.
- `installsAllTime`은 Telemetry를 삭제하지 않는 한 감소하지 않습니다(아래 참고).

### 오래된 상태(120일)

**120일** 동안 Telemetry를 보고하지 않은 루트는 오래된 것으로 표시되며, 해당 설치는 `installsCurrent` 집계에서 제외됩니다.
이는 백그라운드 작업을 피하기 위해 지연 평가됩니다(다음 Telemetry 보고 시).

## 투명성 + 사용자 제어

ClawHub은 사용자 본인 프로필에 비공개 “설치됨” 탭을 제공합니다.

- 저장된 정확한 루트 + 설치된 skill을 표시합니다.
- **JSON 내보내기** 보기를 포함합니다.
- 계정에 저장된 모든 Telemetry를 제거하는 **Telemetry 삭제** 작업을 포함합니다.

다른 모든 사람에게는 **집계된 설치 카운터**만 표시됩니다. 다른 누구도 사용자의 루트/폴더를 볼 수 없습니다.

계정을 삭제하면 Telemetry 데이터도 함께 삭제됩니다.

## Telemetry 비활성화 방법

환경 변수를 설정합니다.

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

이 설정이 있으면 CLI는 `clawhub sync` 중 Telemetry를 전송하지 않습니다.
