---
read_when:
    - ClawHub CLI 또는 OpenClaw 레지스트리 명령 실패
    - 패키지를 설치, 게시 또는 업데이트할 수 없음
summary: ClawHub 로그인, 설치, 게시, 업데이트, API 문제 해결.
x-i18n:
    generated_at: "2026-07-03T17:17:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# 문제 해결

## `clawhub login`이 브라우저를 열지만 완료되지 않음

CLI는 브라우저 로그인 중에 수명이 짧은 로컬 콜백 서버를 시작합니다.

- 브라우저가 `http://127.0.0.1:<port>/callback`에 접근할 수 있는지 확인하세요.
- 콜백이 전혀 도착하지 않으면 로컬 방화벽, VPN, 프록시 규칙을 확인하세요.
- 헤드리스 환경에서는 ClawHub 웹 UI에서 API 토큰을 만들고 다음을 실행하세요.

```bash
clawhub login --token clh_...
```

## `whoami` 또는 `publish`가 `Unauthorized`(401)를 반환함

- `clawhub login`으로 다시 로그인하세요.
- 사용자 지정 구성 경로를 사용하는 경우 `CLAWHUB_CONFIG_PATH`가 현재 토큰이 들어 있는
  파일을 가리키는지 확인하세요.
- API 토큰을 사용하는 경우 웹 UI에서 철회되지 않았는지 확인하세요.

## 검색 또는 설치가 `Rate limit exceeded`(429)를 반환함

응답의 재시도 정보를 읽으세요.

- `Retry-After`: 다시 시도하기 전에 기다릴 초 단위 시간입니다.
- `RateLimit-Limit`: 이 요청에 적용된 제한입니다.
- `RateLimit-Remaining`: 헤더가 있을 때 남은 정확한 한도입니다. `429`에서는 `0`입니다.
- `RateLimit-Reset` 또는 `X-RateLimit-Reset`: 재설정 시점입니다.

많은 사용자가 하나의 송신 IP를 공유하면 각 사람이 몇 개의 요청만 보내더라도
익명 IP 제한에 걸릴 수 있습니다. 가능하면 로그인하고 보고된 지연 시간 후에
다시 시도하세요.

## 검색 또는 설치가 프록시 뒤에서 실패함

CLI는 표준 프록시 변수를 준수합니다.

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

지원되는 이름에는 `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy`, `http_proxy`가
포함됩니다.

## Skills가 검색에 나타나지 않음

- 정확한 슬러그 또는 소유자 페이지를 알고 있다면 확인하세요.
- 릴리스가 공개되어 있고 스캔 또는 검토로 보류되지 않았는지 확인하세요.
- 해당 Skills의 소유자라면 로그인한 뒤 검사하세요.

```bash
clawhub inspect @openclaw/demo
```

소유자에게 보이는 진단 정보가 스캔, 업로드 게이트 또는 검토 상태를 설명할 수 있습니다.

## 필수 메타데이터가 없어 게시가 실패함

Skills의 경우 `SKILL.md` frontmatter를 확인하세요. 필수 환경 변수와
도구를 선언해야 사용자와 스캐너가 패키지를 이해할 수 있습니다.

Plugin의 경우 `package.json` 호환성 메타데이터를 확인하세요. Code-plugin 게시에는
`openclaw.compat.pluginApi` 및 `openclaw.build.openclawVersion` 같은
OpenClaw 호환성 필드가 필요합니다.

먼저 게시 페이로드를 미리 확인하세요.

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 소유자 또는 소스 오류로 게시가 실패함

ClawHub는 GitHub ID와 소스 출처 표시를 사용해 패키지와 게시자를 연결합니다.

- 패키지를 소유하거나 게시할 수 있는 GitHub 계정으로 로그인했는지 확인하세요.
- 소스 URL이 공개되어 있거나 ClawHub에서 접근할 수 있는지 확인하세요.
- GitHub 소스의 경우 `owner/repo`, `owner/repo@ref` 또는 전체 GitHub URL을 사용하세요.

## 네임스페이스가 이미 청구되었거나 예약되어 게시가 실패함

소유자 핸들, 조직 네임스페이스, 패키지 범위, Skills 슬러그 또는 패키지 이름이
이미 청구되었거나 예약되어 게시가 실패하는 경우, 먼저 해당 네임스페이스와 일치하는
소유자로 게시하고 있는지 확인하세요. Plugin 패키지의 경우
`@example-org/example-plugin` 같은 범위 지정 이름은 일치하는
`example-org` 소유자로 게시해야 합니다.

조직, 프로젝트 또는 브랜드가 해당 네임스페이스의 정당한 소유자라고 생각하지만
현재 ClawHub 소유자를 관리할 수 없다면 공개 가능하고 민감하지 않은 증거와 함께
[조직 / 네임스페이스 청구 이슈](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)를
여세요. 증거 안내와 공개 이슈에 포함하지 말아야 할 내용은
[조직 및 네임스페이스 청구](/clawhub/namespace-claims)를 참조하세요.

## `sync`에서 Skills를 찾지 못했다고 표시함

`sync`는 `SKILL.md` 또는 `skill.md`가 들어 있는 폴더를 찾습니다.

스캔하려는 루트를 지정하세요.

```bash
clawhub sync --root /path/to/skills
```

무엇이 게시될지 확실하지 않다면 먼저 미리 확인하세요.

```bash
clawhub sync --all --dry-run --no-input
```

## 로컬 변경 사항 때문에 `update`가 거부됨

로컬 파일이 ClawHub가 알고 있는 어떤 버전과도 일치하지 않습니다. 다음 중 하나를 선택하세요.

- 로컬 편집 내용을 유지하고 업데이트를 건너뜁니다.
- 게시된 버전으로 덮어씁니다.

```bash
clawhub update @openclaw/demo --force
```

- 편집한 사본을 새 슬러그 또는 포크로 게시합니다.

## OpenClaw에서 Plugin 설치가 실패함

- 명시적인 ClawHub 소스를 사용하세요.

```bash
openclaw plugins install clawhub:<package>
```

- 패키지 상세 페이지에서 스캔 상태와 호환성 메타데이터를 확인하세요.
- OpenClaw 버전이 패키지에 표시된 호환성 범위를 충족하는지 확인하세요.
- 패키지가 숨김, 보류 또는 차단 상태라면 소유자가 문제를 해결할 때까지
  설치할 수 없을 수 있습니다.

## 공개 API 요청이 실패함

- `429` 재시도 헤더를 준수하고 공개 목록/검색 응답을 캐시하세요.
- 사용자를 표준 ClawHub 목록으로 다시 연결하세요.
- 숨김, 비공개, 보류 또는 검토로 차단된 콘텐츠를 공개 API 표면 밖에
  미러링하지 마세요.

엔드포인트 세부 정보는 [HTTP API](/clawhub/http-api)를 참조하세요.
