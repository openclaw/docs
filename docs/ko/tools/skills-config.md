---
read_when:
    - Skills 로딩, 설치 또는 게이팅 동작 구성
    - 에이전트별 Skills 표시 여부 설정
    - Skill Workshop 제한 또는 승인 정책 조정
sidebarTitle: Skills config
summary: skills.* 구성 스키마, 에이전트 허용 목록, 워크숍 설정, 샌드박스 환경 변수 처리에 대한 전체 참조입니다.
title: Skills 구성
x-i18n:
    generated_at: "2026-06-27T18:16:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

대부분의 Skills 구성은 `~/.openclaw/openclaw.json`의 `skills` 아래에 있습니다. 에이전트별 가시성은 `agents.defaults.skills` 및 `agents.list[].skills` 아래에 있습니다.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  기본 제공 이미지 생성에는 `skills.entries` 대신 `agents.defaults.imageGenerationModel`와
  핵심 `image_generate` 도구를 사용하세요. Skill 항목은 사용자 지정 또는 타사 Skill 워크플로에만
  사용됩니다.
</Note>

## 로딩(`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  스캔할 추가 Skill 디렉터리이며, 가장 낮은 우선순위입니다(번들 및 Plugin Skill 이후).
  경로는 `~` 지원과 함께 확장됩니다.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  심볼릭 링크된 Skill 폴더가 구성된 루트 밖에 있더라도 해석될 수 있는 신뢰된 실제 대상 디렉터리입니다.
  `<workspace>/skills/manager -> ~/Projects/manager/skills` 같은 의도적인 형제 저장소 레이아웃에
  사용하세요. 이 목록은 좁게 유지하세요. `~` 또는 `~/Projects` 같은 넓은 루트를 가리키지 마세요.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Skill 폴더를 감시하고 `SKILL.md` 파일이 변경되면 Skills 스냅샷을 새로 고칩니다.
  그룹화된 Skill 루트 아래의 중첩 파일도 포함됩니다.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill 감시자 이벤트의 디바운스 기간(밀리초)입니다.
</ParamField>

## 설치(`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew`를 사용할 수 있으면 Homebrew 설치 프로그램을 우선합니다.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill 설치에 사용할 Node 패키지 관리자 선호값입니다. 이는 Skill 설치에만 영향을 줍니다.
  Gateway 런타임은 여전히 Node를 사용해야 합니다(WhatsApp/Telegram에는 Bun을 권장하지 않음).
  npm, pnpm 또는 bun에는 `openclaw setup --node-manager`를 사용하고, Yarn 기반 Skill 설치에는
  `"yarn"`을 수동으로 설정하세요.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  신뢰된 `operator.admin` Gateway 클라이언트가 `skills.upload.*`를 통해 준비된 비공개 zip 아카이브를
  설치할 수 있게 합니다. 일반 ClawHub 설치에는 이 설정이 필요하지 않습니다.
</ParamField>

## 운영자 설치 정책(`security.installPolicy`)

