---
read_when:
    - ClawHub CLI 또는 OpenClaw 레지스트리 명령이 실패함
    - 패키지를 설치, 게시 또는 업데이트할 수 없음
summary: ClawHub 로그인, 설치, 게시, 업데이트 및 API 문제 해결.
x-i18n:
    generated_at: "2026-07-12T00:37:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# 문제 해결

## `clawhub login`이 브라우저를 열지만 완료되지 않음

CLI는 브라우저 로그인 중에 수명이 짧은 로컬 콜백 서버를 시작합니다.

- 브라우저에서 `http://127.0.0.1:<port>/callback`에 접근할 수 있는지 확인하세요.
- 콜백이 도착하지 않으면 로컬 방화벽, VPN 및 프록시 규칙을 확인하세요.
- 헤드리스 환경에서는 ClawHub 웹 UI에서 API 토큰을 생성하고 다음을 실행하세요.

```bash
clawhub login --token clh_...
```

## `whoami` 또는 `publish`가 `Unauthorized`(401)를 반환함

- `clawhub login`으로 다시 로그인하세요.
- 사용자 지정 구성 경로를 사용하는 경우 `CLAWHUB_CONFIG_PATH`가 현재 토큰이
  포함된 파일을 가리키는지 확인하세요.
- API 토큰을 사용하는 경우 웹 UI에서 해당 토큰이 취소되지 않았는지 확인하세요.

## 검색 또는 설치가 `Rate limit exceeded`(429)를 반환함

응답의 재시도 정보를 확인하세요.

- `Retry-After`: 재시도하기 전에 기다려야 하는 시간(초)입니다.
- `RateLimit-Limit`: 이 요청에 적용된 한도입니다.
- `RateLimit-Remaining`: 헤더가 있는 경우 정확한 잔여 할당량입니다. `429`에서는 `0`입니다.
- `RateLimit-Reset` 또는 `X-RateLimit-Reset`: 한도 초기화 시점입니다.

여러 사용자가 하나의 외부 통신 IP를 공유하면 각 사용자가 요청을 몇 번만
보내더라도 익명 IP 한도에 도달할 수 있습니다. 가능하면 로그인하고 안내된
대기 시간이 지난 후 다시 시도하세요.

## 프록시 환경에서 검색 또는 설치가 실패함

CLI는 표준 프록시 변수를 따릅니다.

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

지원되는 이름에는 `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy`,
`http_proxy`가 있습니다.

## 검색 결과에 skill이 표시되지 않음

- 정확한 슬러그 또는 소유자 페이지를 알고 있다면 확인하세요.
- 릴리스가 공개 상태이며 검사 또는 조정으로 보류되지 않았는지 확인하세요.
- skill의 소유자라면 로그인한 후 다음 명령으로 확인하세요.

```bash
clawhub inspect @openclaw/demo
```

소유자에게 표시되는 진단 정보에서 검사, 업로드 게이트 또는 조정 상태에 관한
설명을 확인할 수 있습니다.

## 필수 메타데이터 누락으로 게시에 실패함

skill의 경우 `SKILL.md` frontmatter를 확인하세요. 사용자와 스캐너가 패키지를
이해할 수 있도록 필수 환경 변수와 도구를 선언해야 합니다.

Plugin의 경우 `package.json` 호환성 메타데이터를 확인하세요. 코드 Plugin을
게시하려면 `openclaw.compat.pluginApi` 및 `openclaw.build.openclawVersion`과
같은 OpenClaw 호환성 필드가 필요합니다.

먼저 게시 페이로드를 미리 확인하세요.

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 소유자 또는 소스 오류로 게시에 실패함

ClawHub는 GitHub ID 및 소스 출처 정보를 사용하여 패키지를 게시자와
연결합니다.

- 패키지를 소유하거나 게시할 수 있는 GitHub 계정으로 로그인했는지
  확인하세요.
- 소스 URL이 공개되어 있거나 ClawHub에서 접근할 수 있는지 확인하세요.
- GitHub 소스에는 `owner/repo`, `owner/repo@ref` 또는 전체 GitHub URL을 사용하세요.

## 네임스페이스가 이미 사용 중이거나 예약되어 있어 게시에 실패함

소유자 핸들, 조직 네임스페이스, 패키지 범위, skill 슬러그 또는 패키지 이름이
이미 사용 중이거나 예약되어 있어 게시에 실패한 경우 먼저 해당 네임스페이스와
일치하는 소유자로 게시하고 있는지 확인하세요. Plugin 패키지의 경우
`@example-org/example-plugin`과 같은 범위 지정 이름은 일치하는 `example-org`
소유자로 게시해야 합니다.

조직, 프로젝트 또는 브랜드가 해당 네임스페이스의 정당한 소유자라고 생각하지만
현재 ClawHub 소유자를 관리할 수 없다면 공개해도 안전한 민감하지 않은 증빙 자료와
함께 [조직/네임스페이스 소유권 주장 이슈](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)를
등록하세요. 증빙 자료 안내와 공개 이슈에 포함하면 안 되는 정보는
[조직 및 네임스페이스 소유권 주장](/clawhub/namespace-claims)을 참조하세요.

## `sync`에서 skill을 찾지 못했다고 표시됨

`sync`는 `SKILL.md` 또는 `skill.md`가 포함된 폴더를 찾습니다.

검사할 루트 경로를 지정하세요.

```bash
clawhub sync --root /path/to/skills
```

게시될 항목이 확실하지 않다면 먼저 미리 확인하세요.

```bash
clawhub sync --all --dry-run --no-input
```

## 로컬 변경 사항 때문에 `update`가 거부됨

로컬 파일이 ClawHub에 등록된 어떤 버전과도 일치하지 않습니다. 다음 중 하나를
선택하세요.

- 로컬 편집 내용을 유지하고 업데이트를 건너뜁니다.
- 게시된 버전으로 덮어씁니다.

```bash
clawhub update @openclaw/demo --force
```

- 편집한 복사본을 새 슬러그 또는 포크로 게시합니다.

## OpenClaw에서 Plugin 설치에 실패함

- 명시적인 ClawHub 소스를 사용하세요.

```bash
openclaw plugins install clawhub:<package>
```

- 패키지 상세 페이지에서 검사 상태와 호환성 메타데이터를 확인하세요.
- 사용 중인 OpenClaw 버전이 패키지에 명시된 호환성 범위를 충족하는지
  확인하세요.
- 패키지가 숨김, 보류 또는 차단 상태라면 소유자가 문제를 해결할 때까지 설치하지
  못할 수 있습니다.

## 공개 API 요청이 실패함

- `429` 재시도 헤더를 준수하고 공개 목록 및 검색 응답을 캐시하세요.
- 사용자를 ClawHub의 공식 목록으로 다시 연결하세요.
- 숨김, 비공개, 보류 또는 조정에 의해 차단된 콘텐츠를 공개 API 범위 외부에
  미러링하지 마세요.

엔드포인트 세부 정보는 [HTTP API](/clawhub/http-api)를 참조하세요.
