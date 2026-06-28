---
read_when:
    - 채널 수신 리팩터링이 왜 너무 많은 코드를 추가했는지 검토
    - 번들 Plugin에서 코어로 라우트, 명령, 이벤트, 활성화 또는 액세스 그룹 정책 이동
    - 채널 인그레스 헬퍼가 번들된 Plugin 코드를 실제로 삭제하는지 검토 중
sidebarTitle: Ingress core deletion
summary: 반복되는 채널 인그레스 연결 코드를 코어로 옮기기 위한 삭제 우선 계획.
title: 인그레스 코어 삭제 계획
x-i18n:
    generated_at: "2026-05-12T00:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# 인그레스 코어 삭제 계획

인그레스 리팩터는 순증 라인이 수천 줄씩 늘어나는 동안에는 건강하지 않습니다. 코어
중앙화는 번들 Plugin 프로덕션 코드가 더 작아지고, 오래된 서드파티 SDK 호환성이
SDK/코어 shim으로 격리될 때에만 의미가 있습니다.

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

번들 Plugin은 해당 타입이 공개 Plugin API가 아닌 한, 인그레스를 로컬 `AccessResult`,
`GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` 또는
`{ allowed, reasonCode }` 형태로 다시 변환하지 않아야 합니다.

## 예산

`origin/main`과의 PR merge-base를 기준으로 측정하며, 추적되지 않은 파일도 포함합니다.

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

최소 남은 정리 작업:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

주석만 삭제하는 것은 정리 작업으로 계산하지 않습니다. 이전 예산 패스는 복원된 QQBot
설명 주석을 포함했기 때문에 너무 관대했습니다. 이 문서는 실행 코드/문서/테스트 코드
이동만 추적합니다.

각 정리 웨이브 후 다시 측정합니다.

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## 진단

첫 번째 패스는 공유 인그레스 커널을 추가한 뒤, 그 옆에 Plugin 로컬 권한 부여를 너무 많이
남겼습니다.

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

이는 모델을 중복합니다. 코어 프로덕션은 약 3,376줄 늘었고, 번들 Plugin 프로덕션은
1,240줄 줄었습니다. 첫 번째 패스보다는 낫지만 최소 예산 안에는 들어오지 않습니다.
수정은 여전히 삭제 우선입니다.

- 인그레스 필드 이름만 바꾸는 Plugin DTO 삭제
- 래퍼 형태만 검증하는 테스트 삭제
- 같은 패치에서 번들 Plugin 코드를 삭제할 때만 코어 헬퍼 추가
- 오래된 SDK 호환성은 SDK/코어 shim 안에만 유지
- 래퍼 삭제로 안정적인 형태가 드러난 뒤 코어를 다시 패킹

## 핫스팟

아직 줄여야 할 양수 번들 프로덕션 파일:

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

브랜치는 아직 최소 예산 안에 들어오지 않았습니다. 남은 리뷰 관련 작업은 또 다른 코어
추상화를 추가하기 전에 반복되는 권한 부여 흐름, 턴 스캐폴딩 또는 래퍼 테스트를 삭제해야
합니다.

## 현재 코드 읽기

건강한 코어 경계는 이미 `src/channels/message-access/runtime.ts`에 있습니다.
이 파일은 ID 어댑터, 유효 allowlist, 페어링 저장소 읽기, 라우트 설명자,
명령/이벤트 프리셋, 액세스 그룹, 최종 해석된 `ResolvedChannelMessageIngress`
프로젝션을 소유합니다.

남은 증가는 대부분 그 경계 위에 얹힌 Plugin 글루 코드입니다.

- `extensions/telegram/src/ingress.ts`는 코어 결정을 Telegram 전용 명령/이벤트 헬퍼로
  감싸고, 호출 지점은 여전히 미리 계산된 정규화 allowlist와 owner 목록을 전달합니다.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`,
  `extensions/matrix/src/matrix/monitor/access-state.ts`는 여전히 인그레스 옆에
  로컬 정책 DTO나 레거시 결정 이름을 유지합니다.
- `extensions/signal/src/monitor/access-policy.ts`는 Signal ID 정규화와 페어링 답장을
  로컬에 올바르게 유지하지만, 직접적인 인그레스 소비로 접어야 할 래퍼 경계가 아직
  있습니다.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts`,
  `extensions/zalouser/src/monitor.ts`는 여전히 인그레스 커널 밖의 공유 턴 헬퍼로 옮길 수 있는
  라우트/엔벌로프/턴 조립을 반복합니다.

