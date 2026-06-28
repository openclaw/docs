---
read_when:
    - Skills 게시하기
    - 게시 실패 디버깅
summary: Skill 폴더 형식, 필수 파일, 허용되는 파일 유형, 제한 사항.
x-i18n:
    generated_at: "2026-06-28T20:42:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill 형식

## 디스크상

Skill은 폴더입니다.

필수:

- `SKILL.md`(또는 `skill.md`; 레거시 `skills.md`도 허용됨)

선택 사항:

- 지원용 _텍스트 기반_ 파일(“허용되는 파일” 참조)
- `.clawhubignore`(게시 시 무시할 패턴, 레거시 `.clawdhubignore`)
- `.gitignore`(역시 적용됨)

## GitHub 가져오기

웹 GitHub 가져오기 도구는 로컬 게시/동기화보다 더 엄격합니다. 로그인한 GitHub 계정이 소유한 공개 비포크 리포지토리에서 `SKILL.md` 또는 레거시 `skills.md` 파일만 검색합니다. 비공개 리포지토리, 포크, 아카이브/비활성화된 리포지토리 또는 타사 공개 리포지토리는 가져오지 않습니다.

로컬 설치 메타데이터(CLI가 기록):

- `<skill>/.clawhub/origin.json`(레거시 `.clawdhub`)

작업 디렉터리 설치 상태(CLI가 기록):

- `<workdir>/.clawhub/lock.json`(레거시 `.clawdhub`)

## `SKILL.md`

- 선택적 YAML frontmatter가 있는 Markdown.
- 서버는 게시 중 frontmatter에서 메타데이터를 추출합니다.
- `description`은 UI/검색에서 Skill 요약으로 사용됩니다.

## Frontmatter 메타데이터

Skill 메타데이터는 `SKILL.md` 맨 위의 YAML frontmatter에 선언합니다. 이는 레지스트리(및 보안 분석)에 Skill 실행에 필요한 항목을 알려줍니다.

### 기본 frontmatter

```yaml
---
name: my-skill
description: 이 Skill이 수행하는 작업에 대한 짧은 요약.
version: 1.0.0
---
```

### 런타임 메타데이터(`metadata.openclaw`)

