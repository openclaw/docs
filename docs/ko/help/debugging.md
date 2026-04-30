---
read_when:
    - 추론 유출 여부를 확인하려면 원시 모델 출력을 검사해야 합니다.
    - 반복 개발하는 동안 Gateway를 감시 모드로 실행하려는 경우
    - 반복 가능한 디버깅 워크플로가 필요합니다
summary: '디버깅 도구: 감시 모드, 원시 모델 스트림, 추론 유출 추적'
title: 디버깅
x-i18n:
    generated_at: "2026-04-30T06:34:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

스트리밍 출력용 디버깅 도우미입니다. 특히 제공자가 reasoning을 일반 텍스트에 섞는 경우에 유용합니다.

## 런타임 디버그 재정의

채팅에서 `/debug`를 사용해 **런타임 전용** config 재정의(메모리, 디스크 아님)를 설정합니다.
`/debug`는 기본적으로 비활성화되어 있습니다. `commands.debug: true`로 활성화하세요.
`openclaw.json`을 편집하지 않고 잘 드러나지 않는 설정을 전환해야 할 때 편리합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`은 모든 재정의를 지우고 디스크의 config로 되돌립니다.

## 세션 trace 출력

전체 상세 모드를 켜지 않고 한 세션에서 Plugin 소유 trace/디버그 줄을 보고 싶을 때
`/trace`를 사용합니다.

예시:

```text
/trace
/trace on
/trace off
```

Active Memory 디버그 요약 같은 Plugin 진단에는 `/trace`를 사용하세요.
일반적인 상세 상태/도구 출력에는 계속 `/verbose`를 사용하고, 런타임 전용 config
재정의에는 계속 `/debug`를 사용하세요.

## Plugin 수명 주기 trace

Plugin 수명 주기 명령이 느리게 느껴지고 Plugin 메타데이터, 발견, 레지스트리,
런타임 미러, config 변경, 새로 고침 작업에 대한 내장 단계 분석이 필요할 때
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`을 사용합니다. trace는 옵트인 방식이며
stderr에 기록되므로 JSON 명령 출력은 계속 파싱할 수 있습니다.

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

CPU 프로파일러를 사용하기 전에 Plugin 수명 주기 조사에 이것을 사용하세요.
명령이 소스 체크아웃에서 실행 중이라면 `pnpm build` 후 `node dist/entry.js ...`로
빌드된 런타임을 측정하는 것을 선호하세요. `pnpm openclaw ...`도 소스 러너
오버헤드를 함께 측정합니다.

## 임시 CLI 디버그 타이밍

OpenClaw는 로컬 조사를 위한 작은 도우미로 `src/cli/debug-timing.ts`를 유지합니다.
이 도우미는 의도적으로 CLI 시작, 명령 라우팅, 어떤 명령에도 기본 연결되어 있지
않습니다. 느린 명령을 디버깅하는 동안에만 사용한 다음, 동작 변경을 랜딩하기 전에
import와 span을 제거하세요.

명령이 느리고 CPU 프로파일러를 사용할지 특정 서브시스템을 고칠지 결정하기 전에
빠른 단계 분석이 필요할 때 이것을 사용하세요.

### 임시 span 추가

조사 중인 코드 근처에 도우미를 추가하세요. 예를 들어 `openclaw models list`를
디버깅하는 동안 `src/commands/models/list.list-command.ts`의 임시 패치는 다음과
같을 수 있습니다.

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

지침:

- 임시 단계 이름에는 `debug:` 접두사를 붙이세요.
- 느리다고 의심되는 구간 주변에 몇 개의 span만 추가하세요.
- 도우미 이름보다 `registry`, `auth_store`, `rows` 같은 넓은 단계를 선호하세요.
- 동기 작업에는 `time()`을, promise에는 `timeAsync()`를 사용하세요.
- stdout을 깨끗하게 유지하세요. 도우미는 stderr에 기록하므로 명령 JSON 출력은
  계속 파싱할 수 있습니다.
