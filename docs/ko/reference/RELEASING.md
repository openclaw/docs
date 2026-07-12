---
read_when:
    - 공개 릴리스 채널 정의 찾기
    - 릴리스 검증 또는 패키지 승인 실행
    - 버전 명명 규칙 및 릴리스 주기 찾기
summary: 릴리스 채널, 운영자 체크리스트, 검증 항목, 버전 명명 규칙 및 주기
title: 릴리스 정책
x-i18n:
    generated_at: "2026-07-12T01:13:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw은 현재 사용자에게 표시되는 세 가지 업데이트 채널을 제공합니다.

- stable: 기존의 승격된 릴리스 채널이며, 별도의 CLI/채널 마일스톤이 적용될 때까지 npm `latest`를 통해 계속 확인됩니다.
- beta: npm `beta`로 게시되는 시험판 태그
- dev: 계속 이동하는 `main`의 최신 커밋

이와 별도로 릴리스 운영자는 완료된 직전 달의 코어 패키지를 패치 `33`부터 npm `extended-stable`로 게시할 수 있습니다. 현재 달의 일반 최종 릴리스 계열은 npm `latest`에서 계속 제공됩니다. 이러한 운영자 측 게시 분리는 그 자체로 CLI 업데이트 채널 확인 방식을 변경하지 않습니다.

