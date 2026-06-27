---
read_when:
    - iMessage 지원 설정
    - iMessage 송수신 디버깅
summary: imsg(stdio를 통한 JSON-RPC)를 통한 네이티브 iMessage 지원으로, 답장, tapback, 효과, 첨부 파일, 그룹 관리를 위한 비공개 API 작업을 제공합니다. 호스트 요구 사항이 맞는 경우 새로운 OpenClaw iMessage 설정에 권장됩니다.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage 배포에서는 로그인된 macOS Messages 호스트에서 `imsg`를 사용하세요. Gateway가 Linux 또는 Windows에서 실행되는 경우, Mac에서 `imsg`를 실행하는 SSH 래퍼를 `channels.imessage.cliPath`로 지정하세요.

**인바운드 복구는 자동입니다.** 브리지 또는 Gateway가 재시작된 뒤, iMessage는 중단된 동안 놓친 메시지를 다시 재생하고 Push 복구 후 Apple이 플러시할 수 있는 오래된 "backlog bomb"을 억제하며, 중복 제거를 통해 어떤 메시지도 두 번 디스패치되지 않게 합니다. 활성화할 설정은 없습니다. [브리지 또는 Gateway 재시작 후 인바운드 복구](#inbound-recovery-after-a-bridge-or-gateway-restart)를 참조하세요.
</Note>

<Warning>
BlueBubbles 지원은 제거되었습니다. `channels.bluebubbles` 구성을 `channels.imessage`로 마이그레이션하세요. OpenClaw는 `imsg`를 통해서만 iMessage를 지원합니다. 간단한 공지는 [BlueBubbles 제거와 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage)에서, 전체 마이그레이션 표는 [BlueBubbles에서 이전하기](/ko/channels/imessage-from-bluebubbles)에서 시작하세요.
</Warning>

상태: 네이티브 외부 CLI 통합. Gateway는 `imsg rpc`를 생성하고 stdio에서 JSON-RPC로 통신합니다(별도 데몬/포트 없음). 고급 작업에는 `imsg launch`와 성공적인 비공개 API 프로브가 필요합니다.

<CardGroup cols={3}>
  <Card title="비공개 API 작업" icon="wand-sparkles" href="#private-api-actions">
    답장, 탭백, 효과, 첨부 파일, 그룹 관리.
  </Card>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    iMessage DM은 기본적으로 페어링 모드를 사용합니다.
  </Card>
  <Card title="원격 Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway가 Messages Mac에서 실행되지 않을 때 SSH 래퍼를 사용하세요.
  </Card>
  <Card title="구성 참조" icon="settings" href="/ko/gateway/config-channels#imessage">
    전체 iMessage 필드 참조.
  </Card>
</CardGroup>

## 빠른 설정

<Tabs>
  <Tab title="로컬 Mac (빠른 경로)">
    <Steps>
      <Step title="imsg 설치 및 확인">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="OpenClaw 구성">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway 시작">

```bash
openclaw gateway
```

      </Step>

      <Step title="첫 DM 페어링 승인(기본 dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        페어링 요청은 1시간 후 만료됩니다.
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH를 통한 원격 Mac">
    OpenClaw에는 stdio 호환 `cliPath`만 필요하므로, 원격 Mac에 SSH로 접속해 `imsg`를 실행하는 래퍼 스크립트를 `cliPath`로 지정할 수 있습니다.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    첨부 파일을 활성화한 경우 권장 구성:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost`가 설정되지 않은 경우, OpenClaw는 SSH 래퍼 스크립트를 파싱해 자동 감지를 시도합니다.
    `remoteHost`는 `host` 또는 `user@host`여야 합니다(공백 또는 SSH 옵션 없음).
    OpenClaw는 SCP에 엄격한 호스트 키 검사를 사용하므로, 릴레이 호스트 키가 이미 `~/.ssh/known_hosts`에 있어야 합니다.
    첨부 파일 경로는 허용된 루트(`attachmentRoots` / `remoteAttachmentRoots`)를 기준으로 검증됩니다.

<Warning>
`imsg` 앞에 두는 모든 `cliPath` 래퍼 또는 SSH 프록시는 장기 실행 JSON-RPC를 위한 투명한 stdio 파이프처럼 동작해야 합니다. OpenClaw는 채널 수명 동안 래퍼의 stdin/stdout을 통해 줄바꿈으로 프레이밍된 작은 JSON-RPC 메시지를 교환합니다.

- 각 stdin 청크/라인을 **바이트가 사용 가능해지는 즉시** 전달하세요. EOF를 기다리지 마세요.
- 각 stdout 청크/라인을 반대 방향으로 즉시 전달하세요.
- 줄바꿈을 보존하세요.
- 작은 프레임을 굶길 수 있는 고정 크기 블로킹 읽기(`read(4096)`, `cat | buffer`, 기본 셸 `read`)를 피하세요.
- stderr를 JSON-RPC stdout 스트림과 분리된 상태로 유지하세요.

큰 블록이 찰 때까지 stdin을 버퍼링하는 래퍼는 `imsg rpc` 자체가 정상이어도 iMessage 장애처럼 보이는 증상, 즉 `imsg rpc timeout (chats.list)` 또는 반복적인 채널 재시작을 일으킵니다. 위의 `ssh -T host imsg "$@"`는 `rpc` 및 `--db` 같은 OpenClaw의 `cliPath` 인수를 전달하므로 안전합니다. `ssh host imsg | grep -v '^DEBUG'` 같은 파이프라인은 안전하지 않습니다. 줄 버퍼링 도구도 프레임을 보류할 수 있으므로, 반드시 필터링해야 한다면 모든 단계에 `stdbuf -oL -eL`을 사용하세요.
</Warning>

  </Tab>
</Tabs>

## 요구 사항 및 권한(macOS)

- Messages는 `imsg`를 실행하는 Mac에 로그인되어 있어야 합니다.
- OpenClaw/`imsg`를 실행하는 프로세스 컨텍스트에는 전체 디스크 접근 권한이 필요합니다(Messages DB 접근).
- Messages.app을 통해 메시지를 보내려면 자동화 권한이 필요합니다.
- 고급 작업(반응 / 편집 / 보내기 취소 / 스레드 답장 / 효과 / 그룹 작업)에는 System Integrity Protection을 비활성화해야 합니다. 아래 [imsg 비공개 API 활성화](#enabling-the-imsg-private-api)를 참조하세요. 기본 텍스트 및 미디어 송수신은 이것 없이도 작동합니다.

<Tip>
권한은 프로세스 컨텍스트별로 부여됩니다. Gateway가 헤드리스(LaunchAgent/SSH)로 실행되는 경우, 동일한 컨텍스트에서 일회성 대화형 명령을 실행해 프롬프트를 트리거하세요.

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH 래퍼 전송이 AppleEvents -1743으로 실패함">
  원격 SSH 설정은 채팅을 읽고, `channels status --probe`를 통과하고, 인바운드 메시지를 처리할 수 있지만, 아웃바운드 전송은 여전히 AppleEvents 권한 오류로 실패할 수 있습니다.

```text
Not authorized to send Apple events to Messages. (-1743)
```

로그인된 Mac 사용자의 TCC 데이터베이스 또는 시스템 설정 > 개인정보 보호 및 보안 > 자동화를 확인하세요. 자동화 항목이 `imsg` 또는 로컬 셸 프로세스 대신 `/usr/libexec/sshd-keygen-wrapper`로 기록되어 있으면, macOS가 해당 SSH 서버 측 클라이언트에 사용할 수 있는 Messages 토글을 노출하지 않을 수 있습니다.

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

이 상태에서는 Messages 자동화가 필요한 프로세스 컨텍스트가 UI에서 권한을 부여할 수 있는 앱이 아니라 SSH 래퍼이기 때문에, `tccutil reset AppleEvents`를 반복하거나 동일한 SSH 래퍼를 통해 `imsg send`를 다시 실행해도 계속 실패할 수 있습니다.

대신 지원되는 `imsg` 프로세스 컨텍스트 중 하나를 사용하세요.

- Gateway 또는 최소한 `imsg` 브리지를 로그인된 Messages 사용자의 로컬 세션에서 실행하세요.
- 동일한 세션에서 전체 디스크 접근 권한과 자동화를 부여한 뒤 해당 사용자의 LaunchAgent로 Gateway를 시작하세요.
- 두 사용자 SSH 토폴로지를 유지하는 경우, 채널을 활성화하기 전에 정확한 래퍼를 통해 실제 아웃바운드 `imsg send`가 성공하는지 확인하세요. 자동화를 부여할 수 없다면, 전송에 SSH 래퍼에 의존하지 말고 단일 사용자 `imsg` 설정으로 재구성하세요.

</Accordion>

## imsg 비공개 API 활성화

`imsg`는 두 가지 운영 모드로 제공됩니다.

- **기본 모드**(기본값, SIP 변경 필요 없음): `send`를 통한 아웃바운드 텍스트 및 미디어, 인바운드 감시/기록, 채팅 목록. 새 `brew install steipete/tap/imsg`와 위의 표준 macOS 권한으로 바로 얻는 기능입니다.
- **비공개 API 모드**: `imsg`가 헬퍼 dylib를 `Messages.app`에 주입해 내부 `IMCore` 함수를 호출합니다. 이를 통해 `react`, `edit`, `unsend`, `reply`(스레드), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`과 입력 표시기 및 읽음 확인이 활성화됩니다.

이 채널 페이지에서 문서화하는 고급 작업 표면에 도달하려면 비공개 API 모드가 필요합니다. `imsg` README는 요구 사항을 명확히 설명합니다.

> `read`, `typing`, `launch`, 브리지 기반 리치 전송, 메시지 변형, 채팅 관리 같은 고급 기능은 옵트인입니다. SIP가 비활성화되어 있어야 하며 헬퍼 dylib가 `Messages.app`에 주입되어야 합니다. SIP가 활성화되어 있으면 `imsg launch`는 주입을 거부합니다.

헬퍼 주입 기법은 `imsg` 자체 dylib를 사용해 Messages 비공개 API에 접근합니다. OpenClaw iMessage 경로에는 서드파티 서버나 BlueBubbles 런타임이 없습니다.

<Warning>
**SIP 비활성화는 실제 보안 트레이드오프입니다.** SIP는 수정된 시스템 코드 실행을 막는 macOS의 핵심 보호 기능 중 하나입니다. 시스템 전체에서 끄면 추가 공격 표면과 부작용이 열립니다. 특히 **Apple Silicon Mac에서 SIP를 비활성화하면 Mac에 iOS 앱을 설치하고 실행하는 기능도 비활성화됩니다**.

이를 기본값이 아니라 의도적인 운영 선택으로 취급하세요. 위협 모델이 SIP 비활성화를 허용할 수 없다면, 번들 iMessage는 기본 모드로 제한됩니다. 즉 텍스트 및 미디어 송수신만 가능하며, 반응 / 편집 / 보내기 취소 / 효과 / 그룹 작업은 사용할 수 없습니다.
</Warning>

### 설정

1. Messages.app을 실행하는 Mac에 **`imsg`를 설치(또는 업그레이드)**하세요.

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 출력은 `bridge_version`, `rpc_methods`, 메서드별 `selectors`를 보고하므로 시작하기 전에 현재 빌드가 무엇을 지원하는지 확인할 수 있습니다.

2. **System Integrity Protection과 (최신 macOS에서는) Library Validation을 비활성화하세요.** Apple 서명 `Messages.app`에 비 Apple 헬퍼 dylib를 주입하려면 SIP가 꺼져 있어야 **하고** 라이브러리 검증이 완화되어야 합니다. 복구 모드 SIP 단계는 macOS 버전별로 다릅니다.
   - **macOS 10.13-10.15 (Sierra-Catalina):** Terminal을 통해 Library Validation을 비활성화하고, Recovery Mode로 재부팅한 뒤 `csrutil disable`을 실행하고 재시작합니다.
   - **macOS 11+ (Big Sur 이상), Intel:** Recovery Mode(또는 Internet Recovery), `csrutil disable`, 재시작.
   - **macOS 11+, Apple Silicon:** 전원 버튼 시작 시퀀스로 Recovery에 진입합니다. 최근 macOS 버전에서는 Continue를 클릭할 때 **Left Shift** 키를 누른 다음 `csrutil disable`을 실행합니다. 가상 머신 설정은 별도 흐름을 따르므로 먼저 VM 스냅샷을 만드세요.

   **macOS 11 이상에서는 일반적으로 `csrutil disable`만으로 충분하지 않습니다.** Apple은 여전히 `Messages.app`을 플랫폼 바이너리로 보고 라이브러리 검증을 적용하므로, SIP가 꺼져 있어도 adhoc 서명된 헬퍼는 거부됩니다(`Library Validation failed: ... platform binary, but mapped file is not`). SIP를 비활성화한 뒤 라이브러리 검증도 비활성화하고 재부팅하세요.

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), 26.5.1에서 확인:** SIP 비활성화와 위의 `DisableLibraryValidation` 명령만으로 26.0부터 26.5.x까지 헬퍼 주입에 충분합니다. **boot-args는 필요하지 않습니다.** plist가 결정적 요소이며 Tahoe에서 주입이 실패할 때 가장 흔히 빠지는 단계입니다.
   - **plist가 있는 경우:** `imsg launch`가 주입되고 `imsg status`가 `advanced_features: true`를 보고합니다.
   - **plist가 없는 경우(SIP가 꺼져 있어도):** `imsg launch`가 `Failed to launch: Timeout waiting for Messages.app to initialize`로 실패합니다. AMFI가 로드 시 adhoc 헬퍼를 거부하므로 브리지가 준비되지 않고 launch가 타임아웃됩니다. 이 타임아웃은 Tahoe에서 대부분의 사용자가 겪는 증상이며, 해결책은 더 과격한 조치가 아니라 위의 plist입니다.

   이는 macOS 26.5.1(Apple Silicon)에서 제어된 전/후 비교로 확인되었습니다. plist가 있으면 dylib가 `Messages.app`에 매핑되고 브리지가 올라오며, plist를 제거하고 재부팅하면 `imsg launch`가 위의 타임아웃 실패를 만들고 dylib는 매핑되지 않습니다.

   If `imsg launch` 삽입 또는 특정 `selectors`가 macOS 업그레이드 후 false를 반환하기 시작하면, 일반적으로 이 게이트가 원인입니다. SIP 단계 자체가 실패했다고 가정하기 전에 SIP 및 라이브러리 검증 상태를 확인하세요. 해당 설정이 올바른데도 브리지가 여전히 삽입할 수 없다면, 추가적인 시스템 전역 보안 제어를 약화하지 말고 `imsg status --json`과 `imsg launch` 출력을 수집하여 `imsg` 프로젝트에 보고하세요.

   `imsg launch`를 실행하기 전에 Apple의 Mac용 복구 모드 흐름에 따라 SIP를 비활성화하세요.

