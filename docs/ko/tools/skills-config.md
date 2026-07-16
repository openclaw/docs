---
read_when:
    - Skills 로딩, 설치 또는 게이팅 동작 구성하기
    - 에이전트별 Skills 표시 여부 설정
    - Skill Workshop 제한 또는 승인 정책 조정하기
sidebarTitle: Skills config
summary: skills.* 구성 스키마, 에이전트 허용 목록, 워크숍 설정 및 샌드박스 환경 변수 처리에 대한 전체 참조입니다.
title: Skills 구성
x-i18n:
    generated_at: "2026-07-16T13:10:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

대부분의 Skills 구성은
`~/.openclaw/openclaw.json`의 `skills` 아래에 있습니다. 에이전트별 표시 범위는
`agents.defaults.skills` 및 `agents.list[].skills` 아래에 있습니다.

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
      approvalPolicy: "auto",
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
  핵심 `image_generate` 도구를 함께 사용하십시오. Skill 항목은 사용자 지정 또는
  서드파티 Skill 워크플로 전용입니다.
</Note>

## 로드 (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  가장 낮은 우선순위로 스캔할 추가 Skill 디렉터리입니다(번들 및 Plugin Skills보다
  낮음). 경로는 `~` 지원을 통해 확장됩니다.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  구성된 루트 외부에 심볼릭 링크가 있더라도 심볼릭 링크된 Skill 폴더가 확인될 수 있는
  신뢰할 수 있는 실제 대상 디렉터리입니다. `<workspace>/skills/manager -> ~/Projects/manager/skills`와 같은 의도적인
  형제 저장소 레이아웃에 사용하십시오. 이 목록은 좁게 유지하고
  `~` 또는 `~/Projects`와 같은 광범위한 루트를 지정하지 마십시오.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Skill 폴더를 감시하고 `SKILL.md` 파일이 변경되면 Skills 스냅샷을
  새로 고칩니다. 그룹화된 Skill 루트 아래의 중첩 파일도 포함합니다.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill 감시자 이벤트의 디바운스 시간 범위(밀리초)입니다.
</ParamField>

## 설치 (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew`을 사용할 수 있으면 Homebrew 설치 프로그램을 우선합니다.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill 설치에 사용할 Node 패키지 관리자 기본 설정입니다. 이는 Skill 설치에만
  영향을 줍니다. 표준 상태 저장소가 `node:sqlite`을 사용하므로 OpenClaw CLI와
  Gateway 런타임에는 Node가 필요합니다. `openclaw setup --node-manager` 및
  `openclaw onboard --node-manager`은 `npm`, `pnpm` 또는
  `bun`을 허용합니다. Yarn 기반 Skill 설치에는 구성에서
  `"yarn"`을 직접 설정하십시오.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  신뢰할 수 있는 `operator.admin` Gateway 클라이언트가 `skills.upload.*`을 통해
  준비된 비공개 zip 아카이브를 설치하도록 허용합니다. 일반적인 ClawHub 설치에는
  이 설정이 필요하지 않습니다.
</ParamField>

## 운영자 설치 정책 (`security.installPolicy`)

