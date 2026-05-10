---
read_when:
    - 채널 인그레스 리팩터링으로 코드가 과도하게 추가된 이유 검토
    - 라우트, 명령, 이벤트, 활성화 또는 액세스 그룹 정책을 번들 Plugin에서 코어로 이동
    - 채널 인그레스 헬퍼가 실제로 번들된 Plugin 코드를 삭제하는지 검토
sidebarTitle: Ingress core deletion
summary: 반복되는 채널 수신 연결 코드를 코어로 이동하기 위한 삭제 우선 계획.
title: Ingress 코어 삭제 계획
x-i18n:
    generated_at: "2026-05-10T19:50:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Ingress 코어 삭제 계획

Ingress 리팩터링은 순증 라인을 수천 줄 추가하는 동안에는 건전하지 않습니다. 코어
중앙화는 번들 Plugin 프로덕션 코드가 더 작아지고 기존 서드파티 SDK 호환성이 SDK/코어 shim으로
격리될 때만 의미가 있습니다.

원하는 런타임 형태:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

번들 Plugin은 해당 타입이 공개 Plugin API가 아닌 한, ingress를 다시 로컬 `AccessResult`,
`GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` 또는
`{ allowed, reasonCode }` 형태로 변환해서는 안 됩니다.

## 예산

`origin/main`과의 PR merge-base를 기준으로 측정하며, 추적되지 않은 파일을 포함합니다.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

남은 최소 정리 작업:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

주석만 삭제하는 것은 정리로 계산하지 않습니다. 이전 예산 패스는 복원된 QQBot 설명 주석을
포함했기 때문에 지나치게 관대했습니다. 이 문서는 실행 코드/문서/테스트 코드 이동만
추적합니다.

각 정리 웨이브 후 다시 측정하세요.

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## 진단

첫 번째 패스는 공유 ingress kernel을 추가한 뒤, 그 옆에 Plugin 로컬 인증을 너무 많이
남겼습니다.

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

이는 모델을 중복합니다. 코어 프로덕션은 약 3,376줄 증가했고, 번들 Plugin 프로덕션은
1,240줄 줄었습니다. 첫 번째 패스보다는 낫지만 최소 예산 안에는 들지 않습니다. 해결은 여전히
삭제 우선입니다.

- ingress 필드 이름만 바꾸는 Plugin DTO 삭제
- wrapper 형태만 검증하는 테스트 삭제
- 같은 패치에서 번들 Plugin 코드를 삭제할 때만 코어 helper 추가
- 기존 SDK 호환성은 SDK/코어 shim에만 유지
- wrapper 삭제로 안정적인 형태가 드러난 뒤 코어 재패킹

## 핫스팟

아직 줄여야 하는 양수 번들 프로덕션 파일:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

이 브랜치는 아직 최소 예산 안에 들지 않습니다. 남은 리뷰 관련 작업은 다른 코어 추상화를
추가하기 전에 반복 인증 흐름, turn 스캐폴딩 또는 wrapper 테스트를 삭제해야 합니다.

## 현재 코드 판독

건전한 코어 경계는 이미 `src/channels/message-access/runtime.ts`에 있습니다.
이 파일은 identity adapter, 유효 allowlist, pairing-store 읽기, route descriptor,
command/event preset, access group, 최종 resolved `ResolvedChannelMessageIngress`
projection을 소유합니다.

남은 증가는 대부분 이 경계 위에 쌓인 Plugin glue입니다.

- `extensions/telegram/src/ingress.ts`는 코어 결정을 Telegram 전용 command/event
  helper로 감싸며, call site는 여전히 미리 계산된 정규화 allowlist와 owner 목록을 전달합니다.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`,
  `extensions/matrix/src/matrix/monitor/access-state.ts`는 여전히 ingress 옆에
  로컬 policy DTO 또는 legacy decision 이름을 유지합니다.
- `extensions/signal/src/monitor/access-policy.ts`는 Signal identity 정규화와 pairing
  reply를 올바르게 로컬에 유지하지만, 여전히 direct ingress 소비로 접혀야 하는 wrapper
  경계가 있습니다.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts`,
  `extensions/zalouser/src/monitor.ts`는 여전히 ingress kernel 외부의 공유 turn helper로
  이동할 수 있는 route/envelope/turn 조립을 반복합니다.

