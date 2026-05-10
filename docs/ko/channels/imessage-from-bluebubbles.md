---
read_when:
    - BlueBubbles에서 기본 제공 iMessage Plugin으로 이전 계획하기
    - BlueBubbles 구성 키를 iMessage 대응 항목으로 변환하기
    - iMessage Plugin을 활성화하기 전에 imsg 확인하기
summary: 페어링, 허용 목록 또는 그룹 바인딩을 잃지 않고 기존 BlueBubbles 구성을 번들된 iMessage Plugin으로 마이그레이션합니다.
title: BlueBubbles에서 전환하기
x-i18n:
    generated_at: "2026-05-10T19:21:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

번들로 제공되는 `imessage` Plugin은 이제 JSON-RPC를 통해 [`steipete/imsg`](https://github.com/steipete/imsg)를 구동하여 BlueBubbles와 동일한 비공개 API 표면(`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, 그룹 관리, 첨부 파일)에 접근합니다. 이미 `imsg`가 설치된 Mac을 실행 중이라면 BlueBubbles 서버를 제거하고 Plugin이 Messages.app과 직접 통신하게 할 수 있습니다.

BlueBubbles 지원은 제거되었습니다. OpenClaw는 `imsg`를 통해서만 iMessage를 지원합니다. 이 가이드는 기존 `channels.bluebubbles` 구성을 `channels.imessage`로 마이그레이션하기 위한 것이며, 다른 지원되는 마이그레이션 경로는 없습니다.

## 이 마이그레이션이 적합한 경우

- Messages.app에 로그인된 동일한 Mac(또는 SSH로 접근 가능한 Mac)에서 이미 `imsg`를 실행 중입니다.
- 별도의 BlueBubbles 서버, 인증할 REST 엔드포인트, Webhook 배관 없이 이동 부품을 하나 줄이고 싶습니다. 서버 + 클라이언트 앱 + 헬퍼 대신 단일 CLI 바이너리만 사용합니다.
- 비공개 API 프로브가 `available: true`를 보고하는 [지원되는 macOS / `imsg` 빌드](/ko/channels/imessage#requirements-and-permissions-macos)를 사용 중입니다.

## imsg가 하는 일

`imsg`는 Messages용 로컬 macOS CLI입니다. OpenClaw는 `imsg rpc`를 자식 프로세스로 시작하고 stdin/stdout을 통해 JSON-RPC로 통신합니다. 노출할 HTTP 서버, Webhook URL, 백그라운드 데몬, launch agent, 포트는 없습니다.

- 읽기는 읽기 전용 SQLite 핸들을 사용하여 `~/Library/Messages/chat.db`에서 가져옵니다.
- 실시간 수신 메시지는 `imsg watch` / `watch.subscribe`에서 가져오며, 이는 폴링 폴백과 함께 `chat.db` 파일 시스템 이벤트를 추적합니다.
- 전송은 일반 텍스트 및 파일 전송에 Messages.app 자동화를 사용합니다.
- 고급 동작은 `imsg launch`를 사용해 `imsg` 헬퍼를 Messages.app에 주입합니다. 이것이 읽음 확인, 입력 표시기, 리치 전송, 편집, 전송 취소, 스레드 답장, 탭백, 그룹 관리를 가능하게 합니다.
- Linux 빌드는 복사된 `chat.db`를 검사할 수 있지만 전송하거나, 실시간 Mac 데이터베이스를 감시하거나, Messages.app을 구동할 수는 없습니다. OpenClaw iMessage의 경우 로그인된 Mac에서 또는 해당 Mac으로의 SSH 래퍼를 통해 `imsg`를 실행하세요.

## 시작하기 전에

1. Messages.app을 실행하는 Mac에 `imsg`를 설치합니다.

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   `imsg chats`가 `unable to open database file`, 빈 출력 또는 `authorization denied`로 실패하면 `imsg`를 실행하는 터미널, 편집기, Node 프로세스, Gateway 서비스 또는 SSH 부모 프로세스에 전체 디스크 접근 권한을 부여한 뒤 해당 부모 프로세스를 다시 여세요.

2. OpenClaw 구성을 변경하기 전에 읽기, 감시, 전송, RPC 표면을 확인합니다.

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42`를 `imsg chats`의 실제 채팅 ID로 바꾸세요. 전송에는 Messages.app에 대한 자동화 권한이 필요합니다. OpenClaw가 SSH를 통해 실행될 예정이라면 OpenClaw가 사용할 동일한 SSH 래퍼 또는 사용자 컨텍스트에서 이 명령을 실행하세요.

3. 고급 동작이 필요할 때 비공개 API 브리지를 활성화합니다.

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch`에는 SIP가 비활성화되어 있어야 합니다. 기본 전송, 기록, 감시는 `imsg launch` 없이도 작동하지만 고급 동작은 작동하지 않습니다.

4. OpenClaw를 통해 브리지를 확인합니다.

   ```bash
   openclaw channels status --probe
   ```

   `imessage.privateApi.available: true`가 필요합니다. `false`를 보고하면 먼저 이를 수정하세요. [기능 감지](/ko/channels/imessage#private-api-actions)를 참조하세요.

5. 구성을 스냅샷합니다.

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 구성 변환

iMessage와 BlueBubbles는 많은 채널 수준 구성을 공유합니다. 변경되는 키는 대부분 전송 방식(REST 서버와 로컬 CLI의 차이)입니다. 동작 키(`dmPolicy`, `groupPolicy`, `allowFrom` 등)는 동일한 의미를 유지합니다.

| BlueBubbles                                                | 번들 iMessage                            | 참고                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 같은 의미 체계입니다.                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.serverUrl`                           | _(제거됨)_                               | REST 서버가 없습니다. Plugin이 stdio를 통해 `imsg rpc`를 생성합니다.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(제거됨)_                               | Webhook 인증이 필요 없습니다.                                                                                                                                                                                                                                                                                                                        |
| _(암시적)_                                                 | `channels.imessage.cliPath`               | `imsg` 경로입니다(기본값 `imsg`). SSH에는 래퍼 스크립트를 사용하세요.                                                                                                                                                                                                                                                                                 |
| _(암시적)_                                                 | `channels.imessage.dbPath`                | 선택적 Messages.app `chat.db` 재정의입니다. 생략하면 자동 감지됩니다.                                                                                                                                                                                                                                                                                |
| _(암시적)_                                                 | `channels.imessage.remoteHost`            | `host` 또는 `user@host`입니다. `cliPath`가 SSH 래퍼이고 SCP 첨부 파일 가져오기를 원할 때만 필요합니다.                                                                                                                                                                                                                                               |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 같은 값입니다(`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 페어링 승인은 토큰이 아니라 핸들 기준으로 이전됩니다.                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 같은 값입니다(`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 동일합니다.                                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **`groups: { "*": { ... } }` 와일드카드 항목을 포함해 이를 그대로 복사하세요.** 그룹별 `requireMention`, `tools`, `toolsBySender`가 이전됩니다. `groupPolicy: "allowlist"`에서 `groups` 블록이 비어 있거나 없으면 모든 그룹 메시지가 조용히 삭제됩니다. 아래의 "그룹 레지스트리 함정"을 참조하세요.                                               |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 기본값은 `true`입니다. 번들 Plugin에서는 비공개 API 프로브가 실행 중일 때만 동작합니다.                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 같은 형태이며, **동일하게 기본값은 꺼짐**입니다. BlueBubbles에서 첨부 파일이 전달되고 있었다면 iMessage 블록에서 이를 명시적으로 다시 설정해야 합니다. 암시적으로 이전되지 않으며, 그렇게 하기 전까지 수신 사진/미디어는 `Inbound message` 로그 줄 없이 조용히 삭제됩니다.                                                                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 로컬 루트입니다. 와일드카드 규칙은 동일합니다.                                                                                                                                                                                                                                                                                                      |
| _(해당 없음)_                                              | `channels.imessage.remoteAttachmentRoots` | `remoteHost`가 SCP 가져오기에 설정된 경우에만 사용됩니다.                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage의 기본값은 16 MB입니다(BlueBubbles 기본값은 8 MB였습니다). 더 낮은 상한을 유지하려면 명시적으로 설정하세요.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 둘 다 기본값은 4000입니다.                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 동일한 옵트인입니다. DM 전용입니다. 그룹 채팅은 두 채널 모두에서 메시지별 즉시 디스패치를 유지합니다. 명시적 `messages.inbound.byChannel.imessage` 없이 활성화하면 기본 수신 디바운스가 2500 ms로 늘어납니다. [iMessage 문서 § 분할 전송 DM 병합](/ko/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)을 참조하세요. |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(해당 없음)_                             | iMessage는 이미 `chat.db`에서 보낸 사람 표시 이름을 읽습니다.                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 작업별 토글: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                           |

다중 계정 설정(`channels.bluebubbles.accounts.*`)은 `channels.imessage.accounts.*`로 일대일 변환됩니다.

## 그룹 레지스트리 함정

번들 iMessage Plugin은 서로 다른 **두 개의** 그룹 허용 목록 게이트를 연속으로 실행합니다. 그룹 메시지가 에이전트에 도달하려면 둘 다 통과해야 합니다.

1. **보낸 사람 / 채팅 대상 허용 목록**(`channels.imessage.groupAllowFrom`) — `isAllowedIMessageSender`가 확인합니다. 수신 메시지를 보낸 사람 핸들, `chat_guid`, `chat_identifier`, 또는 `chat_id`로 매칭합니다. BlueBubbles와 같은 형태입니다.
2. **그룹 레지스트리**(`channels.imessage.groups`) — `inbound-processing.ts:199`의 `resolveChannelGroupPolicy`가 확인합니다. `groupPolicy: "allowlist"`에서는 이 게이트에 다음 중 하나가 필요합니다.
   - `groups: { "*": { ... } }` 와일드카드 항목(`allowAll = true` 설정), 또는
   - `groups` 아래의 명시적인 `chat_id`별 항목.

게이트 1은 통과하지만 게이트 2가 실패하면 메시지는 삭제됩니다. 이제 기본 로그 수준에서 조용히 지나가지 않도록 Plugin은 두 개의 `warn` 수준 신호를 내보냅니다.

- `groupPolicy: "allowlist"`가 설정되어 있지만 `channels.imessage.groups`가 비어 있을 때(`"*"` 와일드카드 없음, `chat_id`별 항목 없음), 메시지가 도착하기 전에 계정별로 한 번 발생하는 시작 시 `warn`.
- 특정 그룹이 런타임에 처음 삭제될 때 `chat_id`별로 한 번 발생하는 `warn`. chat_id와 이를 허용하기 위해 `groups`에 추가할 정확한 키를 명시합니다.

DM은 다른 코드 경로를 사용하므로 계속 작동합니다.

이는 가장 흔한 BlueBubbles → 번들 iMessage 마이그레이션 실패 모드입니다. 운영자가 `groupAllowFrom`과 `groupPolicy`는 복사하지만 `groups` 블록은 건너뜁니다. BlueBubbles의 `groups: { "*": { "requireMention": true } }`가 관련 없는 멘션 설정처럼 보이기 때문입니다. 실제로는 레지스트리 게이트에 필수입니다.

`groupPolicy: "allowlist"` 이후에도 그룹 메시지가 계속 흐르게 하기 위한 최소 설정:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`*` 아래의 `requireMention: true`는 멘션 패턴이 구성되어 있지 않으면 무해합니다. 런타임이 `canDetectMention = false`를 설정하고 `inbound-processing.ts:512`에서 멘션 드롭을 단락 처리합니다. 멘션 패턴(`agents.list[].groupChat.mentionPatterns`)이 구성되어 있으면 예상대로 작동합니다.

Gateway 로그에 `imessage: dropping group message from chat_id=<id>`가 찍히거나 시작 줄에 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`가 표시되면 게이트 2에서 드롭하고 있는 것입니다. `groups` 블록을 추가하세요.

## 단계별 안내

1. 기존 BlueBubbles 블록 옆에 iMessage 블록을 추가합니다. 새 경로가 검증될 때까지만 이전 블록을 복사 원본으로 유지하세요.

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **드라이런 프로브** — Gateway를 시작하고 iMessage가 정상 상태로 보고되는지 확인합니다.

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   `imessage.enabled`가 아직 `false`이므로 인바운드 iMessage 트래픽은 아직 라우팅되지 않습니다. 하지만 `--probe`가 브리지를 실행하므로 전환 전에 권한/설치 문제를 잡을 수 있습니다.

3. **전환합니다.** 한 번의 구성 편집으로 BlueBubbles 구성을 제거하고 iMessage를 활성화합니다.

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Gateway를 다시 시작합니다. 이제 인바운드 iMessage 트래픽이 번들된 Plugin을 통해 흐릅니다.

4. **DM을 검증합니다.** 에이전트에게 다이렉트 메시지를 보내고 응답이 도착하는지 확인합니다.

5. **그룹을 별도로 검증합니다.** DM과 그룹은 서로 다른 코드 경로를 사용합니다. DM 성공이 그룹 라우팅을 증명하지는 않습니다. 페어링된 그룹 채팅에서 에이전트에게 메시지를 보내고 응답이 도착하는지 확인합니다. 그룹이 조용해지면(에이전트 응답 없음, 오류 없음) Gateway 로그에서 `imessage: dropping group message from chat_id=<id>` 또는 시작 시 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 줄을 확인하세요. 둘 다 기본 로그 수준에서 발생합니다. 둘 중 하나가 표시되면 `groups` 블록이 없거나 비어 있는 것입니다. 위의 "그룹 레지스트리 함정"을 참고하세요.

6. **작업 표면을 검증합니다** — 페어링된 DM에서 에이전트에게 반응, 편집, 보내기 취소, 답장, 사진 전송을 요청하고, 그룹에서는 그룹 이름 변경 / 참가자 추가 또는 제거를 요청합니다. 각 작업은 Messages.app에 네이티브로 반영되어야 합니다. 어떤 작업이든 "iMessage `<action>` requires the imsg private API bridge"를 던지면 `imsg launch`를 다시 실행하고 `channels status --probe`를 새로 고칩니다.

7. iMessage DM, 그룹, 작업이 검증되면 **BlueBubbles 서버와 구성을 제거합니다**. OpenClaw는 `channels.bluebubbles`를 사용하지 않습니다.

## 작업 호환성 한눈에 보기

| 작업                                                       | 레거시 BlueBubbles                  | 번들된 iMessage                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 텍스트 전송 / SMS 폴백                                     | ✅                                  | ✅                                                                                                                      |
| 미디어 전송(사진, 비디오, 파일, 음성)                      | ✅                                  | ✅                                                                                                                      |
| 스레드 답장(`reply_to_guid`)                               | ✅                                  | ✅ ([#51892](https://github.com/openclaw/openclaw/issues/51892) 해결)                                                   |
| Tapback(`react`)                                           | ✅                                  | ✅                                                                                                                      |
| 편집 / 보내기 취소(macOS 13+ 수신자)                       | ✅                                  | ✅                                                                                                                      |
| 화면 효과와 함께 전송                                      | ✅                                  | ✅ ([#9394](https://github.com/openclaw/openclaw/issues/9394)의 일부 해결)                                             |
| 리치 텍스트 굵게 / 기울임 / 밑줄 / 취소선                  | ✅                                  | ✅ (attributedBody를 통한 typed-run 서식 지정)                                                                          |
| 그룹 이름 변경 / 그룹 아이콘 설정                          | ✅                                  | ✅                                                                                                                      |
| 참가자 추가 / 제거, 그룹 나가기                            | ✅                                  | ✅                                                                                                                      |
| 읽음 확인 및 입력 표시기                                   | ✅                                  | ✅ (private API 프로브로 게이트됨)                                                                                      |
| 동일 발신자 DM 병합                                        | ✅                                  | ✅ (DM 전용, `channels.imessage.coalesceSameSenderDms`를 통해 옵트인)                                                   |
| Gateway가 다운된 동안 수신된 인바운드 메시지 캐치업        | ✅ (Webhook 재생 + 기록 가져오기)   | ✅ (`channels.imessage.catchup.enabled`를 통해 옵트인, [#78649](https://github.com/openclaw/openclaw/issues/78649) 해결) |

이제 iMessage 캐치업은 번들된 Plugin에서 옵트인 기능으로 사용할 수 있습니다. Gateway 시작 시 `channels.imessage.catchup.enabled`가 `true`이면 Gateway는 `imsg watch`가 사용하는 동일한 JSON-RPC 클라이언트에 대해 `chats.list` 1회와 채팅별 `messages.history` 패스를 실행하고, 놓친 각 인바운드 행을 라이브 디스패치 경로(allowlist, 그룹 정책, 디바운서, 에코 캐시)를 통해 재생한 뒤 계정별 커서를 유지하여 이후 시작 시 중단된 지점부터 이어서 처리합니다. 튜닝은 [Gateway 다운타임 후 캐치업](/ko/channels/imessage#catching-up-after-gateway-downtime)을 참고하세요.

## 페어링, 세션 및 ACP 바인딩

- **페어링 승인**은 핸들 기준으로 이어집니다. 알려진 발신자를 다시 승인할 필요가 없습니다. `channels.imessage.allowFrom`은 BlueBubbles가 사용하던 동일한 `+15555550123` / `user@example.com` 문자열을 인식합니다.
- **세션**은 에이전트 + 채팅별로 범위가 유지됩니다. DM은 기본 `session.dmScope=main` 아래에서 에이전트 메인 세션으로 접히고, 그룹 세션은 `chat_id`별로 격리됩니다. 세션 키는 다릅니다(`agent:<id>:imessage:group:<chat_id>`와 BlueBubbles의 동등한 키). BlueBubbles 세션 키 아래의 이전 대화 기록은 iMessage 세션으로 이어지지 않습니다.
- `match.channel: "bluebubbles"`를 참조하는 **ACP 바인딩**은 `"imessage"`로 업데이트해야 합니다. `match.peer.id` 형태(`chat_id:`, `chat_guid:`, `chat_identifier:`, 원시 핸들)는 동일합니다.

## 롤백 채널 없음

다시 전환할 수 있는 지원되는 BlueBubbles 런타임은 없습니다. iMessage 검증에 실패하면 `channels.imessage.enabled: false`를 설정하고 Gateway를 다시 시작한 뒤, `imsg` 차단 요소를 수정하고 전환을 다시 시도하세요.

응답 캐시는 `~/.openclaw/state/imessage/reply-cache.jsonl`에 있습니다(모드 `0600`, 상위 디렉터리 `0700`). 깨끗한 상태에서 시작하려면 삭제해도 안전합니다.

## 관련 항목

- [iMessage](/ko/channels/imessage) — `imsg launch` 설정 및 기능 감지를 포함한 전체 iMessage 채널 참조.
- `/channels/bluebubbles` — 이 마이그레이션 가이드로 리디렉션되는 레거시 URL.
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름.
- [채널 라우팅](/ko/channels/channel-routing) — Gateway가 아웃바운드 응답용 채널을 선택하는 방식.
