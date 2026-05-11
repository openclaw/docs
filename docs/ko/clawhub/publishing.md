---
read_when:
    - 스킬 또는 Plugin 게시하기
    - 소유자 또는 패키지 범위 오류 디버깅
    - 게시 UI, CLI 또는 백엔드 동작 추가
summary: Skills, Plugin, 소유자, 범위, 릴리스 및 검토를 위한 ClawHub 게시 작동 방식.
x-i18n:
    generated_at: "2026-05-11T20:24:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566c37b7845159ad100837e34bed7c60411bba6a0b3436ab899fe5e345237727
    source_path: clawhub/publishing.md
    workflow: 16
---

# 게시

ClawHub 게시는 소유자 범위입니다. 모든 게시는 게시자를 대상으로 하며,
서버가 로그인한 사용자에게 해당 위치에 게시할 권한이 있는지 결정합니다.

## 소유자

소유자는 `@alice` 또는 `@openclaw` 같은 ClawHub 게시자 핸들입니다.
개인 소유자는 사용자용으로 생성됩니다. 조직 소유자는 여러 멤버를 가질 수 있습니다.

게시할 때는 개인 소유자를 사용하거나 게시자 접근 권한이 있는 조직 소유자를 선택합니다.

## Skills

Skills는 스킬 폴더에서 게시됩니다. 공개 페이지는 다음과 같습니다.

```text
https://clawhub.ai/<owner>/<slug>
```

예:

```text
https://clawhub.ai/alice/review-helper
```

게시 요청에는 선택한 소유자, 슬러그, 버전, 변경 로그, 파일이 포함됩니다.
서버는 릴리스를 생성하기 전에 행위자가 해당 소유자로 게시할 수 있는지 확인합니다.

새 버전을 게시하면서 기존 스킬을 다른 소유자로 이동하려면 새 소유자를 선택하고
소유권 이동을 명시적으로 확인하세요. CLI/API에서는 대상 소유자와 마이그레이션 동의를 전달합니다.

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

스킬 소유자 마이그레이션에는 현재 소유자와 대상 소유자 양쪽에 대한 관리자 또는 소유자 접근 권한이 필요합니다.
이 작업은 스킬, 버전 기록, 통계, 댓글, 포크, 별칭, 감사 추적을 보존하며,
이전 소유자 URL은 별칭/리디렉션 경로를 통해 계속 동작합니다.

## Plugins

Plugins는 npm 스타일 패키지 이름을 사용합니다. 범위가 있는 패키지 이름은
이름의 첫 부분에 소유자를 포함합니다.

```text
@owner/package-name
```

범위는 선택한 게시 소유자와 일치해야 합니다. 패키지 이름이
`@openclaw/dronzer`라면 `@openclaw`로만 게시할 수 있습니다. `@vintageayu`로 게시하려면
패키지 이름을 `@vintageayu/dronzer`로 바꾸세요.

이렇게 하면 패키지가 게시자가 제어하지 않는 조직 네임스페이스를 주장하지 못합니다.

## 릴리스 흐름

1. UI, CLI 또는 GitHub 워크플로가 패키지 메타데이터와 파일을 수집합니다.
2. 게시 요청이 선택한 소유자와 함께 ClawHub로 전송됩니다.
3. 서버가 소유자 권한, 패키지 범위, 패키지 이름, 버전,
   파일 제한, 소스 메타데이터를 검증합니다.
4. ClawHub가 릴리스를 저장하고 자동 보안 검사를 시작합니다.
5. 새 릴리스는 검토와 확인이 끝날 때까지 일반 설치/다운로드 표면에서 숨겨집니다.

검증이 실패하면 릴리스가 생성되지 않습니다.

## 자주 묻는 질문

### 패키지 범위는 선택한 소유자와 일치해야 합니다

패키지 범위와 선택한 소유자가 일치하지 않으면 ClawHub가
게시를 거부합니다.

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

수정하려면 패키지 범위가 가리키는 소유자를 선택하거나,
게시할 수 있는 소유자와 범위가 일치하도록 패키지 이름을 바꾸세요.

패키지 이름에 이미 올바른 범위가 있지만 패키지가 잘못된 게시자에게 소유되어 있다면,
대신 소유권을 이전하세요.

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

현재 소유자와 대상 게시자 양쪽에 대한 관리자 접근 권한이 있을 때만
패키지 또는 스킬 이전을 사용하세요. 패키지 이전은 관리할 수 없는
범위에 게시할 수 있게 해주지 않습니다.

이는 조직 네임스페이스를 보호합니다. `@openclaw/dronzer`라는 패키지는
`@openclaw` 네임스페이스를 주장하므로, `@openclaw` 소유자에 대한 접근 권한이 있는 게시자만
이를 게시할 수 있습니다.
