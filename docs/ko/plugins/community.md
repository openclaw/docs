---
doc-schema-version: 1
read_when:
    - 서드파티 OpenClaw Plugin을 찾고 싶습니다
    - ClawHub에 자체 Plugin을 게시하거나 등록하려는 경우
summary: 커뮤니티에서 유지 관리하는 OpenClaw plugins 찾기 및 게시하기
title: 커뮤니티 Plugin
x-i18n:
    generated_at: "2026-06-27T17:44:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

커뮤니티 Plugin은 채널, 도구, 제공자, 훅 또는 기타 기능으로 OpenClaw를 확장하는 서드파티 패키지입니다. 공개 커뮤니티 Plugin을 찾는 기본 탐색 표면으로 [ClawHub](/ko/clawhub)를 사용하세요.

## Plugin 찾기

CLI에서 ClawHub를 검색합니다.

```bash
openclaw plugins search "calendar"
```

명시적인 소스 접두사를 사용해 ClawHub Plugin을 설치합니다.

```bash
openclaw plugins install clawhub:<package-name>
```

출시 전환 기간에는 npm도 계속 지원되는 직접 설치 경로입니다.

```bash
openclaw plugins install npm:<package-name>
```

일반적인 설치, 업데이트, 검사, 제거 예시는 [Plugin 관리](/ko/plugins/manage-plugins)를 사용하세요. 전체 명령 참조와 소스 선택 규칙은 [`openclaw plugins`](/ko/cli/plugins)를 사용하세요.

## Plugin 게시

OpenClaw 사용자가 Plugin을 찾아 설치할 수 있게 하려면 공개 커뮤니티 Plugin을 ClawHub에 게시하세요. ClawHub는 실시간 패키지 목록, 릴리스 기록, 스캔 상태, 설치 힌트를 소유하며, 문서는 정적인 서드파티 Plugin 카탈로그를 유지하지 않습니다.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

게시하기 전에 Plugin에 패키지 메타데이터, Plugin 매니페스트, 설정 문서, 명확한 유지관리 소유자가 있는지 확인하세요. ClawHub는 릴리스를 만들기 전에 소유자 범위, 패키지 이름, 버전, 파일 제한, 소스 메타데이터를 검증한 다음, 검토와 확인이 완료될 때까지 새 릴리스를 일반 설치 및 다운로드 표면에서 숨긴 상태로 유지합니다.

게시하기 전에 이 체크리스트를 사용하세요.

| 요구 사항 | 이유 |
| -------------------- | --------------------------------------------------- |
| ClawHub에 게시됨 | 사용자가 `openclaw plugins install` 힌트를 사용할 수 있어야 함 |
| 공개 GitHub 저장소 | 소스 검토, 이슈 추적, 투명성 |
| 설정 및 사용 문서 | 사용자가 구성 방법을 알아야 함 |
| 활발한 유지관리 | 최근 업데이트 또는 신속한 이슈 처리 |

전체 게시 계약은 다음 페이지를 사용하세요.

- [ClawHub 게시](/ko/clawhub/publishing)는 소유자, 범위, 릴리스,
  검토, 패키지 검증, 패키지 이전을 설명합니다.
- [Plugin 빌드](/ko/plugins/building-plugins)는 Plugin 패키지 형태와
  최초 게시 워크플로를 보여줍니다.
- [Plugin 매니페스트](/ko/plugins/manifest)는 네이티브 Plugin 매니페스트 필드를 정의합니다.

## 관련 항목

- [Plugin](/ko/tools/plugin) - 설치, 구성, 재시작, 문제 해결
- [Plugin 관리](/ko/plugins/manage-plugins) - 명령 예시
- [ClawHub 게시](/ko/clawhub/publishing) - 게시 및 릴리스 규칙
