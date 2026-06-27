---
read_when:
    - 공개 릴리스 채널 정의를 찾는 중
    - 릴리스 검증 또는 패키지 승인 실행
    - 버전 명명과 릴리스 주기 확인 중
summary: 릴리스 레인, 운영자 체크리스트, 검증 박스, 버전 명명 및 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-06-27T18:06:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw에는 세 가지 공개 릴리스 레인이 있습니다.

- 안정판: 기본적으로 npm `beta`에 게시되거나, 명시적으로 요청된 경우 npm `latest`에 게시되는 태그된 릴리스
- 베타: npm `beta`에 게시되는 사전 릴리스 태그
- 개발: `main`의 이동하는 최신 헤드

## 버전 명명

- 안정판 릴리스 버전: `YYYY.M.PATCH`
  - Git 태그: `vYYYY.M.PATCH`
- 안정판 수정 릴리스 버전: `YYYY.M.PATCH-N`
  - Git 태그: `vYYYY.M.PATCH-N`
- 베타 사전 릴리스 버전: `YYYY.M.PATCH-beta.N`
  - Git 태그: `vYYYY.M.PATCH-beta.N`
- 월 또는 패치에 0을 채우지 마세요
- 2026년 6월 릴리스 프로세스 업데이트부터 세 번째 구성 요소는 달력 날짜가 아니라
  순차적인 월간 릴리스 트레인 번호입니다. 안정판 및 베타
  릴리스가 현재 트레인을 결정하며, 알파 전용 태그는 베타/안정판 패치 번호를 소비하거나
  증가시키지 않습니다. 업데이트 이전 태그와 npm 버전은
  기존 이름을 유지하며 계속 유효합니다. 릴리스 자동화는 계속해서
  연도, 월, 패치, 채널, 사전 릴리스 또는 수정
  번호를 기준으로 비교합니다.
- 알파/나이틀리 빌드는 다음 미릴리스 패치 트레인을 사용하고 반복 빌드에 대해서는
  `alpha.N`만 증가시킵니다. 해당 패치에 베타가 생기면, 새 알파 빌드는
  다음 패치로 이동합니다. 베타 또는 안정판 트레인을 선택할 때 패치
  번호가 더 높은 기존 알파 전용 태그는 무시하세요.
- npm 버전은 변경할 수 없습니다. 베타 태그가 이미 게시된 경우,
  삭제하거나, 다시 게시하거나, 재사용하지 마세요. 대신 다음 베타 번호 또는 다음 월간
  패치를 만드세요. 전환 기간 중 `2026.6.5-beta.1`이 이미 게시되었으므로,
  2026년 6월 릴리스 트레인은 패치 `5` 이상을 사용해야 합니다. 새 2026년 6월 안정판 또는
  베타 트레인을 `2026.6.2`, `2026.6.3`, 또는
  `2026.6.4`로 게시하지 마세요.
- 안정판 `2026.6.5` 이후 다음 새 베타 트레인은
  패치 번호가 더 높은 자동화된 알파 전용 태그가 이미 있더라도 `2026.6.6-beta.1`입니다.
- `latest`는 현재 승격된 안정판 npm 릴리스를 의미합니다
- `beta`는 현재 베타 설치 대상을 의미합니다
- 안정판 및 안정판 수정 릴리스는 기본적으로 npm `beta`에 게시됩니다. 릴리스 운영자는 `latest`를 명시적으로 대상으로 지정하거나, 검증된 베타 빌드를 나중에 승격할 수 있습니다
- 모든 안정판 OpenClaw 릴리스는 npm 패키지, macOS 앱, 서명된
  Windows Hub 설치 프로그램을 함께 제공합니다. 베타 릴리스는 일반적으로
  먼저 npm/패키지 경로를 검증하고 게시하며, 네이티브 앱 빌드/서명/공증/승격은
  명시적으로 요청되지 않는 한 안정판용으로 보류됩니다

## 릴리스 주기

- 릴리스는 베타 우선으로 진행됩니다
- 안정판은 최신 베타가 검증된 후에만 이어집니다
- 유지 관리자는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.PATCH` 브랜치에서
  릴리스를 만들므로, 릴리스 검증과 수정이 `main`의 새
  개발을 막지 않습니다
- 베타 태그가 푸시되었거나 게시된 뒤 수정이 필요한 경우, 유지 관리자는
  이전 베타 태그를 삭제하거나 다시 만드는 대신 다음 `-beta.N` 태그를 만듭니다
- 자세한 릴리스 절차, 승인, 자격 증명, 복구 메모는
  유지 관리자 전용입니다

## 릴리스 운영자 체크리스트

이 체크리스트는 릴리스 흐름의 공개 형태입니다. 비공개 자격 증명,
서명, 공증, dist-tag 복구, 긴급 롤백 세부 사항은
유지 관리자 전용 릴리스 런북에 보관됩니다.

1. 현재 `main`에서 시작하세요. 최신 변경 사항을 가져오고, 대상 커밋이 푸시되었는지 확인하며,
   현재 `main` CI가 브랜치를 만들기에 충분히 정상인지 확인합니다.
2. 마지막으로 도달 가능한 릴리스 태그 이후 병합된 PR과 모든 직접
   커밋에서 최상단 `CHANGELOG.md` 섹션을 생성합니다. 항목은 사용자 관점으로 유지하고,
   겹치는 PR/직접 커밋 항목을 중복 제거한 뒤, 재작성 내용을 커밋하고, 푸시하고,
   브랜치를 만들기 전에 한 번 더 리베이스/풀합니다.
3. `src/plugins/compat/registry.ts` 및
   `src/commands/doctor/shared/deprecation-compat.ts`의 릴리스 호환성 기록을 검토합니다. 업그레이드 경로가 계속
   보장되는 경우에만 만료된 호환성을 제거하거나, 의도적으로 유지하는 이유를
   기록합니다.
4. 현재 `main`에서 `release/YYYY.M.PATCH`를 생성합니다. 일반 릴리스 작업을
   `main`에서 직접 수행하지 마세요.
5. 의도한 태그에 필요한 모든 버전 위치를 올린 다음
   `pnpm release:prep`을 실행합니다. 이 명령은 Plugin 버전, Plugin 인벤토리, 구성
   스키마, 번들 채널 구성 메타데이터, 구성 문서 기준선, Plugin SDK
   내보내기, Plugin SDK API 기준선을 올바른 순서로 새로 고칩니다. 태그를 만들기 전에 생성된
   차이가 있으면 커밋하세요. 그런 다음 로컬 결정적 사전 점검을 실행합니다:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm release:check`.
6. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다. 태그가 존재하기 전에는
   전체 40자 릴리스 브랜치 SHA를 검증 전용
   사전 점검에 사용할 수 있습니다. 사전 점검은
   정확히 체크아웃된 의존성 그래프에 대한 의존성 릴리스 증거를 생성하고 npm 사전 점검
   아티팩트에 저장합니다. 성공한 `preflight_run_id`를 저장하세요.
7. 릴리스 브랜치, 태그, 또는 전체 커밋 SHA에 대해
   `Full Release Validation`으로 모든 사전 릴리스 테스트를 시작합니다. 이것은 네 가지 큰 릴리스 테스트 박스인
   Vitest, Docker, QA Lab, Package의 단일 수동 진입점입니다.
8. 검증이 실패하면 릴리스 브랜치에서 수정하고,
   수정을 입증하는 가장 작은 실패 파일, 레인, 워크플로 작업, 패키지 프로필, 제공자, 또는 모델 허용 목록을
   다시 실행합니다. 변경된 표면 때문에 기존 증거가 오래된 경우에만
   전체 우산 검증을 다시 실행하세요.