결론: 같은 패치에서 이러한 Plugin 래퍼 계층을 삭제할 때만 더 많은 코드를 코어로 옮기는 것이
유용합니다. 래퍼 반환을 그대로 둔 채 또 다른 추상화를 추가하는 것은 같은 실수를 반복하는
것입니다.

## 경계

코어는 일반 정책을 소유합니다.

- allowlist 정규화와 매칭
- 액세스 그룹 확장과 진단
- 페어링 저장소 DM allowlist 읽기
- 라우트, 발신자, 명령, 이벤트, 활성화 게이트
- 허용 매핑: dispatch, drop, skip, observe, pairing
- 삭제된 상태, 결정, 진단, SDK 호환성 프로젝션
- ID, 라우트, 명령, 이벤트, 활성화, 결과를 위한 재사용 가능한 일반 설명자

Plugin은 전송 계층 사실과 부수 효과를 소유합니다.

- webhook/socket/request 진위 확인
- 플랫폼 ID 추출과 API 조회
- 채널별 정책 기본값
- 페어링 챌린지 전달, 답장, ack, 반응, 타이핑, 미디어, 기록,
  설정, doctor, 상태, 로그, 사용자 표시 문구

코어는 채널에 독립적이어야 합니다. `src/channels/message-access`에는 Discord, Slack,
Telegram, Matrix, room, guild, space, API 클라이언트 또는 Plugin별 기본값이 없어야 합니다.

## 수락 규칙

모든 새 코어 헬퍼는 즉시 번들 Plugin 프로덕션 코드를 삭제해야 합니다.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

다음 경우 중단하고 다시 설계합니다.

- Plugin 프로덕션 LOC가 증가함
- 테스트가 프로덕션 축소보다 더 빠르게 증가함
- 번들 핫패스가 `ResolvedChannelMessageIngress`의 이름만 바꾼 DTO를 반환함
- 코어 헬퍼에 채널 id, 플랫폼 객체, API 클라이언트 또는 채널별 기본값이 필요함

## 작업 패키지

1. 예산을 동결합니다.
   PR에 LOC를 넣고, deprecated-ingress lint를 녹색으로 유지하며, 정리 커밋에 전/후
   LOC를 포함합니다.

2. 얇은 DTO 경계를 삭제합니다.
   Plugin 로컬 래퍼 반환을 `ResolvedChannelMessageIngress`, `senderAccess`,
   `commandAccess`, `routeAccess` 또는 `ingress` 직접 읽기로 교체합니다. QQBot,
   Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage, Tlon부터 시작합니다.
   래퍼 형태 테스트는 삭제하고 동작 테스트는 유지합니다.

3. 삭제와 함께만 결과 분류를 추가합니다.
   일반 분류기는 `dispatch`, `pairing-required`, `skip-activation`,
   `drop-command`, `drop-route`, `drop-sender`, `drop-ingress`를 노출할 수 있습니다.
   이는 이유 문자열이 아니라 결정 그래프에서 파생되어야 하며, 같은 패치에서 최소 세 개의
   Plugin을 마이그레이션해야 합니다.

4. 삭제와 함께만 라우트 설명자 빌더를 추가합니다.
   라우트가 많은 Plugin을 즉시 줄이는 경우에만 일반 라우트 대상 및 라우트 발신자 헬퍼를
   허용할 수 있습니다. 첫 대상은 Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal입니다.

5. 삭제와 함께만 명령/이벤트 프리셋을 추가합니다.
   텍스트 명령, 네이티브 명령, 콜백, origin-subject 형태를 중앙화합니다.
   명령 소비자는 명령 게이트가 실행되지 않았을 때 기본적으로 unauthorized여야 하며,
   이벤트는 페어링을 시작하면 안 됩니다.

6. 보일러플레이트를 제거하는 경우에만 ID 프리셋을 공유합니다.
   stable-id, stable-id-plus-aliases, phone/e164, multi-identifier 헬퍼는
   원시 값이 어댑터 입력으로만 들어가고 삭제된 상태가 불투명 id/개수를 유지할 때 허용됩니다.

7. authorized 턴 조립을 공유합니다.
   인그레스 커널 밖에서 QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal의 반복되는
   라우트/엔벌로프/컨텍스트/답장 스캐폴딩을 제거합니다. 코어는 라우트/세션/엔벌로프/dispatch
   시퀀싱을 소유할 수 있으며, Plugin은 전달과 채널별 컨텍스트를 유지합니다.

