---
read_when:
    - Skills 게시하기
    - 게시 실패 디버깅
summary: Skill 폴더 형식, 필수 파일, 허용되는 파일 형식, 제한 사항.
x-i18n:
    generated_at: "2026-07-12T00:36:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill 형식

## 디스크 구조

Skill은 폴더입니다.

필수:

- `SKILL.md`(또는 `skill.md`, 레거시 `skills.md`도 허용됨)

선택 사항:

- 지원용 _텍스트 기반_ 파일(“허용되는 파일” 참조)
- `.clawhubignore`(게시 시 사용할 무시 패턴, 레거시 `.clawdhubignore`)
- `.gitignore`(이 파일도 적용됨)

## GitHub 가져오기

웹 GitHub 가져오기 기능은 로컬 게시/동기화보다 엄격합니다. 로그인한 GitHub 계정이 소유한 공개 비포크 저장소에서 `SKILL.md` 또는 레거시 `skills.md` 파일만 검색합니다. 비공개 저장소, 포크, 보관되거나 비활성화된 저장소, 제3자가 소유한 공개 저장소는 가져오지 않습니다.

로컬 설치 메타데이터(CLI에서 기록):

- `<skill>/.clawhub/origin.json`(레거시 `.clawdhub`)

작업 디렉터리 설치 상태(CLI에서 기록):

- `<workdir>/.clawhub/lock.json`(레거시 `.clawdhub`)

## `SKILL.md`

- 선택적 YAML 프런트매터를 포함하는 Markdown입니다.
- 서버는 게시 중 프런트매터에서 메타데이터를 추출합니다.
- `description`은 UI/검색에서 Skill 요약으로 사용됩니다.

이식 가능한 에이전트 Skills의 경우 `name`은 상위 디렉터리 이름과 일치해야 하며 1~64자의 소문자, 숫자 또는 하이픈을 사용해야 합니다. ClawHub는 라우팅 가능한 슬러그와 카탈로그 표시 이름을 별도로 유지하므로 다른 클라이언트에서 사용하던 기존 이름도 계속 게시할 수 있으며 자동으로 변경되지 않습니다. 카탈로그 목록에서는 저장된 이름을 변경하지 않고 긴 이름을 시각적으로 줄여 표시할 수 있습니다.

## 프런트매터 메타데이터

Skill 메타데이터는 `SKILL.md` 상단의 YAML 프런트매터에 선언합니다. 이를 통해 레지스트리와 보안 분석 시스템이 Skill 실행에 필요한 항목을 파악할 수 있습니다.

### 기본 프런트매터

```yaml
---
name: my-skill
description: 이 Skill의 기능에 대한 간단한 요약입니다.
version: 1.0.0
---
```

### 런타임 메타데이터(`metadata.openclaw`)

Skill의 런타임 요구 사항을 `metadata.openclaw` 아래에 선언합니다(별칭: `metadata.clawdbot`, `metadata.clawdis`).

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

Skill을 실행하기 전에 반드시 존재해야 하는 환경 변수에는 `requires.env`를 사용합니다. 선택적 변수에 `required: false`를 지정하는 등 변수별 메타데이터가 필요할 때는 `envVars`를 사용합니다.

### 전체 필드 참조

| 필드               | 유형       | 설명                                                                                                                                                      |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill에서 요구하는 필수 환경 변수입니다.                                                                                                                  |
| `requires.bins`    | `string[]` | 모두 설치되어 있어야 하는 CLI 바이너리입니다.                                                                                                             |
| `requires.anyBins` | `string[]` | 하나 이상 존재해야 하는 CLI 바이너리입니다.                                                                                                               |
| `requires.config`  | `string[]` | Skill에서 읽는 구성 파일 경로입니다.                                                                                                                       |
| `primaryEnv`       | `string`   | Skill의 기본 자격 증명 환경 변수입니다.                                                                                                                    |
| `envVars`          | `array`    | `name`, 선택적 `required`, 선택적 `description`을 포함하는 환경 변수 선언입니다. 선택적 환경 변수에는 `required: false`를 설정합니다.                     |
| `always`           | `boolean`  | `true`이면 Skill이 항상 활성화됩니다(명시적 설치가 필요하지 않음).                                                                                         |
| `skillKey`         | `string`   | Skill 호출 키를 재정의합니다.                                                                                                                              |
| `emoji`            | `string`   | Skill에 표시할 이모지입니다.                                                                                                                               |
| `homepage`         | `string`   | Skill 홈페이지 또는 문서의 URL입니다.                                                                                                                      |
| `os`               | `string[]` | OS 제한 사항입니다(예: `["macos"]`, `["linux"]`).                                                                                                         |
| `install`          | `array`    | 종속성 설치 명세입니다(아래 참조).                                                                                                                         |
| `nix`              | `object`   | Nix Plugin 명세입니다(README 참조).                                                                                                                        |
| `config`           | `object`   | Clawdbot 구성 명세입니다(README 참조).                                                                                                                     |