- 최종 수정 PR을 열기 전에 임시 import와 span을 제거하세요.
- 최적화를 설명하는 이슈나 PR에 타이밍 출력 또는 짧은 요약을 포함하세요.

### 읽기 쉬운 출력으로 실행

읽기 쉬운 모드는 라이브 디버깅에 가장 적합합니다.

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

임시 `models list` 조사 출력 예시:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

이 출력에서 확인한 사항:

| 단계                                     |       시간 | 의미                                                                                                    |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | auth-profile store 로드가 가장 큰 비용이며 먼저 조사해야 합니다.                                        |
| `debug:models:list:ensure_models_json`   |       5.0s | `models.json` 동기화는 캐싱이나 skip 조건을 살펴볼 만큼 비용이 큽니다.                                  |
| `debug:models:list:load_model_registry`  |       5.9s | 레지스트리 구성과 제공자 가용성 작업도 의미 있는 비용입니다.                                           |
| `debug:models:list:read_registry_models` |       2.4s | 모든 레지스트리 모델을 읽는 작업도 비용이 있으며 `--all`에서 중요할 수 있습니다.                       |
| row 추가 단계                            | 총 3.2s    | 표시되는 행 5개를 만드는 데도 몇 초가 걸리므로 필터링 경로를 더 자세히 살펴볼 필요가 있습니다.         |
| `debug:models:list:print_model_table`    |        0ms | 렌더링은 병목이 아닙니다.                                                                               |

이 확인 사항만으로도 타이밍 코드를 프로덕션 경로에 남기지 않고 다음 패치를
진행하기에 충분합니다.

### JSON 출력으로 실행

타이밍 데이터를 저장하거나 비교하고 싶을 때 JSON 모드를 사용하세요.

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

각 stderr 줄은 하나의 JSON 객체입니다.

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### 랜딩 전 정리

최종 PR을 열기 전에:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

PR이 영구 진단 표면을 명시적으로 추가하는 경우가 아니라면, 이 명령은 임시 계측
호출 지점을 반환하지 않아야 합니다. 일반적인 성능 수정에서는 동작 변경, 테스트,
타이밍 근거가 포함된 짧은 메모만 남기세요.

더 깊은 CPU 핫스팟에는 타이밍 래퍼를 더 추가하는 대신 Node 프로파일링(`--cpu-prof`)
또는 외부 프로파일러를 사용하세요.

## Gateway watch 모드

빠른 반복 작업을 위해 파일 감시기 아래에서 Gateway를 실행하세요.

```bash
pnpm gateway:watch
```

기본적으로 이 명령은 `openclaw-gateway-watch-main`이라는 이름의 tmux 세션
(또는 `openclaw-gateway-watch-dev-19001` 같은 프로필/포트별 변형)을 시작하거나
재시작하고, 대화형 터미널에서는 자동으로 attach합니다. 비대화형 shell, CI,
agent exec 호출은 detached 상태를 유지하고 대신 attach 안내를 출력합니다.
필요할 때 수동으로 attach하세요.

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux pane은 원시 감시기를 실행합니다.

```bash
node scripts/watch-node.mjs gateway --force
```

tmux를 원하지 않을 때는 foreground 모드를 사용하세요.

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 관리는 유지하면서 자동 attach를 비활성화합니다.

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

