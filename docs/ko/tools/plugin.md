---
read_when:
    - Plugin 설치 또는 구성
    - Plugin 검색 및 로드 규칙 이해
    - Codex/Claude 호환 plugin 번들 사용
sidebarTitle: Install and Configure
summary: OpenClaw plugin 설치, 구성 및 관리
title: Plugin
x-i18n:
    generated_at: "2026-04-26T11:40:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

Plugin은 OpenClaw에 새로운 기능을 추가합니다: 채널, 모델 provider,
에이전트 하니스, 도구, Skills, 음성, 실시간 전사, 실시간
음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹
검색 등입니다. 일부 plugin은 **core**(OpenClaw와 함께 제공)이고, 다른 일부는
**external**(커뮤니티가 npm에 게시)입니다.

## 빠른 시작

<Steps>
  <Step title="로드된 항목 보기">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Plugin 설치">
    ```bash
    # npm에서
    openclaw plugins install @openclaw/voice-call

    # 로컬 디렉터리 또는 아카이브에서
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway 재시작">
    ```bash
    openclaw gateway restart
    ```

    그런 다음 config 파일의 `plugins.entries.\<id\>.config` 아래에서 구성하세요.

  </Step>
</Steps>

채팅 네이티브 제어를 선호한다면 `commands.plugins: true`를 활성화하고 다음을 사용하세요:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

설치 경로는 CLI와 동일한 해석기를 사용합니다: 로컬 경로/아카이브, 명시적
`clawhub:<pkg>`, 또는 일반 패키지 지정자(ClawHub 우선, 이후 npm 대체).

config가 잘못되면 설치는 일반적으로 실패 시 닫힘 방식으로 동작하며
`openclaw doctor --fix`를 안내합니다. 유일한 복구 예외는
`openclaw.install.allowInvalidConfigRecovery`에 opt-in한 plugin을 위한 제한적인 번들 plugin
재설치 경로입니다.

패키지된 OpenClaw 설치는 모든 번들 plugin의
런타임 의존성 트리를 즉시 설치하지 않습니다. 번들된 OpenClaw 소유 plugin이
plugin config, 레거시 채널 config, 또는 기본 활성화 manifest를 통해 활성 상태이면,
시작 시 해당 plugin을 가져오기 전에 선언된 런타임 의존성만 복구합니다.
영속된 채널 인증 상태만으로는
Gateway 시작 시 런타임 의존성 복구를 위해 번들 채널이 활성화되지 않습니다.
명시적 비활성화가 여전히 우선합니다: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false`, 그리고 `channels.<id>.enabled: false`는
해당 plugin/채널에 대한 자동 번들 런타임 의존성 복구를 방지합니다.
비어 있지 않은 `plugins.allow`도 기본 활성화된 번들 런타임 의존성
복구의 범위를 제한합니다. 명시적인 번들 채널 활성화(`channels.<id>.enabled: true`)는
여전히 해당 채널의 plugin 의존성을 복구할 수 있습니다.
external plugin과 사용자 지정 로드 경로는 여전히
`openclaw plugins install`을 통해 설치해야 합니다.

## Plugin 유형

OpenClaw는 두 가지 plugin 형식을 인식합니다:

| 형식       | 동작 방식                                                       | 예시                                                   |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 런타임 모듈, 프로세스 내에서 실행      | 공식 plugin, 커뮤니티 npm 패키지                       |
| **Bundle** | Codex/Claude/Cursor 호환 레이아웃, OpenClaw 기능에 매핑됨      | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

둘 다 `openclaw plugins list` 아래에 표시됩니다. 번들에 대한 자세한 내용은 [Plugin Bundles](/ko/plugins/bundles)를 참조하세요.

native plugin을 작성하는 경우 [Building Plugins](/ko/plugins/building-plugins)와
[Plugin SDK 개요](/ko/plugins/sdk-overview)부터 시작하세요.

## 패키지 엔트리포인트

native plugin npm 패키지는 `package.json`에 `openclaw.extensions`를 선언해야 합니다.
각 항목은 패키지 디렉터리 내부에 있어야 하며 읽을 수 있는
런타임 파일로 확인되거나, `src/index.ts`에서 `dist/index.js`로 이어지는 것처럼
유추 가능한 빌드된 JavaScript 대응 항목이 있는 TypeScript 소스 파일로 확인되어야 합니다.