3. **헬퍼를 삽입합니다.** SIP가 비활성화되어 있고 Messages.app에 로그인된 상태에서:

   ```bash
   imsg launch
   ```

   `imsg launch`는 SIP가 아직 활성화되어 있으면 삽입을 거부하므로, 이는 2단계가 적용되었는지 확인하는 역할도 합니다.

4. **OpenClaw에서 브리지를 확인합니다:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 항목은 `works`를 보고해야 하며, `imsg status --json | jq '.selectors'`는 `retractMessagePart: true`와 macOS 빌드가 노출하는 편집 / 입력 중 / 읽음 selector를 표시해야 합니다. `actions.ts`의 OpenClaw Plugin별 메서드 게이팅은 기반 selector가 `true`인 작업만 광고하므로, 에이전트의 도구 목록에 표시되는 작업 표면은 이 호스트에서 브리지가 실제로 수행할 수 있는 것을 반영합니다.

`openclaw channels status --probe`가 채널을 `works`로 보고하지만 특정 작업이 디스패치 시점에 "iMessage `<action>` requires the imsg private API bridge"를 throw한다면, `imsg launch`를 다시 실행하세요. 헬퍼는 빠질 수 있으며(Messages.app 재시작, OS 업데이트 등), 캐시된 `available: true` 상태는 다음 probe가 새로 고침될 때까지 계속 작업을 광고합니다.

