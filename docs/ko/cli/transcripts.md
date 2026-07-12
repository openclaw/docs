---
read_when:
    - 터미널에서 저장된 트랜스크립트 요약을 읽으려고 합니다
    - transcripts Markdown 요약의 경로가 필요합니다.
    - 핵심 트랜스크립트 저장소 레이아웃을 디버깅하고 있습니다
summary: '`openclaw transcripts`의 CLI 참조(저장된 트랜스크립트 목록 조회, 표시 및 위치 찾기)'
title: 트랜스크립트 CLI
x-i18n:
    generated_at: "2026-07-12T15:08:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

`transcripts` 에이전트 도구가 작성한 트랜스크립트를 위한 읽기 전용 검사기입니다.
캡처, 가져오기 및 요약은 이 CLI가 아니라 해당 도구를 통해 실행합니다.

아티팩트는 상태 디렉터리 아래에 저장됩니다.

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

기본 상태 디렉터리는 `~/.openclaw`이며, `OPENCLAW_STATE_DIR`로 재정의할 수 있습니다.
날짜 디렉터리는 세션 시작 시간에서 가져오며, 세션 디렉터리는
세션 ID에서 파생된 파일 시스템에 안전한 슬러그입니다.

## 명령

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| 명령                          | 설명                                                   |
| ----------------------------- | ------------------------------------------------------ |
| `list`                        | 저장된 세션을 나열합니다.                              |
| `show <session>`              | 저장된 `summary.md`를 출력합니다.                      |
| `path <session>`              | `summary.md` 경로를 출력합니다.                        |
| `path <session> --dir`        | 세션 디렉터리를 출력합니다.                            |
| `path <session> --metadata`   | `metadata.json`을 출력합니다.                          |
| `path <session> --transcript` | `transcript.jsonl`을 출력합니다.                       |
| `--json`                      | 기계 판독 가능한 출력을 표시합니다(모든 하위 명령).   |

`<session>`에는 단독 세션 ID 또는 날짜가 포함된 선택자
(`YYYY-MM-DD/<session>`)를 사용할 수 있습니다. 동일한 세션 ID가 둘 이상의 날짜에
나타나는 경우에는 날짜가 포함된 형식을 사용하십시오. 예: `openclaw transcripts show
2026-05-22/standup`. 기본 세션 ID에는 타임스탬프와 무작위
접미사가 포함됩니다. 고정 ID는 해당 날짜 내에서 고유한 경우에만 세션에 지정하십시오.

## 출력

`list`는 세션마다 탭으로 구분된 한 줄을 출력합니다. 각 줄에는 선택자, 시작 시간, 제목,
요약 경로가 포함됩니다.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  주간 스탠드업  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

선택자는 `show` 또는 `path`에 다시 전달하기에 가장 안전한 값입니다.

`list --json`은 `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`가 포함된 객체를 반환합니다.

`show --json`은 저장된 세션 메타데이터, 선택자, 세션
디렉터리, 요약 경로 및 요약 Markdown 텍스트를 반환합니다.

`path --json`은 선택한 경로와 해당 파일의 존재 여부를 반환합니다.

## 하루에 여러 세션

세션은 먼저 날짜별로, 그다음 세션 ID별로 그룹화됩니다. 하루에 회의가 10개라면
동일한 상위 디렉터리 아래에 폴더 10개가 생성됩니다.

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

자동화에는 기본 생성 ID를 사용하십시오. `standup`과 같은 고정 ID는
같은 날짜에 반복되지 않을 때만 사용하십시오.

## 누락된 요약

라이브 세션은 세션이 중지될 때 `summary.md`를 작성하며, 가져온 트랜스크립트는
가져오기 직후 작성합니다. 캡처가 아직 활성 상태이거나, 중지 중 공급자에
오류가 발생했거나, 발화가 도착하기 전에 메타데이터가 작성된 경우에는
요약 없이 세션이 `list`에 나타날 수 있습니다.

`path <session> --transcript`를 사용하여 원시 추가 전용 트랜스크립트를 검사하거나,
`transcripts` 도구의 `summarize` 작업을 실행하여 Markdown
요약을 다시 생성하십시오.

## 구성

캡처는 선택 사항입니다(라이브 소스가 참여하여 회의 오디오를 녹음할 수 있습니다). 다음과 같이
활성화하십시오.

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled`(기본값 `false`): 도구를 활성화합니다.
- `maxUtterances`(기본값 `2000`, 1-10000 범위로 제한): 세션당
  발화 버퍼 크기입니다.

`transcripts.autoStart`로 자동 시작 소스를 구성하십시오. 각 항목은
존재하는 것만으로 활성화되며, 해당 소스를 비활성화하려면 항목을 생략하십시오. `discord-voice`는
번들로 제공되는 자동 시작 지원 소스이며 `guildId`와
`channelId`가 필요합니다.

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
