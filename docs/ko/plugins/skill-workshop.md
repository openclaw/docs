---
read_when:
    - 에이전트가 수정 사항이나 재사용 가능한 절차를 작업 공간 Skills로 전환하도록 하려는 경우
    - 절차적 스킬 메모리를 구성하고 있습니다
    - skill_workshop 도구 동작을 디버깅하고 있습니다
    - 자동 Skills 생성을 활성화할지 결정하고 있습니다
summary: 재사용 가능한 절차를 검토, 승인, 격리 및 실시간 Skills 새로 고침이 포함된 워크스페이스 Skills로 캡처하는 실험적 기능
title: 스킬 워크숍 Plugin
x-i18n:
    generated_at: "2026-05-06T06:36:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop는 **실험적**입니다. 기본적으로 비활성화되어 있으며, 캡처
휴리스틱과 검토자 프롬프트는 릴리스 간에 변경될 수 있고, 자동 쓰기는 pending 모드
출력을 먼저 검토한 뒤 신뢰할 수 있는 작업공간에서만 사용해야 합니다.

Skill Workshop는 작업공간 Skills를 위한 절차적 메모리입니다. 에이전트가
재사용 가능한 워크플로, 사용자 수정 사항, 어렵게 찾아낸 수정법, 반복되는 함정을
다음 위치의 `SKILL.md` 파일로 전환할 수 있게 합니다.

```text
<workspace>/skills/<skill-name>/SKILL.md
```

이는 장기 메모리와 다릅니다.

- **Memory**는 사실, 선호도, 엔터티, 과거 컨텍스트를 저장합니다.
- **Skills**는 에이전트가 향후 작업에서 따라야 하는 재사용 가능한 절차를 저장합니다.
- **Skill Workshop**은 유용했던 턴을 안전성 검사와 선택적 승인을 거쳐 오래 유지되는 작업공간
  skill로 연결하는 다리입니다.

Skill Workshop는 에이전트가 다음과 같은 절차를 학습할 때 유용합니다.

- 외부에서 가져온 애니메이션 GIF 에셋을 검증하는 방법
- 스크린샷 에셋을 교체하고 크기를 확인하는 방법
- 저장소별 QA 시나리오를 실행하는 방법
- 반복되는 제공자 실패를 디버그하는 방법
- 오래된 로컬 워크플로 메모를 복구하는 방법

다음 용도로는 의도되지 않았습니다.

- "사용자는 파란색을 좋아한다" 같은 사실
- 광범위한 자전적 메모리
- 원시 대화 기록 보관
- 비밀, 자격 증명 또는 숨겨진 프롬프트 텍스트
- 반복되지 않을 일회성 지침

## 기본 상태

번들 Plugin은 `plugins.entries.skill-workshop`에서 명시적으로 활성화하지 않는 한
**실험적**이며 **기본적으로 비활성화**되어 있습니다.

Plugin 매니페스트는 `enabledByDefault: true`를 설정하지 않습니다. Plugin 구성 스키마 안의
`enabled: true` 기본값은 Plugin 항목이 이미 선택되고 로드된 뒤에만 적용됩니다.

실험적이라는 것은 다음을 의미합니다.

- Plugin은 옵트인 테스트와 내부 사용에 충분할 정도로 지원됩니다.
- 제안 저장소, 검토자 임계값, 캡처 휴리스틱은 발전할 수 있습니다.
- 보류 승인이 권장 시작 모드입니다.
- 자동 적용은 공유 환경이나 적대적 입력이 많은 환경이 아니라, 신뢰할 수 있는 개인/작업공간 설정을 위한 것입니다.

## 활성화

최소 안전 구성:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

이 구성을 사용하면 다음과 같습니다.

- `skill_workshop` 도구를 사용할 수 있습니다.
- 명시적인 재사용 가능 수정 사항이 보류 중인 제안으로 대기열에 들어갑니다.
- 임계값 기반 검토자 통과가 skill 업데이트를 제안할 수 있습니다.
- 보류 중인 제안이 적용될 때까지 skill 파일은 작성되지 않습니다.

자동 쓰기는 신뢰할 수 있는 작업공간에서만 사용하세요.

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"`도 동일한 스캐너와 격리 경로를 사용합니다. 치명적 발견 사항이 있는
제안은 적용하지 않습니다.

## 구성

