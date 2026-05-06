---
read_when:
    - 추론 누출 여부를 확인하려면 원시 모델 출력을 검사해야 합니다
    - 반복 작업 중 Gateway를 watch 모드로 실행하려는 경우
    - 반복 가능한 디버깅 워크플로가 필요합니다
summary: '디버깅 도구: 감시 모드, 원시 모델 스트림, 추론 유출 추적'
title: 디버깅
x-i18n:
    generated_at: "2026-05-06T06:28:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

스트리밍 출력 디버깅 도우미입니다. 특히 provider가 reasoning을 일반 텍스트에 섞을 때 유용합니다.

## 런타임 디버그 재정의

채팅에서 `/debug`를 사용하여 **런타임 전용** 구성 재정의(디스크가 아닌 메모리)를 설정합니다.
`/debug`는 기본적으로 비활성화되어 있습니다. `commands.debug: true`로 활성화하세요.
`openclaw.json`을 편집하지 않고 잘 드러나지 않는 설정을 전환해야 할 때 편리합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`은 모든 재정의를 지우고 디스크의 구성으로 되돌립니다.

## 세션 trace 출력

전체 verbose 모드를 켜지 않고 한 세션에서 Plugin 소유 trace/debug 줄을 보고 싶을 때 `/trace`를 사용합니다.

예시:

```text
/trace
/trace on
/trace off
```

Active Memory 디버그 요약 같은 Plugin 진단에는 `/trace`를 사용하세요.
일반 verbose 상태/tool 출력에는 계속 `/verbose`를 사용하고, 런타임 전용 구성 재정의에는 계속 `/debug`를 사용하세요.

## Plugin 수명 주기 trace

Plugin 수명 주기 명령이 느리게 느껴지고 Plugin 메타데이터, discovery, registry, runtime mirror, 구성 변경, refresh 작업에 대한 내장 단계 분석이 필요할 때 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`을 사용합니다. trace는 opt-in 방식이며 stderr에 기록되므로 JSON 명령 출력은 계속 파싱할 수 있습니다.

예시:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

출력 예시:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

CPU profiler를 사용하기 전에 Plugin 수명 주기 조사에 이것을 사용하세요.
명령이 소스 checkout에서 실행 중이라면 `pnpm build` 후 `node dist/entry.js ...`로 빌드된 runtime을 측정하는 것이 좋습니다. `pnpm openclaw ...`는 source-runner 오버헤드도 함께 측정합니다.

## CLI 시작 및 명령 프로파일링

명령이 느리게 느껴질 때 체크인된 시작 벤치마크를 사용하세요.

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

일반 source runner를 통한 일회성 프로파일링에는 `OPENCLAW_RUN_NODE_CPU_PROF_DIR`를 설정합니다.

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

source runner는 Node CPU profile 플래그를 추가하고 명령에 대한 `.cpuprofile`을 씁니다. 명령 코드에 임시 instrumentation을 추가하기 전에 이것을 사용하세요.

