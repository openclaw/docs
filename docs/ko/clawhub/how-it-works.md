---
read_when:
    - 목록, 버전, 설치, 게시 및 검토 이해하기
summary: ClawHub 등록 항목, 버전, 설치, 게시, 스캔 및 업데이트가 작동하는 방식.
x-i18n:
    generated_at: "2026-07-01T05:31:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 작동 방식

ClawHub는 OpenClaw Skills와 Plugin을 위한 레지스트리 계층입니다. 사용자가
패키지를 발견할 수 있는 장소를 제공하고, 게시자가 버전을 릴리스할 수 있는
장소를 제공하며, OpenClaw가 해당 패키지를 안전하게 설치하고 업데이트하는 데
충분한 메타데이터를 제공합니다.

## 레지스트리 레코드

각 공개 목록은 다음을 포함하는 레지스트리 레코드입니다.

- 소유자와 슬러그 또는 패키지 이름
- 하나 이상의 게시된 버전
- 메타데이터, 요약, 파일, 소스 출처
- `latest`와 같은 변경 로그 및 태그 정보
- 다운로드, 설치, 스타 신호
- 보안 스캔 및 모더레이션 상태

목록 페이지는 사용자가 설치하기 전에 Skills 또는
Plugin이 수행한다고 주장하는 내용을 확인하는 표준 장소입니다.

## Skills

Skills는 `SKILL.md`를 중심으로 하는 버전 관리되는 텍스트 번들입니다. 여기에는
지원 파일, 예제, 템플릿, 스크립트가 포함될 수 있습니다.

ClawHub는 `SKILL.md` 프런트매터를 읽어 Skills 이름,
설명, 요구 사항, 환경 변수, 메타데이터를 이해합니다. 정확한
메타데이터는 사용자가 Skills를 설치할지 결정하는 데 도움이 되고
자동화된 스캔이 선언된 동작과 관찰된 동작 간의 불일치를 감지하는 데 도움이 되므로 중요합니다.

[Skills 형식](/ko/clawhub/skill-format)을 참조하세요.

## Plugin

Plugin은 패키징된 OpenClaw 확장입니다. ClawHub는 패키지 메타데이터,
호환성 정보, 소스 링크, 아티팩트, 버전 레코드를 저장합니다.

OpenClaw가 ClawHub에서 Plugin을 설치할 때, 설치하기 전에 공지된 호환성
메타데이터를 확인합니다. 패키지 레코드에는 API 호환성,
최소 Gateway 버전, 호스트 대상, 환경 요구 사항, 아티팩트
다이제스트가 포함될 수 있습니다.

레지스트리를 신뢰할 수 있는 원본으로 사용하려면 명시적 ClawHub 설치 소스를 사용하세요.

```bash
openclaw plugins install clawhub:<package>
```

## 게시

게시는 새로운 변경 불가능한 버전 레코드를 생성합니다. 게시자는 인증된 레지스트리 워크플로에 `clawhub`
CLI를 사용합니다.

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

업로드 전에 확인된 페이로드를 미리 보려면 드라이런을 사용하세요. 그러면 공개 페이지에
게시된 메타데이터, 파일, 소스 출처, 스캔 상태가 표시됩니다.

## 설치 및 업데이트

OpenClaw 설치 명령은 ClawHub를 패키지 소스로 사용합니다.

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw는 나중에 업데이트가 동일한
레지스트리 패키지를 확인할 수 있도록 설치 소스 메타데이터를 기록합니다. ClawHub CLI는 또한 전체 OpenClaw 작업 공간 외부에서 레지스트리가 관리하는 Skills 폴더를 원하는 사용자를 위해 직접 Skills 설치 및
업데이트 워크플로를 지원합니다.

## 보안 상태

ClawHub는 게시에 열려 있지만, 릴리스에는 여전히 업로드 게이트,
자동 검사, 사용자 신고, 모더레이터 조치가 적용됩니다.

공개 페이지에는 사용 가능한 경우 스캔 요약이 표시됩니다. 보류, 숨김,
또는 차단된 콘텐츠는 진단을 위해 소유자에게 계속 표시되는 동안
공개 검색 및 설치 흐름에서 사라질 수 있습니다.

[보안](/clawhub/security), [보안 감사](/clawhub/security-audits),
[모더레이션 및 계정 안전](/ko/clawhub/moderation), 그리고
[허용되는 사용](/clawhub/acceptable-usage)을 참조하세요.

## API 접근

ClawHub는 탐색, 검색, 패키지 세부 정보, 다운로드를 위한 공개 읽기 API를 제공합니다. 타사 카탈로그는
표준 ClawHub 목록으로 다시 링크하고, 속도 제한을 준수하며, 보증을 암시하지 않는 경우 이러한 API를 사용할 수 있습니다.

[공개 API](/clawhub/api) 및 [HTTP API](/clawhub/http-api)를 참조하세요.
