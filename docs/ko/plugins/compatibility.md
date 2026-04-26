---
read_when:
    - OpenClaw Plugin을 유지보수하는 경우
    - Plugin 호환성 경고가 표시되는 경우
    - Plugin SDK 또는 manifest 마이그레이션을 계획 중인 경우
summary: Plugin 호환성 계약, 사용 중단 메타데이터, 마이그레이션 기대 사항
title: Plugin 호환성
x-i18n:
    generated_at: "2026-04-26T11:34:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw는 SDK, manifest, setup, config, 에이전트 런타임 계약이 발전하는 동안에도 기존 번들 Plugin과 외부 Plugin을 보호하기 위해, 이전 Plugin 계약을 제거하기 전에 이름이 있는 호환성 어댑터를 통해 계속 연결해 둡니다.

## 호환성 레지스트리

Plugin 호환성 계약은 코어 레지스트리 `src/plugins/compat/registry.ts`에서 추적됩니다.

각 레코드는 다음을 가집니다.

- 안정적인 호환성 코드
- 상태: `active`, `deprecated`, `removal-pending`, `removed`
- 소유자: SDK, config, setup, channel, provider, plugin execution, agent runtime 또는 core
- 해당하는 경우 도입일과 사용 중단일
- 대체 가이드
- 이전 및 새 동작을 다루는 문서, diagnostics, 테스트

레지스트리는 유지보수자 계획과 향후 plugin inspector 검사에서 기준이 되는 소스입니다. Plugin 사용자 대상 동작이 변경되면, 어댑터를 추가하는 동일한 변경에서 호환성 레코드도 추가하거나 업데이트하세요.

Doctor 복구 및 마이그레이션 호환성은 `src/commands/doctor/shared/deprecation-compat.ts`에서 별도로 추적됩니다. 이 레코드들은 런타임 호환성 경로가 제거된 뒤에도 계속 제공되어야 할 수 있는 오래된 config 형태, install-ledger 레이아웃, 복구 shim을 다룹니다.

릴리스 정리에서는 두 레지스트리를 모두 확인해야 합니다. 일치하는 런타임 또는 config 호환성 레코드가 만료되었다고 해서 doctor 마이그레이션을 바로 삭제하지 마세요. 먼저 여전히 해당 복구가 필요한 지원되는 업그레이드 경로가 없는지 확인해야 합니다. 또한 provider와 channel이 core 밖으로 이동함에 따라 Plugin 소유권과 config footprint가 바뀔 수 있으므로, 릴리스 계획 중 각 대체 annotation도 다시 검증하세요.

## Plugin inspector 패키지

plugin inspector는 버전 관리되는 호환성 및 manifest 계약을 기반으로 하는 별도 패키지/저장소로, 코어 OpenClaw 저장소 밖에 있어야 합니다.

초기 CLI는 다음과 같아야 합니다.

```sh
openclaw-plugin-inspector ./my-plugin
```

출력해야 하는 항목:

- manifest/schema 검증
- 검사 중인 계약 호환성 버전
- install/source 메타데이터 검사
- cold-path import 검사
- 사용 중단 및 호환성 경고

CI annotation에서 안정적인 기계 판독 가능 출력을 위해 `--json`을 사용하세요. OpenClaw core는 inspector가 소비할 수 있는 계약과 fixture를 제공해야 하지만, inspector 바이너리를 메인 `openclaw` 패키지에서 배포해서는 안 됩니다.

## 사용 중단 정책

OpenClaw는 대체 계약을 도입한 같은 릴리스에서 문서화된 Plugin 계약을 제거해서는 안 됩니다.

마이그레이션 순서는 다음과 같습니다.

1. 새 계약 추가
2. 이름이 있는 호환성 어댑터를 통해 이전 동작 유지
3. Plugin 작성자가 조치할 수 있을 때 diagnostics 또는 경고 출력
4. 대체 방식과 일정 문서화
5. 이전 경로와 새 경로 모두 테스트
6. 공지된 마이그레이션 기간 동안 대기
7. 명시적인 breaking-release 승인이 있을 때만 제거

사용 중단된 레코드에는 경고 시작일, 대체 항목, 문서 링크, 경고 시작 후 최대 3개월 이내의 최종 제거일이 포함되어야 합니다. 유지보수자가 영구 호환성으로 명시적으로 결정하고 `active`로 표시하지 않는 한, 종료일이 없는 사용 중단 호환성 경로를 추가하지 마세요.

## 현재 호환성 영역

현재 호환성 레코드에는 다음이 포함됩니다.

- `openclaw/plugin-sdk/compat` 같은 레거시 광범위 SDK import
- 레거시 hook 전용 Plugin 형태와 `before_agent_start`
- Plugin이 `register(api)`로 마이그레이션하는 동안의 레거시 `activate(api)` Plugin entrypoint
- `openclaw/extension-api`, `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth` status builder, `openclaw/plugin-sdk/test-utils`, `ClawdbotConfig` / `OpenClawSchemaType` type alias 같은 레거시 SDK 별칭
- 번들 Plugin allowlist 및 활성화 동작
- 레거시 provider/channel env-var manifest 메타데이터
- provider가 명시적 catalog, auth, thinking, replay, transport hook으로 이동하는 동안의 레거시 provider Plugin hook 및 type alias
- `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt` 같은 레거시 런타임 별칭
- memory Plugin이 `registerMemoryCapability`로 이동하는 동안의 레거시 memory-Plugin 분리 등록
- 기본 메시지 schema, mention gating, inbound envelope formatting, approval capability 중첩을 위한 레거시 channel SDK helper
- manifest contribution 소유권으로 대체되고 있는 activation hint
- setup descriptor가 cold `setup.requiresRuntime: false` 메타데이터로 이동하는 동안의 `setup-api` 런타임 폴백
- provider catalog hook이 `catalog.run(...)`으로 이동하는 동안의 provider `discovery` hook
- channel 패키지가 `openclaw.channel.exposure`로 이동하는 동안의 channel `showConfigured` / `showInSetup` 메타데이터
- doctor가 운영자를 `agentRuntime`으로 마이그레이션하는 동안의 레거시 runtime-policy config 키
- registry-first `channelConfigs` 메타데이터가 도입되는 동안의 생성된 번들 channel config 메타데이터 폴백
- 복구 흐름이 운영자를 `openclaw plugins registry --refresh` 및 `openclaw doctor --fix`로 마이그레이션하는 동안의 저장된 Plugin 레지스트리 비활성화 및 install-migration env 플래그
- doctor가 이를 `plugins.entries.<plugin>.config`로 마이그레이션하는 동안의 레거시 Plugin 소유 web search, web fetch, x_search config 경로
- install 메타데이터가 상태 관리형 Plugin ledger로 이동하는 동안의 레거시 `plugins.installs` 작성 config 및 번들 Plugin load-path 별칭

새 Plugin 코드는 레지스트리와 해당 마이그레이션 가이드에 나열된 대체 방식을 우선 사용해야 합니다. 기존 Plugin은 문서, diagnostics, 릴리스 노트에서 제거 기간이 공지될 때까지 호환성 경로를 계속 사용할 수 있습니다.

## 릴리스 노트

릴리스 노트에는 대상 날짜와 마이그레이션 문서 링크가 포함된 예정된 Plugin 사용 중단 사항이 들어가야 합니다. 이 경고는 호환성 경로가 `removal-pending` 또는 `removed`로 이동하기 전에 반드시 제공되어야 합니다.
