---
read_when:
    - iMessage 지원 설정하기
    - iMessage 송수신 디버깅
summary: imsg(stdio를 통한 JSON-RPC)를 사용하는 네이티브 iMessage 지원으로, 답장, 탭백, 효과, 투표, 첨부 파일 및 그룹 관리를 위한 비공개 API 작업을 제공합니다. 호스트 요구 사항이 적합한 경우 새로운 OpenClaw iMessage 설정에 권장됩니다.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T12:14:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
일반적인 OpenClaw iMessage 배포에서는 로그인된 동일한 macOS Messages 호스트에서 Gateway와 `imsg`을 실행하십시오. Gateway가 다른 곳에서 실행되는 경우 Mac에서 `imsg`을 실행하는 투명한 SSH 래퍼를 `channels.imessage.cliPath`에 지정하십시오.

**인바운드 복구는 자동으로 수행됩니다.** 브리지 또는 Gateway가 재시작되면 iMessage는 중단된 동안 누락된 메시지를 재생하고, 푸시 복구 후 Apple이 한꺼번에 내보낼 수 있는 오래된 "백로그 폭탄"을 억제하며, 중복을 제거하여 어떤 항목도 두 번 디스패치되지 않도록 합니다. 활성화할 설정은 없습니다. [브리지 또는 Gateway 재시작 후 인바운드 복구](#inbound-recovery-after-a-bridge-or-gateway-restart)를 참조하십시오.
</Note>

<Warning>
BlueBubbles 지원이 제거되었습니다. `channels.bluebubbles` 구성을 `channels.imessage`으로 마이그레이션하십시오. OpenClaw는 `imsg`을 통해서만 iMessage를 지원합니다. 간단한 공지는 [BlueBubbles 제거 및 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage)에서 먼저 확인하거나, 전체 마이그레이션 표는 [BlueBubbles에서 이전하기](/ko/channels/imessage-from-bluebubbles)를 참조하십시오.
</Warning>

상태: 네이티브 외부 CLI 통합입니다. Gateway는 `imsg rpc`을 생성하고 stdio를 통해 JSON-RPC로 통신하므로 별도의 데몬이나 포트가 없습니다. 완전한 iMessage 채널을 사용하려면 비공개 API 모드를 적극 권장합니다. 답장, 탭백, 효과, 투표, 첨부 파일 답장 및 그룹 작업에는 `imsg launch`과 성공적인 비공개 API 프로브가 필요합니다.

일반적인 로컬 설정에서는 OpenClaw 설정이 로그인된 Messages Mac에서 `imsg`을 Homebrew로 설치하거나 업데이트하도록 사용자 확인 후 제안할 수 있습니다. 수동 설정 및 SSH 래퍼 토폴로지는 계속 운영자가 관리합니다. Gateway 또는 래퍼를 실행할 동일한 사용자 컨텍스트에서 `imsg`을 설치하거나 업데이트하십시오.

<CardGroup cols={3}>
  <Card title="비공개 API 작업" icon="wand-sparkles" href="#private-api-actions">
    답장, 탭백, 효과, 투표, 첨부 파일 및 그룹 관리입니다.
  </Card>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    iMessage DM은 기본적으로 페어링 모드를 사용합니다.
  </Card>
  <Card title="원격 Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway가 Messages Mac에서 실행되지 않는 경우 SSH 래퍼를 사용하십시오.
  </Card>
  <Card title="구성 참조" icon="settings" href="/ko/gateway/config-channels#imessage">
    전체 iMessage 필드 참조입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Tabs>
  <Tab title="로컬 Mac(빠른 경로)">
    <Steps>
      <Step title="imsg 설치 및 확인">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        로컬 설정 마법사가 기본 `imsg` 명령이 없는 것을 감지하면 Homebrew를 통해 `steipete/tap/imsg`을 설치할지 묻는 메시지를 표시할 수 있습니다. Homebrew로 관리되는 `imsg`을 감지하면 재설치하거나 업데이트할지 묻는 메시지를 표시할 수 있습니다. 사용자 지정 `cliPath` 래퍼는 수정하지 않습니다.

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

      <Step title="첫 번째 DM 페어링 승인(기본 dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        페어링 요청은 1시간 후 만료됩니다.
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH를 통한 원격 Mac">
    대부분의 설정에는 SSH가 필요하지 않습니다. Gateway를 로그인된 Messages Mac에서 실행할 수 없는 경우에만 이 토폴로지를 사용하십시오. OpenClaw에는 stdio 호환 `cliPath`만 필요하므로, 원격 Mac에 SSH로 연결하여 `imsg`을 실행하는 래퍼 스크립트를 `cliPath`에 지정할 수 있습니다.
    Gateway 호스트가 아닌 해당 원격 Mac에 `imsg`을 설치하고 업데이트하십시오.

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    첨부 파일을 활성화한 경우 권장되는 구성은 다음과 같습니다.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCP 첨부 파일 가져오기에 사용
      includeAttachments: true,
      // 선택 사항: 추가로 허용할 첨부 파일 루트(기본값
      // /Users/*/Library/Messages/Attachments와 병합됨).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost`이 설정되지 않은 경우 OpenClaw는 SSH 래퍼 스크립트를 구문 분석하여 자동 감지를 시도합니다.
    `remoteHost`은 `host` 또는 `user@host`이어야 하며(공백이나 SSH 옵션은 허용되지 않음), 안전하지 않은 값은 무시됩니다.
    OpenClaw는 SCP에 엄격한 호스트 키 검사를 사용하므로 릴레이 호스트 키가 이미 `~/.ssh/known_hosts`에 있어야 합니다.
    첨부 파일 경로는 허용된 루트(`attachmentRoots` / `remoteAttachmentRoots`)를 기준으로 검증됩니다.

<Warning>
`imsg` 앞에 배치하는 모든 `cliPath` 래퍼 또는 SSH 프록시는 수명이 긴 JSON-RPC를 위한 투명한 stdio 파이프처럼 동작해야 합니다. OpenClaw는 채널이 유지되는 동안 래퍼의 stdin/stdout을 통해 줄바꿈으로 프레이밍된 작은 JSON-RPC 메시지를 교환합니다.

- 바이트가 제공되는 **즉시** 각 stdin 청크/줄을 전달하십시오. EOF를 기다리지 마십시오.
- 반대 방향에서도 각 stdout 청크/줄을 신속하게 전달하십시오.
- 줄바꿈을 보존하십시오.
- 작은 프레임을 고갈시킬 수 있는 고정 크기 블로킹 읽기(`read(4096)`, `cat | buffer`, 기본 셸 `read`)를 피하십시오.
- stderr를 JSON-RPC stdout 스트림과 분리하여 유지하십시오.

큰 블록이 찰 때까지 stdin을 버퍼링하는 래퍼는 `imsg rpc` 자체가 정상이어도 iMessage 중단처럼 보이는 증상, 즉 `imsg rpc timeout (chats.list)` 또는 반복적인 채널 재시작을 일으킵니다. 위의 `ssh -T host imsg "$@"`은 `rpc` 및 `--db` 같은 OpenClaw의 `cliPath` 인수를 전달하므로 안전합니다. `ssh host imsg | grep -v '^DEBUG'` 같은 파이프라인은 안전하지 **않습니다**. 줄 버퍼링 도구도 프레임을 계속 보류할 수 있으므로 필터링해야 한다면 모든 단계에서 `stdbuf -oL -eL`을 사용하십시오.
</Warning>

  </Tab>
</Tabs>

## 요구 사항 및 권한(macOS)

- `imsg`을 실행하는 Mac의 Messages에 로그인되어 있어야 합니다.
- OpenClaw/`imsg`을 실행하는 프로세스 컨텍스트에는 전체 디스크 접근 권한이 필요합니다(Messages DB 접근).
- Messages.app을 통해 메시지를 전송하려면 자동화 권한이 필요합니다.
- 고급 작업(반응 / 편집 / 전송 취소 / 스레드 답장 / 효과 / 투표 / 그룹 작업)을 사용하려면 시스템 무결성 보호를 비활성화해야 합니다. [imsg 비공개 API 활성화](#enabling-the-imsg-private-api)를 참조하십시오. 기본 텍스트 및 미디어 송수신은 비활성화하지 않아도 작동합니다.

<Tip>
권한은 프로세스 컨텍스트별로 부여됩니다. Gateway가 헤드리스(LaunchAgent/SSH)로 실행되는 경우 동일한 컨텍스트에서 일회성 대화형 명령을 실행하여 권한 요청을 트리거하십시오.

```bash
imsg chats --limit 1
# 또는
imsg send <handle> "테스트"
```

</Tip>

<Accordion title="SSH 래퍼 전송이 AppleEvents -1743 오류로 실패함">
  원격 SSH 설정은 채팅을 읽고 `channels status --probe`을 통과하며 인바운드 메시지를 처리할 수 있지만, 아웃바운드 전송은 여전히 AppleEvents 권한 부여 오류로 실패할 수 있습니다.

```text
Messages에 Apple 이벤트를 보낼 권한이 없습니다. (-1743)
```

로그인된 Mac 사용자의 TCC 데이터베이스 또는 System Settings > Privacy & Security > Automation을 확인하십시오. Automation 항목이 `imsg` 또는 로컬 셸 프로세스가 아닌 `/usr/libexec/sshd-keygen-wrapper`에 기록된 경우 macOS는 해당 SSH 서버 측 클라이언트에 사용할 수 있는 Messages 토글을 표시하지 않을 수 있습니다.

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

이 상태에서는 Messages Automation이 필요한 프로세스 컨텍스트가 UI에서 권한을 부여할 수 있는 앱이 아니라 SSH 래퍼이므로, 동일한 SSH 래퍼를 통해 `tccutil reset AppleEvents`을 반복하거나 `imsg send`을 다시 실행해도 계속 실패할 수 있습니다.

대신 지원되는 다음 `imsg` 프로세스 컨텍스트 중 하나를 사용하십시오.

- 로그인된 Messages 사용자의 로컬 세션에서 Gateway 또는 최소한 `imsg` 브리지를 실행하십시오.
- 동일한 세션에서 전체 디스크 접근 권한과 자동화 권한을 부여한 후 해당 사용자의 LaunchAgent로 Gateway를 시작하십시오.
- 두 사용자 SSH 토폴로지를 유지하는 경우 채널을 활성화하기 전에 정확한 래퍼를 통해 실제 아웃바운드 `imsg send`이 성공하는지 확인하십시오. 자동화 권한을 부여할 수 없다면 전송에 SSH 래퍼를 사용하는 대신 단일 사용자 `imsg` 설정으로 재구성하십시오.

</Accordion>

## imsg 비공개 API 활성화

`imsg`은 두 가지 운영 모드로 제공됩니다. OpenClaw에서는 사용자가 기대하는 네이티브 iMessage 작업을 채널에 제공하므로 비공개 API 모드를 권장합니다. 기본 모드는 위험이 낮은 설치, 초기 확인 또는 SIP를 비활성화할 수 없는 호스트에 여전히 유용합니다.

- **기본 모드**(기본값, SIP 변경 불필요): `send`을 통한 아웃바운드 텍스트 및 미디어, 인바운드 감시/기록, 채팅 목록을 제공합니다. 새 `brew install steipete/tap/imsg`과 위의 표준 macOS 권한만으로 즉시 사용할 수 있는 모드입니다.
- **비공개 API 모드**: `imsg`은 내부 `IMCore` 함수를 호출하기 위해 `Messages.app`에 헬퍼 dylib를 주입합니다. 이를 통해 `react`, `edit`, `unsend`, `reply`(스레드 방식), `sendWithEffect`, `poll` 및 `poll-vote`(네이티브 Messages 투표), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`과 입력 표시기 및 읽음 확인 기능이 활성화됩니다.

이 페이지에서 권장하는 작업 기능에는 비공개 API 모드가 필요합니다. `imsg` README에는 이 요구 사항이 명시되어 있습니다.

> `read`, `typing`, `launch`, 브리지 기반 리치 전송, 메시지 변경 및 채팅 관리와 같은 고급 기능은 선택 사항입니다. 이러한 기능을 사용하려면 SIP를 비활성화하고 헬퍼 dylib를 `Messages.app`에 주입해야 합니다. SIP가 활성화된 경우 `imsg launch`은 주입을 거부합니다.

헬퍼 주입 기법은 Messages 비공개 API에 접근하기 위해 `imsg` 자체의 dylib를 사용합니다. OpenClaw iMessage 경로에는 타사 서버나 BlueBubbles 런타임이 없습니다.

<Warning>
**SIP 비활성화에는 실질적인 보안 상충 관계가 따릅니다.** SIP는 수정된 시스템 코드의 실행을 방지하는 macOS 핵심 보호 기능 중 하나입니다. 시스템 전체에서 SIP를 끄면 추가적인 공격 표면과 부작용이 발생합니다. 특히 **Apple Silicon Mac에서 SIP를 비활성화하면 Mac에 iOS 앱을 설치하고 실행하는 기능도 비활성화됩니다**.

특히 주로 사용하는 개인용 Mac에서는 이를 신중한 운영 선택으로 취급하십시오. 프로덕션 품질의 OpenClaw iMessage를 위해서는 브리지 활성화를 감수할 수 있는 전용 Mac 또는 봇용 macOS 사용자를 사용하는 것이 좋습니다. 위협 모델상 어느 환경에서도 SIP 비활성화를 허용할 수 없다면 번들 iMessage는 기본 모드로 제한됩니다. 즉, 텍스트 및 미디어 송수신만 가능하며 반응 / 편집 / 전송 취소 / 효과 / 그룹 작업은 사용할 수 없습니다.
</Warning>

### 설정

1. Messages.app을 실행하는 Mac에 **`imsg`을 설치(또는 업그레이드)하십시오**.

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 출력은 `bridge_version`, `rpc_methods` 및 메서드별 `selectors`을 보고하므로 시작하기 전에 현재 빌드에서 지원하는 기능을 확인할 수 있습니다.

2. **시스템 무결성 보호(System Integrity Protection)와 (최신 macOS에서는) 라이브러리 검증을 비활성화하십시오.** Apple이 서명한 `Messages.app`에 Apple 이외의 헬퍼 dylib을 주입하려면 SIP를 끄고 **라이브러리 검증도** 완화해야 합니다. 복구 모드에서 수행하는 SIP 단계는 macOS 버전에 따라 다릅니다.
   - **macOS 10.13-10.15(Sierra-Catalina):** Terminal에서 Library Validation을 비활성화하고 복구 모드로 재부팅한 다음 `csrutil disable`을 실행하고 재시작하십시오.
   - **macOS 11+(Big Sur 이상), Intel:** 복구 모드(또는 인터넷 복구)에서 `csrutil disable`을 실행하고 재시작하십시오.
   - **macOS 11+, Apple Silicon:** 전원 버튼 시동 절차를 통해 복구 모드로 진입하십시오. 최신 macOS 버전에서는 Continue를 클릭할 때 **Left Shift** 키를 누른 상태로 유지한 다음 `csrutil disable`을 실행하십시오. 가상 머신 환경에서는 별도의 절차를 따르므로 먼저 VM 스냅샷을 생성하십시오.

   **macOS 11 이상에서는 `csrutil disable`만으로는 대개 충분하지 않습니다.** Apple은 플랫폼 바이너리인 `Messages.app`에 대해 여전히 라이브러리 검증을 적용하므로, SIP가 꺼져 있어도 임시 서명된 헬퍼가 거부됩니다(`Library Validation failed: ... platform binary, but mapped file is not`). SIP를 비활성화한 후 라이브러리 검증도 비활성화하고 재부팅하십시오.

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26(Tahoe), 26.5.1에서 검증됨:** SIP 비활성화와 위의 `DisableLibraryValidation` 명령을 함께 사용하면 26.0부터 26.5.x까지 헬퍼를 주입하기에 충분합니다. **boot-args는 필요하지 않습니다.** plist가 결정적인 요소이며, Tahoe에서 주입에 실패할 때 가장 흔히 누락되는 단계입니다.
   - **plist가 있는 경우:** `imsg launch`이 주입되고 `imsg status`이 `advanced_features: true`을 보고합니다.
   - **plist가 없는 경우(SIP가 꺼져 있어도):** `imsg launch`이 `Failed to launch: Timeout waiting for Messages.app to initialize` 오류로 실패합니다. AMFI가 로드 시 임시 서명된 헬퍼를 거부하므로 브리지가 준비되지 않고 실행 시간이 초과됩니다. 이 시간 초과는 Tahoe에서 대부분의 사용자가 겪는 증상입니다. 해결 방법은 위의 plist이며, 더 과격한 조치가 아닙니다.

   macOS 업그레이드 후 `imsg launch` 주입이나 특정 `selectors`이 false를 반환하기 시작한다면 일반적으로 이 게이트가 원인입니다. SIP 단계 자체가 실패했다고 판단하기 전에 SIP와 라이브러리 검증 상태를 확인하십시오. 해당 설정이 올바른데도 브리지를 주입할 수 없다면, 시스템 전반의 보안 제어를 추가로 약화하지 말고 `imsg status --json` 및 `imsg launch` 출력을 수집하여 `imsg` 프로젝트에 보고하십시오.

3. **헬퍼를 주입하십시오.** SIP가 비활성화되어 있고 Messages.app에 로그인된 상태에서 다음을 실행하십시오.

   ```bash
   imsg launch
   ```

   SIP가 여전히 활성화되어 있으면 `imsg launch`이 주입을 거부하므로, 이를 통해 2단계가 적용되었는지도 확인할 수 있습니다.

4. **OpenClaw에서 브리지를 확인하십시오.**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 항목에 `works`이 보고되어야 하며, `imsg status --json | jq '{rpc_methods, selectors}'`에는 사용 중인 macOS 빌드가 제공하는 기능이 표시되어야 합니다. 투표 생성에는 `selectors.pollPayloadMessage`이 필요하며, 투표하려면 `selectors.pollVoteMessage`과 `poll.vote` RPC 메서드가 모두 필요합니다. OpenClaw Plugin은 캐시된 프로브에서 지원하는 작업만 알리지만, 캐시가 비어 있으면 낙관적으로 처리하고 최초 디스패치 시 프로브를 수행합니다.

`openclaw channels status --probe`이 채널을 `works`으로 보고하지만 특정 작업을 디스패치할 때 "iMessage `<action>` requires the imsg private API bridge" 오류가 발생한다면 `imsg launch`을 다시 실행하십시오. 헬퍼는 Messages.app 재시작이나 OS 업데이트 등으로 분리될 수 있으며, 캐시된 `available: true` 상태는 다음 프로브에서 갱신될 때까지 계속 작업을 알립니다.

### SIP를 활성화 상태로 유지하는 경우

위협 모델상 SIP를 비활성화할 수 없다면 다음과 같이 동작합니다.

- `imsg`은 기본 모드로 대체됩니다. 이 모드에서는 텍스트, 미디어 및 수신만 지원합니다.
- OpenClaw Plugin은 여전히 텍스트/미디어 전송과 인바운드 모니터링을 알리지만, 메서드별 기능 게이트에 따라 작업 화면에서 `react`, `edit`, `unsend`, `reply`, `sendWithEffect` 및 그룹 작업을 숨깁니다.
- 기본 기기에서는 SIP를 활성화 상태로 유지하면서 iMessage 워크로드에는 SIP가 비활성화된 별도의 비 Apple Silicon Mac(또는 전용 봇 Mac)을 사용할 수 있습니다. 아래의 [전용 봇 macOS 사용자(별도의 iMessage ID)](#deployment-patterns)를 참조하십시오.

## 액세스 제어 및 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.imessage.dmPolicy`은 다이렉트 메시지를 제어합니다.

    - `pairing` (기본값)
    - `allowlist` (`allowFrom` 항목이 하나 이상 필요)
    - `open` (`allowFrom`에 `"*"`이 포함되어야 함)
    - `disabled`

    허용 목록 필드: `channels.imessage.allowFrom`.

    허용 목록 항목은 발신자를 식별해야 합니다. 핸들 또는 정적 발신자 액세스 그룹(`accessGroup:<name>`)을 사용하십시오. `chat_id:*`, `chat_guid:*`, `chat_identifier:*`과 같은 채팅 대상에는 `channels.imessage.groupAllowFrom`을 사용하고, 숫자형 `chat_id` 레지스트리 키에는 `channels.imessage.groups`을 사용하십시오.

  </Tab>

  <Tab title="그룹 정책 + 멘션">
    `channels.imessage.groupPolicy`은 그룹 처리를 제어합니다.

    - `allowlist` (기본값)
    - `open`
    - `disabled`

    그룹 발신자 허용 목록: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom` 항목은 정적 발신자 액세스 그룹(`accessGroup:<name>`)도 참조할 수 있습니다.

    런타임 대체 동작: `groupAllowFrom`이 설정되지 않은 경우 iMessage 그룹 발신자 검사는 `allowFrom`을 사용합니다. DM과 그룹 허용 조건을 다르게 지정하려면 `groupAllowFrom`을 설정하십시오. 명시적으로 비어 있는 `groupAllowFrom: []`은 대체 동작을 사용하지 않으며, `allowlist`에서 모든 그룹 발신자를 차단합니다.
    런타임 참고: `channels.imessage`이 완전히 누락된 경우 런타임은 `groupPolicy="allowlist"`으로 대체하고 경고를 기록합니다(`channels.defaults.groupPolicy`이 설정되어 있어도 마찬가지입니다).

    <Warning>
    `groupPolicy: "allowlist"`에서 그룹 라우팅은 **두 개**의 게이트를 연속으로 실행합니다.

    1. **발신자 허용 목록**(`channels.imessage.groupAllowFrom`) — 핸들, `accessGroup:<name>`, `chat_guid`, `chat_identifier` 또는 `chat_id`. 유효 목록이 비어 있으면(`groupAllowFrom`이 없고 `allowFrom` 대체 항목도 없는 경우) 모든 그룹 발신자를 차단합니다.
    2. **그룹 레지스트리**(`channels.imessage.groups`) — 맵에 항목이 생기면 적용됩니다. 채팅은 명시적인 `chat_id`별 항목 또는 `groups: { "*": { ... } }` 와일드카드와 일치해야 합니다. `groups`이 비어 있거나 누락된 경우에는 발신자 허용 목록만으로 허용 여부를 결정합니다.

    유효한 그룹 발신자 허용 목록이 구성되지 않은 경우 모든 그룹 메시지는 레지스트리 게이트에 도달하기 전에 삭제됩니다. 각 게이트는 기본 로그 수준에서 자체적인 `warn` 수준 신호를 내보내며 서로 다른 해결 방법을 제시합니다.

    - 시작 시 계정별로 한 번, 유효한 그룹 발신자 허용 목록이 비어 있는 경우: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — `channels.imessage.groupAllowFrom`(또는 `allowFrom`)을 설정하여 해결하십시오. `groups` 항목만 추가하면 게이트 1이 계속 모든 발신자를 차단합니다.
    - 런타임에 `chat_id`별로 한 번, 발신자가 게이트 1을 통과했지만 채워진 `groups` 레지스트리에 채팅이 없는 경우: `imessage: dropping group message from chat_id=<id> ...` — 해당 `chat_id`(또는 `"*"`)을 `channels.imessage.groups` 아래에 추가하여 해결하십시오.

    DM은 영향을 받지 않으며 다른 코드 경로를 사용합니다.

    `groupPolicy: "allowlist"`에서 그룹 흐름에 권장되는 구성은 다음과 같습니다.

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

    `groupAllowFrom`만으로 해당 발신자를 모든 그룹에서 허용합니다. 허용할 채팅의 범위를 지정하고 `requireMention` 같은 채팅별 옵션을 설정하려면 `groups` 블록을 추가하십시오.
    </Warning>

    그룹의 멘션 게이트:

    - iMessage에는 네이티브 멘션 메타데이터가 없습니다.
    - 멘션 감지는 정규식 패턴(`agents.list[].groupChat.mentionPatterns`, 대체 `messages.groupChat.mentionPatterns`)을 사용합니다.
    - 구성된 패턴이 없으면 멘션 게이트를 적용할 수 없습니다.
    - 권한이 있는 발신자의 제어 명령은 멘션 게이트를 우회합니다.

    그룹별 `systemPrompt`:

    `channels.imessage.groups.*` 아래의 각 항목에는 선택적 `systemPrompt` 문자열을 지정할 수 있으며, 해당 그룹의 메시지를 처리하는 모든 턴에서 에이전트의 시스템 프롬프트에 주입됩니다. 해석 방식은 `channels.whatsapp.groups`과 동일합니다.

    1. **그룹별 시스템 프롬프트**(`groups["<chat_id>"].systemPrompt`): 맵에 해당 그룹 항목이 존재하고 **동시에** 그 항목의 `systemPrompt` 키가 정의되어 있을 때 사용합니다. `systemPrompt`이 빈 문자열(`""`)이면 와일드카드가 억제되고 해당 그룹에는 시스템 프롬프트가 적용되지 않습니다.
    2. **그룹 와일드카드 시스템 프롬프트**(`groups["*"].systemPrompt`): 해당 그룹 항목이 맵에 전혀 없거나, 항목은 있지만 `systemPrompt` 키가 정의되지 않은 경우 사용합니다.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "영국식 철자를 사용하십시오." },
            "8421": {
              requireMention: true,
              systemPrompt: "여기는 온콜 교대 채팅입니다. 답변은 3문장 이내로 작성하십시오.",
            },
            "9907": {
              // 명시적 억제: 와일드카드 "영국식 철자를 사용하십시오."는 여기에 적용되지 않습니다.
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    그룹별 프롬프트는 그룹 메시지에만 적용되며, 다이렉트 메시지는 영향을 받지 않습니다.

  </Tab>

  <Tab title="세션과 결정론적 답장">
    - DM은 다이렉트 라우팅을 사용하고 그룹은 그룹 라우팅을 사용합니다.
    - 기본 `session.dmScope=main`을 사용하면 iMessage DM은 에이전트 기본 세션으로 통합됩니다.
    - 그룹 세션은 격리됩니다(`agent:<agentId>:imessage:group:<chat_id>`).
    - 답장은 원래 채널/대상 메타데이터를 사용하여 iMessage로 다시 라우팅됩니다.

    그룹과 유사한 스레드의 동작:

    일부 다중 참여자 iMessage 스레드는 `is_group=false`과 함께 수신될 수 있습니다.
    해당 `chat_id`이 `channels.imessage.groups` 아래에 명시적으로 구성되어 있으면 OpenClaw는 이를 그룹 트래픽으로 처리합니다(그룹 게이트 + 그룹 세션 격리).

  </Tab>
</Tabs>

## ACP 대화 바인딩

iMessage 채팅을 ACP 세션에 바인딩할 수 있습니다.

빠른 운영자 절차:

- DM 또는 허용된 그룹 채팅 내에서 `/acp spawn codex --bind here`을 실행하십시오.
- 이후 동일한 iMessage 대화의 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- `/new`과 `/reset`은 동일하게 바인딩된 ACP 세션을 현재 위치에서 재설정합니다.
- `/acp close`은 ACP 세션을 닫고 바인딩을 제거합니다.

구성된 영구 바인딩은 `type: "acp"` 및 `match.channel: "imessage"`이 포함된 최상위 `bindings[]` 항목을 사용합니다.

`match.peer.id`에는 다음을 사용할 수 있습니다.

- `+15555550123` 또는 `user@example.com` 같은 정규화된 DM 핸들
- `chat_id:<id>` (안정적인 그룹 바인딩에 권장)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

예시:

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

공유 ACP 바인딩 동작은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하십시오.

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 봇 macOS 사용자(별도의 iMessage ID)">
    봇 트래픽을 개인 Messages 프로필과 격리하려면 전용 Apple ID와 macOS 사용자를 사용하십시오.

    일반적인 절차:

    1. 전용 macOS 사용자를 생성하거나 해당 사용자로 로그인하십시오.
    2. 해당 사용자의 Messages에 봇 Apple ID로 로그인하십시오.
    3. 해당 사용자에 `imsg`을(를) 설치하십시오.
    4. OpenClaw가 해당 사용자 컨텍스트에서 `imsg`을(를) 실행할 수 있도록 SSH 래퍼를 생성하십시오.
    5. `channels.imessage.accounts.<id>.cliPath` 및 `.dbPath`이(가) 해당 사용자 프로필을 가리키도록 설정하십시오.

    처음 실행할 때 해당 봇 사용자 세션에서 GUI 승인(Automation + Full Disk Access)이 필요할 수 있습니다.

  </Accordion>

  <Accordion title="Tailscale을 통한 원격 Mac(예시)">
    일반적인 토폴로지는 다음과 같습니다.

    - gateway는 Linux/VM에서 실행됩니다.
    - iMessage + `imsg`은(는) tailnet 내의 Mac에서 실행됩니다.
    - `cliPath` 래퍼는 SSH를 사용하여 `imsg`을(를) 실행합니다.
    - `remoteHost`은(는) SCP 첨부 파일 가져오기를 활성화합니다.

    예시:

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

    SSH와 SCP가 모두 비대화형으로 작동하도록 SSH 키를 사용하십시오.
    `known_hosts`이(가) 채워지도록 먼저 호스트 키를 신뢰하도록 설정하십시오(예: `ssh bot@mac-mini.tailnet-1234.ts.net`).

  </Accordion>

  <Accordion title="다중 계정 패턴">
    iMessage는 `channels.imessage.accounts` 아래에서 계정별 구성을 지원합니다.

    각 계정은 `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, 기록 설정, 첨부 파일 루트 허용 목록 등의 필드를 재정의할 수 있습니다.

  </Accordion>

  <Accordion title="다이렉트 메시지 기록">
    새 다이렉트 메시지 세션에 해당 대화의 최근 디코딩된 `imsg` 기록을 제공하려면 `channels.imessage.dmHistoryLimit`을(를) 설정하십시오. 발신자별 재정의에는 `channels.imessage.dms["<sender>"].historyLimit`을(를) 사용하며, 발신자의 기록을 비활성화하는 `0`도 포함됩니다.

    iMessage DM 기록은 필요할 때 `imsg`에서 가져옵니다. `dmHistoryLimit`을(를) 설정하지 않으면 전역 DM 기록 제공이 비활성화되지만, 발신자별 `channels.imessage.dms["<sender>"].historyLimit`이(가) 양수이면 해당 발신자에 대해서는 여전히 기록 제공이 활성화됩니다.

  </Accordion>
</AccordionGroup>

## 미디어, 청킹 및 전달 대상

<AccordionGroup>
  <Accordion title="첨부 파일 및 미디어">
    - 인바운드 첨부 파일 수집은 **기본적으로 꺼져 있습니다**. 사진, 음성 메모, 동영상 및 기타 첨부 파일을 에이전트에 전달하려면 `channels.imessage.includeAttachments: true`을(를) 설정하십시오. 비활성화된 경우 첨부 파일만 포함된 iMessage는 에이전트에 도달하기 전에 삭제되며 `Inbound message` 로그 줄이 전혀 생성되지 않을 수 있습니다.
    - `remoteHost`이(가) 설정된 경우 원격 첨부 파일 경로를 SCP를 통해 가져올 수 있습니다.
    - 첨부 파일 경로는 허용된 루트와 일치해야 합니다.
      - `channels.imessage.attachmentRoots`(로컬)
      - `channels.imessage.remoteAttachmentRoots`(원격 SCP 모드)
      - 구성된 루트는 기본 루트 패턴 `/Users/*/Library/Messages/Attachments`을(를) 확장합니다(대체하지 않고 병합함).
    - SCP는 엄격한 호스트 키 검사를 사용합니다(`StrictHostKeyChecking=yes`).
    - 아웃바운드 미디어 크기에는 `channels.imessage.mediaMaxMb`을(를) 사용합니다(기본값 16 MB).

  </Accordion>

  <Accordion title="아웃바운드 텍스트 및 청킹">
    - 텍스트 청크 제한: `channels.imessage.textChunkLimit`(기본값 4000)
    - 청크 모드: `channels.imessage.streaming.chunkMode`
      - `length`(기본값)
      - `newline`(문단 우선 분할)
    - 아웃바운드 Markdown 굵게/기울임꼴/밑줄/취소선은 네이티브 스타일 텍스트로 변환됩니다(macOS 15+ 수신자에게는 스타일이 적용되어 표시되며, 이전 버전 수신자에게는 마커 없는 일반 텍스트로 표시됨). Markdown 표는 채널의 Markdown 표 모드에 따라 변환됩니다.
    - `channels.imessage.sendTransport`(기본값 `auto`, `bridge`, `applescript`)은(는) `imsg`이(가) 메시지를 전달하는 방식을 선택합니다.

  </Accordion>

  <Accordion title="주소 지정 형식">
    권장되는 명시적 대상:

    - `chat_id:123`(안정적인 라우팅에 권장)
    - `chat_guid:...`
    - `chat_identifier:...`

    핸들 대상도 지원됩니다.

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## 비공개 API 작업

`imsg launch`이(가) 실행 중이고 `openclaw channels status --probe`이(가) `privateApi.available: true`을(를) 보고하면 메시지 도구는 일반 텍스트 전송 외에도 iMessage 네이티브 작업을 사용할 수 있습니다.

모든 작업은 기본적으로 활성화됩니다. 개별 작업을 끄려면 `channels.imessage.actions`을(를) 사용하십시오.

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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="사용 가능한 작업">
    - **반응**: iMessage 탭백을 추가하거나 제거합니다(`messageId`, `emoji`, `remove`). 지원되는 탭백은 사랑, 좋아요, 싫어요, 웃음, 강조 및 질문에 매핑됩니다. 이모지 없이 제거하면 설정된 탭백이 무엇이든 삭제됩니다.
    - **답장**: 기존 메시지에 스레드 답장을 보냅니다(`messageId`, `text` 또는 `message`, 그리고 `chatGuid`, `chatId`, `chatIdentifier` 또는 `to`). 첨부 파일을 포함한 답장에는 `--file`을(를) 지원하는 `send-rich`이(가) 포함된 `imsg` 빌드도 필요합니다.
    - **효과와 함께 전송**: iMessage 효과를 적용한 텍스트를 보냅니다(`text` 또는 `message`, `effect` 또는 `effectId`). 짧은 이름: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **편집**: 지원되는 macOS/비공개 API 버전에서 전송한 메시지를 편집합니다(`messageId`, `text` 또는 `newText`). Gateway 자체가 보낸 메시지만 편집할 수 있습니다.
    - **전송 취소**: 지원되는 macOS/비공개 API 버전에서 전송한 메시지를 철회합니다(`messageId`). Gateway 자체가 보낸 메시지만 전송을 취소할 수 있습니다.
    - **파일 업로드**: 미디어/파일을 보냅니다(`buffer`을(를) base64로 사용하거나 하이드레이션된 `media`/`path`/`filePath`, `filename`, 선택적 `asVoice` 사용). 레거시 별칭: `sendAttachment`.
    - **그룹 이름 변경**, **그룹 아이콘 설정**, **참여자 추가**, **참여자 제거**, **그룹 나가기**: 현재 대상이 그룹 대화일 때 그룹 채팅을 관리합니다. 이러한 작업은 호스트의 Messages ID를 변경하므로 소유자 발신자 또는 `operator.admin` Gateway 클라이언트가 필요합니다.
    - **투표**: 네이티브 Apple Messages 투표를 생성합니다(`pollQuestion`, 2회에서 12회 반복되는 `pollOption`, 그리고 `chatGuid`, `chatId`, `chatIdentifier` 또는 `to`). iOS/iPadOS/macOS 26+ 수신자는 네이티브로 투표를 보고 참여할 수 있으며, 이전 OS 버전에서는 "투표를 보냈습니다"라는 텍스트 대체 메시지를 받습니다. `selectors.pollPayloadMessage`이(가) 필요합니다.
    - **투표 참여**: 기존 투표에 참여합니다(`pollId` 또는 `messageId`, 그리고 `pollOptionIndex`, `pollOptionId` 또는 `pollOptionText` 중 정확히 하나). `selectors.pollVoteMessage` 및 `poll.vote` RPC 메서드가 필요합니다.

    수락된 인바운드 투표는 질문, 번호가 지정된 선택지 레이블, 득표수 및 `poll-vote`에 필요한 투표 메시지 ID와 함께 에이전트에 표시됩니다.

  </Accordion>

  <Accordion title="메시지 ID">
    인바운드 iMessage 컨텍스트에는 사용 가능한 경우 짧은 `MessageSid` 값과 전체 메시지 GUID(`MessageSidFull`)가 모두 포함됩니다. 짧은 ID는 최근 SQLite 기반 답장 캐시로 범위가 제한되며 사용 전에 현재 채팅과 대조하여 확인됩니다. 짧은 ID가 만료되면 해당 ID를 제공한 대화를 대상으로 지정하면서 그 `MessageSidFull`으로 다시 시도하십시오. 전체 ID도 대화 또는 계정 바인딩을 우회하지 않으므로 다른 채팅의 ID를 현재 대상의 ID로 교체하십시오. 원격 위임 호출은 현재 대화에 대한 증거가 없으면 오래된 전체 ID를 거부할 수 있습니다.

  </Accordion>

  <Accordion title="기능 감지">
    OpenClaw는 캐시된 프로브 상태에서 브리지를 사용할 수 없다고 나타내는 경우에만 비공개 API 작업을 숨깁니다. 상태를 알 수 없는 경우 작업은 계속 표시되며 디스패치 시 지연 프로브를 수행하므로, 별도의 수동 상태 새로 고침 없이도 `imsg launch` 이후 첫 번째 작업이 성공할 수 있습니다.

  </Accordion>

  <Accordion title="읽음 확인 및 입력 중 표시">
    비공개 API 브리지가 작동 중이면 수락된 인바운드 채팅은 읽음으로 표시되고, 다이렉트 채팅에는 턴이 수락되는 즉시 에이전트가 컨텍스트를 준비하고 생성하는 동안 입력 중 말풍선이 표시됩니다. 읽음 표시를 비활성화하려면 다음과 같이 설정하십시오.

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    메서드별 기능 목록보다 이전에 빌드된 구형 `imsg`은(는) 입력 중 표시/읽음을 알림 없이 차단합니다. OpenClaw는 누락된 읽음 확인의 원인을 파악할 수 있도록 재시작할 때마다 일회성 경고를 기록합니다.

  </Accordion>

  <Accordion title="인바운드 탭백">
    OpenClaw는 iMessage 탭백을 구독하고 수락된 반응을 일반 메시지 텍스트 대신 시스템 이벤트로 라우팅하므로, 사용자의 탭백이 일반적인 답장 루프를 트리거하지 않습니다.

    알림 모드는 `channels.imessage.reactionNotifications`에 의해 제어됩니다.

    - `"own"`(기본값): 사용자가 봇이 작성한 메시지에 반응할 때만 알립니다.
    - `"all"`: 권한이 부여된 발신자의 모든 인바운드 탭백을 알립니다.
    - `"off"`: 인바운드 탭백을 무시합니다.

    계정별 재정의에는 `channels.imessage.accounts.<id>.reactionNotifications`을(를) 사용합니다.

  </Accordion>

  <Accordion title="승인 반응(👍 / 👎)">
    `approvals.exec.enabled` 또는 `approvals.plugin.enabled`이(가) true이고 요청이 iMessage로 라우팅되면 Gateway는 승인 프롬프트를 네이티브로 전달하고 탭백을 수락하여 요청을 처리합니다.

    - `👍`(좋아요 탭백) → `allow-once`
    - `👎`(싫어요 탭백) → `deny`
    - `allow-always`은(는) 수동 대체 수단으로 유지됩니다. `/approve <id> allow-always`을(를) 일반 답장으로 보내십시오.

    반응을 처리하려면 반응한 사용자의 핸들이 명시적 승인자로 지정되어 있어야 합니다. 승인자 목록은 `channels.imessage.allowFrom`(또는 `channels.imessage.accounts.<id>.allowFrom`)에서 읽습니다. 사용자의 전화번호를 E.164 형식으로 추가하거나 Apple ID 이메일을 추가하십시오(`chat_id:*`과(와) 같은 채팅 대상은 유효한 승인자 항목이 아님). 와일드카드 항목 `"*"`은(는) 적용되지만 모든 발신자의 승인을 허용합니다. 승인자 목록이 비어 있으면 반응 단축 기능이 완전히 비활성화됩니다. 반응 단축 기능은 의도적으로 `reactionNotifications`, `dmPolicy` 및 `groupAllowFrom`을(를) 우회합니다. 명시적 승인자 허용 목록만이 승인 처리에 중요한 유일한 게이트이기 때문입니다.

    `/approve` 텍스트 명령 권한 부여도 동일한 목록을 따릅니다. `channels.imessage.allowFrom`이(가) 비어 있지 않으면 `/approve <id> <decision>`은(는) 더 광범위한 DM 허용 목록이 아니라 해당 승인자 목록을 기준으로 권한이 부여되며, DM 허용 목록에는 있지만 `allowFrom`에는 없는 발신자는 명시적인 거부 응답을 받습니다. `allowFrom`이(가) 비어 있으면 동일 채팅 대체 동작이 유지되고 `/approve`은(는) DM 허용 목록에서 허용하는 모든 사용자에게 권한을 부여합니다. `/approve` 또는 반응을 통해 승인해야 하는 모든 운영자를 `allowFrom`에 추가하십시오.

    운영자 참고 사항:
    - 반응 바인딩은 메모리와 Gateway의 영구 키 저장소(승인 만료 시간과 일치하는 TTL)에 모두 저장되며, Gateway는 탭백이 있는지 대기 중인 프롬프트도 폴링하므로 Gateway가 다시 시작된 직후 도착한 탭백도 승인을 처리합니다.
    - 해당 핸들이 명시적 승인자인 경우 운영자 본인의 `is_from_me=true` 탭백(예: 페어링된 Apple 기기에서 보낸 탭백)도 승인을 처리합니다.
    - 명시적 승인자가 구성된 경우에만 승인 프롬프트가 그룹 대화로 라우팅됩니다. 그렇지 않으면 모든 그룹 구성원이 승인할 수 있습니다.
    - 레거시 텍스트 형식 탭백(매우 오래된 Apple 클라이언트의 `Liked "…"` 일반 텍스트)은 메시지 GUID를 포함하지 않으므로 승인을 처리할 수 없습니다. 반응을 처리하려면 최신 macOS / iOS 클라이언트가 내보내는 구조화된 탭백 메타데이터가 필요합니다.

  </Accordion>
</AccordionGroup>

## 구성 쓰기

iMessage는 기본적으로 채널에서 시작한 구성 쓰기를 허용합니다(`commands.config: true`일 때 `/config set|unset`에 사용).

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

사용자가 명령과 URL을 함께 입력하면(예: `Dump https://example.com/article`) Apple의 Messages 앱은 전송 내용을 **서로 다른 두 개의 `chat.db` 행**으로 분할합니다.

1. 텍스트 메시지(`"Dump"`).
2. OG 미리 보기 이미지가 첨부 파일로 포함된 URL 미리 보기 말풍선(`"https://..."`).

대부분의 설정에서 두 행은 약 0.8~2.0초 간격으로 OpenClaw에 도착합니다. 병합하지 않으면 에이전트는 1번째 턴에서 명령만 받고(URL이 도착하기 전에 흔히 "URL을 보내 주세요"라고 응답함), 2번째 턴에서 URL을 받습니다. 이는 Apple의 전송 파이프라인에서 발생하며 OpenClaw나 `imsg`에서 유발하는 동작이 아닙니다.

`channels.imessage.coalesceSameSenderDms`는 연속해서 도착한 동일 발신자의 행을 DM에서 버퍼링하도록 옵트인합니다. 소스 행 중 하나에서 `imsg`가 구조적 URL 미리 보기 마커 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"`를 노출하면 OpenClaw는 실제 분할 전송만 병합하고 버퍼링된 다른 행은 별도 턴으로 유지합니다. 말풍선 메타데이터를 전혀 내보내지 않는 이전 `imsg` 빌드에서는 OpenClaw가 분할 전송과 별도 전송을 구분할 수 없으므로 버킷을 병합하는 방식으로 대체합니다. 이를 통해 메타데이터 이전의 동작을 유지하며 `Dump <url>` 분할 전송이 두 턴으로 퇴행하는 것을 방지합니다. 다중 사용자 턴 구조를 유지하도록 그룹 채팅은 계속 메시지별로 디스패치됩니다.

<Tabs>
  <Tab title="활성화해야 하는 경우">
    다음 경우 활성화하십시오.

    - 하나의 메시지에서 `command + payload`를 기대하는 Skills(dump, paste, save, queue 등)를 배포합니다.
    - 사용자가 명령과 함께 URL을 붙여 넣습니다.
    - 추가되는 DM 턴 지연 시간(아래 참조)을 허용할 수 있습니다.

    다음 경우 비활성화된 상태로 두십시오.

    - 한 단어로 된 DM 트리거에 최소 명령 지연 시간이 필요합니다.
    - 모든 흐름이 후속 페이로드 없는 일회성 명령입니다.

  </Tab>
  <Tab title="활성화">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // 옵트인(기본값: false)
        },
      },
    }
    ```

    플래그가 켜져 있고 명시적인 `messages.inbound.byChannel.imessage` 또는 전역 `messages.inbound.debounceMs`이 없으면 디바운스 시간 범위가 **7000 ms**로 늘어납니다(레거시 기본값은 디바운싱이 없는 0 ms입니다). Messages.app에서 미리 보기 행을 내보내는 동안 Apple의 URL 미리 보기 분할 전송 간격이 수 초까지 늘어날 수 있으므로 더 넓은 시간 범위가 필요합니다.

    시간 범위를 직접 조정하려면 다음과 같이 설정하십시오.

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms는 관찰된 Messages.app URL 미리 보기 지연을 포괄합니다.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="절충점">
    - **정확한 병합에는 최신 `imsg` 페이로드 메타데이터가 필요합니다.** `balloon_bundle_id`이 있으면 실제 분할 전송만 병합됩니다. 위에서 설명한 메타데이터 없는 대체 병합은 임시 하위 호환 동작이며, `imsg`가 업스트림에서 분할 전송을 병합하게 되면 제거됩니다.
    - **DM 메시지 지연 시간이 추가됩니다.** 플래그가 켜져 있으면 URL 미리 보기 행이 도착할 가능성에 대비하여 모든 DM(독립 실행형 제어 명령과 단일 텍스트 후속 메시지 포함)이 디스패치되기 전에 최대 디바운스 시간 범위만큼 대기합니다. 그룹 채팅 메시지는 계속 즉시 디스패치됩니다.
    - **병합된 출력에는 한도가 있습니다.** 병합된 텍스트는 명시적인 `…[truncated]` 마커와 함께 4000자로 제한되고, 첨부 파일은 20개로 제한되며, 소스 항목은 10개로 제한됩니다(이를 초과하면 첫 항목과 최신 항목을 유지). 모든 소스 GUID는 다운스트림 텔레메트리를 위해 `coalescedMessageGuids`에서 추적됩니다.
    - **DM 전용입니다.** 여러 사람이 입력할 때 봇의 응답성을 유지하도록 그룹 채팅은 메시지별 디스패치로 처리됩니다.
    - **채널별 옵트인 방식입니다.** 다른 채널(Discord, Slack, Telegram, WhatsApp 등)은 영향을 받지 않습니다. `channels.bluebubbles.coalesceSameSenderDms`을 설정한 레거시 BlueBubbles 구성은 해당 값을 `channels.imessage.coalesceSameSenderDms`로 마이그레이션해야 합니다.

  </Tab>
</Tabs>

### 시나리오 및 에이전트가 확인하는 내용

"플래그 켜짐" 열은 `balloon_bundle_id`을 내보내는 `imsg` 빌드의 동작을 보여 줍니다. 말풍선 메타데이터를 전혀 내보내지 않는 이전 `imsg` 빌드에서는 아래에서 "두 턴"/"N개 턴"으로 표시된 행이 대신 레거시 병합(한 턴)으로 대체됩니다. OpenClaw가 구조적으로 분할 전송과 별도 전송을 구분할 수 없으므로 메타데이터 이전의 병합 동작을 유지합니다. 빌드에서 말풍선 메타데이터를 내보내기 시작하면 정확한 분리가 활성화됩니다.

| 사용자가 작성하는 내용                                                      | `chat.db`의 결과                  | 플래그 꺼짐(기본값)                      | 플래그 켜짐 + 시간 범위(imsg가 말풍선 메타데이터를 내보냄)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`(한 번 전송)                              | 약 1초 간격의 행 2개                   | 에이전트 턴 2개: "Dump"만 먼저, 그다음 URL | 턴 1개: 병합된 텍스트 `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption`(첨부 파일 + 텍스트)                | URL 말풍선 메타데이터가 없는 행 2개 | 턴 2개                               | 메타데이터가 관찰된 후에는 턴 2개, 이전/래치 전 메타데이터 없는 세션에서는 병합된 턴 1개       |
| `/status`(독립 실행형 명령)                                     | 행 1개                               | 즉시 디스패치                        | **최대 시간 범위까지 기다린 후 디스패치**                                                                |
| URL만 붙여 넣음                                                   | 행 1개                               | 즉시 디스패치                        | 최대 시간 범위까지 기다린 후 디스패치                                                                    |
| 텍스트 + URL을 의도적으로 몇 분 간격의 별도 메시지 두 개로 전송 | 시간 범위 밖의 행 2개               | 턴 2개                               | 턴 2개(둘 사이에 시간 범위 만료)                                                             |
| 빠른 대량 전송(시간 범위 내 작은 DM >10개)                          | URL 말풍선 메타데이터가 없는 N개 행 | N개 턴                                 | 메타데이터가 관찰된 후에는 N개 턴, 이전/래치 전 메타데이터 없는 세션에서는 한도가 적용된 병합 턴 1개 |
| 그룹 채팅에서 두 사람이 입력                                  | M명의 발신자가 보낸 N개 행               | M개 이상의 턴(발신자 버킷당 하나)        | M개 이상의 턴 — 그룹 채팅은 병합되지 않음                                                            |

