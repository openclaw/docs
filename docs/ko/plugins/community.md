---
doc-schema-version: 1
read_when:
    - 타사 OpenClaw Plugin을 찾고 싶습니다
    - ClawHub에 자체 플러그인을 게시하거나 등록하려는 경우
summary: 커뮤니티에서 유지 관리하는 OpenClaw 플러그인을 찾아 게시합니다
title: 커뮤니티 Plugin
x-i18n:
    generated_at: "2026-07-12T15:29:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

커뮤니티 Plugin은 채널, 도구, 제공자, 훅 또는 기타 기능으로 OpenClaw를 확장하는
서드파티 패키지입니다. 공개 커뮤니티 Plugin을 찾는 기본 경로로
[ClawHub](/ko/clawhub)를 사용하십시오.

## Plugin 찾기

CLI에서 ClawHub를 검색합니다.

```bash
openclaw plugins search "calendar"
```

명시적인 소스 접두사를 사용하여 ClawHub Plugin을 설치합니다.

```bash
openclaw plugins install clawhub:<package-name>
```

출시 전환 기간에는 npm을 통한 직접 설치 경로도 계속 지원됩니다.

```bash
openclaw plugins install npm:<package-name>
```

일반적인 설치, 업데이트, 검사 및 제거 예시는 [Plugin 관리](/ko/plugins/manage-plugins)를
참조하십시오. 전체 명령어 레퍼런스와 소스 선택 규칙은
[`openclaw plugins`](/ko/cli/plugins)를 참조하십시오.

## Plugin 게시하기

OpenClaw 사용자가 공개 커뮤니티 Plugin을 검색하고 설치할 수 있도록 ClawHub에
게시하십시오. ClawHub는 실시간 패키지 목록, 릴리스 기록, 검사 상태 및 설치 안내를
관리하며, 문서에서는 정적인 서드파티 Plugin 카탈로그를 유지하지 않습니다.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

게시하기 전에 Plugin에 패키지 메타데이터, Plugin 매니페스트, 설정 문서 및 명확한
유지관리 책임자가 있는지 확인하십시오. ClawHub는 릴리스를 생성하기 전에 소유자
범위, 패키지 이름, 버전, 파일 제한 및 소스 메타데이터를 검증한 다음, 검토와 검증이
완료될 때까지 새 릴리스를 일반 설치 및 다운로드 화면에서 숨깁니다.

게시 전 체크리스트:

| 요구 사항          | 이유                                                 |
| -------------------- | --------------------------------------------------- |
| ClawHub에 게시됨 | 사용자가 `openclaw plugins install` 안내를 이용할 수 있어야 합니다 |
| 공개 GitHub 저장소   | 소스 검토, 이슈 추적, 투명성         |
| 설정 및 사용 문서 | 사용자가 구성 방법을 알아야 합니다              |
| 활발한 유지관리   | 최근 업데이트 또는 신속한 이슈 처리         |

전체 게시 계약:

- [ClawHub 게시](/ko/clawhub/publishing) - 소유자, 범위, 릴리스,
  검토, 패키지 검증 및 패키지 이전
- [Plugin 빌드](/ko/plugins/building-plugins) - Plugin 패키지 구조
  및 최초 게시 워크플로
- [Plugin 매니페스트](/ko/plugins/manifest) - 네이티브 Plugin 매니페스트 필드

## 관련 문서

- [Plugin](/ko/tools/plugin) - 설치, 구성, 재시작 및 문제 해결
- [Plugin 관리](/ko/plugins/manage-plugins) - 명령어 예시
- [ClawHub 게시](/ko/clawhub/publishing) - 게시 및 릴리스 규칙