tmux 래퍼는 `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, `OPENCLAW_SKIP_CHANNELS` 같은 일반적인 비밀이 아닌
런타임 선택자를 pane으로 전달합니다. 제공자 자격 증명은 일반 프로필/config에
넣거나, 일회성 임시 비밀에는 원시 foreground 모드를 사용하세요.

감시기는 `src/` 아래의 빌드 관련 파일, extension 소스 파일, extension
`package.json` 및 `openclaw.plugin.json` 메타데이터, `tsconfig.json`,
`package.json`, `tsdown.config.ts` 변경 시 재시작합니다. extension 메타데이터
변경은 `tsdown` 재빌드를 강제하지 않고 Gateway를 재시작합니다. 소스 및 config
변경은 여전히 먼저 `dist`를 재빌드합니다.

`gateway:watch` 뒤에 Gateway CLI 플래그를 추가하면 각 재시작 때 그대로 전달됩니다.
동일한 watch 명령을 다시 실행하면 이름이 지정된 tmux pane이 다시 생성되며, 원시
감시기는 여전히 단일 감시기 잠금을 유지하므로 중복 감시기 부모가 쌓이는 대신
대체됩니다.

## Dev profile + dev gateway (--dev)

상태를 격리하고 디버깅을 위한 안전한 일회용 설정을 띄우려면 dev profile을
사용하세요. `--dev` 플래그는 **두 가지**가 있습니다.

- **전역 `--dev`(profile):** 상태를 `~/.openclaw-dev` 아래로 격리하고
  Gateway 포트를 기본적으로 `19001`로 설정합니다(파생 포트도 함께 이동).
- **`gateway --dev`: 누락된 경우 Gateway가 기본 config + workspace를 자동 생성하도록 지시합니다**(그리고 BOOTSTRAP.md를 건너뜁니다).

권장 흐름(dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

아직 전역 설치가 없다면 `pnpm openclaw ...`로 CLI를 실행하세요.

이 작업의 내용:

1. **Profile 격리**(전역 `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`(브라우저/canvas도 그에 맞게 이동)

2. **Dev bootstrap**(`gateway --dev`)
   - 누락된 경우 최소 config를 작성합니다(`gateway.mode=local`, bind loopback).
   - `agent.workspace`를 dev workspace로 설정합니다.
   - `agent.skipBootstrap=true`를 설정합니다(BOOTSTRAP.md 없음).
   - 누락된 경우 workspace 파일을 초기화합니다:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - 기본 identity: **C3‑PO**(protocol droid).
   - dev 모드에서는 channel 제공자를 건너뜁니다(`OPENCLAW_SKIP_CHANNELS=1`).

초기화 흐름(새로 시작):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev`는 **전역** profile 플래그이며 일부 runner에서 소비됩니다. 명시적으로
표기해야 한다면 env var 형식을 사용하세요.

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset`은 config, 자격 증명, 세션, dev workspace를 지운 뒤(`rm`이 아니라
`trash` 사용) 기본 dev 설정을 다시 생성합니다.

<Tip>
dev가 아닌 Gateway가 이미 실행 중이라면(launchd 또는 systemd), 먼저 중지하세요.

```bash
openclaw gateway stop
```

</Tip>

## 원시 스트림 로깅(OpenClaw)

OpenClaw는 필터링/포맷팅 전에 **원시 assistant 스트림**을 기록할 수 있습니다.
이는 reasoning이 일반 텍스트 delta로 도착하는지(또는 별도의 thinking block으로
도착하는지) 확인하는 가장 좋은 방법입니다.

CLI로 활성화합니다:

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

## 원시 청크 로깅(pi-mono)

블록으로 파싱되기 전에 **원시 OpenAI 호환 청크**를 캡처하기 위해,
pi-mono는 별도의 로거를 제공합니다:

```bash
PI_RAW_STREAM=1
```

선택적 경로:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

기본 파일:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 참고: 이는 pi-mono의
> `openai-completions` provider를 사용하는 프로세스에서만 출력됩니다.

## 안전 참고 사항

- 원시 스트림 로그에는 전체 프롬프트, 도구 출력, 사용자 데이터가 포함될 수 있습니다.
- 로그를 로컬에 보관하고 디버깅 후 삭제하세요.
- 로그를 공유하는 경우 먼저 시크릿과 PII를 제거하세요.

## 관련

- [문제 해결](/ko/help/troubleshooting)
- [FAQ](/ko/help/faq)