게시된 런타임 파일이 소스 항목과 동일한 경로에 있지 않다면
`openclaw.runtimeExtensions`를 사용하세요. 존재하는 경우,
`runtimeExtensions`는 모든 `extensions` 항목에 대해 정확히 하나씩의 항목을 포함해야 합니다.
목록이 일치하지 않으면 소스 경로로 조용히 대체되는 대신 설치와
plugin 검색이 실패합니다.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## 공식 plugin

### 설치 가능(npm)

| Plugin          | 패키지                | 문서                                 |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/ko/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/ko/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/ko/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/ko/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/ko/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/ko/plugins/zalouser)   |

### Core(OpenClaw와 함께 제공)

<AccordionGroup>
  <Accordion title="모델 provider(기본 활성화)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="메모리 plugin">
    - `memory-core` — 번들 메모리 검색(기본값: `plugins.slots.memory`)
    - `memory-lancedb` — 필요 시 설치되는 장기 메모리(auto-recall/capture 포함) (`plugins.slots.memory = "memory-lancedb"`로 설정)

  </Accordion>

  <Accordion title="음성 provider(기본 활성화)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="기타">
    - `browser` — browser 도구, `openclaw browser` CLI, `browser.request` gateway 메서드, browser 런타임, 기본 browser control service를 위한 번들 browser plugin(기본 활성화, 교체 전에 비활성화해야 함)
    - `copilot-proxy` — VS Code Copilot Proxy 브리지(기본 비활성화)

  </Accordion>
</AccordionGroup>

서드파티 plugin을 찾고 있나요? [Community Plugins](/ko/plugins/community)를 참조하세요.

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
| `load.paths`     | 추가 plugin 파일/디렉터리                                 |
| `slots`          | 배타적 슬롯 선택기(예: `memory`, `contextEngine`)         |
| `entries.\<id\>` | plugin별 토글 + config                                    |

config 변경은 **Gateway 재시작이 필요합니다**. Gateway가 config 감시 +
프로세스 내 재시작이 활성화된 상태(기본 `openclaw gateway` 경로)로 실행 중이라면,
config 쓰기가 반영된 직후 보통 자동으로 재시작됩니다.
native plugin 런타임 코드나 수명 주기 hook에 대해 지원되는 핫 리로드 경로는 없습니다.
업데이트된 `register(api)` 코드, `api.on(...)` hook, 도구, 서비스, 또는
provider/런타임 hook이 실행되기를 기대하기 전에 라이브 채널을 제공하는 Gateway 프로세스를
재시작하세요.

`openclaw plugins list`는 로컬 plugin 레지스트리/config 스냅샷입니다. 여기서
plugin이 `enabled`로 표시된다는 것은 영속 레지스트리와 현재 config가 해당
plugin의 참여를 허용한다는 뜻입니다. 이미 실행 중인 원격 Gateway
자식 프로세스가 동일한 plugin 코드로 재시작되었다는 증거는 아닙니다. VPS/컨테이너 환경에서
래퍼 프로세스를 사용하는 경우, 실제 `openclaw gateway run` 프로세스에 재시작을 보내거나,
실행 중인 Gateway에 대해 `openclaw gateway restart`를 사용하세요.

<Accordion title="Plugin 상태: 비활성화 vs 누락 vs 잘못됨">
  - **비활성화됨**: plugin은 존재하지만 활성화 규칙으로 인해 꺼져 있습니다. config는 유지됩니다.
  - **누락됨**: config가 plugin id를 참조하지만 검색에서 찾지 못했습니다.
  - **잘못됨**: plugin은 존재하지만 config가 선언된 스키마와 일치하지 않습니다.

</Accordion>

## 검색 및 우선순위

OpenClaw는 다음 순서로 plugin을 검사합니다(먼저 일치한 항목 우선):

