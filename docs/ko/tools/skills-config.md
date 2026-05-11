---
read_when:
    - Skills 설정 추가 또는 수정
    - 번들 허용 목록 또는 설치 동작 조정
summary: Skills 구성 스키마 및 예제
title: Skills 설정
x-i18n:
    generated_at: "2026-05-11T20:39:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

대부분의 Skills 로더/설치 구성은 `~/.openclaw/openclaw.json`의 `skills` 아래에 있습니다. 에이전트별 Skills 표시 여부는 `agents.defaults.skills` 및 `agents.list[].skills` 아래에 있습니다.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
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

기본 제공 이미지 생성/편집에는 `agents.defaults.imageGenerationModel`과 핵심 `image_generate` 도구를 사용하는 것이 좋습니다. `skills.entries.*`는 사용자 지정 또는 타사 Skills 워크플로에만 사용합니다.

특정 이미지 제공자/모델을 선택하는 경우 해당 제공자의 인증/API 키도 구성하세요. 일반적인 예: `google/*`에는 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`, `openai/*`에는 `OPENAI_API_KEY`, `fal/*`에는 `FAL_KEY`.

예:

- 네이티브 Nano Banana Pro 스타일 설정: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 네이티브 fal 설정: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 에이전트 Skills 허용 목록

동일한 머신/워크스페이스 Skills 루트를 사용하되 에이전트마다 보이는 Skills 집합을 다르게 하려면 에이전트 구성을 사용하세요.

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

- `agents.defaults.skills`: `agents.list[].skills`를 생략한 에이전트가 공유하는 기본 허용 목록입니다.
- Skills가 기본적으로 제한되지 않도록 하려면 `agents.defaults.skills`를 생략하세요.
- `agents.list[].skills`: 해당 에이전트의 명시적인 최종 Skills 집합입니다. 기본값과 병합되지 않습니다.
- `agents.list[].skills: []`: 해당 에이전트에 Skills를 노출하지 않습니다.

## 필드

- 기본 제공 Skills 루트에는 항상 `~/.openclaw/skills`, `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills`가 포함됩니다.
- `allowBundled`: **번들된** Skills 전용 선택적 허용 목록입니다. 설정하면 목록에 있는 번들된 Skills만 사용할 수 있습니다(관리형, 에이전트, 워크스페이스 Skills에는 영향 없음).
- `load.extraDirs`: 추가로 스캔할 Skills 디렉터리입니다(가장 낮은 우선순위).
- `load.allowSymlinkTargets`: 신뢰할 수 있는 실제 대상 디렉터리입니다. 심볼릭 링크된 Skills 폴더가 해당 대상 루트 밖에 있더라도 이 디렉터리로 해석될 수 있습니다. `~/.agents/skills/manager -> ~/Projects/manager/skills`와 같은 의도적인 형제 저장소 레이아웃에 사용하세요.
- `load.watch`: Skills 폴더를 감시하고 Skills 스냅샷을 새로 고칩니다(기본값: true).
- `load.watchDebounceMs`: Skills 감시자 이벤트의 디바운스 시간(밀리초)입니다(기본값: 250).
- `install.preferBrew`: 사용 가능할 때 brew 설치 프로그램을 우선합니다(기본값: true).
- `install.nodeManager`: Node 설치 프로그램 선호도(`npm` | `pnpm` | `yarn` | `bun`, 기본값: npm)입니다.
  이는 **Skills 설치**에만 영향을 줍니다. Gateway 런타임은 여전히 Node여야 합니다
  (WhatsApp/Telegram에는 Bun을 권장하지 않음).
  - `openclaw setup --node-manager`는 범위가 더 좁으며 현재 `npm`, `pnpm`, `bun`을 허용합니다. Yarn 기반 Skills 설치를 원하면 `skills.install.nodeManager: "yarn"`을 수동으로 설정하세요.
- `install.allowUploadedArchives`: 신뢰할 수 있는 `operator.admin` Gateway 클라이언트가 `skills.upload.*`를 통해 준비된 비공개 zip 아카이브를 설치할 수 있게 합니다(기본값: false). 이는 업로드된 아카이브 경로만 활성화합니다. 일반 ClawHub 설치에는 필요하지 않습니다.
- `entries.<skillKey>`: Skills별 재정의입니다.
- `agents.defaults.skills`: `agents.list[].skills`를 생략한 에이전트가 상속하는 선택적 기본 Skills 허용 목록입니다.
- `agents.list[].skills`: 에이전트별 선택적 최종 Skills 허용 목록입니다. 명시적 목록은 상속된 기본값과 병합되지 않고 대체합니다.

## 심볼릭 링크된 형제 저장소

기본적으로 각 Skills 루트는 포함 경계입니다. `~/.agents/skills` 아래의 Skills 폴더가 `~/.agents/skills` 밖으로 해석되는 심볼릭 링크인 경우, OpenClaw는 이를 건너뛰고 `Skipping escaped skill path outside its configured root`를 기록합니다.

심볼릭 링크 레이아웃을 유지하고 신뢰할 수 있는 대상 루트만 허용하세요.

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

이 구성에서는 `~/.agents/skills/manager -> ~/Projects/manager/skills`와 같은 심볼릭 링크가 realpath 해석 후 허용됩니다. `extraDirs`는 형제 저장소도 직접 스캔하며, `allowSymlinkTargets`는 기존 에이전트 Skills 레이아웃을 위해 심볼릭 링크된 경로를 보존합니다. 대상 항목은 좁게 유지하세요. 해당 루트 아래의 모든 Skills 트리를 신뢰하지 않는 한 `~` 또는 `~/Projects`처럼 넓은 루트를 가리키지 마세요.

Skills별 필드:

- `enabled`: Skills가 번들/설치되어 있더라도 비활성화하려면 `false`로 설정합니다.
- `env`: 에이전트 실행에 주입되는 환경 변수입니다(아직 설정되지 않은 경우에만).
- `apiKey`: 기본 환경 변수를 선언하는 Skills를 위한 선택적 편의 기능입니다.
  일반 텍스트 문자열 또는 SecretRef 객체(`{ source, provider, id }`)를 지원합니다.

## 참고

- `entries` 아래의 키는 기본적으로 Skills 이름에 매핑됩니다. Skills가 `metadata.openclaw.skillKey`를 정의하는 경우 그 키를 대신 사용하세요.
- 로드 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 번들된 Skills →
  `skills.load.extraDirs`입니다.
- 감시자가 활성화되어 있으면 Skills 변경 사항은 다음 에이전트 턴에 반영됩니다.

### 샌드박스 처리된 Skills와 환경 변수

세션이 **샌드박스 처리**된 경우 Skills 프로세스는 구성된 샌드박스 백엔드 안에서 실행됩니다. 샌드박스는 호스트 `process.env`를 상속하지 **않습니다**.

<Warning>
  전역 `env` 및 `skills.entries.<skill>.env`/`apiKey`는 **호스트** 실행에만 적용됩니다. 샌드박스 내부에서는 효과가 없으므로, `GEMINI_API_KEY`에 의존하는 Skills는 샌드박스에 해당 변수를 별도로 제공하지 않는 한 `apiKey not configured` 오류로 실패합니다.
</Warning>

다음 중 하나를 사용하세요.

- Docker 백엔드용 `agents.defaults.sandbox.docker.env`(또는 에이전트별 `agents.list[].sandbox.docker.env`).
- 사용자 지정 샌드박스 이미지 또는 원격 샌드박스 환경에 환경 변수를 포함합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Skills" href="/ko/tools/skills" icon="puzzle-piece">
    Skills의 개념과 로드 방식입니다.
  </Card>
  <Card title="Skills 만들기" href="/ko/tools/creating-skills" icon="hammer">
    사용자 지정 Skills 팩 작성.
  </Card>
  <Card title="슬래시 명령" href="/ko/tools/slash-commands" icon="terminal">
    네이티브 명령 카탈로그와 채팅 지시문입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    전체 `skills` 및 `agents.skills` 스키마입니다.
  </Card>
</CardGroup>
