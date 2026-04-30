---
read_when:
    - Plugin 설치 또는 구성
    - Plugin 검색 및 로드 규칙 이해
    - Codex/Claude 호환 Plugin 번들 사용하기
sidebarTitle: Install and Configure
summary: OpenClaw Plugin 설치, 구성 및 관리
title: Plugin
x-i18n:
    generated_at: "2026-04-30T06:55:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Plugin은 OpenClaw에 채널, 모델 제공자, 에이전트 하네스, 도구, Skills, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색 등 새로운 기능을 확장합니다. 일부 Plugin은 **core**(OpenClaw와 함께 제공)이고, 그 외는 **external**입니다. 대부분의 외부 Plugin은 [ClawHub](/ko/tools/clawhub)를 통해 게시되고 검색됩니다. Npm은 직접 설치와, 마이그레이션이 완료될 때까지 임시로 유지되는 OpenClaw 소유 Plugin 패키지 세트에 대해 계속 지원됩니다.

## 빠른 시작

<Steps>
  <Step title="로드된 항목 보기">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Plugin 설치">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway 재시작">
    ```bash
    openclaw gateway restart
    ```

    그런 다음 구성 파일의 `plugins.entries.\<id\>.config` 아래에서 구성하세요.

  </Step>
</Steps>

채팅 네이티브 제어를 선호한다면 `commands.plugins: true`를 활성화하고 다음을 사용하세요.

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

설치 경로는 CLI와 동일한 리졸버를 사용합니다. 로컬 경로/아카이브, 명시적 `clawhub:<pkg>`, 명시적 `npm:<pkg>`, 또는 단순 패키지 명세(먼저 ClawHub, 그다음 npm 대체)를 사용할 수 있습니다.

구성이 유효하지 않으면 설치는 보통 안전하게 실패하고 `openclaw doctor --fix`를 안내합니다. 유일한 복구 예외는 `openclaw.install.allowInvalidConfigRecovery`를 선택한 Plugin에 대한 제한적인 번들 Plugin 재설치 경로입니다.
Gateway 시작 중에는 한 Plugin의 잘못된 구성이 해당 Plugin에만 격리됩니다. 시작 로그는 `plugins.entries.<id>.config` 문제를 기록하고, 로드 중 해당 Plugin을 건너뛰며, 다른 Plugin과 채널은 온라인으로 유지합니다. `openclaw doctor --fix`를 실행하면 해당 Plugin 항목을 비활성화하고 잘못된 구성 페이로드를 제거하여 잘못된 Plugin 구성을 격리합니다. 일반 구성 백업은 이전 값을 유지합니다.
채널 구성이 더 이상 검색할 수 없는 Plugin을 참조하지만 동일한 오래된 Plugin ID가 Plugin 구성 또는 설치 기록에 남아 있으면, Gateway 시작은 모든 다른 채널을 차단하는 대신 경고를 기록하고 해당 채널을 건너뜁니다. `openclaw doctor --fix`를 실행해 오래된 채널/Plugin 항목을 제거하세요. 오래된 Plugin 증거가 없는 알 수 없는 채널 키는 여전히 유효성 검사에 실패하므로 오타가 계속 드러납니다.
`plugins.enabled: false`가 설정되어 있으면 오래된 Plugin 참조는 비활성으로 처리됩니다. Gateway 시작은 Plugin 검색/로드 작업을 건너뛰고 `openclaw doctor`는 비활성화된 Plugin 구성을 자동 제거하지 않고 보존합니다. 오래된 Plugin ID를 제거하려면 doctor 정리를 실행하기 전에 Plugin을 다시 활성화하세요.