### SIP를 비활성화할 수 없는 경우

SIP 비활성화가 위협 모델에 허용되지 않는다면:

- `imsg`는 기본 모드로 폴백합니다. 즉, 텍스트 + 미디어 + 수신만 지원합니다.
- OpenClaw Plugin은 여전히 텍스트/미디어 전송과 인바운드 모니터링을 광고하지만, `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, 그룹 작업은 작업 표면에서 숨깁니다(메서드별 capability 게이트에 따름).
- iMessage 워크로드에는 SIP가 꺼진 별도의 비 Apple Silicon Mac(또는 전용 봇 Mac)을 실행하고, 기본 기기에서는 SIP를 활성화한 상태로 유지할 수 있습니다. 아래 [전용 봇 macOS 사용자(별도 iMessage ID)](#deployment-patterns)를 참조하세요.

## 접근 제어 및 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.imessage.dmPolicy`는 다이렉트 메시지를 제어합니다:

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    허용 목록 필드: `channels.imessage.allowFrom`.

    허용 목록 항목은 보낸 사람을 식별해야 합니다: 핸들 또는 정적 보낸 사람 접근 그룹(`accessGroup:<name>`). `chat_id:*`, `chat_guid:*`, `chat_identifier:*` 같은 채팅 대상에는 `channels.imessage.groupAllowFrom`을 사용하고, 숫자 `chat_id` 레지스트리 키에는 `channels.imessage.groups`를 사용하세요.

  </Tab>

  <Tab title="그룹 정책 + 멘션">
    `channels.imessage.groupPolicy`는 그룹 처리를 제어합니다:

    - `allowlist`(구성된 경우 기본값)
    - `open`
    - `disabled`

    그룹 보낸 사람 허용 목록: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom` 항목은 정적 보낸 사람 접근 그룹(`accessGroup:<name>`)도 참조할 수 있습니다.

    런타임 폴백: `groupAllowFrom`이 설정되지 않은 경우 iMessage 그룹 보낸 사람 검사는 `allowFrom`을 사용합니다. DM과 그룹 허용이 달라야 할 때 `groupAllowFrom`을 설정하세요.
    런타임 참고: `channels.imessage`가 완전히 누락된 경우, 런타임은 `groupPolicy="allowlist"`로 폴백하고 경고를 기록합니다(`channels.defaults.groupPolicy`가 설정되어 있더라도).

    <Warning>
    그룹 라우팅에는 연속으로 실행되는 **두 개의** 허용 목록 게이트가 있으며, 둘 다 통과해야 합니다:

    1. **보낸 사람 / 채팅 대상 허용 목록**(`channels.imessage.groupAllowFrom`) — 핸들, `chat_guid`, `chat_identifier`, 또는 `chat_id`.
    2. **그룹 레지스트리**(`channels.imessage.groups`) — `groupPolicy: "allowlist"`에서는 이 게이트가 `groups: { "*": { ... } }` 와일드카드 항목(`allowAll = true` 설정) 또는 `groups` 아래의 명시적 `chat_id`별 항목 중 하나를 요구합니다.

    게이트 2에 아무것도 없으면 모든 그룹 메시지가 드롭됩니다. Plugin은 기본 로그 수준에서 두 개의 `warn` 수준 신호를 내보냅니다:

    - 시작 시 계정당 한 번: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 런타임에 `chat_id`당 한 번: `imessage: dropping group message from chat_id=<id> ...`

    DM은 다른 코드 경로를 사용하므로 계속 작동합니다.

    `groupPolicy: "allowlist"`에서 그룹 흐름을 유지하기 위한 최소 구성:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    해당 `warn` 줄이 Gateway 로그에 나타나면 게이트 2가 드롭 중인 것입니다. `groups` 블록을 추가하세요.
    </Warning>

    그룹의 멘션 게이팅:

    - iMessage에는 네이티브 멘션 메타데이터가 없습니다
    - 멘션 감지는 정규식 패턴을 사용합니다(`agents.list[].groupChat.mentionPatterns`, 폴백 `messages.groupChat.mentionPatterns`)
    - 구성된 패턴이 없으면 멘션 게이팅을 적용할 수 없습니다

    권한 있는 보낸 사람의 제어 명령은 그룹에서 멘션 게이팅을 우회할 수 있습니다.

    그룹별 `systemPrompt`:

    `channels.imessage.groups.*` 아래의 각 항목은 선택적 `systemPrompt` 문자열을 허용합니다. 이 값은 해당 그룹의 메시지를 처리하는 모든 턴에서 에이전트의 시스템 프롬프트에 삽입됩니다. 해석은 `channels.whatsapp.groups`에서 사용하는 그룹별 프롬프트 해석과 동일합니다:

    1. **그룹별 시스템 프롬프트**(`groups["<chat_id>"].systemPrompt`): 특정 그룹 항목이 맵에 존재하고 그 `systemPrompt` 키가 정의된 경우 사용됩니다. `systemPrompt`가 빈 문자열(`""`)이면 와일드카드가 억제되고 해당 그룹에는 시스템 프롬프트가 적용되지 않습니다.
    2. **그룹 와일드카드 시스템 프롬프트**(`groups["*"].systemPrompt`): 특정 그룹 항목이 맵에 전혀 없거나, 존재하지만 `systemPrompt` 키를 정의하지 않은 경우 사용됩니다.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    그룹별 프롬프트는 그룹 메시지에만 적용됩니다. 이 채널의 다이렉트 메시지는 영향을 받지 않습니다.

  </Tab>

  <Tab title="세션 및 결정적 응답">
    - DM은 직접 라우팅을 사용하고, 그룹은 그룹 라우팅을 사용합니다.
    - 기본 `session.dmScope=main`에서는 iMessage DM이 에이전트 메인 세션으로 합쳐집니다.
    - 그룹 세션은 격리됩니다(`agent:<agentId>:imessage:group:<chat_id>`).
    - 응답은 원래 채널/대상 메타데이터를 사용하여 iMessage로 다시 라우팅됩니다.

    그룹과 유사한 스레드 동작:

    일부 다중 참여자 iMessage 스레드는 `is_group=false`로 도착할 수 있습니다.
    해당 `chat_id`가 `channels.imessage.groups` 아래에 명시적으로 구성되어 있으면, OpenClaw는 이를 그룹 트래픽으로 처리합니다(그룹 게이팅 + 그룹 세션 격리).

  </Tab>
</Tabs>

## ACP 대화 바인딩

레거시 iMessage 채팅도 ACP 세션에 바인딩할 수 있습니다.

빠른 운영자 흐름:

- DM 또는 허용된 그룹 채팅 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 이후 같은 iMessage 대화의 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- `/new`와 `/reset`은 같은 바인딩된 ACP 세션을 제자리에서 재설정합니다.
- `/acp close`는 ACP 세션을 닫고 바인딩을 제거합니다.

구성된 영구 바인딩은 `type: "acp"`와 `match.channel: "imessage"`가 있는 최상위 `bindings[]` 항목을 통해 지원됩니다.

`match.peer.id`는 다음을 사용할 수 있습니다:

- `+15555550123` 또는 `user@example.com` 같은 정규화된 DM 핸들
- `chat_id:<id>`(안정적인 그룹 바인딩에 권장)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

예:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

공유 ACP 바인딩 동작은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 봇 macOS 사용자(별도 iMessage ID)">
    봇 트래픽이 개인 Messages 프로필과 격리되도록 전용 Apple ID와 macOS 사용자를 사용하세요.

    일반적인 흐름:

    1. 전용 macOS 사용자를 생성하고 로그인합니다.
    2. 해당 사용자에서 봇 Apple ID로 Messages에 로그인합니다.
    3. 해당 사용자에 `imsg`를 설치합니다.
    4. OpenClaw가 해당 사용자 컨텍스트에서 `imsg`를 실행할 수 있도록 SSH 래퍼를 만듭니다.
    5. `channels.imessage.accounts.<id>.cliPath`와 `.dbPath`가 해당 사용자 프로필을 가리키도록 설정합니다.

    첫 실행 시 해당 봇 사용자 세션에서 GUI 승인(자동화 + 전체 디스크 접근)이 필요할 수 있습니다.

  </Accordion>

  <Accordion title="Tailscale을 통한 원격 Mac(예시)">
    일반적인 토폴로지:

    - gateway는 Linux/VM에서 실행
    - iMessage + `imsg`는 tailnet의 Mac에서 실행
    - `cliPath` 래퍼는 SSH를 사용해 `imsg` 실행
    - `remoteHost`는 SCP 첨부 파일 가져오기를 활성화

    예:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    SSH와 SCP가 모두 비대화식으로 동작하도록 SSH 키를 사용하세요.
    먼저 호스트 키가 신뢰되도록 하세요(예: `ssh bot@mac-mini.tailnet-1234.ts.net`). 그러면 `known_hosts`가 채워집니다.

  </Accordion>

  <Accordion title="다중 계정 패턴">
    iMessage는 `channels.imessage.accounts` 아래에서 계정별 구성을 지원합니다.

    각 계정은 `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, 기록 설정, 첨부 파일 루트 허용 목록 같은 필드를 재정의할 수 있습니다.

  </Accordion>

  <Accordion title="다이렉트 메시지 기록">
    `channels.imessage.dmHistoryLimit`을 설정하면 새 다이렉트 메시지 세션에 해당 대화의 최근 디코딩된 `imsg` 기록을 시드합니다. 보낸 사람별 재정의에는 `channels.imessage.dms["<sender>"].historyLimit`을 사용하세요. 보낸 사람의 기록을 비활성화하려면 `0`을 포함합니다.

    iMessage DM 기록은 필요할 때 `imsg`에서 가져옵니다. `dmHistoryLimit`을 설정하지 않으면 전역 DM 기록 시딩이 비활성화되지만, 양수인 보낸 사람별 `channels.imessage.dms["<sender>"].historyLimit`은 해당 보낸 사람에 대한 시딩을 계속 활성화합니다.

  </Accordion>