9. 태그된 베타 후보의 경우, 일치하는
   `release/YYYY.M.PATCH` 브랜치에서
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`을 실행합니다. 안정판의 경우 필요한 Windows 소스
   릴리스도 전달합니다:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   이 헬퍼는 로컬 생성 릴리스 검사를 실행하고,
   전체 릴리스 검증 및 npm 사전 점검 증거를 디스패치하거나 확인하며, 정확히 준비된 tarball에 대한 Parallels
   신규/업데이트 증명과 Telegram 패키지
   증명을 실행하고, Plugin npm 및 ClawHub 계획을 기록하며, 증거 번들이 정상일 때만 정확한
   `OpenClaw Release Publish` 명령을 출력합니다.
   `OpenClaw Release Publish`는 선택된 또는 게시 가능한 모든 Plugin
   패키지를 npm에 디스패치하고 동일한 집합을 ClawHub에 병렬로 디스패치한 다음,
   Plugin npm 게시가 성공하는 즉시 준비된 OpenClaw npm 사전 점검 아티팩트를 일치하는 dist-tag로 승격합니다.
   OpenClaw npm 게시 자식 작업이 성공한 뒤에는 완전하게 일치하는
   `CHANGELOG.md` 섹션에서 일치하는 GitHub 릴리스/사전 릴리스 페이지를 생성하거나 업데이트합니다. npm `latest`에 게시된 안정판 릴리스는
   GitHub 최신 릴리스가 됩니다. npm `beta`에 유지되는 안정판 유지보수 릴리스는
   GitHub `latest=false`로 생성됩니다. 워크플로는 또한 사전 점검
   의존성 증거, 전체 검증 매니페스트, 게시 후 레지스트리
   확인 증거를 GitHub 릴리스에 업로드하여 릴리스 후 사고
   대응에 사용합니다. 게시 워크플로는 자식 실행 ID를 즉시 출력하고,
   워크플로 토큰이 승인할 수 있는 릴리스 환경 게이트를 자동 승인하며,
   실패한 자식 작업을 로그 꼬리와 함께 요약하고, OpenClaw npm 게시가 성공하는 즉시 GitHub 릴리스와 의존성
   증거를 마무리하며, OpenClaw npm을 게시하는 경우 ClawHub를 기다린 다음
   `pnpm release:verify-beta`를 실행하고
   GitHub 릴리스, npm 패키지, 선택된
   Plugin npm 패키지, 선택된 ClawHub 패키지, 자식 워크플로 실행 ID, 선택적 NPM Telegram 실행 ID에 대한 게시 후 증거를 업로드합니다. ClawHub 경로는 일시적인 CLI
   의존성 설치 실패를 재시도하고, 하나의
   미리 보기 셀이 일시적으로 실패하더라도 미리 보기를 통과한 Plugin을 게시하며, 모든 예상
   Plugin 버전에 대한 레지스트리 확인으로 끝나므로 부분 게시가 계속 표시되고 재시도 가능합니다. 그런 다음 게시된
   `openclaw@YYYY.M.PATCH-beta.N` 또는
   `openclaw@beta` 패키지에 대해 게시 후
   패키지 수용 검사를 실행합니다. 푸시되었거나 게시된 사전 릴리스에 수정이 필요한 경우,
   다음으로 일치하는 사전 릴리스 번호를 만드세요. 이전
   사전 릴리스를 삭제하거나 다시 작성하지 마세요.
10. 안정판의 경우 검증된 베타 또는 릴리스 후보에
    필요한 검증 증거가 있는 후에만 계속합니다. 안정판 npm 게시도
    `OpenClaw Release Publish`를 통해 진행되며,
    `preflight_run_id`를 통해 성공한 사전 점검 아티팩트를 재사용합니다. 안정판 macOS 릴리스 준비 상태에는
    패키지된 `.zip`, `.dmg`, `.dSYM.zip`, 그리고 `main`의 업데이트된 `appcast.xml`도 필요합니다.
    macOS 게시 워크플로는 릴리스 자산 확인 후 서명된 appcast를 공개 `main`에
    자동으로 게시합니다. 브랜치 보호가 직접 푸시를 차단하면,
    appcast PR을 열거나 업데이트합니다. 안정판 Windows Hub
    준비 상태에는 OpenClaw GitHub 릴리스의 서명된 `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe`, 및
    `OpenClawCompanion-SHA256SUMS.txt` 자산이 필요합니다.
    정확히 서명된 `openclaw/openclaw-windows-node` 릴리스 태그를
    `windows_node_tag`로, 후보 승인 설치 프로그램 다이제스트 맵을
    `windows_node_installer_digests`로 전달합니다. `OpenClaw Release Publish`는
    릴리스 초안을 유지하고, `Windows Node Release`를 디스패치하며, 게시 전에 세 가지
    자산을 모두 확인합니다.
11. 게시 후 npm 게시 후 확인기를 실행하고, 게시 후 채널 증명이 필요할 때 선택적 독립 실행형
    게시된 npm Telegram E2E를 실행하며,
    필요하면 dist-tag 승격을 수행하고, 생성된 GitHub 릴리스 페이지를 확인하고,
    릴리스 공지 단계를 실행한 다음, 안정판 릴리스를 완료했다고 하기 전에 [안정판 main
    마무리](#stable-main-closeout)를 완료합니다.

## 안정판 main 마무리

`main`이 실제 배포된
릴리스 상태를 포함하기 전까지 안정판 게시는 완료된 것이 아닙니다.

1. 새로운 최신 `main`에서 시작합니다. 이를 기준으로 `release/YYYY.M.PATCH`를 감사하고
   `main`에 없는 실제 수정 사항을 포워드 포트합니다. 릴리스 전용 호환성,
   테스트 또는 검증 어댑터를 더 새로운 `main`에 무작정 병합하지 마세요.
2. `main`을 추측성 다음 열차가 아니라 배포된 안정 버전으로 설정합니다. 루트 버전 변경 후
   `pnpm release:prep`을 실행한 다음
   `pnpm deps:shrinkwrap:generate`를 실행합니다.
3. `main`의 `CHANGELOG.md` `## YYYY.M.PATCH` 섹션이 태그된 릴리스 브랜치와
   정확히 일치하게 합니다. mac 릴리스가 게시한 경우 안정 `appcast.xml` 업데이트를
   포함합니다.
4. 운영자가 해당 릴리스 열차를 명시적으로 시작하기 전까지 `YYYY.M.PATCH+1`, 베타 버전,
   또는 비어 있는 향후 변경 로그 섹션을 `main`에 추가하지 마세요.
