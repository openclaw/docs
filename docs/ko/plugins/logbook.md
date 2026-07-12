---
read_when:
    - Control UI에서 하루를 Dayflow 스타일 타임라인으로 보고 싶습니다.
    - 번들로 제공되는 로그북 Plugin을 활성화하거나 구성하고 있습니다.
    - 화면 활동을 기반으로 한 스탠드업 요약이나 하루 회고가 필요한 경우
summary: 주기적인 화면 스냅샷으로 작성되는 선택적 자동 작업 일지
title: 로그북 Plugin
x-i18n:
    generated_at: "2026-07-12T00:57:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

Logbook Plugin은 화면 활동을 자동 작업 일지로 변환합니다. 페어링된 Node에서
주기적으로 화면 스냅샷을 캡처하고, 이를 타임스탬프가 포함된 관찰 기록으로
요약한 뒤 [Control UI](/ko/web/control-ui)에 타임라인 카드를 생성합니다. 일일
스탠드업 메모를 생성하고 추적된 날짜에 관한 질문에 답할 수도 있습니다.

OpenClaw 소유 상태는 Gateway의 `<state-dir>/logbook/` 아래에 유지되지만,
모델 처리가 반드시 로컬에서 이루어지는 것은 아닙니다. 샘플링된 스크린샷은
구성된 비전 경로로 전송되고, 관찰 기록과 타임라인 텍스트는 기본 에이전트
모델로 전송됩니다. 화면 콘텐츠와 여기서 파생된 활동 텍스트를 머신에
유지해야 한다면 두 단계 모두에 로컬 모델 경로를 사용하세요.

Logbook은 번들로 제공되며 기본적으로 비활성화되어 있습니다. Plugin을
활성화하면 `captureEnabled`의 기본값이 `true`이므로 Gateway에서 화면
캡처가 사용됩니다.

## 시작하기 전에

다음이 필요합니다.

- `screen.snapshot` 또는 `logbook.snapshot`을 노출하는 연결된 Node. macOS
  앱 Node에는 Screen Recording 권한이 필요합니다. 헤드리스 macOS Node
  호스트(`openclaw node host run`)에는 시스템 `screencapture` 도구를
  기반으로 Plugin에서 제공하는 `logbook.snapshot` 명령이 추가됩니다.
- 번들 Codex Plugin이 활성화되고 인증되어 있어야 합니다. 현재 Codex는
  Logbook에 필요한 구조화된 이미지 추출 계약을 제공합니다.
  `openclaw models auth login --provider openai`로 로그인하세요. 다른 인증
  경로는 [Codex 하네스](/ko/plugins/codex-harness)를 참조하세요.
- 정상적으로 작동하는 기본 에이전트 모델. Logbook은 비전 처리 후 이
  모델을 사용하여 카드, 스탠드업 메모, 날짜별 질의응답을 생성합니다.

## 빠른 시작

Codex 및 Logbook Plugin을 활성화합니다.

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

결정론적 시작을 위해 명시적인 비전 모델을 구성합니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

`plugins.allow`를 사용하는 경우 `codex`와 `logbook`을 모두 포함하세요.
Plugin 구성을 변경한 후 Gateway를 다시 시작하고, 등록 상태를 검사한 다음
대시보드를 여세요.

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

Node 설명에는 `screen.snapshot` 또는 `logbook.snapshot`이 포함되어야
합니다. 헤드리스 Node는 Plugin이 활성화된 후에만 `logbook.snapshot`을
알립니다. 명령이 없다면 [Node 문제 해결](/ko/nodes/troubleshooting)을
참조하세요.

Logbook 탭은 Plugin이 활성화되어 있고 `operator.write` Control UI 세션인
경우에만 표시됩니다. 상태 행에는 오류 없이 **캡처 중**이 표시되어야 합니다.
분석 창이 닫히면 타임라인 카드가 나타나며, 활동이 캡처된 후 **지금 분석**을
선택할 수도 있습니다.

## 작동 방식

