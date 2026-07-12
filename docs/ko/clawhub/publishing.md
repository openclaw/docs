---
read_when:
    - Skill 또는 Plugin 게시하기
    - 소유자 또는 패키지 범위 오류 디버깅
    - 게시 UI, CLI 또는 백엔드 동작 추가
summary: Skills, Plugin, 소유자, 스코프, 릴리스 및 검토를 위한 ClawHub 게시 방식.
x-i18n:
    generated_at: "2026-07-12T00:37:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# 게시

게시는 선택한 소유자 명의로 Skills 폴더 또는 Plugin 패키지를 ClawHub에 전송합니다. ClawHub는 토큰에 해당 소유자 명의로 게시할 권한이 있는지 확인하고 메타데이터, 이름, 버전, 파일, 소스 정보를 검증한 다음 릴리스를 저장하고 자동 보안 검사를 시작합니다.

검증에 실패하면 아무것도 게시되지 않습니다. 또한 새 릴리스는 검토가 끝날 때까지 일반 설치 및 다운로드 화면에 표시되지 않을 수 있습니다.

## Skills

가장 간단한 게시 방법은 CLI입니다. 로그인한 다음 로컬 Skills 폴더를 게시합니다.

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

조직 소유자 명의로 게시할 때는 `--owner <handle>`을 사용합니다. 인증된 사용자 명의로 게시하려면 생략합니다. 게시할 때 변경되지 않은 콘텐츠는 건너뜁니다. 새 Skills는 `1.0.0`에서 시작하며, 이후 변경 사항은 다음 패치 버전으로 자동 게시됩니다. 명시적인 버전이 필요한 경우에만 `--version`을 전달합니다.

카탈로그 저장소에는 ClawHub의 재사용 가능한
[`skill-publish.yml` 워크플로](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)를 사용합니다.
이 워크플로는 `root` 바로 아래에 있는 각 Skills 폴더(기본값:
`skills`) 또는 `skill_path`로 제공된 폴더에 대해서만 `skill publish`를 호출합니다.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

게시하지 않고 새 Skills와 변경된 Skills를 미리 보려면 `dry_run: true`를 사용합니다.

## Plugin

Plugin은 npm 스타일 패키지 이름을 사용합니다. 범위가 지정된 패키지 이름은 이름의 첫 부분에 소유자를 포함합니다.

```text
@owner/package-name
```

범위는 선택한 게시 소유자와 일치해야 합니다. 패키지 이름이 `@openclaw/dronzer`이면 `@openclaw` 명의로만 게시할 수 있습니다. `@vintageayu` 명의로 게시하려면 패키지 이름을 `@vintageayu/dronzer`로 변경합니다.

이는 게시자가 관리하지 않는 조직 네임스페이스를 패키지가 점유하는 것을 방지합니다.

ClawHub에서 이미 점유되었거나 예약된 조직, 브랜드, 패키지 범위, 소유자 핸들 또는 네임스페이스의 정당한 소유자라면 공개 가능한 비민감 증빙 자료와 함께
[조직/네임스페이스 소유권 주장 이슈](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)를 개설하세요.
포함할 내용과 공개 이슈에 포함하지 말아야 할 내용은
[조직 및 네임스페이스 소유권 주장](/clawhub/namespace-claims)을 참조하세요.

### Plugin 게시 전 준비 사항

- 패키지 범위와 일치하는 소유자를 선택합니다.
- `openclaw.plugin.json`을 포함합니다. 코드 Plugin에는
  `openclaw.compat.pluginApi`와 `openclaw.build.openclawVersion`이 있는 `package.json`도 필요합니다.
- 사용자 지정 Plugin 카드 아이콘을 표시하려면 임의의 HTTPS 이미지 URL을 값으로 하는 `icon`을 `openclaw.plugin.json`에 추가합니다.
- 소스 저장소와 정확한 커밋 메타데이터를 포함하거나, CLI가 이를 감지할 수 있도록 GitHub 기반 체크아웃에서 CLI를 사용합니다.
- 게시하기 전에 `clawhub package validate <source>`를 실행합니다. 패키지, 매니페스트, SDK 가져오기 또는 아티팩트 관련 문제는
  [Plugin 검증 문제 해결](/clawhub/plugin-validation-fixes)을 참조하세요.