5. `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, 그리고
   `OPENCLAW_TESTBOX=1 pnpm check:changed`를 실행합니다. 푸시한 다음, 안정 릴리스가
   완료되었다고 하기 전에 `origin/main`에 배포된 버전과 변경 로그가 포함되어 있는지
   확인합니다.
6. 각 비공개 롤백 드릴 후 리포지터리 변수 `RELEASE_ROLLBACK_DRILL_ID`와
   `RELEASE_ROLLBACK_DRILL_DATE`를 최신 상태로 유지합니다.
   `OpenClaw Stable Main Closeout`은 안정 버전 게시 후 배포된 버전, 변경 로그, appcast를
   포함하는 `main` 푸시에서 시작합니다. 이는 변경 불가능한 게시 후 증거를 읽어 배포된
   태그를 전체 릴리스 검증 및 게시 실행에 연결한 다음, 안정 main 상태, 릴리스,
   필수 안정 소크, 차단 성능 증거를 검증합니다. 변경 불가능한 마감 매니페스트와 체크섬을
   GitHub 릴리스에 첨부합니다. 자동 푸시 트리거는 변경 불가능한 게시 후 증거보다 오래된
   레거시 릴리스를 건너뛰며, 이 건너뛰기를 완료된 마감으로 처리하지 않습니다. 완전한
   마감에는 두 자산과 일치하는 체크섬이 모두 필요합니다. 부분 매니페스트는 기록된
   `main` SHA와 롤백 드릴을 재생해 동일한 바이트를 다시 생성한 다음 누락된 체크섬을
   첨부합니다. 유효하지 않은 쌍이나 매니페스트 없는 체크섬은 계속 차단 상태로 남습니다.
   롤백 드릴 리포지터리 변수 없이 푸시로 트리거된 실행은 마감을 완료하지 않고 건너뜁니다.
   누락되었거나 90일이 넘은 드릴 기록은 수동 증거 기반 마감을 계속 차단합니다. 비공개
   복구 명령은 메인테이너 전용 런북에 남아 있습니다.
   수동 디스패치는 증거 기반 안정 마감을 복구하거나 재생할 때만 사용하세요.
   레거시 폴백 수정 태그는 수정 태그가 기본 안정 태그와 동일한 소스 커밋으로 해석되는
   경우에만 기본 패키지 증거를 재사용할 수 있습니다.
   소스가 다른 수정은 자체 패키지 증거를 게시하고 검증해야 합니다.

## 릴리스 사전 점검

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하여 테스트 TypeScript가 더 빠른 로컬 `pnpm check` 게이트 밖에서도 계속 적용되도록 합니다
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하여 더 광범위한 import cycle 및 아키텍처 경계 검사가 더 빠른 로컬 게이트 밖에서도 green 상태가 되도록 합니다
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하여 pack 검증 단계에 필요한 예상 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 합니다
- 루트 버전 bump 이후, tagging 전에 `pnpm release:prep`을 실행합니다. 이는 버전/config/API 변경 후 흔히 drift가 발생하는 모든 결정적 릴리스 생성기를 실행합니다: plugin 버전, plugin inventory, base config schema, bundled channel config metadata, config docs baseline, plugin SDK exports, plugin SDK API baseline. `pnpm release:check`는 해당 guard들을 check mode로 다시 실행하고, package release checks를 실행하기 전에 발견한 모든 generated drift failure를 한 번에 보고합니다.
- Plugin version sync는 기본적으로 official plugin package versions와 기존 `openclaw.compat.pluginApi` floors를 OpenClaw 릴리스 버전으로 업데이트합니다. 해당 필드는 단순한 package version 복사본이 아니라 plugin SDK/runtime API floor로 취급하세요. 의도적으로 더 오래된 OpenClaw host와 호환되는 plugin-only 릴리스의 경우 floor를 지원되는 가장 오래된 host API로 유지하고, 그 선택을 plugin release proof에 문서화하세요.
- 릴리스 승인 전에 수동 `Full Release Validation` workflow를 실행하여 하나의 entrypoint에서 모든 pre-release test box를 시작합니다. branch, tag, 또는 full commit SHA를 받고, 수동 `CI`를 dispatch하며, install smoke, package acceptance, cross-OS package checks, QA Lab parity, Matrix, Telegram lanes용 `OpenClaw Release Checks`를 dispatch합니다. Stable 및 full run은 항상 exhaustive live/E2E와 Docker release-path soak을 포함합니다. `run_release_soak=true`는 명시적 beta soak을 위해 유지됩니다. Package Acceptance는 candidate validation 중 canonical package Telegram E2E를 제공하여 두 번째 concurrent live poller를 피합니다.
  beta를 publish한 후 `release_package_spec`을 제공하면 release tarball을 다시 빌드하지 않고도 release checks, Package Acceptance, package Telegram E2E 전반에서 ship된 npm package를 재사용할 수 있습니다. Telegram이 release validation의 나머지 부분과 다른 published package를 사용해야 할 때만 `npm_telegram_package_spec`을 제공하세요. Package Acceptance가 release package spec과 다른 published package를 사용해야 할 때는 `package_acceptance_package_spec`을 제공하세요. release evidence report가 Telegram E2E를 강제하지 않고 validation이 published npm package와 일치함을 증명해야 할 때는 `evidence_package_spec`을 제공하세요.
  예:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- release work가 계속되는 동안 package candidate에 대한 side-channel proof가 필요할 때 수동 `Package Acceptance` workflow를 실행합니다. `openclaw@beta`, `openclaw@latest`, 또는 정확한 release version에는 `source=npm`을 사용하세요. 현재 `workflow_ref` harness로 신뢰할 수 있는 `package_ref` branch/tag/SHA를 pack하려면 `source=ref`를 사용하세요. 필수 SHA-256과 엄격한 public URL policy가 있는 public HTTPS tarball에는 `source=url`을 사용하세요. 필수 `trusted_source_id`와 SHA-256을 사용하는 named trusted-source policy에는 `source=trusted-url`을 사용하세요. 다른 GitHub Actions run에서 upload한 tarball에는 `source=artifact`를 사용하세요. workflow는 candidate를 `package-under-test`로 resolve하고, 해당 tarball에 대해 Docker E2E release scheduler를 재사용하며, `telegram_mode=mock-openai` 또는 `telegram_mode=live-frontier`로 같은 tarball에 대해 Telegram QA를 실행할 수 있습니다. 선택한 Docker lane에 `published-upgrade-survivor`가 포함된 경우 package artifact가 candidate이고 `published_upgrade_survivor_baseline`이 published baseline을 선택합니다. `update-restart-auth`는 candidate package를 installed CLI와 package-under-test 양쪽으로 사용하므로 candidate update command의 managed restart path를 실행합니다.
  예: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  일반 profile:
  - `smoke`: install/channel/agent, gateway network, config reload lanes
  - `package`: OpenWebUI 또는 live ClawHub 없이 artifact-native package/update/restart/plugin lanes
  - `product`: package profile에 MCP channels, cron/subagent cleanup,
    OpenAI web search, OpenWebUI 추가
  - `full`: OpenWebUI가 포함된 Docker release-path chunks
  - `custom`: focused rerun을 위한 정확한 `docker_lanes` selection
- release candidate에 대해 결정적인 일반 CI coverage만 필요할 때는 수동 `CI` workflow를 직접 실행합니다. Manual CI dispatch는 changed scoping을 bypass하고 Linux Node shards, bundled-plugin shards, plugin 및 channel contract shards, Node 22 compatibility, `check-*`, `check-additional-*`, built-artifact smoke checks, docs checks, Python skills, Windows, macOS, Control UI i18n lanes를 강제합니다. Standalone manual CI run은 `include_android=true`로 dispatch된 경우에만 Android를 실행합니다. `Full Release Validation`은 해당 input을 CI child에 전달합니다.
  Android 포함 예: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- release telemetry를 검증할 때 `pnpm qa:otel:smoke`를 실행합니다. 이는 local OTLP/HTTP receiver를 통해 QA-lab을 실행하고, Opik, Langfuse 또는 다른 external collector 없이 trace, metric, log export와 bounded trace attributes 및 content/identifier redaction을 검증합니다.
- collector compatibility를 검증할 때 `pnpm qa:otel:collector-smoke`를 실행합니다. 이는 local receiver assertion 전에 동일한 QA-lab OTLP export를 실제 OpenTelemetry Collector Docker container를 통해 route합니다.
- protected Prometheus scraping을 검증할 때 `pnpm qa:prometheus:smoke`를 실행합니다. 이는 QA-lab을 실행하고, 인증되지 않은 scrape을 거부하며, release-critical metric families에 prompt content, raw identifiers, auth tokens, local paths가 없는지 검증합니다.
- source-checkout OpenTelemetry 및 Prometheus smoke lanes를 연속으로 실행하려면 `pnpm qa:observability:smoke`를 실행합니다.
- 모든 tagged release 전에 `pnpm release:check`를 실행합니다
- `OpenClaw NPM Release` 사전 점검은 npm tarball을 pack하기 전에 dependency release evidence를 생성합니다. npm advisory vulnerability gate는 release-blocking입니다. transitive manifest risk, dependency ownership/install surface, dependency change reports는 release evidence 전용입니다. dependency change report는 release candidate를 이전 reachable release tag와 비교합니다.
- 사전 점검은 dependency evidence를 `openclaw-release-dependency-evidence-<tag>`로 upload하며, 준비된 npm preflight artifact 내부의 `dependency-evidence/` 아래에도 embed합니다. 실제 publish path는 해당 preflight artifact를 재사용한 뒤, 같은 evidence를 GitHub release에 `openclaw-<version>-dependency-evidence.zip`으로 attach합니다.
- tag가 존재한 뒤 변경을 수행하는 publish sequence에는 `OpenClaw Release Publish`를 실행합니다. `release/YYYY.M.PATCH`에서 dispatch하거나 main-reachable tag를 publish할 때는 `main`에서 dispatch하고, release tag, successful OpenClaw npm `preflight_run_id`, successful `full_release_validation_run_id`를 전달하며, 의도적으로 focused repair를 실행하는 경우가 아니라면 기본 plugin publish scope `all-publishable`을 유지하세요. workflow는 core package가 externalized plugins보다 먼저 publish되지 않도록 plugin npm publish, plugin ClawHub publish, OpenClaw npm publish를 직렬화합니다.
- Stable `OpenClaw Release Publish`는 matching non-prerelease `openclaw/openclaw-windows-node` release가 존재한 후 정확한 `windows_node_tag`를 요구합니다. 또한 candidate-approved `windows_node_installer_digests` map도 요구합니다. publish child를 dispatch하기 전에 source release가 published, non-prerelease이고, required x64/ARM64 installers를 포함하며, approved map과 여전히 일치하는지 검증합니다. 그런 다음 OpenClaw release가 아직 draft인 동안 `Windows Node Release`를 dispatch하고 pinned installer digest map을 변경 없이 전달합니다. child workflow는 해당 정확한 tag에서 signed Windows Hub installers를 download하고, pinned digests와 match하며, Windows runner에서 Authenticode signature가 예상 OpenClaw Foundation signer를 사용하는지 검증하고, SHA-256 manifest를 작성한 뒤 installers와 manifest를 canonical OpenClaw GitHub release에 upload한 다음, promoted assets를 다시 download하여 manifest membership과 hash를 검증합니다. parent는 publication 전에 현재 x64, ARM64, checksum asset contract를 검증합니다. Direct recovery는 예상 contract assets를 pinned source bytes로 교체하기 전에 예기치 않은 `OpenClawCompanion-*` asset names를 거부합니다. `Windows Node Release`는 recovery 목적으로만 수동 dispatch하고, 항상 `latest`가 아니라 정확한 tag와 approved source release의 명시적 `expected_installer_digests` JSON map을 전달하세요. Website download links는 현재 stable release의 정확한 OpenClaw release asset URLs를 target해야 하며, GitHub의 latest redirect가 동일한 release를 가리키는지 검증한 후에만 `releases/latest/download/...`를 사용할 수 있습니다. companion repo release page만 link하지 마세요.
- Release checks는 이제 별도의 수동 workflow에서 실행됩니다:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`는 릴리스 승인 전에 QA Lab mock parity lane과 빠른 live Matrix profile 및 Telegram QA lane도 실행합니다. live lanes는 `qa-live-shared` environment를 사용합니다. Telegram은 Convex CI credential leases도 사용합니다. 전체 Matrix transport, media, E2EE inventory를 병렬로 실행하려면 수동 `QA-Lab - All Lanes` workflow를 `matrix_profile=all` 및 `matrix_shards=true`로 실행하세요.
- Cross-OS install 및 upgrade runtime validation은 public `OpenClaw Release Checks`와 `Full Release Validation`의 일부이며, 이들은 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`을 직접 호출합니다
- 이 분리는 의도적입니다. 실제 npm release path를 짧고 결정적이며 artifact-focused로 유지하고, 더 느린 live checks는 자체 lane에 두어 publish를 stall하거나 block하지 않게 합니다
- secret을 포함하는 release checks는 `Full Release
Validation`을 통해 dispatch하거나 `main`/release workflow ref에서 dispatch하여 workflow logic과 secrets가 통제되도록 해야 합니다
- `OpenClaw Release Checks`는 resolved commit이 OpenClaw branch 또는 release tag에서 reachable한 한 branch, tag, 또는 full commit SHA를 받습니다
- `OpenClaw NPM Release` validation-only preflight도 pushed tag를 요구하지 않고 현재 full 40-character workflow-branch commit SHA를 받습니다
- 해당 SHA path는 validation-only이며 실제 publish로 promote할 수 없습니다
- SHA mode에서 workflow는 package metadata check를 위해서만 `v<package.json version>`을 synthesize합니다. 실제 publish에는 여전히 실제 release tag가 필요합니다
- 두 workflow 모두 실제 publish 및 promotion path는 GitHub-hosted runners에 유지하고, non-mutating validation path는 더 큰 Blacksmith Linux runners를 사용할 수 있습니다
- 해당 workflow는 `OPENAI_API_KEY`와 `ANTHROPIC_API_KEY` workflow secrets를 모두 사용하여
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  를 실행합니다
- npm release preflight는 더 이상 별도의 release checks lane을 기다리지 않습니다
- release candidate를 로컬에서 tagging하기 전에 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`를 실행하세요. helper는 GitHub publish workflow가 시작되기 전에 일반적인 approval-blocking mistake를 잡아내는 순서로 fast release guardrails, plugin npm/ClawHub release checks, build, UI build, `release:openclaw:npm:check`를 실행합니다.
- 승인 전에 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (또는 matching beta/correction tag)를 실행합니다
- npm publish 후 실행합니다
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (또는 일치하는 beta/수정 버전)를 실행해 새 임시 prefix에서 게시된 registry
  설치 경로를 검증합니다
