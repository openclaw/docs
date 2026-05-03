---
read_when:
    - 추론 유출 여부를 확인하려면 모델의 원시 출력을 검사해야 합니다
    - 반복 작업 중 Gateway를 감시 모드로 실행하려는 경우
    - 반복 가능한 디버깅 워크플로가 필요합니다
summary: '디버깅 도구: 감시 모드, 원시 모델 스트림, 추론 누출 추적'
title: 디버깅
x-i18n:
    generated_at: "2026-05-03T21:33:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

스트리밍 출력용 디버깅 헬퍼입니다. 특히 provider가 reasoning을 일반 텍스트에 섞어 넣을 때 유용합니다.

## 런타임 디버그 오버라이드

채팅에서 `/debug`를 사용해 **런타임 전용** config 오버라이드(디스크가 아닌 메모리)를 설정합니다.
`/debug`는 기본적으로 비활성화되어 있으며, `commands.debug: true`로 활성화합니다.
`openclaw.json`을 편집하지 않고 잘 드러나지 않는 설정을 전환해야 할 때 유용합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`은 모든 오버라이드를 지우고 디스크에 있는 config로 되돌립니다.

## 세션 trace 출력

전체 verbose 모드를 켜지 않고 한 세션에서 Plugin 소유 trace/debug 줄을 보고 싶을 때 `/trace`를 사용합니다.

예시:

```text
/trace
/trace on
/trace off
```

Active Memory debug 요약 같은 Plugin 진단에는 `/trace`를 사용합니다.
일반 verbose 상태/tool 출력에는 계속 `/verbose`를 사용하고, 런타임 전용 config 오버라이드에는 계속 `/debug`를 사용합니다.

## Plugin lifecycle trace

Plugin lifecycle command가 느리게 느껴지고 Plugin metadata, discovery, registry, runtime mirror, config mutation, refresh 작업에 대한 내장 phase breakdown이 필요할 때 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`을 사용합니다. trace는 opt-in이며 stderr에 쓰므로 JSON command 출력은 계속 파싱할 수 있습니다.

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

CPU 프로파일러를 사용하기 전에 Plugin lifecycle 조사에 이것을 사용하세요.
command를 source checkout에서 실행 중이라면 `pnpm build` 후 `node dist/entry.js ...`로 빌드된 런타임을 측정하는 것이 좋습니다. `pnpm openclaw ...`는 source-runner 오버헤드도 측정합니다.

## CLI 시작 및 command 프로파일링

command가 느리게 느껴질 때 체크인된 시작 벤치마크를 사용합니다.

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

일반 source runner를 통한 일회성 프로파일링에는 `OPENCLAW_RUN_NODE_CPU_PROF_DIR`을 설정합니다.

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

source runner는 Node CPU profile flag를 추가하고 command용 `.cpuprofile`을 씁니다. command 코드에 임시 instrumentation을 추가하기 전에 이것을 사용하세요.

## Gateway watch 모드

빠른 반복 작업을 위해 file watcher 아래에서 Gateway를 실행합니다.

```bash
pnpm gateway:watch
```

기본적으로 이것은 `openclaw-gateway-watch-main`이라는 tmux 세션(또는 `openclaw-gateway-watch-dev-19001` 같은 profile/port별 변형)을 시작하거나 재시작하고, 대화형 터미널에서는 자동으로 attach합니다.
비대화형 shell, CI, agent exec 호출은 detached 상태를 유지하고 대신 attach 안내를 출력합니다. 필요할 때 수동으로 attach합니다.

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux pane은 raw watcher를 실행합니다.

```bash
node scripts/watch-node.mjs gateway --force
```

tmux를 원하지 않을 때는 foreground 모드를 사용합니다.

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 관리는 유지하면서 auto-attach를 비활성화합니다.

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

시작/런타임 hotspot을 디버깅할 때 watched Gateway CPU 시간을 프로파일링합니다.

```bash
pnpm gateway:watch --benchmark
```

watch wrapper는 Gateway를 호출하기 전에 `--benchmark`를 소비하고, `.artifacts/gateway-watch-profiles/` 아래에 Gateway child exit마다 V8 `.cpuprofile` 하나를 씁니다. watched gateway를 중지하거나 재시작해 현재 profile을 flush한 다음 Chrome DevTools 또는 Speedscope로 엽니다.

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

profile을 다른 위치에 두고 싶으면 `--benchmark-dir <path>`를 사용합니다.
benchmarked child가 기본 `--force` port cleanup을 건너뛰고 Gateway port가 이미 사용 중이면 빠르게 실패하게 하려면 `--benchmark-no-force`를 사용합니다.