동기식 파일시스템 또는 module-loader 작업처럼 보이는 시작 정체에는 source runner를 통해 Node의 sync I/O trace 플래그를 추가합니다.

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch`는 감시 중인 Gateway child에 대해 이 플래그를 기본적으로 활성화합니다.
watch 모드에서 Node sync I/O trace 출력을 억제하려면 `OPENCLAW_TRACE_SYNC_IO=0`을 설정하세요.

## Gateway watch 모드

빠른 반복 작업에는 file watcher 아래에서 gateway를 실행하세요.

```bash
pnpm gateway:watch
```

기본적으로 이는 `openclaw-gateway-watch-main`이라는 이름의 tmux 세션(또는 `openclaw-gateway-watch-dev-19001` 같은 profile/port별 변형)을 시작하거나 다시 시작하고, 대화형 터미널에서는 자동으로 attach합니다.
비대화형 셸, CI, agent exec 호출은 detached 상태를 유지하고 대신 attach 안내를 출력합니다. 필요할 때 수동으로 attach하세요.

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux pane은 원시 watcher를 실행합니다.

```bash
node scripts/watch-node.mjs gateway --force
```

tmux를 원하지 않을 때는 foreground 모드를 사용하세요.

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 관리는 유지하면서 auto-attach를 비활성화합니다.

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

시작/runtime hotspot을 디버깅할 때 감시 중인 Gateway CPU 시간을 프로파일링합니다.

```bash
pnpm gateway:watch --benchmark
```

watch wrapper는 Gateway를 호출하기 전에 `--benchmark`를 소비하고, Gateway child가 종료될 때마다 V8 `.cpuprofile` 하나를 `.artifacts/gateway-watch-profiles/` 아래에 씁니다. 현재 profile을 flush하려면 감시 중인 gateway를 중지하거나 다시 시작한 다음 Chrome DevTools 또는 Speedscope로 여세요.

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

profile을 다른 위치에 두고 싶을 때는 `--benchmark-dir <path>`를 사용하세요.
벤치마크 대상 child가 기본 `--force` port cleanup을 건너뛰고 Gateway port가 이미 사용 중이면 빠르게 실패하게 하려면 `--benchmark-no-force`를 사용하세요.
Benchmark 모드는 기본적으로 sync-I/O trace spam을 억제합니다. CPU profile과 Node sync-I/O stack trace를 모두 명시적으로 원할 때는 `--benchmark`와 함께 `OPENCLAW_TRACE_SYNC_IO=1`을 설정하세요. benchmark 모드에서 해당 trace block은 benchmark directory 아래의 `gateway-watch-output.log`에 기록되고 terminal pane에서는 필터링됩니다. 일반 Gateway 로그는 계속 표시됩니다.

tmux wrapper는 `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT`, `OPENCLAW_SKIP_CHANNELS` 같은 일반적인 비밀이 아닌 runtime selector를 pane으로 전달합니다. provider 자격 증명은 일반 profile/config에 넣거나, 일회성 ephemeral secret에는 raw foreground 모드를 사용하세요.
감시 중인 Gateway가 시작 중 종료되면 watcher는 `openclaw doctor --fix --non-interactive`를 한 번 실행한 뒤 Gateway child를 다시 시작합니다.
dev 전용 repair pass 없이 원래 시작 실패를 보고 싶을 때는 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`을 사용하세요.
관리되는 tmux pane은 가독성을 위해 색상이 있는 Gateway 로그도 기본값으로 사용합니다. ANSI 출력을 비활성화하려면 `pnpm gateway:watch`를 시작할 때 `FORCE_COLOR=0`을 설정하세요.

watcher는 `src/` 아래의 빌드 관련 파일, extension source 파일, extension `package.json` 및 `openclaw.plugin.json` 메타데이터, `tsconfig.json`, `package.json`, `tsdown.config.ts`에서 변경이 있을 때 다시 시작합니다. Extension 메타데이터 변경은 강제로 `tsdown` rebuild를 하지 않고 gateway를 다시 시작합니다. source 및 config 변경은 여전히 먼저 `dist`를 rebuild합니다.

`gateway:watch` 뒤에 gateway CLI 플래그를 추가하면 각 restart 때 그대로 전달됩니다. 같은 watch 명령을 다시 실행하면 이름이 지정된 tmux pane이 respawn되고, raw watcher는 여전히 단일 watcher lock을 유지하므로 중복 watcher parent가 쌓이지 않고 교체됩니다.

## Dev profile + dev gateway (--dev)

dev profile을 사용하여 state를 격리하고 디버깅을 위한 안전한 일회용 설정을 시작하세요. `--dev` 플래그는 **두 가지**입니다.

- **전역 `--dev` (profile):** `~/.openclaw-dev` 아래에 state를 격리하고 gateway port를 기본 `19001`로 설정합니다(파생 port도 함께 이동).
- **`gateway --dev`: 누락된 경우 Gateway에 기본 config + workspace를 자동 생성하도록 지시합니다**(그리고 BOOTSTRAP.md를 건너뜁니다).