- beta 게시 후에는 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`를 실행해
  공유 임대 Telegram 자격 증명 풀을 사용하여 게시된 npm 패키지에 대해 설치된 패키지
  온보딩, Telegram 설정, 실제 Telegram E2E를 검증합니다. 로컬 maintainer의 일회성 실행은
  Convex 변수를 생략하고 세 개의 `OPENCLAW_QA_TELEGRAM_*` env 자격 증명을 직접 전달할 수 있습니다.
- maintainer 머신에서 전체 게시 후 beta smoke를 실행하려면 `pnpm release:beta-smoke -- --beta betaN`을 사용합니다. 이 helper는 Parallels npm 업데이트/새 대상 검증을 실행하고, `NPM Telegram Beta E2E`를 dispatch하고, 정확한 workflow run을 폴링하며, artifact를 다운로드하고 Telegram 보고서를 출력합니다.
- Maintainer는 수동 `NPM Telegram Beta E2E` workflow를 통해 GitHub Actions에서 동일한 게시 후 검사를 실행할 수 있습니다. 이는 의도적으로 수동 전용이며
  모든 merge마다 실행되지 않습니다.
- Maintainer release 자동화는 이제 preflight-then-promote를 사용합니다:
  - 실제 npm publish는 성공한 npm `preflight_run_id`를 통과해야 합니다
  - 실제 npm publish는 성공한 preflight run과 동일한 `main` 또는
    `release/YYYY.M.PATCH` branch에서 dispatch되어야 합니다
  - stable npm release는 기본적으로 `beta`를 사용합니다
  - stable npm publish는 workflow input을 통해 명시적으로 `latest`를 대상으로 할 수 있습니다
  - token 기반 npm dist-tag 변경은 이제
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`에 있습니다. source repo는
    OIDC 전용 publish를 유지하지만 `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하기 때문입니다
  - public `macOS Release`는 검증 전용입니다. tag가 release branch에만 있고
    workflow가 `main`에서 dispatch되는 경우
    `public_release_branch=release/YYYY.M.PATCH`를 설정합니다
  - 실제 macOS publish는 성공한 macOS `preflight_run_id`와
    `validate_run_id`를 통과해야 합니다
  - 실제 publish 경로는 artifact를 다시 빌드하는 대신 준비된 artifact를 승격합니다
- `YYYY.M.PATCH-N` 같은 stable 수정 release의 경우, 게시 후 verifier는
  `YYYY.M.PATCH`에서 `YYYY.M.PATCH-N`으로의 동일한 임시 prefix upgrade 경로도 검사하여
  release 수정이 오래된 global install을 base stable payload에 조용히 남겨두지 않도록 합니다
- npm release preflight는 tarball에 `dist/control-ui/index.html`과 비어 있지 않은
  `dist/control-ui/assets/` payload가 모두 포함되어 있지 않으면 fail closed되어,
  빈 browser dashboard를 다시 ship하지 않도록 합니다
- 게시 후 검증은 게시된 Plugin entrypoint와 package metadata가 설치된 registry layout에 있는지도 검사합니다. Plugin runtime payload가 누락된 release는 postpublish verifier에 실패하며
  `latest`로 승격될 수 없습니다.
- `pnpm test:install:smoke`는 candidate update tarball에 대한 npm pack `unpackedSize` 예산도 강제하므로,
  installer e2e가 release publish 경로 전에 우발적인 pack bloat를 잡아냅니다
- release 작업이 CI planning, extension timing manifest, 또는
  extension test matrix를 변경했다면, 승인 전에 `.github/workflows/plugin-prerelease.yml`의 planner 소유
  `plugin-prerelease-extension-shard` matrix 출력을 다시 생성하고 검토하여 release note가
  오래된 CI layout을 설명하지 않도록 합니다
- Stable macOS release 준비 상태에는 updater surface도 포함됩니다:
  - GitHub release에는 packaged `.zip`, `.dmg`, `.dSYM.zip`이 최종적으로 포함되어야 합니다
  - `main`의 `appcast.xml`은 publish 후 새 stable zip을 가리켜야 합니다. macOS publish workflow가 이를 자동으로 commit하거나, direct push가 차단되면 appcast
    PR을 엽니다
  - packaged app은 해당 release version에 대한 canonical Sparkle build floor 이상인 non-debug bundle id, 비어 있지 않은 Sparkle feed
    URL, 그리고 `CFBundleVersion`을 유지해야 합니다

## 릴리스 테스트 박스

`Full Release Validation`은 운영자가 하나의 진입점에서 모든 사전 릴리스 테스트를 시작하는 방법입니다. 빠르게 움직이는 브랜치에서 고정된 커밋 증명을 위해서는 헬퍼를 사용하여 모든 자식 workflow가 대상 SHA에 고정된 임시 브랜치에서 실행되도록 하세요.

```bash
pnpm ci:full-release --sha <full-sha>
```

헬퍼는 `release-ci/<sha>-...`를 푸시하고, 해당 브랜치에서 `ref=<sha>`로 `Full Release Validation`을 디스패치하며, 모든 자식 workflow의 `headSha`가 대상과 일치하는지 검증한 다음 임시 브랜치를 삭제합니다. 이렇게 하면 실수로 더 새로운 `main` 자식 실행을 증명하는 일을 피할 수 있습니다.

릴리스 브랜치 또는 태그 검증의 경우, 신뢰할 수 있는 `main` workflow ref에서 실행하고 릴리스 브랜치 또는 태그를 `ref`로 전달하세요.

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

workflow는 대상 ref를 해석하고, `target_ref=<release-ref>`로 수동 `CI`를 디스패치한 다음 `OpenClaw Release Checks`를 디스패치합니다. `OpenClaw Release Checks`는 install smoke, cross-OS 릴리스 검사, soak가 활성화된 경우 live/E2E Docker 릴리스 경로 커버리지, 표준 Telegram 패키지 E2E가 포함된 Package Acceptance, QA Lab parity, live Matrix, live Telegram으로 분산 실행됩니다. 전체/all 실행은 `Full Release Validation` 요약에 `normal_ci`, `plugin_prerelease`, `release_checks`가 성공으로 표시될 때만 허용됩니다. 단, 집중 rerun에서 별도 `Plugin Prerelease` 자식을 의도적으로 건너뛴 경우는 예외입니다. 독립 실행형 `npm-telegram` 자식은 `release_package_spec` 또는 `npm_telegram_package_spec`이 있는 집중 published-package rerun에만 사용하세요. 최종 verifier 요약에는 각 자식 실행의 가장 느린 작업 테이블이 포함되어 있어 릴리스 관리자가 로그를 다운로드하지 않고도 현재 critical path를 확인할 수 있습니다. 전체 단계 매트릭스, 정확한 workflow 작업 이름, stable과 full 프로필 차이, artifacts, 집중 rerun 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을 참고하세요.
자식 workflow는 `Full Release Validation`을 실행하는 신뢰할 수 있는 ref, 일반적으로 `--ref main`에서 디스패치됩니다. 대상 `ref`가 더 오래된 릴리스 브랜치나 태그를 가리키는 경우도 마찬가지입니다. 별도의 Full Release Validation workflow-ref 입력은 없습니다. workflow run ref를 선택해 신뢰할 수 있는 harness를 선택하세요. 이동 중인 `main`에서 정확한 커밋 증명을 위해 `--ref main -f ref=<sha>`를 사용하지 마세요. 원시 커밋 SHA는 workflow dispatch ref가 될 수 없으므로 `pnpm ci:full-release --sha <sha>`를 사용해 고정된 임시 브랜치를 생성하세요.

live/provider 범위를 선택하려면 `release_profile`을 사용하세요.

- `minimum`: 가장 빠른 릴리스 핵심 OpenAI/core live 및 Docker 경로
- `stable`: 릴리스 승인용 stable provider/backend 커버리지를 minimum에 추가
- `full`: 광범위한 advisory provider/media 커버리지를 stable에 추가

stable 및 full 검증은 promotion 전에 항상 포괄적인 live/E2E, Docker 릴리스 경로, 제한된 published upgrade-survivor sweep을 실행합니다. beta에 동일한 sweep을 요청하려면 `run_release_soak=true`를 사용하세요. 해당 sweep은 최신 4개 stable 패키지와 고정된 `2026.4.23` 및 `2026.5.2` baseline, 그리고 더 오래된 `2026.4.15` 커버리지를 포함하며, 중복 baseline은 제거되고 각 baseline은 자체 Docker runner 작업으로 shard됩니다.

`OpenClaw Release Checks`는 신뢰할 수 있는 workflow ref를 사용해 대상 ref를 한 번 `release-package-under-test`로 해석하고, soak가 실행될 때 cross-OS, Package Acceptance, release-path Docker 검사에서 해당 artifact를 재사용합니다. 이렇게 하면 모든 package-facing 박스가 동일한 바이트를 사용하고 반복적인 패키지 빌드를 피할 수 있습니다. beta가 이미 npm에 게시된 후에는 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`을 설정하여 release checks가 shipped package를 한 번 다운로드하고, `dist/build-info.json`에서 build source SHA를 추출한 뒤, cross-OS, Package Acceptance, release-path Docker, package Telegram lane에서 해당 artifact를 재사용하도록 하세요.
cross-OS OpenAI install smoke는 repo/org 변수가 설정된 경우 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.4`를 사용합니다. 이 lane은 가장 느린 기본 모델을 benchmark하는 것이 아니라 패키지 설치, onboarding, gateway 시작, 하나의 live agent turn을 증명하기 때문입니다. 더 광범위한 live provider matrix는 model-specific 커버리지를 위한 곳으로 유지됩니다.

릴리스 단계에 따라 다음 variant를 사용하세요.

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
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

집중 수정 후 첫 번째 rerun으로 full umbrella를 사용하지 마세요. 하나의 박스가 실패하면 다음 증명에는 실패한 자식 workflow, 작업, Docker lane, package profile, model provider 또는 QA lane을 사용하세요. 수정이 공유 릴리스 orchestration을 변경했거나 이전 all-box evidence를 오래된 것으로 만든 경우에만 full umbrella를 다시 실행하세요. umbrella의 최종 verifier는 기록된 자식 workflow run id를 다시 검사하므로, 자식 workflow가 성공적으로 rerun된 후에는 실패했던 `Verify full validation` 부모 작업만 rerun하세요.

제한된 recovery를 위해 umbrella에 `rerun_group`을 전달하세요. `all`은 실제 release-candidate 실행이고, `ci`는 일반 CI 자식만 실행하며, `plugin-prerelease`는 릴리스 전용 plugin 자식만 실행하고, `release-checks`는 모든 릴리스 박스를 실행합니다. 더 좁은 릴리스 그룹은 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`입니다. 집중 `npm-telegram` rerun에는 `release_package_spec` 또는 `npm_telegram_package_spec`이 필요합니다. full/all 실행은 Package Acceptance 내부의 표준 package Telegram E2E를 사용합니다. 집중 cross-OS rerun은 `cross_os_suite_filter=windows/packaged-upgrade` 또는 다른 OS/suite filter를 추가할 수 있습니다. QA release-check 실패는 표준 tier의 필수 OpenClaw dynamic tool drift를 포함해 일반 릴리스 검증을 차단합니다. Tideclaw alpha 실행은 package-safety가 아닌 release-check lane을 여전히 advisory로 취급할 수 있습니다. `live_suite_filter`가 Discord, WhatsApp 또는 Slack 같은 gated QA live lane을 명시적으로 요청하는 경우, 일치하는 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 변수가 활성화되어 있어야 합니다. 그렇지 않으면 해당 lane을 조용히 건너뛰는 대신 입력 capture가 실패합니다.