<Steps>
  <Step title="Config 경로">
    `plugins.load.paths` — 명시적인 파일 또는 디렉터리 경로. OpenClaw 자체의
    패키지된 번들 plugin 디렉터리를 다시 가리키는 경로는 무시됩니다.
    오래된 별칭을 제거하려면 `openclaw doctor --fix`를 실행하세요.
  </Step>

  <Step title="워크스페이스 plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 및 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="전역 plugin">
    `~/.openclaw/<plugin-root>/*.ts` 및 `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="번들 plugin">
    OpenClaw와 함께 제공됩니다. 많은 항목이 기본적으로 활성화됩니다(모델 provider, 음성).
    다른 항목은 명시적 활성화가 필요합니다.
  </Step>
</Steps>

패키지 설치와 Docker 이미지는 일반적으로 번들 plugin을
컴파일된 `dist/extensions` 트리에서 확인합니다. 번들 plugin 소스 디렉터리가
해당 패키지된 소스 경로 위에 바인드 마운트되어 있으면, 예를 들어
`/app/extensions/synology-chat`처럼, OpenClaw는 그 마운트된 소스 디렉터리를
번들 소스 오버레이로 취급하고 패키지된
`/app/dist/extensions/synology-chat` 번들보다 먼저 검색합니다. 이는 유지 관리자의 컨테이너
루프가 모든 번들 plugin을 다시 TypeScript 소스로 전환하지 않고도 계속 동작하게 합니다.
소스 오버레이 마운트가 존재하더라도 패키지된 dist 번들을 강제하려면
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`을 설정하세요.

### 활성화 규칙

- `plugins.enabled: false`는 모든 plugin을 비활성화합니다
- `plugins.deny`는 항상 allow보다 우선합니다
- `plugins.entries.\<id\>.enabled: false`는 해당 plugin을 비활성화합니다
- 워크스페이스 출처 plugin은 **기본적으로 비활성화**됩니다(명시적으로 활성화해야 함)
- 번들 plugin은 재정의되지 않는 한 내장 기본 활성화 집합을 따릅니다
- 배타적 슬롯은 해당 슬롯에 선택된 plugin을 강제로 활성화할 수 있습니다
- 일부 번들 opt-in plugin은 config가
  provider 모델 ref, 채널 config, 또는 하니스
  런타임처럼 plugin 소유 표면을 지정할 때 자동으로 활성화됩니다
- OpenAI 계열 Codex 경로는 별도의 plugin 경계를 유지합니다:
  `openai-codex/*`는 OpenAI plugin에 속하고, 번들 Codex
  app-server plugin은 `agentRuntime.id: "codex"` 또는 레거시
  `codex/*` 모델 ref로 선택됩니다

## 런타임 hook 문제 해결

plugin이 `plugins list`에 나타나지만 `register(api)` 부작용이나 hook이
실제 채팅 트래픽에서 실행되지 않으면, 먼저 다음을 확인하세요:

- `openclaw gateway status --deep --require-rpc`를 실행하고 활성
  Gateway URL, 프로필, config 경로, 프로세스가 실제로 편집 중인 것인지 확인하세요.
- plugin 설치/config/코드 변경 후 실제 Gateway를 재시작하세요. 래퍼
  컨테이너에서는 PID 1이 단지 supervisor일 수 있으므로, 자식
  `openclaw gateway run` 프로세스를 재시작하거나 신호를 보내야 합니다.