tmux wrapper는 `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT`, `OPENCLAW_SKIP_CHANNELS` 같은 일반적인 비밀이 아닌 런타임 selector를 pane으로 전달합니다. provider credential은 일반 profile/config에 넣거나, 일회성 ephemeral secret에는 raw foreground 모드를 사용합니다.
watched Gateway가 시작 중 종료되면 watcher는 `openclaw doctor --fix --non-interactive`를 한 번 실행하고 Gateway child를 재시작합니다. dev 전용 repair pass 없이 원래 시작 실패를 보고 싶으면 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`을 사용합니다.
managed tmux pane은 가독성을 위해 기본적으로 컬러 Gateway log를 사용합니다. ANSI 출력을 비활성화하려면 `pnpm gateway:watch`를 시작할 때 `FORCE_COLOR=0`을 설정합니다.

watcher는 `src/` 아래 build 관련 파일, extension source 파일, extension `package.json` 및 `openclaw.plugin.json` metadata, `tsconfig.json`, `package.json`, `tsdown.config.ts` 변경 시 재시작합니다. extension metadata 변경은 `tsdown` rebuild를 강제하지 않고 gateway를 재시작합니다. source 및 config 변경은 여전히 먼저 `dist`를 rebuild합니다.

Gateway CLI flag는 `gateway:watch` 뒤에 추가하면 각 재시작에 그대로 전달됩니다. 같은 watch command를 다시 실행하면 이름이 지정된 tmux pane을 다시 생성하고, raw watcher는 여전히 single-watcher lock을 유지하므로 중복 watcher parent가 쌓이지 않고 교체됩니다.

## Dev profile + dev gateway (--dev)

debugging을 위해 state를 격리하고 안전한 일회용 setup을 띄우려면 dev profile을 사용합니다. `--dev` flag는 **두 가지**가 있습니다.

- **Global `--dev` (profile):** state를 `~/.openclaw-dev` 아래로 격리하고 gateway port를 기본적으로 `19001`로 설정합니다(파생 port도 함께 이동).
- **`gateway --dev`: 누락된 경우 Gateway에 기본 config + workspace를 자동 생성하도록 지시합니다**(그리고 BOOTSTRAP.md를 건너뜁니다).

권장 흐름(dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

아직 global install이 없다면 `pnpm openclaw ...`로 CLI를 실행하세요.

이 작업이 수행하는 내용:

1. **Profile 격리**(global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`(browser/canvas도 이에 맞춰 이동)

2. **Dev bootstrap**(`gateway --dev`)
   - 누락된 경우 최소 config를 씁니다(`gateway.mode=local`, bind loopback).
   - `agent.workspace`를 dev workspace로 설정합니다.
   - `agent.skipBootstrap=true`를 설정합니다(BOOTSTRAP.md 없음).
   - 누락된 경우 workspace file을 seed합니다:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - 기본 identity: **C3‑PO**(protocol droid).
   - dev 모드에서 channel provider를 건너뜁니다(`OPENCLAW_SKIP_CHANNELS=1`).

Reset 흐름(새로 시작):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev`는 **global** profile flag이며 일부 runner가 소비합니다. 명시해야 한다면 env var 형식을 사용하세요.

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset`은 config, credential, session, dev workspace를 지우고(`rm`이 아닌 `trash` 사용) 기본 dev setup을 다시 생성합니다.

<Tip>
non-dev gateway가 이미 실행 중이라면(launchd 또는 systemd) 먼저 중지하세요.

```bash
openclaw gateway stop
```

</Tip>

## Raw stream logging (OpenClaw)

OpenClaw는 filtering/formatting 전에 **raw assistant stream**을 log로 남길 수 있습니다.
이것은 reasoning이 plain text delta로 도착하는지(또는 별도의 thinking block으로 도착하는지)를 확인하는 가장 좋은 방법입니다.

CLI로 활성화합니다.

```bash
pnpm gateway:watch --raw-stream
```

선택적 path override:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

동등한 env var:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

기본 file:

`~/.openclaw/logs/raw-stream.jsonl`

## Raw chunk logging (pi-mono)

block으로 파싱되기 전에 **raw OpenAI-compat chunk**를 캡처하기 위해 pi-mono는 별도의 logger를 제공합니다.

```bash
PI_RAW_STREAM=1
```

선택적 path:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

기본 file:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 참고: 이것은 pi-mono의 `openai-completions` provider를 사용하는 process에서만 emit됩니다.

## 안전 참고 사항

- Raw stream log에는 전체 prompt, tool output, user data가 포함될 수 있습니다.
- log를 local에 보관하고 debugging 후 삭제하세요.
- log를 공유하는 경우 secret과 PII를 먼저 제거하세요.

## 관련 항목

- [문제 해결](/ko/help/troubleshooting)
- [FAQ](/ko/help/faq)