운영자가 호스트별 정책에 따라 Skill 및 Plugin 설치를 승인하거나 차단할 신뢰할 수 있는
로컬 명령이 필요한 경우 `security.installPolicy`을 사용하십시오. 이 정책은 OpenClaw가
소스 자료를 준비한 후 설치 또는 업데이트가 계속되기 전에 실행됩니다. ClawHub Skills,
업로드된 Skills, Git/로컬 Skills, Skill 종속성 설치 프로그램 및 Plugin 설치/업데이트
소스에 적용됩니다.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // 지원되는 모든 대상을 포함하려면 targets를 생략합니다.
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
  운영자가 소유한 설치 정책을 활성화합니다. 유효한 `exec` 명령 없이
  활성화하면 설치가 실패 시 차단됩니다.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  선택적 대상 필터입니다. 생략하면 새 설치가 예기치 않게 실패 시 허용되지 않도록
  지원되는 모든 대상에 정책이 적용됩니다.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  신뢰할 수 있는 정책 실행 파일의 절대 경로입니다. OpenClaw는 셸 없이 이를 실행하고
  사용하기 전에 경로를 검증합니다.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` 뒤에 전달되는 정적 인수입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  단일 정책 결정의 최대 실제 경과 시간입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  정책이 실패 시 차단되기 전까지 stdout 또는 stderr 출력이 없는 최대 시간입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  정책 프로세스에서 허용하는 stdout 및 stderr의 최대 합산 바이트 수입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  정책 프로세스에 제공되는 리터럴 환경 변수입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw 프로세스에서 정책 프로세스로 복사되는 환경 변수 이름입니다. 이름이 지정된
  변수만 전달됩니다.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  정책 실행 파일을 포함할 수 있는 디렉터리의 선택적 허용 목록입니다.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  명령 경로 소유권 및 권한 검사를 우회합니다. 경로가 다른 메커니즘으로 보호되는
  경우에만 사용하십시오.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  구성된 명령 경로가 심볼릭 링크가 되도록 허용합니다. 확인된 대상은 여전히 다른 경로
  검사를 충족해야 합니다. 인터프리터 스크립트 인수는 심볼릭 링크가 아닌 직접적인
  일반 파일이어야 합니다.
</ParamField>

정책은 stdin으로 `protocolVersion: 1`, `openclawVersion`, `targetType`,
`targetName`, `sourcePath`, `sourcePathKind`, 선택적 구조화된
`source`, 구조화된 `origin` 및 `request`을 포함하는
하나의 JSON 객체를 받습니다. stdout에는 `{ "protocolVersion": 1, "decision": "allow" }` 또는
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`이라는 하나의 JSON 객체를 작성해야 합니다. 0이 아닌 종료 코드,
시간 초과, 잘못된 JSON, 누락된 필드 또는 지원되지 않는 프로토콜 버전은 실패 시
차단됩니다.

OpenClaw는 정상적인 Gateway 시작 중에는 설치 정책을 실행하지 않습니다. 정책이
활성화되어 있지만 사용할 수 없는 경우 설치와 업데이트가 실패 시 차단됩니다.
`openclaw doctor`은 정적 검증을 수행하며, `openclaw doctor --deep`은 구성된 명령을
대상으로 합성 설치 프로브를 실행합니다.

대량 업데이트는 대상별로 정책을 적용합니다. 차단된 Skill 또는 Plugin 업데이트는
정책을 비활성화하거나 배치의 후속 대상을 건너뛰지 않고 해당 대상에서 실패합니다.

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
        reason: "이 호스트에서는 로컬 Plugin 경로가 승인되지 않았습니다",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## 번들 Skill 허용 목록

<ParamField path="skills.allowBundled" type="string[]">
  **번들** Skills에만 적용되는 선택적 허용 목록입니다. 설정하면 목록에 있는 번들
  Skills만 사용 가능합니다. 관리형, 에이전트 수준 및 워크스페이스 Skills에는 영향을
  주지 않습니다.
</ParamField>

## Skill별 항목 (`skills.entries`)

`entries` 아래의 키는 기본적으로 Skill `name`과 일치합니다.
Skill이 `metadata.openclaw.skillKey`을 정의하면 대신 해당 키를 사용하십시오. 하이픈이 포함된
이름은 따옴표로 묶으십시오(JSON5는 따옴표로 묶인 키를 허용함).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false`로 설정하면 Skill이 번들 또는 설치된 경우에도 비활성화됩니다.
  `coding-agent` 번들 Skill은 명시적으로 활성화해야 합니다. 이를
  `true`로 설정하고 `claude`, `codex`,
  `opencode` 또는 지원되는 다른 CLI 중 하나가 설치되고 인증되었는지
  확인하십시오.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv`을 선언하는 Skills를 위한 편의 필드입니다.
  일반 텍스트 문자열 또는 SecretRef인 `{ source: "env", provider: "default", id: "VAR_NAME" }`을 지원합니다.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  에이전트 실행에 주입되는 환경 변수입니다. 변수가 프로세스에 이미 설정되어 있지 않은
  경우에만 주입됩니다.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  사용자 지정 Skill별 구성 필드를 위한 선택적 모음입니다.