</AccordionGroup>

## 미디어, 청킹 및 전달 대상

<AccordionGroup>
  <Accordion title="첨부 파일 및 미디어">
    - 인바운드 첨부 파일 수집은 **기본적으로 꺼져 있습니다**. 사진, 음성 메모, 동영상 및 기타 첨부 파일을 에이전트로 전달하려면 `channels.imessage.includeAttachments: true`를 설정하세요. 비활성화되어 있으면 첨부 파일만 있는 iMessage는 에이전트에 도달하기 전에 삭제되며 `Inbound message` 로그 줄이 전혀 생성되지 않을 수 있습니다.
    - `remoteHost`가 설정된 경우 SCP를 통해 원격 첨부 파일 경로를 가져올 수 있습니다
    - 첨부 파일 경로는 허용된 루트와 일치해야 합니다:
      - `channels.imessage.attachmentRoots`(로컬)
      - `channels.imessage.remoteAttachmentRoots`(원격 SCP 모드)
      - 기본 루트 패턴: `/Users/*/Library/Messages/Attachments`
    - SCP는 엄격한 호스트 키 확인을 사용합니다(`StrictHostKeyChecking=yes`)
    - 아웃바운드 미디어 크기는 `channels.imessage.mediaMaxMb`를 사용합니다(기본값 16 MB)

  </Accordion>

  <Accordion title="아웃바운드 청킹">
    - 텍스트 청크 제한: `channels.imessage.textChunkLimit`(기본값 4000)
    - 청크 모드: `channels.imessage.chunkMode`
      - `length`(기본값)
      - `newline`(문단 우선 분할)

  </Accordion>

  <Accordion title="주소 지정 형식">
    선호되는 명시적 대상:

    - `chat_id:123`(안정적인 라우팅에 권장)
    - `chat_guid:...`
    - `chat_identifier:...`

    핸들 대상도 지원됩니다:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## 비공개 API 작업