### Vitest

Vitest 박스는 수동 `CI` 자식 workflow입니다. 수동 CI는 의도적으로 changed scoping을 우회하고 release candidate에 대해 일반 test graph를 강제합니다. Linux Node shard, bundled-plugin shard, plugin 및 channel contract shard, Node 22 호환성, `check-*`, `check-additional-*`, built-artifact smoke 검사, docs 검사, Python skills, Windows, macOS, Control UI i18n이 포함됩니다. `Full Release Validation`이 박스를 실행할 때 umbrella가 `include_android=true`를 전달하므로 Android가 포함됩니다. 독립 실행형 수동 CI는 Android 커버리지를 위해 `include_android=true`가 필요합니다.

"소스 트리가 전체 일반 test suite를 통과했는가?"에 답하려면 이 박스를 사용하세요. 이는 release-path product validation과 동일하지 않습니다. 보관할 evidence:

- 디스패치된 `CI` 실행 URL을 보여주는 `Full Release Validation` 요약
- 정확한 대상 SHA에서 green인 `CI` 실행
- 회귀를 조사할 때 CI 작업의 실패했거나 느린 shard 이름
- 실행에 성능 분석이 필요할 때 `.artifacts/vitest-shard-timings.json` 같은 Vitest timing artifact

릴리스에 결정론적인 일반 CI가 필요하지만 Docker, QA Lab, live, cross-OS 또는 package 박스가 필요하지 않은 경우에만 수동 CI를 직접 실행하세요. Android가 아닌 direct CI에는 첫 번째 명령을 사용하세요. direct release-candidate CI가 Android를 커버해야 하는 경우 `include_android=true`를 추가하세요.

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 박스는 `openclaw-live-and-e2e-checks-reusable.yml`을 통해 `OpenClaw Release Checks` 안에 있으며, release-mode `install-smoke` workflow도 포함합니다. 이는 소스 수준 테스트만이 아니라 packaged Docker 환경을 통해 release candidate를 검증합니다.

