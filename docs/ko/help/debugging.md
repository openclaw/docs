---
read_when:
    - 추론 유출 여부를 확인하려면 원시 모델 출력을 검사해야 합니다
    - 반복 작업 중 Gateway를 watch 모드로 실행하려는 경우
    - 반복 가능한 디버깅 워크플로가 필요합니다
summary: '디버깅 도구: 감시 모드, 원시 모델 스트림, 추론 유출 추적'
title: 디버깅
x-i18n:
    generated_at: "2026-05-05T01:47:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

스트리밍 출력을 디버깅하기 위한 헬퍼입니다. 특히 공급자가 reasoning을 일반 텍스트에 섞는 경우에 유용합니다.

## 런타임 디버그 재정의

채팅에서 `/debug`를 사용해 **런타임 전용** 설정 재정의(디스크가 아닌 메모리)를 지정합니다.
`/debug`는 기본적으로 비활성화되어 있습니다. `commands.debug: true`로 활성화하세요.
`openclaw.json`을 편집하지 않고 잘 드러나지 않는 설정을 전환해야 할 때 유용합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`은 모든 재정의를 지우고 디스크상의 설정으로 되돌립니다.

## 세션 추적 출력

전체 자세한 모드를 켜지 않고 한 세션에서 Plugin 소유 추적/디버그 줄을 보고 싶을 때
`/trace`를 사용합니다.

예시:

```text
/trace
/trace on
/trace off
```

Active Memory 디버그 요약 같은 Plugin 진단에는 `/trace`를 사용하세요.
일반적인 자세한 상태/도구 출력에는 계속 `/verbose`를 사용하고, 런타임 전용 설정
재정의에는 계속 `/debug`를 사용하세요.

## Plugin 수명 주기 추적

Plugin 수명 주기 명령이 느리게 느껴지고 Plugin 메타데이터, 검색, 레지스트리,
런타임 미러, 설정 변경, 새로 고침 작업에 대한 내장 단계별 분석이 필요할 때
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`을 사용하세요. 추적은 옵트인 방식이며 stderr에
기록되므로 JSON 명령 출력은 계속 파싱할 수 있습니다.

예시:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

예시 출력:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

CPU 프로파일러를 사용하기 전에 Plugin 수명 주기를 조사할 때 이 기능을 사용하세요.
명령이 소스 체크아웃에서 실행 중이라면 `pnpm build` 후 `node dist/entry.js ...`로
빌드된 런타임을 측정하는 편이 좋습니다. `pnpm openclaw ...`는 소스 러너 오버헤드도
함께 측정합니다.

## CLI 시작 및 명령 프로파일링

명령이 느리게 느껴질 때는 체크인된 시작 벤치마크를 사용하세요.

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

일반 소스 러너를 통한 일회성 프로파일링에는 `OPENCLAW_RUN_NODE_CPU_PROF_DIR`를
설정하세요.

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

소스 러너는 Node CPU 프로파일 플래그를 추가하고 해당 명령에 대한 `.cpuprofile`을
기록합니다. 명령 코드에 임시 계측을 추가하기 전에 이 방법을 사용하세요.

시작 지연이 동기 파일 시스템 또는 모듈 로더 작업처럼 보인다면 소스 러너를 통해
Node의 동기 I/O 추적 플래그를 추가하세요.

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch`는 감시 중인 Gateway 자식에 대해 이 플래그를 기본적으로
활성화합니다. watch 모드에서 Node 동기 I/O 추적 출력을 숨기려면
`OPENCLAW_TRACE_SYNC_IO=0`을 설정하세요.

## Gateway 감시 모드

빠른 반복 작업을 위해 파일 감시기 아래에서 Gateway를 실행하세요.

```bash
pnpm gateway:watch
```

기본적으로 이는 `openclaw-gateway-watch-main`이라는 이름의 tmux 세션을
시작하거나 다시 시작합니다(또는 `openclaw-gateway-watch-dev-19001`처럼
프로필/포트별 변형). 그리고 대화형 터미널에서는 자동으로 attach합니다.
비대화형 셸, CI, 에이전트 exec 호출은 detached 상태를 유지하고 대신 attach
안내를 출력합니다. 필요할 때 수동으로 attach하세요.

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux 패널은 원시 감시기를 실행합니다.

```bash
node scripts/watch-node.mjs gateway --force
```

tmux가 필요 없을 때는 포그라운드 모드를 사용하세요.

```bash
pnpm gateway:watch:raw
# 또는
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 관리는 유지하면서 자동 attach를 비활성화하려면 다음을 사용하세요.

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

시작/런타임 핫스팟을 디버깅할 때 감시 중인 Gateway CPU 시간을 프로파일링하세요.

```bash
pnpm gateway:watch --benchmark
```

watch 래퍼는 Gateway를 호출하기 전에 `--benchmark`를 소비하고, Gateway 자식이
종료될 때마다 `.artifacts/gateway-watch-profiles/` 아래에 V8 `.cpuprofile`을
하나씩 기록합니다. 현재 프로파일을 flush하려면 감시 중인 gateway를 중지하거나
다시 시작한 뒤 Chrome DevTools 또는 Speedscope로 여세요.

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

프로파일을 다른 위치에 저장하려면 `--benchmark-dir <path>`를 사용하세요.
벤치마크 대상 자식이 기본 `--force` 포트 정리를 건너뛰고 Gateway 포트가 이미
사용 중이면 빠르게 실패하게 하려면 `--benchmark-no-force`를 사용하세요.
벤치마크 모드는 기본적으로 sync-I/O 추적 스팸을 숨깁니다. CPU 프로파일과 Node
sync-I/O 스택 추적을 모두 명시적으로 원할 때는 `--benchmark`와 함께
`OPENCLAW_TRACE_SYNC_IO=1`을 설정하세요. 벤치마크 모드에서는 해당 추적 블록이
벤치마크 디렉터리 아래 `gateway-watch-output.log`에 기록되고 터미널 패널에서는
필터링됩니다. 일반 Gateway 로그는 계속 표시됩니다.