패키징된 OpenClaw 설치는 모든 번들 Plugin의 런타임 의존성 트리를 즉시 설치하지 않습니다. 번들 OpenClaw 소유 Plugin이 Plugin 구성, 레거시 채널 구성, 또는 기본 활성화 매니페스트를 통해 활성 상태이면, 시작은 해당 Plugin을 가져오기 전에 그 Plugin이 선언한 런타임 의존성만 복구합니다. 저장된 채널 인증 상태만으로는 Gateway 시작 런타임 의존성 복구를 위해 번들 채널이 활성화되지 않습니다.
명시적 비활성화가 여전히 우선합니다. `plugins.entries.<id>.enabled: false`, `plugins.deny`, `plugins.enabled: false`, `channels.<id>.enabled: false`는 해당 Plugin/채널의 자동 번들 런타임 의존성 복구를 막습니다.
비어 있지 않은 `plugins.allow`도 기본 활성화 번들 런타임 의존성 복구 범위를 제한합니다. 명시적 번들 채널 활성화(`channels.<id>.enabled: true`)는 여전히 해당 채널의 Plugin 의존성을 복구할 수 있습니다.
외부 Plugin과 사용자 지정 로드 경로는 여전히 `openclaw plugins install`을 통해 설치해야 합니다.

## Plugin 유형

OpenClaw는 두 가지 Plugin 형식을 인식합니다.

| 형식       | 작동 방식                                                          | 예시                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 런타임 모듈, 프로세스 내에서 실행         | 공식 Plugin, 커뮤니티 npm 패키지                      |
| **Bundle** | Codex/Claude/Cursor 호환 레이아웃, OpenClaw 기능에 매핑            | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

둘 다 `openclaw plugins list` 아래에 표시됩니다. 번들 세부 정보는 [Plugin Bundles](/ko/plugins/bundles)를 참조하세요.

네이티브 Plugin을 작성하는 경우 [Building Plugins](/ko/plugins/building-plugins)와 [Plugin SDK Overview](/ko/plugins/sdk-overview)부터 시작하세요.

## 패키지 엔트리포인트

네이티브 Plugin npm 패키지는 `package.json`에 `openclaw.extensions`를 선언해야 합니다. 각 항목은 패키지 디렉터리 안에 있어야 하며 읽을 수 있는 런타임 파일로 해석되거나, `src/index.ts`에서 `dist/index.js`처럼 추론된 빌드 JavaScript 피어가 있는 TypeScript 소스 파일로 해석되어야 합니다.

게시된 런타임 파일이 소스 항목과 같은 경로에 있지 않은 경우 `openclaw.runtimeExtensions`를 사용하세요. 있는 경우 `runtimeExtensions`에는 모든 `extensions` 항목마다 정확히 하나의 항목이 포함되어야 합니다. 목록이 일치하지 않으면 소스 경로로 조용히 대체하지 않고 설치와 Plugin 검색이 실패합니다.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## 공식 Plugin

### 마이그레이션 중인 OpenClaw 소유 npm 패키지

ClawHub는 대부분의 Plugin에 대한 기본 배포 경로입니다. 현재 패키징된 OpenClaw 릴리스에는 이미 많은 공식 Plugin이 번들로 포함되어 있으므로 일반 설정에서는 별도의 npm 설치가 필요하지 않습니다. 모든 OpenClaw 소유 Plugin이 ClawHub로 마이그레이션될 때까지, OpenClaw는 이전/사용자 지정 설치와 직접 npm 워크플로를 위해 일부 `@openclaw/*` Plugin 패키지를 npm에 계속 제공합니다.

npm이 `@openclaw/*` Plugin 패키지를 deprecated로 보고하면, 해당 패키지 버전은 이전 외부 패키지 트레인에서 온 것입니다. 더 새로운 npm 패키지가 게시될 때까지 현재 OpenClaw의 번들 Plugin이나 로컬 체크아웃을 사용하세요.

| Plugin          | 패키지                    | 문서                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/ko/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/ko/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/ko/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/ko/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/ko/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/ko/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/ko/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/ko/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/ko/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/ko/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/ko/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/ko/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/ko/plugins/zalouser)         |

### Core(OpenClaw와 함께 제공)

<AccordionGroup>
  <Accordion title="모델 제공자(기본적으로 활성화)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="메모리 Plugin">
    - `memory-core` — 번들 메모리 검색(`plugins.slots.memory`를 통한 기본값)
    - `memory-lancedb` — 자동 리콜/캡처가 포함된 주문형 설치 장기 메모리(`plugins.slots.memory = "memory-lancedb"` 설정)

    OpenAI 호환 임베딩 설정, Ollama 예시, 리콜 제한, 문제 해결은 [Memory LanceDB](/ko/plugins/memory-lancedb)를 참조하세요.

  </Accordion>

  <Accordion title="음성 제공자(기본적으로 활성화)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="기타">
    - `browser` — 브라우저 도구, `openclaw browser` CLI, `browser.request` gateway 메서드, 브라우저 런타임, 기본 브라우저 제어 서비스를 위한 번들 브라우저 Plugin(기본적으로 활성화, 교체하기 전에 비활성화하세요)
    - `copilot-proxy` — VS Code Copilot Proxy 브리지(기본적으로 비활성화)

  </Accordion>
