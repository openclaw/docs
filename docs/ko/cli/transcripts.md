---
read_when:
    - 터미널에서 저장된 대화록 요약을 읽으려고 합니다
    - 전사 기록 마크다운 요약의 경로가 필요합니다
    - 핵심 트랜스크립트 저장소 레이아웃을 디버깅하고 있습니다
summary: '`openclaw transcripts`에 대한 CLI 참조(저장된 트랜스크립트 나열, 표시 및 찾기)'
title: 트랜스크립트 CLI
x-i18n:
    generated_at: "2026-06-27T17:20:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

OpenClaw의 핵심 `transcripts` 도구가 작성한 트랜스크립트를 검사합니다. 이 CLI는 읽기 전용이며, 캡처, 가져오기, 요약은 에이전트 도구와 구성된 자동 시작 소스가 담당합니다.

어제의 노트를 찾거나, 편집기에서 Markdown 파일을 열거나, 트랜스크립트를 다른 도구에 전달하거나, 세션이 디스크의 어디에 저장되었는지 디버그하려는 경우 CLI를 사용하세요. 이 CLI는 캡처를 시작하거나 중지하지 않습니다.

아티팩트는 OpenClaw 상태 디렉터리 아래에 있습니다.

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

기본 상태 디렉터리는 `~/.openclaw`입니다. 다른 디렉터리를 사용하려면 `OPENCLAW_STATE_DIR`을 설정하세요. 날짜 디렉터리는 세션 시작 시간에서 가져오며, 세션 디렉터리는 세션 ID에서 파생된 안전한 파일시스템 세그먼트입니다.

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

- `list`: 저장된 세션, 날짜가 포함된 선택자, 시작 시간, 제목, `summary.md` 경로를 나열합니다.
- `show <session>`: 저장된 `summary.md`를 출력합니다.
- `path <session>`: `summary.md` 경로를 출력합니다.
- `path <session> --dir`: 세션 디렉터리를 출력합니다.
- `path <session> --metadata`: `metadata.json`을 출력합니다.
- `path <session> --transcript`: `transcript.jsonl`을 출력합니다.
- `--json`: 기계가 읽을 수 있는 출력을 출력합니다.

사람이 지정한 세션 ID가 여러 날짜에 반복되는 경우, `list`에서 제공하는 날짜가 포함된 선택자를 사용하세요. 예: `openclaw transcripts show 2026-05-22/standup`. 기본 세션 ID에는 타임스탬프와 무작위 접미사가 포함됩니다. 고정 세션 ID는 하루 안에서 고유할 때만 구성하세요.

## 출력

`list`는 한 줄에 하나의 세션을 출력합니다.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

출력은 탭으로 구분됩니다. 열은 선택자, 시작 시간, 제목, 요약 경로입니다. 선택자는 `show` 또는 `path`에 다시 전달하기에 가장 안전한 값입니다.

`list --json`은 다음 항목이 있는 객체를 출력합니다.

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json`은 저장된 세션 메타데이터, 선택자, 세션 디렉터리, 요약 경로, 요약 Markdown 텍스트를 반환합니다. `path --json`은 선택된 경로와 해당 파일의 존재 여부를 반환합니다.

## 하루에 많은 회의

트랜스크립트는 세션을 날짜별로 그룹화한 다음 세션 ID별로 그룹화합니다. 하루에 열 개의 회의가 있으면 같은 계층의 폴더 열 개가 됩니다.

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

대부분의 자동화에는 기본 생성 ID를 사용하세요. `standup` 같은 고정 ID는 같은 날짜에 같은 ID가 두 번 사용되지 않을 때만 사용하세요.

## 누락된 요약

라이브 세션은 세션이 중지될 때 `summary.md`를 작성합니다. 가져온 트랜스크립트는 가져오기 직후 `summary.md`를 작성합니다. 캡처가 활성 상태이거나, 중지 중 provider가 실패했거나, 어떤 발화도 도착하기 전에 메타데이터가 작성된 경우 세션이 요약 없이 `list`에 계속 표시될 수 있습니다.

추가 전용 트랜스크립트를 검사하려면 `path <session> --transcript`를 사용하고, Markdown 요약을 다시 생성하려면 `transcripts` 도구 작업 `summarize`를 사용하세요.

## 구성

라이브 소스가 회의 오디오에 참여하고 녹음할 수 있으므로 트랜스크립트 캡처는 옵트인입니다. 최상위 `transcripts.enabled`로 도구를 활성화하세요.

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

`openclaw.json`의 `transcripts.autoStart`로 자동 시작 소스를 구성하세요. 각 항목은 존재하는 것만으로 활성화됩니다. 해당 소스를 비활성화하려면 항목을 생략하세요.

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