8. 호환성을 격리합니다.
   Deprecated SDK 헬퍼는 소스 호환성을 유지하지만, 번들 핫패스는 deprecated 인그레스나
   명령 인증 facade를 import하면 안 됩니다. 호환성 테스트는 번들 Plugin 내부가 아니라
   가짜 서드파티 Plugin을 사용해야 합니다.

9. 코어를 다시 패킹합니다.
   래퍼 삭제 후 1회용 모듈을 접고, 사용하지 않는 export를 제거하며, 호환성 프로젝션을
   핫패스 밖으로 옮기고, ID, 라우트, 명령/이벤트, 활성화, 액세스 그룹, 호환성 shim에 대한
   집중 테스트를 유지합니다.

## 삭제 웨이브

이 순서대로 실행합니다. 각 웨이브는 번들 프로덕션 LOC를 낮춰야 합니다.

1. 래퍼 접기, 예상 Plugin 델타: -400~-600.
   Plugin 로컬 `resolveXAccess`, `resolveXCommandAccess`, `accessFromIngress` 결과 타입을
   `ResolvedChannelMessageIngress`에서 직접 읽는 방식으로 교체합니다. 첫 대상은
   Discord DM 명령 인증, Feishu 정책, Matrix 액세스 상태, Telegram 인그레스,
   Signal 액세스 정책, QQBot SDK 어댑터입니다.

2. 공유 결과 헬퍼, 예상 Plugin 델타: -200~-350.
   최소 세 개의 Plugin에서 반복되는 `shouldBlockControlCommand`, 페어링, 활성화 skip,
   라우트 차단, 발신자 차단 ladder를 삭제하는 경우에만 하나의 일반 분류기를 추가합니다.

3. 라우트 설명자 빌더, 예상 Plugin 델타: -200~-350.
   반복되는 라우트 대상 및 라우트 발신자 설명자 조립을 코어 헬퍼로 옮깁니다. 첫 대상은
   Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo,
   Zalo Personal입니다.

4. 턴 조립 공유, 예상 Plugin 델타: -250~-450.
   단순 인바운드 Plugin에 공통 라우트/세션/엔벌로프/dispatch 시퀀싱을 사용합니다.
   첫 대상은 QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal입니다.

5. 코어 다시 패킹, 예상 코어 델타: -300~-700.
   Plugin이 런타임 프로젝션을 직접 소비한 뒤 1회용 모듈을 삭제하고, 작은 파일을
   `runtime.ts` 또는 집중된 형제 파일로 다시 병합하며, SDK 호환성 파일을 번들 핫패스와
   분리해 유지합니다.

6. 테스트 가지치기, 예상 테스트 델타: -300~-600.
   제거된 래퍼 형태만 검증하는 테스트를 삭제합니다. 명령 거부, 그룹 fallback,
   origin-subject 매칭, 활성화 skip, 액세스 그룹, 페어링, redaction에 대한 동작 테스트는
   유지합니다.

이 웨이브 이후 예상 최소 랜딩 형태:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## 이동 금지

플랫폼 구성 기본값, 설정 UX, doctor/fix 문구, API 조회,
Slack 소유자 존재 확인, Matrix 별칭/검증 처리, Telegram
callback 구문 분석, 명령 구문 분석, 네이티브 명령 등록, 반응
payload 구문 분석, pairing 응답, 명령 응답, 확인 응답, 입력 중 표시, 미디어, 기록,
또는 로그를 이동하지 마세요.

## 검증

대상 지정 로컬 반복:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

LOC 추세가 예산 안에 들어오면 광범위한 변경 게이트/전체 스위트 증명에는 Testbox를 사용하세요.

각 작업 패키지는 다음을 기록합니다.

- 범주별 변경 전/후 LOC
- 삭제된 plugin wrapper
- 새 core helper LOC(있는 경우)
- 실행한 대상 지정 테스트
- 남은 hotspot 목록

## 종료 기준

- 번들된 프로덕션 import가 더 이상 사용 중단된 channel-access 또는 command-auth facade를 사용하지 않음
- 호환성 코드가 SDK/core 연결 지점으로 격리됨
- 번들된 plugin이 ingress projection 또는 일반 outcome을 직접 사용함
- plugin 프로덕션 LOC가 `origin/main` 대비 순감소 1,500 이상임
- core 프로덕션 LOC가 `<= +1,500`이거나, 초과분이 상쇄되어 전체가
  `<= +2,000`을 유지함
- 대표 테스트가 redaction, route, command/event, activation,
  access-group, 채널별 fallback 동작을 포함함
