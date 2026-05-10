---
x-i18n:
    generated_at: "2026-05-10T19:20:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# 문서 가이드

이 디렉터리는 문서 작성, Mintlify 링크 규칙, 문서 i18n 정책을 담당합니다.

## Mintlify 규칙

- 문서는 Mintlify(`https://docs.openclaw.ai`)에서 호스팅됩니다.
- `docs/**/*.md`의 내부 문서 링크는 `.md` 또는 `.mdx` 접미사 없이 루트 상대 경로로 유지해야 합니다(예: `[Config](/gateway/configuration)`).
- 섹션 상호 참조는 루트 상대 경로의 앵커를 사용해야 합니다(예: `[Hooks](/gateway/configuration-reference#hooks)`).
- Mintlify 앵커 생성이 해당 문자에서 취약하므로 문서 제목에는 전각 대시와 아포스트로피를 피해야 합니다.
- README 및 기타 GitHub에서 렌더링되는 문서는 Mintlify 외부에서도 링크가 동작하도록 절대 문서 URL을 유지해야 합니다.
- 문서 콘텐츠는 범용적으로 유지해야 합니다. 개인 기기 이름, 호스트명, 로컬 경로를 포함하지 말고 `user@gateway-host` 같은 자리 표시자를 사용하세요.

## 문서 콘텐츠 규칙

- 문서, UI 문구, 선택기 목록에서는 섹션이 런타임 순서나 자동 감지 순서를 명시적으로 설명하지 않는 한 서비스/프로바이더를 알파벳순으로 정렬하세요.
- 번들 Plugin 명명은 루트 `AGENTS.md`의 리포 전체 Plugin 용어 규칙과 일관되게 유지하세요.

## 내부 문서

- 오래 유지되는 비공개 운영자 문서는 `~/Projects/manager/docs/`에 둡니다.
- 리포 로컬 내부 스크래치/미러 문서는 무시되는 `docs/internal/` 아래에 둘 수 있습니다.
- `docs/internal/**` 페이지를 `docs/docs.json` 내비게이션에 추가하거나 공개 문서에서 링크하지 마세요.
- 나중에 페이지가 강제로 추가되더라도 `scripts/docs-sync-publish.mjs`는 공개 `openclaw/docs` 게시 리포에서 `docs/internal/**`을 제외하고 정리합니다.
- 내부 문서는 리포 경로, 비공개 앱 이름, 1Password 항목 이름, 런북을 언급할 수 있지만, 비밀 값은 절대 포함하지 마세요.

## 문서 i18n

- 외국어 문서는 이 리포에서 유지 관리하지 않습니다. 생성된 게시 출력은 별도의 `openclaw/docs` 리포에 있습니다(로컬에서는 종종 `../openclaw-docs`로 클론됨).
- 여기에서 `docs/<locale>/**` 아래의 지역화 문서를 추가하거나 편집하지 마세요.
- 이 리포의 영어 문서와 용어집 파일을 신뢰할 수 있는 원본으로 취급하세요.
- 파이프라인: 여기에서 영어 문서를 업데이트하고, 필요에 따라 `docs/.i18n/glossary.<locale>.json`을 업데이트한 다음, 게시 리포 동기화와 `scripts/docs-i18n`이 `openclaw/docs`에서 실행되게 하세요.
- `scripts/docs-i18n`을 다시 실행하기 전에 영어로 유지해야 하거나 고정 번역을 사용해야 하는 새 기술 용어, 페이지 제목, 짧은 내비게이션 레이블에 대한 용어집 항목을 추가하세요.
- `pnpm docs:check-i18n-glossary`는 변경된 영어 문서 제목과 짧은 내부 문서 레이블에 대한 가드입니다.
- 번역 메모리는 게시 리포에서 생성된 `docs/.i18n/*.tm.jsonl` 파일에 있습니다.
- `docs/.i18n/README.md`를 참조하세요.