결론: 같은 패치에서 이러한 Plugin wrapper 계층을 삭제할 때만 더 많은 코드를 코어로
이동하는 것이 유용합니다. wrapper 반환을 그대로 둔 채 또 다른 추상화를 추가하면 같은 실수를
반복합니다.

## 경계

코어는 일반 정책을 소유합니다.

- allowlist 정규화 및 매칭
- access-group 확장 및 diagnostics
- pairing-store DM allowlist 읽기
- route, sender, command, event, activation gate
- admission 매핑: dispatch, drop, skip, observe, pairing
- redacted state, decision, diagnostics, SDK 호환성 projection
- identity, route, command, event, activation, outcome을 위한 재사용 가능한 일반 descriptor

Plugin은 전송 사실과 side effect를 소유합니다.

- webhook/socket/request 진위성
- platform identity 추출 및 API lookup
- channel별 policy default
- pairing challenge 전달, reply, ack, reaction, typing, media, history,
  setup, doctor, status, log, user-facing copy

코어는 channel-agnostic을 유지해야 합니다. `src/channels/message-access` 안에 Discord,
Slack, Telegram, Matrix, room, guild, space, API client 또는 Plugin별 default가
있어서는 안 됩니다.

## 수락 규칙

모든 새 코어 helper는 즉시 번들 Plugin 프로덕션 코드를 삭제해야 합니다.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

다음 경우 중지하고 다시 설계하세요.

- Plugin 프로덕션 LOC가 증가함
- 테스트가 프로덕션 감소보다 더 빠르게 증가함
- 번들 hot path가 `ResolvedChannelMessageIngress`의 이름만 바꾼 DTO를 반환함
- 코어 helper에 channel id, platform object, API client 또는 channel-specific default가 필요함

## 작업 패키지

1. 예산 고정.
   LOC를 PR에 넣고, deprecated-ingress lint를 green으로 유지하며, cleanup commit에 before/after
   LOC를 포함합니다.

2. 얇은 DTO 경계 삭제.
   Plugin 로컬 wrapper 반환을 `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess` 또는 `ingress` 직접 사용으로 교체합니다.
   QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage, Tlon부터 시작합니다.
   wrapper-shape 테스트는 삭제하고, behavior 테스트는 유지합니다.

3. 삭제와 함께만 outcome 분류 추가.
   일반 classifier는 `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender`,
   `drop-ingress`를 노출할 수 있습니다. reason string이 아니라 decision graph에서 파생해야 하며,
   같은 패치에서 최소 세 개의 Plugin을 마이그레이션해야 합니다.

4. 삭제와 함께만 route descriptor builder 추가.
   Generic route target과 route sender helper는 route가 많은 Plugin을 즉시 줄이는 경우에만
   허용됩니다. Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack,
   Zalo, Zalo Personal이 첫 대상입니다.

5. 삭제와 함께만 command/event preset 추가.
   text-command, native-command, callback, origin-subject 형태를 중앙화합니다.
   command consumer는 command gate가 실행되지 않은 경우 기본값이 unauthorized여야 하며,
   event는 pairing을 시작해서는 안 됩니다.

6. boilerplate를 제거하는 경우에만 identity preset 공유.
   stable-id, stable-id-plus-aliases, phone/e164, multi-identifier helper는 raw value가
   adapter input으로만 들어가고 redacted state가 opaque id/count를 유지할 때 허용됩니다.

7. authorized turn assembly 공유.
   ingress kernel 외부에서 QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal의 반복된
   route/envelope/context/reply 스캐폴딩을 제거합니다. 코어는 route/session/envelope/dispatch
   sequencing을 소유할 수 있으며, Plugin은 delivery와 channel-specific context를 유지합니다.

