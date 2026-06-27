---
x-i18n:
    generated_at: "2026-06-27T17:08:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# 문서 가이드

이 디렉터리는 문서 작성, Mintlify 링크 규칙, 문서 i18n 정책을 관리합니다.

## Mintlify 규칙

- 문서는 Mintlify(`https://docs.openclaw.ai`)에서 호스팅됩니다.
- `docs/**/*.md`의 내부 문서 링크는 `.md` 또는 `.mdx` 접미사 없이 루트 기준 상대 경로로 유지해야 합니다(예: `[Config](/gateway/configuration)`).
- 섹션 상호 참조는 루트 기준 상대 경로의 앵커를 사용해야 합니다(예: `[Hooks](/gateway/configuration-reference#hooks)`).
- 문서 제목에는 em dash와 아포스트로피를 피해야 합니다. 해당 문자에서는 Mintlify 앵커 생성이 취약합니다.
- README 및 GitHub에서 렌더링되는 다른 문서는 Mintlify 외부에서도 링크가 작동하도록 절대 문서 URL을 유지해야 합니다.
- 문서 콘텐츠는 일반적으로 유지해야 합니다. 개인 장치 이름, 호스트 이름, 로컬 경로를 포함하지 말고 `user@gateway-host` 같은 자리 표시자를 사용하세요.

## 문서 콘텐츠 규칙

- 문서, UI 문구, 선택 목록에서는 해당 섹션이 런타임 순서나 자동 감지 순서를 명시적으로 설명하는 경우가 아니라면 서비스/Provider를 알파벳순으로 정렬하세요.
- 번들 Plugin 명명은 루트 `AGENTS.md`의 저장소 전반 Plugin 용어 규칙과 일관되게 유지하세요.

## 내부 문서

- 장기적으로 유지되는 비공개 운영자 문서는 `~/Projects/manager/docs/`에 둡니다.
- 저장소 로컬 내부 스크래치/미러 문서는 무시되는 `docs/internal/` 아래에 둘 수 있습니다.
- `docs/internal/**` 페이지를 `docs/docs.json` 내비게이션에 추가하거나 공개 문서에서 링크하지 마세요.
- `scripts/docs-sync-publish.mjs`는 나중에 페이지가 강제로 추가되더라도 공개 `openclaw/docs` 게시 저장소에서 `docs/internal/**`를 제외하고 정리합니다.
- 내부 문서에는 저장소 경로, 비공개 앱 이름, 1Password 항목 이름, Runbook을 언급할 수 있지만, 비밀 값은 절대 포함하지 마세요.

## 성숙도 스코어카드 편집

`taxonomy.yaml` 및 `qa/maturity-scores.yaml`이 원본 입력입니다. `docs/maturity/` 아래 생성된 성숙도 문서는 투영 결과이며 점수, LTS, 분류 체계, QA 프로필, 증거 표를 손으로 편집해서는 안 됩니다.
`scripts/qa/render-maturity-docs.ts`가 생성을 담당합니다. 커밋된 문서를 새로 고치려면 `pnpm maturity:render`를 사용하고, 검증하려면 `pnpm maturity:check`를 사용하세요.
`.github/workflows/maturity-scorecard.yml`은 아티팩트 미리보기를 렌더링하고 생성된 문서 PR을 열 수 있습니다. `.github/workflows/openclaw-release-checks.yml`은 릴리스 QA를 위해 이를 디스패치합니다.
관리자가 명시적으로 정제된 커밋 투영본을 요청하지 않는 한, 결정적인 `qa-evidence.json.scorecard` 데이터는 GitHub Actions 아티팩트에 유지하세요.
사람이 재정의하려면 PR에서 원본 상태를 변경하고, 그 이유와 공개 또는 정제된 증거를 설명해야 합니다.

## 문서 i18n

- 외국어 문서는 이 저장소에서 유지 관리하지 않습니다. 생성된 게시 출력은 별도의 `openclaw/docs` 저장소에 있습니다(로컬에서는 보통 `../openclaw-docs`로 클론됨).
- 여기에서 `docs/<locale>/**` 아래에 현지화된 문서를 추가하거나 편집하지 마세요.
- 이 저장소의 영어 문서와 용어집 파일을 신뢰할 수 있는 원본으로 취급하세요.
- 파이프라인: 여기에서 영어 문서를 업데이트하고, 필요에 따라 `docs/.i18n/glossary.<locale>.json`을 업데이트한 다음, 게시 저장소 동기화와 `scripts/docs-i18n`이 `openclaw/docs`에서 실행되도록 둡니다.
- `scripts/docs-i18n`을 다시 실행하기 전에, 영어로 유지해야 하거나 고정 번역을 사용해야 하는 새로운 기술 용어, 페이지 제목, 짧은 내비게이션 라벨에 대한 용어집 항목을 추가하세요.
- `pnpm docs:check-i18n-glossary`는 변경된 영어 문서 제목과 짧은 내부 문서 라벨을 위한 가드입니다.
- 번역 메모리는 게시 저장소의 생성된 `docs/.i18n/*.tm.jsonl` 파일에 있습니다.
- `docs/.i18n/README.md`를 참조하세요.
