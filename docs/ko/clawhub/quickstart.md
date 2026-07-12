---
read_when:
    - ClawHub 처음 사용하기
    - 레지스트리에서 Skill 또는 Plugin 설치하기
    - ClawHub에 게시하기
summary: 'ClawHub 사용 시작하기: 스킬 또는 플러그인을 검색하고, 설치하고, 업데이트하고, 게시하세요.'
x-i18n:
    generated_at: "2026-07-12T00:36:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# 빠른 시작

ClawHub는 OpenClaw Skills 및 Plugin용 레지스트리입니다.

OpenClaw에 항목을 설치할 때는 OpenClaw를 사용하세요. 로그인, 게시, 자체 목록 관리 또는 레지스트리별 워크플로 사용 시에는 `clawhub` CLI를 사용하세요.

## Skill 검색 및 설치

OpenClaw에서 검색합니다.

```bash
openclaw skills search "calendar"
```

Skill을 설치합니다.

```bash
openclaw skills install @openclaw/demo
```

설치된 Skills를 업데이트합니다.

```bash
openclaw skills update --all
```

OpenClaw는 Skill의 출처를 기록하므로 이후 업데이트에서도 ClawHub를 통해 계속 확인할 수 있습니다.

## Plugin 검색 및 설치

OpenClaw에서 검색합니다.

```bash
openclaw plugins search "calendar"
```

ClawHub 소스를 명시하여 ClawHub에서 호스팅되는 Plugin을 설치합니다.

```bash
openclaw plugins install clawhub:<package>
```

설치된 Plugin을 업데이트합니다.

```bash
openclaw plugins update --all
```

OpenClaw가 npm이나 다른 소스 대신 ClawHub를 통해 패키지를 확인하도록 하려면 `clawhub:` 접두사를 사용하세요.

## 게시를 위한 로그인

ClawHub CLI를 설치합니다.

```bash
npm i -g clawhub
# 또는
pnpm add -g clawhub
```

GitHub로 로그인합니다.

```bash
clawhub login
clawhub whoami
```

헤드리스 환경에서는 ClawHub 웹 UI에서 발급한 API 토큰을 사용할 수 있습니다.

```bash
clawhub login --token clh_...
```

## Skill 게시

Skill은 필수 `SKILL.md` 파일과 선택적 지원 파일이 포함된 폴더입니다.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

이 명령은 변경되지 않은 콘텐츠를 건너뜁니다. 새 Skills의 버전은 `1.0.0`부터 시작하며, 이후 변경 사항은 다음 패치 버전으로 자동 게시됩니다. 미리 보려면 `--dry-run`을 사용하고, 버전을 명시적으로 선택하려면 `--version`을 사용하세요.

게시하기 전에 `SKILL.md`의 메타데이터를 확인하세요. 사용자가 Skill을 설치하기 전에 필요한 사항을 이해할 수 있도록 필수 환경 변수, 도구 및 권한을 선언하세요. [Skill 형식](/ko/clawhub/skill-format)을 참조하세요.

여러 Skills가 포함된 저장소의 경우 재사용 가능한 GitHub 워크플로는 `skills/` 바로 아래에 있는 각 Skill 폴더에 대해 `skill publish`를 호출합니다.

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Plugin 게시

로컬 폴더, GitHub 저장소, GitHub 참조 또는 기존 아카이브에서 Plugin을 게시합니다.

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

게시하지 않고 확인된 패키지 메타데이터, 호환성 필드, 소스 귀속 정보 및 업로드 계획을 미리 보려면 먼저 `--dry-run`을 사용하세요.

코드 Plugin은 `package.json`에 `openclaw.compat.pluginApi` 및 `openclaw.build.openclawVersion`을 비롯한 OpenClaw 호환성 메타데이터를 포함해야 합니다.

## 설치 전 검사

설치하기 전에 ClawHub 웹 페이지 또는 CLI 상세 정보 명령을 사용하여 메타데이터, 소스 링크, 버전, 변경 로그 및 검사 상태를 확인하세요.

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

공개 목록에는 최신 검사 상태가 표시됩니다. 검토를 위해 보류되거나 차단된 릴리스는 문제가 해결될 때까지 검색 및 설치 화면에서 숨겨질 수 있습니다.