8. 호환성 격리.
   Deprecated SDK helper는 source-compatible을 유지하지만, 번들 hot path는 deprecated ingress
   또는 command-auth facade를 import해서는 안 됩니다. 호환성 테스트는 번들 Plugin 내부가 아니라
   가짜 서드파티 Plugin을 사용해야 합니다.

9. 코어 재패킹.
   wrapper 삭제 후 one-use module을 접고, 사용하지 않는 export를 제거하며, compatibility
   projection을 hot path 밖으로 이동하고, identity, route, command/event, activation,
   access group, compatibility shim에 대한 집중 테스트를 유지합니다.

## 삭제 웨이브

이 순서대로 실행하세요. 각 웨이브는 번들 프로덕션 LOC를 낮춰야 합니다.

1. Wrapper 접기, 예상 Plugin delta: -400~-600.
   Plugin 로컬 `resolveXAccess`, `resolveXCommandAccess`, `accessFromIngress` result type을
   `ResolvedChannelMessageIngress`에서 직접 읽는 방식으로 교체합니다. 첫 대상:
   Discord DM command auth, Feishu policy, Matrix access state, Telegram ingress,
   Signal access policy, QQBot SDK adapter.

2. 공유 outcome helper, 예상 Plugin delta: -200~-350.
   최소 세 개의 Plugin에서 반복되는 `shouldBlockControlCommand`, pairing, activation skip,
   route block, sender block ladder를 삭제하는 경우에만 하나의 generic classifier를 추가합니다.

3. Route descriptor builder, 예상 Plugin delta: -200~-350.
   반복되는 route target과 route sender descriptor 조립을 코어 helper로 이동합니다. 첫 대상:
   Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo,
   Zalo Personal.

4. Turn assembly 공유, 예상 Plugin delta: -250~-450.
   단순 inbound Plugin에 공통 route/session/envelope/dispatch sequencing을 사용합니다.
   첫 대상: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. 코어 재패킹, 예상 core delta: -300~-700.
   Plugin이 runtime projection을 직접 소비한 뒤, one-use module을 삭제하고, 작은 파일을
   `runtime.ts` 또는 집중 sibling으로 다시 병합하며, SDK compatibility 파일을 번들 hot path와
   분리해 유지합니다.

6. 테스트 가지치기, 예상 test delta: -300~-600.
   제거된 wrapper shape만 검증하는 테스트를 삭제합니다. command denial, group fallback,
   origin-subject matching, activation skip, access group, pairing, redaction에 대한 behavior
   테스트는 유지합니다.

이 웨이브 이후 예상되는 최소 landing 형태:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## 이동 금지

플랫폼 구성 기본값, 설정 UX, doctor/fix 문구, API 조회,
Slack 소유자 존재 확인, Matrix 별칭/검증 처리, Telegram
콜백 파싱, 명령 구문 파싱, 네이티브 명령 등록, 반응
페이로드 파싱, 페어링 응답, 명령 응답, 승인, 입력 중 표시, 미디어, 기록,
또는 로그를 이동하지 마세요.

## 검증

대상 로컬 루프:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

LOC 추세가 예산 안에 들어오면 광범위한 변경 게이트/전체 제품군 증명에는 Testbox를 사용하세요.

각 작업 패키지는 다음을 기록합니다.

- 범주별 변경 전/후 LOC
- 삭제된 Plugin 래퍼
- 새 core 헬퍼 LOC(있는 경우)
- 실행한 대상 테스트
- 남은 핫스팟 목록

## 종료 기준

- 번들된 프로덕션 import가 더 이상 사용되지 않는 channel-access 또는 command-auth 퍼사드를 사용하지 않음
- 호환성 코드는 SDK/core 경계로 격리됨
- 번들된 Plugin은 인그레스 프로젝션 또는 일반 결과를 직접 사용함
- Plugin 프로덕션 LOC가 `origin/main` 대비 순 1,500 이상 감소함
- core 프로덕션 LOC가 <= +1,500이거나, 초과분이 상쇄되어 총합이
  <= +2,000을 유지함
- 대표 테스트가 수정, 라우트, 명령/이벤트, 활성화,
  액세스 그룹, 채널별 폴백 동작을 포함함
