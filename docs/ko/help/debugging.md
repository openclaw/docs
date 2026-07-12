---
read_when:
    - 추론 내용이 노출되었는지 확인하려면 모델의 원시 출력을 검사해야 합니다.
    - 반복 작업 중에 Gateway를 감시 모드로 실행하려고 합니다
    - 반복 가능한 디버깅 워크플로가 필요합니다
summary: '디버깅 도구: 감시 모드, 원시 모델 스트림 및 추론 유출 추적'
title: 디버깅
x-i18n:
    generated_at: "2026-07-12T15:19:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

스트리밍 출력, Gateway 반복 개발 및 시작 프로파일링을 위한 디버깅 도우미입니다.

## 런타임 디버그 재정의

`/debug`는 **런타임 전용** 구성 재정의(디스크가 아닌 메모리)를 설정합니다. 기본적으로 비활성화되어 있으며, `commands.debug: true`로 활성화합니다.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`은 모든 재정의를 지우고 디스크의 구성으로 돌아갑니다.

## 세션 추적 출력

`/trace`는 전체 상세 모드를 활성화하지 않고 한 세션의 Plugin 소유 추적/디버그 줄을 표시합니다. Active Memory 디버그 요약과 같은 Plugin 진단에는 이를 사용하고, 일반 상태/도구 출력에는 `/verbose`를 사용하십시오.

```text
/trace
/trace on
/trace off
```

## Plugin 수명 주기 추적

Plugin 메타데이터, 검색, 레지스트리, 런타임 미러, 구성 변경 및 새로 고침 작업을 단계별로 분석하려면 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`을 설정하십시오. stderr에 기록되므로 JSON 명령 출력은 계속 파싱할 수 있습니다.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="구성 읽기" ms=6.83 status=ok command="설치"
[plugins:lifecycle] phase="슬롯 선택" ms=94.31 status=ok command="설치" pluginId="tokenjuice"
[plugins:lifecycle] phase="레지스트리 새로 고침" ms=51.56 status=ok command="설치" reason="소스 변경"
```

CPU 프로파일러를 사용하기 전에 이를 사용하십시오. 소스 체크아웃에서는 `pnpm build` 후 `node dist/entry.js ...`로 빌드된 런타임을 측정하십시오. `pnpm openclaw ...`는 소스 실행기 오버헤드도 함께 측정합니다.

## CLI 시작 및 명령 프로파일링

체크인된 시작 벤치마크:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

일반 소스 실행기를 통한 일회성 프로파일링에는 `OPENCLAW_RUN_NODE_CPU_PROF_DIR`을 설정하십시오.

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

소스 실행기는 Node CPU 프로파일 플래그를 추가하고 명령에 대한 `.cpuprofile`을 기록합니다. 명령 코드에 임시 계측을 추가하기 전에 이를 사용하십시오.

동기식 파일 시스템 또는 모듈 로더 작업으로 보이는 시작 중단의 경우, 소스 실행기를 통해 Node의 동기 I/O 추적 플래그를 추가하십시오.

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch`는 감시 중인 Gateway 자식 프로세스에서 기본적으로 이 플래그를 비활성화합니다. 감시 모드에서도 동기 I/O 추적 출력을 원하면 `OPENCLAW_TRACE_SYNC_IO=1`을 설정하십시오.

## Gateway 감시 모드

```bash
pnpm gateway:watch
```

기본적으로 이 명령은 `openclaw-gateway-watch-<profile>`이라는 이름의 tmux 세션(예: `openclaw-gateway-watch-main`)을 시작하거나 다시 시작합니다. `OPENCLAW_GATEWAY_PORT`가 기본 포트 `18789`와 다를 때만 `openclaw-gateway-watch-dev-19001`과 같은 포트 접미사가 추가됩니다. 대화형 터미널에서는 자동으로 연결되며, 비대화형 셸, CI 및 에이전트 실행 호출은 분리된 상태를 유지하고 대신 연결 지침을 출력합니다.

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux 창은 원시 감시기를 실행합니다.

```bash
node scripts/watch-node.mjs gateway --force
```

같은 포트를 감시하기 전에 설치된 Gateway 서비스를 중지하십시오.

```bash
pnpm openclaw gateway stop
```