- `openclaw plugins inspect <id> --json`를 사용해 hook 등록과
  진단 정보를 확인하세요. 번들이 아닌 대화 hook인
  `llm_input`, `llm_output`, `before_agent_finalize`, 그리고 `agent_end`는
  `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.
- 모델 전환에는 `before_model_resolve`를 우선 사용하세요. 이 hook은 에이전트 turn의 모델 확인 전에 실행됩니다.
  `llm_output`은 모델 시도가 assistant 출력을 생성한 후에만 실행됩니다.
- 유효 세션 모델의 증거를 얻으려면 `openclaw sessions` 또는
  Gateway 세션/상태 표면을 사용하고, provider 페이로드를 디버깅할 때는
  Gateway를 `--raw-stream --raw-stream-path <path>`로 시작하세요.

### 중복 채널 또는 도구 소유권

증상:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

이는 둘 이상의 활성 plugin이 동일한 채널,
설정 흐름 또는 도구 이름을 소유하려고 한다는 뜻입니다. 가장 흔한 원인은
이제 동일한 channel id를 제공하는 번들 plugin과 함께 external 채널 plugin이
설치된 경우입니다.

디버그 단계:

- `openclaw plugins list --enabled --verbose`를 실행해 활성화된 모든 plugin과
  출처를 확인하세요.
- 의심되는 각 plugin에 대해 `openclaw plugins inspect <id> --json`를 실행하고
  `channels`, `channelConfigs`, `tools`, 진단 정보를 비교하세요.
- plugin 패키지를 설치하거나 제거한 후 `openclaw plugins registry --refresh`를 실행해
  영속 메타데이터가 현재 설치 상태를 반영하도록 하세요.
- 설치, 레지스트리 또는 config 변경 후 Gateway를 재시작하세요.

해결 방법:

- 한 plugin이 동일한 channel id에 대해 다른 plugin을 의도적으로 대체하는 경우,
  우선할 plugin은 `channelConfigs.<channel-id>.preferOver`에
  우선순위가 더 낮은 plugin id를 선언해야 합니다. 자세한 내용은 [/plugins/manifest#replacing-another-channel-plugin](/ko/plugins/manifest#replacing-another-channel-plugin)을 참조하세요.
- 중복이 의도치 않은 경우,
  `plugins.entries.<plugin-id>.enabled: false`로 한쪽을 비활성화하거나 오래된 plugin
  설치를 제거하세요.
- 두 plugin을 명시적으로 모두 활성화했다면, OpenClaw는 그 요청을 유지하고
  충돌을 보고합니다. 채널의 소유자를 하나만 선택하거나 plugin 소유
  도구의 이름을 변경해 런타임 표면이 모호하지 않게 하세요.

## Plugin 슬롯(배타적 범주)

일부 범주는 배타적입니다(한 번에 하나만 활성화 가능):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 또는 비활성화하려면 "none"
      contextEngine: "legacy", // 또는 plugin id
    },
  },
}
```

| 슬롯            | 제어 대상             | 기본값              |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memory plugin  | `memory-core`       |
| `contextEngine` | 활성 컨텍스트 엔진    | `legacy`(내장)      |

## CLI 참조

```bash
openclaw plugins list                       # 간단한 인벤토리
openclaw plugins list --enabled            # 활성화된 plugin만
openclaw plugins list --verbose            # plugin별 상세 행
openclaw plugins list --json               # 기계 판독 가능한 인벤토리
openclaw plugins inspect <id>              # 자세한 세부 정보
openclaw plugins inspect <id> --json       # 기계 판독 가능
openclaw plugins inspect --all             # 전체 범위 테이블
openclaw plugins info <id>                 # inspect 별칭
openclaw plugins doctor                    # 진단
openclaw plugins registry                  # 영속 레지스트리 상태 확인
openclaw plugins registry --refresh        # 영속 레지스트리 재구성
openclaw doctor --fix                      # plugin 레지스트리 상태 복구

openclaw plugins install <package>         # 설치(ClawHub 우선, 이후 npm)
openclaw plugins install clawhub:<pkg>     # ClawHub에서만 설치
openclaw plugins install <spec> --force    # 기존 설치 덮어쓰기
openclaw plugins install <path>            # 로컬 경로에서 설치
openclaw plugins install -l <path>         # 개발용 링크(복사 안 함)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 정확히 해석된 npm spec 기록
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 단일 plugin 업데이트
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 모두 업데이트
openclaw plugins uninstall <id>          # config 및 plugin 인덱스 레코드 제거
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

번들 plugin은 OpenClaw와 함께 제공됩니다. 많은 항목이 기본적으로 활성화됩니다(예:
번들 모델 provider, 번들 음성 provider, 번들 browser
plugin). 다른 번들 plugin은 여전히 `openclaw plugins enable <id>`가 필요합니다.

`--force`는 기존에 설치된 plugin 또는 hook pack을 제자리에서 덮어씁니다. 추적되는 npm
plugin의 일반적인 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 사용하세요.
이는 소스 경로를 관리 대상 설치 위치에 복사하는 대신 재사용하는 `--link`와 함께
지원되지 않습니다.

`plugins.allow`가 이미 설정되어 있으면, `openclaw plugins install`은
설치된 plugin id를 활성화하기 전에 해당 허용 목록에 추가합니다. 동일한 plugin id가
`plugins.deny`에 있으면, 설치 시 그 오래된 거부 항목을 제거하므로
명시적 설치가 재시작 후 즉시 로드 가능해집니다.

OpenClaw는 plugin 인벤토리, 기여 소유권, 시작 계획을 위한
콜드 리드 모델로서 영속적인 로컬 plugin 레지스트리를 유지합니다. 설치, 업데이트,
제거, 활성화, 비활성화 흐름은 plugin 상태 변경 후 이 레지스트리를 새로 고칩니다.
동일한 `plugins/installs.json` 파일은 최상위 `installRecords`에 영구 설치 메타데이터를,
`plugins`에 재구성 가능한 manifest 메타데이터를 보관합니다. 레지스트리가
없거나 오래되었거나 잘못된 경우, `openclaw plugins registry
--refresh`는 plugin 런타임 모듈을 로드하지 않고 install 레코드, config 정책,
manifest/package 메타데이터로부터 manifest 뷰를 재구성합니다.
`openclaw plugins update <id-or-npm-spec>`는 추적되는 설치에 적용됩니다.
dist-tag 또는 정확한 버전이 포함된 npm 패키지 spec을 전달하면 패키지 이름을
추적된 plugin 레코드로 다시 해석하고, 이후 업데이트를 위해 새 spec을 기록합니다.
버전 없이 패키지 이름만 전달하면 정확히 고정된 설치를 다시
레지스트리의 기본 릴리스 라인으로 이동합니다. 설치된 npm plugin이 이미 해석된 버전과
기록된 아티팩트 식별자와 일치하면, OpenClaw는 다운로드, 재설치, config 재작성 없이
업데이트를 건너뜁니다.

`--pin`은 npm 전용입니다. `--marketplace`와 함께는 지원되지 않습니다.
마켓플레이스 설치는 npm spec 대신 마켓플레이스 소스 메타데이터를 영속 저장하기 때문입니다.

`--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의
오탐에 대한 비상 유리 파손용 재정의입니다. 이 옵션은 plugin 설치와 plugin 업데이트가
내장 `critical` 발견 사항을 지나 계속 진행되게 하지만, 여전히 plugin `before_install`
정책 차단이나 스캔 실패 차단을 우회하지는 않습니다.

