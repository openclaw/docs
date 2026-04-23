---
read_when:
    - Skills config 추가 또는 수정하기
    - 번들 allowlist 또는 설치 동작 조정하기
summary: Skills config 스키마 및 예시
title: Skills Config
x-i18n:
    generated_at: "2026-04-23T14:09:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills Config

대부분의 Skills 로더/설치 구성은
`~/.openclaw/openclaw.json`의 `skills` 아래에 있습니다. agent별 Skills 가시성은
`agents.defaults.skills`와 `agents.list[].skills` 아래에 있습니다.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway 런타임은 여전히 Node이며 bun은 권장되지 않음)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 또는 평문 문자열
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

내장 이미지 생성/편집에는 `agents.defaults.imageGenerationModel`과 코어 `image_generate` 도구를 사용하는 것이 좋습니다. `skills.entries.*`는 사용자 정의 또는
서드파티 Skill 워크플로에만 사용하세요.

특정 이미지 provider/모델을 선택하는 경우, 해당 provider의
auth/API 키도 구성해야 합니다. 일반적인 예: `google/*`에는 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`,
`openai/*`에는 `OPENAI_API_KEY`, `fal/*`에는 `FAL_KEY`.

예시:

- 네이티브 Nano Banana Pro 스타일 설정: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 네이티브 fal 설정: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## agent Skill allowlist

같은 머신/workspace Skills 루트를 사용하되, agent별로
보이는 Skills 집합을 다르게 하고 싶을 때 agent config를 사용하세요.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // defaults 상속 -> github, weather
      { id: "docs", skills: ["docs-search"] }, // defaults 대체
      { id: "locked-down", skills: [] }, // Skills 없음
    ],
  },
}
```

규칙:

- `agents.defaults.skills`: `agents.list[].skills`를 생략한 agent에 대한
  공유 기준 allowlist입니다.
- 기본적으로 Skills를 제한하지 않으려면 `agents.defaults.skills`를 생략하세요.
- `agents.list[].skills`: 해당 agent의 명시적인 최종 Skills 집합입니다. 기본값과 병합되지 않습니다.
- `agents.list[].skills: []`: 해당 agent에 대해 Skills를 전혀 노출하지 않습니다.

## 필드

- 내장 Skills 루트에는 항상 `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, `<workspace>/skills`가 포함됩니다.
- `allowBundled`: **번들된** Skills 전용 선택적 allowlist입니다. 설정되면 목록에 있는
  번들된 Skills만 대상이 됩니다(managed, agent, workspace Skills는 영향 없음).
- `load.extraDirs`: 스캔할 추가 Skills 디렉터리(가장 낮은 우선순위).
- `load.watch`: Skills 폴더를 감시하고 Skills 스냅샷을 새로 고칩니다(기본값: true).
- `load.watchDebounceMs`: Skills watcher 이벤트의 debounce 시간(밀리초, 기본값: 250).
- `install.preferBrew`: 가능할 때 brew 설치 프로그램을 우선 사용합니다(기본값: true).
- `install.nodeManager`: Node 설치 프로그램 선호도(`npm` | `pnpm` | `yarn` | `bun`, 기본값: npm).
  이는 **Skill 설치**에만 영향을 줍니다. Gateway 런타임은 여전히 Node여야 합니다
  (WhatsApp/Telegram에서는 Bun 비권장).
  - `openclaw setup --node-manager`는 더 좁은 범위이며 현재 `npm`,
    `pnpm`, `bun`만 허용합니다. Yarn 기반 Skill 설치를 원하면
    `skills.install.nodeManager: "yarn"`을 수동으로 설정하세요.
- `entries.<skillKey>`: Skill별 재정의.
- `agents.defaults.skills`: `agents.list[].skills`를 생략한 agent가
  상속하는 선택적 기본 Skills allowlist.
- `agents.list[].skills`: 선택적 agent별 최종 Skills allowlist. 명시적
  목록은 상속된 기본값과 병합되는 대신 대체합니다.

Skill별 필드:

- `enabled`: 번들되었거나 설치된 Skill이라도 `false`로 설정하면 비활성화합니다.
- `env`: agent 실행에 주입되는 환경 변수(이미 설정된 경우 제외).
- `apiKey`: 기본 env var를 선언하는 Skills를 위한 선택적 편의 필드입니다.
  평문 문자열 또는 SecretRef 객체(`{ source, provider, id }`)를 지원합니다.

## 참고

- `entries` 아래의 키는 기본적으로 Skill 이름에 매핑됩니다. Skill이
  `metadata.openclaw.skillKey`를 정의하면 대신 해당 키를 사용하세요.
- 로드 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 번들된 Skills →
  `skills.load.extraDirs`입니다.
- watcher가 활성화되어 있으면 Skills 변경 사항은 다음 agent 턴에서 반영됩니다.

### 샌드박스된 Skills + env vars

세션이 **샌드박스됨** 상태이면 Skill 프로세스는 구성된
샌드박스 백엔드 내부에서 실행됩니다. 샌드박스는 호스트 `process.env`를 상속하지 않습니다.

다음 중 하나를 사용하세요:

- Docker 백엔드용 `agents.defaults.sandbox.docker.env`(또는 agent별 `agents.list[].sandbox.docker.env`)
- 사용자 정의 샌드박스 이미지 또는 원격 샌드박스 environment에 env를 내장

전역 `env`와 `skills.entries.<skill>.env/apiKey`는 **호스트** 실행에만 적용됩니다.