운영자가 호스트별 정책으로 Skill 및 Plugin 설치를 승인하거나 차단하기 위해 신뢰된 로컬 명령이 필요할 때
`security.installPolicy`를 사용하세요. 이 정책은 OpenClaw가 소스 자료를 준비한 뒤, 설치 또는 업데이트가
계속되기 전에 실행됩니다. ClawHub Skills, 업로드된 Skills, Git/로컬 Skills, Skill 의존성 설치 프로그램,
Plugin 설치/업데이트 소스에 적용됩니다.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  운영자 소유 설치 정책을 활성화합니다. 유효한 `exec` 명령 없이 활성화하면 설치가 실패로 닫힙니다.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  선택적 대상 필터입니다. 생략하면 새 설치가 예기치 않게 실패로 열리지 않도록 모든 지원 대상에 정책이 적용됩니다.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  신뢰된 정책 실행 파일의 절대 경로입니다. OpenClaw는 셸 없이 실행하며 사용 전에 경로를 검증합니다.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` 뒤에 전달되는 정적 인수입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  하나의 정책 결정에 허용되는 최대 실제 실행 시간입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  정책이 실패로 닫히기 전 stdout 또는 stderr 출력 없이 허용되는 최대 시간입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  정책 프로세스에서 허용되는 stdout 및 stderr 합산 최대 바이트 수입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  정책 프로세스에 제공되는 리터럴 환경 변수입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw 프로세스에서 정책 프로세스로 복사되는 환경 변수 이름입니다. 이름이 지정된 변수만 전달됩니다.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  정책 실행 파일을 포함할 수 있는 디렉터리의 선택적 허용 목록입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  명령 경로 소유권 및 권한 검사를 우회합니다. 경로가 다른 메커니즘으로 보호되는 경우에만 사용하세요.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  구성된 명령 경로가 심볼릭 링크일 수 있게 합니다. 해석된 대상은 여전히 다른 경로 검사를 충족해야 합니다.
  인터프리터 스크립트 인수는 심볼릭 링크가 아니라 직접적인 일반 파일이어야 합니다.
</ParamField>

정책은 stdin으로 `protocolVersion: 1`, `openclawVersion`, `targetType`, `targetName`, `sourcePath`,
`sourcePathKind`, 선택적 구조화된 `source`, 구조화된 `origin`, `request`가 포함된 JSON 객체 하나를 받습니다.
stdout에는 `{ "protocolVersion": 1, "decision": "allow" }` 또는
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }` JSON 객체 하나를 써야 합니다.
0이 아닌 종료, 시간 초과, 잘못된 JSON, 누락된 필드 또는 지원되지 않는 프로토콜 버전은 실패로 닫힙니다.

OpenClaw는 일반 Gateway 시작 중에는 설치 정책을 실행하지 않습니다. 정책이 활성화되어 있지만 사용할 수 없으면
설치 및 업데이트가 실패로 닫힙니다. `openclaw doctor`는 정적 검증을 수행하고, `openclaw doctor --deep`은
구성된 명령에 대해 합성 설치 프로브를 실행합니다.

대량 업데이트는 대상별로 정책을 적용합니다. 차단된 Skill 또는 Plugin 업데이트는 정책을 비활성화하거나 배치의
이후 대상을 건너뛰지 않고 해당 대상만 실패시킵니다.

stdin 예시:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

최소 정책 명령:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## 번들 Skill 허용 목록

<ParamField path="skills.allowBundled" type="string[]">
  **번들** Skill에만 적용되는 선택적 허용 목록입니다. 설정하면 목록에 있는 번들 Skill만 사용 대상이 됩니다.
  관리형, 에이전트 수준 및 워크스페이스 Skills는 영향을 받지 않습니다.
</ParamField>

## Skill별 항목(`skills.entries`)

`entries` 아래의 키는 기본적으로 Skill `name`과 일치합니다. Skill이 `metadata.openclaw.skillKey`를
정의하는 경우 대신 해당 키를 사용하세요. 하이픈이 포함된 이름은 따옴표로 묶으세요(JSON5는 따옴표로 묶은 키를 허용합니다).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false`는 번들되었거나 설치되어 있더라도 Skill을 비활성화합니다. `coding-agent` 번들 Skill은 옵트인입니다.
  이를 `true`로 설정하고 `claude`, `codex`, `opencode` 또는 지원되는 다른 CLI 중 하나가 설치 및 인증되어 있는지 확인하세요.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv`를 선언하는 Skills를 위한 편의 필드입니다.
  일반 텍스트 문자열 또는 SecretRef를 지원합니다: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  에이전트 실행에 주입되는 환경 변수입니다. 해당 변수가 프로세스에 아직 설정되어 있지 않을 때만 주입됩니다.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  사용자 지정 Skill별 구성 필드를 위한 선택적 모음입니다.
</ParamField>

## 에이전트 허용 목록(`agents`)

같은 머신/워크스페이스 Skill 루트를 사용하되 에이전트별로 보이는 Skill 집합을 다르게 하려면 에이전트 구성을 사용하세요.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  `agents.list[].skills`를 생략한 에이전트가 상속하는 공유 기준 허용 목록입니다.
  기본적으로 Skills를 제한하지 않으려면 완전히 생략하세요.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  해당 에이전트의 명시적인 최종 Skill 집합입니다. 명시적 목록은 상속된 기본값을 **대체**하며 병합하지 않습니다.
  해당 에이전트에 어떤 Skills도 노출하지 않으려면 `[]`로 설정하세요.
</ParamField>