- 릴리스를 생성하기 전에 `clawhub package publish <source> --dry-run`을 실행합니다.
- 자동 보안 검사와 검증이 끝날 때까지 새 릴리스가 공개 설치 화면에 표시되지 않을 수 있습니다.

### 패키지의 신뢰할 수 있는 게시

패키지의 신뢰할 수 있는 게시는 두 단계로 설정합니다.

1. 일반 수동 방식 또는 토큰으로 인증된 `clawhub package publish`를 통해 패키지를 한 번 게시합니다. 그러면 패키지 행이 생성되고 신뢰할 수 있는 게시자 구성을 변경할 수 있는 패키지 관리자가 지정됩니다.
2. 패키지 관리자가 GitHub Actions의 신뢰할 수 있는 게시자 구성을 설정합니다.

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

구성을 설정하면 이후 지원되는 GitHub Actions 게시에서 저장소에 장기 ClawHub 토큰을 저장하지 않고 OIDC/신뢰할 수 있는 게시를 사용할 수 있습니다. 구성된 저장소와 워크플로 파일 이름은 GitHub Actions OIDC 클레임과 일치해야 합니다. `--environment <name>`도 전달하면 GitHub Actions 환경 클레임이 해당 이름과 정확히 일치해야 합니다.

ClawHub는 신뢰할 수 있는 게시자 구성을 설정할 때 구성된 GitHub 저장소를 검증합니다. 공개 저장소는 공개 GitHub 메타데이터를 통해 검증할 수 있습니다. 비공개 저장소의 경우, 향후 ClawHub GitHub App 설치 또는 다른 승인된 GitHub 통합 등을 통해 ClawHub가 해당 저장소에 접근할 수 있어야 합니다.

현재 재사용 가능한 패키지 게시 워크플로는 `id-token: write`를 사용할 수 있는 경우 `workflow_dispatch` 게시에 대해 비밀 정보 없는 신뢰할 수 있는 게시를 지원합니다. 태그 푸시를 통한 실제 게시에는 여전히 `clawhub_token`이 필요하므로 태그 릴리스, 최초 게시, 신뢰할 수 없는 패키지 또는 비상 게시를 위해 `CLAWHUB_TOKEN`을 계속 사용할 수 있도록 유지하세요.

다음 명령으로 구성을 확인하거나 제거합니다.

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

신뢰할 수 있는 게시자 구성을 삭제하는 것이 롤백 방법입니다. 패키지 관리자가 구성을 다시 설정할 때까지 향후 신뢰할 수 있는 게시 토큰 발급이 비활성화됩니다.

## 자주 묻는 질문

### 패키지 범위는 선택한 소유자와 일치해야 함

패키지 범위와 선택한 소유자가 일치하지 않으면 ClawHub가 게시를 거부합니다.

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

이 문제를 해결하려면 패키지 범위에 지정된 소유자를 선택하거나, 게시할 수 있는 소유자와 범위가 일치하도록 패키지 이름을 변경합니다.

패키지 이름의 범위가 이미 올바르지만 패키지 소유자가 잘못된 게시자로 지정되어 있다면 대신 소유권을 이전합니다.

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

현재 소유자와 대상 게시자 모두에 대한 관리자 권한이 있는 경우에만 패키지 또는 Skills 이전을 사용합니다. 패키지를 이전해도 관리할 수 없는 범위에 게시할 수 있는 것은 아닙니다.

현재 소유자에게 접근할 수 없지만 조직, 프로젝트 또는 브랜드가 해당 네임스페이스의 정당한 소유자라고 판단하는 경우, 직원 검토를 위해 공개 가능한 비민감 증빙 자료와 함께
[조직/네임스페이스 소유권 주장 이슈](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)를 개설하세요.
제출하기 전에 [조직 및 네임스페이스 소유권 주장](/clawhub/namespace-claims)을 참조하세요.

이는 조직 네임스페이스를 보호합니다. 이름이 `@openclaw/dronzer`인 패키지는 `@openclaw` 네임스페이스를 점유하므로 `@openclaw` 소유자에 접근할 수 있는 게시자만 게시할 수 있습니다.