`imsg launch`가 실행 중이고 `openclaw channels status --probe`가 `privateApi.available: true`를 보고하면, 메시지 도구는 일반 텍스트 전송 외에도 iMessage 네이티브 작업을 사용할 수 있습니다.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="사용 가능한 작업">
    - **react**: iMessage 탭백을 추가/제거합니다(`messageId`, `emoji`, `remove`). 지원되는 탭백은 사랑, 좋아요, 싫어요, 웃음, 강조, 질문에 매핑됩니다.
    - **reply**: 기존 메시지에 스레드 답장을 보냅니다(`messageId`, `text` 또는 `message`, 그리고 `chatGuid`, `chatId`, `chatIdentifier` 또는 `to`).
    - **sendWithEffect**: iMessage 효과와 함께 텍스트를 보냅니다(`text` 또는 `message`, `effect` 또는 `effectId`).
    - **edit**: 지원되는 macOS/비공개 API 버전에서 보낸 메시지를 수정합니다(`messageId`, `text` 또는 `newText`).
    - **unsend**: 지원되는 macOS/비공개 API 버전에서 보낸 메시지를 회수합니다(`messageId`).
    - **upload-file**: 미디어/파일을 보냅니다(base64 형식의 `buffer` 또는 수화된 `media`/`path`/`filePath`, `filename`, 선택적 `asVoice`). 레거시 별칭: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: 현재 대상이 그룹 대화일 때 그룹 채팅을 관리합니다.

  </Accordion>

  <Accordion title="메시지 ID">
    인바운드 iMessage 컨텍스트에는 사용 가능한 경우 짧은 `MessageSid` 값과 전체 메시지 GUID가 모두 포함됩니다. 짧은 ID는 최근 SQLite 기반 답장 캐시로 범위가 제한되며 사용 전에 현재 채팅과 대조됩니다. 짧은 ID가 만료되었거나 다른 채팅에 속하는 경우 전체 `MessageSidFull`로 다시 시도하세요.

  </Accordion>

  <Accordion title="기능 감지">
    OpenClaw는 캐시된 프로브 상태가 브리지를 사용할 수 없다고 말할 때만 비공개 API 작업을 숨깁니다. 상태를 알 수 없는 경우 작업은 계속 표시되며 디스패치는 지연 프로브를 수행하므로 `imsg launch` 이후 별도의 수동 상태 새로 고침 없이 첫 작업이 성공할 수 있습니다.

  </Accordion>

  <Accordion title="읽음 확인 및 입력 중 표시">
    비공개 API 브리지가 실행 중이면, 수락된 인바운드 채팅은 읽음으로 표시되고 직접 채팅에는 턴이 수락되는 즉시 입력 중 말풍선이 표시됩니다. 에이전트가 컨텍스트를 준비하고 생성하는 동안에도 표시됩니다. 읽음 표시를 비활성화하려면 다음을 사용하세요:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    메서드별 기능 목록보다 오래된 `imsg` 빌드는 입력 중 표시/읽음을 조용히 차단합니다. OpenClaw는 누락된 수신 확인의 원인을 파악할 수 있도록 재시작마다 한 번 경고를 기록합니다.

  </Accordion>

  <Accordion title="인바운드 탭백">
    OpenClaw는 iMessage 탭백을 구독하고 수락된 반응을 일반 메시지 텍스트 대신 시스템 이벤트로 라우팅하므로, 사용자의 탭백은 일반적인 답장 루프를 트리거하지 않습니다.

    알림 모드는 `channels.imessage.reactionNotifications`로 제어됩니다:

    - `"own"`(기본값): 사용자가 봇이 작성한 메시지에 반응할 때만 알립니다.
    - `"all"`: 승인된 발신자의 모든 인바운드 탭백에 대해 알립니다.
    - `"off"`: 인바운드 탭백을 무시합니다.

    계정별 재정의는 `channels.imessage.accounts.<id>.reactionNotifications`를 사용합니다.

  </Accordion>

  <Accordion title="승인 반응(👍 / 👎)">
    `approvals.exec.enabled` 또는 `approvals.plugin.enabled`가 true이고 요청이 iMessage로 라우팅되면, Gateway는 승인 프롬프트를 네이티브로 전달하고 탭백을 수락하여 이를 해결합니다:

    - `👍`(좋아요 탭백) → `allow-once`
    - `👎`(싫어요 탭백) → `deny`
    - `allow-always`는 수동 폴백으로 유지됩니다. 일반 답장으로 `/approve <id> allow-always`를 보내세요.

    반응 처리는 반응한 사용자의 핸들이 명시적 승인자여야 합니다. 승인자 목록은 `channels.imessage.allowFrom`(또는 `channels.imessage.accounts.<id>.allowFrom`)에서 읽습니다. 사용자의 전화번호를 E.164 형식으로 추가하거나 Apple ID 이메일을 추가하세요. 와일드카드 항목 `"*"`도 적용되지만 모든 발신자가 승인할 수 있게 됩니다. 반응 단축키는 승인 해결에서 중요한 유일한 게이트가 명시적 승인자 허용 목록이기 때문에 의도적으로 `reactionNotifications`, `dmPolicy`, `groupAllowFrom`을 우회합니다.

    **이번 릴리스의 동작 변경:** `channels.imessage.allowFrom`이 비어 있지 않으면 이제 `/approve <id> <decision>` 텍스트 명령은 더 넓은 DM 허용 목록이 아니라 해당 승인자 목록을 기준으로 승인됩니다. DM 허용 목록에는 허용되어 있지만 `allowFrom`에는 없는 발신자는 명시적 거부를 받습니다. 이전 동작을 유지하려면 `/approve`(및 반응)를 통해 승인할 수 있어야 하는 모든 운영자를 `allowFrom`에 추가하세요. `allowFrom`이 비어 있으면 레거시 "동일 채팅 폴백"이 계속 적용되며 `/approve`는 DM 허용 목록이 허용하는 모든 사람을 계속 승인합니다.

    운영자 참고 사항:
    - 반응 바인딩은 메모리(승인 만료와 일치하는 TTL 포함)와 Gateway의 영구 키 저장소에 모두 저장되므로, Gateway 재시작 직후 도착한 탭백도 승인을 해결합니다.
    - 교차 기기 `is_from_me=true` 탭백(페어링된 Apple 기기에서 운영자 본인이 단 반응)은 봇이 자체 승인할 수 없도록 의도적으로 무시됩니다.
    - 레거시 텍스트 스타일 탭백(매우 오래된 Apple 클라이언트의 일반 텍스트 `Liked "…"` 형식)은 메시지 GUID를 전달하지 않으므로 승인을 해결할 수 없습니다. 반응 해결에는 현재 macOS / iOS 클라이언트가 내보내는 구조화된 탭백 메타데이터가 필요합니다.

  </Accordion>