감시기의 `--force`는 현재 리스너를 정리하지만, 관리되는 서비스를 비활성화하지는 않습니다. 그렇지 않으면 launchd, systemd 또는 Scheduled Task 서비스가 다시 생성되어 감시 중인 Gateway를 대체할 수 있습니다.

tmux를 사용하지 않는 포그라운드 모드:

```bash
pnpm gateway:watch:raw
# 또는
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 관리는 유지하되 자동 연결은 비활성화합니다.

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

시작/런타임 병목 지점을 디버깅할 때 감시 중인 Gateway의 CPU 시간을 프로파일링합니다.

```bash
pnpm gateway:watch --benchmark
```

감시 래퍼는 Gateway를 호출하기 전에 `--benchmark`를 처리하고, 각 Gateway 자식 프로세스가 종료될 때마다 V8 `.cpuprofile` 하나를 `.artifacts/gateway-watch-profiles/` 아래에 기록합니다. 현재 프로파일을 기록하려면 감시 중인 Gateway를 중지하거나 다시 시작한 다음 Chrome DevTools 또는 Speedscope로 여십시오.

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: 프로파일을 다른 위치에 기록합니다.
- `--benchmark-no-force`: 기본 `--force` 포트 정리를 건너뛰고 Gateway 포트가 이미 사용 중이면 즉시 실패합니다.

벤치마크 모드는 기본적으로 동기 I/O 추적의 과도한 출력을 억제합니다. CPU 프로파일과 동기 I/O 스택 추적을 모두 얻으려면 `--benchmark`와 함께 `OPENCLAW_TRACE_SYNC_IO=1`을 설정하십시오. 벤치마크 모드에서는 이러한 추적 블록이 벤치마크 디렉터리 아래의 `gateway-watch-output.log`로 이동하며(터미널 창에서는 필터링됨), 일반 Gateway 로그는 계속 표시됩니다.

tmux 래퍼는 `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT`, `OPENCLAW_SKIP_CHANNELS`를 포함한 일반적인 비밀이 아닌 런타임 선택자를 창으로 전달합니다. 공급자 자격 증명은 일반 프로필/구성에 저장하거나, 일회성 임시 비밀에는 원시 포그라운드 모드를 사용하십시오.

감시 중인 Gateway가 시작 도중 종료되면 감시기는 `openclaw doctor --fix --non-interactive`를 한 번 실행하고 Gateway 자식 프로세스를 다시 시작합니다. 개발 전용 복구 단계 없이 원래 시작 실패를 확인하려면 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`을 설정하십시오.

관리되는 tmux 창은 기본적으로 색상이 적용된 Gateway 로그를 사용합니다. ANSI 출력을 비활성화하려면 `pnpm gateway:watch`를 시작할 때 `FORCE_COLOR=0`을 설정하십시오.

감시기는 `src/` 아래의 빌드 관련 파일, 확장 기능 소스 파일, 확장 기능의 `package.json` 및 `openclaw.plugin.json` 메타데이터, `tsconfig.json`, `package.json`, `tsdown.config.ts`가 변경되면 다시 시작합니다. 확장 기능 메타데이터가 변경되면 강제 재빌드 없이 Gateway를 다시 시작하며, 소스 및 구성 변경 시에는 계속해서 먼저 `dist`를 다시 빌드합니다.

`gateway:watch` 뒤에 Gateway CLI 플래그를 추가하면 다시 시작할 때마다 그대로 전달됩니다. 같은 감시 명령을 다시 실행하면 지정된 tmux 창을 다시 생성합니다. 원시 감시기는 단일 감시기 잠금을 유지하므로 중복 감시기 부모 프로세스가 누적되지 않고 교체됩니다.

## 개발 프로필 + 개발 Gateway(--dev)

**서로 별개인** 두 가지 `--dev` 플래그:

- **전역 `--dev`(프로필):** 상태를 `~/.openclaw-dev` 아래로 격리하고 Gateway 포트를 기본적으로 `19001`로 설정합니다(파생 포트도 함께 이동).
- **`gateway --dev`:** 기본 구성과 작업 공간이 없으면 Gateway가 자동으로 생성하도록 지시합니다(부트스트랩은 건너뜀).

권장 흐름(개발 프로필 + 개발 부트스트랩):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

전역 설치가 없으면 `pnpm openclaw ...`를 통해 CLI를 실행하십시오.

수행되는 작업:

1. **프로필 격리**(전역 `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`(브라우저/캔버스 포트도 이에 따라 이동)

2. **개발 부트스트랩**(`gateway --dev`)
   - 구성이 없으면 최소 구성을 기록합니다(`gateway.mode=local`, 루프백에 바인딩).
   - `agents.defaults.workspace`를 개발 작업 공간으로 설정하고 `agents.defaults.skipBootstrap=true`를 설정합니다.
   - 작업 공간 파일이 없으면 초기 파일을 생성합니다: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - 기본 ID: **C3-PO**(프로토콜 드로이드).
   - `pnpm gateway:dev`는 채널 공급자를 건너뛰도록 `OPENCLAW_SKIP_CHANNELS=1`도 설정합니다.

재설정 흐름(새로 시작):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev`는 **전역** 프로필 플래그이며 일부 실행기에서 소비됩니다. 명시적으로 지정해야 하는 경우 환경 변수 형식을 사용하십시오.

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset`은 구성, 자격 증명, 세션 및 개발 작업 공간을 지운 다음(삭제하지 않고 휴지통으로 이동) 기본 개발 설정을 다시 생성합니다.

<Tip>
개발용이 아닌 Gateway가 이미 실행 중인 경우(launchd 또는 systemd) 먼저 중지하십시오.

```bash
openclaw gateway stop
```

</Tip>

## 원시 스트림 로깅

OpenClaw는 필터링/서식 지정 전에 **원시 어시스턴트 스트림**을 기록할 수 있습니다. 추론이 일반 텍스트 델타로 도착하는지(또는 별도의 사고 블록으로 도착하는지) 확인하는 가장 좋은 방법입니다.

CLI를 통해 활성화합니다.

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

기본 파일: `~/.openclaw/logs/raw-stream.jsonl`

## 안전 참고 사항

- 원시 스트림 로그에는 전체 프롬프트, 도구 출력 및 사용자 데이터가 포함될 수 있습니다.
- 로그를 로컬에 보관하고 디버깅 후 삭제하십시오.
- 로그를 공유하는 경우 먼저 비밀과 개인 식별 정보(PII)를 제거하십시오.

## VSCode에서 디버깅

빌드가 생성된 파일 이름을 해시화하므로 소스 맵이 필요합니다. 포함된 `launch.json`은 Gateway 서비스를 대상으로 합니다.

1. **Rebuild and Debug Gateway** - Gateway를 시작하기 전에 `/dist`를 삭제하고 디버깅을 활성화하여 다시 빌드합니다.
2. **Debug Gateway** - `/dist`를 건드리지 않고 기존 빌드를 디버깅합니다.

### 설정

1. **Run and Debug**(Activity Bar 또는 `Ctrl`+`Shift`+`D`)를 엽니다.
2. **Rebuild and Debug Gateway**를 선택하고 **Start Debugging**을 누릅니다.

빌드/디버그 주기를 수동으로 관리하려면 대신 다음을 수행하십시오.

1. 터미널에서 소스 맵을 활성화합니다.
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. 다시 빌드합니다: `pnpm clean:dist && pnpm build`
3. **Debug Gateway**를 선택하고 **Start Debugging**을 누릅니다.

`src/` TypeScript 파일에 중단점을 설정하십시오. 디버거가 소스 맵을 통해 이를 컴파일된 JavaScript에 매핑합니다.

### 참고 사항

- **Rebuild and Debug Gateway**는 실행할 때마다 `/dist`를 삭제하고 소스 맵을 활성화한 상태로 전체 `pnpm build`를 실행합니다.
- **Debug Gateway**는 `/dist`에 영향을 주지 않고 시작/중지할 수 있지만, 별도의 터미널에서 빌드 주기를 관리해야 합니다.
- 다른 CLI 하위 명령을 디버깅하려면 `launch.json`의 `args`를 편집하십시오.
- 다른 작업에 빌드된 CLI를 사용하려면(예: 디버그 세션에서 새 인증 토큰을 생성하는 경우 `dashboard --no-open`) 다른 터미널에서 `node ./openclaw.mjs` 또는 `alias openclaw-build="node $(pwd)/openclaw.mjs"`와 같은 별칭을 실행하십시오.

## 관련 문서

- [문제 해결](/ko/help/troubleshooting)
- [자주 묻는 질문](/ko/help/faq)
