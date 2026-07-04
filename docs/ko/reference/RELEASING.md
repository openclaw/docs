---
read_when:
    - 공개 릴리스 채널 정의를 찾는 중
    - 릴리스 검증 또는 패키지 수락 실행
    - 버전 명명 방식과 릴리스 주기 찾기
summary: 릴리스 레인, 운영자 체크리스트, 검증 박스, 버전 명명 및 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-07-04T17:55:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw는 현재 사용자에게 노출되는 세 가지 업데이트 채널을 제공합니다.

- stable: 기존 승격 릴리스 채널이며, 별도 CLI/채널 마일스톤이 적용되기 전까지는
  npm `latest`를 통해 계속 해석됩니다
- beta: npm `beta`로 게시되는 프리릴리스 태그입니다
- dev: `main`의 이동하는 최신 지점입니다

별도로, 릴리스 운영자는 완료된 직전 월의 코어 패키지를 패치 `33`부터
npm `extended-stable`로 게시할 수 있습니다. 현재 월의 일반 final 라인은 npm `latest`에서
계속됩니다. 이 운영자 측 게시 분리는 그 자체로 CLI 업데이트 채널 해석을
변경하지 않습니다.

## 버전 이름 지정

- 월별 npm extended-stable 릴리스 버전: `YYYY.M.PATCH`, `PATCH >= 33`
  - Git 태그: `vYYYY.M.PATCH`
- 일일/일반 final 릴리스 버전: `YYYY.M.PATCH`, `PATCH < 33`
  - Git 태그: `vYYYY.M.PATCH`
- 일반 fallback 수정 릴리스 버전: `YYYY.M.PATCH-N`
  - Git 태그: `vYYYY.M.PATCH-N`
- Beta 프리릴리스 버전: `YYYY.M.PATCH-beta.N`
  - Git 태그: `vYYYY.M.PATCH-beta.N`
- 월 또는 패치를 0으로 채우지 마세요
- 2026년 6월 릴리스 프로세스 업데이트부터 세 번째 구성 요소는
  달력 날짜가 아니라 순차적인 월별 릴리스 트레인 번호입니다. Stable 및 beta
  릴리스가 현재 트레인을 결정합니다. alpha 전용 태그는 beta/stable 패치 번호를
  소비하거나 증가시키지 않습니다. 업데이트 이전 태그와 npm 버전은 기존 이름을
  유지하며 계속 유효합니다. 릴리스 자동화는 계속해서 연도, 월, 패치, 채널,
  프리릴리스 또는 수정 번호로 비교합니다.
- Alpha/nightly 빌드는 다음 미릴리스 패치 트레인을 사용하며, 반복 빌드에서는
  `alpha.N`만 증가시킵니다. 해당 패치에 beta가 생기면 새 alpha 빌드는 다음
  패치로 이동합니다. beta 또는 stable 트레인을 선택할 때 더 높은 패치 번호의
  레거시 alpha 전용 태그는 무시하세요.
- npm 버전은 변경할 수 없습니다. beta 태그가 이미 게시되었다면 삭제, 재게시,
  재사용하지 마세요. 대신 다음 beta 번호 또는 다음 월별 패치를 자르세요.
  전환 중에 `2026.6.5-beta.1`이 이미 게시되었으므로 2026년 6월 릴리스 트레인은
  패치 `5` 이상을 사용해야 합니다. 새 2026년 6월 stable 또는 beta 트레인을
  `2026.6.2`, `2026.6.3`, `2026.6.4`로 게시하지 마세요.
- 일반 final `2026.6.5` 이후 다음 새 beta 트레인은
  더 높은 패치 번호의 자동화된 alpha 전용 태그가 이미 있더라도
  `2026.6.6-beta.1`입니다.
- `latest`는 계속 현재 일반/일일 npm 라인을 따릅니다
- `beta`는 현재 beta 설치 대상을 의미합니다
- `extended-stable`은 패치 `33`부터 시작하는 지원되는 직전 월 npm 패키지를
  의미합니다. 패치 `34` 이후는 해당 월별 라인의 유지관리 릴리스입니다
- 전용 월별 extended-stable 경로는 코어 npm 패키지만 게시합니다. Plugin, macOS 또는
  Windows 아티팩트, GitHub Release, 비공개 저장소 dist-tag, Docker 이미지,
  모바일 아티팩트 또는 웹사이트 다운로드는 게시하지 않습니다.

## 릴리스 주기

- 릴리스는 beta 우선으로 진행됩니다
- Stable은 최신 beta가 검증된 후에만 뒤따릅니다
- 유지관리자는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.PATCH` 브랜치에서
  릴리스를 자르므로, 릴리스 검증과 수정이 `main`의 새 개발을 막지 않습니다
- beta 태그가 푸시되었거나 게시된 뒤 수정이 필요하면, 유지관리자는 기존 beta 태그를
  삭제하거나 다시 만들지 않고 다음 `-beta.N` 태그를 자릅니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 참고 사항은 유지관리자 전용입니다

## 월별 npm 전용 extended-stable 게시

이는 아래의 일반 릴리스 절차에 대한 전용 예외입니다. 완료된 월 `YYYY.M`에 대해
`extended-stable/YYYY.M.33`을 만들고, 같은 브랜치에서 `vYYYY.M.33` 및 이후 유지관리
패치를 게시하세요. 릴리스 태그, 브랜치 끝, 체크아웃, 패키지 버전, npm preflight,
Full Release Validation 실행은 모두 같은 커밋을 식별해야 합니다. 보호된 `main`에는
이미 패치 `33` 미만의 더 늦은 달력 월 final 버전이 포함되어 있어야 합니다.
유지관리 패치는 `main`이 한 달 넘게 진행된 후에도 계속 적격입니다.

정확한 extended-stable 브랜치에서 npm preflight와 Full Release Validation을 실행한 뒤,
두 실행 ID를 모두 저장하세요.

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable`은 기존 검증 깊이 프로필입니다. 이는 npm `extended-stable`
dist-tag와 별개이며 의도적으로 변경되지 않았습니다.

두 실행이 모두 성공하고 npm 릴리스 환경이 준비되면, 정확한 preflight tarball을
승격하세요. 패치 `P`는 `33` 이상이어야 합니다.

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

월별 `.33` 또는 보호된 `main` 월 정책을 의도적으로 만족할 수 없는 fork 또는
비프로덕션 리허설의 경우, npm preflight와 게시 dispatch 모두에
`-f bypass_extended_stable_guard=true`를 추가하세요. 기본값은 `false`입니다. 우회는
`npm_dist_tag=extended-stable`에서만 허용되며 워크플로 요약에 기록됩니다. 이는
정식 `extended-stable/YYYY.M.33` 워크플로 ref, 브랜치 끝/태그/체크아웃 일치,
final 태그 구문, 패키지/태그 버전 일치, 참조된 실행 및 매니페스트 ID,
tarball 출처, 환경 승인, 레지스트리 readback 또는 selector 복구 증거를
우회하지 않습니다.

게시 워크플로는 참조된 실행 ID, 준비된 tarball digest, 두 npm 레지스트리 selector를
검증합니다. 워크플로가 성공한 뒤 결과를 독립적으로 확인하세요.

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

두 명령은 모두 `YYYY.M.P`를 반환해야 합니다. 게시가 성공했지만 selector readback이
실패하면, 변경할 수 없는 패키지 버전을 다시 게시하지 마세요. 실패한 워크플로의
항상 실행되는 요약에 출력된 단일 `npm dist-tag add openclaw@YYYY.M.P extended-stable`
복구 명령을 사용한 뒤, 두 독립 readback을 모두 반복하세요. 이전 selector로의
롤백은 별도의 운영자 결정이며 readback 복구 경로가 아닙니다.

아래의 일반 체크리스트는 계속해서 beta, `latest`, GitHub Release, Plugin, macOS,
Windows 및 기타 플랫폼 게시를 담당합니다. 이 npm 전용 extended-stable 경로에는
해당 단계를 실행하지 마세요.

## 일반 릴리스 운영자 체크리스트

이 체크리스트는 릴리스 흐름의 공개 형태입니다. 비공개 자격 증명, 서명,
공증, dist-tag 복구 및 긴급 롤백 세부 정보는 유지관리자 전용 릴리스 runbook에
남습니다.

1. 현재 `main`에서 시작합니다. 최신 변경 사항을 가져오고, 대상 커밋이 푸시되었는지 확인하며,
   현재 `main` CI가 여기서 브랜치를 만들 수 있을 만큼 충분히 녹색인지 확인합니다.