</AccordionGroup>

## 구성 쓰기

iMessage는 기본적으로 채널이 시작한 구성 쓰기를 허용합니다(`commands.config: true`일 때 `/config set|unset`용).

비활성화:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 분할 전송 DM 병합(하나의 작성 내용에 명령 + URL)

사용자가 명령과 URL을 함께 입력하면(예: `Dump https://example.com/article`) Apple의 Messages 앱은 전송을 **두 개의 별도 `chat.db` 행**으로 분할합니다:

1. 텍스트 메시지(`"Dump"`).
2. OG 미리보기 이미지를 첨부 파일로 포함한 URL 미리보기 말풍선(`"https://..."`).

대부분의 설정에서 두 행은 약 0.8-2.0초 간격으로 OpenClaw에 도착합니다. 병합이 없으면 에이전트는 1번째 턴에서 명령만 받고 응답하며(종종 "URL을 보내 주세요"), 2번째 턴에서야 URL을 보게 됩니다. 이 시점에는 명령 컨텍스트가 이미 사라진 상태입니다. 이는 Apple의 전송 파이프라인이며, OpenClaw나 `imsg`가 도입한 동작이 아닙니다.

`channels.imessage.coalesceSameSenderDms`는 DM에서 같은 발신자의 연속 행을 버퍼링하도록 옵트인합니다. `imsg`가 소스 행 중 하나에 구조적 URL 미리보기 마커 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"`를 노출하면 OpenClaw는 실제 분할 전송만 병합하고, 버퍼링된 다른 행은 별도 턴으로 유지합니다. 말풍선 메타데이터를 전혀 내보내지 않는 오래된 `imsg` 빌드에서는 OpenClaw가 분할 전송과 별도 전송을 구분할 수 없으므로 버킷 병합으로 폴백합니다. 이렇게 하면 `Dump <url>` 분할 전송이 두 턴으로 회귀하지 않고 메타데이터 이전 동작을 유지합니다. 그룹 채팅은 다중 사용자 턴 구조를 보존하기 위해 계속 메시지별로 디스패치됩니다.

