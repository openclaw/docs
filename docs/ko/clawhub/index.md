---
read_when:
    - ClawHub가 무엇인지 설명하기
    - Skills 또는 Plugin 검색, 설치 또는 업데이트
    - Skills 또는 Plugin을 레지스트리에 게시하기
    - openclaw와 clawhub CLI 흐름 중 선택하기
sidebarTitle: ClawHub
summary: 탐색, 설치, 게시, 보안 및 clawhub CLI를 다루는 공개 ClawHub 개요입니다.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T15:42:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub는 OpenClaw Skills 및 plugins를 위한 공개 레지스트리입니다.

- 네이티브 `openclaw` 명령을 사용해 Skills를 검색, 설치, 업데이트하고 ClawHub에서 plugins를 설치합니다.
- 레지스트리 인증, 게시, 삭제/삭제 취소, 동기화 워크플로에는 별도의 `clawhub` CLI를 사용합니다.

사이트: [clawhub.ai](https://clawhub.ai)

## 빠른 시작

OpenClaw로 Skills를 검색하고 설치합니다.

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

OpenClaw로 plugins를 검색하고 설치합니다.

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

게시, 동기화, 삭제/삭제 취소 같은 레지스트리 인증 워크플로가 필요할 때
ClawHub CLI를 설치합니다.

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub가 호스팅하는 항목

| 표면           | 저장하는 내용                                                | 일반적인 명령                               |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md`와 지원 파일을 포함한 버전 관리 텍스트 번들        | `openclaw skills install <slug>`             |
| 코드 plugins   | 호환성 메타데이터가 포함된 OpenClaw plugin 패키지            | `openclaw plugins install clawhub:<package>` |
| 번들 plugins   | OpenClaw 배포용으로 패키징된 plugin 번들                     | `clawhub package publish <source>`           |
| Souls          | onlycrabs.ai에 표시되는 `SOUL.md` 번들                       | 웹 및 API 게시 플로                         |

ClawHub는 semver 버전, `latest` 같은 태그, 변경 로그, 파일,
다운로드, 별표, 보안 스캔 요약을 추적합니다. 공개 페이지는 현재 레지스트리
상태를 표시하므로 사용자가 설치 전에 Skills나 plugin을 검토할 수 있습니다.

## 네이티브 OpenClaw 플로

네이티브 OpenClaw 명령은 활성 OpenClaw 작업 공간에 설치하고 소스
메타데이터를 유지하므로 이후 업데이트 명령도 ClawHub에 머무를 수 있습니다.

plugin 설치가 ClawHub를 통해 해석되어야 할 때 `clawhub:<package>`를 사용합니다.
단순한 npm-safe plugin 명세는 출시 전환 중 npm을 통해 해석될 수 있으며,
소스를 명시해야 할 때는 `npm:<package>`가 npm 전용으로 유지됩니다.

plugin 설치는 아카이브 설치를 실행하기 전에 공지된 `pluginApi` 및
`minGatewayVersion` 호환성을 검증합니다. 패키지 버전이 ClawPack 아티팩트를
게시하면 OpenClaw는 업로드된 정확한 npm-pack `.tgz`를 우선 사용하고,
ClawHub 다이제스트 헤더와 다운로드된 바이트를 검증한 뒤 이후 업데이트를 위해
아티팩트 메타데이터를 기록합니다.

## ClawHub CLI

ClawHub CLI는 레지스트리 인증 작업에 사용합니다.

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

CLI에는 직접 레지스트리 워크플로를 위한 Skills 설치/업데이트 명령도 있습니다.

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

이 명령은 현재 작업 디렉터리 아래의 `./skills`에 Skills를 설치하고
설치된 버전을 `.clawhub/lock.json`에 기록합니다.

## 게시

`SKILL.md`가 포함된 로컬 폴더에서 Skills를 게시합니다.

```bash
clawhub skill publish <path>
```

일반적인 게시 옵션:

- `--slug <slug>`: Skills 슬러그.
- `--name <name>`: 표시 이름.
- `--version <version>`: semver 버전.
- `--changelog <text>`: 변경 로그 텍스트.
- `--tags <tags>`: 쉼표로 구분된 태그이며 기본값은 `latest`입니다.

로컬 폴더, `owner/repo`, `owner/repo@ref`, 또는 GitHub
URL에서 plugins를 게시합니다.

```bash
clawhub package publish <source>
```

업로드 없이 정확한 게시 계획을 빌드하려면 `--dry-run`을 사용하고, CI 친화적인
출력에는 `--json`을 사용합니다.

코드 plugins는 `package.json`에 필수 OpenClaw 호환성 메타데이터를 포함해야 하며,
여기에는 `openclaw.compat.pluginApi` 및
`openclaw.build.openclawVersion`이 포함됩니다. 전체 명령 참조는 [CLI](/ko/clawhub/cli)를,
Skills 메타데이터는 [Skills 형식](/ko/clawhub/skill-format)을 참조하세요.

## 보안 및 조정

ClawHub는 기본적으로 열려 있습니다. 누구나 업로드할 수 있지만, 게시하려면 업로드
게이트를 통과할 만큼 오래된 GitHub 계정이 필요합니다. 공개 상세 페이지는 설치 또는
다운로드 전에 최신 스캔 상태를 요약합니다.

ClawHub는 게시된 Skills 및 plugin 릴리스에 대해 자동 검사를 실행합니다. 스캔 보류
또는 차단된 릴리스는 공개 카탈로그와 설치 표면에서 사라질 수 있지만, 소유자에게는
`/dashboard`에서 계속 표시됩니다.

로그인한 사용자는 Skills와 패키지를 신고할 수 있습니다. 운영자는 신고를 검토하고,
콘텐츠를 숨기거나 복원하며, 악성 계정을 차단할 수 있습니다. 정책 및 집행 세부 정보는
[허용되는 사용](/ko/clawhub/acceptable-usage) 및
[보안 + 조정](/ko/clawhub/security)을 참조하세요.

## Telemetry 및 환경

로그인한 상태에서 `clawhub sync`를 실행하면 CLI는 ClawHub가 설치 수를 계산할 수 있도록
최소한의 스냅샷을 전송합니다. 다음으로 비활성화할 수 있습니다.

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

유용한 환경 재정의:

| 변수                          | 효과                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | 브라우저 로그인에 사용되는 사이트 URL을 재정의합니다. |
| `CLAWHUB_REGISTRY`            | 레지스트리 API URL을 재정의합니다.               |
| `CLAWHUB_CONFIG_PATH`         | CLI가 토큰/구성 상태를 저장하는 위치를 재정의합니다. |
| `CLAWHUB_WORKDIR`             | 기본 작업 디렉터리를 재정의합니다.               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync`에서 Telemetry를 비활성화합니다.            |

더 자세한 참조 자료는 [Telemetry](/ko/clawhub/telemetry), [HTTP API](/ko/clawhub/http-api), 및
[문제 해결](/ko/clawhub/troubleshooting)을 참조하세요.