릴리스 Docker 커버리지에는 다음이 포함됩니다.

- 느린 Bun global install smoke가 활성화된 전체 install smoke
- 대상 SHA별 root Dockerfile smoke image 준비/재사용, QR, root/gateway, installer/Bun smoke 작업이 별도의 install-smoke shard로 실행됨
- repository E2E lane
- release-path Docker chunk: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`
- 요청된 경우 `plugins-runtime-services` chunk 내부의 OpenWebUI 커버리지
- `bundled-plugin-install-uninstall-0`부터 `bundled-plugin-install-uninstall-23`까지 분할된 bundled plugin install/uninstall lane
- release checks가 live suite를 포함할 때 live/E2E provider suite 및 Docker live model 커버리지

rerun하기 전에 Docker artifact를 사용하세요. release-path scheduler는 lane 로그, `summary.json`, `failures.json`, phase timing, scheduler plan JSON, rerun command가 포함된 `.artifacts/docker-tests/`를 업로드합니다. 집중 recovery에는 모든 release chunk를 rerun하는 대신 reusable live/E2E workflow에서 `docker_lanes=<lane[,lane]>`를 사용하세요. 생성된 rerun command는 사용 가능한 경우 이전 `package_artifact_run_id`와 준비된 Docker image input을 포함하므로, 실패한 lane이 동일한 tarball과 GHCR image를 재사용할 수 있습니다.

### QA Lab

QA Lab 박스도 `OpenClaw Release Checks`의 일부입니다. 이는 Vitest 및 Docker package mechanics와 별개인 agentic behavior 및 channel-level 릴리스 gate입니다.

릴리스 QA Lab 커버리지에는 다음이 포함됩니다.

- agentic parity pack을 사용해 OpenAI candidate lane을 Opus 4.6 baseline과 비교하는 mock parity lane
- `qa-live-shared` 환경을 사용하는 빠른 live Matrix QA profile
- Convex CI credential lease를 사용하는 live Telegram QA lane
- 릴리스 telemetry에 명시적 local proof가 필요할 때 `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` 또는 `pnpm qa:observability:smoke`

"릴리스가 QA scenario와 live channel flow에서 올바르게 동작하는가?"에 답하려면 이 박스를 사용하세요. 릴리스를 승인할 때 parity, Matrix, Telegram lane의 artifact URL을 보관하세요. 전체 Matrix 커버리지는 기본 release-critical lane이 아니라 수동 sharded QA-Lab 실행으로 계속 사용할 수 있습니다.

### Package

Package 박스는 installable-product gate입니다. 이는 `Package Acceptance`와 resolver `scripts/resolve-openclaw-package-candidate.mjs`를 기반으로 합니다. resolver는 candidate를 Docker E2E가 소비하는 `package-under-test` tarball로 정규화하고, package inventory를 검증하며, package version과 SHA-256을 기록하고, workflow harness ref를 package source ref와 분리해 유지합니다.

지원되는 candidate source:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한 OpenClaw 릴리스
  버전
- `source=ref`: 선택한 `workflow_ref` 하네스와 함께 신뢰할 수 있는 `package_ref`
  브랜치, 태그 또는 전체 커밋 SHA를 패키징
- `source=url`: 필수 `package_sha256`이 있는 공개 HTTPS `.tgz`를 다운로드합니다.
  URL 자격 증명, 기본값이 아닌 HTTPS 포트, 비공개/내부/특수 용도 호스트 이름
  또는 확인된 주소, 안전하지 않은 리디렉션은 거부됩니다
- `source=trusted-url`: `.github/package-trusted-sources.json`의 명명된 정책에서
  필수 `package_sha256` 및 `trusted_source_id`가 있는 HTTPS `.tgz`를
  다운로드합니다. `source=url`에 입력 수준의 비공개 네트워크 우회를 추가하는 대신
  유지관리자가 소유한 엔터프라이즈 미러 또는 비공개 패키지 저장소에 사용하세요
- `source=artifact`: 다른 GitHub Actions 실행에서 업로드한 `.tgz` 재사용

`OpenClaw Release Checks`는 `source=artifact`, 준비된 릴리스 패키지 아티팩트,
`suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`로 Package Acceptance를 실행합니다. Package Acceptance는
동일하게 확인된 타볼에 대해 마이그레이션, 업데이트, 구성된 인증 업데이트 재시작,
라이브 ClawHub skill 설치, 오래된 plugin 의존성 정리, 오프라인 plugin fixture,
plugin 업데이트 및 Telegram 패키지 QA를 유지합니다. 차단 릴리스 검사는 기본값인
최신 게시 패키지 기준선을 사용합니다. `run_release_soak=true`,
`release_profile=stable` 또는 `release_profile=full`이 있는 베타 프로필은
`2026.4.23`부터 `latest`까지의 모든 안정 npm 게시 기준선과 보고된 이슈
fixture로 확장됩니다. 이미 출시된 후보에는 `source=npm`으로 Package Acceptance를
사용하고, 게시 전 SHA 기반 로컬 npm 타볼에는 `source=ref`를, 유지관리자가 소유한
엔터프라이즈/비공개 미러에는 `source=trusted-url`을, 다른 GitHub Actions 실행에서
업로드한 준비된 타볼에는 `source=artifact`를 사용하세요. 이는 이전에 Parallels가
필요했던 대부분의 패키지/업데이트 커버리지를 대체하는 GitHub 네이티브
대체 수단입니다. OS별 온보딩, 설치 관리자 및 플랫폼 동작에는 여전히 크로스 OS
릴리스 검사가 중요하지만, 패키지/업데이트 제품 검증은 Package Acceptance를
우선해야 합니다.

업데이트 및 plugin 검증을 위한 표준 체크리스트는
[업데이트 및 plugin 테스트](/ko/help/testing-updates-plugins)입니다. plugin 설치/업데이트,
doctor 정리 또는 게시 패키지 마이그레이션 변경을 증명하는 로컬, Docker,
Package Acceptance 또는 릴리스 검사 레인을 결정할 때 사용하세요. 모든 안정
`2026.4.23+` 패키지에서의 완전한 게시 업데이트 마이그레이션은 Full Release CI의
일부가 아닌 별도의 수동 `Update Migration` 워크플로입니다.

레거시 package-acceptance 완화는 의도적으로 시간 제한이 있습니다. `2026.4.25`까지의
패키지는 이미 npm에 게시된 메타데이터 공백에 대해 호환성 경로를 사용할 수 있습니다:
타볼에서 누락된 비공개 QA 인벤토리 항목, 누락된 `gateway install --wrapper`,
타볼에서 파생된 git fixture의 누락된 패치 파일, 누락된 지속 `update.channel`,
레거시 plugin 설치 기록 위치, 누락된 marketplace 설치 기록 지속성, `plugins update`
중 구성 메타데이터 마이그레이션. 게시된 `2026.4.26` 패키지는 이미 출시된 로컬
빌드 메타데이터 스탬프 파일에 대해 경고할 수 있습니다. 이후 패키지는 최신 패키지
계약을 충족해야 하며, 동일한 공백은 릴리스 검증에 실패합니다.

릴리스 질문이 실제 설치 가능한 패키지에 관한 것일 때는 더 넓은 Package Acceptance
프로필을 사용하세요:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

일반 패키지 프로필:

- `smoke`: 빠른 패키지 설치/채널/agent, Gateway 네트워크 및 구성 다시 로드 레인
- `package`: 설치/업데이트/재시작/plugin 패키지 계약과 라이브 ClawHub skill 설치 증명;
  이것이 릴리스 검사 기본값입니다
- `product`: `package`에 MCP 채널, cron/subagent 정리, OpenAI 웹 검색 및 OpenWebUI 추가
- `full`: OpenWebUI가 포함된 Docker 릴리스 경로 청크
- `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 목록