tmux 래퍼는 `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, `OPENCLAW_SKIP_CHANNELS` 같은 일반적인 비밀이 아닌
런타임 선택자를 패널로 전달합니다. 공급자 자격 증명은 일반 프로필/설정에 넣거나,
일회성 임시 비밀에는 원시 포그라운드 모드를 사용하세요.
감시 중인 Gateway가 시작 중 종료되면 감시기는 `openclaw doctor --fix --non-interactive`를
한 번 실행하고 Gateway 자식을 다시 시작합니다. dev 전용 복구 패스 없이 원래의
시작 실패를 보고 싶을 때는 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`을 사용하세요.
관리되는 tmux 패널도 가독성을 위해 기본적으로 컬러 Gateway 로그를 사용합니다.
ANSI 출력을 비활성화하려면 `pnpm gateway:watch`를 시작할 때 `FORCE_COLOR=0`을
설정하세요.

감시기는 `src/` 아래의 빌드 관련 파일, 확장 소스 파일, 확장 `package.json` 및
`openclaw.plugin.json` 메타데이터, `tsconfig.json`, `package.json`,
`tsdown.config.ts` 변경 시 다시 시작합니다. 확장 메타데이터 변경은 `tsdown`
재빌드를 강제하지 않고 gateway를 다시 시작합니다. 소스 및 설정 변경은 여전히
먼저 `dist`를 재빌드합니다.

gateway CLI 플래그는 `gateway:watch` 뒤에 추가하면 각 재시작에 그대로 전달됩니다.
같은 watch 명령을 다시 실행하면 이름이 지정된 tmux 패널을 다시 생성하며, 원시
감시기는 계속 단일 감시기 잠금을 유지하므로 중복 감시기 부모가 쌓이는 대신
교체됩니다.

## Dev 프로필 + dev gateway (`--dev`)

디버깅을 위해 상태를 격리하고 안전하게 폐기 가능한 설정을 띄우려면 dev 프로필을
사용하세요. `--dev` 플래그는 **두 가지**가 있습니다.

- **전역 `--dev`(프로필):** 상태를 `~/.openclaw-dev` 아래로 격리하고 gateway 포트를
  기본값 `19001`로 설정합니다(파생 포트도 함께 이동).
- **`gateway --dev`: 누락된 경우 Gateway가 기본 설정 + 워크스페이스를 자동 생성하도록 지시합니다**
  (그리고 BOOTSTRAP.md를 건너뜁니다).

권장 흐름(dev 프로필 + dev 부트스트랩):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

아직 전역 설치가 없다면 `pnpm openclaw ...`를 통해 CLI를 실행하세요.

이 작업이 수행하는 내용:

1. **프로필 격리**(전역 `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`(브라우저/canvas도 그에 맞춰 이동)

2. **Dev 부트스트랩**(`gateway --dev`)
   - 누락된 경우 최소 설정을 기록합니다(`gateway.mode=local`, bind loopback).
   - `agent.workspace`를 dev 워크스페이스로 설정합니다.
   - `agent.skipBootstrap=true`를 설정합니다(BOOTSTRAP.md 없음).
   - 누락된 경우 워크스페이스 파일을 시드합니다:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - 기본 정체성: **C3‑PO**(프로토콜 드로이드).
   - dev 모드에서 채널 공급자를 건너뜁니다(`OPENCLAW_SKIP_CHANNELS=1`).

재설정 흐름(새로 시작):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev`는 **전역** 프로필 플래그이며 일부 러너에서 소비됩니다. 명시적으로 적어야 한다면 env var 형식을 사용하세요.

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset`은 설정, 자격 증명, 세션, dev 워크스페이스를 지웁니다(`rm`이 아니라
`trash` 사용). 그런 다음 기본 dev 설정을 다시 생성합니다.

<Tip>
dev가 아닌 gateway가 이미 실행 중이라면(launchd 또는 systemd) 먼저 중지하세요.

```bash
openclaw gateway stop
```

</Tip>

## 원시 스트림 로깅(OpenClaw)

OpenClaw는 필터링/포맷팅 전에 **원시 assistant 스트림**을 기록할 수 있습니다.
reasoning이 일반 텍스트 델타로 도착하는지(또는 별도 thinking 블록으로 도착하는지)
확인하는 가장 좋은 방법입니다.

CLI로 활성화하세요.

```bash
pnpm gateway:watch --raw-stream
```

선택적 경로 재정의:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

동등한 env var:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

기본 파일:

`~/.openclaw/logs/raw-stream.jsonl`

## 원시 청크 로깅(pi-mono)

블록으로 파싱되기 전의 **원시 OpenAI 호환 청크**를 캡처하기 위해 pi-mono는 별도의
로거를 제공합니다.

```bash
PI_RAW_STREAM=1
```

선택적 경로:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

기본 파일:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 참고: 이는 pi-mono의 `openai-completions` 공급자를 사용하는 프로세스에서만
> 방출됩니다.

## 안전 참고 사항

- 원시 스트림 로그에는 전체 프롬프트, 도구 출력, 사용자 데이터가 포함될 수 있습니다.
- 로그는 로컬에 보관하고 디버깅 후 삭제하세요.
- 로그를 공유한다면 먼저 비밀과 PII를 제거하세요.

## 관련 항목

- [문제 해결](/ko/help/troubleshooting)
- [FAQ](/ko/help/faq)
