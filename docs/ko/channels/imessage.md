---
read_when:
    - iMessage 지원 설정하기
    - iMessage 송수신 디버깅
summary: imsg(stdio를 통한 JSON-RPC)를 이용한 네이티브 iMessage 지원으로, 답장, 탭백, 효과, 투표, 첨부 파일 및 그룹 관리를 위한 비공개 API 작업을 제공합니다. 호스트 요구 사항이 충족되는 경우 새로운 OpenClaw iMessage 설정에 권장됩니다.
title: iMessage
x-i18n:
    generated_at: "2026-07-12T14:58:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 81819aad1a9199791c3c02eb0c9cc72059c663710140b33ba31f79b4bc59d8e2
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
일반적인 OpenClaw iMessage 배포에서는 로그인된 동일한 macOS 메시지 호스트에서 Gateway와 `imsg`를 실행하십시오. Gateway를 다른 위치에서 실행하는 경우 Mac에서 `imsg`를 실행하는 투명한 SSH 래퍼를 `channels.imessage.cliPath`로 지정하십시오.

**인바운드 복구는 자동으로 이루어집니다.** 브리지 또는 Gateway가 다시 시작되면 iMessage는 중단된 동안 놓친 메시지를 재생하고, 푸시 복구 후 Apple이 한꺼번에 보낼 수 있는 오래된 "백로그 폭탄"을 억제하며, 중복을 제거하여 어떤 메시지도 두 번 디스패치되지 않도록 합니다. 활성화할 설정은 없습니다. 자세한 내용은 [브리지 또는 Gateway 재시작 후 인바운드 복구](#inbound-recovery-after-a-bridge-or-gateway-restart)를 참조하십시오.
</Note>

<Warning>
BlueBubbles 지원은 제거되었습니다. `channels.bluebubbles` 구성을 `channels.imessage`로 마이그레이션하십시오. OpenClaw는 `imsg`를 통해서만 iMessage를 지원합니다. 간략한 공지는 [BlueBubbles 제거 및 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage)에서, 전체 마이그레이션 표는 [BlueBubbles에서 이전하기](/ko/channels/imessage-from-bluebubbles)에서 확인하십시오.
</Warning>

상태: 네이티브 외부 CLI 통합입니다. Gateway는 `imsg rpc`를 생성하고 stdio를 통해 JSON-RPC로 통신하므로 별도의 데몬이나 포트가 필요하지 않습니다. 완전한 iMessage 채널을 사용하려면 비공개 API 모드를 적극 권장합니다. 답장, 탭백, 효과, 투표, 첨부 파일 답장 및 그룹 작업에는 `imsg launch`와 성공적인 비공개 API 프로브가 필요합니다.

일반적인 로컬 설정에서는 OpenClaw 설정 과정에서 로그인된 메시지 Mac에 Homebrew를 사용하여 `imsg`를 설치하거나 업데이트할지 사용자에게 확인 후 제안할 수 있습니다. 수동 설정 및 SSH 래퍼 토폴로지는 계속 운영자가 관리합니다. Gateway 또는 래퍼를 실행할 동일한 사용자 컨텍스트에서 `imsg`를 설치하거나 업데이트하십시오.

<CardGroup cols={3}>
  <Card title="비공개 API 작업" icon="wand-sparkles" href="#private-api-actions">
    답장, 탭백, 효과, 투표, 첨부 파일 및 그룹 관리입니다.
  </Card>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    iMessage DM은 기본적으로 페어링 모드를 사용합니다.
  </Card>
  <Card title="원격 Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway가 메시지 Mac에서 실행되지 않는 경우 SSH 래퍼를 사용하십시오.
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

        로컬 설정 마법사가 기본 `imsg` 명령이 없음을 감지하면 Homebrew를 통해 `steipete/tap/imsg`를 설치할지 묻는 메시지를 표시할 수 있습니다. Homebrew에서 관리하는 `imsg`를 감지하면 재설치하거나 업데이트할지 묻는 메시지를 표시할 수 있습니다. 사용자 지정 `cliPath` 래퍼는 수정하지 않습니다.

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
    대부분의 설정에는 SSH가 필요하지 않습니다. Gateway를 로그인된 메시지 Mac에서 실행할 수 없는 경우에만 이 토폴로지를 사용하십시오. OpenClaw에는 stdio 호환 `cliPath`만 필요하므로, 원격 Mac에 SSH로 접속하여 `imsg`를 실행하는 래퍼 스크립트를 `cliPath`로 지정할 수 있습니다.
    Gateway 호스트가 아니라 해당 원격 Mac에 `imsg`를 설치하고 업데이트하십시오.

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    첨부 파일을 활성화한 경우 권장 구성은 다음과 같습니다.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCP 첨부 파일 가져오기에 사용
      includeAttachments: true,
      // 선택 사항: 추가로 허용할 첨부 파일 루트(기본값인
      // /Users/*/Library/Messages/Attachments와 병합됨).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost`가 설정되지 않은 경우 OpenClaw는 SSH 래퍼 스크립트를 파싱하여 자동 감지를 시도합니다.
    `remoteHost`는 `host` 또는 `user@host` 형식이어야 하며 공백이나 SSH 옵션을 포함할 수 없습니다. 안전하지 않은 값은 무시됩니다.
    OpenClaw는 SCP에 엄격한 호스트 키 검사를 사용하므로 릴레이 호스트 키가 이미 `~/.ssh/known_hosts`에 있어야 합니다.
    첨부 파일 경로는 허용된 루트(`attachmentRoots` / `remoteAttachmentRoots`)를 기준으로 검증됩니다.

<Warning>
`imsg` 앞에 배치하는 모든 `cliPath` 래퍼 또는 SSH 프록시는 수명이 긴 JSON-RPC를 위한 투명한 stdio 파이프처럼 동작해야 합니다. OpenClaw는 채널이 유지되는 동안 래퍼의 stdin/stdout을 통해 줄바꿈으로 프레이밍된 작은 JSON-RPC 메시지를 교환합니다.

- 바이트가 사용 가능해지는 **즉시** 각 stdin 청크/줄을 전달하십시오. EOF를 기다리지 마십시오.
- 반대 방향으로 각 stdout 청크/줄을 신속하게 전달하십시오.
- 줄바꿈을 보존하십시오.
- 작은 프레임을 기아 상태로 만들 수 있는 고정 크기 블로킹 읽기(`read(4096)`, `cat | buffer`, 기본 셸 `read`)를 피하십시오.
- stderr를 JSON-RPC stdout 스트림과 분리하십시오.

큰 블록이 채워질 때까지 stdin을 버퍼링하는 래퍼는 `imsg rpc` 자체가 정상이어도 iMessage 장애처럼 보이는 증상, 즉 `imsg rpc timeout (chats.list)` 또는 반복적인 채널 재시작을 일으킵니다. 위의 `ssh -T host imsg "$@"`는 `rpc` 및 `--db`와 같은 OpenClaw의 `cliPath` 인수를 전달하므로 안전합니다. `ssh host imsg | grep -v '^DEBUG'`와 같은 파이프라인은 안전하지 **않습니다**. 줄 단위 버퍼링 도구도 프레임을 보류할 수 있으므로 필터링이 반드시 필요하다면 모든 단계에서 `stdbuf -oL -eL`을 사용하십시오.
</Warning>

  </Tab>
</Tabs>

## 요구 사항 및 권한(macOS)

- `imsg`를 실행하는 Mac에서 메시지에 로그인되어 있어야 합니다.
- OpenClaw/`imsg`를 실행하는 프로세스 컨텍스트에는 전체 디스크 접근 권한이 필요합니다(메시지 DB 접근).
- Messages.app을 통해 메시지를 보내려면 자동화 권한이 필요합니다.
- 고급 작업(반응 / 편집 / 전송 취소 / 스레드 답장 / 효과 / 투표 / 그룹 작업)을 사용하려면 시스템 무결성 보호를 비활성화해야 합니다. [imsg 비공개 API 활성화](#enabling-the-imsg-private-api)를 참조하십시오. 기본 텍스트 및 미디어 송수신은 이를 비활성화하지 않아도 작동합니다.

<Tip>
권한은 프로세스 컨텍스트별로 부여됩니다. Gateway가 헤드리스(LaunchAgent/SSH)로 실행되는 경우 동일한 컨텍스트에서 일회성 대화형 명령을 실행하여 권한 요청을 트리거하십시오.

```bash
imsg chats --limit 1
# 또는
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH 래퍼 전송이 AppleEvents -1743 오류로 실패하는 경우">
  원격 SSH 설정은 채팅을 읽고 `channels status --probe`를 통과하며 인바운드 메시지를 처리할 수 있지만, 아웃바운드 전송은 여전히 AppleEvents 권한 부여 오류로 실패할 수 있습니다.

```text
Messages에 Apple 이벤트를 보낼 권한이 없습니다. (-1743)
```

로그인된 Mac 사용자의 TCC 데이터베이스 또는 System Settings > Privacy & Security > Automation을 확인하십시오. 자동화 항목이 `imsg` 또는 로컬 셸 프로세스가 아니라 `/usr/libexec/sshd-keygen-wrapper`에 대해 기록된 경우, macOS가 해당 SSH 서버 측 클라이언트에 사용할 수 있는 메시지 토글을 표시하지 않을 수 있습니다.

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

이 상태에서는 메시지 자동화가 필요한 프로세스 컨텍스트가 UI에서 권한을 부여할 수 있는 앱이 아니라 SSH 래퍼이므로, `tccutil reset AppleEvents`를 반복하거나 동일한 SSH 래퍼를 통해 `imsg send`를 다시 실행해도 계속 실패할 수 있습니다.

대신 지원되는 `imsg` 프로세스 컨텍스트 중 하나를 사용하십시오.

- Gateway 또는 적어도 `imsg` 브리지를 로그인된 메시지 사용자의 로컬 세션에서 실행하십시오.
- 동일한 세션에서 전체 디스크 접근 권한과 자동화 권한을 부여한 후 해당 사용자의 LaunchAgent로 Gateway를 시작하십시오.
- 2명의 사용자를 사용하는 SSH 토폴로지를 유지하는 경우 채널을 활성화하기 전에 정확히 동일한 래퍼를 통해 실제 아웃바운드 `imsg send`가 성공하는지 확인하십시오. 자동화 권한을 부여할 수 없다면 전송에 SSH 래퍼를 사용하는 대신 단일 사용자 `imsg` 설정으로 재구성하십시오.

</Accordion>

## imsg 비공개 API 활성화

`imsg`는 두 가지 작동 모드로 제공됩니다. OpenClaw에는 사용자가 기대하는 네이티브 iMessage 작업을 채널에 제공하는 비공개 API 모드가 권장 설정입니다. 기본 모드는 위험이 낮은 설치, 초기 확인 또는 SIP를 비활성화할 수 없는 호스트에 여전히 유용합니다.

- **기본 모드**(기본값, SIP 변경 불필요): `send`를 통한 아웃바운드 텍스트 및 미디어, 인바운드 감시/기록, 채팅 목록입니다. 위의 표준 macOS 권한을 설정하고 새로 `brew install steipete/tap/imsg`를 실행하면 바로 사용할 수 있는 기능입니다.
- **비공개 API 모드**: `imsg`가 내부 `IMCore` 함수를 호출하기 위해 `Messages.app`에 헬퍼 dylib를 삽입합니다. 이를 통해 `react`, `edit`, `unsend`, `reply`(스레드형), `sendWithEffect`, `poll` 및 `poll-vote`(네이티브 메시지 투표), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`뿐 아니라 입력 표시기와 읽음 확인도 사용할 수 있습니다.

이 페이지에서 권장하는 작업 표면에는 비공개 API 모드가 필요합니다. `imsg` README에는 요구 사항이 명확하게 명시되어 있습니다.

> `read`, `typing`, `launch`, 브리지 기반 리치 전송, 메시지 변경 및 채팅 관리와 같은 고급 기능은 선택적으로 사용합니다. 이러한 기능을 사용하려면 SIP를 비활성화하고 `Messages.app`에 헬퍼 dylib를 삽입해야 합니다. SIP가 활성화되어 있으면 `imsg launch`는 삽입을 거부합니다.

헬퍼 삽입 기법은 `imsg` 자체의 dylib를 사용하여 메시지 비공개 API에 접근합니다. OpenClaw iMessage 경로에는 타사 서버나 BlueBubbles 런타임이 없습니다.

<Warning>
**SIP 비활성화에는 실제 보안상의 상충 관계가 있습니다.** SIP는 수정된 시스템 코드의 실행을 방지하는 macOS의 핵심 보호 기능 중 하나입니다. 시스템 전체에서 이를 끄면 추가 공격 표면과 부작용이 발생합니다. 특히 **Apple Silicon Mac에서 SIP를 비활성화하면 Mac에 iOS 앱을 설치하고 실행하는 기능도 비활성화됩니다**.

특히 주로 사용하는 개인용 Mac에서는 이를 신중한 운영 결정으로 간주하십시오. 프로덕션 품질의 OpenClaw iMessage를 위해서는 브리지를 활성화해도 괜찮은 전용 Mac이나 봇 macOS 사용자를 사용하는 것이 좋습니다. 위협 모델상 어디에서도 SIP 비활성화를 허용할 수 없다면 번들 iMessage는 기본 모드로 제한됩니다. 즉, 텍스트 및 미디어 송수신만 가능하고 반응 / 편집 / 전송 취소 / 효과 / 그룹 작업은 사용할 수 없습니다.
</Warning>

### 설정

1. Messages.app을 실행하는 Mac에 **`imsg`를 설치하거나 업그레이드**하십시오.

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 출력은 `bridge_version`, `rpc_methods` 및 메서드별 `selectors`를 보고하므로 시작하기 전에 현재 빌드가 지원하는 기능을 확인할 수 있습니다.

2. **시스템 무결성 보호와 최신 macOS에서는 라이브러리 검증을 비활성화하십시오.** Apple이 서명한 `Messages.app`에 Apple 이외의 헬퍼 dylib를 삽입하려면 SIP를 끄고 **동시에** 라이브러리 검증을 완화해야 합니다. 복구 모드에서 수행하는 SIP 단계는 macOS 버전에 따라 다릅니다.
   - **macOS 10.13-10.15 (Sierra-Catalina):** 터미널을 통해 라이브러리 검증을 비활성화하고 복구 모드로 재부팅한 다음 `csrutil disable`을 실행하고 다시 시작하십시오.
   - **macOS 11+ (Big Sur 이상), Intel:** 복구 모드(또는 인터넷 복구)에서 `csrutil disable`을 실행하고 다시 시작하십시오.
   - **macOS 11+, Apple Silicon:** 전원 버튼 시작 절차를 사용하여 복구 모드로 진입합니다. 최신 macOS 버전에서는 Continue를 클릭할 때 **Left Shift** 키를 누른 상태로 유지한 다음 `csrutil disable`을 실행하십시오. 가상 머신 설정은 별도의 절차를 따르므로 먼저 VM 스냅샷을 생성하십시오.

   **macOS 11 이상에서는 일반적으로 `csrutil disable`만으로 충분하지 않습니다.** Apple은 여전히 플랫폼 바이너리인 `Messages.app`에 라이브러리 검증을 적용하므로, SIP가 꺼져 있어도 adhoc 서명된 헬퍼가 거부됩니다(`Library Validation failed: ... platform binary, but mapped file is not`). SIP를 비활성화한 후 라이브러리 검증도 비활성화하고 재부팅하십시오.

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26(Tahoe), 26.5.1에서 검증됨:** SIP 비활성화와 위의 `DisableLibraryValidation` 명령을 **함께** 사용하면 26.0부터 26.5.x까지 헬퍼를 삽입하기에 충분합니다. **boot-args는 필요하지 않습니다.** 이 plist가 결정적인 요소이며, Tahoe에서 삽입에 실패할 때 가장 흔히 누락되는 단계입니다.
   - **plist가 있는 경우:** `imsg launch`가 삽입에 성공하고 `imsg status`가 `advanced_features: true`를 보고합니다.
   - **plist가 없는 경우(SIP가 꺼져 있어도):** `imsg launch`가 `Failed to launch: Timeout waiting for Messages.app to initialize` 오류로 실패합니다. AMFI가 로드 시 adhoc 헬퍼를 거부하므로 브리지가 준비 상태가 되지 못하고 실행 시간이 초과됩니다. 이 시간 초과는 Tahoe에서 가장 흔히 발생하는 증상이며, 해결 방법은 더 과격한 조치가 아니라 위의 plist입니다.

   macOS 업그레이드 후 `imsg launch` 삽입 또는 특정 `selectors`가 false를 반환하기 시작한다면 일반적으로 이 게이트가 원인입니다. SIP 단계 자체가 실패했다고 판단하기 전에 SIP 및 라이브러리 검증 상태를 확인하십시오. 해당 설정이 올바른데도 브리지를 삽입할 수 없다면 시스템 전체의 추가 보안 제어를 약화하지 말고 `imsg status --json`과 `imsg launch` 출력을 수집하여 `imsg` 프로젝트에 보고하십시오.

3. **헬퍼를 삽입합니다.** SIP가 비활성화되어 있고 Messages.app에 로그인된 상태에서 다음을 실행하십시오.

   ```bash
   imsg launch
   ```

   SIP가 여전히 활성화되어 있으면 `imsg launch`가 삽입을 거부하므로, 이 명령은 2단계가 적용되었는지 확인하는 역할도 합니다.

4. **OpenClaw에서 브리지를 확인합니다.**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 항목은 `works`를 보고해야 하며, `imsg status --json | jq '{rpc_methods, selectors}'`는 사용 중인 macOS 빌드에서 노출하는 기능을 표시해야 합니다. 투표 생성에는 `selectors.pollPayloadMessage`가 필요하며, 투표 참여에는 `selectors.pollVoteMessage`와 `poll.vote` RPC 메서드가 모두 필요합니다. OpenClaw plugin은 캐시된 프로브가 지원하는 작업만 알리며, 캐시가 비어 있으면 낙관적인 상태를 유지하다가 첫 디스패치 시 프로브합니다.

`openclaw channels status --probe`가 채널을 `works`로 보고하지만 특정 작업이 디스패치 시 "iMessage `<action>` 작업에는 imsg 비공개 API 브리지가 필요합니다" 오류를 발생시키면 `imsg launch`를 다시 실행하십시오. Messages.app 재시작이나 OS 업데이트 등으로 헬퍼가 이탈할 수 있으며, 캐시된 `available: true` 상태는 다음 프로브에서 갱신될 때까지 계속 작업을 알립니다.

### SIP를 활성화된 상태로 유지하는 경우

위협 모델상 SIP를 비활성화할 수 없다면 다음과 같이 동작합니다.

- `imsg`는 기본 모드로 대체됩니다. 이 모드에서는 텍스트, 미디어, 수신만 지원합니다.
- OpenClaw plugin은 계속해서 텍스트/미디어 전송과 인바운드 모니터링을 알리지만, 메서드별 기능 게이트에 따라 작업 표면에서 `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, 그룹 작업을 숨깁니다.
- 기본 장치에서는 SIP를 활성화한 상태로 유지하면서, iMessage 워크로드용으로 SIP가 꺼진 별도의 비 Apple Silicon Mac 또는 전용 봇 Mac을 실행할 수 있습니다. 아래의 [전용 봇 macOS 사용자(별도의 iMessage ID)](#deployment-patterns)를 참조하십시오.

## 액세스 제어 및 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.imessage.dmPolicy`는 다이렉트 메시지를 제어합니다.

    - `pairing` (기본값)
    - `allowlist` (`allowFrom` 항목이 하나 이상 필요)
    - `open` (`allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    허용 목록 필드: `channels.imessage.allowFrom`.

    허용 목록 항목은 핸들 또는 정적 발신자 액세스 그룹(`accessGroup:<name>`)을 사용하여 발신자를 식별해야 합니다. `chat_id:*`, `chat_guid:*`, `chat_identifier:*`와 같은 채팅 대상에는 `channels.imessage.groupAllowFrom`을 사용하고, 숫자 `chat_id` 레지스트리 키에는 `channels.imessage.groups`를 사용하십시오.

  </Tab>

  <Tab title="그룹 정책 및 멘션">
    `channels.imessage.groupPolicy`는 그룹 처리를 제어합니다.

    - `allowlist` (기본값)
    - `open`
    - `disabled`

    그룹 발신자 허용 목록: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom` 항목은 정적 발신자 액세스 그룹(`accessGroup:<name>`)을 참조할 수도 있습니다.

    런타임 대체 동작: `groupAllowFrom`이 설정되지 않으면 iMessage 그룹 발신자 검사는 `allowFrom`을 사용합니다. DM과 그룹의 허용 기준이 달라야 한다면 `groupAllowFrom`을 설정하십시오. 명시적으로 비어 있는 `groupAllowFrom: []`는 대체 동작을 사용하지 않으며, `allowlist`에서 모든 그룹 발신자를 차단합니다.
    런타임 참고 사항: `channels.imessage`가 완전히 누락되면 런타임은 `groupPolicy="allowlist"`로 대체하고 경고를 기록합니다(`channels.defaults.groupPolicy`가 설정되어 있어도 동일합니다).

    <Warning>
    `groupPolicy: "allowlist"`에서 그룹 라우팅은 **두 개**의 게이트를 연속으로 실행합니다.

    1. **발신자 허용 목록** (`channels.imessage.groupAllowFrom`) — 핸들, `accessGroup:<name>`, `chat_guid`, `chat_identifier` 또는 `chat_id`입니다. 유효 목록이 비어 있으면(`groupAllowFrom`이 없고 `allowFrom` 대체 값도 없음) 모든 그룹 발신자를 차단합니다.
    2. **그룹 레지스트리** (`channels.imessage.groups`) — 맵에 항목이 생기면 적용됩니다. 채팅은 명시적인 `chat_id`별 항목 또는 `groups: { "*": { ... } }` 와일드카드와 일치해야 합니다. `groups`가 비어 있거나 누락되면 발신자 허용 목록만으로 허용 여부를 결정합니다.

    유효한 그룹 발신자 허용 목록이 구성되지 않으면 모든 그룹 메시지가 레지스트리 게이트에 도달하기 전에 폐기됩니다. 각 게이트는 기본 로그 수준에서 자체적인 `warn` 수준 신호를 생성하며 서로 다른 해결 방법을 안내합니다.

    - 시작 시 계정별로 한 번, 유효한 그룹 발신자 허용 목록이 비어 있을 때: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — `channels.imessage.groupAllowFrom` 또는 `allowFrom`을 설정하여 해결하십시오. `groups` 항목만 추가하면 게이트 1이 계속 모든 발신자를 차단합니다.
    - 런타임에 `chat_id`별로 한 번, 발신자가 게이트 1을 통과했지만 채워진 `groups` 레지스트리에 채팅이 없을 때: `imessage: dropping group message from chat_id=<id> ...` — 해당 `chat_id` 또는 `"*"`를 `channels.imessage.groups` 아래에 추가하여 해결하십시오.

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

    `groupAllowFrom`만 설정하면 해당 발신자를 모든 그룹에서 허용합니다. 허용할 채팅 범위를 지정하고 `requireMention`과 같은 채팅별 옵션을 설정하려면 `groups` 블록을 추가하십시오.
    </Warning>

    그룹의 멘션 게이트는 다음과 같이 동작합니다.

    - iMessage에는 기본 멘션 메타데이터가 없습니다.
    - 멘션 감지는 정규식 패턴을 사용합니다(`agents.list[].groupChat.mentionPatterns`, 대체 값 `messages.groupChat.mentionPatterns`).
    - 구성된 패턴이 없으면 멘션 게이트를 적용할 수 없습니다.
    - 승인된 발신자의 제어 명령은 멘션 게이트를 우회합니다.

    그룹별 `systemPrompt`:

    `channels.imessage.groups.*` 아래의 각 항목은 선택적 `systemPrompt` 문자열을 받을 수 있으며, 해당 그룹의 메시지를 처리하는 모든 턴에서 에이전트의 시스템 프롬프트에 삽입됩니다. 해석 방식은 `channels.whatsapp.groups`와 동일합니다.

    1. **그룹별 시스템 프롬프트** (`groups["<chat_id>"].systemPrompt`): 해당 그룹 항목이 맵에 존재하고 그 항목의 `systemPrompt` 키가 정의되어 있을 때 사용됩니다. `systemPrompt`가 빈 문자열(`""`)이면 와일드카드가 억제되며 해당 그룹에 시스템 프롬프트가 적용되지 않습니다.
    2. **그룹 와일드카드 시스템 프롬프트** (`groups["*"].systemPrompt`): 해당 그룹 항목이 맵에 전혀 없거나, 항목은 있지만 `systemPrompt` 키가 정의되지 않았을 때 사용됩니다.

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
              systemPrompt: "이 채팅은 온콜 교대 채팅입니다. 답변을 3문장 이내로 작성하십시오.",
            },
            "9907": {
              // 명시적 억제: 와일드카드 "영국식 철자를 사용하십시오."가 여기에 적용되지 않습니다.
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    그룹별 프롬프트는 그룹 메시지에만 적용되며 다이렉트 메시지는 영향을 받지 않습니다.

  </Tab>

  <Tab title="세션 및 결정적 응답">
    - DM은 다이렉트 라우팅을 사용하고, 그룹은 그룹 라우팅을 사용합니다.
    - 기본값인 `session.dmScope=main`에서는 iMessage DM이 에이전트 기본 세션으로 통합됩니다.
    - 그룹 세션은 격리됩니다(`agent:<agentId>:imessage:group:<chat_id>`).
    - 응답은 원래 채널/대상 메타데이터를 사용하여 iMessage로 다시 라우팅됩니다.

    그룹과 유사한 스레드 동작:

    일부 다중 참여자 iMessage 스레드는 `is_group=false`로 수신될 수 있습니다.
    해당 `chat_id`가 `channels.imessage.groups` 아래에 명시적으로 구성되어 있으면 OpenClaw는 이를 그룹 트래픽으로 처리합니다(그룹 게이트 및 그룹 세션 격리).

  </Tab>
</Tabs>

## ACP 대화 바인딩

iMessage 채팅을 ACP 세션에 바인딩할 수 있습니다.

빠른 운영자 흐름:

- DM 또는 허용된 그룹 채팅 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 이후 동일한 iMessage 대화의 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- `/new`와 `/reset`은 동일하게 바인딩된 ACP 세션을 그 자리에서 재설정합니다.
- `/acp close`는 ACP 세션을 닫고 바인딩을 제거합니다.

구성된 영구 바인딩은 `type: "acp"` 및 `match.channel: "imessage"`가 포함된 최상위 `bindings[]` 항목을 사용합니다.

`match.peer.id`에는 다음을 사용할 수 있습니다.

- `+15555550123` 또는 `user@example.com`과 같이 정규화된 DM 핸들
- `chat_id:<id>` (안정적인 그룹 바인딩에 권장)
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

공유 ACP 바인딩 동작은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하십시오.

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 봇 macOS 사용자(별도의 iMessage ID)">
    봇 트래픽을 개인 Messages 프로필과 격리하려면 전용 Apple ID와 macOS 사용자를 사용하십시오.

    일반적인 흐름:

    1. 전용 macOS 사용자를 생성하고 로그인합니다.
    2. 해당 사용자에서 봇 Apple ID로 Messages에 로그인합니다.
    3. 해당 사용자에 `imsg`를 설치합니다.
    4. OpenClaw가 해당 사용자 컨텍스트에서 `imsg`를 실행할 수 있도록 SSH 래퍼를 생성합니다.
    5. `channels.imessage.accounts.<id>.cliPath`와 `.dbPath`가 해당 사용자 프로필을 가리키도록 설정합니다.

    처음 실행할 때 해당 봇 사용자 세션에서 GUI 승인(Automation 및 Full Disk Access)이 필요할 수 있습니다.

  </Accordion>

  <Accordion title="Tailscale을 통한 원격 Mac(예)">
    일반적인 토폴로지:

    - Gateway는 Linux/VM에서 실행됩니다.
    - iMessage와 `imsg`는 tailnet에 있는 Mac에서 실행됩니다.
    - `cliPath` 래퍼는 SSH를 사용하여 `imsg`를 실행합니다.
    - `remoteHost`는 SCP 첨부 파일 가져오기를 활성화합니다.

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

    대화형 입력 없이 SSH와 SCP를 모두 사용할 수 있도록 SSH 키를 사용하십시오.
    먼저 호스트 키를 신뢰하도록 설정하여(예: `ssh bot@mac-mini.tailnet-1234.ts.net`) `known_hosts`가 채워지게 하십시오.

  </Accordion>

  <Accordion title="다중 계정 패턴">
    iMessage는 `channels.imessage.accounts` 아래에서 계정별 구성을 지원합니다.

    각 계정은 `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, 기록 설정, 첨부 파일 루트 허용 목록 등의 필드를 재정의할 수 있습니다.

  </Accordion>

  <Accordion title="다이렉트 메시지 기록">
    새 다이렉트 메시지 세션을 해당 대화의 최근 디코딩된 `imsg` 기록으로 초기화하려면 `channels.imessage.dmHistoryLimit`를 설정하십시오. 발신자별로 재정의하려면 `channels.imessage.dms["<sender>"].historyLimit`를 사용하며, 특정 발신자의 기록을 비활성화하려면 `0`을 지정하십시오.

    iMessage DM 기록은 필요할 때 `imsg`에서 가져옵니다. `dmHistoryLimit`를 설정하지 않으면 전역 DM 기록 초기화가 비활성화되지만, 발신자별 `channels.imessage.dms["<sender>"].historyLimit`에 양수를 지정하면 해당 발신자에 대해서는 기록 초기화가 계속 활성화됩니다.

  </Accordion>
</AccordionGroup>

## 미디어, 청크 분할 및 전송 대상

<AccordionGroup>
  <Accordion title="첨부 파일 및 미디어">
    - 수신 첨부 파일 처리는 **기본적으로 비활성화**되어 있습니다. 사진, 음성 메모, 동영상 및 기타 첨부 파일을 에이전트에 전달하려면 `channels.imessage.includeAttachments: true`를 설정하십시오. 비활성화된 경우 첨부 파일만 포함된 iMessage는 에이전트에 도달하기 전에 삭제되며 `Inbound message` 로그 줄이 전혀 생성되지 않을 수 있습니다.
    - `remoteHost`가 설정되어 있으면 SCP를 통해 원격 첨부 파일 경로에서 가져올 수 있습니다.
    - 첨부 파일 경로는 허용된 루트와 일치해야 합니다.
      - `channels.imessage.attachmentRoots`(로컬)
      - `channels.imessage.remoteAttachmentRoots`(원격 SCP 모드)
      - 구성된 루트는 기본 루트 패턴 `/Users/*/Library/Messages/Attachments`를 확장합니다(대체하지 않고 병합함).
    - SCP는 엄격한 호스트 키 검사(`StrictHostKeyChecking=yes`)를 사용합니다.
    - 발신 미디어 크기는 `channels.imessage.mediaMaxMb`를 사용합니다(기본값 16 MB).

  </Accordion>

  <Accordion title="발신 텍스트 및 청크 분할">
    - 텍스트 청크 제한: `channels.imessage.textChunkLimit`(기본값 4000)
    - 청크 모드: `channels.imessage.streaming.chunkMode`
      - `length`(기본값)
      - `newline`(문단을 우선하여 분할)
    - 발신 Markdown의 굵게/기울임꼴/밑줄/취소선은 네이티브 스타일 텍스트로 변환됩니다(macOS 15+ 수신자는 스타일이 적용된 형태로 표시되며, 이전 버전 수신자는 마커가 없는 일반 텍스트로 표시됩니다). Markdown 표는 채널의 Markdown 표 모드에 따라 변환됩니다.
    - `channels.imessage.sendTransport`(`auto`가 기본값이며, `bridge`, `applescript` 지원)는 `imsg`가 전송을 처리하는 방식을 선택합니다.

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

`imsg launch`가 실행 중이고 `openclaw channels status --probe`가 `privateApi.available: true`를 보고하면, 메시지 도구는 일반 텍스트 전송 외에도 iMessage 네이티브 작업을 사용할 수 있습니다.

모든 작업은 기본적으로 활성화되어 있습니다. 개별 작업을 끄려면 `channels.imessage.actions`를 사용하십시오.

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
    - **react**: iMessage 탭백을 추가하거나 제거합니다(`messageId`, `emoji`, `remove`). 지원되는 탭백은 사랑, 좋아요, 싫어요, 웃음, 강조 및 질문에 매핑됩니다. 이모지 없이 제거하면 설정된 탭백이 무엇이든 해제됩니다.
    - **reply**: 기존 메시지에 스레드 답장을 보냅니다(`messageId`, `text` 또는 `message`, 그리고 `chatGuid`, `chatId`, `chatIdentifier` 또는 `to`). 첨부 파일을 포함한 답장에는 `send-rich`에서 `--file`을 지원하는 `imsg` 빌드도 필요합니다.
    - **sendWithEffect**: iMessage 효과와 함께 텍스트를 보냅니다(`text` 또는 `message`, `effect` 또는 `effectId`). 짧은 이름: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: 지원되는 macOS/비공개 API 버전에서 전송된 메시지를 편집합니다(`messageId`, `text` 또는 `newText`). Gateway 자체가 보낸 메시지만 편집할 수 있습니다.
    - **unsend**: 지원되는 macOS/비공개 API 버전에서 전송된 메시지를 회수합니다(`messageId`). Gateway 자체가 보낸 메시지만 전송을 취소할 수 있습니다.
    - **upload-file**: 미디어/파일을 보냅니다(`buffer`는 base64 형식 또는 준비된 `media`/`path`/`filePath`, `filename`, 선택 사항인 `asVoice`). 레거시 별칭: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: 현재 대상이 그룹 대화일 때 그룹 채팅을 관리합니다. 이러한 작업은 호스트의 Messages ID를 변경하므로 소유자 발신자 또는 `operator.admin` Gateway 클라이언트가 필요합니다.
    - **poll**: 네이티브 Apple Messages 투표를 생성합니다(`pollQuestion`, 2~12회 반복되는 `pollOption`, 그리고 `chatGuid`, `chatId`, `chatIdentifier` 또는 `to`). iOS/iPadOS/macOS 26+ 수신자는 네이티브 방식으로 확인하고 투표할 수 있으며, 이전 OS 버전에서는 "투표를 보냈습니다"라는 텍스트 대체 메시지를 받습니다. `selectors.pollPayloadMessage`가 필요합니다.
    - **poll-vote**: 기존 투표에 참여합니다(`pollId` 또는 `messageId`, 그리고 `pollOptionIndex`, `pollOptionId`, `pollOptionText` 중 정확히 하나). `selectors.pollVoteMessage` 및 `poll.vote` RPC 메서드가 필요합니다.

    수락된 수신 투표는 에이전트가 확인할 수 있도록 질문, 번호가 지정된 선택지 레이블, 득표수 및 `poll-vote`에 필요한 투표 메시지 ID와 함께 렌더링됩니다.

  </Accordion>

  <Accordion title="메시지 ID">
    수신 iMessage 컨텍스트에는 사용 가능한 경우 짧은 `MessageSid` 값과 전체 메시지 GUID(`MessageSidFull`)가 모두 포함됩니다. 짧은 ID는 최근 SQLite 기반 답장 캐시 범위에 한정되며 사용 전에 현재 채팅과 대조됩니다. 짧은 ID가 만료되었거나 다른 채팅에 속하는 경우 전체 `MessageSidFull`로 다시 시도하십시오.

  </Accordion>

  <Accordion title="기능 감지">
    OpenClaw는 캐시된 프로브 상태가 브리지를 사용할 수 없다고 나타낼 때만 비공개 API 작업을 숨깁니다. 상태를 알 수 없는 경우 작업은 계속 표시되며 디스패치 시 지연 방식으로 프로브하므로, 별도로 상태를 수동 새로 고침하지 않아도 `imsg launch` 후 첫 번째 작업이 성공할 수 있습니다.

  </Accordion>

  <Accordion title="읽음 확인 및 입력 중 표시">
    비공개 API 브리지가 실행 중이면 수락된 수신 채팅은 읽음으로 표시되고, 다이렉트 채팅에서는 턴이 수락되는 즉시 에이전트가 컨텍스트를 준비하고 응답을 생성하는 동안 입력 중 말풍선이 표시됩니다. 읽음 표시를 비활성화하려면 다음과 같이 설정하십시오.

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    메서드별 기능 목록보다 오래된 `imsg` 빌드에서는 입력 중 표시/읽음 기능이 별도 알림 없이 차단됩니다. OpenClaw는 누락된 읽음 확인의 원인을 파악할 수 있도록 재시작할 때마다 한 번 경고를 기록합니다.

  </Accordion>

  <Accordion title="수신 탭백">
    OpenClaw는 iMessage 탭백을 구독하고 수락된 반응을 일반 메시지 텍스트가 아닌 시스템 이벤트로 라우팅하므로, 사용자의 탭백은 일반적인 답장 루프를 트리거하지 않습니다.

    알림 모드는 `channels.imessage.reactionNotifications`로 제어합니다.

    - `"own"`(기본값): 사용자가 봇이 작성한 메시지에 반응할 때만 알립니다.
    - `"all"`: 승인된 발신자의 모든 수신 탭백을 알립니다.
    - `"off"`: 수신 탭백을 무시합니다.

    계정별 재정의에는 `channels.imessage.accounts.<id>.reactionNotifications`를 사용합니다.

  </Accordion>

  <Accordion title="승인 반응(👍 / 👎)">
    `approvals.exec.enabled` 또는 `approvals.plugin.enabled`가 true이고 요청이 iMessage로 라우팅되면 Gateway는 승인 프롬프트를 네이티브 방식으로 전달하고 탭백을 받아 이를 처리합니다.

    - `👍`(좋아요 탭백) → `allow-once`
    - `👎`(싫어요 탭백) → `deny`
    - `allow-always`는 계속 수동 대체 수단으로 사용됩니다. 일반 답장으로 `/approve <id> allow-always`를 보내십시오.

    반응 처리에는 반응한 사용자의 핸들이 명시적 승인자로 등록되어 있어야 합니다. 승인자 목록은 `channels.imessage.allowFrom`(또는 `channels.imessage.accounts.<id>.allowFrom`)에서 읽습니다. 사용자의 전화번호를 E.164 형식으로 추가하거나 Apple ID 이메일을 추가하십시오(`chat_id:*`와 같은 채팅 대상은 유효한 승인자 항목이 아닙니다). 와일드카드 항목 `"*"`도 적용되지만 모든 발신자에게 승인 권한을 부여합니다. 승인자 목록이 비어 있으면 반응 바로 가기가 완전히 비활성화됩니다. 반응 바로 가기는 의도적으로 `reactionNotifications`, `dmPolicy`, `groupAllowFrom`을 우회합니다. 승인을 처리할 때 중요한 유일한 게이트는 명시적 승인자 허용 목록이기 때문입니다.

    `/approve` 텍스트 명령 인증도 동일한 목록을 따릅니다. `channels.imessage.allowFrom`이 비어 있지 않으면 `/approve <id> <decision>`은 더 광범위한 DM 허용 목록이 아닌 해당 승인자 목록을 기준으로 인증되며, DM 허용 목록에는 있지만 `allowFrom`에는 없는 발신자는 명시적으로 거부됩니다. `allowFrom`이 비어 있으면 동일 채팅 대체 동작이 유지되고 `/approve`는 DM 허용 목록에서 허용하는 모든 사용자를 인증합니다. `/approve` 또는 반응을 통해 승인해야 하는 모든 운영자를 `allowFrom`에 추가하십시오.

    운영자 참고 사항:
    - 반응 바인딩은 메모리와 Gateway의 영구 키 저장소에 모두 저장되며(TTL은 승인 만료 시간과 일치함), Gateway는 보류 중인 프롬프트의 탭백도 폴링합니다. 따라서 Gateway가 재시작된 직후 도착한 탭백도 승인을 처리할 수 있습니다.
    - 해당 핸들이 명시적 승인자인 경우 운영자 자신의 `is_from_me=true` 탭백(예: 페어링된 Apple 기기에서 보낸 탭백)으로 승인을 처리할 수 있습니다.
    - 명시적 승인자가 구성된 경우에만 승인 프롬프트가 그룹 대화로 라우팅됩니다. 그렇지 않으면 모든 그룹 구성원이 승인할 수 있기 때문입니다.
    - 레거시 텍스트 형식 탭백(매우 오래된 Apple 클라이언트의 `Liked "…"` 일반 텍스트)은 메시지 GUID가 없으므로 승인을 처리할 수 없습니다. 반응을 통한 처리에는 최신 macOS/iOS 클라이언트가 내보내는 구조화된 탭백 메타데이터가 필요합니다.

  </Accordion>
</AccordionGroup>

## 구성 쓰기

iMessage는 기본적으로 채널에서 시작하는 구성 쓰기를 허용합니다(`commands.config: true`일 때 `/config set|unset`에 사용).

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

## 분할 전송된 DM 병합(한 번의 작성에 명령 + URL 포함)

사용자가 명령과 URL을 함께 입력하면(예: `Dump https://example.com/article`) Apple의 Messages 앱은 전송 내용을 **서로 다른 두 개의 `chat.db` 행**으로 분할합니다.

1. 텍스트 메시지(`"Dump"`).
2. OG 미리 보기 이미지를 첨부 파일로 포함하는 URL 미리 보기 말풍선(`"https://..."`).

대부분의 설정에서 두 행은 약 0.8~2.0초 간격으로 OpenClaw에 도착합니다. 병합하지 않으면 에이전트는 턴 1에서 명령만 받고(URL이 턴 2에 도착하기 전에 흔히 "URL을 보내 주세요"라고 답함) URL은 턴 2에서 받습니다. 이는 Apple의 전송 파이프라인 동작이며 OpenClaw나 `imsg`가 만드는 것이 아닙니다.

`channels.imessage.coalesceSameSenderDms`는 DM에서 동일 발신자가 연속으로 보낸 행을 버퍼링하도록 설정합니다. 소스 행 중 하나에서 `imsg`가 구조적 URL 미리보기 마커인 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"`를 노출하면 OpenClaw는 실제로 분할 전송된 해당 항목만 병합하고, 버퍼링된 다른 행은 별도의 턴으로 유지합니다. balloon 메타데이터를 전혀 내보내지 않는 이전 `imsg` 빌드에서는 OpenClaw가 분할 전송과 개별 전송을 구분할 수 없으므로 버킷 병합으로 대체합니다. 이렇게 하면 `Dump <url>` 분할 전송이 두 턴으로 퇴행하지 않고 메타데이터 도입 이전의 동작이 유지됩니다. 그룹 채팅은 여러 사용자의 턴 구조를 보존할 수 있도록 계속 메시지별로 디스패치합니다.

<Tabs>
  <Tab title="활성화해야 하는 경우">
    다음 경우에 활성화하십시오.

    - 하나의 메시지에 `command + payload`가 포함될 것으로 예상하는 Skills(dump, paste, save, queue 등)를 배포하는 경우
    - 사용자가 명령과 함께 URL을 붙여 넣는 경우
    - 추가되는 DM 턴 지연 시간(아래 참조)을 허용할 수 있는 경우

    다음 경우에는 비활성화된 상태로 두십시오.

    - 한 단어로 된 DM 트리거에 최소 명령 지연 시간이 필요한 경우
    - 모든 흐름이 후속 페이로드 없이 한 번에 끝나는 명령인 경우

  </Tab>
  <Tab title="활성화">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // 활성화 선택(기본값: false)
        },
      },
    }
    ```

    플래그가 켜져 있고 `messages.inbound.byChannel.imessage` 또는 전역 `messages.inbound.debounceMs`가 명시되지 않은 경우 디바운스 시간 범위가 **7000 ms**로 늘어납니다(레거시 기본값은 0 ms이며 디바운싱하지 않습니다). Messages.app이 미리보기 행을 내보내는 동안 Apple의 URL 미리보기 분할 전송 간격이 수 초까지 늘어날 수 있으므로 더 넓은 시간 범위가 필요합니다.

    시간 범위를 직접 조정하려면 다음과 같이 설정하십시오.

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms는 관찰된 Messages.app URL 미리보기 지연을 포괄합니다.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="절충점">
    - **정확한 병합에는 최신 `imsg` 페이로드 메타데이터가 필요합니다.** `balloon_bundle_id`가 있으면 실제 분할 전송만 병합됩니다. 위에서 설명한 메타데이터가 없는 경우의 대체 병합은 임시 하위 호환 동작이며, `imsg`가 업스트림에서 분할 전송을 병합하게 되면 제거됩니다.
    - **DM 메시지에 지연 시간이 추가됩니다.** 플래그가 켜져 있으면 독립적인 제어 명령과 단일 텍스트 후속 메시지를 포함한 모든 DM은 URL 미리보기 행이 도착할 가능성에 대비해 디스패치되기 전에 디바운스 시간 범위까지 대기합니다. 그룹 채팅 메시지는 즉시 디스패치됩니다.
    - **병합된 출력에는 상한이 있습니다.** 병합된 텍스트는 명시적인 `…[truncated]` 마커와 함께 4000자로 제한되고, 첨부 파일은 20개, 소스 항목은 10개로 제한됩니다(이를 초과하면 첫 항목과 최신 항목을 유지합니다). 다운스트림 텔레메트리를 위해 모든 소스 GUID가 `coalescedMessageGuids`에서 추적됩니다.
    - **DM 전용입니다.** 여러 사람이 입력할 때 봇의 응답성을 유지할 수 있도록 그룹 채팅은 메시지별 디스패치로 처리됩니다.
    - **채널별 선택 사항입니다.** 다른 채널(Discord, Slack, Telegram, WhatsApp 등)은 영향을 받지 않습니다. `channels.bluebubbles.coalesceSameSenderDms`를 설정한 레거시 BlueBubbles 구성은 해당 값을 `channels.imessage.coalesceSameSenderDms`로 마이그레이션해야 합니다.

  </Tab>
</Tabs>

### 시나리오 및 에이전트에 표시되는 내용

"플래그 켜짐" 열은 `balloon_bundle_id`를 내보내는 `imsg` 빌드에서의 동작을 보여 줍니다. balloon 메타데이터를 전혀 내보내지 않는 이전 `imsg` 빌드에서는 아래에서 "두 턴"/"N개 턴"으로 표시된 행이 대신 레거시 병합(한 턴)으로 대체됩니다. OpenClaw가 구조적으로 분할 전송과 개별 전송을 구분할 수 없으므로 메타데이터 도입 이전의 병합 동작을 유지합니다. 빌드가 balloon 메타데이터를 내보내기 시작하면 정확한 분리가 활성화됩니다.

| 사용자가 작성하는 내용                                              | `chat.db`에서 생성되는 내용            | 플래그 꺼짐(기본값)                      | 플래그 켜짐 + 시간 범위(imsg가 balloon 메타데이터를 내보냄)                                    |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`(한 번 전송)                              | 약 1초 간격의 행 2개                   | 에이전트 턴 2개: "Dump"만 먼저, 이후 URL | 한 턴: 병합된 텍스트 `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption`(첨부 파일 + 텍스트)                | URL balloon 메타데이터가 없는 행 2개 | 두 턴                               | 메타데이터가 관찰된 후에는 두 턴, 이전/래치 전 메타데이터 없는 세션에서는 병합된 한 턴       |
| `/status`(독립 실행 명령)                                     | 행 1개                               | 즉시 디스패치                        | **시간 범위까지 대기한 후 디스패치**                                                                |
| URL만 붙여 넣음                                                   | 행 1개                               | 즉시 디스패치                        | 시간 범위까지 대기한 후 디스패치                                                                    |
| 텍스트와 URL을 몇 분 간격으로 의도적으로 별도 메시지 2개로 전송 | 시간 범위 밖의 행 2개               | 두 턴                               | 두 턴(두 메시지 사이에 시간 범위 만료)                                                             |
| 빠른 연속 전송(시간 범위 내 작은 DM 10개 초과)                          | URL balloon 메타데이터가 없는 N개 행 | N개 턴                                 | 메타데이터가 관찰된 후에는 N개 턴, 이전/래치 전 메타데이터 없는 세션에서는 상한이 적용된 병합 한 턴 |
| 그룹 채팅에서 두 사람이 입력                                  | M명의 발신자가 보낸 N개 행               | M개 이상의 턴(발신자 버킷당 하나)        | M개 이상의 턴 — 그룹 채팅은 병합되지 않음                                                            |

## 브리지 또는 Gateway 재시작 후 인바운드 복구

iMessage는 Gateway가 중단된 동안 누락된 메시지를 복구하는 동시에 Push 복구 후 Apple이 한꺼번에 내보낼 수 있는 오래된 "백로그 폭탄"을 억제합니다. 기본 동작은 항상 켜져 있으며 인바운드 중복 제거를 기반으로 합니다.

- **재생 중복 제거.** 디스패치된 모든 인바운드 메시지는 Apple GUID를 기준으로 영구 Plugin 상태(`imessage.inbound-dedupe`)에 기록되고, 수집 시점에 선점된 후 처리 완료 시 커밋됩니다. 일시적인 실패 시에는 재시도할 수 있도록 해제됩니다. 이미 처리된 항목은 두 번 디스패치되지 않고 삭제됩니다. 이를 통해 메시지별 기록 없이도 복구 재생을 적극적으로 수행할 수 있습니다.
- **중단 시간 복구.** 시작 시 모니터는 마지막으로 디스패치된 `chat.db` rowid(계정별 영구 커서)를 기억하고 이를 `since_rowid`로 `imsg watch.subscribe`에 전달합니다. 따라서 imsg는 Gateway가 중단된 동안 도착한 행을 재생한 다음 실시간으로 추적합니다. 재생은 최근 500개 행과 최대 약 2시간 전의 메시지로 제한되며, 중복 제거 기능은 이미 처리된 항목을 삭제합니다.
- **오래된 백로그 기간 제한.** 시작 경계보다 위에 있는 행은 실제 실시간 행입니다. 전송 날짜가 도착 시각보다 약 15분 이상 오래된 행은 Push가 한꺼번에 내보낸 백로그로 간주되어 억제됩니다. 재생된 행(경계 이하)은 대신 더 넓은 복구 시간 범위를 사용하므로 최근 누락된 메시지는 전달되고 오래된 기록은 전달되지 않습니다.

`since_rowid` 재생은 동일한 `imsg` RPC 연결을 통해 실행되므로 복구는 로컬 및 원격 `cliPath` 설정 모두에서 작동합니다. 차이점은 시간 범위입니다. Gateway가 `chat.db`를 읽을 수 있는 로컬 환경에서는 시작 rowid 경계를 기준으로 삼아 재생 범위를 제한하고 최대 약 두 시간 전에 누락된 메시지를 전달합니다. 원격 SSH `cliPath`에서는 데이터베이스를 읽을 수 없으므로 재생 범위에 상한이 없고 모든 행에 실시간 기간 제한이 적용됩니다. 이 경우에도 최근 누락된 메시지를 복구하고 오래된 백로그를 억제하지만 더 좁은 실시간 시간 범위가 사용됩니다. 더 넓은 복구 시간 범위를 사용하려면 Messages가 실행되는 Mac에서 Gateway를 실행하십시오.

### 운영자에게 표시되는 신호

억제된 백로그는 기본 로그 수준에서 기록되며 절대로 조용히 삭제되지 않습니다(`recovery` 플래그는 어떤 시간 범위가 적용되었는지 보여 줍니다).

```text
imessage: 오래된 인바운드 백로그 억제됨 account=<id> sent=<iso> recovery=<bool> (시작 이후 <N>개 억제됨)
```

### 마이그레이션

`channels.imessage.catchup.*`는 더 이상 사용되지 않습니다. 중단 시간 복구는 자동으로 수행되며 새 설정에는 구성이 필요하지 않습니다. `catchup.enabled: true`가 포함된 기존 구성은 복구 재생 시간 범위를 위한 호환성 프로필로 계속 적용됩니다. 비활성화된 catchup 블록(`enabled: false` 또는 `enabled: true` 없음)은 폐기되며 `openclaw doctor --fix`가 이를 제거합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="imsg를 찾을 수 없거나 RPC가 지원되지 않음">
    바이너리와 RPC 지원 여부를 검증하십시오.

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    프로브가 RPC 미지원으로 보고하면 `imsg`를 업데이트하십시오. 비공개 API 작업을 사용할 수 없으면 로그인한 macOS 사용자 세션에서 `imsg launch`를 실행한 후 다시 프로브하십시오. Gateway가 macOS에서 실행되고 있지 않다면 기본 로컬 `imsg` 경로 대신 위의 SSH를 통한 원격 Mac 설정을 사용하십시오.

  </Accordion>

  <Accordion title="메시지를 보낼 수 있지만 인바운드 iMessage가 도착하지 않음">
    먼저 메시지가 로컬 Mac에 도달했는지 확인하십시오. `chat.db`가 변경되지 않으면 `imsg status --json`이 정상적인 브리지를 보고하더라도 OpenClaw는 메시지를 수신할 수 없습니다.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    휴대폰에서 전송한 메시지가 새 행을 생성하지 않는다면 OpenClaw 구성을 변경하기 전에 macOS Messages 및 Apple Push 계층을 복구하십시오. 일회성 서비스 새로 고침만으로 해결되는 경우가 많습니다.

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    휴대폰에서 새 iMessage를 전송하고 새 `chat.db` 행 또는 `imsg watch` 이벤트를 확인한 후 OpenClaw 세션을 디버깅하십시오. 이를 주기적인 브리지 재실행 루프로 실행하지 마십시오. 작업 중에 `imsg launch`와 Gateway 재시작을 반복하면 전달이 중단되고 진행 중인 채널 실행이 고립될 수 있습니다.

  </Accordion>

  <Accordion title="Gateway가 macOS에서 실행되고 있지 않음">
    기본 `cliPath: "imsg"`는 Messages에 로그인된 Mac에서 실행해야 합니다. Linux 또는 Windows에서는 해당 Mac에 SSH로 접속하여 `imsg "$@"`를 실행하는 래퍼 스크립트로 `channels.imessage.cliPath`를 설정하십시오.

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
    - Gateway 호스트에서 사용하는 SSH/SCP 키 인증
    - Gateway 호스트의 `~/.ssh/known_hosts`에 호스트 키가 존재하는지 여부
    - Messages가 실행되는 Mac에서 원격 경로를 읽을 수 있는지 여부

  </Accordion>

  <Accordion title="macOS 권한 프롬프트를 놓침">
    동일한 사용자/세션 컨텍스트의 대화형 GUI 터미널에서 다시 실행하고 프롬프트를 승인하십시오.

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg`를 실행하는 프로세스 컨텍스트에 전체 디스크 접근 권한과 자동화 권한이 부여되었는지 확인하십시오.

  </Accordion>
</AccordionGroup>

## 구성 참조 링크

- [구성 참조 - iMessage](/ko/gateway/config-channels#imessage)
- [Gateway 구성](/ko/gateway/configuration)
- [페어링](/ko/channels/pairing)

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [BlueBubbles 제거 및 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage) — 공지 및 마이그레이션 요약
- [BlueBubbles에서 전환하기](/ko/channels/imessage-from-bluebubbles) — 구성 변환 표 및 단계별 전환 절차
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 보안 강화
