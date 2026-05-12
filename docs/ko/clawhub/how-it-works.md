---
read_when:
    - 목록, 버전, 설치, 게시 및 검수 이해하기
summary: ClawHub 목록, 버전, 설치, 게시, 스캔 및 업데이트의 작동 방식.
x-i18n:
    generated_at: "2026-05-12T04:09:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub 작동 방식

ClawHub는 OpenClaw 스킬과 플러그인을 위한 레지스트리 계층입니다. 사용자가
패키지를 발견할 수 있는 장소, 게시자가 버전을 릴리스할 수 있는 장소, 그리고
OpenClaw가 해당 패키지를 안전하게 설치하고 업데이트하는 데 필요한 충분한 메타데이터를 제공합니다.

## 레지스트리 레코드

각 공개 목록은 다음을 포함하는 레지스트리 레코드입니다.

- 소유자와 슬러그 또는 패키지 이름
- 하나 이상의 게시된 버전
- 메타데이터, 요약, 파일, 소스 출처 표시
- `latest` 같은 변경 로그 및 태그 정보
- 다운로드, 설치, 별표, 댓글 신호
- 보안 스캔 및 조정 상태

목록 페이지는 사용자가 스킬이나 플러그인이 설치 전에 무엇을 한다고 주장하는지
검토할 수 있는 표준 위치입니다.

## Skills

스킬은 `SKILL.md`를 중심으로 한 버전 관리 텍스트 번들입니다. 지원 파일,
예제, 템플릿, 스크립트를 포함할 수 있습니다.

ClawHub는 `SKILL.md` 프런트매터를 읽어 스킬 이름, 설명, 요구 사항, 환경 변수,
메타데이터를 이해합니다. 정확한 메타데이터는 사용자가 스킬 설치 여부를
결정하는 데 도움이 되고, 자동화된 스캔이 선언된 동작과 관찰된 동작 사이의
불일치를 감지하는 데 도움이 되므로 중요합니다.

[스킬 형식](/ko/clawhub/skill-format)을 참고하세요.

## 플러그인

플러그인은 패키징된 OpenClaw 확장입니다. ClawHub는 패키지 메타데이터,
호환성 정보, 소스 링크, 아티팩트, 버전 레코드를 저장합니다.

OpenClaw가 ClawHub에서 플러그인을 설치할 때, 설치 전에 공지된 호환성
메타데이터를 확인합니다. 패키지 레코드에는 API 호환성, 최소 Gateway 버전,
호스트 대상, 환경 요구 사항, 아티팩트 다이제스트가 포함될 수 있습니다.

레지스트리를 신뢰 원천으로 사용하려는 경우 명시적인 ClawHub 설치 소스를 사용하세요.

```bash
openclaw plugins install clawhub:<package>
```

## 게시

게시하면 새로운 불변 버전 레코드가 생성됩니다. 게시자는 인증된 레지스트리
워크플로에 `clawhub` CLI를 사용합니다.

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

업로드 전에 해석된 페이로드를 미리 보려면 드라이 런을 사용하세요. 그런 다음
공개 페이지에 게시된 메타데이터, 파일, 소스 출처 표시, 스캔 상태가 표시됩니다.

## 설치 및 업데이트

OpenClaw 설치 명령은 ClawHub를 패키지 소스로 사용합니다.

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw는 설치 소스 메타데이터를 기록하므로 나중에 업데이트가 동일한
레지스트리 패키지를 해석할 수 있습니다. ClawHub CLI는 전체 OpenClaw 작업공간
외부에서 레지스트리 관리 스킬 폴더를 원하는 사용자를 위해 직접 스킬 설치 및
업데이트 워크플로도 지원합니다.

## 보안 상태

ClawHub는 게시에 열려 있지만, 릴리스에는 여전히 업로드 게이트, 자동화된 검사,
사용자 신고, 중재자 조치가 적용됩니다.

공개 페이지에는 가능한 경우 스캔 요약이 표시됩니다. 보류, 숨김 또는 차단된
콘텐츠는 진단을 위해 소유자에게는 계속 표시되더라도 공개 검색 및 설치 흐름에서
사라질 수 있습니다.

[보안 + 조정](/ko/clawhub/security) 및
[허용되는 사용](/ko/clawhub/acceptable-usage)을 참고하세요.

## API 접근

ClawHub는 발견, 검색, 패키지 세부 정보, 다운로드를 위한 공개 읽기 API를
노출합니다. 서드파티 카탈로그는 표준 ClawHub 목록으로 다시 연결하고, 속도
제한을 준수하며, 보증을 암시하지 않는 경우 이러한 API를 사용할 수 있습니다.

[공개 API](/ko/clawhub/api) 및 [HTTP API](/ko/clawhub/http-api)를 참고하세요.