</ParamField>

## 에이전트 허용 목록 (`agents`)

동일한 머신/워크스페이스 Skill 루트를 사용하면서 에이전트별로 표시되는 Skill 집합을
다르게 하려면 에이전트 구성을 사용하십시오.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // 공유 기준선
    },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // 기본값을 완전히 대체
      { id: "locked-down", skills: [] }, // Skills 없음
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  `agents.list[].skills`을 생략한 에이전트가 상속하는 공유 기준 허용 목록입니다.
  기본적으로 Skills를 제한하지 않으려면 완전히 생략하십시오.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  해당 에이전트의 명시적인 최종 Skill 집합입니다. 명시적 목록은 상속된 기본값을
  **대체**하며 병합하지 않습니다. 해당 에이전트에 어떤 Skills도 노출하지 않으려면
  `[]`로 설정하십시오.
</ParamField>

<Warning>
  에이전트 Skill 허용 목록은 OpenClaw Skill 검색, 프롬프트, 슬래시 명령 검색,
  샌드박스 동기화 및 Skill 스냅샷을 위한 표시 및 로드 필터입니다. 셸 실행 시점의
  권한 부여 경계가 아닙니다. 에이전트가 호스트 `exec`을 실행할 수 있으면
  해당 셸은 여전히 외부 클라이언트를 실행하거나 실행 사용자가 볼 수 있는 호스트
  파일을 읽을 수 있으며, 여기에는 `~/.openclaw/skills/config/mcporter.json`과 같은 MCP 클라이언트
  레지스트리도 포함됩니다. 에이전트별 MCP 격리를 위해 Skill 허용 목록을
  샌드박스/OS 사용자 격리와 결합하고, 호스트 exec를 거부하거나 엄격한 허용 목록을
  적용하며, MCP 서버에서 에이전트별 자격 증명을 사용하는 방식을 우선하십시오.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  `true`인 경우 OpenClaw는 지속적인 수정 사항으로부터 대기 중인 제안을 생성할 수 있으며,
  시스템이 유휴 상태가 된 후 성공적으로 완료된 상당한 작업을 검토할 수 있습니다.
  이로 인해 요건을 충족하는 턴 이후 백그라운드 모델 실행이 추가될 수 있습니다. 사용자가 요청한
  스킬 생성과 `/learn`은 설정이 `false`인 경우에도 계속 작동합니다.
</ParamField>