</AccordionGroup>

서드파티 Plugin을 찾고 있나요? [Community Plugins](/ko/plugins/community)를 참조하세요.

## 구성

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| 필드             | 설명                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 마스터 토글(기본값: `true`)                               |
| `allow`          | Plugin 허용 목록(선택 사항)                               |
| `deny`           | Plugin 거부 목록(선택 사항, 거부가 우선)                  |
| `load.paths`     | 추가 Plugin 파일/디렉터리                                 |
| `slots`          | 배타적 슬롯 선택기(예: `memory`, `contextEngine`)          |
| `entries.\<id\>` | Plugin별 토글 + 구성                                      |

구성 변경에는 **Gateway 재시작이 필요합니다**. Gateway가 구성 감시 + 프로세스 내 재시작이 활성화된 상태(기본 `openclaw gateway` 경로)로 실행 중이면, 해당 재시작은 보통 구성 쓰기가 적용된 직후 자동으로 수행됩니다. 네이티브 Plugin 런타임 코드나 수명 주기 훅에 대해 지원되는 핫 리로드 경로는 없습니다. 업데이트된 `register(api)` 코드, `api.on(...)` 훅, 도구, 서비스, 제공자/런타임 훅이 실행되기를 기대하기 전에 실제 채널을 제공하는 Gateway 프로세스를 재시작하세요.

`openclaw plugins list`는 로컬 Plugin 레지스트리/구성 스냅샷입니다. 여기서 `enabled`인 Plugin은 저장된 레지스트리와 현재 구성이 해당 Plugin의 참여를 허용한다는 뜻입니다. 이미 실행 중인 원격 Gateway 자식 프로세스가 같은 Plugin 코드로 재시작되었음을 증명하지는 않습니다. 래퍼 프로세스가 있는 VPS/컨테이너 설정에서는 실제 `openclaw gateway run` 프로세스에 재시작을 보내거나, 실행 중인 Gateway에 대해 `openclaw gateway restart`를 사용하세요.

<Accordion title="Plugin 상태: 비활성화 vs 누락 vs 유효하지 않음">
  - **비활성화**: Plugin은 존재하지만 활성화 규칙에 의해 꺼졌습니다. 구성은 보존됩니다.
  - **누락**: 구성이 검색에서 찾지 못한 Plugin ID를 참조합니다.
  - **유효하지 않음**: Plugin은 존재하지만 그 구성이 선언된 스키마와 일치하지 않습니다. Gateway 시작은 해당 Plugin만 건너뜁니다. `openclaw doctor --fix`는 해당 항목을 비활성화하고 구성 페이로드를 제거하여 유효하지 않은 항목을 격리할 수 있습니다.

</Accordion>

## 검색 및 우선순위

OpenClaw는 다음 순서로 Plugin을 스캔합니다(첫 번째 일치가 우선).

<Steps>
  <Step title="구성 경로">
    `plugins.load.paths` — 명시적 파일 또는 디렉터리 경로입니다. OpenClaw 자체 패키징 번들 Plugin 디렉터리를 다시 가리키는 경로는 무시됩니다. 오래된 별칭을 제거하려면 `openclaw doctor --fix`를 실행하세요.
  </Step>

  <Step title="워크스페이스 Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 및 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="전역 Plugin">
    `~/.openclaw/<plugin-root>/*.ts` 및 `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="번들 Plugin">
    OpenClaw와 함께 제공됩니다. 다수는 기본적으로 활성화됩니다(모델 제공자, 음성).
    나머지는 명시적으로 활성화해야 합니다.
  </Step>
</Steps>

패키지 설치와 Docker 이미지는 일반적으로 컴파일된 `dist/extensions` 트리에서 번들 Plugin을 확인합니다. 번들 Plugin 소스 디렉터리가 일치하는 패키지 소스 경로 위에 바인드 마운트된 경우, 예를 들어 `/app/extensions/synology-chat`이면, OpenClaw는 해당 마운트된 소스 디렉터리를 번들 소스 오버레이로 처리하고 패키지된 `/app/dist/extensions/synology-chat` 번들보다 먼저 발견합니다. 이렇게 하면 모든 번들 Plugin을 TypeScript 소스로 되돌리지 않고도 유지관리자 컨테이너 루프가 계속 작동합니다. 소스 오버레이 마운트가 있더라도 패키지된 dist 번들을 강제로 사용하려면 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`을 설정하세요.