<Tabs>
  <Tab title="활성화할 때">
    다음의 경우 활성화하세요:

    - 하나의 메시지에 `command + payload`를 기대하는 Skills를 제공하는 경우(dump, paste, save, queue 등).
    - 사용자가 명령과 함께 URL을 붙여 넣는 경우.
    - 추가되는 DM 턴 지연 시간을 허용할 수 있는 경우(아래 참조).

    다음의 경우 비활성화 상태로 두세요:

    - 단일 단어 DM 트리거에 최소 명령 지연 시간이 필요한 경우.
    - 모든 플로가 페이로드 후속 입력 없는 일회성 명령인 경우.

  </Tab>
  <Tab title="활성화">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    플래그가 켜져 있고 명시적 `messages.inbound.byChannel.imessage` 또는 전역 `messages.inbound.debounceMs`가 없으면 디바운스 창은 **7000 ms**로 넓어집니다(레거시 기본값은 0 ms, 즉 디바운싱 없음). Apple의 URL 미리보기 분할 전송 주기가 Messages.app이 미리보기 행을 내보내는 동안 몇 초까지 늘어날 수 있으므로 더 넓은 창이 필요합니다.

    창을 직접 조정하려면:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="트레이드오프">
    - **정밀한 병합에는 최신 `imsg` 페이로드 메타데이터가 필요합니다.** URL 행에 `balloon_bundle_id`가 포함되어 있으면 실제 분할 전송만 병합되고 다른 버퍼링된 행은 별도로 유지됩니다. 말풍선 메타데이터를 노출하지 않는 오래된 `imsg` 빌드에서는 OpenClaw가 버퍼링된 버킷 병합으로 폴백하므로 `Dump <url>` 분할 전송이 두 턴으로 회귀하지 않습니다(`imsg`가 업스트림에서 분할 전송을 병합하면 제거될 임시 하위 호환성).
    - **DM 메시지에 지연 시간이 추가됩니다.** 플래그가 켜져 있으면 모든 DM(독립 실행 제어 명령 및 단일 텍스트 후속 입력 포함)은 URL 미리보기 행이 올 가능성에 대비해 디스패치 전 최대 디바운스 창까지 대기합니다. 그룹 채팅 메시지는 즉시 디스패치를 유지합니다.
    - **병합된 출력에는 한계가 있습니다.** 병합된 텍스트는 명시적 `…[truncated]` 마커와 함께 4000자로 제한됩니다. 첨부 파일은 20개로 제한됩니다. 소스 항목은 10개로 제한됩니다(그 이상은 첫 항목과 최신 항목 유지). 모든 소스 GUID는 다운스트림 텔레메트리를 위해 `coalescedMessageGuids`에 추적됩니다.
    - **DM 전용입니다.** 그룹 채팅은 메시지별 디스패치로 넘어가므로 여러 사람이 입력할 때도 봇이 반응성을 유지합니다.
    - **채널별 옵트인입니다.** 다른 채널(Telegram, WhatsApp, Slack 등)은 영향을 받지 않습니다. `channels.bluebubbles.coalesceSameSenderDms`를 설정한 레거시 BlueBubbles 구성은 해당 값을 `channels.imessage.coalesceSameSenderDms`로 마이그레이션해야 합니다.

  </Tab>
</Tabs>

### 시나리오 및 에이전트가 보게 되는 내용

"플래그 켜짐" 열은 `balloon_bundle_id`를 내보내는 `imsg` 빌드에서의 동작을 보여줍니다. 풍선 메타데이터를 전혀 내보내지 않는 이전 `imsg` 빌드에서는 아래에서 "두 턴" / "N턴"으로 표시된 행이 대신 레거시 병합(한 턴)으로 폴백합니다. OpenClaw는 분할 전송과 개별 전송을 구조적으로 구분할 수 없으므로, 메타데이터 이전의 병합 동작을 유지합니다. 빌드가 풍선 메타데이터를 내보내면 정확한 분리가 활성화됩니다.

| 사용자가 작성하는 내용                                             | `chat.db`가 생성하는 내용          | 플래그 꺼짐(기본값)                    | 플래그 켜짐 + 창(`imsg`가 풍선 메타데이터를 내보냄)                                                |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (한 번 전송)                            | 약 1초 간격의 2개 행                | 두 개의 에이전트 턴: "Dump"만, 그다음 URL | 한 턴: 병합된 텍스트 `Dump https://example.com`                                                     |
| `Save this 📎image.jpg caption` (첨부 파일 + 텍스트)               | URL 풍선 메타데이터 없는 2개 행     | 두 턴                                  | 메타데이터가 관찰된 뒤에는 두 턴; 오래된/래치 전 메타데이터 없는 세션에서는 병합된 한 턴           |
| `/status` (독립 실행 명령)                                        | 1개 행                              | 즉시 디스패치                          | **창까지 대기한 뒤 디스패치**                                                                       |
| URL만 붙여넣음                                                     | 1개 행                              | 즉시 디스패치                          | 창까지 대기한 뒤 디스패치                                                                           |
| 텍스트 + URL을 몇 분 간격으로 의도적으로 별도 메시지 두 개로 전송 | 창 밖의 2개 행                      | 두 턴                                  | 두 턴(그 사이에 창 만료)                                                                            |
| 빠른 대량 전송(창 안에서 10개 초과의 짧은 DM)                     | URL 풍선 메타데이터 없는 N개 행     | N턴                                    | 메타데이터가 관찰된 뒤에는 N턴; 오래된/래치 전 메타데이터 없는 세션에서는 제한된 병합 한 턴        |
| 그룹 채팅에서 두 사람이 입력                                      | M명의 발신자로부터 N개 행           | M+ 턴(발신자 버킷마다 하나)            | M+ 턴 — 그룹 채팅은 병합되지 않음                                                                   |

## 브리지 또는 Gateway 재시작 후 인바운드 복구

iMessage는 Gateway가 다운된 동안 놓친 메시지를 복구하며, 동시에 Push 복구 후 Apple이 밀어낼 수 있는 오래된 "백로그 폭탄"을 억제합니다. 기본 동작은 항상 켜져 있으며, 인바운드 중복 제거를 기반으로 합니다.