2. 마지막으로 도달 가능한 릴리스 태그 이후 병합된 PR과 모든 직접
   커밋에서 최상단 `CHANGELOG.md` 섹션을 생성합니다. 항목은 사용자 관점으로 유지하고,
   겹치는 PR/직접 커밋 항목을 중복 제거한 뒤, 다시 작성한 내용을 커밋하고 푸시하며,
   브랜치를 만들기 전에 한 번 더 리베이스/풀합니다.
3. `src/plugins/compat/registry.ts` 및
   `src/commands/doctor/shared/deprecation-compat.ts`의 릴리스 호환성 기록을 검토합니다. 업그레이드 경로가 계속 보장되는 경우에만 만료된
   호환성을 제거하고, 그렇지 않으면 의도적으로 유지하는 이유를 기록합니다.
4. 현재 `main`에서 `release/YYYY.M.PATCH`를 생성합니다. 일반 릴리스 작업을
   `main`에서 직접 수행하지 마세요.
5. 의도한 태그에 필요한 모든 버전 위치를 올린 다음
   `pnpm release:prep`을 실행합니다. 이 명령은 plugin 버전, plugin 인벤터리, 구성
   스키마, 번들 채널 구성 메타데이터, 구성 문서 기준선, plugin SDK
   내보내기, plugin SDK API 기준선을 올바른 순서로 새로 고칩니다. 태그를 달기 전에 생성된
   차이가 있으면 커밋합니다. 그런 다음 로컬 결정적 사전 점검을 실행합니다.
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm release:check`.
6. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다. 태그가 존재하기 전에는
   검증 전용 사전 점검에 전체 40자 릴리스 브랜치 SHA를 사용할 수 있습니다.
   사전 점검은 정확히 체크아웃된 의존성 그래프에 대한 의존성 릴리스 증거를 생성하고,
   이를 npm 사전 점검 아티팩트에 저장합니다. 성공한 `preflight_run_id`를 저장합니다.
7. 릴리스 브랜치, 태그 또는 전체 커밋 SHA에 대해 `Full Release Validation`으로
   모든 릴리스 전 테스트를 시작합니다. 이는 네 개의 큰 릴리스 테스트 박스인
   Vitest, Docker, QA Lab, Package의 단일 수동 진입점입니다.
8. 검증이 실패하면 릴리스 브랜치에서 수정하고, 수정 사항을 증명하는 가장 작은 실패
   파일, 레인, 워크플로 작업, 패키지 프로필, 제공자 또는 모델 허용 목록을 다시 실행합니다.
   변경된 표면 때문에 이전 증거가 오래된 경우에만 전체 상위 검증을 다시 실행합니다.
9. 태그가 달린 베타 후보의 경우 일치하는
   `release/YYYY.M.PATCH` 브랜치에서
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`을 실행합니다. 안정 버전의 경우 필요한 Windows 소스
   릴리스도 전달합니다.
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   이 헬퍼는 로컬 생성 릴리스 검사를 실행하고, 전체 릴리스 검증 및 npm 사전 점검 증거를 디스패치하거나 확인하며, 정확히 준비된 tarball에 대한 Parallels
   신규/업데이트 증명과 Telegram 패키지 증명을 실행하고, plugin npm 및 ClawHub 계획을 기록하며, 증거 번들이 녹색이 된 뒤에만 정확한
   `OpenClaw Release Publish` 명령을 출력합니다.
   `OpenClaw Release Publish`는 선택된 또는 게시 가능한 모든 plugin
   패키지를 npm으로, 동일한 집합을 ClawHub로 병렬 디스패치한 다음, plugin npm 게시가 성공하는 즉시 일치하는 dist-tag로
   준비된 OpenClaw npm 사전 점검 아티팩트를 승격합니다.
   OpenClaw npm 게시 하위 작업이 성공하면, 완전하게 일치하는
   `CHANGELOG.md` 섹션에서 일치하는 GitHub 릴리스/프리릴리스 페이지를 생성하거나 업데이트합니다. npm `latest`로 게시된 안정 릴리스는
   GitHub 최신 릴리스가 되며, npm `beta`에 유지되는 안정 유지보수 릴리스는
   GitHub `latest=false`로 생성됩니다. 또한 워크플로는 릴리스 후 사고
   대응을 위해 사전 점검 의존성 증거, 전체 검증 매니페스트, 게시 후 레지스트리
   검증 증거를 GitHub 릴리스에 업로드합니다. 게시 워크플로는 하위 실행 ID를 즉시 출력하고,
   워크플로 토큰이 승인할 수 있는 릴리스 환경 게이트를 자동 승인하며,
   실패한 하위 작업을 로그 꼬리와 함께 요약하고, OpenClaw npm 게시가 성공하는 즉시
   GitHub 릴리스와 의존성 증거를 마무리하며, OpenClaw npm이 게시되는 경우마다 ClawHub를 기다린 다음
   `pnpm release:verify-beta`를 실행하고 GitHub 릴리스, npm 패키지, 선택된
   plugin npm 패키지, 선택된 ClawHub 패키지, 하위 워크플로 실행 ID,
   선택적 NPM Telegram 실행 ID에 대한 게시 후 증거를 업로드합니다. ClawHub 경로는 일시적인 CLI
   의존성 설치 실패를 재시도하고, 하나의 미리 보기 셀이 불안정하더라도 미리 보기를 통과한 plugin을 게시하며, 모든 예상
   plugin 버전에 대한 레지스트리 검증으로 끝나므로 부분 게시가 계속 표시되고 재시도 가능합니다. 그런 다음 게시된
   `openclaw@YYYY.M.PATCH-beta.N` 또는
   `openclaw@beta` 패키지에 대해 게시 후
   패키지 수락을 실행합니다. 푸시되었거나 게시된 프리릴리스에 수정이 필요하면,
   다음으로 일치하는 프리릴리스 번호를 잘라냅니다. 기존
   프리릴리스를 삭제하거나 다시 작성하지 마세요.
10. 안정 버전의 경우, 검증된 베타 또는 릴리스 후보에 필요한 검증 증거가 확보된 뒤에만 계속합니다. 안정 npm 게시도
    `OpenClaw Release Publish`를 통해 진행되며, 성공한 사전 점검 아티팩트를
    `preflight_run_id`로 재사용합니다. 안정 macOS 릴리스 준비 상태에는
    패키징된 `.zip`, `.dmg`, `.dSYM.zip` 및 `main`의 업데이트된 `appcast.xml`도 필요합니다.
    macOS 게시 워크플로는 릴리스 자산 검증 후 서명된 appcast를 공개 `main`에
    자동으로 게시합니다. 브랜치 보호가 직접 푸시를 차단하면 appcast PR을 열거나 업데이트합니다.
    안정 Windows Hub 준비 상태에는 OpenClaw GitHub 릴리스의 서명된
    `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe`, 및
    `OpenClawCompanion-SHA256SUMS.txt` 자산이 필요합니다.
    정확히 서명된 `openclaw/openclaw-windows-node` 릴리스 태그를
    `windows_node_tag`로, 후보 승인된 설치 관리자 다이제스트 맵을
    `windows_node_installer_digests`로 전달합니다. `OpenClaw Release Publish`는
    릴리스 초안을 유지하고, `Windows Node Release`를 디스패치하며, 게시 전에 세 자산을 모두
    검증합니다.