### 활성화 규칙

- `plugins.enabled: false`는 모든 Plugin을 비활성화하고 Plugin 발견/로드 작업을 건너뜁니다.
- `plugins.deny`는 항상 허용보다 우선합니다.
- `plugins.entries.\<id\>.enabled: false`는 해당 Plugin을 비활성화합니다.
- 워크스페이스 출처 Plugin은 **기본적으로 비활성화**됩니다(명시적으로 활성화해야 함).
- 번들 Plugin은 재정의하지 않는 한 내장된 기본 활성화 집합을 따릅니다.
- 독점 슬롯은 해당 슬롯에 선택된 Plugin을 강제로 활성화할 수 있습니다.
- 일부 번들 옵트인 Plugin은 설정에서 제공자 모델 참조, 채널 설정 또는 하네스 런타임 같은 Plugin 소유 표면의 이름을 지정하면 자동으로 활성화됩니다.
- `plugins.enabled: false`가 활성화되어 있는 동안 오래된 Plugin 설정은 보존됩니다. 오래된 ID를 제거하려면 doctor 정리를 실행하기 전에 Plugin을 다시 활성화하세요.
- OpenAI 계열 Codex 경로는 별도의 Plugin 경계를 유지합니다.
  `openai-codex/*`는 OpenAI Plugin에 속하며, 번들 Codex 앱 서버 Plugin은 `agentRuntime.id: "codex"` 또는 레거시 `codex/*` 모델 참조로 선택됩니다.

## 런타임 훅 문제 해결

Plugin이 `plugins list`에 표시되지만 실시간 채팅 트래픽에서 `register(api)` 부작용이나 훅이 실행되지 않으면 먼저 다음을 확인하세요.