## 브리지 또는 Gateway 재시작 후 인바운드 복구

iMessage는 Gateway가 중단된 동안 누락된 메시지를 복구하는 동시에 Push 복구 후 Apple이 한꺼번에 내보낼 수 있는 오래된 "백로그 폭탄"을 억제합니다. 기본 동작은 항상 활성화되어 있으며 인바운드 중복 제거를 기반으로 합니다.

- **재생 중복 제거.** 디스패치된 모든 인바운드 메시지는 Apple GUID를 기준으로 영구 Plugin 상태(`imessage.inbound-dedupe`)에 기록되며, 수집 시점에 점유되고 처리 후 커밋됩니다(일시적 실패 시 다시 시도할 수 있도록 해제됨). 이미 처리된 항목은 두 번 디스패치되지 않고 삭제됩니다. 이를 통해 메시지별 기록 없이도 복구 재생을 적극적으로 수행할 수 있습니다.
- **중단 시간 복구.** 시작 시 모니터는 마지막으로 디스패치된 `chat.db` rowid(계정별로 유지되는 커서)를 기억하여 `since_rowid`으로 `imsg watch.subscribe`에 전달합니다. 따라서 imsg는 Gateway가 중단된 동안 도착한 행을 재생한 다음 실시간으로 추적합니다. 재생은 가장 최근 500개 행과 최대 약 2시간 전의 메시지로 제한되며, 중복 제거 기능은 이미 처리된 항목을 삭제합니다.
- **오래된 백로그 시간 제한.** 시작 경계보다 위에 있는 행은 실제 실시간 행입니다. 전송 날짜가 도착 시점보다 약 15분 이상 오래된 행은 Push 플러시 백로그로 간주되어 억제됩니다. 재생된 행(경계 이하)은 대신 더 넓은 복구 시간 범위를 사용하므로 최근에 누락된 메시지는 전달하고 오래된 기록은 전달하지 않습니다.

