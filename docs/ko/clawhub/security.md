---
read_when:
    - ClawHub 보안 문제 보고하기
    - ClawHub 취약점 공개 이해하기
    - ClawHub 플랫폼 문제와 타사 스킬 또는 Plugin 문제 구분하기
sidebarTitle: Security
summary: ClawHub 보안 문제를 보고하는 방법과 취약점이 공개적으로 공개되는 시점.
title: 보안
x-i18n:
    generated_at: "2026-06-28T20:41:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# 보안

ClawHub 보안 문제는 `openclaw/clawhub`의 GitHub Security Advisories를 통해 보고할 수 있습니다.

ClawHub 자체의 취약점에는 GitHub Security Advisories를 사용하세요. 좋은 ClawHub 권고 보고서에는 다음의 버그가 포함됩니다.

- ClawHub 웹사이트, API 또는 CLI
- 레지스트리 게시, 다운로드, 설치 또는 아티팩트 무결성
- 인증, 권한 부여 또는 API 토큰
- 스캔, 검토 또는 보고서 처리

타사 스킬 또는 플러그인 자체 소스 코드의 취약점에는 ClawHub 권고를 사용하지 마세요. ClawHub 목록에 링크된 게시자 또는 소스 저장소에 직접 보고하세요.

## 취약점 공개

ClawHub는 호스팅되는 클라우드 애플리케이션이므로 ClawHub 서비스 취약점은 기본적으로 공개되지 않습니다. 실제 사용자 영향이 있다는 증거가 있거나 사용자가 조치를 취해야 하는 경우 공개됩니다.

실제 사용자 영향의 예로는 확인된 악용, 사용자 데이터 또는 비밀 정보의 노출, 플랫폼 장애로 인해 악성 콘텐츠가 사용자에게 도달한 경우, 또는 사용자가 자격 증명을 교체하거나 로컬 소프트웨어를 업데이트하거나 다른 보호 조치를 취해야 하는 모든 문제가 있습니다.

사용자가 설치한 소프트웨어의 취약점은 공개됩니다. 예를 들어 사용자가 로컬에서 업데이트해야 하는 ClawHub CLI 패키지, 바이너리, 라이브러리 또는 기타 릴리스 아티팩트가 이에 해당합니다.

## 관련 페이지

설치 시점 감사 라벨, 위험 수준, 발견 사항 및 해석에 대해서는 [보안 감사](/ko/clawhub/security-audits)를 참조하세요.

마켓플레이스 보고, 검토 보류, 숨겨진 목록, 차단 및 계정 상태에 대해서는 [검토 및 계정 안전](/ko/clawhub/moderation)을 참조하세요.