패키지 후보 Telegram 증명을 위해 Package Acceptance에서 `telegram_mode=mock-openai`
또는 `telegram_mode=live-frontier`를 활성화하세요. 워크플로는 확인된
`package-under-test` 타볼을 Telegram 레인으로 전달합니다. 독립 실행형 Telegram
워크플로는 게시 후 검사를 위해 여전히 게시된 npm spec을 허용합니다.

## 릴리스 게시 자동화

`OpenClaw Release Publish`는 일반적인 변경 게시 진입점입니다. 릴리스에 필요한
순서대로 신뢰할 수 있는 게시자 워크플로를 오케스트레이션합니다:

1. 릴리스 태그를 체크아웃하고 해당 커밋 SHA를 확인합니다.
2. 태그가 `main` 또는 `release/*`에서 도달 가능한지 확인합니다.
3. `pnpm plugins:sync:check`를 실행합니다.
4. `publish_scope=all-publishable` 및 `ref=<release-sha>`로
   `Plugin NPM Release`를 디스패치합니다.
5. 동일한 범위와 SHA로 `Plugin ClawHub Release`를 디스패치합니다.
6. 저장된 `full_release_validation_run_id`를 확인한 뒤 릴리스 태그,
   npm dist-tag 및 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를
   디스패치합니다.
7. 안정 릴리스의 경우 GitHub 릴리스를 초안으로 생성하거나 업데이트하고, 명시적
   `windows_node_tag` 및 후보 승인 `windows_node_installer_digests`로
   `Windows Node Release`를 디스패치한 뒤, 초안을 게시하기 전에 표준 설치 관리자/
   체크섬 아티팩트를 확인합니다.

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

`latest`로 직접 안정 승격하려면 명시해야 합니다:

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

