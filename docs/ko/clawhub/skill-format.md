---
read_when:
    - Skills 게시하기
    - 게시/동기화 실패 디버깅
summary: 스킬 폴더 형식, 필수 파일, 허용되는 파일 유형, 제한 사항.
x-i18n:
    generated_at: "2026-05-11T20:25:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# 스킬 형식

## 디스크에서

스킬은 폴더입니다.

필수:

- `SKILL.md`(또는 `skill.md`)

선택 사항:

- 보조 _텍스트 기반_ 파일(“허용되는 파일” 참조)
- `.clawhubignore`(게시/동기화용 무시 패턴, 레거시 `.clawdhubignore`)
- `.gitignore`(역시 적용됨)

로컬 설치 메타데이터(CLI가 작성):

- `<skill>/.clawhub/origin.json`(레거시 `.clawdhub`)

작업 디렉터리 설치 상태(CLI가 작성):

- `<workdir>/.clawhub/lock.json`(레거시 `.clawdhub`)

## `SKILL.md`

- 선택적 YAML frontmatter가 있는 Markdown입니다.
- 서버는 게시 중 frontmatter에서 메타데이터를 추출합니다.
- `description`은 UI/검색에서 스킬 요약으로 사용됩니다.

## Frontmatter 메타데이터

스킬 메타데이터는 `SKILL.md` 맨 위의 YAML frontmatter에 선언합니다. 이는 레지스트리(및 보안 분석)에 스킬 실행에 필요한 항목을 알려 줍니다.

### 기본 frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### 런타임 메타데이터(`metadata.openclaw`)

`metadata.openclaw` 아래에 스킬의 런타임 요구 사항을 선언합니다(별칭: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

스킬을 실행하기 전에 반드시 있어야 하는 환경 변수에는 `requires.env`를 사용하세요. 선택 변수를 포함해 변수별 메타데이터가 필요할 때는 `envVars`를 사용하고, 선택 변수에는 `required: false`를 포함하세요.

### 전체 필드 참조

| 필드               | 유형       | 설명                                                                                                                                         |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | 스킬이 기대하는 필수 환경 변수입니다.                                                                                                        |
| `requires.bins`    | `string[]` | 모두 설치되어 있어야 하는 CLI 바이너리입니다.                                                                                                |
| `requires.anyBins` | `string[]` | 하나 이상 존재해야 하는 CLI 바이너리입니다.                                                                                                  |
| `requires.config`  | `string[]` | 스킬이 읽는 구성 파일 경로입니다.                                                                                                            |
| `primaryEnv`       | `string`   | 스킬의 기본 자격 증명 환경 변수입니다.                                                                                                       |
| `envVars`          | `array`    | `name`, 선택적 `required`, 선택적 `description`이 포함된 환경 변수 선언입니다. 선택 환경 변수에는 `required: false`를 설정하세요.          |
| `always`           | `boolean`  | `true`이면 스킬이 항상 활성화됩니다(명시적 설치 필요 없음).                                                                                 |
| `skillKey`         | `string`   | 스킬의 호출 키를 재정의합니다.                                                                                                               |
| `emoji`            | `string`   | 스킬의 표시용 이모지입니다.                                                                                                                  |
| `homepage`         | `string`   | 스킬의 홈페이지 또는 문서 URL입니다.                                                                                                         |
| `os`               | `string[]` | OS 제한입니다(예: `["macos"]`, `["linux"]`).                                                                                                 |
| `install`          | `array`    | 종속성 설치 사양입니다(아래 참조).                                                                                                           |
| `nix`              | `object`   | Nix plugin 사양입니다(README 참조).                                                                                                          |
| `config`           | `object`   | Clawdbot 구성 사양입니다(README 참조).                                                                                                       |

### 설치 사양

스킬에 종속성 설치가 필요하면 `install` 배열에 선언하세요.

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

지원되는 설치 종류: `brew`, `node`, `go`, `uv`.

### 선택적 환경 변수

선택적 환경 변수는 `metadata.openclaw.envVars` 아래에 선언하고 `required: false`를 설정하세요. `requires.env`에는 선택 항목을 추가하지 마세요. `requires.env`는 해당 항목 없이는 스킬을 실행할 수 없다는 뜻입니다.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### 이것이 중요한 이유

ClawHub의 보안 분석은 스킬이 선언한 내용이 실제 동작과 일치하는지 확인합니다. 코드가 `TODOIST_API_KEY`를 참조하지만 frontmatter에서 `requires.env`, `primaryEnv`, 또는 `envVars` 아래에 선언하지 않으면 분석에서 메타데이터 불일치로 표시됩니다. 선언을 정확하게 유지하면 스킬이 검토를 통과하는 데 도움이 되며, 사용자가 설치하는 항목을 이해하는 데도 도움이 됩니다.

### 예시: 완전한 frontmatter

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## 허용되는 파일

게시에는 “텍스트 기반” 파일만 허용됩니다.

- 확장자 허용 목록은 `packages/schema/src/textFiles.ts`(`TEXT_FILE_EXTENSIONS`)에 있습니다.
- 스크립트 파일은 업로드 후에도 검사됩니다. PowerShell `.ps1`, `.psm1`, `.psd1` 파일은 텍스트로 허용됩니다.
- `text/`로 시작하는 콘텐츠 유형은 텍스트로 처리되며, 작은 허용 목록(JSON/YAML/TOML/JS/TS/Markdown/SVG)도 추가로 적용됩니다.

제한(서버 측):

- 전체 번들 크기: 50MB.
- 임베딩 텍스트에는 `SKILL.md` + 최대 약 40개의 비 `.md` 파일이 포함됩니다(최선 노력 상한).

## 슬러그

- 기본적으로 폴더 이름에서 파생됩니다.
- 소문자이며 URL에 안전해야 합니다: `^[a-z0-9][a-z0-9-]*$`.

## 버전 관리 + 태그

- 게시할 때마다 새 버전(semver)이 생성됩니다.
- 태그는 버전을 가리키는 문자열 포인터입니다. `latest`가 일반적으로 사용됩니다.

## 라이선스

- ClawHub에 게시되는 모든 스킬은 `MIT-0` 라이선스로 제공됩니다.
- 누구나 게시된 스킬을 상업적 용도를 포함해 사용, 수정, 재배포할 수 있습니다.
- 저작자 표기는 필요하지 않습니다.
- `SKILL.md`에 충돌하는 라이선스 조건을 추가하지 마세요. ClawHub는 스킬별 라이선스 재정의를 지원하지 않습니다.

## 유료 스킬

- ClawHub는 유료 스킬, 스킬별 가격 책정, 페이월, 수익 공유를 지원하지 않습니다.
- `SKILL.md`에 가격 메타데이터를 추가하지 마세요. 이는 스킬 형식의 일부가 아니며, 게시된 스킬을 유료로 만들지 않습니다.
- 스킬이 유료 타사 서비스와 통합되는 경우, 외부 비용과 필요한 계정을 스킬 지침 및 환경 변수 선언에 명확하게 문서화하세요(필수 변수에는 `requires.env`, 선택 변수에는 `required: false`가 포함된 `envVars`).