복구는 로컬과 원격 `cliPath` 설정 모두에서 작동합니다. `since_rowid` 재생이 동일한 `imsg` RPC 연결을 통해 실행되기 때문입니다. 차이는 시간 범위입니다. Gateway가 `chat.db`을 읽을 수 있는 경우(로컬), 시작 rowid 경계를 기준으로 삼고 재생 범위를 제한하며 최대 약 2시간 전에 누락된 메시지를 전달합니다. 원격 SSH `cliPath`에서는 데이터베이스를 읽을 수 없으므로 재생에 제한이 없고 모든 행에 실시간 시간 제한이 적용됩니다. 따라서 최근에 누락된 메시지는 계속 복구하고 오래된 백로그도 계속 억제하지만 실시간 시간 범위가 더 좁습니다. 더 넓은 복구 시간 범위를 사용하려면 Messages가 실행되는 Mac에서 Gateway를 실행하십시오.

### 운영자에게 표시되는 신호

억제된 백로그는 기본 로그 수준으로 기록되며 자동으로 삭제되지 않습니다(`recovery` 플래그는 적용된 시간 범위를 표시함).

```text
imessage: 오래된 인바운드 백로그 억제됨 account=<id> sent=<iso> recovery=<bool> (시작 이후 <N>개 억제됨)
```