하위 수준 `Plugin NPM Release` 및 `Plugin ClawHub Release` 워크플로는 집중 복구 또는
재게시 작업에만 사용하세요. `OpenClaw Release Publish`는
`publish_openclaw_npm=true`일 때 `plugin_publish_scope=selected`를 거부하므로,
`@openclaw/diffs-language-pack`을 포함한 게시 가능한 모든 공식 plugin 없이는 코어
패키지가 출시될 수 없습니다. 선택한 plugin 복구의 경우
`plugin_publish_scope=selected` 및 `plugins=@openclaw/name`과 함께
`publish_openclaw_npm=false`를 설정하거나 하위 워크플로를 직접 디스패치하세요.

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 허용합니다:

- `tag`: `v2026.4.2`, `v2026.4.2-1` 또는 `v2026.4.2-beta.1` 같은 필수 릴리스
  태그입니다. `preflight_only=true`일 때는 검증 전용 preflight를 위한 현재 전체
  40자 워크플로 브랜치 커밋 SHA도 될 수 있습니다
- `preflight_only`: 검증/빌드/패키지만 수행하려면 `true`, 실제 게시 경로는 `false`
- `preflight_run_id`: 워크플로가 성공한 preflight 실행의 준비된 타볼을 재사용하도록
  실제 게시 경로에서 필수
- `npm_dist_tag`: 게시 경로의 npm 대상 태그이며, 기본값은 `beta`

`OpenClaw Release Publish`는 다음 운영자 제어 입력을 허용합니다:

- `tag`: 필수 릴리스 태그이며, 이미 존재해야 합니다
- `preflight_run_id`: 성공한 `OpenClaw NPM Release` preflight 실행 ID;
  `publish_openclaw_npm=true`일 때 필수
- `full_release_validation_run_id`: 성공한 `Full Release Validation` 실행 ID;
  `publish_openclaw_npm=true`일 때 필수
- `windows_node_tag`: 정확한 비 prerelease `openclaw/openclaw-windows-node`
  릴리스 태그이며, 안정 OpenClaw 게시에 필수
- `windows_node_installer_digests`: 현재 Windows 설치 관리자 이름을 고정된
  `sha256:` digest에 매핑한 후보 승인 compact JSON 맵이며, 안정 OpenClaw 게시에 필수
- `npm_dist_tag`: OpenClaw 패키지의 npm 대상 태그
- `plugin_publish_scope`: 기본값은 `all-publishable`입니다. `publish_openclaw_npm=false`인
  집중 plugin 전용 복구 작업에만 `selected`를 사용하세요
- `plugins`: `plugin_publish_scope=selected`일 때 쉼표로 구분된 `@openclaw/*` 패키지 이름
- `publish_openclaw_npm`: 기본값은 `true`입니다. 워크플로를 plugin 전용 복구
  오케스트레이터로 사용할 때만 `false`로 설정하세요
- `wait_for_clawhub`: 기본값은 `false`이므로 npm 가용성이 ClawHub sidecar에 의해
  차단되지 않습니다. 워크플로 완료에 ClawHub 완료가 포함되어야 할 때만 `true`로
  설정하세요

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 허용합니다:

- `ref`: 검증할 브랜치, 태그 또는 전체 커밋 SHA입니다. 시크릿이 필요한 검사는 확인된
  커밋이 OpenClaw 브랜치 또는 릴리스 태그에서 도달 가능해야 합니다.
- `run_release_soak`: 베타 릴리스 검사에 대해 완전한 라이브/E2E, Docker 릴리스 경로 및
  all-since upgrade-survivor soak를 선택합니다. `release_profile=stable` 및
  `release_profile=full`에 의해 강제로 켜집니다.

규칙:

- 안정 및 수정 태그는 `beta` 또는 `latest` 중 하나에 게시할 수 있습니다
- 베타 prerelease 태그는 `beta`에만 게시할 수 있습니다
- `OpenClaw NPM Release`의 경우 전체 커밋 SHA 입력은 `preflight_only=true`일 때만
  허용됩니다
- `OpenClaw Release Checks`와 `Full Release Validation`은 항상 검증 전용입니다
- 실제 게시 경로는 preflight 중 사용한 것과 동일한 `npm_dist_tag`를 사용해야 합니다.
  워크플로는 게시 전에 해당 메타데이터가 계속되는지 확인합니다

## 안정 npm 릴리스 순서

안정 npm 릴리스를 만들 때:

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다
   - 태그가 존재하기 전에는 현재 전체 워크플로 브랜치 커밋
     SHA를 preflight 워크플로의 검증 전용 드라이 런에 사용할 수 있습니다
2. 일반적인 beta 우선 흐름에는 `npm_dist_tag=beta`를 선택하고, 의도적으로 안정 버전을 직접 게시하려는 경우에만 `latest`를 선택합니다
3. 하나의 수동 워크플로에서 일반 CI와 live prompt cache, Docker, QA Lab,
   Matrix, Telegram 커버리지를 모두 원할 때는 릴리스 브랜치, 릴리스 태그 또는 전체
   커밋 SHA에서 `Full Release Validation`을 실행합니다
4. 의도적으로 결정론적인 일반 테스트 그래프만 필요하다면, 대신 릴리스 ref에서
   수동 `CI` 워크플로를 실행합니다
5. 서명된 x64 및 ARM64 설치 관리자가 배포되어야 하는 정확한 비프리릴리스 `openclaw/openclaw-windows-node` 릴리스 태그를 선택합니다. 이를
   `windows_node_tag`로 저장하고, 검증된 digest map을
   `windows_node_installer_digests`로 저장합니다. 릴리스 후보 helper는 둘 다 기록하고
   생성된 게시 명령에 포함합니다.
6. 성공한 `preflight_run_id`와 `full_release_validation_run_id`를 저장합니다
7. 동일한 `tag`, 동일한 `npm_dist_tag`,
   선택한 `windows_node_tag`, 저장된 `windows_node_installer_digests`,
   저장된 `preflight_run_id`, 저장된 `full_release_validation_run_id`로 `OpenClaw Release Publish`를 실행합니다.
   이는 OpenClaw npm 패키지를 승격하기 전에 외부화된 plugins를 npm과 ClawHub에 게시합니다
8. 릴리스가 `beta`에 반영되었다면,
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   워크플로를 사용해 해당 안정 버전을 `beta`에서 `latest`로 승격합니다
9. 릴리스가 의도적으로 `latest`에 직접 게시되었고 `beta`도 즉시 동일한 안정 빌드를 따라야 한다면, 동일한 릴리스
   워크플로를 사용해 두 dist-tag가 모두 안정 버전을 가리키게 하거나, 예약된
   자가 복구 동기화가 나중에 `beta`를 이동하도록 둡니다

dist-tag 변경은 여전히
`NPM_TOKEN`이 필요하므로 release ledger repo에 있으며, source repo는 OIDC 전용 게시를 유지합니다.

이렇게 하면 직접 게시 경로와 beta 우선 승격 경로가 모두
문서화되고 운영자가 확인할 수 있습니다.

관리자가 로컬 npm 인증으로 fallback해야 하는 경우, 1Password
CLI(`op`) 명령은 전용 tmux 세션 안에서만 실행합니다. 메인 agent shell에서 `op`를
직접 호출하지 마십시오. tmux 안에 두면 prompts,
alerts, OTP 처리가 관찰 가능해지고 반복적인 host alerts를 방지할 수 있습니다.

## 공개 참조

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

관리자는 실제 runbook에
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)의 비공개 릴리스 문서를 사용합니다.

## 관련

- [릴리스 채널](/ko/install/development-channels)