Tideclaw 알파 빌드는 별도의 내부 시험판 트랙(npm dist-tag `alpha`)이며, [NPM 워크플로 입력](#npm-workflow-inputs)과 [릴리스 테스트 박스](#release-test-boxes)에서 다룹니다.

## 버전 명명

- 월간 npm extended-stable 릴리스 버전: `YYYY.M.PATCH`(`PATCH >= 33`), git 태그 `vYYYY.M.PATCH`
- 일일/일반 최종 릴리스 버전: `YYYY.M.PATCH`(`PATCH < 33`), git 태그 `vYYYY.M.PATCH`
- 일반 대체 수정 릴리스 버전: `YYYY.M.PATCH-N`, git 태그 `vYYYY.M.PATCH-N`
- 베타 시험판 버전: `YYYY.M.PATCH-beta.N`, git 태그 `vYYYY.M.PATCH-beta.N`
- 알파 시험판 버전: `YYYY.M.PATCH-alpha.N`, git 태그 `vYYYY.M.PATCH-alpha.N`
- 월이나 패치 앞에 0을 붙이지 마십시오.
- `PATCH`는 달력상의 날짜가 아니라 월별 순차 릴리스 트레인 번호입니다. 일반 최종 릴리스와 베타 릴리스는 현재 트레인을 진행시키지만, 알파 전용 태그는 베타/일반 패치 번호를 사용하거나 진행시키지 않습니다. 따라서 베타 또는 일반 트레인을 선택할 때 패치 번호가 더 높은 기존 알파 전용 태그는 무시하십시오.
- 알파/나이틀리 빌드는 다음 미출시 패치 트레인을 사용하며, 반복 빌드에서는 `alpha.N`만 증가시킵니다. 해당 패치의 베타가 출시되면 새 알파 빌드는 그다음 패치로 이동합니다.
- npm 버전은 변경할 수 없습니다. 게시된 태그를 삭제하거나 다시 게시하거나 재사용하지 마십시오. 대신 다음 시험판 번호나 다음 월별 패치를 릴리스하십시오.
- `latest`는 현재의 일반/일일 npm 릴리스 계열을 계속 따르며, `beta`는 현재 베타 설치 대상입니다.
- `extended-stable`은 패치 `33`부터 시작하는 지원 대상 직전 달 npm 패키지를 의미합니다. 패치 `34` 이상은 해당 월별 릴리스 계열의 유지보수 릴리스입니다.
- 일반 최종 릴리스와 일반 수정 릴리스는 기본적으로 npm `beta`로 게시됩니다. 릴리스 운영자는 `latest`를 명시적으로 대상으로 지정하거나, 검증된 베타 빌드를 나중에 승격할 수 있습니다.
- 전용 월간 extended-stable 경로는 코어 npm 패키지와 npm에 게시할 수 있는 모든 공식 Plugin을 정확히 동일한 버전으로 게시합니다. Plugin을 ClawHub에 게시하거나, macOS 또는 Windows 아티팩트, GitHub 릴리스, 비공개 저장소 dist-tag, Docker 이미지, 모바일 아티팩트 또는 웹사이트 다운로드를 게시하지는 않습니다.
- 모든 일반 최종 릴리스는 npm 패키지, macOS 앱, 서명된 독립 실행형 Android APK 및 서명된 Windows Hub 설치 프로그램을 함께 제공합니다. 베타 릴리스는 일반적으로 npm/패키지 경로를 먼저 검증하고 게시하며, 네이티브 앱 빌드/서명/공증/승격은 명시적으로 요청하지 않는 한 일반 최종 릴리스용으로 남겨 둡니다.

## 릴리스 주기

- 릴리스는 베타 우선으로 진행되며, 최신 베타가 검증된 후에만 stable이 뒤따릅니다.
- 유지관리자는 일반적으로 현재 `main`에서 생성한 `release/YYYY.M.PATCH` 브랜치에서 릴리스하므로, 릴리스 검증과 수정 작업이 `main`의 새 개발을 차단하지 않습니다.
- 베타 태그가 푸시되었거나 게시된 후 수정이 필요하면, 유지관리자는 이전 태그를 삭제하거나 다시 생성하는 대신 다음 `-beta.N` 태그를 릴리스합니다.
- 자세한 릴리스 절차, 승인, 자격 증명 및 복구 참고 사항은 유지관리자 전용입니다.

## 월간 npm 전용 extended-stable 게시

이는 아래의 일반 릴리스 절차에 대한 전용 예외입니다. 완료된 달 `YYYY.M`에 대해 `extended-stable/YYYY.M.33`을 생성하고, 동일한 브랜치에서 `vYYYY.M.33`과 이후 유지보수 패치를 게시합니다. 릴리스 태그, 브랜치 끝, 체크아웃, 패키지 버전, npm 사전 점검 및 전체 릴리스 검증 실행은 모두 동일한 커밋을 가리켜야 합니다. 보호된 `main`에는 패치 `33` 미만인, 달력상 엄격히 이후 달의 최종 버전이 이미 포함되어 있어야 합니다. `main`이 한 달 넘게 진행된 후에도 유지보수 패치는 계속 게시할 수 있습니다.

정확한 extended-stable 브랜치에서 루트 패키지 버전을 `YYYY.M.P`로 올리고 `pnpm release:prep`을 실행한 후, 게시 가능한 모든 확장 패키지의 버전이 동일한지 확인합니다. 생성된 모든 변경 사항을 커밋하고 푸시한 다음, 해당 커밋에 변경 불가능한 `vYYYY.M.P` 태그를 생성하여 푸시하고 결과 전체 SHA를 기록합니다. 워크플로는 이렇게 준비된 트리를 사용하며, 버전을 대신 올리거나 동기화하지 않습니다.

정확히 준비된 해당 브랜치 끝에서 npm 사전 점검과 전체 릴리스 검증을 실행한 다음, 두 실행 ID와 성공한 전체 릴리스 검증 실행 시도 번호를 저장합니다.

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

`release_profile=stable`은 기존의 검증 수준 프로필입니다. npm `extended-stable` dist-tag와는 별개이며 의도적으로 변경하지 않습니다.

두 실행이 모두 성공하면, 정확히 동일한 브랜치 끝에서 npm에 게시할 수 있는 모든 공식 Plugin을 게시합니다. 패치 `P`는 `33` 이상이어야 합니다. 전체 릴리스 SHA를 `ref`로 전달하고 전체 매트릭스와 레지스트리 재확인이 완료될 때까지 기다린 다음, 성공한 Plugin NPM 릴리스 실행 ID를 저장합니다.

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

워크플로는 소스가 변경되지 않은 패키지를 포함하여 일반적으로 준비된 `all-publishable` 패키지 목록을 사용합니다. 성공하기 전에 모든 정확한 패키지와 모든 Plugin의 `extended-stable` 태그를 확인합니다. 부분 실행이 실패하면 동일한 명령을 다시 실행하십시오. 이미 게시된 패키지는 재사용되고, 누락되었거나 오래된 Plugin 태그는 npm 릴리스 환경에서 조정되며, 최종 재확인은 여전히 전체 패키지 집합을 대상으로 합니다.

Plugin 워크플로가 성공하고 npm 릴리스 환경이 준비되면 사전 점검에서 생성된 정확한 코어 tarball을 게시합니다. 코어 게시 과정은 참조된 Plugin 실행이 동일한 표준 브랜치와 정확한 소스 SHA에서 `completed/success` 상태인지 확인합니다.

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

월별 `.33` 또는 보호된 `main`의 월 정책을 의도적으로 충족할 수 없는 포크나 비프로덕션 예행연습의 경우, npm 사전 점검과 게시 디스패치 모두에 `-f bypass_extended_stable_guard=true`를 추가합니다. 기본값은 `false`입니다. 이 우회는 `npm_dist_tag=extended-stable`일 때만 허용되며 워크플로 요약에 기록됩니다. 이 옵션은 표준 `extended-stable/YYYY.M.33` 워크플로 참조, 브랜치 끝/태그/체크아웃의 일치, 최종 태그 구문, 패키지/태그 버전 일치, 참조된 실행과 매니페스트의 동일성, tarball 출처, 환경 승인, 레지스트리 재확인 또는 선택자 복구 증거를 우회하지 않습니다.

게시 워크플로는 참조된 사전 점검, 검증 및 Plugin 실행의 동일성, 준비된 tarball 다이제스트, 코어 레지스트리 선택자를 확인합니다. 워크플로가 성공한 후 결과를 별도로 확인하십시오.

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

두 명령 모두 `YYYY.M.P`를 반환해야 합니다. 게시가 성공했지만 선택자 재확인이 실패한 경우, 변경 불가능한 패키지 버전을 다시 게시하지 마십시오. 실패한 워크플로의 항상 실행되는 요약에 출력된 단일 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 복구 명령을 사용한 다음 두 독립 재확인을 모두 반복하십시오. 이전 선택자로의 롤백은 별도의 운영자 결정이며, 재확인 복구 경로가 아닙니다.

공개 지원 문서에서는 처음에 Slack, Discord 및 Codex를 지원 대상 extended-stable Plugin 표면으로 지정합니다. 이 목록은 지원 방침이지 릴리스 코드의 허용 목록이 아닙니다. npm에 게시할 수 있는 모든 공식 Plugin은 정확히 동일한 버전 게시 경로를 따릅니다.

아래의 일반 체크리스트는 베타, `latest`, GitHub 릴리스, Plugin, macOS, Windows 및 기타 플랫폼 게시를 계속 담당합니다. 이 npm 전용 extended-stable 경로에서는 해당 단계를 실행하지 마십시오.

## 일반 릴리스 운영자 체크리스트

이 체크리스트는 릴리스 흐름의 공개 구조를 설명합니다. 비공개 자격 증명, 서명, 공증, dist-tag 복구 및 긴급 롤백 세부 정보는 유지관리자 전용 릴리스 런북에만 포함됩니다.

1. 현재 `main`에서 시작합니다. 최신 내용을 가져오고, 대상 커밋이 푸시되었는지 확인하며, 브랜치를 생성하기에 충분할 정도로 `main` CI가 성공 상태인지 확인합니다.
2. 마지막으로 도달 가능한 릴리스 태그 이후 병합된 PR과 모든 직접 커밋을 바탕으로 `CHANGELOG.md`의 최상단 섹션을 생성합니다. 항목은 사용자 관점으로 작성하고, 서로 겹치는 PR/직접 커밋 항목의 중복을 제거한 뒤 커밋하고 푸시하며, 브랜치를 생성하기 전에 한 번 더 리베이스하거나 가져옵니다. 분기된 배포 태그나 이후의 포워드 포트로 인해 이미 릴리스된 PR이 다시 연결되는 경우 해당 태그를 `--shipped-ref`로 명시적으로 전달합니다. 검증기는 태그 스냅샷의 번호가 지정된 섹션에 있는 완전한 기여 기록에서 명시적인 PR 행을 사용하고, `Unreleased`는 무시하며, 제외된 정확한 PR 목록과 개수를 기록합니다.
3. `src/plugins/compat/registry.ts`와 `src/commands/doctor/shared/deprecation-compat.ts`의 릴리스 호환성 기록을 검토합니다. 업그레이드 경로가 계속 보장되는 경우에만 만료된 호환성을 제거하고, 그렇지 않으면 의도적으로 유지하는 이유를 기록합니다.
4. 현재 `main`에서 `release/YYYY.M.PATCH`를 생성합니다. 일반적인 릴리스 작업을 `main`에서 직접 수행하지 마세요.
5. 태그에 필요한 모든 버전 위치를 올린 다음 `pnpm release:prep`을 실행합니다. 이 명령은 Plugin 버전, npm shrinkwrap, Plugin 인벤토리, 기본 구성 스키마, 번들 채널 구성 메타데이터, 구성 문서 기준선, Plugin SDK 내보내기, Plugin SDK API 기준선을 순서대로 갱신합니다. 태그를 지정하기 전에 생성된 변경 사항을 커밋한 다음 로컬 결정적 사전 점검인 `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build`, `pnpm release:check`을 실행합니다.
6. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다. 태그가 존재하기 전에는 검증 전용 사전 점검에 40자로 된 전체 릴리스 브랜치 SHA를 사용할 수 있습니다. 사전 점검은 정확히 체크아웃된 의존성 그래프에 대한 의존성 릴리스 증거를 생성하고 npm 사전 점검 아티팩트에 저장합니다. 성공한 `preflight_run_id`를 저장합니다.
7. 릴리스 브랜치, 태그 또는 전체 커밋 SHA를 대상으로 `Full Release Validation`을 실행하여 모든 릴리스 전 테스트를 시작합니다. 이는 네 가지 주요 릴리스 테스트 영역인 Vitest, Docker, QA Lab, Package의 단일 수동 진입점입니다. `full_release_validation_run_id`와 정확한 `full_release_validation_run_attempt`를 저장합니다. 둘 다 `OpenClaw NPM Release`와 `OpenClaw Release Publish`에 필요한 입력값입니다.
8. 검증에 실패하면 릴리스 브랜치에서 수정하고, 수정 사항을 입증하는 데 필요한 가장 작은 실패 파일, 레인, 워크플로 작업, 패키지 프로필, 공급자 또는 모델 허용 목록을 다시 실행합니다. 변경된 영역으로 인해 이전 증거가 더 이상 유효하지 않은 경우에만 전체 통합 검증을 다시 실행합니다.
9. 태그가 지정된 베타 후보의 경우 일치하는 `release/YYYY.M.PATCH` 브랜치에서 `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`을 실행합니다. 안정 버전의 경우 필수 Windows 소스 릴리스도 전달합니다: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. 이 도우미는 신뢰할 수 있는 `main`을 워크플로 소스로 사용하며, 각 워크플로는 정확한 태그를 대상으로 합니다. 변경 불가능한 후보/도구 신원과 디스패치된 실행 ID를 `.artifacts/release-candidate/<tag>/release-candidate-state.json`에 체크포인트로 기록합니다. 동일한 명령을 다시 실행하면 정확히 해당 실행을 재개하며, 후보, 도구, 프로필 또는 옵션에 차이가 있으면 안전하게 실패합니다. 전체 검증 매트릭스를 디스패치하기 전에 도우미는 정확한 태그의 GitHub 릴리스 본문을 결정적으로 렌더링하고, 버전 제목이 없거나, 표준 축약 형식을 사용할 수 없을 정도로 본문이 제한을 초과하거나, 기여 기록의 기준/대상 출처가 태그에서 도달 가능하지 않은 경우 이를 거부합니다. 또한 명시적인 배포 기준선 제외 메타데이터가 참조된 누적 태그 기록과 일치하는지 검증합니다. 그런 다음 로컬에서 생성된 릴리스 검사를 실행하고, 전체 릴리스 검증과 npm 사전 점검 증거를 디스패치하거나 검증하며, 정확히 준비된 tarball을 대상으로 Parallels 신규 설치/업데이트 증거와 Telegram 패키지 증거를 실행하고, Plugin npm 및 ClawHub 계획을 기록하며, 증거 번들이 모두 성공한 후에만 정확한 `OpenClaw Release Publish` 명령을 출력합니다.

   `OpenClaw Release Publish`는 선택된 Plugin 패키지 또는 게시 가능한 모든 Plugin 패키지를 npm에 디스패치하고 동일한 패키지 집합을 ClawHub에도 병렬로 디스패치한 다음, Plugin npm 게시가 성공하면 일치하는 배포 태그를 사용하여 준비된 OpenClaw npm 사전 점검 아티팩트를 승격합니다. 릴리스 체크아웃은 제품/데이터 루트로 유지되며, 계획과 최종 검증은 정확히 신뢰할 수 있는 워크플로 소스 체크아웃에서 실행되므로 이전 릴리스 커밋이 오래된 릴리스 도구를 조용히 사용하는 일이 없습니다. 게시 하위 작업을 시작하기 전에 정확한 GitHub 릴리스 본문을 렌더링하고 캐시합니다. 완전히 일치하는 `CHANGELOG.md` 섹션이 GitHub의 125,000자 제한과 렌더러의 일치하는 125,000바이트 안전 한도에 들어가는 경우 페이지에는 제목을 포함한 정확한 `## YYYY.M.PATCH` 섹션이 포함됩니다. 소스 섹션이 한도에 들어가지 않으면 페이지는 정확히 그룹화된 편집 메모를 유지하고, 지나치게 큰 기여 기록을 태그에 고정된 `CHANGELOG.md`의 전체 기록으로 연결되는 안정적인 링크로 대체합니다. 부분 기록이나 잘린 글머리표는 절대 게시하지 않습니다. 워크플로는 `### Release verification`을 추가하기 전에 전체 본문 또는 축약 본문을 선택합니다. 증거 후미가 한도를 초과하는 경우 표준 본문을 유지하고 변경 불가능한 첨부 증거를 사용합니다. npm `latest`에 게시된 안정 릴리스는 GitHub 최신 릴리스가 되지만, npm `beta`에 유지되는 안정 유지보수 릴리스는 GitHub `latest=false`로 생성됩니다. 또한 워크플로는 릴리스 후 사고 대응을 위해 사전 점검 의존성 증거, 전체 검증 매니페스트, 게시 후 레지스트리 검증 증거를 GitHub 릴리스에 업로드합니다. 하위 실행 ID를 즉시 출력하고, 워크플로 토큰에 승인 권한이 있는 릴리스 환경 게이트를 자동 승인하며, 실패한 하위 작업을 로그 끝부분과 함께 요약하고, 초기에 GitHub 릴리스 초안 페이지를 생성한 뒤 OpenClaw npm 게시와 동시에 Windows 및 Android 아티팩트를 승격합니다. 해당 단계가 성공하면 릴리스 페이지와 의존성 증거를 마무리하고, OpenClaw npm을 게시하는 경우 ClawHub가 완료될 때까지 기다린 다음, 신뢰할 수 있는 `main`의 베타 검증기를 실행하고 GitHub 릴리스, npm 패키지, 선택된 Plugin npm 패키지, 선택된 ClawHub 패키지, 하위 워크플로 실행 ID, 선택적 NPM Telegram 실행 ID에 대한 게시 후 증거를 업로드합니다. ClawHub 부트스트랩 검증기에는 정확히 신뢰할 수 있는 `main`의 워크플로 경로와 SHA, 생산자 및 종료 실행 시도, 릴리스 SHA, 요청된 패키지 집합, 변경 불가능한 패키지 아티팩트 튜플, 종료 시점의 레지스트리 재조회 아티팩트가 필요합니다. 성공한 기존 릴리스 참조 실행은 인정되지 않습니다.

   그런 다음 게시된 `openclaw@YYYY.M.PATCH-beta.N` 또는 `openclaw@beta` 패키지를 대상으로 게시 후 패키지 인수 검사를 실행합니다. 푸시되거나 게시된 시험 릴리스에 수정이 필요한 경우 다음으로 일치하는 시험 릴리스 번호를 생성하세요. 이전 릴리스를 삭제하거나 다시 작성하지 마세요.

10. 안정 버전의 경우 검증을 거친 베타 또는 릴리스 후보에 필수 검증 증거가 있는 경우에만 계속 진행합니다. 안정 npm 게시도 `OpenClaw Release Publish`를 통해 수행하며, `preflight_run_id`를 사용하여 성공한 사전 점검 아티팩트를 재사용합니다. 안정 macOS 릴리스 준비에는 패키징된 `.zip`, `.dmg`, `.dSYM.zip`과 `main`에서 갱신된 `appcast.xml`도 필요합니다. macOS 게시 워크플로는 릴리스 아티팩트를 검증한 후 서명된 appcast를 공개 `main`에 자동으로 게시하며, 브랜치 보호가 직접 푸시를 차단하면 appcast PR을 생성하거나 갱신합니다. 안정 Windows Hub 준비에는 OpenClaw GitHub 릴리스의 서명된 `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe`, `OpenClawCompanion-SHA256SUMS.txt` 아티팩트가 필요합니다. 정확히 서명된 `openclaw/openclaw-windows-node` 릴리스 태그를 `windows_node_tag`로 전달하고, 후보 단계에서 승인된 설치 프로그램 다이제스트 맵을 `windows_node_installer_digests`로 전달합니다. `OpenClaw Release Publish`는 릴리스 초안을 유지하고 `Windows Node Release`를 디스패치하며 게시 전에 세 아티팩트를 모두 검증합니다.
11. 게시 후 npm 게시 후 검증기를 실행하고, 게시 후 채널 증거가 필요한 경우 선택적으로 독립 실행형 게시 npm Telegram E2E를 실행하며, 필요하면 배포 태그를 승격하고, 생성된 GitHub 릴리스 페이지를 검증하고, 릴리스 공지 단계를 실행한 다음, 안정 릴리스가 완료되었다고 판단하기 전에 [안정 버전 main 마무리](#stable-main-closeout)를 완료합니다.

## 안정 버전 main 마무리

`main`에 실제 배포된 릴리스 상태가 반영되기 전까지 안정 버전 게시는 완료된 것이 아닙니다.

1. 새로 갱신한 최신 `main`에서 시작합니다. `release/YYYY.M.PATCH`를 대조 검토하고 `main`에 없는 실제 수정 사항을 포워드 포트합니다. 릴리스 전용 호환성, 테스트 또는 검증 어댑터를 더 새로운 `main`에 무조건 병합하지 마세요.
2. `main`을 추정한 다음 릴리스 버전이 아니라 실제 배포된 안정 버전으로 설정합니다. 루트 버전을 변경한 후 `pnpm release:prep`을 실행한 다음 `pnpm deps:shrinkwrap:generate`를 실행합니다.
3. `main`의 `CHANGELOG.md`에 있는 `## YYYY.M.PATCH` 섹션이 태그가 지정된 릴리스 브랜치와 정확히 일치하도록 합니다. mac 릴리스에서 안정 버전 `appcast.xml`을 게시했다면 해당 갱신도 포함합니다.
4. 운영자가 해당 릴리스 주기를 명시적으로 시작하기 전에는 `main`에 `YYYY.M.PATCH+1`, 베타 버전 또는 비어 있는 향후 변경 로그 섹션을 추가하지 마세요.
5. `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, `OPENCLAW_TESTBOX=1 pnpm check:changed`를 실행합니다. 푸시한 다음, 안정 릴리스가 완료되었다고 판단하기 전에 `origin/main`에 배포된 버전과 변경 로그가 포함되어 있는지 확인합니다.
6. 각 비공개 롤백 훈련 후 저장소 변수 `RELEASE_ROLLBACK_DRILL_ID`와 `RELEASE_ROLLBACK_DRILL_DATE`를 최신 상태로 유지합니다.

`OpenClaw Stable Main Closeout`은 안정 버전 게시 후 배포된 버전, 변경 로그, appcast를 포함하는 `main` 푸시에서 시작합니다. 변경 불가능한 게시 후 증거를 읽어 배포된 태그를 해당 Full Release Validation 및 Publish 실행에 연결한 다음, 안정 버전 main 상태, 릴리스, 필수 안정화 관찰 기간, 차단 조건인 성능 증거를 검증합니다. 변경 불가능한 마무리 매니페스트와 체크섬을 GitHub 릴리스에 첨부합니다. 자동 푸시 트리거는 변경 불가능한 게시 후 증거가 도입되기 이전의 기존 릴리스를 건너뛰며, 해당 건너뛰기를 완료된 마무리로 간주하지 않습니다.

완전한 마무리에는 두 아티팩트와 일치하는 체크섬이 모두 필요합니다. 부분 매니페스트는 기록된 `main` SHA와 롤백 훈련을 재실행하여 동일한 바이트를 재생성한 다음 누락된 체크섬을 첨부합니다. 유효하지 않은 쌍이나 매니페스트 없는 체크섬은 계속 차단 상태로 남습니다. 롤백 훈련 저장소 변수가 없는 푸시 트리거 실행은 마무리를 완료하지 않고 건너뜁니다. 훈련 기록이 없거나 90일을 초과한 경우에도 수동 증거 기반 마무리가 계속 차단됩니다. 비공개 복구 명령은 유지관리자 전용 런북에 계속 보관됩니다. 증거 기반 안정 버전 마무리를 복구하거나 재실행할 때만 수동 디스패치를 사용하세요.

기존 대체 수정 태그는 수정 태그가 기본 안정 태그와 동일한 소스 커밋으로 해석되는 경우에만 기본 패키지 증거를 재사용할 수 있습니다. 해당 Android 릴리스는 기본 태그의 검증된 APK를 재사용하고 수정 태그의 출처 정보를 추가합니다. 소스가 다른 수정은 자체 패키지 증거를 게시하고 검증해야 하며 더 높은 Android `versionCode`를 사용해야 합니다.

## 릴리스 사전 점검

- 릴리스 사전 점검 전에 `pnpm check:test-types`를 실행하여 더 빠른 로컬 `pnpm check` 게이트 외부에서도 테스트 TypeScript가 계속 검사되도록 합니다.
- 릴리스 사전 점검 전에 `pnpm check:architecture`를 실행하여 더 빠른 로컬 게이트 외부에서도 더 광범위한 가져오기 순환 및 아키텍처 경계 검사가 통과하도록 합니다.
- `pnpm release:check` 전에 `pnpm build && pnpm ui:build`를 실행하여 패키지 검증 단계에 필요한 `dist/*` 릴리스 아티팩트와 Control UI 번들이 존재하도록 합니다.
- 루트 버전을 올린 후 태그를 지정하기 전에 `pnpm release:prep`을 실행합니다. 이 명령은 버전/구성/API 변경 후 흔히 불일치가 발생하는 모든 결정론적 릴리스 생성기, 즉 Plugin 버전, npm shrinkwrap, Plugin 인벤토리, 기본 구성 스키마, 번들 채널 구성 메타데이터, 구성 문서 기준선, Plugin SDK 내보내기 및 Plugin SDK API 기준선을 실행합니다. `pnpm release:check`는 이러한 가드를 검사 모드로 다시 실행하고 Plugin SDK 표면 예산 검사도 추가하며, 패키지 릴리스 검사를 실행하기 전에 생성된 모든 불일치 실패를 한 번에 보고합니다.
- Plugin 버전 동기화는 기본적으로 게시 가능한 `@openclaw/ai` 런타임 패키지, 공식 Plugin 패키지 버전 및 기존 `openclaw.compat.pluginApi` 하한을 OpenClaw 릴리스 버전으로 업데이트합니다. 이 필드는 단순한 패키지 버전 사본이 아니라 Plugin SDK/런타임 API 하한으로 취급해야 합니다. 의도적으로 이전 OpenClaw 호스트와의 호환성을 유지하는 Plugin 전용 릴리스의 경우 하한을 지원되는 가장 오래된 호스트 API로 유지하고, Plugin 릴리스 증명에 그 선택을 문서화합니다.
- 릴리스 승인 전에 수동 `Full Release Validation` 워크플로를 실행하여 단일 진입점에서 모든 사전 릴리스 테스트 박스를 시작합니다. 이 워크플로는 브랜치, 태그 또는 전체 커밋 SHA를 받아 수동 `CI`를 디스패치하고, 설치 스모크, 패키지 승인, 운영체제 간 패키지 검사, QA Lab 동등성, Matrix 및 Telegram 레인을 위한 `OpenClaw Release Checks`를 디스패치합니다. 안정 및 전체 실행에는 항상 포괄적인 라이브/E2E와 Docker 릴리스 경로 장기 검증이 포함되며, `run_release_soak=true`는 명시적인 베타 장기 검증을 위해 유지됩니다. Package Acceptance는 후보 검증 중 표준 패키지 Telegram E2E를 제공하여 두 번째 라이브 폴러가 동시에 실행되는 것을 방지합니다.

  베타를 게시한 후 `release_package_spec`을 제공하면 릴리스 tarball을 다시 빌드하지 않고도 릴리스 검사, Package Acceptance 및 패키지 Telegram E2E 전체에서 게시된 npm 패키지를 재사용할 수 있습니다. Telegram에서 나머지 릴리스 검증과 다른 게시 패키지를 사용해야 하는 경우에만 `npm_telegram_package_spec`을 제공합니다. Package Acceptance에서 릴리스 패키지 지정과 다른 게시 패키지를 사용해야 하는 경우 `package_acceptance_package_spec`을 제공합니다. Telegram E2E를 강제하지 않으면서 릴리스 증거 보고서가 검증 결과와 게시된 npm 패키지의 일치를 입증해야 하는 경우 `evidence_package_spec`을 제공합니다.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- 릴리스 작업을 계속하는 동안 패키지 후보에 대한 보조 경로 증명이 필요하면 수동 `Package Acceptance` 워크플로를 실행합니다. `openclaw@beta`, `openclaw@latest` 또는 정확한 릴리스 버전에는 `source=npm`을 사용하고, 현재 `workflow_ref` 하네스로 신뢰할 수 있는 `package_ref` 브랜치/태그/SHA를 패키징하려면 `source=ref`를 사용하며, 필수 SHA-256 및 엄격한 공개 URL 정책이 적용되는 공개 HTTPS tarball에는 `source=url`을 사용합니다. 필수 `trusted_source_id`와 SHA-256을 사용하는 명명된 신뢰 소스 정책에는 `source=trusted-url`을 사용하고, 다른 GitHub Actions 실행에서 업로드한 tarball에는 `source=artifact`를 사용합니다.

  이 워크플로는 후보를 `package-under-test`로 해석하고 해당 tarball에 대해 Docker E2E 릴리스 스케줄러를 재사용하며, `telegram_mode=mock-openai` 또는 `telegram_mode=live-frontier`를 사용하여 동일한 tarball에 대해 Telegram QA를 실행할 수 있습니다. 선택한 Docker 레인에 `published-upgrade-survivor`가 포함된 경우 패키지 아티팩트가 후보가 되고 `published_upgrade_survivor_baseline`이 게시된 기준선을 선택합니다. `update-restart-auth`는 후보 패키지를 설치된 CLI와 테스트 대상 패키지 모두로 사용하여 후보 업데이트 명령의 관리형 재시작 경로를 검증합니다.

  예:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  일반적인 프로필:
  - `smoke`: 설치/채널/에이전트, Gateway 네트워크 및 구성 다시 로드 레인
  - `package`: OpenWebUI 또는 라이브 ClawHub를 제외한 아티팩트 네이티브 패키지/업데이트/재시작/Plugin 레인
  - `product`: 패키지 프로필에 MCP 채널, Cron/하위 에이전트 정리, OpenAI 웹 검색 및 OpenWebUI를 추가
  - `full`: OpenWebUI를 포함한 Docker 릴리스 경로 청크
  - `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 선택

- 릴리스 후보에 대해 결정론적인 일반 CI 검사 범위만 필요한 경우 수동 `CI` 워크플로를 직접 실행합니다. 수동 CI 디스패치는 변경 범위 제한을 우회하고 Linux Node 샤드, 번들 Plugin 샤드, Plugin 및 채널 계약 샤드, Node 22 호환성, `check-*`, `check-additional-*`, 빌드된 아티팩트 스모크 검사, 문서 검사, Python Skills, Windows, macOS 및 Control UI 국제화 레인을 강제로 실행합니다. 독립 실행형 수동 CI는 `include_android=true`로 디스패치된 경우에만 Android를 실행하며, `Full Release Validation`은 하위 CI에 해당 입력을 전달합니다.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 릴리스 텔레메트리를 검증할 때 `pnpm qa:otel:smoke`를 실행합니다. 이 명령은 로컬 OTLP/HTTP 수신기를 통해 QA-lab을 실행하고, Opik, Langfuse 또는 다른 외부 수집기 없이도 트레이스, 메트릭 및 로그 내보내기와 제한된 트레이스 속성, 콘텐츠/식별자 비식별화를 검증합니다.
- 수집기 호환성을 검증할 때 `pnpm qa:otel:collector-smoke`를 실행합니다. 이 명령은 로컬 수신기 어설션 전에 실제 OpenTelemetry Collector Docker 컨테이너를 통해 동일한 QA-lab OTLP 내보내기를 라우팅합니다.
- 보호된 Prometheus 스크레이핑을 검증할 때 `pnpm qa:prometheus:smoke`를 실행합니다. 이 명령은 QA-lab을 실행하고 인증되지 않은 스크레이프를 거부하며, 릴리스에 중요한 메트릭 패밀리에 프롬프트 콘텐츠, 원시 식별자, 인증 토큰 및 로컬 경로가 포함되지 않는지 검증합니다.
- 소스 체크아웃의 OpenTelemetry 및 Prometheus 스모크 레인을 연속으로 실행하려면 `pnpm qa:observability:smoke`를 실행합니다.
- 태그가 지정되는 모든 릴리스 전에 `pnpm release:check`를 실행합니다.
- `OpenClaw NPM Release` 사전 점검은 npm tarball을 패키징하기 전에 종속성 릴리스 증거를 생성합니다. npm 권고 취약점 게이트는 릴리스를 차단합니다. 전이적 매니페스트 위험, 종속성 소유권/설치 표면 및 종속성 변경 보고서는 릴리스 증거로만 사용됩니다. 종속성 변경 보고서는 릴리스 후보를 이전의 도달 가능한 릴리스 태그와 비교합니다. 사전 점검은 종속성 증거를 `openclaw-release-dependency-evidence-<tag>`로 업로드하고, 준비된 npm 사전 점검 아티팩트 내부의 `dependency-evidence/`에도 포함합니다. 실제 게시 경로는 해당 사전 점검 아티팩트를 재사용한 다음 동일한 증거를 `openclaw-<version>-dependency-evidence.zip`으로 GitHub 릴리스에 첨부합니다.
- 태그가 존재한 후 변경을 수행하는 게시 순서를 실행하려면 `OpenClaw Release Publish`를 실행합니다. 일반 베타 및 안정 버전 게시는 신뢰할 수 있는 `main`에서 디스패치합니다. 릴리스 태그는 여전히 정확한 대상 커밋을 선택하며 `release/YYYY.M.PATCH`를 가리킬 수 있습니다. Tideclaw 알파 게시는 해당 알파 브랜치에서 계속 진행합니다. 성공한 OpenClaw npm `preflight_run_id`, 성공한 `full_release_validation_run_id` 및 정확한 `full_release_validation_run_attempt`를 전달하고, 의도적으로 집중 복구를 실행하는 경우가 아니라면 기본 Plugin 게시 범위인 `all-publishable`을 유지합니다. 이 워크플로는 외부화된 Plugin보다 코어 패키지가 먼저 게시되지 않도록 Plugin npm 게시, Plugin ClawHub 게시 및 OpenClaw npm 게시를 순차 실행합니다. Windows 및 Android 승격은 초안 릴리스 페이지를 대상으로 코어 npm 게시와 동시에 실행됩니다. 게시 재실행은 중단 지점부터 재개할 수 있습니다. 이미 게시된 코어 npm 버전은 워크플로가 레지스트리 tarball이 태그의 사전 점검 아티팩트와 일치함을 입증한 후 코어 디스패치를 건너뛰며, 릴리스에 검증된 아티팩트 계약이 이미 존재하면 Windows/Android 승격도 건너뛰므로 재시도에서는 실패한 단계만 다시 실행됩니다. 집중 Plugin 전용 복구에는 `plugin_publish_scope=selected`와 비어 있지 않은 Plugin 목록이 필요합니다. Plugin 전용 `all-publishable` 실행에는 완전하고 변경 불가능한 사전 점검 및 Full Release Validation 증거가 필요하며, 부분적인 증거는 거부됩니다.
- 안정 버전 `OpenClaw Release Publish`에는 일치하는 비사전 릴리스 `openclaw/openclaw-windows-node` 릴리스가 존재한 후 정확한 `windows_node_tag`와 후보 승인된 `windows_node_installer_digests` 맵이 필요합니다. 게시 하위 작업을 디스패치하기 전에 해당 소스 릴리스가 게시되었고 사전 릴리스가 아니며 필요한 x64/ARM64 설치 프로그램을 포함하고 승인된 맵과 계속 일치하는지 검증합니다. 그런 다음 OpenClaw 릴리스가 아직 초안인 동안 고정된 설치 프로그램 다이제스트 맵을 변경하지 않고 전달하여 `Windows Node Release`를 디스패치합니다. 하위 워크플로는 해당 정확한 태그에서 서명된 Windows Hub 설치 프로그램을 다운로드하고, 고정된 다이제스트와 일치시키며, Windows 러너에서 Authenticode 서명이 예상된 OpenClaw Foundation 서명자를 사용하는지 검증합니다. 이후 SHA-256 매니페스트를 작성하고 설치 프로그램과 매니페스트를 표준 OpenClaw GitHub 릴리스에 업로드한 다음, 승격된 아티팩트를 다시 다운로드하여 매니페스트 포함 여부와 해시를 검증합니다. 상위 워크플로는 게시 전에 현재 x64, ARM64 및 체크섬 아티팩트 계약을 검증합니다. 직접 복구는 고정된 소스 바이트로 예상 계약 아티팩트를 교체하기 전에 예기치 않은 `OpenClawCompanion-*` 아티팩트 이름을 거부합니다.

  복구 목적으로만 `Windows Node Release`를 수동 디스패치하고, 항상 `latest`가 아닌 정확한 태그와 승인된 소스 릴리스의 명시적인 `expected_installer_digests` JSON 맵을 전달합니다. 웹사이트 다운로드 링크는 현재 안정 릴리스의 정확한 OpenClaw 릴리스 아티팩트 URL을 대상으로 해야 합니다. 또는 GitHub의 최신 리디렉션이 동일한 릴리스를 가리키는지 검증한 후에만 `releases/latest/download/...`를 사용합니다. 컴패니언 저장소 릴리스 페이지만 링크하지 마십시오.

- 릴리스 검사는 이제 별도의 수동 워크플로인 `OpenClaw Release Checks`에서 실행됩니다. 이 워크플로는 릴리스 승인 전에 QA Lab 모의 동등성 레인과 빠른 라이브 Matrix 프로필 및 Telegram QA 레인도 실행합니다. 라이브 레인은 `qa-live-shared` 환경을 사용하며, Telegram은 Convex CI 자격 증명 임대도 사용합니다. 전체 Matrix 전송, 미디어 및 E2EE 인벤토리를 병렬로 실행하려면 `matrix_profile=all` 및 `matrix_shards=true`로 수동 `QA-Lab - All Lanes` 워크플로를 실행하세요.
- 크로스 OS 설치 및 업그레이드 런타임 검증은 공개 `OpenClaw Release Checks` 및 `Full Release Validation`의 일부이며, 이들은 재사용 가능한 워크플로 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`을 직접 호출합니다. 이러한 분리는 의도된 것입니다. 실제 npm 릴리스 경로는 짧고 결정적이며 아티팩트 중심으로 유지하는 한편, 더 느린 라이브 검사는 자체 레인에 두어 게시를 지연하거나 차단하지 않도록 합니다.
- 비밀 정보가 포함된 릴리스 검사는 워크플로 로직과 비밀 정보가 통제된 상태로 유지되도록 `Full Release Validation`을 통하거나 `main`/릴리스 워크플로 참조에서 디스패치해야 합니다.
- `OpenClaw Release Checks`는 확인된 커밋이 OpenClaw 브랜치 또는 릴리스 태그에서 도달 가능한 한 브랜치, 태그 또는 전체 커밋 SHA를 허용합니다.
- `OpenClaw NPM Release`의 검증 전용 사전 검사도 푸시된 태그 없이 현재 워크플로 브랜치의 전체 40자 커밋 SHA를 허용합니다. 이 SHA 경로는 검증 전용이며 실제 게시로 승격할 수 없습니다. SHA 모드에서 워크플로는 패키지 메타데이터 검사용으로만 `v<package.json version>`을 생성하며, 실제 게시에는 여전히 실제 릴리스 태그가 필요합니다.
- 두 워크플로 모두 실제 게시 및 승격 경로는 GitHub 호스팅 러너에서 유지하는 한편, 변경을 수행하지 않는 검증 경로에서는 더 큰 Blacksmith Linux 러너를 사용할 수 있습니다.
- 해당 워크플로는 `OPENAI_API_KEY` 및 `ANTHROPIC_API_KEY` 워크플로 비밀 정보를 모두 사용하여 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`를 실행합니다.
- npm 릴리스 사전 검사는 더 이상 별도의 릴리스 검사 레인을 기다리지 않습니다.
- 로컬에서 릴리스 후보에 태그를 지정하기 전에 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`를 실행하세요. 이 도우미는 GitHub 게시 워크플로가 시작되기 전에 승인을 차단하는 일반적인 실수를 포착할 수 있는 순서로 빠른 릴리스 보호 장치, Plugin npm/ClawHub 릴리스 검사, 빌드, UI 빌드 및 `release:openclaw:npm:check`를 실행합니다.
- 승인 전에 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` 또는 해당하는 시험판/수정 태그를 실행하세요.
- npm 게시 후 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` 또는 해당하는 베타/수정 버전을 실행하여 새로운 임시 접두사에서 게시된 레지스트리 설치 경로를 검증하세요.
- 베타 게시 후 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`를 실행하여 공유 임대 Telegram 자격 증명 풀을 사용해 게시된 npm 패키지에 대한 설치 패키지 온보딩, Telegram 설정 및 실제 Telegram E2E를 검증하세요. 로컬 유지관리자의 일회성 실행에서는 Convex 변수를 생략하고 세 개의 `OPENCLAW_QA_TELEGRAM_*` 환경 자격 증명을 직접 전달할 수 있습니다.
- 유지관리자 머신에서 전체 게시 후 베타 스모크 검사를 실행하려면 `pnpm release:beta-smoke -- --beta betaN`을 사용하세요. 이 도우미는 Parallels npm 업데이트/새 대상 검증을 실행하고, `NPM Telegram Beta E2E`를 디스패치하며, 정확한 워크플로 실행을 폴링하고, 아티팩트를 다운로드한 후 Telegram 보고서를 출력합니다.
- 유지관리자는 수동 `NPM Telegram Beta E2E` 워크플로를 통해 GitHub Actions에서 동일한 게시 후 검사를 실행할 수 있습니다. 이 워크플로는 의도적으로 수동 전용이며 모든 병합 시 실행되지 않습니다.
- 유지관리자 릴리스 자동화는 사전 검사 후 승격 방식을 사용합니다.
  - 실제 npm 게시는 성공한 npm `preflight_run_id`를 통과해야 합니다.
  - 일반 베타 및 안정판 게시 오케스트레이션과 사전 검사는 정확한 대상 태그에 대해 신뢰할 수 있는 `main`을 사용합니다. Tideclaw 알파 게시 및 사전 검사는 해당 알파 브랜치를 사용합니다.
  - 안정판 npm 릴리스는 기본적으로 `beta`를 사용하며, 안정판 npm 게시는 워크플로 입력을 통해 `latest`를 명시적으로 대상으로 지정할 수 있습니다.
  - 토큰 기반 npm 배포 태그 변경은 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`에 있습니다. 소스 저장소는 OIDC 전용 게시를 유지하지만 `npm dist-tag add`에는 여전히 `NPM_TOKEN`이 필요하기 때문입니다.
  - 공개 `macOS Release`는 검증 전용입니다. 태그가 릴리스 브랜치에만 있고 워크플로가 `main`에서 디스패치되는 경우 `public_release_branch=release/YYYY.M.PATCH`를 설정하세요.
  - 실제 macOS 게시는 성공한 macOS `preflight_run_id` 및 `validate_run_id`를 통과해야 합니다.
  - 실제 게시 경로는 아티팩트를 다시 빌드하지 않고 준비된 아티팩트를 승격합니다.
- `YYYY.M.PATCH-N`과 같은 안정판 수정 릴리스의 경우 게시 후 검증기는 `YYYY.M.PATCH`에서 `YYYY.M.PATCH-N`으로의 동일한 임시 접두사 업그레이드 경로도 검사하여, 릴리스 수정으로 인해 이전 전역 설치에 기본 안정판 페이로드가 조용히 남지 않도록 합니다.
- tarball에 `dist/control-ui/index.html`과 비어 있지 않은 `dist/control-ui/assets/` 페이로드가 모두 포함되지 않으면 npm 릴리스 사전 검사가 실패하도록 닫히므로, 빈 브라우저 대시보드가 다시 배포되지 않습니다.
- 게시 후 검증은 게시된 Plugin 진입점과 패키지 메타데이터가 설치된 레지스트리 레이아웃에 존재하는지도 검사합니다. Plugin 런타임 페이로드가 누락된 릴리스는 게시 후 검증에 실패하며 `latest`로 승격할 수 없습니다.
- `pnpm test:install:smoke`는 후보 업데이트 tarball에 대한 npm pack의 `unpackedSize` 예산도 적용하므로, 설치 프로그램 E2E가 릴리스 게시 경로 전에 실수로 발생한 패키지 비대화를 포착합니다.
- 릴리스 작업에서 CI 계획, 확장 기능 타이밍 매니페스트 또는 확장 기능 테스트 매트릭스를 변경한 경우, 승인 전에 `.github/workflows/plugin-prerelease.yml`에서 플래너가 소유하는 `plugin-prerelease-extension-shard` 매트릭스 출력을 다시 생성하고 검토하여 릴리스 노트가 오래된 CI 레이아웃을 설명하지 않도록 하세요.
- 안정판 macOS 릴리스 준비 상태에는 업데이터 표면도 포함됩니다. GitHub 릴리스에는 최종적으로 패키징된 `.zip`, `.dmg` 및 `.dSYM.zip`이 있어야 합니다. `main`의 `appcast.xml`은 게시 후 새로운 안정판 zip을 가리켜야 합니다(macOS 게시 워크플로가 이를 자동으로 커밋하거나 직접 푸시가 차단된 경우 appcast PR을 엽니다). 패키징된 앱은 디버그용이 아닌 번들 ID, 비어 있지 않은 Sparkle 피드 URL 및 해당 릴리스 버전의 표준 Sparkle 빌드 최저값 이상의 `CFBundleVersion`을 유지해야 합니다.

## 릴리스 테스트 박스

`Full Release Validation`은 운영자가 하나의 진입점에서 모든 릴리스 전 테스트를 시작하는 방법입니다. 빠르게 변경되는 브랜치에서 고정된 커밋을 증명하려면 도우미를 사용하세요. 그러면 요청된 커밋은 테스트 대상 후보로 유지하면서 모든 하위 워크플로가 신뢰할 수 있는 하나의 `main` 워크플로 SHA에 고정된 임시 브랜치에서 실행됩니다.

```bash
pnpm ci:full-release --sha <full-sha>
```

도우미는 현재 `origin/main`을 가져오고, 해당 신뢰할 수 있는 워크플로 커밋에서 `release-ci/<workflow-sha>-...`를 푸시하고, 임시 브랜치에서 `ref=<target-sha>`로 `Full Release Validation`을 디스패치하고, 사용 가능한 경우 엄격한 정확한 대상 증거를 재사용하며, 모든 하위 워크플로의 `headSha`가 고정된 상위 워크플로 SHA와 일치하는지 검증한 후 임시 브랜치를 삭제합니다. 새로운 실행을 강제하려면 `-f reuse_evidence=false`를 전달하고, 현재 `origin/main`에서 여전히 도달 가능한 이전 커밋을 고정하려면 `--workflow-sha <trusted-main-sha>`를 전달하세요. 워크플로 자체는 저장소 참조를 절대 쓰지 않습니다. 이를 통해 후보에 도구 커밋을 추가하지 않고도 `main` 전용 릴리스 도구를 사용할 수 있으며, 실수로 더 새로운 `main` 하위 실행을 증명하는 일을 방지합니다.

릴리스 브랜치 또는 태그를 검증하려면 신뢰할 수 있는 `main` 워크플로 참조에서 실행하고 릴리스 브랜치 또는 태그를 `ref`로 전달하세요.

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

워크플로는 대상 참조를 확인하고 `target_ref=<release-ref>`로 수동 `CI`를 디스패치한 다음 `OpenClaw Release Checks`를 디스패치합니다. `OpenClaw Release Checks`는 설치 스모크 검사, 크로스 OS 릴리스 검사, 소크 검사가 활성화된 경우 라이브/E2E Docker 릴리스 경로 범위, 표준 Telegram 패키지 E2E를 포함한 패키지 인수 검사, QA Lab 동등성, 라이브 Matrix 및 라이브 Telegram으로 분기합니다. 집중 재실행에서 별도의 `Plugin Prerelease` 하위 작업을 의도적으로 건너뛴 경우를 제외하면, `Full Release Validation` 요약에 `normal_ci`, `plugin_prerelease` 및 `release_checks`가 성공으로 표시되어야만 전체/모든 실행이 허용됩니다. `release_package_spec` 또는 `npm_telegram_package_spec`을 사용해 게시된 패키지만 집중적으로 재실행하려는 경우에만 독립 실행형 `npm-telegram` 하위 작업을 사용하세요. 최종 검증기 요약에는 각 하위 실행의 가장 느린 작업 표가 포함되므로 릴리스 관리자는 로그를 다운로드하지 않고도 현재 주요 경로를 확인할 수 있습니다.

이 릴리스 경로에서 제품 성능 하위 작업은 아티팩트 전용입니다. 상위 워크플로는 `publish_reports=false`로 이를 디스패치하며, 아티팩트 전용 보호 장치가 Clawgrit 보고서 게시자가 건너뛴 상태로 유지되었음을 증명하지 못하면 검증이 거부됩니다.

전체 단계 매트릭스, 정확한 워크플로 작업 이름, 안정판과 전체 프로필의 차이, 아티팩트 및 집중 재실행 핸들은 [전체 릴리스 검증](/ko/reference/full-release-validation)을 참조하세요.

하위 워크플로는 대상 `ref`가 이전 릴리스 브랜치나 태그를 가리키는 경우에도 `Full Release Validation`을 실행하는 신뢰할 수 있는 참조(일반적으로 `--ref main`)에서 디스패치됩니다. 모든 하위 실행은 정확한 상위 워크플로 SHA를 사용해야 합니다. 하위 디스패치가 확인되기 전에 `main`이 진행되면 상위 워크플로는 실패하도록 닫힙니다. 별도의 Full Release Validation 워크플로 참조 입력은 없습니다. 워크플로 실행 참조를 선택하여 신뢰할 수 있는 하네스를 선택하세요. 이동 중인 `main`에서 정확한 커밋을 증명할 때 `--ref main -f ref=<sha>`를 사용하지 마세요. 원시 커밋 SHA는 워크플로 디스패치 참조가 될 수 없으므로, 대상 SHA를 후보 입력으로 유지하면서 신뢰할 수 있는 `origin/main`에 임시 브랜치를 생성하려면 `pnpm ci:full-release --sha <target-sha>`를 사용하세요.

라이브/제공자 범위를 선택하려면 `release_profile`을 사용하세요.

- `minimum`: 가장 빠른 릴리스 필수 OpenAI/핵심 라이브 및 Docker 경로
- `stable`: 최소 범위에 릴리스 승인을 위한 안정판 제공자/백엔드 범위를 추가
- `full`: 안정판 범위에 광범위한 참고용 제공자/미디어 범위를 추가

안정판 및 전체 검증은 승격 전에 항상 포괄적인 라이브/E2E, Docker 릴리스 경로 및 제한된 게시 업그레이드 생존자 스윕을 실행합니다. 베타에 동일한 스윕을 요청하려면 `run_release_soak=true`를 사용하세요. 이 스윕은 최신 안정판 패키지 4개와 고정된 `2026.4.23` 및 `2026.5.2` 기준선, 그리고 이전 `2026.4.15` 범위를 포함하며, 중복 기준선은 제거되고 각 기준선은 자체 Docker 러너 작업으로 샤딩됩니다.

`OpenClaw Release Checks`는 신뢰할 수 있는 워크플로 참조를 사용하여 대상 참조를 한 번 `release-package-under-test`로 확인하고, 소크 검사 실행 시 크로스 OS, 패키지 인수 및 릴리스 경로 Docker 검사에서 해당 아티팩트를 재사용합니다. 이를 통해 패키지와 관련된 모든 테스트 박스가 동일한 바이트를 사용하고 반복적인 패키지 빌드를 피할 수 있습니다. 베타가 이미 npm에 게시된 후에는 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`을 설정하세요. 그러면 릴리스 검사가 배포된 패키지를 한 번 다운로드하고 `dist/build-info.json`에서 빌드 소스 SHA를 추출한 다음, 크로스 OS, 패키지 인수, 릴리스 경로 Docker 및 패키지 Telegram 레인에서 해당 아티팩트를 재사용합니다.

크로스 OS OpenAI 설치 스모크 검사는 저장소/조직 변수가 설정되어 있으면 `OPENCLAW_CROSS_OS_OPENAI_MODEL`을 사용하고, 그렇지 않으면 `openai/gpt-5.6-luna`를 사용합니다. 이 레인은 가장 뛰어난 모델을 벤치마킹하는 것이 아니라 패키지 설치, 온보딩, Gateway 시작 및 한 번의 라이브 에이전트 턴을 증명하기 위한 것이기 때문입니다. 더 광범위한 라이브 제공자 매트릭스는 모델별 범위를 검증하는 곳으로 유지됩니다.

릴리스 단계에 따라 다음 변형을 사용하세요:

```bash
# 게시되지 않은 릴리스 후보 브랜치를 검증합니다.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# 푸시된 정확한 커밋을 검증합니다.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# 베타 게시 후 게시된 패키지의 Telegram E2E를 추가합니다.
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

집중 수정 후 첫 재실행으로 전체 통합 워크플로를 사용하지 마세요. 하나의 박스가 실패하면 다음 검증에는 실패한 하위 워크플로, 작업, Docker 레인, 패키지 프로필, 모델 공급자 또는 QA 레인을 사용하세요. 수정이 공유 릴리스 오케스트레이션을 변경했거나 이전의 전체 박스 증거를 오래된 것으로 만든 경우에만 전체 통합 워크플로를 다시 실행하세요. 통합 워크플로의 최종 검증기는 기록된 하위 워크플로 실행 ID를 다시 확인하므로, 하위 워크플로를 성공적으로 재실행한 후에는 실패한 상위 `Verify full validation` 작업만 재실행하세요.

`rerun_group=all`은 정확히 동일한 대상 SHA, 릴리스 프로필, 유효한 소크 설정 및 검증 입력을 검증한 경우에만 이전의 성공한 통합 워크플로 실행을 재사용할 수 있습니다. 이는 동일한 후보를 재실행하기 위한 제한적 복구이며, 서로 다른 SHA 간의 증거 재사용이 아닙니다. 변경 로그 또는 버전만 변경한 커밋을 포함해 후보가 변경되었다면, 변경된 경로나 아티팩트 해시의 영향을 받는 모든 패키지, 아티팩트, 설치, Docker 또는 공급자 게이트를 다시 실행하세요. 동일한 `release/*` ref 및 재실행 그룹에 대한 더 새로운 통합 워크플로 실행은 진행 중인 실행을 자동으로 대체합니다. 완전히 새로 실행하려면 `reuse_evidence=false`를 전달하세요.

제한적 복구의 경우 통합 워크플로에 `rerun_group`을 전달하세요. `all`은 실제 릴리스 후보 실행이고, `ci`는 일반 CI 하위 워크플로만 실행하며, `plugin-prerelease`는 릴리스 전용 Plugin 하위 워크플로만 실행하고, `release-checks`는 모든 릴리스 박스를 실행합니다. 더 좁은 릴리스 그룹은 `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, `npm-telegram`입니다. 집중 `npm-telegram` 재실행에는 `release_package_spec` 또는 `npm_telegram_package_spec`이 필요하며, 전체/모든 실행은 Package Acceptance 내부의 표준 패키지 Telegram E2E를 사용합니다. 집중 크로스 OS 재실행에는 `cross_os_suite_filter=windows/packaged-upgrade` 또는 다른 OS/스위트 필터를 추가할 수 있습니다. QA 릴리스 검사 실패는 표준 등급에서 필수인 OpenClaw 동적 도구 드리프트를 포함해 일반 릴리스 검증을 차단합니다. Tideclaw 알파 실행에서는 패키지 안전성과 관련 없는 릴리스 검사 레인을 여전히 권고 사항으로 취급할 수 있습니다. `release_profile=beta`에서는 `Run repo/live E2E validation` 라이브 공급자 스위트가 권고 사항이며 경고만 발생하고 차단하지 않습니다. stable 및 full 프로필에서는 계속 차단 항목으로 유지됩니다. `live_suite_filter`가 Discord, WhatsApp 또는 Slack 같은 게이트 적용 QA 라이브 레인을 명시적으로 요청하는 경우, 해당 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 저장소 변수를 활성화해야 합니다. 그렇지 않으면 해당 레인을 조용히 건너뛰지 않고 입력 캡처가 실패합니다.

### Vitest

Vitest 박스는 수동 `CI` 하위 워크플로입니다. 수동 CI는 의도적으로 변경 범위 지정을 우회하고 릴리스 후보에 일반 테스트 그래프를 강제로 적용합니다. 여기에는 Linux Node 샤드, 번들 Plugin 샤드, Plugin 및 채널 계약 샤드, Node 22 호환성, `check-*`, `check-additional-*`, 빌드된 아티팩트 스모크 검사, 문서 검사, Python Skills, Windows, macOS 및 Control UI 국제화가 포함됩니다. `Full Release Validation`이 이 박스를 실행할 때 통합 워크플로가 `include_android=true`를 전달하므로 Android도 포함됩니다. 독립 실행형 수동 CI에서 Android를 포함하려면 `include_android=true`가 필요합니다.

이 박스는 "소스 트리가 전체 일반 테스트 스위트를 통과했는가?"에 답하는 데 사용하세요. 이는 릴리스 경로 제품 검증과 같지 않습니다. 보관할 증거:

- 디스패치된 `CI` 실행 URL을 보여 주는 `Full Release Validation` 요약
- 정확한 대상 SHA에서 성공한 `CI` 실행
- 회귀를 조사할 때 CI 작업에서 확인된 실패하거나 느린 샤드 이름
- 실행에 성능 분석이 필요할 때 `.artifacts/vitest-shard-timings.json` 같은 Vitest 타이밍 아티팩트

릴리스에 결정론적인 일반 CI가 필요하지만 Docker, QA Lab, 라이브, 크로스 OS 또는 패키지 박스는 필요하지 않은 경우에만 수동 CI를 직접 실행하세요. Android를 제외한 직접 CI에는 첫 번째 명령을 사용하세요. 직접 릴리스 후보 CI에서 Android를 포함해야 한다면 `include_android=true`를 추가하세요.

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 박스는 `openclaw-live-and-e2e-checks-reusable.yml`을 통해 `OpenClaw Release Checks`에 있으며, 릴리스 모드 `install-smoke` 워크플로도 포함합니다. 소스 수준 테스트만 수행하는 대신 패키징된 Docker 환경을 통해 릴리스 후보를 검증합니다.

릴리스 Docker 범위에는 다음이 포함됩니다.

- 느린 Bun 전역 설치 스모크가 활성화된 전체 설치 스모크
- 대상 SHA별 루트 Dockerfile 스모크 이미지 준비/재사용과 별도 install-smoke 샤드로 실행되는 QR, 루트/Gateway 및 설치 프로그램/Bun 스모크 작업
- 저장소 E2E 레인
- 릴리스 경로 Docker 청크: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`부터 `plugins-runtime-install-h`까지, 그리고 `openwebui`
- 요청 시 전용 대용량 디스크 러너에서 실행되는 OpenWebUI 범위
- 분할된 번들 Plugin 설치/제거 레인 `bundled-plugin-install-uninstall-0`부터 `bundled-plugin-install-uninstall-23`까지
- 릴리스 검사에 라이브 스위트가 포함될 때 라이브/E2E 공급자 스위트 및 Docker 라이브 모델 범위

재실행 전에 Docker 아티팩트를 사용하세요. 릴리스 경로 스케줄러는 레인 로그, `summary.json`, `failures.json`, 단계별 타이밍, 스케줄러 계획 JSON 및 재실행 명령이 포함된 `.artifacts/docker-tests/`를 업로드합니다. 집중 복구에는 모든 릴리스 청크를 다시 실행하는 대신 재사용 가능한 라이브/E2E 워크플로에서 `docker_lanes=<lane[,lane]>`을 사용하세요. 생성된 재실행 명령에는 가능한 경우 이전 `package_artifact_run_id`와 준비된 Docker 이미지 입력이 포함되므로, 실패한 레인은 동일한 타볼과 GHCR 이미지를 재사용할 수 있습니다.

### QA Lab

QA Lab 박스도 `OpenClaw Release Checks`의 일부입니다. 이는 Vitest 및 Docker 패키지 메커니즘과 별개인 에이전트 동작 및 채널 수준 릴리스 게이트입니다.

릴리스 QA Lab 범위에는 다음이 포함됩니다.

- 에이전트 패리티 팩을 사용하여 OpenAI 후보 레인과 `anthropic/claude-opus-4-8` 기준선을 비교하는 모의 패리티 레인
- `qa-live-shared` 환경을 사용하는 빠른 라이브 Matrix QA 프로필
- Convex CI 자격 증명 임대를 사용하는 라이브 Telegram QA 레인
- 릴리스 원격 측정에 명시적인 로컬 검증이 필요한 경우 `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` 또는 `pnpm qa:observability:smoke`

이 박스는 "릴리스가 QA 시나리오와 라이브 채널 흐름에서 올바르게 동작하는가?"에 답하는 데 사용하세요. 릴리스를 승인할 때 패리티, Matrix 및 Telegram 레인의 아티팩트 URL을 보관하세요. 전체 Matrix 범위는 기본 릴리스 필수 레인이 아니라 수동 샤딩 QA-Lab 실행으로 계속 사용할 수 있습니다.

### 패키지

패키지 박스는 설치 가능한 제품 게이트입니다. `Package Acceptance`와 리졸버 `scripts/resolve-openclaw-package-candidate.mjs`를 기반으로 합니다. 리졸버는 후보를 Docker E2E가 사용하는 `package-under-test` 타볼로 정규화하고, 패키지 인벤토리를 검증하며, 패키지 버전과 SHA-256을 기록하고, 워크플로 하네스 ref를 패키지 소스 ref와 분리된 상태로 유지합니다.

지원되는 후보 소스:

- `source=npm`: `openclaw@beta`, `openclaw@latest` 또는 정확한 OpenClaw 릴리스 버전
- `source=ref`: 선택한 `workflow_ref` 하네스를 사용하여 신뢰할 수 있는 `package_ref` 브랜치, 태그 또는 전체 커밋 SHA를 패킹
- `source=url`: 필수 `package_sha256`과 함께 공개 HTTPS `.tgz` 다운로드. URL 자격 증명, 기본값이 아닌 HTTPS 포트, 비공개/내부/특수 용도 호스트 이름이나 확인된 주소 및 안전하지 않은 리디렉션은 거부됩니다.
- `source=trusted-url`: `.github/package-trusted-sources.json`의 명명된 정책에서 필수 `package_sha256` 및 `trusted_source_id`와 함께 HTTPS `.tgz` 다운로드. `source=url`에 입력 수준 비공개 네트워크 우회를 추가하는 대신 유지관리자 소유 엔터프라이즈 미러 또는 비공개 패키지 저장소에 사용하세요.
- `source=artifact`: 다른 GitHub Actions 실행에서 업로드한 `.tgz` 재사용

`OpenClaw Release Checks`는 준비된 릴리스 패키지 아티팩트와 함께 `source=artifact`, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`를 사용하여 Package Acceptance를 실행합니다. Package Acceptance는 동일하게 확인된 타볼을 대상으로 마이그레이션, 업데이트, 루트 관리형 VPS 업그레이드, 구성된 인증의 업데이트 재시작, 라이브 ClawHub Skills 설치, 오래된 Plugin 종속성 정리, 오프라인 Plugin 픽스처, Plugin 업데이트, Plugin 명령 바인딩 이스케이프 강화 및 Telegram 패키지 QA를 유지합니다. 차단형 릴리스 검사는 기본적으로 최신 게시 패키지 기준선을 사용합니다. `run_release_soak=true`, `release_profile=stable` 또는 `release_profile=full`인 베타 프로필은 게시된 업그레이드 생존자 검사를 `last-stable-4`와 고정된 `2026.4.23`, `2026.5.2`, `2026.4.15` 기준선의 `reported-issues` 시나리오까지 확장합니다. 이미 출시된 후보에는 `source=npm`을, 게시 전 SHA 기반 로컬 npm 타볼에는 `source=ref`를, 유지관리자 소유 엔터프라이즈/비공개 미러에는 `source=trusted-url`을, 다른 GitHub Actions 실행에서 업로드한 준비된 타볼에는 `source=artifact`를 사용하여 Package Acceptance를 실행하세요.

이는 이전에 Parallels가 필요했던 대부분의 패키지/업데이트 범위를 대체하는 GitHub 네이티브 방식입니다. 크로스 OS 릴리스 검사는 OS별 온보딩, 설치 프로그램 및 플랫폼 동작에 여전히 중요하지만, 패키지/업데이트 제품 검증에는 Package Acceptance를 우선 사용해야 합니다.

업데이트 및 Plugin 검증의 표준 체크리스트는 [업데이트 및 Plugin 테스트](/ko/help/testing-updates-plugins)입니다. Plugin 설치/업데이트, doctor 정리 또는 게시된 패키지 마이그레이션 변경을 어떤 로컬, Docker, Package Acceptance 또는 릴리스 검사 레인이 검증하는지 결정할 때 사용하세요. 모든 안정 버전 `2026.4.23+` 패키지에서 수행하는 포괄적인 게시 업데이트 마이그레이션은 별도의 수동 `Update Migration` 워크플로이며 Full Release CI의 일부가 아닙니다.

레거시 패키지 승인 완화는 의도적으로 기간이 제한되어 있습니다. `2026.4.25`까지의 패키지는 npm에 이미 게시된 메타데이터 누락에 대한 호환성 경로를 사용할 수 있습니다. 여기에는 타볼에서 누락된 비공개 QA 인벤토리 항목, 누락된 `gateway install --wrapper`, 타볼에서 파생된 git 픽스처에서 누락된 패치 파일, 누락된 영구 `update.channel`, 레거시 Plugin 설치 기록 위치, 누락된 마켓플레이스 설치 기록 영속성 및 `plugins update` 중 구성 메타데이터 마이그레이션이 포함됩니다. 게시된 `2026.4.26` 패키지는 이미 출시된 로컬 빌드 메타데이터 스탬프 파일에 대해 경고할 수 있습니다. 이후 패키지는 최신 패키지 계약을 충족해야 하며, 동일한 누락 사항이 있으면 릴리스 검증이 실패합니다.

릴리스 관련 질문이 실제 설치 가능한 패키지에 관한 것이라면 더 광범위한 Package Acceptance 프로필을 사용하세요.

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

- `smoke`: 빠른 패키지 설치/채널/에이전트, Gateway 네트워크 및 구성 다시 로드 레인
- `package`: 설치/업데이트/재시작/Plugin 패키지 계약과 실제 ClawHub Skills 설치 증명. 릴리스 검사 기본값입니다.
- `product`: `package`에 MCP 채널, Cron/하위 에이전트 정리, OpenAI 웹 검색 및 OpenWebUI를 추가합니다.
- `full`: OpenWebUI를 포함한 Docker 릴리스 경로 청크
- `custom`: 집중 재실행을 위한 정확한 `docker_lanes` 목록

패키지 후보의 Telegram 증명에는 Package Acceptance에서 `telegram_mode=mock-openai` 또는 `telegram_mode=live-frontier`를 활성화합니다. 워크플로는 해석된 `package-under-test` tarball을 Telegram 레인에 전달합니다. 독립형 Telegram 워크플로는 게시 후 검사를 위해 게시된 npm 사양도 계속 허용합니다.

## 정규 릴리스 게시 자동화

베타, `latest`, Plugin, GitHub Release 및 플랫폼 게시에는
`OpenClaw Release Publish`가 일반적인 변경 진입점입니다. 월별
`.33+` npm 전용 확장 안정판 경로는 이 오케스트레이터를 사용하지 않습니다.
정규 워크플로는 릴리스에 필요한 순서대로 신뢰할 수 있는 게시자 워크플로를
조정합니다.

1. 릴리스 태그를 체크아웃하고 해당 커밋 SHA를 확인합니다.
2. 태그가 `main` 또는 `release/*`에서 도달 가능한지 확인합니다(알파 사전 릴리스의 경우 Tideclaw 알파 브랜치도 허용).
3. `pnpm plugins:sync:check`를 실행합니다.
4. `publish_scope=all-publishable` 및 `ref=<release-sha>`로 `Plugin NPM Release`를 디스패치합니다.
5. 동일한 범위와 SHA로 `Plugin ClawHub Release`를 디스패치합니다.
6. 저장된 `full_release_validation_run_id`와 정확한 실행 시도를 확인한 후, 릴리스 태그, npm dist-tag 및 저장된 `preflight_run_id`로 `OpenClaw NPM Release`를 디스패치합니다.
7. 안정 릴리스에서는 GitHub 릴리스를 초안으로 생성하거나 업데이트하고, 명시적인 `windows_node_tag`와 후보 승인 `windows_node_installer_digests`로 `Windows Node Release`를 디스패치한 다음, 표준 Windows 설치 프로그램/체크섬 자산을 확인합니다. 또한 정확한 태그의 서명된 APK와 체크섬 및 출처 정보를 빌드하도록 `Android Release`를 디스패치합니다. 초안을 게시하기 전에 두 네이티브 자산 계약을 모두 확인합니다.

베타 게시 예시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

기본 베타 dist-tag로 안정판 게시:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

`latest`로 직접 안정판을 승격하려면 명시적으로 지정해야 합니다.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

하위 수준의 `Plugin NPM Release` 및 `Plugin ClawHub Release` 워크플로는 집중 복구 또는 재게시 작업에만 사용합니다. `OpenClaw Release Publish`는 `publish_openclaw_npm=true`일 때 `plugin_publish_scope=selected`를 거부하므로, `@openclaw/diffs-language-pack`을 포함하여 게시 가능한 모든 공식 Plugin 없이 코어 패키지가 출시될 수 없습니다. 선택한 Plugin을 복구하려면 `plugin_publish_scope=selected` 및 `plugins=@openclaw/name`과 함께 `publish_openclaw_npm=false`를 설정하거나 하위 워크플로를 직접 디스패치합니다.

최초 게시 ClawHub 부트스트랩은 예외입니다. 신뢰할 수 있는 `main`에서 `Plugin ClawHub New`를 디스패치하고 `ref`를 통해 전체 대상 릴리스 SHA를 전달합니다.
부트스트랩 워크플로 자체는 릴리스 태그나 브랜치에서 절대 실행하지 마십시오.

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

태그 전 검증에는 `dry_run=true`가 필요하며, 릴리스 태그 및 상위 실행
입력을 거부하고 `main` 또는 `release/*`에서 도달 가능한 정확한 대상만
허용합니다. ClawHub 자격 증명을 로드하거나 패키지 바이트를 게시하거나
신뢰할 수 있는 게시자 구성을 변경하지 않습니다. 워크플로는 계속해서 실제 레지스트리 계획을 확인하고,
비밀 정보가 없는 작업에서만 대상을 체크아웃하고 패키징하며, 잠긴 ClawHub 도구 체인을
구성하고, 릴리스 태그가 존재하기 전에 변경 불가능한 아티팩트와 패키지
슬러그/ID를 검증합니다. 비밀 정보가 없는 패키징 작업이
완료된 후에만 `clawhub-plugin-bootstrap` 환경을 승인합니다. 이 보호된 검증 작업에는
자격 증명이나 변경 명령이 없습니다.

승인된 드라이런이나 태그 지정 후의 실제 부트스트랩에는 정확한
릴리스 태그와 상위 `OpenClaw Release Publish` 실행 ID, 시도 및
브랜치가 포함되어야 합니다. 상위 워크플로는 자체 워크플로 SHA와 `Plugin ClawHub New`용 별도의 정확하고 신뢰할 수 있는
`main` SHA를 증명합니다. 하위 실행과 모든 보호된
환경 승인은 승인된 해당 하위 SHA와 일치해야 합니다. 릴리스 태그는
모든 게시 시도 및 신뢰할 수 있는 게시자 변경 전에 다시 검사됩니다.

패키징 작업은
이름, Actions 아티팩트 ID/다이제스트,
생성자 실행/시도, 대상 SHA 및 패키지별 tarball SHA-256/크기가
검증 및 보호 작업으로 전달되는 하나의 변경 불가능한 아티팩트를
업로드합니다. 보호된 작업은 신뢰할 수 있는 `main`
도구만 체크아웃하고, GitHub API를 통해 아티팩트 튜플을 검증하며, 정확한 아티팩트 ID로
다운로드하고, 모든 tarball을 다시 해싱한 후 고정된 CLI의 USTAR 정규화 규칙에 따라 로컬 TAR 경로와
패키지 ID를 검증합니다. 이후 모든
후보는 고정된 CLI 게시 드라이런을 통과하며, 이 드라이런은
레지스트리 조회나 인증 전에 반환됩니다. 자격 증명 작업의 사전 필터는 압축된 ClawPack을
120 MiB, 전체 파일 페이로드를 50 MiB, 확장된 TAR 데이터를 64 MiB,
TAR 항목 수를 10,000개로 제한합니다. 기존 패키지의 신뢰할 수 있는 게시자 복구는
구성 전용으로 유지되지만, 여전히 대상을 패키징하며 신뢰할 수 있는 게시자
구성을 변경하기 전에 요청된 태그와 정확한 레지스트리 바이트 및 메타데이터가 일치해야 합니다.
게시 후 검증은 ClawHub 아티팩트를 다운로드하고
동일한 SHA-256과 크기를 요구합니다. 실패한 작업 재실행 복구는 정확한
생성자 작업이 성공적으로 완료된 경우에만 이전
시도의 패키지 아티팩트를 재사용할 수 있습니다. 최종 증거에는 잠긴 ClawHub 버전, 잠금
SHA-256 및 npm 무결성도 연결됩니다. 불일치가 발생하면 새 패키지 버전이 필요합니다.

## NPM 워크플로 입력

`OpenClaw NPM Release`는 다음 운영자 제어 입력을 허용합니다.

- `tag`: `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` 또는 `v2026.4.2-alpha.1`과 같은 필수 릴리스 태그입니다. `preflight_only=true`일 때는 검증 전용 사전 점검을 위해 현재 워크플로 브랜치의 전체 40자 커밋 SHA도 사용할 수 있습니다.
- `preflight_only`: 검증/빌드/패키징만 수행하려면 `true`, 실제 게시 경로에는 `false`
- `preflight_run_id`: 기존에 성공한 사전 점검 실행 ID입니다. 워크플로가 다시 빌드하는 대신 준비된 tarball을 재사용하도록 실제 게시 경로에 필요합니다.
- `full_release_validation_run_id`: 이 태그/SHA에 성공한 `Full Release Validation` 실행 ID이며 실제 게시에 필요합니다. 베타 게시는 경고와 함께 사전 점검만으로 진행할 수 있지만, 안정판/`latest` 승격에는 여전히 필요합니다.
- `full_release_validation_run_attempt`: `full_release_validation_run_id`와 연결된 정확한 양의 실행 시도입니다. 실행 ID를 제공할 때마다 필수이므로 재실행이 게시 중 승인 증거를 변경할 수 없습니다.
- `release_publish_run_id`: 승인된 `OpenClaw Release Publish` 실행 ID입니다. 이 워크플로가 해당 상위 워크플로에서 디스패치될 때 필요합니다(봇 행위자의 실제 게시 호출).
- `plugin_npm_run_id`: 정확한 헤드에서 성공한 `Plugin NPM Release` 실행 ID입니다. 실제 `extended-stable` 코어 게시에 필요합니다.
- `npm_dist_tag`: 게시 경로의 npm 대상 태그입니다. `alpha`, `beta`, `latest` 또는 `extended-stable`을 허용하며 기본값은 `beta`입니다. 최종 패치 `33` 이상에서는 `extended-stable`을 사용해야 합니다. 기본적으로 `extended-stable`은 이전 패치를 거부하며 최종 버전이 아닌 태그는 항상 거부합니다.
- `bypass_extended_stable_guard`: 테스트 전용 불리언이며 기본값은 `false`입니다. `npm_dist_tag=extended-stable`과 함께 사용하면 릴리스 ID, 아티팩트, 승인 및 재확인 검사를 유지하면서 월별 확장 안정판 적격성 검사를 우회합니다.

`Plugin NPM Release`는 기존 릴리스
동작에 `npm_dist_tag=default`를, 보호된 월별 경로에는 `npm_dist_tag=extended-stable`을 허용합니다.
확장 안정판 옵션에는 `publish_scope=all-publishable`, 빈
`plugins` 입력, `33` 이상의 최종 패치 및 정확한 팁을 가리키는 표준
`extended-stable/YYYY.M.33` 브랜치가 필요합니다. Plugin의
`latest` 또는 `beta`는 절대 이동하지 않습니다. 새 패키지 버전은 OIDC 신뢰 게시(`npm publish --tag extended-stable`)를 통해
`extended-stable`을 원자적으로 부여받습니다. 이
소스 워크플로는 토큰 인증 방식의 `npm dist-tag add`를 사용하지 않습니다. 재시도는
npm에 이미 존재하는 정확한 버전을 건너뛴 다음, 모든 정확한
패키지와 `extended-stable` 태그가 수렴했음을 완전한 재확인으로 확인하지 못하면 안전하게 실패합니다.

`OpenClaw Release Publish`는 다음 운영자 제어 입력을 허용합니다.

- `tag`: 필수 릴리스 태그이며 이미 존재해야 합니다.
- `preflight_run_id`: 성공한 `OpenClaw NPM Release` 사전 점검 실행 ID입니다. `publish_openclaw_npm=true` 또는 `plugin_publish_scope=all-publishable`일 때 필요합니다.
- `full_release_validation_run_id`: 성공한 `Full Release Validation` 실행 ID입니다. `publish_openclaw_npm=true` 또는 `plugin_publish_scope=all-publishable`일 때 필요합니다.
- `full_release_validation_run_attempt`: `full_release_validation_run_id`와 연결된 정확한 양의 시도입니다. 실행 ID를 제공할 때마다 필수입니다.
- `windows_node_tag`: 정확한 비사전 릴리스 `openclaw/openclaw-windows-node` 릴리스 태그입니다. 안정판 OpenClaw 게시에 필요합니다.
- `windows_node_installer_digests`: 현재 Windows 설치 프로그램 이름과 고정된 `sha256:` 다이제스트를 연결하는 후보 승인 압축 JSON 맵입니다. 안정판 OpenClaw 게시에 필요합니다.
- `npm_telegram_run_id`: 최종 릴리스 증거에 포함할 수 있는 선택적 성공 `NPM Telegram Beta E2E` 실행 ID
- `npm_dist_tag`: OpenClaw 패키지의 npm 대상 태그이며 `alpha`, `beta` 또는 `latest` 중 하나입니다.
- `plugin_publish_scope`: 기본값은 `all-publishable`입니다. `publish_openclaw_npm=false`를 사용한 집중 Plugin 전용 복구 작업에만 `selected`를 사용합니다.
- `plugins`: `plugin_publish_scope=selected`일 때 쉼표로 구분한 `@openclaw/*` 패키지 이름
- `publish_openclaw_npm`: 기본값은 `true`입니다. 워크플로를 Plugin 전용 복구 오케스트레이터로 사용할 때만 `false`로 설정합니다.
- `release_profile`: 릴리스 증거 요약에 사용되는 릴리스 범위 프로필입니다. 기본값은 검증 매니페스트에서 읽는 `from-validation`이며, `beta`, `stable` 또는 `full`로 재정의할 수 있습니다.
- `wait_for_clawhub`: npm 가용성이 ClawHub 사이드카에 의해 차단되지 않도록 기본값은 `false`입니다. 워크플로 완료에 ClawHub 완료가 반드시 포함되어야 할 때만 `true`로 설정합니다.

`OpenClaw Release Checks`는 다음 운영자 제어 입력을 허용합니다.

- `ref`: 검증할 브랜치, 태그 또는 전체 커밋 SHA입니다. 비밀 정보가 포함된 검사에서는 확인된 커밋이 OpenClaw 브랜치 또는 릴리스 태그에서 도달 가능해야 합니다.
- `run_release_soak`: 베타 릴리스 검사에서 포괄적인 실제/E2E, Docker 릴리스 경로 및 모든 이전 버전 이후의 업그레이드 생존 검사를 사용하도록 선택합니다. `release_profile=stable` 및 `release_profile=full`에서는 강제로 활성화됩니다.

규칙:

- 패치 버전 `33` 미만의 일반 최종 버전과 수정 버전은 `beta` 또는 `latest` 중 하나에 게시할 수 있습니다. 패치 버전 `33` 이상의 최종 버전은 반드시 `extended-stable`에 게시해야 하며, 이 경계에 해당하는 수정 접미사 버전은 거부됩니다.
- 베타 사전 릴리스 태그는 `beta`에만 게시할 수 있으며, 알파 사전 릴리스 태그는 `alpha`에만 게시할 수 있습니다.
- `OpenClaw NPM Release`에서는 `preflight_only=true`인 경우에만 전체 커밋 SHA 입력이 허용됩니다.
- `OpenClaw Release Checks`와 `Full Release Validation`은 항상 검증 전용입니다.
- 실제 게시 경로에서는 사전 점검 중에 사용한 것과 동일한 `npm_dist_tag`를 사용해야 합니다. 워크플로는 게시를 계속하기 전에 해당 메타데이터를 검증합니다.

## 일반 beta/latest 안정 릴리스 순서

이 레거시 순서는 Plugin, GitHub 릴리스, Windows 및 기타 플랫폼 작업도 담당하는 일반 오케스트레이션 릴리스용입니다. 이 페이지 상단에 설명된 월간 `.33+` npm 전용 extended-stable 경로가 아닙니다.

일반 오케스트레이션 안정 릴리스를 생성할 때는 다음을 수행합니다.

1. `preflight_only=true`로 `OpenClaw NPM Release`를 실행합니다. 태그가 아직 존재하지 않는 경우 사전 점검 워크플로의 검증 전용 시험 실행에 현재 전체 워크플로 브랜치 커밋 SHA를 사용할 수 있습니다.
2. 일반적인 베타 우선 흐름에는 `npm_dist_tag=beta`를 선택하고, 의도적으로 안정 버전에 직접 게시하려는 경우에만 `latest`를 선택합니다.
3. 하나의 수동 워크플로에서 일반 CI와 라이브 프롬프트 캐시, Docker, QA Lab, Matrix 및 Telegram 범위를 모두 검증하려면 릴리스 브랜치, 릴리스 태그 또는 전체 커밋 SHA에서 `Full Release Validation`을 실행합니다. 의도적으로 결정론적인 일반 테스트 그래프만 필요한 경우에는 대신 릴리스 참조에서 수동 `CI` 워크플로를 실행합니다.
4. 서명된 x64 및 ARM64 설치 프로그램을 배포할 정확한 비사전 릴리스 `openclaw/openclaw-windows-node` 릴리스 태그를 선택합니다. 이를 `windows_node_tag`로 저장하고, 검증된 다이제스트 맵을 `windows_node_installer_digests`로 저장합니다. 릴리스 후보 도우미는 두 값을 모두 기록하고 생성된 게시 명령에 포함합니다.
5. 성공한 `preflight_run_id`, `full_release_validation_run_id` 및 정확한 `full_release_validation_run_attempt`를 저장합니다.
6. 신뢰할 수 있는 `main`에서 동일한 `tag`, 동일한 `npm_dist_tag`, 선택한 `windows_node_tag`, 저장한 `windows_node_installer_digests`, 저장한 `preflight_run_id`, `full_release_validation_run_id` 및 `full_release_validation_run_attempt`를 사용하여 `OpenClaw Release Publish`를 실행합니다. 이 워크플로는 OpenClaw npm 패키지를 승격하기 전에 외부화된 Plugin을 npm과 ClawHub에 게시합니다.
7. 릴리스가 `beta`에 게시된 경우 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 워크플로를 사용하여 해당 안정 버전을 `beta`에서 `latest`로 승격합니다.
8. 릴리스를 의도적으로 `latest`에 직접 게시했고 `beta`도 즉시 동일한 안정 빌드를 가리켜야 하는 경우, 동일한 릴리스 워크플로를 사용하여 두 dist-tag가 모두 안정 버전을 가리키도록 하거나 예약된 자가 복구 동기화가 나중에 `beta`를 이동하도록 둡니다.

dist-tag 변경에는 여전히 `NPM_TOKEN`이 필요하므로 릴리스 원장 저장소에서 처리하며, 소스 저장소는 OIDC 전용 게시를 유지합니다. 이를 통해 직접 게시 경로와 베타 우선 승격 경로가 모두 문서화되고 운영자에게 표시됩니다.

메인테이너가 로컬 npm 인증으로 대체해야 하는 경우 모든 1Password CLI(`op`) 명령은 전용 tmux 세션 안에서만 실행합니다. 기본 에이전트 셸에서 `op`를 직접 호출하지 마십시오. tmux 안에서 실행하면 프롬프트, 경고 및 OTP 처리를 관찰할 수 있으며 호스트 경고가 반복되는 것을 방지할 수 있습니다.

## 공개 참조 자료

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

메인테이너는 실제 실행 절차에 [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)의 비공개 릴리스 문서를 사용합니다.

## 관련 항목

- [릴리스 채널](/ko/install/development-channels)