11. 게시 후 npm 게시 후 검증기를 실행하고, 게시 후 채널 증명이 필요할 때 선택적 독립 실행형
    published-npm Telegram E2E를 실행하며,
    필요 시 dist-tag 승격을 수행하고, 생성된 GitHub 릴리스 페이지를 검증하고,
    릴리스 발표 단계를 실행한 다음, 안정 릴리스를 완료했다고 하기 전에 [안정 버전 main
    마무리](#stable-main-closeout)를 완료합니다.

## 안정 버전 main 마무리

안정 버전 게시는 `main`이 실제 배송된
릴리스 상태를 담기 전까지 완료되지 않습니다.

1. 신선한 최신 `main`에서 시작합니다. `release/YYYY.M.PATCH`를 기준으로 감사하고,
   `main`에 없는 실제 수정 사항을 forward-port합니다. 릴리스 전용 호환성, 테스트 또는 검증 어댑터를
   더 최신의 `main`에 무작정 병합하지 마세요.
2. `main`을 추측성 다음 열차가 아니라 배송된 안정 버전으로 설정합니다. 루트 버전 변경 후
   `pnpm release:prep`을 실행한 다음
   `pnpm deps:shrinkwrap:generate`를 실행합니다.
3. `main`의 `CHANGELOG.md` `## YYYY.M.PATCH` 섹션이
   태그가 달린 릴리스 브랜치와 정확히 일치하도록 만듭니다. mac
   릴리스가 게시한 경우 안정 `appcast.xml` 업데이트를 포함합니다.
4. 운영자가 해당 릴리스 열차를 명시적으로 시작하기 전까지 `YYYY.M.PATCH+1`, 베타 버전 또는 빈 미래 changelog
   섹션을 `main`에 추가하지 마세요.
5. `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, 및
   `OPENCLAW_TESTBOX=1 pnpm check:changed`를 실행합니다. 푸시한 다음 안정 릴리스가 완료되었다고 하기 전에
   `origin/main`에 배송된 버전과 changelog가 포함되어 있는지 확인합니다.
6. 각 비공개 롤백 훈련 후 저장소 변수 `RELEASE_ROLLBACK_DRILL_ID` 및
   `RELEASE_ROLLBACK_DRILL_DATE`를 최신 상태로 유지합니다.
   `OpenClaw Stable Main Closeout`은 안정 버전 게시 후 배송된 버전, changelog, appcast를 포함하는
   `main` 푸시에서 시작합니다. 이는 불변 게시 후 증거를 읽어 배송된 태그를 Full Release
   Validation 및 Publish 실행에 바인딩한 다음, 안정 main 상태, 릴리스,
   필수 안정 소크, 차단 성능 증거를 검증합니다. 불변 마무리
   매니페스트와 체크섬을 GitHub 릴리스에 첨부합니다. 자동
   푸시 트리거는 불변 게시 후 증거보다 오래된 레거시 릴리스를 건너뜁니다.
   이 건너뜀을 완료된 마무리로 취급하지 않습니다. 완전한
   마무리에는 자산과 일치하는 체크섬이 모두 필요합니다. 부분 매니페스트는 기록된
   `main` SHA와 롤백 훈련을 재생해 동일한 바이트를 다시 생성한 다음,
   누락된 체크섬을 첨부합니다. 잘못된 쌍 또는 매니페스트 없는 체크섬은
   계속 차단 상태로 남습니다. 롤백 훈련 저장소 변수가 없는 푸시 트리거 실행은
   마무리를 완료하지 않고 건너뜁니다. 누락되었거나 90일을 초과한 훈련 기록은 여전히 수동 증거 기반
   마무리를 차단합니다. 비공개 복구 명령은 maintainer 전용 런북에 남아 있습니다.
   증거 기반 안정 마무리를 복구하거나 재생할 때만 수동 디스패치를 사용합니다.
   레거시 fallback 수정 태그는 수정 태그가 기본 안정 태그와 동일한 소스 커밋으로 해석되는 경우에만
   기본 패키지 증거를 재사용할 수 있습니다.
   다른 소스를 가진 수정은 자체 패키지
   증거를 게시하고 검증해야 합니다.

## 릴리스 사전 점검

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하여 테스트 TypeScript가
  더 빠른 로컬 `pnpm check` 게이트 밖에서도 계속 검사되도록 합니다
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하여 더 광범위한 import
  cycle 및 아키텍처 경계 검사가 더 빠른 로컬 게이트 밖에서도 통과하도록 합니다
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하여 pack
  검증 단계에 필요한 예상 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 합니다
- 루트 버전 범프 후 태그 지정 전에 `pnpm release:prep`를 실행합니다. 이는
  버전/config/API 변경 후 흔히 드리프트되는 모든 결정적 릴리스 생성기를 실행합니다:
  Plugin 버전, Plugin 인벤토리, 기본 config 스키마, 번들 채널 config 메타데이터,
  config 문서 기준선, Plugin SDK exports, Plugin SDK API 기준선. `pnpm release:check`는
  해당 가드를 check 모드로 다시 실행하고, 패키지 릴리스 검사를 실행하기 전에 발견한
  모든 생성물 드리프트 실패를 한 번에 보고합니다.
- Plugin 버전 동기화는 기본적으로 공식 Plugin 패키지 버전과 기존
  `openclaw.compat.pluginApi` 하한을 OpenClaw 릴리스 버전으로 업데이트합니다. 해당
  필드를 단순한 패키지 버전 복사본이 아니라 Plugin SDK/runtime API 하한으로
  취급하세요. 의도적으로 더 오래된 OpenClaw 호스트와 호환되도록 유지하는
  Plugin 전용 릴리스의 경우, 지원되는 가장 오래된 호스트 API로 하한을 유지하고
  그 선택을 Plugin 릴리스 증빙에 문서화하세요.
- 릴리스 승인 전에 수동 `Full Release Validation` 워크플로를 실행하여 모든
  사전 릴리스 테스트 박스를 하나의 진입점에서 시작합니다. 이 워크플로는 브랜치,
  태그 또는 전체 커밋 SHA를 입력받고, 수동 `CI`를 dispatch하며, install smoke,
  package acceptance, cross-OS package checks, QA Lab parity, Matrix, Telegram
  lane에 대해 `OpenClaw Release Checks`를 dispatch합니다. stable 및 full 실행은
  항상 포괄적인 live/E2E와 Docker 릴리스 경로 soak를 포함합니다.
  `run_release_soak=true`는 명시적 beta soak를 위해 유지됩니다. Package
  Acceptance는 후보 검증 중 표준 패키지 Telegram E2E를 제공하여 두 번째 동시
  live poller를 피합니다.
  beta를 게시한 후 `release_package_spec`을 제공하면 릴리스 tarball을 다시
  빌드하지 않고 게시된 npm 패키지를 release checks, Package Acceptance, 패키지
  Telegram E2E 전반에서 재사용할 수 있습니다. Telegram이 나머지 릴리스 검증과
  다른 게시 패키지를 사용해야 할 때만 `npm_telegram_package_spec`을 제공합니다.
  Package Acceptance가 릴리스 패키지 spec과 다른 게시 패키지를 사용해야 할 때
  `package_acceptance_package_spec`을 제공합니다. Telegram E2E를 강제하지 않고
  릴리스 증빙 보고서가 검증이 게시된 npm 패키지와 일치함을 증명해야 할 때
  `evidence_package_spec`을 제공합니다.
  예:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- 릴리스 작업이 계속되는 동안 패키지 후보에 대한 side-channel 증빙이 필요할 때
  수동 `Package Acceptance` 워크플로를 실행합니다. `openclaw@beta`,
  `openclaw@latest` 또는 정확한 릴리스 버전에는 `source=npm`을 사용합니다. 현재
  `workflow_ref` 하네스로 신뢰된 `package_ref` 브랜치/태그/SHA를 pack하려면
  `source=ref`를 사용합니다. 필수 SHA-256과 엄격한 공개 URL 정책이 있는 공개
  HTTPS tarball에는 `source=url`을 사용합니다. 필수 `trusted_source_id`와 SHA-256을
  사용하는 명명된 신뢰 소스 정책에는 `source=trusted-url`을 사용합니다. 다른
  GitHub Actions 실행에서 업로드한 tarball에는 `source=artifact`를 사용합니다.
  워크플로는 후보를 `package-under-test`로 resolve하고, 해당 tarball에 대해
  Docker E2E 릴리스 스케줄러를 재사용하며, `telegram_mode=mock-openai` 또는
  `telegram_mode=live-frontier`로 동일한 tarball에 대해 Telegram QA를 실행할 수
  있습니다. 선택한 Docker lane에 `published-upgrade-survivor`가 포함된 경우,
  패키지 아티팩트가 후보가 되고 `published_upgrade_survivor_baseline`이 게시된
  기준선을 선택합니다. `update-restart-auth`는 후보 패키지를 설치된 CLI와
  package-under-test 양쪽으로 사용하므로 후보 update 명령의 관리형 restart 경로를
  검증합니다.
  예: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  일반 프로필:
  - `smoke`: install/channel/agent, gateway network, config reload lane
  - `package`: OpenWebUI 또는 live ClawHub 없이 아티팩트 네이티브 package/update/restart/plugin lane
  - `product`: package 프로필에 MCP 채널, cron/subagent cleanup,
    OpenAI web search, OpenWebUI 추가
  - `full`: OpenWebUI가 포함된 Docker 릴리스 경로 청크
  - `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 선택
- 릴리스 후보에 대해 결정적인 일반 CI 커버리지만 필요할 때 수동 `CI` 워크플로를
  직접 실행합니다. 수동 CI dispatch는 changed scoping을 우회하고 Linux Node shard,
  bundled-plugin shard, Plugin 및 channel contract shard, Node 22 호환성, `check-*`,
  `check-additional-*`, built-artifact smoke checks, docs checks, Python skills,
  Windows, macOS, Control UI i18n lane을 강제합니다. 독립형 수동 CI 실행은
  `include_android=true`로 dispatch된 경우에만 Android를 실행합니다.
  `Full Release Validation`은 CI child에 해당 입력을 전달합니다.
  Android 포함 예: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- 릴리스 telemetry를 검증할 때 `pnpm qa:otel:smoke`를 실행합니다. 이는 로컬
  OTLP/HTTP receiver를 통해 QA-lab을 실행하고, Opik, Langfuse 또는 다른 외부
  collector 없이 trace, metric, log export와 제한된 trace attribute 및
  content/identifier redaction을 검증합니다.
- collector 호환성을 검증할 때 `pnpm qa:otel:collector-smoke`를 실행합니다. 이는
  로컬 receiver assertion 전에 동일한 QA-lab OTLP export를 실제 OpenTelemetry
  Collector Docker 컨테이너로 라우팅합니다.
- 보호된 Prometheus scraping을 검증할 때 `pnpm qa:prometheus:smoke`를 실행합니다.
  이는 QA-lab을 실행하고 인증되지 않은 scrape를 거부하며, 릴리스에 중요한 metric
  family가 prompt content, raw identifier, auth token, local path를 포함하지 않도록
  검증합니다.
- source-checkout OpenTelemetry 및 Prometheus smoke lane을 연속으로 실행하려면
  `pnpm qa:observability:smoke`를 실행합니다.
- 태그가 지정된 모든 릴리스 전에 `pnpm release:check`를 실행합니다
- `OpenClaw NPM Release` 사전 점검은 npm tarball을 pack하기 전에 dependency 릴리스
  증빙을 생성합니다. npm advisory vulnerability gate는 릴리스 차단 조건입니다.
  transitive manifest risk, dependency ownership/install surface, dependency change
  report는 릴리스 증빙 전용입니다. dependency change report는 릴리스 후보를
  이전에 도달 가능한 릴리스 태그와 비교합니다.
- 사전 점검은 dependency 증빙을
  `openclaw-release-dependency-evidence-<tag>`로 업로드하고, 준비된 npm 사전 점검
  아티팩트 내부의 `dependency-evidence/`에도 포함합니다. 실제 publish 경로는 해당
  사전 점검 아티팩트를 재사용한 뒤, 동일한 증빙을
  `openclaw-<version>-dependency-evidence.zip`으로 GitHub 릴리스에 첨부합니다.
- 태그가 존재한 뒤 변경을 수행하는 publish 시퀀스에는 `OpenClaw Release Publish`를
  실행합니다. `release/YYYY.M.PATCH`에서 dispatch하거나 main에서 도달 가능한 태그를
  게시할 때는 `main`에서 dispatch하고, 릴리스 태그, 성공한 OpenClaw npm
  `preflight_run_id`, 성공한 `full_release_validation_run_id`를 전달하며, 의도적으로
  집중 복구를 실행하는 경우가 아니라면 기본 Plugin publish scope
  `all-publishable`을 유지합니다. 워크플로는 Plugin npm publish, Plugin ClawHub
  publish, OpenClaw npm publish를 직렬화하여 core 패키지가 외부화된 Plugin보다 먼저
  게시되지 않도록 합니다.
- Stable `OpenClaw Release Publish`는 일치하는 non-prerelease
  `openclaw/openclaw-windows-node` 릴리스가 존재한 뒤 정확한 `windows_node_tag`를
  요구합니다. 또한 후보 승인된 `windows_node_installer_digests` 맵이 필요합니다.
  publish child를 dispatch하기 전에, source 릴리스가 게시되어 있고, non-prerelease이며,
  필수 x64/ARM64 installer를 포함하고, 여전히 승인된 맵과 일치하는지 검증합니다.
  그런 다음 OpenClaw 릴리스가 아직 draft인 동안 `Windows Node Release`를
  dispatch하며, 고정된 installer digest 맵을 변경 없이 전달합니다. child
  워크플로는 해당 정확한 태그에서 서명된 Windows Hub installer를 다운로드하고,
  고정된 digest와 대조하며, Windows runner에서 Authenticode 서명이 예상된 OpenClaw
  Foundation signer를 사용하는지 검증하고, SHA-256 manifest를 작성한 뒤 installer와
  manifest를 표준 OpenClaw GitHub 릴리스에 업로드한 다음, promote된 asset을 다시
  다운로드하여 manifest membership과 hash를 검증합니다. parent는 게시 전에 현재
  x64, ARM64, checksum asset contract를 검증합니다. 직접 복구는 예상 contract
  asset을 고정된 source byte로 교체하기 전에 예기치 않은 `OpenClawCompanion-*`
  asset 이름을 거부합니다. `Windows Node Release`는 복구 용도로만 수동 dispatch하고,
  항상 `latest`가 아닌 정확한 태그와 승인된 source 릴리스의 명시적
  `expected_installer_digests` JSON 맵을 전달하세요. 웹사이트 다운로드 링크는 현재
  stable 릴리스의 정확한 OpenClaw release asset URL을 대상으로 하거나, GitHub의 latest
  redirect가 동일한 릴리스를 가리키는지 검증한 뒤에만 `releases/latest/download/...`를
  사용해야 합니다. companion repo 릴리스 페이지만 링크하지 마세요.
- 릴리스 검사는 이제 별도의 수동 워크플로에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock parity lane과 빠른 live
  Matrix 프로필 및 Telegram QA lane도 실행합니다. live lane은 `qa-live-shared`
  environment를 사용합니다. Telegram은 Convex CI credential lease도 사용합니다. 전체
  Matrix transport, media, E2EE inventory를 병렬로 확인하려면 수동 `QA-Lab - All Lanes`
  워크플로를 `matrix_profile=all` 및 `matrix_shards=true`로 실행합니다.
- Cross-OS install 및 upgrade runtime 검증은 공개 `OpenClaw Release Checks`와
  `Full Release Validation`의 일부이며, 이들은 재사용 가능한 워크플로
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`을 직접 호출합니다
- 이 분리는 의도된 것입니다. 실제 npm 릴리스 경로는 짧고 결정적이며 아티팩트
  중심으로 유지하고, 더 느린 live check는 publish를 지연하거나 차단하지 않도록
  자체 lane에 둡니다
- secret을 포함하는 릴리스 검사는 `Full Release Validation`을 통해 dispatch하거나
  workflow logic과 secret이 통제되도록 `main`/release workflow ref에서 dispatch해야
  합니다
- `OpenClaw Release Checks`는 resolve된 commit이 OpenClaw 브랜치 또는 릴리스 태그에서
  도달 가능하기만 하면 브랜치, 태그 또는 전체 커밋 SHA를 입력받습니다
- `OpenClaw NPM Release` validation-only 사전 점검도 pushed tag를 요구하지 않고 현재
  전체 40자 workflow-branch commit SHA를 입력받습니다
- 해당 SHA 경로는 validation-only이며 실제 publish로 promote할 수 없습니다
- SHA 모드에서 워크플로는 패키지 metadata check 전용으로만 `v<package.json version>`을
  합성합니다. 실제 publish에는 여전히 실제 릴리스 태그가 필요합니다
- 두 워크플로 모두 실제 publish 및 promotion 경로는 GitHub-hosted runner에서 유지하고,
  변경하지 않는 validation 경로는 더 큰 Blacksmith Linux runner를 사용할 수 있습니다
- 해당 워크플로는
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`를
  `OPENAI_API_KEY` 및 `ANTHROPIC_API_KEY` workflow secret 양쪽을 사용해 실행합니다
- npm 릴리스 사전 점검은 더 이상 별도 release checks lane을 기다리지 않습니다
- 릴리스 후보에 로컬로 태그를 지정하기 전에
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`를 실행합니다. 이
  helper는 GitHub publish 워크플로가 시작되기 전에 흔한 승인 차단 실수를 잡는 순서로
  빠른 릴리스 guardrail, Plugin npm/ClawHub release check, build, UI build,
  `release:openclaw:npm:check`를 실행합니다.
- 승인 전에 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  또는 일치하는 beta/correction 태그로 실행합니다
- npm publish 후 실행합니다
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (또는 일치하는 베타/수정 버전)를 실행해 새로운 임시 prefix에서 게시된 레지스트리
  설치 경로를 검증합니다
- 베타 게시 후에는 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`를 실행해
  공유 임대 Telegram 자격 증명 풀을 사용하여 게시된 npm 패키지에 대해 설치된 패키지 온보딩,
  Telegram 설정, 실제 Telegram E2E를 검증합니다. 로컬 유지관리자의 일회성 실행은 Convex 변수를 생략하고
  세 개의 `OPENCLAW_QA_TELEGRAM_*` env 자격 증명을 직접 전달할 수 있습니다.
- 유지관리자 머신에서 전체 게시 후 베타 스모크를 실행하려면 `pnpm release:beta-smoke -- --beta betaN`를 사용합니다. 이 헬퍼는 Parallels npm 업데이트/새 대상 검증을 실행하고, `NPM Telegram Beta E2E`를 디스패치하며, 정확한 workflow 실행을 폴링하고, 아티팩트를 다운로드한 뒤 Telegram 보고서를 출력합니다.
- 유지관리자는 수동 `NPM Telegram Beta E2E` workflow를 통해 GitHub Actions에서도 동일한 게시 후 검사를 실행할 수 있습니다. 이는 의도적으로 수동 전용이며
  모든 병합마다 실행되지 않습니다.
- 유지관리자 릴리스 자동화는 이제 사전 점검 후 승격을 사용합니다:
  - 실제 npm 게시는 성공한 npm `preflight_run_id`를 통과해야 합니다
  - 실제 npm 게시는 성공한 사전 점검 실행과 동일한 `main` 또는
    `release/YYYY.M.PATCH` 브랜치에서 디스패치되어야 합니다
  - 안정 npm 릴리스의 기본값은 `beta`입니다
  - 안정 npm 게시는 workflow 입력을 통해 명시적으로 `latest`를 대상으로 지정할 수 있습니다
  - 토큰 기반 npm dist-tag 변경은 이제
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`에 있습니다. 소스 저장소는
    OIDC 전용 게시를 유지하지만 `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하기 때문입니다
  - 공개 `macOS Release`는 검증 전용입니다. 태그가 릴리스 브랜치에만 있고
    workflow가 `main`에서 디스패치되는 경우
    `public_release_branch=release/YYYY.M.PATCH`를 설정합니다
  - 실제 macOS 게시는 성공한 macOS `preflight_run_id`와
    `validate_run_id`를 통과해야 합니다
  - 실제 게시 경로는 아티팩트를 다시 빌드하는 대신 준비된 아티팩트를 승격합니다
- `YYYY.M.PATCH-N` 같은 안정 수정 릴리스의 경우 게시 후 검증기는
  `YYYY.M.PATCH`에서 `YYYY.M.PATCH-N`으로의 동일한 임시 prefix 업그레이드 경로도 확인하므로,
  릴리스 수정이 기존 전역 설치를 기본 안정 페이로드에 조용히 남겨 두지 못합니다
- npm 릴리스 사전 점검은 tarball에 `dist/control-ui/index.html`과 비어 있지 않은
  `dist/control-ui/assets/` 페이로드가 모두 포함되어 있지 않으면 실패로 닫히므로,
  빈 브라우저 대시보드를 다시 배포하지 않습니다
- 게시 후 검증은 게시된 Plugin entrypoint와
  패키지 메타데이터가 설치된 레지스트리 레이아웃에 있는지도 확인합니다. Plugin 런타임 페이로드가 누락된 릴리스는 postpublish 검증기에 실패하며
  `latest`로 승격될 수 없습니다.
- `pnpm test:install:smoke`는 후보 업데이트 tarball에 대한 npm pack `unpackedSize` 예산도 강제하므로,
  설치 관리자 e2e가 릴리스 게시 경로 전에 의도치 않은 pack 비대를 잡아냅니다
- 릴리스 작업이 CI 계획, 확장 timing manifest, 또는
  확장 테스트 matrix를 건드린 경우, 승인 전에
  `.github/workflows/plugin-prerelease.yml`의 planner 소유
  `plugin-prerelease-extension-shard` matrix 출력을 다시 생성하고 검토하여 릴리스 노트가
  오래된 CI 레이아웃을 설명하지 않도록 합니다
- 안정 macOS 릴리스 준비 상태에는 updater surface도 포함됩니다:
  - GitHub 릴리스에는 패키징된 `.zip`, `.dmg`, `.dSYM.zip`이 최종적으로 포함되어야 합니다
  - `main`의 `appcast.xml`은 게시 후 새 안정 zip을 가리켜야 합니다.
    macOS 게시 workflow가 이를 자동으로 커밋하거나, 직접 push가 차단되면 appcast
    PR을 엽니다
  - 패키징된 앱은 디버그가 아닌 bundle id, 비어 있지 않은 Sparkle feed
    URL, 그리고 해당 릴리스 버전에 대한 canonical Sparkle build floor 이상인
    `CFBundleVersion`을 유지해야 합니다

## 릴리스 테스트 박스

`Full Release Validation`은 운영자가 하나의 진입점에서 모든 사전 릴리스 테스트를 시작하는 방법입니다. 빠르게 변하는 브랜치에서 고정된 커밋 증명을 하려면, 모든 하위 워크플로가 대상 SHA에 고정된 임시 브랜치에서 실행되도록 헬퍼를 사용하세요.

```bash
pnpm ci:full-release --sha <full-sha>
```

이 헬퍼는 `release-ci/<sha>-...`를 푸시하고, 해당 브랜치에서 `ref=<sha>`로 `Full Release Validation`을 디스패치하며, 모든 하위 워크플로의 `headSha`가 대상과 일치하는지 확인한 다음 임시 브랜치를 삭제합니다. 이렇게 하면 실수로 더 최신 `main` 하위 실행을 증명하는 일을 피할 수 있습니다.

릴리스 브랜치 또는 태그 검증의 경우, 신뢰할 수 있는 `main` 워크플로 ref에서 실행하고 릴리스 브랜치 또는 태그를 `ref`로 전달하세요.

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

워크플로는 대상 ref를 해석하고, `target_ref=<release-ref>`로 수동 `CI`를 디스패치한 다음 `OpenClaw Release Checks`를 디스패치합니다. `OpenClaw Release Checks`는 설치 스모크, 교차 OS 릴리스 검사, soak가 활성화된 경우 live/E2E Docker 릴리스 경로 커버리지, 표준 Telegram 패키지 E2E가 포함된 Package Acceptance, QA Lab 패리티, live Matrix, live Telegram으로 팬아웃합니다. 전체/all 실행은 `Full Release Validation` 요약에서 `normal_ci`, `plugin_prerelease`, `release_checks`가 성공으로 표시될 때만 허용됩니다. 단, 집중 재실행에서 별도의 `Plugin Prerelease` 하위 항목을 의도적으로 건너뛴 경우는 예외입니다. 독립형 `npm-telegram` 하위 항목은 `release_package_spec` 또는 `npm_telegram_package_spec`을 사용한 게시된 패키지 집중 재실행에만 사용하세요. 최종 검증기 요약에는 각 하위 실행의 가장 느린 작업 표가 포함되어, 릴리스 관리자가 로그를 다운로드하지 않고도 현재 중요 경로를 확인할 수 있습니다.
전체 단계 매트릭스, 정확한 워크플로 작업 이름, stable 프로필과 full 프로필의 차이, 아티팩트, 집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을 참조하세요.
하위 워크플로는 대상 `ref`가 더 오래된 릴리스 브랜치나 태그를 가리키는 경우에도 `Full Release Validation`을 실행하는 신뢰할 수 있는 ref, 일반적으로 `--ref main`에서 디스패치됩니다. 별도의 Full Release Validation workflow-ref 입력은 없습니다. 워크플로 실행 ref를 선택하여 신뢰할 수 있는 하네스를 선택하세요.
이동 중인 `main`에서 정확한 커밋 증명을 위해 `--ref main -f ref=<sha>`를 사용하지 마세요. 원시 커밋 SHA는 워크플로 디스패치 ref가 될 수 없으므로, `pnpm ci:full-release --sha <sha>`를 사용해 고정된 임시 브랜치를 만드세요.

live/provider 범위를 선택하려면 `release_profile`을 사용하세요.

- `minimum`: 가장 빠른 릴리스 핵심 OpenAI/core live 및 Docker 경로
- `stable`: 릴리스 승인을 위한 minimum에 더해 안정적인 provider/backend 커버리지
- `full`: stable에 더해 광범위한 권고 provider/media 커버리지

stable 및 full 검증은 승격 전에 항상 포괄적인 live/E2E, Docker 릴리스 경로, 제한된 게시 업그레이드 생존자 스윕을 실행합니다.
베타에 동일한 스윕을 요청하려면 `run_release_soak=true`를 사용하세요. 이 스윕은 최신 안정 패키지 네 개와 고정된 `2026.4.23` 및 `2026.5.2` 기준선, 그리고 더 오래된 `2026.4.15` 커버리지를 포함하며, 중복 기준선은 제거되고 각 기준선은 자체 Docker 러너 작업으로 샤딩됩니다.

`OpenClaw Release Checks`는 신뢰할 수 있는 워크플로 ref를 사용해 대상 ref를 `release-package-under-test`로 한 번 해석하고, soak가 실행될 때 교차 OS, Package Acceptance, 릴리스 경로 Docker 검사에서 해당 아티팩트를 재사용합니다. 이렇게 하면 모든 패키지 대상 박스가 동일한 바이트를 사용하게 되고 반복적인 패키지 빌드를 피할 수 있습니다.
베타가 이미 npm에 게시된 후에는 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`을 설정하여 릴리스 검사가 게시된 패키지를 한 번 다운로드하고, `dist/build-info.json`에서 빌드 소스 SHA를 추출하며, 해당 아티팩트를 교차 OS, Package Acceptance, 릴리스 경로 Docker, 패키지 Telegram 레인에 재사용하도록 하세요.
교차 OS OpenAI 설치 스모크는 repo/org 변수가 설정된 경우 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4`를 사용합니다. 이 레인은 가장 느린 기본 모델을 벤치마킹하는 것이 아니라 패키지 설치, 온보딩, Gateway 시작, live 에이전트 턴 한 번을 증명하기 때문입니다. 더 광범위한 live provider 매트릭스가 모델별 커버리지를 담당합니다.

릴리스 단계에 따라 다음 변형을 사용하세요.

```bash
# 게시되지 않은 릴리스 후보 브랜치를 검증합니다.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# 정확히 푸시된 커밋을 검증합니다.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# 베타를 게시한 후 게시된 패키지 Telegram E2E를 추가합니다.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

집중 수정 후 첫 재실행으로 전체 엄브렐라를 사용하지 마세요. 한 박스가 실패하면 다음 증명에는 실패한 하위 워크플로, 작업, Docker 레인, 패키지 프로필, 모델 provider 또는 QA 레인을 사용하세요. 수정이 공유 릴리스 오케스트레이션을 변경했거나 이전 전체 박스 증거를 오래된 것으로 만든 경우에만 전체 엄브렐라를 다시 실행하세요. 엄브렐라의 최종 검증기는 기록된 하위 워크플로 실행 ID를 다시 확인하므로, 하위 워크플로가 성공적으로 재실행된 후에는 실패한 `Verify full validation` 상위 작업만 재실행하세요.

제한된 복구를 위해 엄브렐라에 `rerun_group`을 전달하세요. `all`은 실제 릴리스 후보 실행이고, `ci`는 일반 CI 하위 항목만 실행하며, `plugin-prerelease`는 릴리스 전용 Plugin 하위 항목만 실행하고, `release-checks`는 모든 릴리스 박스를 실행합니다. 더 좁은 릴리스 그룹은 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`입니다.
집중 `npm-telegram` 재실행에는 `release_package_spec` 또는 `npm_telegram_package_spec`이 필요합니다. 전체/all 실행은 Package Acceptance 내부의 표준 패키지 Telegram E2E를 사용합니다. 집중 교차 OS 재실행은 `cross_os_suite_filter=windows/packaged-upgrade` 또는 다른 OS/스위트 필터를 추가할 수 있습니다. QA release-check 실패는 표준 티어의 필수 OpenClaw 동적 도구 드리프트를 포함해 일반 릴리스 검증을 차단합니다.
Tideclaw 알파 실행은 여전히 패키지 안전이 아닌 release-check 레인을 권고로 취급할 수 있습니다. `live_suite_filter`가 Discord, WhatsApp, Slack과 같은 게이트된 QA live 레인을 명시적으로 요청하는 경우, 일치하는 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 변수를 활성화해야 합니다. 그렇지 않으면 레인이 조용히 건너뛰어지는 대신 입력 캡처가 실패합니다.

### Vitest

Vitest 박스는 수동 `CI` 하위 워크플로입니다. 수동 CI는 변경 범위 지정을 의도적으로 우회하고 릴리스 후보에 대해 일반 테스트 그래프를 강제합니다. Linux Node 샤드, 번들 Plugin 샤드, Plugin 및 채널 계약 샤드, Node 22 호환성, `check-*`, `check-additional-*`, 빌드 아티팩트 스모크 검사, 문서 검사, Python Skills, Windows, macOS, Control UI i18n이 포함됩니다. `Full Release Validation`이 이 박스를 실행할 때는 엄브렐라가 `include_android=true`를 전달하므로 Android가 포함됩니다. 독립형 수동 CI는 Android 커버리지를 위해 `include_android=true`가 필요합니다.

이 박스는 "소스 트리가 전체 일반 테스트 스위트를 통과했는가?"에 답하기 위해 사용하세요.
이는 릴리스 경로 제품 검증과 동일하지 않습니다. 보관할 증거:

- 디스패치된 `CI` 실행 URL을 보여주는 `Full Release Validation` 요약
- 정확한 대상 SHA에서 녹색인 `CI` 실행
- 회귀를 조사할 때 CI 작업의 실패했거나 느린 샤드 이름
- 실행에 성능 분석이 필요할 때 `.artifacts/vitest-shard-timings.json`과 같은 Vitest 타이밍 아티팩트

릴리스에 Docker, QA Lab, live, 교차 OS 또는 패키지 박스가 아닌 결정적인 일반 CI만 필요한 경우에만 수동 CI를 직접 실행하세요. Android가 아닌 직접 CI에는 첫 번째 명령을 사용하세요. 직접 릴리스 후보 CI가 Android를 포함해야 하는 경우 `include_android=true`를 추가하세요.

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 박스는 `openclaw-live-and-e2e-checks-reusable.yml`을 통한 `OpenClaw Release Checks`와 릴리스 모드 `install-smoke` 워크플로에 있습니다. 이는 소스 수준 테스트만이 아니라 패키지화된 Docker 환경을 통해 릴리스 후보를 검증합니다.

릴리스 Docker 커버리지에는 다음이 포함됩니다.

- 느린 Bun 전역 설치 스모크가 활성화된 전체 설치 스모크
- 대상 SHA별 루트 Dockerfile 스모크 이미지 준비/재사용, QR, root/gateway, installer/Bun 스모크 작업이 별도의 install-smoke 샤드로 실행됨
- 저장소 E2E 레인
- 릴리스 경로 Docker 청크: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`
- 요청된 경우 `plugins-runtime-services` 청크 내부의 OpenWebUI 커버리지
- 분할된 번들 Plugin 설치/제거 레인
  `bundled-plugin-install-uninstall-0`부터
  `bundled-plugin-install-uninstall-23`까지
- 릴리스 검사가 live 스위트를 포함할 때 live/E2E provider 스위트와 Docker live 모델 커버리지

재실행하기 전에 Docker 아티팩트를 사용하세요. 릴리스 경로 스케줄러는 레인 로그, `summary.json`, `failures.json`, 단계 타이밍, 스케줄러 계획 JSON, 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 집중 복구에는 모든 릴리스 청크를 재실행하는 대신 재사용 가능한 live/E2E 워크플로에서 `docker_lanes=<lane[,lane]>`를 사용하세요. 생성된 재실행 명령에는 사용 가능한 경우 이전 `package_artifact_run_id`와 준비된 Docker 이미지 입력이 포함되므로, 실패한 레인이 동일한 tarball과 GHCR 이미지를 재사용할 수 있습니다.

### QA Lab

QA Lab 박스도 `OpenClaw Release Checks`의 일부입니다. 이는 Vitest 및 Docker 패키지 메커니즘과 별개의 에이전트 동작 및 채널 수준 릴리스 게이트입니다.

릴리스 QA Lab 커버리지에는 다음이 포함됩니다.

- 에이전트 패리티 팩을 사용해 OpenAI 후보 레인을 Opus 4.6 기준선과 비교하는 mock 패리티 레인
- `qa-live-shared` 환경을 사용하는 빠른 live Matrix QA 프로필
- Convex CI 자격 증명 임대를 사용하는 live Telegram QA 레인
- 릴리스 텔레메트리에 명시적인 로컬 증명이 필요할 때 `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` 또는
  `pnpm qa:observability:smoke`

이 박스는 "릴리스가 QA 시나리오와 live 채널 흐름에서 올바르게 동작하는가?"에 답하기 위해 사용하세요. 릴리스를 승인할 때 패리티, Matrix, Telegram 레인의 아티팩트 URL을 보관하세요. 전체 Matrix 커버리지는 기본 릴리스 핵심 레인이 아니라 수동 샤딩 QA-Lab 실행으로 계속 사용할 수 있습니다.

### 패키지

Package 박스는 설치 가능한 제품 게이트입니다. 이는 `Package Acceptance`와 리졸버 `scripts/resolve-openclaw-package-candidate.mjs`가 뒷받침합니다. 리졸버는 후보를 Docker E2E가 소비하는 `package-under-test` tarball로 정규화하고, 패키지 인벤토리를 검증하며, 패키지 버전과 SHA-256을 기록하고, 워크플로 하네스 ref를 패키지 소스 ref와 분리해 유지합니다.

지원되는 후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한 OpenClaw 릴리스
  버전
- `source=ref`: 선택한 `workflow_ref` 하네스와 함께 신뢰할 수 있는 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를
  패키징합니다
- `source=url`: 필수 `package_sha256`과 함께 공개 HTTPS `.tgz`를 다운로드합니다.
  URL 자격 증명, 기본값이 아닌 HTTPS 포트, 비공개/내부/특수 용도
  호스트명 또는 확인된 주소, 안전하지 않은 리디렉션은 거부됩니다
- `source=trusted-url`: `.github/package-trusted-sources.json`의
  명명된 정책에서 필수 `package_sha256` 및 `trusted_source_id`와 함께 HTTPS `.tgz`를
  다운로드합니다. `source=url`에 입력 수준의 비공개 네트워크 우회를 추가하는 대신,
  유지관리자가 소유한 엔터프라이즈 미러 또는 비공개 패키지 저장소에 이 값을 사용하세요
- `source=artifact`: 다른 GitHub Actions 실행에서 업로드한 `.tgz`를 재사용합니다

`OpenClaw Release Checks`는 `source=artifact`, 준비된 릴리스 패키지 아티팩트,
`suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`로 Package Acceptance를 실행합니다. Package Acceptance는 동일한 확인된
타볼에 대해 마이그레이션, 업데이트, 구성된 인증 업데이트 재시작, 라이브 ClawHub skill 설치, 오래된 plugin 의존성 정리, 오프라인 plugin
픽스처, plugin 업데이트, Telegram 패키지 QA를 유지합니다. 차단 릴리스 검사는 기본 최신 게시 패키지
기준선을 사용합니다. `run_release_soak=true`, `release_profile=stable` 또는
`release_profile=full`이 포함된 베타 프로필은 `2026.4.23`부터 `latest`까지
npm에 게시된 모든 안정 기준선과 보고된 이슈 픽스처로 확장됩니다. 이미 출시된 후보에는
`source=npm`으로 Package Acceptance를 사용하고, 게시 전 SHA 기반 로컬 npm 타볼에는
`source=ref`를 사용하며, 유지관리자가 소유한 엔터프라이즈/비공개 미러에는 `source=trusted-url`을,
다른 GitHub Actions 실행에서 업로드한 준비된 타볼에는 `source=artifact`를 사용하세요.
이는 이전에 Parallels가 필요했던 대부분의 패키지/업데이트 커버리지를 대체하는
GitHub 네이티브 대안입니다. OS별 온보딩, 설치 관리자, 플랫폼 동작에는 여전히 크로스 OS
릴리스 검사가 중요하지만, 패키지/업데이트 제품 검증에는 Package Acceptance를 우선 사용해야 합니다.

업데이트 및 plugin 검증의 표준 체크리스트는
[업데이트 및 plugin 테스트](/ko/help/testing-updates-plugins)입니다. plugin 설치/업데이트,
doctor 정리 또는 게시된 패키지 마이그레이션 변경을 증명할 로컬, Docker, Package Acceptance 또는
릴리스 검사 레인을 결정할 때 이를 사용하세요. 안정 `2026.4.23+` 패키지 전체에서의
포괄적인 게시 업데이트 마이그레이션은 별도의 수동 `Update Migration` 워크플로이며,
Full Release CI의 일부가 아닙니다.

레거시 package-acceptance 완화는 의도적으로 시간 제한이 있습니다. `2026.4.25`까지의 패키지는
npm에 이미 게시된 메타데이터 공백에 대해 호환성 경로를 사용할 수 있습니다. 여기에는 타볼에서 누락된
비공개 QA 인벤토리 항목, 누락된 `gateway install --wrapper`, 타볼에서 파생된 git
픽스처의 누락된 패치 파일, 누락된 지속 `update.channel`, 레거시 plugin 설치 기록
위치, 누락된 마켓플레이스 설치 기록 지속성, `plugins update` 중 구성 메타데이터
마이그레이션이 포함됩니다. 게시된 `2026.4.26` 패키지는 이미 출시된 로컬 빌드 메타데이터 스탬프 파일에 대해
경고할 수 있습니다. 이후 패키지는 최신 패키지 계약을 충족해야 하며, 동일한 공백은 릴리스
검증에 실패합니다.

릴리스 질문이 실제 설치 가능한 패키지에 관한 것일 때는 더 넓은 Package Acceptance 프로필을 사용하세요.

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

일반적인 패키지 프로필:

- `smoke`: 빠른 패키지 설치/채널/에이전트, Gateway 네트워크 및 구성
  다시 로드 레인
- `package`: 설치/업데이트/재시작/plugin 패키지 계약과 라이브 ClawHub
  skill 설치 증명. 이것이 릴리스 검사 기본값입니다
- `product`: `package`에 MCP 채널, cron/서브에이전트 정리, OpenAI 웹
  검색 및 OpenWebUI를 더한 값
- `full`: OpenWebUI가 포함된 Docker 릴리스 경로 청크
- `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 목록

패키지 후보 Telegram 증명에는 Package Acceptance에서 `telegram_mode=mock-openai` 또는
`telegram_mode=live-frontier`를 활성화하세요. 워크플로는 확인된
`package-under-test` 타볼을 Telegram 레인으로 전달합니다. 독립 실행형
Telegram 워크플로는 게시 후 검사를 위해 여전히 게시된 npm 사양을 허용합니다.

## 정규 릴리스 게시 자동화

베타, `latest`, plugin, GitHub Release 및 플랫폼 게시의 경우
`OpenClaw Release Publish`가 일반적인 변경 진입점입니다. 월간
`.33+` npm 전용 extended-stable 경로는 이 오케스트레이터를 사용하지 않습니다. 정규 워크플로는
릴리스에 필요한 순서대로 신뢰할 수 있는 게시자 워크플로를 오케스트레이션합니다.

1. 릴리스 태그를 체크아웃하고 해당 커밋 SHA를 확인합니다.
2. 태그가 `main` 또는 `release/*`에서 도달 가능한지 확인합니다.
3. `pnpm plugins:sync:check`를 실행합니다.
4. `publish_scope=all-publishable` 및 `ref=<release-sha>`로 `Plugin NPM Release`를
   디스패치합니다.
5. 동일한 범위와 SHA로 `Plugin ClawHub Release`를 디스패치합니다.
6. 저장된 `full_release_validation_run_id`를 확인한 뒤, 릴리스 태그, npm dist-tag 및
   저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 디스패치합니다.
7. 안정 릴리스의 경우 GitHub 릴리스를 초안으로 생성하거나 업데이트하고, 명시적
   `windows_node_tag`와 후보 승인된 `windows_node_installer_digests`로
   `Windows Node Release`를 디스패치한 다음, 초안을 게시하기 전에 표준
   설치 관리자/체크섬 자산을 확인합니다.

베타 게시 예시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

기본 베타 dist-tag로 안정 릴리스 게시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

`latest`로 직접 안정 승격하는 것은 명시적입니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

하위 수준 `Plugin NPM Release` 및 `Plugin ClawHub Release` 워크플로는
집중 복구 또는 재게시 작업에만 사용하세요. `OpenClaw Release Publish`는
`publish_openclaw_npm=true`일 때 `plugin_publish_scope=selected`를 거부하므로,
`@openclaw/diffs-language-pack`을 포함한 게시 가능한 모든 공식 plugin 없이는 코어
패키지를 출시할 수 없습니다. 선택한 plugin 복구의 경우
`publish_openclaw_npm=false`를 `plugin_publish_scope=selected` 및
`plugins=@openclaw/name`과 함께 설정하거나, 자식 워크플로를 직접 디스패치하세요.

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 허용합니다.

- `tag`: `v2026.4.2`, `v2026.4.2-1` 또는
  `v2026.4.2-beta.1` 같은 필수 릴리스 태그입니다. `preflight_only=true`일 때는
  검증 전용 프리플라이트를 위한 현재 전체 40자 워크플로 브랜치 커밋 SHA일 수도 있습니다
- `preflight_only`: 검증/빌드/패키지만 수행하려면 `true`, 실제 게시 경로는 `false`
- `preflight_run_id`: 실제 게시 경로에서 필수이며, 워크플로가 성공한 프리플라이트 실행의
  준비된 타볼을 재사용하도록 합니다
- `full_release_validation_run_id`: 실제 월간 extended-stable 및 정규
  비베타 게시에 필수이며, 워크플로가 정확한 검증 실행을 인증하도록 합니다
- `npm_dist_tag`: 게시 경로의 npm 대상 태그입니다. `alpha`, `beta`,
  `latest` 또는 `extended-stable`을 허용하며 기본값은 `beta`입니다. 최종 패치 `33` 이상은
  `extended-stable`을 사용해야 합니다. 기본적으로 `extended-stable`은 이전 패치를 거부하며,
  항상 비최종 태그를 거부합니다.
- `bypass_extended_stable_guard`: 테스트 전용 불리언이며 기본값은 `false`입니다.
  `npm_dist_tag=extended-stable`과 함께 사용하면 릴리스 ID, 아티팩트, 승인 및 읽기 확인 검사는 유지하면서
  월간 extended-stable 적격성을 우회합니다.

`OpenClaw Release Publish`는 다음 운영자 제어 입력을 허용합니다.

- `tag`: 필수 릴리스 태그이며, 이미 존재해야 합니다
- `preflight_run_id`: 성공한 `OpenClaw NPM Release` 프리플라이트 실행 id입니다.
  `publish_openclaw_npm=true`일 때 필수입니다
- `full_release_validation_run_id`: 성공한 `Full Release Validation` 실행
  id입니다. `publish_openclaw_npm=true`일 때 필수입니다
- `windows_node_tag`: 정확한 비프리릴리스 `openclaw/openclaw-windows-node`
  릴리스 태그입니다. 안정 OpenClaw 게시에 필수입니다
- `windows_node_installer_digests`: 현재 Windows 설치 관리자 이름을 고정된
  `sha256:` 다이제스트에 매핑한 후보 승인 compact JSON 맵입니다. 안정 OpenClaw 게시에
  필수입니다
- `npm_dist_tag`: OpenClaw 패키지의 npm 대상 태그
- `plugin_publish_scope`: 기본값은 `all-publishable`입니다. `selected`는
  `publish_openclaw_npm=false`와 함께 집중 plugin 전용 복구 작업에만 사용하세요
- `plugins`: `plugin_publish_scope=selected`일 때 쉼표로 구분된 `@openclaw/*` 패키지 이름
- `publish_openclaw_npm`: 기본값은 `true`입니다. 워크플로를 plugin 전용 복구 오케스트레이터로
  사용할 때만 `false`로 설정하세요
- `wait_for_clawhub`: 기본값은 `false`이므로 npm 가용성이 ClawHub 사이드카에 의해
  차단되지 않습니다. 워크플로 완료에 ClawHub 완료가 포함되어야 할 때만 `true`로 설정하세요

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 허용합니다.

- `ref`: 검증할 브랜치, 태그 또는 전체 커밋 SHA입니다. 시크릿이 필요한 검사는
  확인된 커밋이 OpenClaw 브랜치 또는 릴리스 태그에서 도달 가능해야 합니다.
- `run_release_soak`: 베타 릴리스 검사를 위해 포괄적인 라이브/E2E, Docker 릴리스 경로 및
  all-since upgrade-survivor soak에 참여합니다. `release_profile=stable` 및
  `release_profile=full`에 의해 강제로 켜집니다.

규칙:

- 패치 `33` 미만의 정규 최종 및 수정 버전은 `beta` 또는 `latest` 중 하나에
  게시할 수 있습니다. 패치 `33` 이상의 최종 버전은 `extended-stable`에 게시해야 하며,
  해당 경계의 수정 접미사 버전은 거부됩니다.
- 베타 프리릴리스 태그는 `beta`에만 게시할 수 있습니다
- `OpenClaw NPM Release`의 경우 전체 커밋 SHA 입력은 `preflight_only=true`일 때만
  허용됩니다
- `OpenClaw Release Checks` 및 `Full Release Validation`은 항상
  검증 전용입니다
- 실제 게시 경로는 프리플라이트 중 사용한 것과 동일한 `npm_dist_tag`를 사용해야 합니다.
  워크플로는 게시 전에 해당 메타데이터가 계속 유지되는지 확인합니다

## 정규 베타/latest 안정 릴리스 순서

이 레거시 순서는 plugin, GitHub Release, Windows 및 기타 플랫폼 작업도 소유하는
정규 오케스트레이션 릴리스용입니다. 이 페이지 상단에 문서화된 월간 `.33+` npm 전용
extended-stable 경로가 아닙니다.

정규 오케스트레이션 안정 릴리스를 만들 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다.
   - 태그가 존재하기 전에는 현재 전체 워크플로 브랜치 커밋
     SHA를 preflight 워크플로의 검증 전용 드라이런에 사용할 수 있습니다.
2. 일반적인 베타 우선 흐름에는 `npm_dist_tag=beta`를 선택하고, 의도적으로
   안정 버전을 바로 게시하려는 경우에만 `latest`를 선택합니다.
3. 하나의 수동 워크플로에서 일반 CI와 라이브 프롬프트 캐시, Docker, QA Lab,
   Matrix, Telegram 커버리지를 원할 때 릴리스 브랜치, 릴리스 태그 또는 전체
   커밋 SHA에서 `Full Release Validation`을 실행합니다.
4. 의도적으로 결정론적인 일반 테스트 그래프만 필요한 경우에는 대신 릴리스 ref에서
   수동 `CI` 워크플로를 실행합니다.
5. 서명된 x64 및 ARM64 설치 프로그램을 배포해야 하는 정확한 비프리릴리스
   `openclaw/openclaw-windows-node` 릴리스 태그를 선택합니다. 이를
   `windows_node_tag`로 저장하고, 검증된 digest 맵을
   `windows_node_installer_digests`로 저장합니다. 릴리스 후보 헬퍼는 둘 다
   기록하고 생성된 게시 명령에 포함합니다.
6. 성공한 `preflight_run_id`와 `full_release_validation_run_id`를 저장합니다.
7. 동일한 `tag`, 동일한 `npm_dist_tag`, 선택한 `windows_node_tag`, 저장된
   `windows_node_installer_digests`, 저장된 `preflight_run_id`, 저장된
   `full_release_validation_run_id`로 `OpenClaw Release Publish`를 실행합니다.
   이 워크플로는 OpenClaw npm 패키지를 승격하기 전에 외부화된 Plugin을 npm과
   ClawHub에 게시합니다.
8. 릴리스가 `beta`에 반영된 경우
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   워크플로를 사용해 해당 안정 버전을 `beta`에서 `latest`로 승격합니다.
9. 릴리스가 의도적으로 `latest`에 직접 게시되었고 `beta`가 같은 안정 빌드를
   즉시 따라가야 하는 경우, 동일한 릴리스 워크플로를 사용해 두 dist-tag가
   모두 안정 버전을 가리키도록 하거나, 예약된 자가 복구 동기화가 나중에
   `beta`를 이동하도록 둡니다.

dist-tag 변경은 여전히 `NPM_TOKEN`이 필요하기 때문에 릴리스 원장 리포지토리에
있으며, 소스 리포지토리는 OIDC 전용 게시를 유지합니다.

이렇게 하면 직접 게시 경로와 베타 우선 승격 경로가 모두 문서화되고 운영자가
볼 수 있게 유지됩니다.

관리자가 로컬 npm 인증으로 폴백해야 하는 경우, 모든 1Password CLI(`op`) 명령은
전용 tmux 세션 안에서만 실행합니다. 기본 에이전트 셸에서 `op`를 직접 호출하지
마세요. tmux 안에 유지하면 프롬프트, 알림, OTP 처리를 관찰할 수 있고 반복적인
호스트 알림을 방지할 수 있습니다.

## 공개 참고 자료

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

관리자는 실제 런북에 비공개 릴리스 문서인
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)를
사용합니다.

## 관련

- [릴리스 채널](/ko/install/development-channels)