요건, 개인정보 보호, 비용, 제안 전용 권한 및 문제 해결에 대해서는
[자기 학습](/tools/self-learning)을 참조하십시오.

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto`을 사용하면 추가 승인 메시지 없이 에이전트가 적용, 거부 또는 격리를
  시작할 수 있습니다. `pending`은 운영자의 승인이 필요합니다.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Skill Workshop 적용 시 실제 대상이 이미 `skills.load.allowSymlinkTargets`에서 신뢰되는
  워크스페이스 스킬 심볼릭 링크를 통해 쓸 수 있도록 허용합니다. 생성된 제안을 적용할 때
  해당 공유 스킬 루트를 변경해야 하는 경우가 아니면 이 설정을 비활성화한 상태로 유지하십시오.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  워크스페이스별로 보존되는 대기 및 격리된 제안의 최대 개수입니다(허용
  범위: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  제안 본문의 최대 크기(바이트)입니다(허용 범위: 1024-200000). 제안
  설명은 탐색 및 목록 출력에 표시되므로 별도로 160바이트로 엄격히 제한됩니다.
</ParamField>

이 구성이 제어하는 제안 수명 주기, CLI 명령, 에이전트 도구 매개변수 및 Gateway 메서드에
대해서는 [Skill Workshop](/ko/tools/skill-workshop)을 참조하십시오.

## 심볼릭 링크로 연결된 스킬 루트

기본적으로 워크스페이스, 프로젝트 에이전트, 추가 디렉터리 및 번들 스킬 루트는
포함 범위의 경계입니다. `<workspace>/skills` 아래에서 루트 외부로 해석되는
심볼릭 링크 스킬 폴더는 로그 메시지와 함께 건너뜁니다.

의도적인 심볼릭 링크 레이아웃을 허용하려면 신뢰할 대상을 선언하십시오.

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

이 구성을 사용하면 `<workspace>/skills/manager -> ~/Projects/manager/skills`은
실제 경로 확인 후 허용됩니다. `extraDirs`은 형제 저장소를
직접 스캔하고, `allowSymlinkTargets`은 기존 레이아웃을 위해 심볼릭 링크 경로를
유지합니다.

Skill Workshop 적용은 기본적으로 이러한 심볼릭 링크를 통해 쓰지 않습니다.
Workshop 적용 시 이미 신뢰되는 심볼릭 링크 대상 아래의 스킬을 변경하도록 하려면
별도로 사용 설정하십시오.

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

관리형 `~/.openclaw/skills` 및 개인용 `~/.agents/skills` 디렉터리는
이미 스킬 디렉터리 심볼릭 링크를 조건 없이 허용합니다(스킬별
`SKILL.md` 포함 범위는 계속 적용됨). 따라서 `allowSymlinkTargets`은
워크스페이스, 추가 디렉터리 및 프로젝트 에이전트(`<workspace>/.agents/skills`)
루트에만 필요합니다.

## 샌드박스 스킬 및 환경 변수

<Warning>
  `skills.entries.<skill>.env` 및 `apiKey`은 **호스트** 실행에만 적용됩니다.
  샌드박스 내부에서는 아무 효과가 없습니다. `GEMINI_API_KEY`에
  의존하는 스킬은 샌드박스에 해당 변수를 별도로 제공하지 않는 한
  `apiKey not configured` 오류로 실패합니다.
</Warning>

다음과 같이 비밀 정보를 Docker 샌드박스에 전달하십시오.

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
  Docker 데몬에 접근할 수 있는 사용자는 Docker 메타데이터를 통해
  `sandbox.docker.env` 값을 확인할 수 있습니다. 이러한 노출을 허용할 수 없는 경우에는
  마운트된 비밀 파일, 사용자 지정 이미지 또는 다른 전달 경로를 사용하십시오.
</Note>

## 로드 순서 알림

```text
workspace/skills      (가장 높음)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
번들 스킬
skills.load.extraDirs (가장 낮음)
```

감시자가 활성화된 경우 스킬 및 구성 변경 사항은 다음 새 세션에서 적용되며,
감시자가 변경을 감지한 경우에는 다음 에이전트 턴에서 적용됩니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="스킬 참조" href="/ko/tools/skills" icon="puzzle-piece">
    스킬의 정의, 로드 순서, 게이팅 및 SKILL.md 형식입니다.
  </Card>
  <Card title="스킬 만들기" href="/ko/tools/creating-skills" icon="hammer">
    사용자 지정 워크스페이스 스킬 작성 방법입니다.
  </Card>
  <Card title="Skill Workshop" href="/ko/tools/skill-workshop" icon="flask">
    에이전트가 초안을 작성한 스킬을 위한 제안 대기열입니다.
  </Card>
  <Card title="자기 학습" href="/tools/self-learning" icon="brain">
    완료된 작업에서 보수적으로 생성되는 옵트인 방식의 제안입니다.
  </Card>
  <Card title="슬래시 명령" href="/ko/tools/slash-commands" icon="terminal">
    네이티브 슬래시 명령 카탈로그 및 채팅 지시문입니다.
  </Card>
</CardGroup>
