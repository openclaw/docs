---
read_when:
    - 권한 상승 모드 기본값, 허용 목록 또는 슬래시 명령 동작 조정
    - 샌드박스된 에이전트가 호스트에 접근하는 방법 이해하기
summary: '권한 상승 실행 모드: 샌드박스화된 에이전트에서 샌드박스 외부의 명령 실행'
title: 권한 상승 모드
x-i18n:
    generated_at: "2026-05-06T06:41:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
---

샌드박스 안에서 에이전트가 실행되면 해당 `exec` 명령은 샌드박스 환경으로 제한됩니다. **권한 상승 모드**를 사용하면 에이전트가 대신 샌드박스를 벗어나 외부에서 명령을 실행할 수 있으며, 승인 게이트를 구성할 수 있습니다.

<Info>
  권한 상승 모드는 에이전트가 **샌드박스 처리된** 경우에만 동작을 변경합니다. 샌드박스 처리되지 않은 에이전트의 경우 exec는 이미 호스트에서 실행됩니다.
</Info>

## 지시문

슬래시 명령으로 세션별 권한 상승 모드를 제어합니다.

| 지시문           | 수행 작업                                                              |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | 구성된 호스트 경로에서 샌드박스 외부로 실행하고 승인은 유지합니다     |
| `/elevated ask`  | `on`과 동일합니다(별칭)                                                |
| `/elevated full` | 구성된 호스트 경로에서 샌드박스 외부로 실행하고 승인을 건너뜁니다     |
| `/elevated off`  | 샌드박스에 제한된 실행으로 돌아갑니다                                  |

`/elev on|off|ask|full`로도 사용할 수 있습니다.

현재 수준을 보려면 인수 없이 `/elevated`를 보내세요.

## 작동 방식

<Steps>
  <Step title="사용 가능 여부 확인">
    구성에서 Elevated가 활성화되어 있어야 하며, 보낸 사람이 허용 목록에 있어야 합니다.

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="수준 설정">
    세션 기본값을 설정하려면 지시문만 포함된 메시지를 보내세요.

    ```
    /elevated full
    ```

    또는 인라인으로 사용하세요(해당 메시지에만 적용됨).

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="명령이 샌드박스 외부에서 실행됨">
    권한 상승이 활성화되면 `exec` 호출은 샌드박스를 벗어납니다. 유효한 호스트는 기본적으로 `gateway`이며, 구성된/세션 exec 대상이 `node`인 경우에는 `node`입니다. `full` 모드에서는 exec 승인을 건너뜁니다. `on`/`ask` 모드에서는 구성된 승인 규칙이 계속 적용됩니다.
  </Step>
</Steps>

## 확인 순서

1. 메시지의 **인라인 지시문**(해당 메시지에만 적용됨)
2. **세션 재정의**(지시문만 포함된 메시지를 보내 설정)
3. **전역 기본값**(구성의 `agents.defaults.elevatedDefault`)

## 사용 가능 여부 및 허용 목록

- **전역 게이트**: `tools.elevated.enabled`(`true`여야 함)
- **보낸 사람 허용 목록**: 채널별 목록이 포함된 `tools.elevated.allowFrom`
- **에이전트별 게이트**: `agents.list[].tools.elevated.enabled`(더 제한만 가능)
- **에이전트별 허용 목록**: `agents.list[].tools.elevated.allowFrom`(보낸 사람이 전역 및 에이전트별 조건을 모두 충족해야 함)
- **Discord 폴백**: `tools.elevated.allowFrom.discord`가 생략된 경우 `channels.discord.allowFrom`이 폴백으로 사용됩니다
- **모든 게이트를 통과해야 합니다**. 그렇지 않으면 권한 상승은 사용할 수 없는 것으로 처리됩니다

허용 목록 항목 형식:

| 접두사                  | 일치 대상                       |
| ----------------------- | ------------------------------- |
| (없음)                  | 보낸 사람 ID, E.164 또는 From 필드 |
| `name:`                 | 보낸 사람 표시 이름             |
| `username:`             | 보낸 사람 사용자 이름           |
| `tag:`                  | 보낸 사람 태그                  |
| `id:`, `from:`, `e164:` | 명시적 ID 대상 지정             |

## 권한 상승이 제어하지 않는 것

- **도구 정책**: 도구 정책에서 `exec`가 거부된 경우, 권한 상승으로 이를 재정의할 수 없습니다.
- **호스트 선택 정책**: 권한 상승은 `auto`를 자유로운 교차 호스트 재정의로 바꾸지 않습니다. 구성된/세션 exec 대상 규칙을 사용하며, 대상이 이미 `node`인 경우에만 `node`를 선택합니다.
- **`/exec`와 별개**: `/exec` 지시문은 인증된 보낸 사람에 대한 세션별 exec 기본값을 조정하며 권한 상승 모드를 요구하지 않습니다.

<Note>
  bash 채팅 명령(`!` 접두사, `/bash` 별칭)은 별도의 게이트이며, 자체 `tools.bash.enabled` 플래그와 더불어 `tools.elevated`가 활성화되어 있어야 합니다. 권한 상승을 비활성화하면 `!` 셸 명령도 함께 차단됩니다.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Exec 도구" href="/ko/tools/exec" icon="terminal">
    에이전트에서 셸 명령 실행.
  </Card>
  <Card title="Exec 승인" href="/ko/tools/exec-approvals" icon="shield">
    `exec`에 대한 승인 및 허용 목록 시스템.
  </Card>
  <Card title="샌드박싱" href="/ko/gateway/sandboxing" icon="box">
    Gateway 수준 샌드박스 구성.
  </Card>
  <Card title="샌드박스 vs 도구 정책 vs 권한 상승" href="/ko/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    도구 호출 중 세 게이트가 조합되는 방식.
  </Card>
</CardGroup>