- **재생 중복 제거.** 디스패치된 모든 인바운드 메시지는 Apple GUID 기준으로 영구 Plugin 상태(`imessage.inbound-dedupe`)에 기록되며, 수집 시점에 클레임되고 처리 후 커밋됩니다(일시적 실패 시 재시도할 수 있도록 해제됨). 이미 처리된 항목은 두 번 디스패치되는 대신 삭제됩니다. 이 덕분에 복구 재생은 메시지별 장부 기록 없이도 적극적으로 수행될 수 있습니다.
- **다운타임 복구.** 시작 시 모니터는 마지막으로 디스패치된 `chat.db` rowid(계정별로 유지되는 커서)를 기억하고 이를 `since_rowid`로 `imsg watch.subscribe`에 전달합니다. 그러면 imsg는 Gateway가 다운된 동안 들어온 행을 재생한 뒤 라이브를 따라갑니다. 재생은 가장 최근 행과 약 2시간 이내의 메시지로 제한되며, 중복 제거는 이미 처리된 항목을 삭제합니다.
- **오래된 백로그 연령 차단.** 시작 경계보다 위에 있는 행은 실제 라이브입니다. 전송 날짜가 도착 시각보다 약 15분 넘게 오래된 행은 Push 플러시 백로그로 간주되어 억제됩니다. 재생된 행(경계 이하)은 대신 더 넓은 복구 창을 사용하므로, 최근에 놓친 메시지는 전달되고 오래된 기록은 전달되지 않습니다.

복구는 로컬 및 원격 `cliPath` 설정 모두에서 동작합니다. `since_rowid` 재생이 동일한 `imsg` RPC 연결을 통해 실행되기 때문입니다. 차이는 창입니다. Gateway가 `chat.db`를 읽을 수 있으면(로컬), 시작 rowid 경계를 고정하고 재생 범위를 제한하며 최대 몇 시간 전까지 놓친 메시지를 전달합니다. 원격 SSH `cliPath`에서는 데이터베이스를 읽을 수 없으므로 재생이 제한되지 않고 모든 행이 라이브 연령 차단을 사용합니다. 즉, 최근에 놓친 메시지는 여전히 복구하고 오래된 백로그도 계속 억제하지만, 더 좁은 라이브 창을 사용합니다. 더 넓은 복구 창이 필요하면 Messages Mac에서 Gateway를 실행하세요.

### 운영자에게 보이는 신호

억제된 백로그는 기본 레벨로 기록되며, 절대 조용히 삭제되지 않습니다(`recovery` 플래그는 적용된 창을 보여줌).

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### 마이그레이션

`channels.imessage.catchup.*`는 지원 중단되었습니다. 다운타임 복구는 이제 자동이며 새 설정에는 구성이 필요 없습니다. `catchup.enabled: true`가 있는 기존 구성은 복구 재생 창을 위한 호환성 프로필로 계속 존중됩니다. 비활성화된 catchup 블록(`enabled: false` 또는 `enabled: true` 없음)은 폐기되며, `openclaw doctor --fix`가 이를 제거합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="imsg를 찾을 수 없거나 RPC가 지원되지 않음">
    바이너리와 RPC 지원을 검증하세요.

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    프로브에서 RPC가 지원되지 않는다고 보고하면 `imsg`를 업데이트하세요. 비공개 API 동작을 사용할 수 없으면 로그인한 macOS 사용자 세션에서 `imsg launch`를 실행한 뒤 다시 프로브하세요. Gateway가 macOS에서 실행 중이 아니라면 기본 로컬 `imsg` 경로 대신 위의 SSH를 통한 원격 Mac 설정을 사용하세요.

  </Accordion>

  <Accordion title="메시지는 전송되지만 인바운드 iMessage가 도착하지 않음">
    먼저 메시지가 로컬 Mac에 도달했는지 증명하세요. `chat.db`가 변경되지 않으면 `imsg status --json`이 정상 브리지를 보고하더라도 OpenClaw는 메시지를 받을 수 없습니다.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    휴대폰에서 보낸 메시지가 새 행을 만들지 않는다면 OpenClaw 구성을 변경하기 전에 macOS Messages와 Apple Push 계층을 복구하세요. 일회성 서비스 새로고침만으로 충분한 경우가 많습니다.

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    OpenClaw 세션을 디버깅하기 전에 휴대폰에서 새 iMessage를 보내고 새 `chat.db` 행 또는 `imsg watch` 이벤트를 확인하세요. 이를 주기적인 브리지 재실행 루프로 실행하지 마세요. 활성 작업 중 반복적인 `imsg launch`와 Gateway 재시작은 전달을 중단하고 진행 중인 채널 실행을 고립시킬 수 있습니다.

  </Accordion>

  <Accordion title="Gateway가 macOS에서 실행 중이 아님">
    기본 `cliPath: "imsg"`는 Messages에 로그인된 Mac에서 실행되어야 합니다. Linux 또는 Windows에서는 `channels.imessage.cliPath`를 해당 Mac으로 SSH 접속해 `imsg "$@"`를 실행하는 래퍼 스크립트로 설정하세요.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    그런 다음 실행하세요.

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM이 무시됨">
    다음을 확인하세요.

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - 페어링 승인(`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="그룹 메시지가 무시됨">
    다음을 확인하세요.

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 허용 목록 동작
    - 멘션 패턴 구성(`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="원격 첨부 파일 실패">
    다음을 확인하세요.

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway 호스트에서의 SSH/SCP 키 인증
    - Gateway 호스트의 `~/.ssh/known_hosts`에 호스트 키가 존재하는지
    - Messages를 실행 중인 Mac에서 원격 경로를 읽을 수 있는지

  </Accordion>

  <Accordion title="macOS 권한 프롬프트를 놓침">
    같은 사용자/세션 컨텍스트의 대화형 GUI 터미널에서 다시 실행하고 프롬프트를 승인하세요.

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg`를 실행하는 프로세스 컨텍스트에 전체 디스크 접근 권한 + 자동화 권한이 부여되었는지 확인하세요.

  </Accordion>
</AccordionGroup>

## 구성 참조 포인터

- [구성 참조 - iMessage](/ko/gateway/config-channels#imessage)
- [Gateway 구성](/ko/gateway/configuration)
- [페어링](/ko/channels/pairing)

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [BlueBubbles 제거 및 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage) — 공지 및 마이그레이션 요약
- [BlueBubbles에서 전환](/ko/channels/imessage-from-bluebubbles) — 구성 변환 표와 단계별 전환
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
