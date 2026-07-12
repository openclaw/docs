---
read_when:
    - 상승 모드 기본값, 허용 목록 또는 슬래시 명령 동작 조정
    - 샌드박스된 에이전트가 호스트에 액세스하는 방식 이해하기
summary: '권한 상승 실행 모드: 샌드박스된 에이전트에서 샌드박스 외부의 명령 실행'
title: 권한 상승 모드
x-i18n:
    generated_at: "2026-07-12T15:48:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

에이전트가 샌드박스 내부에서 실행될 때 해당 `exec` 명령은 샌드박스 환경으로 제한됩니다. **승격 모드**를 사용하면 에이전트가 샌드박스를 벗어나 외부에서 명령을 실행할 수 있으며, 승인 게이트를 구성할 수 있습니다.

<Info>
  승격 모드는 에이전트가 **샌드박스화된** 경우에만 동작을 변경합니다. 샌드박스화되지 않은 에이전트의 경우 exec는 이미 호스트에서 실행됩니다.
</Info>

## 지시어

슬래시 명령으로 세션별 승격 모드를 제어합니다.

| 지시어           | 기능                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | 구성된 호스트 경로에서 샌드박스 외부로 실행하고 승인을 유지합니다.                                                              |
| `/elevated ask`  | `on`과 동일합니다(별칭).                                                                                                        |
| `/elevated full` | 구성된 호스트 경로에서 샌드박스 외부로 실행하고 모드/호스트 승인 정책이 이미 허용적인 경우 승인을 건너뜁니다.                   |
| `/elevated off`  | 샌드박스로 제한된 실행으로 돌아갑니다.                                                                                           |

`/elev on|off|ask|full`로도 사용할 수 있습니다.

인수 없이 `/elevated`를 보내면 현재 수준을 확인할 수 있습니다.

## 작동 방식

<Steps>
  <Step title="사용 가능 여부 확인">
    구성에서 승격 모드를 활성화해야 하며 발신자가 허용 목록에 있어야 합니다.

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
    지시어만 포함된 메시지를 보내 세션 기본값을 설정합니다.

    ```
    /elevated full
    ```

    또는 인라인으로 사용합니다(해당 메시지에만 적용됨).

    ```
    /elevated on 배포 스크립트를 실행합니다
    ```

  </Step>

  <Step title="샌드박스 외부에서 명령 실행">
    승격 모드가 활성화되면 `exec` 호출은 샌드박스 외부에서 실행됩니다. 유효 호스트는
    기본적으로 `gateway`이며, 구성된/세션의 exec 대상이 `node`이면 `node`입니다.
    `full` 모드에서는 확인된 exec 모드/호스트 승인 정책이 이미 완전히 허용적인 경우
    (security `full`, ask `off`) exec 승인을 건너뜁니다. 그렇지 않으면 일반 승인 정책이
    계속 적용됩니다. `on`/`ask` 모드에서는 구성된 승인 규칙이 항상 적용됩니다.
  </Step>
</Steps>

## 확인 순서

1. 메시지의 **인라인 지시어**(해당 메시지에만 적용됨)
2. **세션 재정의**(지시어만 포함된 메시지를 보내 설정)
3. **전역 기본값**(구성의 `agents.defaults.elevatedDefault`)

## 사용 가능 여부 및 허용 목록

- **전역 게이트**: `tools.elevated.enabled`(`true`여야 함)
- **발신자 허용 목록**: 채널별 목록이 있는 `tools.elevated.allowFrom`
- **에이전트별 게이트**: `agents.list[].tools.elevated.enabled`(추가로 제한만 가능하며 전역 게이트와 에이전트별 게이트가 모두 `true`여야 함)
- **에이전트별 허용 목록**: `agents.list[].tools.elevated.allowFrom`(발신자가 전역 및 에이전트별 허용 목록 모두와 일치해야 함)
- **채널 제공 대체 허용 목록**: `tools.elevated.allowFrom.<provider>`가 구성되지 않은 경우 채널 Plugin이 SDK 어댑터 훅을 통해 대체 허용 목록을 선택적으로 제공할 수 있습니다. 현재 번들 채널 중 이 훅을 구현한 채널은 없으므로, 실제로는 현재 모든 공급자에 명시적인 `tools.elevated.allowFrom.<provider>` 항목이 필요합니다.
- **모든 게이트를 통과해야 합니다**. 그렇지 않으면 승격 모드를 사용할 수 없는 것으로 처리합니다.

허용 목록 항목 형식:

| 접두사                  | 일치 대상                      |
| ----------------------- | ------------------------------ |
| (없음)                  | 발신자 ID, E.164 또는 From 필드 |
| `name:`                 | 발신자 표시 이름               |
| `username:`             | 발신자 사용자 이름             |
| `tag:`                  | 발신자 태그                    |
| `id:`, `from:`, `e164:` | 명시적 ID 대상 지정            |

## 승격 모드가 제어하지 않는 항목

- **도구 정책**: 도구 정책에서 `exec`가 거부된 경우 승격 모드로 재정의할 수 없습니다.
- **호스트 선택 정책**: 승격 모드는 `auto`를 자유로운 호스트 간 재정의로 바꾸지 않습니다. 구성된/세션의 exec 대상 규칙을 사용하며, 대상이 이미 `node`인 경우에만 `node`를 선택합니다.
- **`/exec`와 별개**: `/exec` 지시어는 권한이 있는 발신자의 세션별 exec 기본값(host, security, ask, node)을 조정하며 승격 모드가 필요하지 않습니다.

<Note>
  bash 채팅 명령(`!` 접두사, `/bash` 별칭)은 별도의 게이트이며, 자체 `tools.bash.enabled` 플래그 외에도 `tools.elevated`가 활성화되어 있어야 합니다. 승격 모드를 비활성화하면 `!` 셸 명령도 사용할 수 없게 됩니다.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Exec 도구" href="/ko/tools/exec" icon="terminal">
    에이전트에서 셸 명령을 실행합니다.
  </Card>
  <Card title="Exec 승인" href="/ko/tools/exec-approvals" icon="shield">
    `exec`의 승인 및 허용 목록 시스템입니다.
  </Card>
  <Card title="샌드박스화" href="/ko/gateway/sandboxing" icon="box">
    Gateway 수준의 샌드박스 구성입니다.
  </Card>
  <Card title="샌드박스와 도구 정책 및 승격 모드 비교" href="/ko/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    도구 호출 중 세 가지 게이트가 결합되는 방식입니다.
  </Card>
</CardGroup>