## Workshop(`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  `true`이면 에이전트가 성공적인 턴 이후 지속성 있는 대화 신호에서 보류 중인 제안을 만들 수 있습니다.
  사용자가 프롬프트로 요청한 Skill 생성은 이 설정과 관계없이 항상 Skill Workshop을 거칩니다.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending`은 에이전트가 시작한 적용, 거부 또는 격리 전에 운영자 승인을 요구합니다.
  `auto`는 승인 없이 해당 작업을 허용합니다.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  실제 대상이 이미 `skills.load.allowSymlinkTargets`에서 신뢰되는 워크스페이스 Skill 심볼릭 링크를 통해
  Skill Workshop 적용이 쓰기 작업을 할 수 있게 합니다. 생성된 제안 적용이 해당 공유 Skill 루트를 변경해야 하는 경우가 아니면
  비활성화 상태로 유지하세요.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  워크스페이스당 보존되는 대기 중 및 격리된 제안의 최대 수입니다.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  제안 본문 크기의 최대값(바이트)입니다. 제안 설명은 검색 및 목록 출력에
  표시되므로 160바이트로 엄격히 제한됩니다.
</ParamField>

## 심볼릭 링크된 스킬 루트

기본적으로 워크스페이스, 프로젝트 에이전트, 추가 디렉터리, 번들된 스킬 루트는
포함 경계입니다. `<workspace>/skills` 아래의 심볼릭 링크된 스킬 폴더가
루트 외부로 해석되면 로그 메시지와 함께 건너뜁니다.

의도적인 심볼릭 링크 레이아웃을 허용하려면 신뢰할 수 있는 대상을 선언하세요.

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

이 설정을 사용하면 `<workspace>/skills/manager -> ~/Projects/manager/skills`는
realpath 해석 후 허용됩니다. `extraDirs`는 형제 저장소를 직접 스캔하고,
`allowSymlinkTargets`는 기존 레이아웃을 위해 심볼릭 링크된 경로를 보존합니다.

Skill Workshop apply는 기본적으로 해당 심볼릭 링크를 통해 쓰지 않습니다.
Workshop apply가 이미 신뢰된 심볼릭 링크 대상 아래의 스킬을 변경할 수 있게 하려면
별도로 옵트인하세요.

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

관리되는 `~/.openclaw/skills` 및 개인 `~/.agents/skills` 디렉터리는
이미 스킬 디렉터리 심볼릭 링크를 허용합니다(스킬별 `SKILL.md` 포함 경계는
계속 적용됩니다).

## 샌드박스화된 스킬과 환경 변수

<Warning>
  `skills.entries.<skill>.env`와 `apiKey`는 **호스트** 실행에만 적용됩니다.
  샌드박스 내부에서는 효과가 없습니다. `GEMINI_API_KEY`에 의존하는 스킬은
  샌드박스에 해당 변수를 별도로 제공하지 않으면 `apiKey not configured`로
  실패합니다.
</Warning>

Docker 샌드박스에 시크릿을 전달하려면 다음을 사용하세요.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Docker 데몬 접근 권한이 있는 사용자는 Docker 메타데이터를 통해
  `sandbox.docker.env` 값을 검사할 수 있습니다. 이러한 노출이 허용되지 않는 경우
  마운트된 시크릿 파일, 사용자 지정 이미지 또는 다른 전달 경로를 사용하세요.
</Note>

## 로딩 순서 알림

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

감시자가 활성화된 경우 스킬 및 설정 변경 사항은 다음 새 세션에서 적용되며,
감시자가 변경을 감지하면 다음 에이전트 턴에서 적용됩니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Skills reference" href="/ko/tools/skills" icon="puzzle-piece">
    스킬의 정의, 로딩 순서, 게이팅, `SKILL.md` 형식입니다.
  </Card>
  <Card title="Creating skills" href="/ko/tools/creating-skills" icon="hammer">
    사용자 지정 워크스페이스 스킬 작성입니다.
  </Card>
  <Card title="Skill Workshop" href="/ko/tools/skill-workshop" icon="flask">
    에이전트가 초안 작성한 스킬을 위한 제안 대기열입니다.
  </Card>
  <Card title="Slash commands" href="/ko/tools/slash-commands" icon="terminal">
    네이티브 슬래시 명령 카탈로그와 채팅 지시문입니다.
  </Card>
</CardGroup>
