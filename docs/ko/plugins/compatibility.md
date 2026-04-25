---
read_when:
    - OpenClaw Plugin을 유지 관리하는 경우
    - Plugin 호환성 경고가 표시되는 경우
    - Plugin SDK 또는 manifest 마이그레이션을 계획 중인 경우
summary: Plugin 호환성 계약, 지원 중단 메타데이터 및 마이그레이션 기대 사항
title: Plugin 호환성
x-i18n:
    generated_at: "2026-04-25T06:05:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw는 오래된 Plugin 계약을 제거하기 전에 이름이 지정된 호환성
어댑터를 통해 계속 연결해 둡니다. 이렇게 하면 SDK, manifest, setup, config, 에이전트 런타임 계약이 진화하는 동안 기존 번들 및 외부
Plugin을 보호할 수 있습니다.

## 호환성 레지스트리

Plugin 호환성 계약은 코어 레지스트리
`src/plugins/compat/registry.ts`에서 추적됩니다.

각 레코드에는 다음이 포함됩니다:

- 안정적인 호환성 코드
- 상태: `active`, `deprecated`, `removal-pending`, 또는 `removed`
- 소유자: SDK, config, setup, 채널, provider, Plugin 실행,
  에이전트 런타임 또는 코어
- 해당하는 경우 도입 및 지원 중단 날짜
- 대체 안내
- 이전 및 새 동작을 다루는 문서, 진단, 테스트

레지스트리는 유지 관리 계획과 향후 Plugin inspector 검사에 대한 기준입니다. Plugin 사용자 대상 동작이 변경되면, 어댑터를 추가하는 동일한 변경에서 호환성 레코드도 추가하거나 업데이트하세요.

## Plugin inspector 패키지

Plugin inspector는 버전이 지정된 호환성 및 manifest
계약을 기반으로 하는 별도 패키지/리포지토리로, 코어 OpenClaw 리포지토리 외부에 있어야 합니다.

첫날의 CLI는 다음과 같아야 합니다:

```sh
openclaw-plugin-inspector ./my-plugin
```

출력해야 하는 항목:

- manifest/schema 검증
- 검사 중인 계약 호환성 버전
- install/source 메타데이터 검사
- cold-path import 검사
- 지원 중단 및 호환성 경고

CI annotation에서 안정적인 기계 판독 출력을 원하면 `--json`을 사용하세요. OpenClaw
코어는 inspector가 소비할 계약과 fixture를 노출해야 하지만, inspector 바이너리를 메인 `openclaw` 패키지에서 배포해서는 안 됩니다.

## 지원 중단 정책

OpenClaw는 문서화된 Plugin 계약을 대체 항목을 도입한 동일 릴리스에서 제거해서는 안 됩니다.

마이그레이션 순서는 다음과 같습니다:

1. 새 계약을 추가합니다.
2. 이름이 지정된 호환성 어댑터를 통해 이전 동작을 계속 연결해 둡니다.
3. Plugin 작성자가 대응할 수 있을 때 진단 또는 경고를 출력합니다.
4. 대체 항목과 일정을 문서화합니다.
5. 이전 경로와 새 경로를 모두 테스트합니다.
6. 공지된 마이그레이션 기간을 기다립니다.
7. 명시적인 브레이킹 릴리스 승인 하에서만 제거합니다.

지원 중단된 레코드에는 경고 시작 날짜, 대체 항목, 문서 링크, 그리고 알려진 경우 목표 제거 날짜가 반드시 포함되어야 합니다.

## 현재 호환성 영역

현재 호환성 레코드에는 다음이 포함됩니다:

- `openclaw/plugin-sdk/compat` 같은 레거시 광범위 SDK import
- 레거시 hook 전용 Plugin 형태 및 `before_agent_start`
- 번들 Plugin allowlist 및 활성화 동작
- 레거시 provider/channel env-var manifest 메타데이터
- manifest contribution 소유권으로 대체되고 있는 activation hint
- 공개 명칭이 `agentRuntime` 쪽으로 이동하는 동안의 `embeddedHarness` 및 `agent-harness` 명칭 별칭
- registry-first `channelConfigs` 메타데이터가 도입되는 동안의 생성된 번들 채널 config 메타데이터 fallback

새 Plugin 코드는 레지스트리와 해당 마이그레이션 가이드에 나열된 대체 항목을 우선 사용해야 합니다. 기존 Plugin은 문서, 진단, 릴리스 노트에서 제거 기간이 공지될 때까지 호환성 경로를 계속 사용할 수 있습니다.

## 릴리스 노트

릴리스 노트에는 목표 날짜와 마이그레이션 문서 링크가 포함된 예정된 Plugin 지원 중단 사항이 포함되어야 합니다. 이 경고는 호환성 경로가 `removal-pending` 또는 `removed`로 이동하기 전에 반드시 제공되어야 합니다.