- `openclaw gateway status --deep --require-rpc`를 실행하고 활성 Gateway URL, 프로필, 설정 경로, 프로세스가 편집 중인 대상과 일치하는지 확인하세요.
- Plugin 설치/설정/코드 변경 후 실시간 Gateway를 다시 시작하세요. 래퍼 컨테이너에서는 PID 1이 감독자일 뿐일 수 있으므로 자식 `openclaw gateway run` 프로세스를 다시 시작하거나 신호를 보내세요.
- 훅 등록과 진단을 확인하려면 `openclaw plugins inspect <id> --json`을 사용하세요. `llm_input`, `llm_output`, `before_agent_finalize`, `agent_end` 같은 비번들 대화 훅에는 `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.
- 모델 전환에는 `before_model_resolve`를 권장합니다. 에이전트 턴의 모델 확인 전에 실행됩니다. `llm_output`은 모델 시도가 어시스턴트 출력을 생성한 뒤에만 실행됩니다.
- 유효한 세션 모델을 증명하려면 `openclaw sessions` 또는 Gateway 세션/상태 표면을 사용하고, 제공자 페이로드를 디버그할 때는 `--raw-stream --raw-stream-path <path>`로 Gateway를 시작하세요.

### 중복 채널 또는 도구 소유권

증상:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

이는 둘 이상의 활성화된 Plugin이 동일한 채널, 설정 흐름 또는 도구 이름을 소유하려고 한다는 뜻입니다. 가장 흔한 원인은 이제 같은 채널 ID를 제공하는 번들 Plugin 옆에 외부 채널 Plugin이 설치된 경우입니다.

디버그 단계:

- 모든 활성화된 Plugin과 출처를 보려면 `openclaw plugins list --enabled --verbose`를 실행하세요.
- 의심되는 각 Plugin에 대해 `openclaw plugins inspect <id> --json`을 실행하고 `channels`, `channelConfigs`, `tools`, 진단을 비교하세요.
- Plugin 패키지를 설치하거나 제거한 뒤에는 `openclaw plugins registry --refresh`를 실행하여 저장된 메타데이터가 현재 설치를 반영하도록 하세요.
- 설치, 레지스트리 또는 설정 변경 후 Gateway를 다시 시작하세요.

수정 옵션:

- 하나의 Plugin이 동일한 채널 ID에 대해 다른 Plugin을 의도적으로 대체하는 경우, 선호되는 Plugin은 더 낮은 우선순위의 Plugin ID와 함께 `channelConfigs.<channel-id>.preferOver`를 선언해야 합니다. [/plugins/manifest#replacing-another-channel-plugin](/ko/plugins/manifest#replacing-another-channel-plugin)을 참조하세요.
- 중복이 실수라면 `plugins.entries.<plugin-id>.enabled: false`로 한쪽을 비활성화하거나 오래된 Plugin 설치를 제거하세요.
- 두 Plugin을 모두 명시적으로 활성화했다면 OpenClaw는 해당 요청을 유지하고 충돌을 보고합니다. 채널의 소유자를 하나 선택하거나 Plugin 소유 도구의 이름을 바꾸어 런타임 표면이 명확해지도록 하세요.

## Plugin 슬롯(독점 범주)

일부 범주는 독점적입니다(한 번에 하나만 활성화됨).

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| 슬롯            | 제어 대상              | 기본값              |
| --------------- | ---------------------- | ------------------- |
| `memory`        | 활성 메모리 Plugin     | `memory-core`       |
| `contextEngine` | 활성 컨텍스트 엔진     | `legacy` (내장)     |

## CLI 참조

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

번들 Plugin은 OpenClaw와 함께 제공됩니다. 다수는 기본적으로 활성화됩니다(예: 번들 모델 제공자, 번들 음성 제공자, 번들 브라우저 Plugin). 다른 번들 Plugin은 여전히 `openclaw plugins enable <id>`가 필요합니다.

`--force`는 기존에 설치된 Plugin 또는 훅 팩을 제자리에서 덮어씁니다. 추적 중인 npm Plugin의 일반 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 사용하세요. 관리 설치 대상에 복사하는 대신 소스 경로를 재사용하는 `--link`와 함께 사용할 수 없습니다.

`plugins.allow`가 이미 설정되어 있으면 `openclaw plugins install`은 설치된 Plugin ID를 활성화하기 전에 해당 허용 목록에 추가합니다. 같은 Plugin ID가 `plugins.deny`에 있으면 설치는 오래된 거부 항목을 제거하여 명시적 설치가 다시 시작 후 즉시 로드될 수 있도록 합니다.

OpenClaw는 Plugin 인벤터리, 기여 소유권, 시작 계획의 콜드 읽기 모델로 저장된 로컬 Plugin 레지스트리를 유지합니다. 설치, 업데이트, 제거, 활성화, 비활성화 흐름은 Plugin 상태를 변경한 뒤 해당 레지스트리를 새로 고칩니다. 동일한 `plugins/installs.json` 파일은 최상위 `installRecords`에 영구 설치 메타데이터를, `plugins`에 다시 빌드 가능한 매니페스트 메타데이터를 보관합니다. 레지스트리가 없거나 오래되었거나 유효하지 않으면 `openclaw plugins registry --refresh`가 Plugin 런타임 모듈을 로드하지 않고 설치 기록, 설정 정책, 매니페스트/패키지 메타데이터에서 매니페스트 뷰를 다시 빌드합니다.
`openclaw plugins update <id-or-npm-spec>`는 추적 중인 설치에 적용됩니다. dist-tag 또는 정확한 버전이 포함된 npm 패키지 spec을 전달하면 패키지 이름을 추적 중인 Plugin 기록으로 다시 확인하고 향후 업데이트를 위해 새 spec을 기록합니다. 버전 없이 패키지 이름을 전달하면 정확히 고정된 설치가 레지스트리의 기본 릴리스 라인으로 돌아갑니다. 설치된 npm Plugin이 이미 확인된 버전 및 기록된 아티팩트 ID와 일치하면 OpenClaw는 다운로드, 재설치 또는 설정 재작성 없이 업데이트를 건너뜁니다.

`--pin`은 npm 전용입니다. 마켓플레이스 설치는 npm spec 대신 마켓플레이스 소스 메타데이터를 저장하므로 `--marketplace`와 함께 사용할 수 없습니다.

`--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐에 대한 비상 우회 옵션입니다. Plugin 설치와 Plugin 업데이트가 내장 `critical` 발견 항목을 지나 계속 진행되도록 허용하지만, Plugin `before_install` 정책 차단이나 스캔 실패 차단은 우회하지 않습니다. 설치 스캔은 패키지된 테스트 목이 차단되지 않도록 `tests/`, `__tests__/`, `*.test.*`, `*.spec.*` 같은 일반적인 테스트 파일과 디렉터리를 무시합니다. 선언된 Plugin 런타임 진입점은 이러한 이름 중 하나를 사용하더라도 여전히 스캔됩니다.

