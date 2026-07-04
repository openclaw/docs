---
read_when:
    - ClawHub가 무엇인지 설명하기
    - Skills 또는 Plugin 검색, 설치 또는 업데이트
    - 레지스트리에 Skills 또는 Plugin 게시하기
    - openclaw와 clawhub CLI 흐름 선택하기
sidebarTitle: ClawHub
summary: 검색, 설치, 게시, 보안 및 clawhub CLI를 위한 공개 ClawHub 개요.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T20:28:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub는 OpenClaw Skills와 Plugin을 위한 공개 레지스트리입니다.

- 네이티브 `openclaw` 명령을 사용해 ClawHub에서 Skills를 검색, 설치, 업데이트하고 Plugin을 설치합니다.
- 레지스트리 인증, 게시, 삭제/삭제 취소 워크플로에는 별도의 `clawhub` CLI를 사용합니다.

사이트: [clawhub.ai](https://clawhub.ai)

## 빠른 시작

OpenClaw로 Skills를 검색하고 설치합니다.

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw로 Plugin을 검색하고 설치합니다.

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

게시 또는 삭제/삭제 취소 같은 레지스트리 인증 워크플로가 필요할 때 ClawHub CLI를 설치합니다.

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub에서 호스팅하는 항목

| 표면           | 저장하는 내용                                                  | 일반적인 명령                                |
| -------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Skills         | `SKILL.md`와 지원 파일이 포함된 버전 관리 텍스트 번들          | `openclaw skills install @openclaw/demo`     |
| Code Plugin    | 호환성 메타데이터가 포함된 OpenClaw Plugin 패키지              | `openclaw plugins install clawhub:<package>` |
| Bundle Plugin  | OpenClaw 배포용으로 패키징된 Plugin 번들                       | `clawhub package publish <source>`           |

ClawHub는 semver 버전, `latest` 같은 태그, 변경 로그, 파일, 다운로드 수, 별, 보안 스캔 요약을 추적합니다. 공개 페이지에는 현재 레지스트리 상태가 표시되므로 사용자는 Skills 또는 Plugin을 설치하기 전에 검토할 수 있습니다.

## 네이티브 OpenClaw 흐름

네이티브 OpenClaw 명령은 활성 OpenClaw 작업 영역에 설치하고 소스 메타데이터를 유지하므로 이후 업데이트 명령이 ClawHub를 계속 사용할 수 있습니다.

Plugin 설치가 ClawHub를 통해 확인되어야 할 때는 `clawhub:<package>`를 사용합니다. 베어 npm-safe Plugin 명세는 출시 전환 중 npm을 통해 확인될 수 있으며, 소스를 명시해야 할 때 `npm:<package>`는 npm 전용으로 유지됩니다.

Plugin 설치는 아카이브 설치가 실행되기 전에 광고된 `pluginApi`와 `minGatewayVersion` 호환성을 검증합니다. 패키지 버전이 ClawPack 아티팩트를 게시하면 OpenClaw는 업로드된 정확한 npm-pack `.tgz`를 선호하고, ClawHub 다이제스트 헤더와 다운로드된 바이트를 검증하며, 이후 업데이트를 위해 아티팩트 메타데이터를 기록합니다.

## ClawHub CLI

ClawHub CLI는 레지스트리 인증 작업에 사용됩니다.

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

CLI에는 직접 레지스트리 워크플로를 위한 Skills 설치/업데이트 명령도 있습니다.

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

이 명령은 현재 작업 디렉터리 아래의 `./skills`에 Skills를 설치하고, 설치된 버전을 `.clawhub/lock.json`에 기록합니다.

## 게시

`SKILL.md`가 포함된 로컬 폴더에서 Skills를 게시합니다.

```bash
clawhub skill publish <path>
```

일반적인 게시 옵션:

- `--slug <slug>`: 게시된 Skills URL 이름.
- `--name <name>`: 표시 이름.
- `--version <version>`: semver 버전.
- `--changelog <text>`: 변경 로그 텍스트.
- `--tags <tags>`: 쉼표로 구분된 태그이며 기본값은 `latest`입니다.

로컬 폴더, `owner/repo`, `owner/repo@ref` 또는 GitHub URL에서 Plugin을 게시합니다.

```bash
clawhub package publish <source>
```

업로드하지 않고 정확한 게시 계획을 빌드하려면 `--dry-run`을 사용하고, CI 친화적인 출력에는 `--json`을 사용합니다.

Code Plugin은 `package.json`에 필수 OpenClaw 호환성 메타데이터를 포함해야 하며, 여기에는 `openclaw.compat.pluginApi`와 `openclaw.build.openclawVersion`이 포함됩니다. 전체 명령 참조는 [CLI](/ko/clawhub/cli)를, Skills 메타데이터는 [Skills 형식](/clawhub/skill-format)을 참조하세요.

## 보안 및 조정

ClawHub는 기본적으로 열려 있습니다. 누구나 업로드할 수 있지만, 게시하려면 업로드 게이트를 통과할 만큼 오래된 GitHub 계정이 필요합니다. 공개 상세 페이지는 설치 또는 다운로드 전에 최신 스캔 상태를 요약합니다.

ClawHub는 게시된 Skills와 Plugin 릴리스에 대해 자동 검사를 실행합니다. 스캔 보류 또는 차단된 릴리스는 소유자에게는 `/dashboard`에서 계속 표시되지만 공개 카탈로그와 설치 표면에서는 사라질 수 있습니다.

로그인한 사용자는 Skills와 패키지를 신고할 수 있습니다. 중재자는 신고를 검토하고, 콘텐츠를 숨기거나 복원하며, 악용 계정을 차단할 수 있습니다. 정책 및 집행 세부 정보는 [보안](/ko/clawhub/security), [보안 감사](/clawhub/security-audits), [조정 및 계정 안전](/clawhub/moderation), [허용되는 사용](/ko/clawhub/acceptable-usage)을 참조하세요.

## 텔레메트리 및 환경

로그인한 상태에서 `clawhub install`을 실행하면 CLI가 최선 노력 방식의 설치 이벤트를 보낼 수 있으며, ClawHub는 이를 사용해 집계 설치 수를 계산할 수 있습니다. 비활성화하려면 다음을 사용하세요.

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

유용한 환경 재정의:

| 변수                          | 효과                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 브라우저 로그인에 사용되는 사이트 URL을 재정의합니다. |
| `CLAWHUB_REGISTRY`            | 레지스트리 API URL을 재정의합니다.                |
| `CLAWHUB_CONFIG_PATH`         | CLI가 토큰/구성 상태를 저장하는 위치를 재정의합니다. |
| `CLAWHUB_WORKDIR`             | 기본 작업 디렉터리를 재정의합니다.                |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 설치 텔레메트리를 비활성화합니다.                 |

더 자세한 참조 자료는 [텔레메트리](/clawhub/telemetry), [HTTP API](/clawhub/http-api), [문제 해결](/ko/clawhub/troubleshooting)을 참조하세요.