### 설치 명세

Skill에 종속성 설치가 필요한 경우 `install` 배열에 선언합니다.

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

선택적 환경 변수는 `metadata.openclaw.envVars` 아래에 선언하고 `required: false`를 설정합니다. `requires.env`는 해당 변수 없이는 Skill을 실행할 수 없음을 의미하므로 선택적 항목을 추가하지 마세요.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: 인증된 요청에 사용하는 Todoist API 토큰입니다.
      - name: TODOIST_PROJECT_ID
        required: false
        description: 사용자가 지정하지 않을 때 사용할 선택적 기본 프로젝트 ID입니다.
```

### 중요한 이유

ClawHub의 보안 분석은 Skill에 선언된 내용과 실제 동작이 일치하는지 확인합니다. 코드에서 `TODOIST_API_KEY`를 참조하지만 프런트매터의 `requires.env`, `primaryEnv` 또는 `envVars`에 선언하지 않으면 분석에서 메타데이터 불일치로 표시됩니다. 선언을 정확하게 유지하면 Skill이 검토를 통과하는 데 도움이 되며, 사용자가 무엇을 설치하는지 이해할 수 있습니다.

### 예시: 완전한 프런트매터

```yaml
---
name: todoist-cli
description: 명령줄에서 Todoist 작업, 프로젝트 및 레이블을 관리합니다.
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
        description: Todoist API 토큰입니다.
      - name: TODOIST_PROJECT_ID
        required: false
        description: 선택적 기본 프로젝트 ID입니다.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## 허용되는 파일

게시 시 “텍스트 기반” 파일만 허용됩니다.

- 확장자 허용 목록은 `packages/schema/src/textFiles.ts`의 `TEXT_FILE_EXTENSIONS`에 있습니다.
- 스크립트 파일은 업로드 후에도 검사되며 PowerShell `.ps1`, `.psm1`, `.psd1` 파일은 텍스트로 허용됩니다.
- `text/`로 시작하는 콘텐츠 유형은 텍스트로 처리되며 소규모 허용 목록(JSON/YAML/TOML/JS/TS/Markdown/SVG)도 적용됩니다.

제한 사항(서버 측):

- 전체 번들 크기: 50MB.
- 임베딩 텍스트에는 `SKILL.md`와 최대 약 40개의 `.md`가 아닌 파일이 포함됩니다(최선형 제한).

## 슬러그

- 기본적으로 폴더 이름에서 파생됩니다.
- 패키지 범위는 ClawHub 게시자 핸들과 정확히 일치해야 합니다. 게시자 핸들에는 소문자, 숫자, 하이픈, 마침표 및 밑줄을 사용할 수 있으며 소문자나 숫자로 시작하고 끝나야 합니다.
- 패키지 슬러그는 소문자이며 npm에서 안전하게 사용할 수 있어야 합니다. 예: `@example.tools/demo-plugin` 또는 `demo-plugin`.

## 버전 관리 및 태그

- 게시할 때마다 새 버전(semver)이 생성됩니다.
- 태그는 버전을 가리키는 문자열 포인터이며 일반적으로 `latest`를 사용합니다.

## 라이선스

- ClawHub에 게시된 모든 Skills에는 `MIT-0` 라이선스가 적용됩니다.
- 누구나 게시된 Skills를 상업적 용도를 포함하여 사용, 수정 및 재배포할 수 있습니다.
- 저작자 표시는 필요하지 않습니다.
- `SKILL.md`에 상충하는 라이선스 조건을 추가하지 마세요. ClawHub는 Skill별 라이선스 재정의를 지원하지 않습니다.

## 유료 Skills

- ClawHub는 유료 Skills, Skill별 가격 책정, 페이월 또는 수익 공유를 지원하지 않습니다.
- `SKILL.md`에 가격 메타데이터를 추가하지 마세요. 이는 Skill 형식의 일부가 아니며 게시된 Skill을 유료로 만들지 않습니다.
- Skill이 유료 제3자 서비스와 통합되는 경우 Skill 지침과 환경 변수 선언에 외부 비용 및 필요한 계정을 명확하게 문서화하세요(필수 변수에는 `requires.env`, 선택적 변수에는 `required: false`가 지정된 `envVars` 사용).