이 CLI 플래그는 plugin 설치/업데이트 흐름에만 적용됩니다. Gateway 기반 Skill
의존성 설치는 대신 대응하는 `dangerouslyForceUnsafeInstall` 요청 재정의를 사용하며,
`openclaw skills install`은 별도의 ClawHub Skill 다운로드/설치 흐름으로 유지됩니다.

호환되는 번들은 동일한 plugin list/inspect/enable/disable
흐름에 참여합니다. 현재 런타임 지원에는 번들 Skills, Claude command-skills,
Claude `settings.json` 기본값, Claude `.lsp.json` 및 manifest에 선언된
`lspServers` 기본값, Cursor command-skills, 그리고 호환되는 Codex hook
디렉터리가 포함됩니다.

`openclaw plugins inspect <id>`는 번들 기반 plugin에 대해
감지된 번들 기능과 지원되거나 지원되지 않는 MCP 및 LSP 서버 항목도 보고합니다.

마켓플레이스 소스는
`~/.claude/plugins/known_marketplaces.json`의 Claude 알려진 마켓플레이스 이름,
로컬 마켓플레이스 루트 또는 `marketplace.json` 경로, `owner/repo` 같은 GitHub 축약형,
GitHub 저장소 URL 또는 git URL이 될 수 있습니다. 원격 마켓플레이스의 경우,
plugin 항목은 복제된 마켓플레이스 저장소 내부에 머물러야 하며 상대 경로 소스만 사용해야 합니다.

전체 내용은 [`openclaw plugins` CLI 참조](/ko/cli/plugins)를 참조하세요.

## Plugin API 개요

native plugin은 `register(api)`를 노출하는 엔트리 객체를 내보냅니다. 오래된
plugin은 여전히 레거시 별칭으로 `activate(api)`를 사용할 수 있지만, 새 plugin은
`register`를 사용해야 합니다.

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

OpenClaw는 엔트리 객체를 로드하고 plugin
활성화 중에 `register(api)`를 호출합니다. 로더는 오래된 plugin에 대해 여전히 `activate(api)`로 대체 동작을 하지만,
번들 plugin과 새로운 external plugin은 `register`를 공개 계약으로 취급해야 합니다.

`api.registrationMode`는 엔트리가 왜 로드되는지를 plugin에 알려줍니다:

| 모드            | 의미                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `full`          | 런타임 활성화. 도구, hook, 서비스, 명령, 라우트 및 기타 라이브 부작용을 등록합니다.                                           |
| `discovery`     | 읽기 전용 기능 검색. provider와 메타데이터를 등록하며, 신뢰된 plugin 엔트리 코드는 로드될 수 있지만 라이브 부작용은 건너뜁니다. |
| `setup-only`    | 경량 설정 엔트리를 통한 채널 설정 메타데이터 로드.                                                                            |
| `setup-runtime` | 런타임 엔트리도 필요한 채널 설정 로드.                                                                                        |
| `cli-metadata`  | CLI 명령 메타데이터 수집만.                                                                                                   |

소켓, 데이터베이스, 백그라운드 워커 또는 장기 실행
클라이언트를 여는 plugin 엔트리는 `api.registrationMode === "full"`로
그러한 부작용을 보호해야 합니다. 검색 로드는 활성화 로드와 별도로 캐시되며
실행 중인 Gateway 레지스트리를 대체하지 않습니다. 검색은 비활성화 방식일 뿐, import-free는 아닙니다.
OpenClaw는 스냅샷을 만들기 위해 신뢰된 plugin 엔트리 또는 채널 plugin 모듈을 평가할 수 있습니다.
모듈 최상위는 가볍고 부작용이 없게 유지하고, 네트워크 클라이언트, 서브프로세스,
리스너, 자격 증명 읽기, 서비스 시작은 전체 런타임 경로 뒤로 옮기세요.

일반적인 등록 메서드:

| 메서드                                  | 등록 대상                   |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 모델 provider(LLM)          |
| `registerChannel`                       | 채팅 채널                   |
| `registerTool`                          | 에이전트 도구               |
| `registerHook` / `on(...)`              | 수명 주기 hook              |
| `registerSpeechProvider`                | 텍스트-음성 / STT           |
| `registerRealtimeTranscriptionProvider` | 스트리밍 STT                |
| `registerRealtimeVoiceProvider`         | 양방향 실시간 음성          |
| `registerMediaUnderstandingProvider`    | 이미지/오디오 분석          |
| `registerImageGenerationProvider`       | 이미지 생성                 |
| `registerMusicGenerationProvider`       | 음악 생성                   |
| `registerVideoGenerationProvider`       | 비디오 생성                 |
| `registerWebFetchProvider`              | 웹 가져오기 / 스크레이프 provider |
| `registerWebSearchProvider`             | 웹 검색                     |
| `registerHttpRoute`                     | HTTP 엔드포인트             |
| `registerCommand` / `registerCli`       | CLI 명령                    |
| `registerContextEngine`                 | 컨텍스트 엔진               |
| `registerService`                       | 백그라운드 서비스           |

정형화된 수명 주기 hook의 hook guard 동작:

- `before_tool_call`: `{ block: true }`는 종료형입니다. 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`는 no-op이며 이전 block을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 종료형입니다. 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`는 no-op이며 이전 block을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 종료형입니다. 더 낮은 우선순위 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`는 no-op이며 이전 cancel을 해제하지 않습니다.

native Codex app-server 실행은 Codex 네이티브 도구 이벤트를 이
hook 표면으로 다시 브리지합니다. Plugin은 `before_tool_call`을 통해 네이티브 Codex 도구를 차단하고,
`after_tool_call`을 통해 결과를 관찰하며, Codex
`PermissionRequest` 승인에 참여할 수 있습니다. 브리지는 아직 Codex 네이티브 도구
인수를 재작성하지 않습니다. 정확한 Codex 런타임 지원 경계는
[Codex harness v1 지원 계약](/ko/plugins/codex-harness#v1-support-contract)에 있습니다.

전체 정형화된 hook 동작은 [SDK 개요](/ko/plugins/sdk-overview#hook-decision-semantics)를 참조하세요.

## 관련

- [Plugin 빌드하기](/ko/plugins/building-plugins) — 나만의 plugin 만들기
- [Plugin 번들](/ko/plugins/bundles) — Codex/Claude/Cursor 번들 호환성
- [Plugin manifest](/ko/plugins/manifest) — manifest 스키마
- [도구 등록하기](/ko/plugins/building-plugins#registering-agent-tools) — plugin에 에이전트 도구 추가
- [Plugin 내부 구조](/ko/plugins/architecture) — 기능 모델과 로드 파이프라인
- [Community Plugins](/ko/plugins/community) — 서드파티 목록