| 키                  | 기본값     | 범위 / 값                              | 의미                                                              |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Plugin 항목이 로드된 뒤 Plugin을 활성화합니다.                 |
| `autoCapture`        | `true`      | boolean                                     | 성공한 에이전트 턴에 대해 턴 이후 캡처/검토를 활성화합니다.          |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | 제안을 대기열에 넣거나 안전한 제안을 자동으로 작성합니다.               |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 명시적 수정 캡처, LLM 검토자, 둘 다, 또는 둘 다 아님을 선택합니다. |
| `reviewInterval`     | `15`        | `1..200`                                    | 이만큼 성공한 턴 이후 검토자를 실행합니다.                       |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | 이만큼 관찰된 도구 호출 이후 검토자를 실행합니다.                    |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 내장 검토자 실행의 제한 시간입니다.                               |
| `maxPending`         | `50`        | `1..200`                                    | 작업공간별로 보관되는 최대 보류/격리 제안 수입니다.                |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | 생성된 skill/지원 파일의 최대 크기입니다.                               |

권장 프로필:

```json5
// 보수적: 명시적 도구 사용만 허용하고 자동 캡처는 하지 않습니다.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// 검토 우선: 자동으로 캡처하지만 승인을 요구합니다.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// 신뢰할 수 있는 자동화: 안전한 제안을 즉시 작성합니다.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// 저비용: 검토자 LLM 호출 없이 명시적 수정 문구만 사용합니다.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## 캡처 경로

Skill Workshop에는 세 가지 캡처 경로가 있습니다.

### 도구 제안

모델은 재사용 가능한 절차를 보거나 사용자가 skill을 저장/업데이트하라고 요청할 때
`skill_workshop`을 직접 호출할 수 있습니다.

이는 가장 명시적인 경로이며 `autoCapture: false`에서도 작동합니다.

### 휴리스틱 캡처

`autoCapture`가 활성화되어 있고 `reviewMode`가 `heuristic` 또는 `hybrid`이면,
Plugin은 성공한 턴에서 명시적인 사용자 수정 문구를 스캔합니다.

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

휴리스틱은 최신 일치 사용자 지침으로 제안을 만듭니다. 일반적인 워크플로의 skill 이름을
선택할 때 주제 힌트를 사용합니다.

- 애니메이션 GIF 작업 -> `animated-gif-workflow`
- 스크린샷 또는 에셋 작업 -> `screenshot-asset-workflow`
- QA 또는 시나리오 작업 -> `qa-scenario-workflow`
- GitHub PR 작업 -> `github-pr-workflow`
- 대체값 -> `learned-workflows`

휴리스틱 캡처는 의도적으로 좁게 설계되었습니다. 일반적인 대화 기록 요약이 아니라
명확한 수정 사항과 반복 가능한 프로세스 메모를 위한 것입니다.

### LLM 검토자

`autoCapture`가 활성화되어 있고 `reviewMode`가 `llm` 또는 `hybrid`이면, Plugin은
임계값에 도달한 뒤 간결한 내장 검토자를 실행합니다.

검토자는 다음을 받습니다.

- 최근 대화 기록 텍스트, 마지막 12,000자로 제한
- 기존 작업공간 Skills 최대 12개
- 각 기존 skill에서 최대 2,000자
- JSON 전용 지침

검토자에는 도구가 없습니다.

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

검토자는 `{ "action": "none" }` 또는 하나의 제안을 반환합니다. `action` 필드는 `create`, `append`, `replace`입니다. 관련 skill이 이미 있으면 `append`/`replace`를 선호하고, 맞는 기존 skill이 없을 때만 `create`를 사용하세요.

`create` 예시:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append`는 `section` + `body`를 추가합니다. `replace`는 명명된 skill에서 `oldText`를 `newText`로 교체합니다.

## 제안 수명 주기

생성된 모든 업데이트는 다음을 포함하는 제안이 됩니다.

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- 선택적 `agentId`
- 선택적 `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end`, 또는 `reviewer`
- `status`
- `change`
- 선택적 `scanFindings`
- 선택적 `quarantineReason`

제안 상태:

- `pending` - 승인 대기 중
- `applied` - `<workspace>/skills`에 작성됨
- `rejected` - 운영자/모델에 의해 거부됨
- `quarantined` - 중요한 스캐너 발견 사항으로 인해 차단됨

상태는 Gateway 상태 디렉터리 아래에 작업공간별로 저장됩니다.

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

대기 중 및 격리된 제안은 스킬 이름과 변경 페이로드를 기준으로 중복 제거됩니다. 저장소는 최신 대기 중/격리 제안을 `maxPending`까지 유지합니다.

## 도구 참조

Plugin은 하나의 에이전트 도구를 등록합니다.

```text
skill_workshop
```

### `status`

활성 작업공간의 상태별 제안 수를 계산합니다.

```json
{ "action": "status" }
```

결과 형태:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

대기 중인 제안을 나열합니다.

```json
{ "action": "list_pending" }
```

다른 상태를 나열하려면:

```json
{ "action": "list_pending", "status": "applied" }
```

유효한 `status` 값:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

격리된 제안을 나열합니다.

```json
{ "action": "list_quarantine" }
```

