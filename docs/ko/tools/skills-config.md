---
read_when:
    - Skills 설정 추가 또는 수정
    - 번들된 허용 목록 또는 설치 동작 조정
summary: Skills 구성 스키마 및 예시
title: Skills 설정
x-i18n:
    generated_at: "2026-05-06T06:43:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1acfd34c7af3b8909187d77ae74c52656b5dcfa1abf42ca6a7fdb391854e5c7c
    source_path: tools/skills-config.md
    workflow: 16
---

대부분의 Skills 로더/설치 구성은 `~/.openclaw/openclaw.json`의
`skills` 아래에 있습니다. 에이전트별 Skills 표시 여부는
`agents.defaults.skills` 및 `agents.list[].skills` 아래에 있습니다.

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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
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

내장 이미지 생성/편집에는 `agents.defaults.imageGenerationModel`과
핵심 `image_generate` 도구를 사용하는 것을 권장합니다. `skills.entries.*`는
사용자 지정 또는 타사 Skills 워크플로에만 사용합니다.

특정 이미지 공급자/모델을 선택하는 경우 해당 공급자의 인증/API 키도
구성하세요. 일반적인 예: `google/*`에는 `GEMINI_API_KEY` 또는
`GOOGLE_API_KEY`, `openai/*`에는 `OPENAI_API_KEY`, `fal/*`에는 `FAL_KEY`.

예시:

- 네이티브 Nano Banana Pro 스타일 설정: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 네이티브 fal 설정: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 에이전트 Skills 허용 목록

동일한 머신/작업공간 Skills 루트를 사용하되 에이전트마다 표시되는
Skills 집합을 다르게 하고 싶을 때 에이전트 구성을 사용하세요.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

규칙:

- `agents.defaults.skills`: `agents.list[].skills`를 생략한 에이전트가 사용하는 공유 기준 허용 목록입니다.
- 기본적으로 Skills 제한을 두지 않으려면 `agents.defaults.skills`를 생략하세요.
- `agents.list[].skills`: 해당 에이전트의 명시적인 최종 Skills 집합입니다. 기본값과 병합되지 않습니다.
- `agents.list[].skills: []`: 해당 에이전트에 Skills를 노출하지 않습니다.

## 필드

- 내장 Skills 루트에는 항상 `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, `<workspace>/skills`가 포함됩니다.
- `allowBundled`: **번들된** Skills에만 적용되는 선택적 허용 목록입니다. 설정하면
  목록에 있는 번들 Skills만 사용할 수 있습니다(관리형, 에이전트, 작업공간 Skills에는 영향 없음).
- `load.extraDirs`: 스캔할 추가 Skills 디렉터리입니다(가장 낮은 우선순위).
- `load.watch`: Skills 폴더를 감시하고 Skills 스냅샷을 새로 고칩니다(기본값: true).
- `load.watchDebounceMs`: Skills 감시자 이벤트의 디바운스 시간(밀리초)입니다(기본값: 250).
- `install.preferBrew`: 사용할 수 있으면 brew 설치 관리자를 우선합니다(기본값: true).
- `install.nodeManager`: node 설치 관리자 선호값(`npm` | `pnpm` | `yarn` | `bun`, 기본값: npm).
  이는 **Skills 설치**에만 영향을 줍니다. Gateway 런타임은 여전히 Node여야 합니다
  (WhatsApp/Telegram에는 Bun을 권장하지 않음).
  - `openclaw setup --node-manager`는 범위가 더 좁으며 현재 `npm`,
    `pnpm`, `bun`만 허용합니다. Yarn 기반 Skills 설치를 원하면
    `skills.install.nodeManager: "yarn"`을 수동으로 설정하세요.
- `entries.<skillKey>`: Skills별 재정의입니다.
- `agents.defaults.skills`: `agents.list[].skills`를 생략한 에이전트가 상속하는 선택적 기본 Skills 허용 목록입니다.
- `agents.list[].skills`: 에이전트별 선택적 최종 Skills 허용 목록입니다. 명시적 목록은 상속된 기본값과 병합되지 않고 대체합니다.

Skills별 필드:

- `enabled`: Skills가 번들되어 있거나 설치되어 있더라도 비활성화하려면 `false`로 설정합니다.
- `env`: 에이전트 실행에 주입되는 환경 변수입니다(아직 설정되지 않은 경우에만).
- `apiKey`: 기본 환경 변수를 선언하는 Skills를 위한 선택적 편의 설정입니다.
  일반 텍스트 문자열 또는 SecretRef 객체(`{ source, provider, id }`)를 지원합니다.

## 참고

- `entries` 아래의 키는 기본적으로 Skills 이름에 매핑됩니다. Skills가
  `metadata.openclaw.skillKey`를 정의하면 대신 그 키를 사용하세요.
- 로드 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 번들 Skills →
  `skills.load.extraDirs`입니다.
- 감시자가 활성화되어 있으면 다음 에이전트 턴에서 Skills 변경 사항이 반영됩니다.

### 샌드박스 Skills 및 환경 변수

세션이 **샌드박스 처리**되면 Skills 프로세스는 구성된 샌드박스 백엔드 안에서 실행됩니다. 샌드박스는 호스트 `process.env`를 상속하지 **않습니다**.

<Warning>
  전역 `env`와 `skills.entries.<skill>.env`/`apiKey`는 **호스트** 실행에만 적용됩니다. 샌드박스 안에서는 효과가 없으므로, 샌드박스에 변수를 별도로 제공하지 않으면 `GEMINI_API_KEY`에 의존하는 Skills는 `apiKey not configured`로 실패합니다.
</Warning>

다음 중 하나를 사용하세요.

- Docker 백엔드에는 `agents.defaults.sandbox.docker.env`를 사용합니다(또는 에이전트별 `agents.list[].sandbox.docker.env`).
- 사용자 지정 샌드박스 이미지 또는 원격 샌드박스 환경에 환경 변수를 포함합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Skills" href="/ko/tools/skills" icon="puzzle-piece">
    Skills의 개념과 로드 방식을 설명합니다.
  </Card>
  <Card title="Skills 만들기" href="/ko/tools/creating-skills" icon="hammer">
    사용자 지정 Skills 팩 작성.
  </Card>
  <Card title="슬래시 명령" href="/ko/tools/slash-commands" icon="terminal">
    네이티브 명령 카탈로그 및 채팅 지시문.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    전체 `skills` 및 `agents.skills` 스키마.
  </Card>
</CardGroup>
