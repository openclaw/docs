---
read_when:
    - 추론 누출을 검사하기 위해 원시 모델 출력을 살펴봐야 합니다
    - 반복 작업 중에 Gateway를 감시 모드로 실행하려고 합니다
    - 반복 가능한 디버깅 워크플로가 필요합니다
summary: '디버깅 도구: 감시 모드, 원시 모델 스트림, 그리고 추론 누출 추적'
title: 디버깅
x-i18n:
    generated_at: "2026-04-12T23:28:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc31ce9b41e92a14c4309f32df569b7050b18024f83280930e53714d3bfcd5cc
    source_path: help/debugging.md
    workflow: 15
---

# 디버깅

이 페이지는 스트리밍 출력용 디버깅 도우미를 다루며, 특히 provider가 추론을 일반 텍스트에 섞어 넣는 경우에 유용합니다.

## 런타임 디버그 재정의

채팅에서 `/debug`를 사용하면 **런타임 전용** 구성 재정의(디스크가 아니라 메모리)를 설정할 수 있습니다.
`/debug`는 기본적으로 비활성화되어 있으며, `commands.debug: true`로 활성화할 수 있습니다.
`openclaw.json`을 수정하지 않고 잘 드물게 쓰이는 설정을 전환해야 할 때 유용합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`은 모든 재정의를 지우고 디스크에 저장된 구성으로 되돌립니다.

## 세션 추적 출력

한 세션에서 전체 상세 모드를 켜지 않고 plugin 소유의 추적/디버그 줄을 보고 싶다면 `/trace`를 사용하세요.

예시:

```text
/trace
/trace on
/trace off
```

Active Memory 디버그 요약 같은 plugin 진단에는 `/trace`를 사용하세요.
일반적인 상세 상태/도구 출력에는 계속 `/verbose`를 사용하고, 런타임 전용 구성 재정의에는 계속 `/debug`를 사용하세요.

## Gateway 감시 모드

빠르게 반복 작업하려면 파일 감시기 아래에서 gateway를 실행하세요:

```bash
pnpm gateway:watch
```

이는 다음에 매핑됩니다:

```bash
node scripts/watch-node.mjs gateway --force
```

감시기는 `src/` 아래의 빌드 관련 파일, extension 소스 파일, extension `package.json` 및 `openclaw.plugin.json` 메타데이터, `tsconfig.json`, `package.json`, `tsdown.config.ts`가 변경되면 다시 시작합니다.
Extension 메타데이터 변경은 `tsdown` 재빌드를 강제하지 않고 gateway를 다시 시작하며, 소스 및 구성 변경은 여전히 먼저 `dist`를 재빌드합니다.

`gateway:watch` 뒤에 gateway CLI 플래그를 추가하면 매번 다시 시작할 때 전달됩니다.
이제 동일한 리포지토리/플래그 조합으로 같은 감시 명령을 다시 실행하면 중복 감시기 부모 프로세스를 남겨 두는 대신 이전 감시기를 교체합니다.

## 개발 프로필 + 개발 gateway (`--dev`)

상태를 격리하고 디버깅을 위한 안전하고 일회성인 설정을 띄우려면 개발 프로필을 사용하세요. `--dev` 플래그는 **두 가지**가 있습니다:

- **전역 `--dev` (프로필):** 상태를 `~/.openclaw-dev` 아래로 격리하고 gateway 포트를 기본적으로 `19001`로 설정합니다(파생 포트도 이에 맞춰 이동).
- **`gateway --dev`:** Gateway가 기본 구성 + 워크스페이스가 없을 때 자동 생성하도록 합니다(그리고 `BOOTSTRAP.md`는 건너뜁니다).

권장 흐름(개발 프로필 + 개발 부트스트랩):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

아직 전역 설치가 없다면 `pnpm openclaw ...`를 통해 CLI를 실행하세요.

동작 방식:

1. **프로필 격리** (전역 `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas도 이에 맞춰 이동)

2. **개발 부트스트랩** (`gateway --dev`)
   - 없으면 최소 구성 파일을 작성합니다(`gateway.mode=local`, bind loopback).
   - `agent.workspace`를 개발 워크스페이스로 설정합니다.
   - `agent.skipBootstrap=true`를 설정합니다(`BOOTSTRAP.md` 없음).
   - 없으면 워크스페이스 파일을 시드합니다:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - 기본 identity: **C3‑PO** (protocol droid).
   - 개발 모드에서는 채널 provider를 건너뜁니다(`OPENCLAW_SKIP_CHANNELS=1`).

재설정 흐름(새로 시작):

```bash
pnpm gateway:dev:reset
```

참고: `--dev`는 **전역** 프로필 플래그이며 일부 실행기에서 소비됩니다.
명시해야 한다면 환경 변수 형식을 사용하세요:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset`은 구성, 자격 증명, 세션, 개발 워크스페이스를 (`rm`이 아니라 `trash`를 사용해) 지운 다음 기본 개발 설정을 다시 만듭니다.

팁: 개발용이 아닌 gateway가 이미 실행 중이라면(launchd/systemd) 먼저 중지하세요:

```bash
openclaw gateway stop
```

## 원시 스트림 로깅 (OpenClaw)

OpenClaw는 필터링/포맷팅 전에 **원시 assistant 스트림**을 기록할 수 있습니다.
이것이 추론이 일반 텍스트 델타로 도착하는지(또는 별도의 thinking 블록으로 도착하는지) 확인하는 가장 좋은 방법입니다.

CLI로 활성화:

```bash
pnpm gateway:watch --raw-stream
```

선택적 경로 재정의:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

동등한 환경 변수:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

기본 파일:

`~/.openclaw/logs/raw-stream.jsonl`

## 원시 청크 로깅 (pi-mono)

블록으로 파싱되기 전에 **원시 OpenAI-호환 청크**를 캡처하려면 pi-mono가 별도의 로거를 제공합니다:

```bash
PI_RAW_STREAM=1
```

선택적 경로:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

기본 파일:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 참고: 이는 pi-mono의 `openai-completions` provider를 사용하는 프로세스에서만 출력됩니다.

## 안전 참고 사항

- 원시 스트림 로그에는 전체 프롬프트, 도구 출력, 사용자 데이터가 포함될 수 있습니다.
- 로그는 로컬에만 보관하고 디버깅 후 삭제하세요.
- 로그를 공유할 경우 먼저 비밀 정보와 PII를 제거하세요.