자동 캡처가 아무 작업도 하지 않는 것처럼 보이고 로그에 `skill-workshop: quarantined <skill>`이 언급될 때 사용합니다.

### `inspect`

ID로 제안을 가져옵니다.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

제안을 생성합니다. `approvalPolicy: "pending"`(기본값)을 사용하면 작성하는 대신 대기열에 추가합니다.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Force a safe write (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Append to a named section">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Replace exact text">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

대기 중인 제안을 적용합니다.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply`는 격리된 제안을 거부합니다.

```text
quarantined proposal cannot be applied
```

### `reject`

제안을 거부됨으로 표시합니다.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

기존 또는 제안된 Skills 디렉터리 안에 지원 파일을 작성합니다.

허용되는 최상위 지원 디렉터리:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

예:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

지원 파일은 workspace 범위로 제한되고, 경로가 검사되며, `maxSkillBytes`로 바이트 수가 제한되고, 스캔된 뒤 원자적으로 작성됩니다.

## Skill 쓰기

Skill Workshop은 다음 위치 아래에만 씁니다.

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill 이름은 정규화됩니다.

- 소문자로 변환됨
- `[a-z0-9_-]`가 아닌 연속 문자는 `-`가 됨
- 앞/뒤의 영숫자가 아닌 문자는 제거됨
- 최대 길이는 80자
- 최종 이름은 `[a-z0-9][a-z0-9_-]{1,79}`와 일치해야 함

`create`의 경우:

- Skill이 없으면 Skill Workshop이 새 `SKILL.md`를 씁니다.
- 이미 있으면 Skill Workshop이 본문을 `## Workflow`에 추가합니다.

`append`의 경우:

- Skill이 있으면 Skill Workshop이 요청된 섹션에 추가합니다.
- 없으면 Skill Workshop이 최소 Skill을 만든 뒤 추가합니다.

`replace`의 경우:

- Skill이 이미 있어야 합니다.
- `oldText`가 정확히 존재해야 합니다.
- 첫 번째 정확한 일치 항목만 교체됩니다.

모든 쓰기는 원자적이며 메모리 내 Skills 스냅샷을 즉시 새로 고치므로, Gateway를 다시 시작하지 않아도 새 Skill이나 업데이트된 Skill이 표시될 수 있습니다.

## 안전 모델

Skill Workshop에는 생성된 `SKILL.md` 콘텐츠와 지원 파일을 대상으로 하는 안전 스캐너가 있습니다.

치명적 발견 항목은 제안을 격리합니다.

| 규칙 id                                | 차단하는 콘텐츠...                                                  |
| -------------------------------------- | ------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | 에이전트에게 이전/상위 지시를 무시하라고 지시함                    |
| `prompt-injection-system`              | 시스템 프롬프트, 개발자 메시지 또는 숨겨진 지시를 참조함           |
| `prompt-injection-tool`                | 도구 권한/승인 우회를 권장함                                       |
| `shell-pipe-to-shell`                  | `curl`/`wget`을 `sh`, `bash` 또는 `zsh`로 파이프하는 내용을 포함함 |
| `secret-exfiltration`                  | env/프로세스 env 데이터를 네트워크로 보내는 것으로 보임             |

경고 발견 항목은 유지되지만 그 자체만으로는 차단하지 않습니다.

| 규칙 id              | 경고 대상...                     |
| -------------------- | -------------------------------- |
| `destructive-delete` | 광범위한 `rm -rf` 스타일 명령    |
| `unsafe-permissions` | `chmod 777` 스타일 권한 사용     |

격리된 제안은 다음과 같습니다.

- `scanFindings`를 유지함
- `quarantineReason`을 유지함
- `list_quarantine`에 나타남
- `apply`를 통해 적용할 수 없음

격리된 제안에서 복구하려면 안전하지 않은 콘텐츠를 제거한 새 안전한 제안을 만드세요. 저장소 JSON을 직접 편집하지 마세요.

## 프롬프트 지침

활성화되면 Skill Workshop은 에이전트에게 지속적인 절차 메모리를 위해 `skill_workshop`을 사용하라고 알려주는 짧은 프롬프트 섹션을 주입합니다.

지침은 다음을 강조합니다.

- 사실/선호가 아닌 절차
- 사용자 수정 사항
- 명확하지 않았지만 성공한 절차
- 반복되는 함정
- append/replace를 통한 오래되었거나 얕거나 잘못된 Skill 복구
- 긴 도구 루프나 어려운 수정 후 재사용 가능한 절차 저장
- 짧은 명령형 Skill 텍스트
- transcript 덤프 금지

쓰기 모드 텍스트는 `approvalPolicy`에 따라 달라집니다.

- pending 모드: 제안을 대기열에 넣고, 명시적 승인 후에만 적용
- auto 모드: 명확히 재사용 가능한 안전한 workspace Skill 업데이트를 적용

## 비용 및 런타임 동작

휴리스틱 캡처는 모델을 호출하지 않습니다.

LLM 검토는 활성/기본 에이전트 모델에서 임베디드 실행을 사용합니다. 임계값 기반이므로 기본적으로 매 턴마다 실행되지는 않습니다.

검토자는 다음과 같습니다.

- 사용 가능한 경우 동일하게 구성된 제공자/모델 컨텍스트를 사용함
- 런타임 에이전트 기본값으로 대체함
- `reviewTimeoutMs`가 있음
- 가벼운 bootstrap 컨텍스트를 사용함
- 도구가 없음
- 직접 아무것도 쓰지 않음
- 일반 스캐너와 승인/격리 경로를 거치는 제안만 내보낼 수 있음

검토자가 실패하거나, 시간 초과되거나, 잘못된 JSON을 반환하면 Plugin은 warning/debug 메시지를 기록하고 해당 검토 패스를 건너뜁니다.

## 운영 패턴

사용자가 다음과 같이 말할 때 Skill Workshop을 사용하세요.

- "다음에는 X를 해"
- "앞으로는 Y를 선호해"
- "Z를 검증하도록 해"
- "이것을 workflow로 저장해"
- "시간이 좀 걸렸으니 과정을 기억해"
- "이것에 대한 로컬 Skill을 업데이트해"

좋은 Skill 텍스트:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

나쁜 Skill 텍스트:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

나쁜 버전을 저장하면 안 되는 이유:

- transcript 형태임
- 명령형이 아님
- 시끄러운 일회성 세부 정보를 포함함
- 다음 에이전트에게 무엇을 해야 하는지 알려주지 않음

## 디버깅

Plugin이 로드되었는지 확인합니다.

```bash
openclaw plugins list --enabled
```

에이전트/도구 컨텍스트에서 제안 수를 확인합니다.

```json
{ "action": "status" }
```

대기 중인 제안을 검사합니다.

```json
{ "action": "list_pending" }
```

격리된 제안을 검사합니다.

```json
{ "action": "list_quarantine" }
```

일반적인 증상:

| 증상                                  | 가능한 원인                                                                         | 확인                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 도구를 사용할 수 없음                 | Plugin 항목이 활성화되지 않음                                                       | `plugins.entries.skill-workshop.enabled` 및 `openclaw plugins list`  |
| 자동 제안이 나타나지 않음             | `autoCapture: false`, `reviewMode: "off"` 또는 임계값 미충족                        | 구성, 제안 상태, Gateway 로그                                        |
| 휴리스틱이 캡처하지 않음              | 사용자 표현이 수정 패턴과 일치하지 않음                                             | 명시적 `skill_workshop.suggest` 사용 또는 LLM 검토자 활성화          |
| 검토자가 제안을 만들지 않음           | 검토자가 `none`, 잘못된 JSON을 반환했거나 시간 초과됨                               | Gateway 로그, `reviewTimeoutMs`, 임계값                              |
| 제안이 적용되지 않음                  | `approvalPolicy: "pending"`                                                         | `list_pending`, 그런 다음 `apply`                                    |
| 제안이 pending에서 사라짐             | 중복 제안 재사용, 최대 pending 정리 또는 적용/거부/격리됨                           | `status`, 상태 필터가 있는 `list_pending`, `list_quarantine`         |
| Skill 파일은 있지만 모델이 놓침       | Skill 스냅샷이 새로 고쳐지지 않았거나 Skill gating이 제외함                         | `openclaw skills` 상태 및 workspace Skill 자격                       |

관련 로그:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA 시나리오

Repo 기반 QA 시나리오:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

결정적 coverage를 실행합니다.

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

검토자 coverage를 실행합니다.

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

검토자 시나리오는 `reviewMode: "llm"`을 활성화하고 임베디드 검토자 패스를 실행하므로 의도적으로 별도로 분리되어 있습니다.

## auto apply를 활성화하지 말아야 할 때

다음과 같은 경우 `approvalPolicy: "auto"`를 피하세요.

- workspace에 민감한 절차가 포함되어 있음
- 에이전트가 신뢰할 수 없는 입력을 작업 중임
- Skills가 광범위한 팀에 공유됨
- 아직 프롬프트나 스캐너 규칙을 조정 중임
- 모델이 적대적인 웹/이메일 콘텐츠를 자주 처리함

먼저 pending 모드를 사용하세요. 해당 workspace에서 에이전트가 제안하는 Skills의 종류를 검토한 후에만 auto 모드로 전환하세요.

## 관련 문서

- [Skills](/ko/tools/skills)
- [Plugins](/ko/tools/plugin)
- [테스트](/ko/reference/test)