1. **캡처**: `captureIntervalSeconds`마다(기본값 30초) Logbook은 선택된
   Node의 캡처 명령을 호출하고 크기가 조정된 JPEG 프레임을 저장합니다.
   연속으로 동일한 프레임은 유휴 상태로 표시되며 분석에서 제외됩니다.
2. **관찰**: 분석 창(기본값 15분)이 경과하면 Plugin은 활성 프레임을 최대
   16개까지 샘플링하여 비전 모델로 전송합니다. 비전 모델은 타임스탬프가
   포함된 활동 관찰 기록("VS Code: store.ts를 편집하며 형식 오류를 수정
   중")을 반환합니다. 캡처 공백이 2분보다 길거나 로컬 자정이 되면 현재
   분석 창도 닫힙니다.
3. **종합**: 관찰 기록과 기존 카드 중 최근 45분 분량을 제목, 요약, 범주,
   주요 앱, 짧은 주의 분산 활동이 포함된 타임라인 카드(각 10~60분)로
   재구성합니다.
4. **정리**: `retentionDays`보다 오래된 프레임(기본값 14일)을 삭제합니다.
   카드, 관찰 기록, 캐시된 스탠드업은 유지됩니다.

날짜 경계와 타임라인 시계에는 브라우저의 시간대가 아닌 Gateway의 로컬
시간대가 사용됩니다. 프레임과 SQLite 타임라인 데이터베이스는
`<state-dir>/logbook/` 아래에 저장됩니다.

## 모델 및 데이터 흐름

Logbook은 별도의 모델 경로 두 개를 사용합니다.

| 단계            | 전송되는 데이터                                                 | 모델 경로                                                       |
| ---------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| 관찰          | 샘플링된 JPEG 프레임 최대 16개와 각 캡처 시각     | `visionModel` 또는 호환되는 차용 `tools.media` Codex 항목 |
| 카드 종합 | 타임스탬프가 포함된 관찰 기록과 최근 타임라인 카드        | Plugin LLM 런타임을 통한 기본 에이전트 모델                |
| 스탠드업 생성 | 선택한 날짜와 전날의 카드               | Plugin LLM 런타임을 통한 기본 에이전트 모델                |
| 하루에 관해 질문     | 질문, 선택한 날짜의 카드, 최근 관찰 기록 | Plugin LLM 런타임을 통한 기본 에이전트 모델                |

전체 SQLite 데이터베이스는 어느 모델에도 전송되지 않습니다. 원본
스크린샷은 관찰 단계에만 전송되며, 카드 종합, 스탠드업, 질의응답에는 파생된
텍스트가 전달됩니다.

## 구성

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

모든 Logbook 구성 키는 선택 사항입니다. 숫자 값은 정수로 반올림되고 지원
범위로 제한됩니다.

| 키                       | 기본값 | 범위 또는 값         | 동작                                                                                     |
| ------------------------- | ------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`  | 불리언                 | 새 스냅샷을 위한 영구 마스터 스위치이며, `false`여도 타임라인은 계속 사용할 수 있음      |
| `captureIntervalSeconds`  | `30`    | `5`-`600`               | 캡처 시도 사이의 지연 시간                                                               |
| `analysisIntervalMinutes` | `15`    | `3`-`120`               | 목표 관찰 창이며, 공백이나 자정으로 인해 더 일찍 닫힐 수 있음                            |
| `nodeId`                  | 설정 안 됨   | Node ID 또는 표시 이름 | 캡처를 연결된 특정 Node 하나로 고정하며, 일치는 대소문자를 구분하지 않음                             |
| `screenIndex`             | `0`     | `0`-`16`                | 0부터 시작하는 디스플레이 인덱스                                                                     |
| `maxWidth`                | `1440`  | `480`-`3840`            | 요청된 캡처 크기의 상한이며, 헤드리스 macOS에서는 가장 긴 치수에 적용됨               |
| `visionModel`             | 설정 안 됨   | `provider/model`        | 명시적인 구조화 경로이며, 잘못된 참조는 분석을 일시 중지하고 지원되지 않는 제공자는 배치를 실패시킴 |
| `retentionDays`           | `14`    | `1`-`365`               | 오래된 프레임을 삭제하며, 카드, 관찰 기록, 스탠드업은 유지됨                                 |

`nodeId`가 없으면 Logbook은 `screen.snapshot`을 노출하는 연결된 앱 Node를
우선 사용한 다음, `logbook.snapshot`을 노출하는 헤드리스 Node를
사용합니다. 고정되지 않은 설정에서는 실패한 Node가 다른 적격 Node 뒤로
순환됩니다. 대시보드의 일시 중지 토글은 세션에만 적용되며 Gateway가 다시
시작되면 초기화됩니다. 영구적으로 중지하려면 `captureEnabled: false`를
사용하세요.

### 비전 모델 선택

Logbook은 다음 순서로 관찰 모델을 결정합니다.

1. `plugins.entries.logbook.config.visionModel`
2. `tools.media.image.models` 아래의 첫 번째 이미지 지원 Codex 항목
3. `tools.media.models` 아래의 첫 번째 이미지 지원 Codex 항목

다른 미디어 제공자는 현재 Logbook에 필요한 구조화된 추출 계약을 노출하지
않으므로 건너뜁니다. `tools.media.image.enabled: false`로 설정하면 차용된
미디어 기본값이 비활성화되지만, 명시적인 Logbook `visionModel`은 계속
적용됩니다.

## 대시보드 탭

- **타임라인**: 범주 색상, 주요 앱, 주의 분산 칩, 스냅샷 키프레임이
  표시되는 활동별 확장 가능 카드.
- **하루 요약**: 집중 비율, 범주별 분석, 주요 앱.
- **일일 스탠드업**: 어제와 오늘의 활동을 바로 붙여 넣을 수 있는
  업데이트로 변환합니다.
- **하루에 관해 질문**: 추적된 타임라인을 바탕으로 자연어 질문에
  답변합니다("Gateway PR은 언제 검토했나요?").
- **지금 분석**: 분석 간격을 기다리지 않고 현재 캡처 창을 즉시 닫습니다.

## Gateway 메서드

Logbook은 다음 Gateway RPC 메서드를 등록합니다.

| 메서드                | 매개변수               | 범위            | 결과                                                                   |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `logbook.status`      | 없음                     | `operator.read`  | 캡처, 분석, 모델, Node, Gateway 날짜 및 Gateway 시간대 상태 |
| `logbook.days`        | 없음                     | `operator.read`  | 타임라인 카드 수와 카드 시간 범위가 포함된 날짜                      |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | 파생 카드와 날짜 통계이며, 기본값은 Gateway의 현재 날짜  |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | 요청된 에포크 밀리초 범위의 프레임 메타데이터                  |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | base64 형식의 원본 JPEG 프레임 하나                                             |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | 특정 날짜의 캐시된 스탠드업 텍스트 또는 재생성된 스탠드업 텍스트                             |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | 특정 날짜의 타임라인에 근거한 답변                                       |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | 세션 전용 일시 중지 상태 및 갱신된 상태                              |
| `logbook.analyze.now` | 없음                     | `operator.write` | 대기 중인 분석을 시작하거나 시작할 수 없는 이유를 반환          |

읽기 메서드는 운영 상태 또는 파생된 텍스트를 반환합니다. 원본 스크린샷
픽셀, 모델 비용이 발생하는 작업, 런타임 변경에는 `operator.write`가
필요합니다. Control UI 탭은 이러한 작업과 원본 프레임 미리보기를
제공하므로 `operator.write`가 필요합니다. 읽기 전용 클라이언트도 파생
텍스트 메서드를 직접 호출할 수 있습니다.

## 개인정보 보호 참고 사항

- 스냅샷에는 비밀 정보를 포함하여 화면에 표시되는 모든 내용이 포함될 수
  있습니다. 프레임은 구성된 관찰 모델에 샘플링된 입력으로 전송되는 경우를
  제외하면 머신 외부로 나가지 않습니다.
- 관찰 기록, 최근 카드, 질문은 카드 종합, 스탠드업 생성, 질의응답 중에
  기본 에이전트 모델을 통해 머신 외부로 전송될 수 있습니다. 두 모델
  경로 모두에 제공자의 데이터 처리 정책을 적용하세요.
- 완전한 로컬 파이프라인이 필요하면 구조화된 관찰 모델과 기본 에이전트
  모델 모두에 로컬 경로를 사용하세요.
- 프레임, 타임라인 데이터베이스, 임시 캡처는 소유자만 접근할 수 있는
  파일 권한으로 기록됩니다.
- `gateway.nodes.denyCommands`에 `screen.snapshot`을 추가하면 화면 캡처
  차단 스위치로 작동합니다. 앱 Node 캡처와 Logbook 자체의
  `logbook.snapshot` 명령을 모두 차단합니다.
- `tools.media.image.enabled: false`로 설정하면 Logbook이 분석을 위해
  미디어 이미지 모델을 차용하는 것도 중지됩니다. 이후에는 Plugin 구성에
  명시된 `visionModel`만 사용됩니다.

## 문제 해결

### Logbook 탭이 표시되지 않음

다음 세 가지 조건을 모두 확인하세요.

1. `openclaw plugins list --enabled`에 `logbook`이 포함되어 있습니다.
2. Plugin 또는 허용 목록을 변경한 후 Gateway가 다시 시작되었습니다.
3. Control UI 연결에 `operator.write`가 있습니다. 읽기 전용 세션에는
   대화형 탭 설명자가 전달되지 않습니다.

`plugins.allow`가 설정되어 있으면 권장 구성에서 `logbook`과 `codex`를 모두
포함해야 합니다.

### 캡처에서 오류가 보고됨

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Node가 `screen.snapshot` 또는 `logbook.snapshot`을 노출하는지 확인합니다.
- 캡처를 수행하는 Mac에 화면 기록 권한을 부여합니다.
- `nodeId`가 구성되어 있으면 Node ID 또는 표시 이름과 일치하는지 확인합니다.
- `gateway.nodes.denyCommands`에 `screen.snapshot`이 포함되어 있지 않은지
  확인합니다.

세 번 연속 실패하면 Logbook은 캡처 틱 10회 동안 백오프한 후 다시
시도합니다. 고정되지 않은 설정은 다른 적격 Node로 전환될 수 있습니다.

### 캡처는 성공하지만 카드가 표시되지 않음

- **모델 누락** 상태는 호환되는 구조화된 비전 경로를 찾지 못했다는
  의미입니다. Codex Plugin을 활성화하고 인증하거나 유효한 `visionModel`을
  명시적으로 설정합니다. 모델이 누락된 동안 캡처된 프레임은 보류 상태로
  유지되며, 구성을 수정한 후 분석할 수 있습니다.
- `analysisIntervalMinutes` 동안 기다리거나 활동이 캡처된 후 **지금 분석**을
  선택합니다.
- 연속으로 동일한 프레임은 유휴 상태의 증거이므로 분석 배치에 포함되지
  않습니다. 테스트하기 전에 화면에 표시되는 내용을 변경합니다.
- 최신 배치에 오류가 표시되면 모델 또는 인증 문제를 해결하고 **지금 분석**을
  선택합니다. 반복적인 모델 비용 발생을 방지하기 위해 실패한 배치는 해당
  작업을 명시적으로 수행할 때만 다시 시도됩니다.

## 관련 문서

- [Plugin 관리](/ko/plugins/manage-plugins)
- [Codex 하네스](/ko/plugins/codex-harness)
- [미디어 이해](/ko/nodes/media-understanding)
- [Node](/ko/nodes)
- [Node 문제 해결](/ko/nodes/troubleshooting)
- [제어 UI](/ko/web/control-ui)