권장 흐름(dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

아직 global install이 없다면 `pnpm openclaw ...`로 CLI를 실행하세요.

이 작업이 수행하는 것:

1. **Profile 격리**(전역 `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`(browser/canvas도 그에 따라 이동)

2. **Dev bootstrap**(`gateway --dev`)
   - 누락된 경우 최소 config를 작성합니다(`gateway.mode=local`, bind loopback).
   - `agent.workspace`를 dev workspace로 설정합니다.
   - `agent.skipBootstrap=true`를 설정합니다(BOOTSTRAP.md 없음).
   - 누락된 경우 workspace 파일을 seed합니다:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - 기본 identity: **C3-PO**(protocol droid).
   - dev 모드에서 channel provider를 건너뜁니다(`OPENCLAW_SKIP_CHANNELS=1`).

Reset 흐름(새로 시작):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev`는 **전역** profile 플래그이며 일부 runner가 소비합니다. 명확히 적어야 한다면 env var 형식을 사용하세요.

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset`은 config, credentials, sessions, dev workspace를 지운 뒤(`rm`이 아니라 `trash` 사용) 기본 dev 설정을 다시 만듭니다.

<Tip>
non-dev gateway가 이미 실행 중(launchd 또는 systemd)이라면 먼저 중지하세요.

```bash
openclaw gateway stop
```

</Tip>

## Raw stream logging (OpenClaw)

OpenClaw는 filtering/formatting 전에 **raw assistant stream**을 기록할 수 있습니다.
reasoning이 plain text delta로 도착하는지(또는 별도의 thinking block으로 도착하는지) 확인하는 가장 좋은 방법입니다.

CLI로 활성화:

```bash
pnpm gateway:watch --raw-stream
```

선택적 path 재정의:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

동등한 env vars:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

기본 파일:

`~/.openclaw/logs/raw-stream.jsonl`

## Raw chunk logging (pi-mono)

block으로 파싱되기 전에 **raw OpenAI 호환 chunk**를 캡처하기 위해 pi-mono는 별도의 logger를 제공합니다.

```bash
PI_RAW_STREAM=1
```

선택적 path:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

기본 파일:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 참고: 이는 pi-mono의 `openai-completions` provider를 사용하는 process에서만 emitted됩니다.

## 안전 참고 사항

- Raw stream 로그에는 전체 prompt, tool output, user data가 포함될 수 있습니다.
- 로그는 local에 보관하고 디버깅 후 삭제하세요.
- 로그를 공유하는 경우 먼저 secret과 PII를 제거하세요.

## VSCode에서 디버깅

생성된 파일 중 많은 수가 build process의 일부로 hashed name을 갖게 되므로 VSCode 기반 IDE에서 디버깅을 활성화하려면 source map이 필요합니다. 포함된 `launch.json` 구성은 Gateway service를 대상으로 하지만 다른 목적에 맞게 빠르게 조정할 수 있습니다.

1. **Rebuild and Debug Gateway** - 새 build를 만든 후 Gateway service를 디버깅합니다
2. **Debug Gateway** - 기존 build의 Gateway service를 디버깅합니다

### 설정

기본 **Rebuild and Debug Gateway** 구성은 필요한 항목이 모두 포함되어 있으며, 자동으로 `/dist` 폴더를 삭제하고 디버깅이 활성화된 상태로 project를 rebuild합니다.

1. Activity Bar에서 **Run and Debug** panel을 열거나 `Ctrl`+`Shift`+`D`를 누릅니다
2. IDE에서 configuration dropdown에 **Rebuild and Debug Gateway**가 선택되어 있는지 확인한 다음 **Start Debugging** 버튼을 누릅니다

또는 build 및 debug process를 수동으로 관리하고 싶다면:

1. 터미널을 열고 source map을 활성화합니다.
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. 같은 터미널에서 project를 rebuild합니다: `pnpm clean:dist && pnpm build`
3. IDE에서 **Run and Debug** configuration dropdown의 **Debug Gateway** option을 선택한 다음 **Start Debugging** 버튼을 누릅니다

이제 TypeScript source file(`src/` directory)에 breakpoint를 설정할 수 있으며 debugger는 source map을 통해 breakpoint를 compiled JavaScript에 올바르게 매핑합니다. 예상대로 variable을 검사하고, code를 step through하고, call stack을 검토할 수 있습니다.

### 참고

- **"Rebuild and Debug Gateway"** option을 사용하는 경우 - debugger가 시작될 때마다 `/dist` 폴더를 완전히 삭제하고 Gateway를 시작하기 전에 source map이 활성화된 full `pnpm build`를 실행합니다
- **"Debug Gateway"** option을 사용하는 경우 - debug session은 `/dist` 폴더에 영향을 주지 않고 언제든지 시작 및 중지할 수 있지만, debugging 활성화와 build cycle 관리를 모두 별도의 terminal process에서 수행해야 합니다
- project의 다른 section을 디버깅하려면 `args`의 `launch.json` 설정을 수정하세요
- 다른 작업에 빌드된 OpenClaw CLI를 사용해야 한다면(예: debug session이 새 auth token을 spawn하는 경우 `dashboard --no-open`), 다른 터미널에서 `node ./openclaw.mjs`로 실행하거나 `alias openclaw-build="node $(pwd)/openclaw.mjs"` 같은 shell alias를 만들 수 있습니다

## 관련

- [문제 해결](/ko/help/troubleshooting)
- [FAQ](/ko/help/faq)