### 마이그레이션

`channels.imessage.catchup.*`은 더 이상 사용되지 않습니다. 중단 시간 복구는 자동으로 수행되며 새 설정에는 구성이 필요하지 않습니다. `catchup.enabled: true`이 포함된 기존 구성은 복구 재생 시간 범위를 위한 호환성 프로필로 계속 적용됩니다. 비활성화된 catchup 블록(`enabled: false` 또는 `enabled: true` 없음)은 폐기되며, `openclaw doctor --fix`이 이를 제거합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="imsg를 찾을 수 없거나 RPC가 지원되지 않음">
    바이너리와 RPC 지원 여부를 확인하십시오.

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    프로브에서 RPC가 지원되지 않는다고 보고되면 `imsg`을 업데이트하십시오. 비공개 API 작업을 사용할 수 없으면 로그인한 macOS 사용자 세션에서 `imsg launch`을 실행하고 다시 프로브하십시오. Gateway가 macOS에서 실행되고 있지 않으면 기본 로컬 `imsg` 경로 대신 위의 SSH를 통한 원격 Mac 설정을 사용하십시오.

  </Accordion>

  <Accordion title="메시지는 전송되지만 인바운드 iMessage가 도착하지 않음">
    먼저 메시지가 로컬 Mac에 도착했는지 확인하십시오. `chat.db`이 변경되지 않으면 `imsg status --json`에서 브리지가 정상이라고 보고하더라도 OpenClaw는 메시지를 수신할 수 없습니다.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    휴대전화에서 보낸 메시지로 새 행이 생성되지 않으면 OpenClaw 구성을 변경하기 전에 macOS Messages 및 Apple Push 계층을 복구하십시오. 일회성 서비스 새로 고침만으로 충분한 경우가 많습니다.

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    OpenClaw 세션을 디버깅하기 전에 휴대폰에서 새 iMessage를 보내고 새로운 `chat.db` 행 또는 `imsg watch` 이벤트가 발생하는지 확인하십시오. 이를 주기적으로 브리지를 다시 시작하는 루프로 실행하지 마십시오. 작업 중에 `imsg launch` 및 Gateway 재시작을 반복하면 전송이 중단되고 진행 중인 채널 실행이 고립될 수 있습니다.

  </Accordion>

  <Accordion title="macOS에서 Gateway가 실행되고 있지 않음">
    기본 `cliPath: "imsg"`은 Messages에 로그인된 Mac에서 실행되어야 합니다. Linux 또는 Windows에서는 `channels.imessage.cliPath`을 해당 Mac에 SSH로 접속하여 `imsg "$@"`을 실행하는 래퍼 스크립트로 설정하십시오.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    그런 다음 다음을 실행하십시오.

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM이 무시됨">
    다음을 확인하십시오.

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - 페어링 승인(`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="그룹 메시지가 무시됨">
    다음을 확인하십시오.

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 허용 목록 동작
    - 멘션 패턴 구성(`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="원격 첨부 파일 처리 실패">
    다음을 확인하십시오.

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway 호스트의 SSH/SCP 키 인증
    - Gateway 호스트의 `~/.ssh/known_hosts`에 호스트 키가 있는지 여부
    - Messages를 실행하는 Mac에서 원격 경로를 읽을 수 있는지 여부

  </Accordion>

  <Accordion title="macOS 권한 프롬프트를 놓침">
    동일한 사용자/세션 컨텍스트의 대화형 GUI 터미널에서 다시 실행하고 프롬프트를 승인하십시오.

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg`을 실행하는 프로세스 컨텍스트에 전체 디스크 접근 권한 및 자동화 권한이 부여되었는지 확인하십시오.

  </Accordion>
</AccordionGroup>

## 구성 참조 링크

- [구성 참조 - iMessage](/ko/gateway/config-channels#imessage)
- [Gateway 구성](/ko/gateway/configuration)
- [페어링](/ko/channels/pairing)

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [BlueBubbles 제거 및 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage) — 공지 및 마이그레이션 요약
- [BlueBubbles에서 이전하기](/ko/channels/imessage-from-bluebubbles) — 구성 변환 표 및 단계별 전환 절차
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 보안 강화