`metadata.openclaw` 아래에 Skill의 런타임 요구 사항을 선언합니다(별칭: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Todoist API를 통해 작업을 관리합니다.
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

Skill을 실행하기 전에 반드시 존재해야 하는 환경 변수에는 `requires.env`를 사용하세요. 선택적 변수와 `required: false`를 포함한 변수별 메타데이터가 필요할 때는 `envVars`를 사용하세요.

### 전체 필드 참조

| 필드               | 유형       | 설명                                                                                                                                  |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill이 기대하는 필수 환경 변수.                                                                                                      |
| `requires.bins`    | `string[]` | 모두 설치되어 있어야 하는 CLI 바이너리.                                                                                               |
| `requires.anyBins` | `string[]` | 하나 이상 존재해야 하는 CLI 바이너리.                                                                                                  |
| `requires.config`  | `string[]` | Skill이 읽는 설정 파일 경로.                                                                                                          |
| `primaryEnv`       | `string`   | Skill의 기본 자격 증명 환경 변수.                                                                                                     |
| `envVars`          | `array`    | `name`, 선택적 `required`, 선택적 `description`이 있는 환경 변수 선언. 선택적 환경 변수에는 `required: false`를 설정하세요.          |
| `always`           | `boolean`  | `true`이면 Skill이 항상 활성화됩니다(명시적 설치 불필요).                                                                             |
| `skillKey`         | `string`   | Skill 호출 키를 재정의합니다.                                                                                                         |
| `emoji`            | `string`   | Skill의 표시 이모지.                                                                                                                  |
| `homepage`         | `string`   | Skill 홈페이지 또는 문서 URL.                                                                                                         |
| `os`               | `string[]` | OS 제한(예: `["macos"]`, `["linux"]`).                                                                                                |
| `install`          | `array`    | 의존성 설치 사양(아래 참조).                                                                                                         |
| `nix`              | `object`   | Nix Plugin 사양(README 참조).                                                                                                         |
| `config`           | `object`   | Clawdbot 설정 사양(README 참조).                                                                                                      |

### 설치 사양

Skill에 설치해야 하는 의존성이 필요한 경우 `install` 배열에 선언하세요.

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

선택적 환경 변수는 `metadata.openclaw.envVars` 아래에 선언하고 `required: false`를 설정하세요. `requires.env`에는 선택적 항목을 추가하지 마세요. `requires.env`는 해당 항목 없이는 Skill을 실행할 수 없음을 의미하기 때문입니다.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: 인증된 요청에 사용되는 Todoist API 토큰.
      - name: TODOIST_PROJECT_ID
        required: false
        description: 사용자가 지정하지 않을 때 사용할 선택적 기본 프로젝트 ID.
```

### 이것이 중요한 이유

ClawHub의 보안 분석은 Skill이 선언한 내용이 실제 동작과 일치하는지 확인합니다. 코드가 `TODOIST_API_KEY`를 참조하지만 frontmatter가 이를 `requires.env`, `primaryEnv` 또는 `envVars` 아래에 선언하지 않으면 분석에서 메타데이터 불일치를 표시합니다. 선언을 정확하게 유지하면 Skill이 검토를 통과하는 데 도움이 되고 사용자가 설치하는 항목을 이해하는 데도 도움이 됩니다.

### 예시: 완전한 frontmatter

```yaml
---
name: todoist-cli
description: 명령줄에서 Todoist 작업, 프로젝트, 레이블을 관리합니다.
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
        description: Todoist API 토큰.
      - name: TODOIST_PROJECT_ID
        required: false
        description: 선택적 기본 프로젝트 ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## 허용되는 파일

게시에는 “텍스트 기반” 파일만 허용됩니다.

- 확장자 허용 목록은 `packages/schema/src/textFiles.ts`(`TEXT_FILE_EXTENSIONS`)에 있습니다.
- 스크립트 파일은 업로드 후에도 계속 스캔됩니다. PowerShell `.ps1`, `.psm1`, `.psd1` 파일은 텍스트로 허용됩니다.
- `text/`로 시작하는 콘텐츠 유형은 텍스트로 처리되며, 작은 허용 목록(JSON/YAML/TOML/JS/TS/Markdown/SVG)도 추가로 적용됩니다.

제한(서버 측):

- 총 번들 크기: 50MB.
- 임베딩 텍스트에는 `SKILL.md` + 최대 약 40개의 비-`.md` 파일이 포함됩니다(최선 노력 한도).

## Slug

- 기본적으로 폴더 이름에서 파생됩니다.
- 패키지 scope는 ClawHub 게시자 핸들과 정확히 일치해야 합니다. 게시자 핸들은 소문자, 숫자, 하이픈, 점, 밑줄을 사용할 수 있으며, 소문자 또는 숫자로 시작하고 끝나야 합니다.
- 패키지 slug는 소문자이고 npm에 안전해야 합니다. 예: `@example.tools/demo-plugin` 또는 `demo-plugin`.

## 버전 관리 + 태그

- 게시할 때마다 새 버전(semver)이 생성됩니다.
- 태그는 버전을 가리키는 문자열 포인터입니다. `latest`가 일반적으로 사용됩니다.

## 라이선스

- ClawHub에 게시된 모든 Skill은 `MIT-0`에 따라 라이선스가 부여됩니다.
- 누구나 게시된 Skill을 상업적 용도를 포함해 사용, 수정, 재배포할 수 있습니다.
- 출처 표기는 필요하지 않습니다.
- `SKILL.md`에 상충되는 라이선스 조건을 추가하지 마세요. ClawHub는 Skill별 라이선스 재정의를 지원하지 않습니다.

## 유료 Skill

- ClawHub는 유료 Skill, Skill별 가격 책정, 페이월 또는 수익 공유를 지원하지 않습니다.
- `SKILL.md`에 가격 메타데이터를 추가하지 마세요. 이는 Skill 형식의 일부가 아니며 게시된 Skill을 유료로 만들지 않습니다.
- Skill이 유료 타사 서비스와 통합되는 경우, 외부 비용과 필요한 계정을 Skill 지침 및 환경 변수 선언에 명확히 문서화하세요(필수 변수에는 `requires.env`, 선택적 변수에는 `required: false`가 있는 `envVars`).