이 CLI 플래그는 Plugin 설치/업데이트 흐름에만 적용됩니다. Gateway 기반 skill 종속성 설치는 대신 일치하는 `dangerouslyForceUnsafeInstall` 요청 재정의를 사용하며, `openclaw skills install`은 별도의 ClawHub skill 다운로드/설치 흐름으로 유지됩니다.

ClawHub에 게시한 Plugin이 스캔으로 숨겨지거나 차단된 경우 ClawHub 대시보드를 열거나 `clawhub package rescan <name>`을 실행하여 ClawHub에 다시 확인을 요청하세요. `--dangerously-force-unsafe-install`은 자신의 머신에서의 설치에만 영향을 줍니다. ClawHub에 Plugin 재스캔을 요청하거나 차단된 릴리스를 공개로 만들지는 않습니다.

호환 번들은 동일한 Plugin 목록/검사/활성화/비활성화 흐름에 참여합니다. 현재 런타임 지원에는 번들 Skills, Claude command-skills, Claude `settings.json` 기본값, Claude `.lsp.json` 및 매니페스트 선언 `lspServers` 기본값, Cursor command-skills, 호환 Codex 훅 디렉터리가 포함됩니다.

`openclaw plugins inspect <id>`는 번들 기반 Plugin에 대해 감지된 번들 기능과 지원되거나 지원되지 않는 MCP 및 LSP 서버 항목도 보고합니다.

마켓플레이스 소스는 `~/.claude/plugins/known_marketplaces.json`의 Claude 알려진 마켓플레이스 이름, 로컬 마켓플레이스 루트 또는 `marketplace.json` 경로, `owner/repo` 같은 GitHub 축약형, GitHub 저장소 URL 또는 git URL일 수 있습니다. 원격 마켓플레이스의 경우 Plugin 항목은 클론된 마켓플레이스 저장소 내부에 있어야 하며 상대 경로 소스만 사용해야 합니다.

전체 세부 정보는 [`openclaw plugins` CLI 참조](/ko/cli/plugins)를 참조하세요.

## Plugin API 개요

네이티브 Plugin은 `register(api)`를 노출하는 엔트리 객체를 내보냅니다. 이전 Plugin은 여전히 레거시 별칭으로 `activate(api)`를 사용할 수 있지만, 새 Plugin은 `register`를 사용해야 합니다.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw는 엔트리 객체를 로드하고 Plugin 활성화 중에 `register(api)`를 호출합니다. 로더는 이전 Plugin을 위해 여전히 `activate(api)`로 폴백하지만, 번들 Plugin과 새 외부 Plugin은 `register`를 공개 계약으로 간주해야 합니다.

`api.registrationMode`는 Plugin에 엔트리가 로드되는 이유를 알려줍니다:

| 모드            | 의미                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 런타임 활성화. 도구, 훅, 서비스, 명령, 라우트 및 기타 라이브 부작용을 등록합니다.                              |
| `discovery`     | 읽기 전용 기능 탐색. 제공자와 메타데이터를 등록합니다. 신뢰할 수 있는 Plugin 엔트리 코드는 로드될 수 있지만, 라이브 부작용은 건너뜁니다. |
| `setup-only`    | 경량 설정 엔트리를 통한 채널 설정 메타데이터 로딩.                                                                |
| `setup-runtime` | 런타임 엔트리도 필요한 채널 설정 로딩.                                                                         |
| `cli-metadata`  | CLI 명령 메타데이터 수집만 수행합니다.                                                                                            |

