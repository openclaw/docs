---
read_when:
    - ClawHub 처음 사용하기
    - 레지스트리에서 스킬 또는 Plugin 설치하기
    - ClawHub에 게시하기
summary: 'ClawHub 사용 시작하기: Skills 또는 Plugin을 찾고, 설치하고, 업데이트하고, 게시합니다.'
x-i18n:
    generated_at: "2026-05-13T02:51:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# 빠른 시작

ClawHub는 OpenClaw 스킬과 플러그인을 위한 레지스트리입니다.

OpenClaw에 항목을 설치할 때는 OpenClaw를 사용하세요. 로그인, 게시, 자신의 목록 관리 또는 레지스트리별 워크플로를 사용할 때는 `clawhub` CLI를 사용하세요.

## 스킬 찾기 및 설치

OpenClaw에서 검색합니다.

```bash
openclaw skills search "calendar"
```

스킬을 설치합니다.

```bash
openclaw skills install <skill-slug>
```

설치된 스킬을 업데이트합니다.

```bash
openclaw skills update --all
```

OpenClaw는 스킬의 출처를 기록하므로 이후 업데이트에서도 ClawHub를 통해 계속 확인할 수 있습니다.

## 플러그인 찾기 및 설치

OpenClaw에서 검색합니다.

```bash
openclaw plugins search "calendar"
```

명시적인 ClawHub 소스로 ClawHub 호스팅 플러그인을 설치합니다.

```bash
openclaw plugins install clawhub:<package>
```

설치된 플러그인을 업데이트합니다.

```bash
openclaw plugins update --all
```

OpenClaw가 npm이나 다른 소스가 아니라 ClawHub를 통해 패키지를 확인하도록 하려면 `clawhub:` 접두사를 사용하세요.

## 게시를 위해 로그인

ClawHub CLI를 설치합니다.

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

GitHub로 로그인합니다.

```bash
clawhub login
clawhub whoami
```

헤드리스 환경에서는 ClawHub 웹 UI의 API 토큰을 사용할 수 있습니다.

```bash
clawhub login --token clh_...
```

## 스킬 게시

스킬은 필수 `SKILL.md` 파일과 선택적 지원 파일이 있는 폴더입니다.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

게시하기 전에 `SKILL.md`의 메타데이터를 확인하세요. 사용자가 설치 전에 스킬에 필요한 사항을 이해할 수 있도록 필요한 환경 변수, 도구, 권한을 선언하세요. [스킬 형식](/ko/clawhub/skill-format)을 참조하세요.

## 플러그인 게시

로컬 폴더, GitHub 저장소, GitHub ref 또는 기존 아카이브에서 플러그인을 게시합니다.

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

게시하지 않고 확인된 패키지 메타데이터, 호환성 필드, 소스 출처, 업로드 계획을 미리 보려면 먼저 `--dry-run`을 사용하세요.

코드 플러그인은 `openclaw.compat.pluginApi` 및 `openclaw.build.openclawVersion`을 포함해 `package.json`에 OpenClaw 호환성 메타데이터를 포함해야 합니다.

## 관리하는 스킬 동기화

`sync`는 스킬 폴더를 스캔하고 아직 동기화되지 않은 새 스킬이나 변경된 스킬을 게시합니다.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

로그인한 경우 `sync`는 집계 설치 수를 위해 최소한의 설치 스냅샷도 보낼 수 있습니다. 보고되는 내용과 옵트아웃 방법은 [Telemetry](/ko/clawhub/telemetry)를 참조하세요.

## 설치 전 검사

설치하기 전에 ClawHub 웹 페이지 또는 CLI 세부 정보 명령을 사용해 메타데이터, 소스 링크, 버전, 변경 로그, 스캔 상태를 검사하세요.

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

공개 목록은 최신 스캔 상태를 표시합니다. 검토 과정에서 보류되거나 차단된 릴리스는 해결될 때까지 검색 및 설치 화면에서 숨겨질 수 있습니다.