소켓, 데이터베이스, 백그라운드 워커 또는 수명이 긴
클라이언트를 여는 Plugin 엔트리는 이러한 부작용을 `api.registrationMode === "full"`로 보호해야 합니다.
탐색 로드는 활성화 로드와 별도로 캐시되며 실행 중인 Gateway 레지스트리를 대체하지 않습니다.
탐색은 활성화하지 않지만 import가 없는 것은 아닙니다.
OpenClaw는 스냅샷을 빌드하기 위해 신뢰할 수 있는 Plugin 엔트리 또는 채널 Plugin 모듈을 평가할 수 있습니다.
모듈 최상위 수준을 가볍고 부작용이 없게 유지하고,
네트워크 클라이언트, 하위 프로세스, 리스너, 자격 증명 읽기 및 서비스 시작은
전체 런타임 경로 뒤로 이동하세요.

일반적인 등록 메서드:

| 메서드                                  | 등록하는 항목           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 모델 제공자(LLM)        |
| `registerChannel`                       | 채팅 채널                |
| `registerTool`                          | 에이전트 도구                  |
| `registerHook` / `on(...)`              | 수명 주기 훅             |
| `registerSpeechProvider`                | 텍스트 음성 변환 / STT        |
| `registerRealtimeTranscriptionProvider` | 스트리밍 STT               |
| `registerRealtimeVoiceProvider`         | 양방향 실시간 음성       |
| `registerMediaUnderstandingProvider`    | 이미지/오디오 분석        |
| `registerImageGenerationProvider`       | 이미지 생성            |
| `registerMusicGenerationProvider`       | 음악 생성            |
| `registerVideoGenerationProvider`       | 비디오 생성            |
| `registerWebFetchProvider`              | 웹 가져오기 / 스크레이프 제공자 |
| `registerWebSearchProvider`             | 웹 검색                  |
| `registerHttpRoute`                     | HTTP 엔드포인트               |
| `registerCommand` / `registerCli`       | CLI 명령                |
| `registerContextEngine`                 | 컨텍스트 엔진              |
| `registerService`                       | 백그라운드 서비스          |

타입이 지정된 수명 주기 훅의 훅 가드 동작:

- `before_tool_call`: `{ block: true }`는 최종 결정입니다. 우선순위가 낮은 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`는 아무 작업도 하지 않으며 이전 차단을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 최종 결정입니다. 우선순위가 낮은 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`는 아무 작업도 하지 않으며 이전 차단을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 최종 결정입니다. 우선순위가 낮은 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`는 아무 작업도 하지 않으며 이전 취소를 해제하지 않습니다.

네이티브 Codex 앱 서버는 Codex 네이티브 도구 이벤트를 이
훅 표면으로 브리지합니다. Plugin은 `before_tool_call`을 통해 네이티브 Codex 도구를 차단하고,
`after_tool_call`을 통해 결과를 관찰하며, Codex
`PermissionRequest` 승인에 참여할 수 있습니다. 브리지는 아직 Codex 네이티브 도구
인수를 다시 쓰지 않습니다. 정확한 Codex 런타임 지원 경계는
[Codex 하네스 v1 지원 계약](/ko/plugins/codex-harness#v1-support-contract)에 있습니다.

전체 타입 지정 훅 동작은 [SDK 개요](/ko/plugins/sdk-overview#hook-decision-semantics)를 참조하세요.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins) — 자체 Plugin 만들기
- [Plugin 번들](/ko/plugins/bundles) — Codex/Claude/Cursor 번들 호환성
- [Plugin 매니페스트](/ko/plugins/manifest) — 매니페스트 스키마
- [도구 등록](/ko/plugins/building-plugins#registering-agent-tools) — Plugin에 에이전트 도구 추가
- [Plugin 내부 구조](/ko/plugins/architecture) — 기능 모델 및 로드 파이프라인
- [커뮤니티 Plugin](/ko/plugins/community) — 타사 목록
