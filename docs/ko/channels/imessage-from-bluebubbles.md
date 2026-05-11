---
read_when:
    - BlueBubbles에서 번들로 제공되는 iMessage Plugin으로 이전 계획하기
    - BlueBubbles 구성 키를 iMessage 대응 항목으로 변환하기
    - iMessage Plugin을 활성화하기 전에 imsg 확인하기
summary: 기존 BlueBubbles 구성을 번들된 iMessage Plugin으로 마이그레이션하면서 페어링, 허용 목록 또는 그룹 바인딩을 잃지 않습니다.
title: BlueBubbles에서 전환하기
x-i18n:
    generated_at: "2026-05-11T20:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

번들로 제공되는 `imessage` Plugin은 이제 JSON-RPC를 통해 [`steipete/imsg`](https://github.com/steipete/imsg)를 구동하여 BlueBubbles와 같은 비공개 API 표면(`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, 그룹 관리, 첨부 파일)에 도달합니다. 이미 `imsg`가 설치된 Mac을 실행 중이라면 BlueBubbles 서버를 제거하고 Plugin이 Messages.app과 직접 통신하도록 할 수 있습니다.

BlueBubbles 지원은 제거되었습니다. OpenClaw는 `imsg`를 통해서만 iMessage를 지원합니다. 이 가이드는 기존 `channels.bluebubbles` 구성을 `channels.imessage`로 마이그레이션하기 위한 것입니다. 다른 지원되는 마이그레이션 경로는 없습니다.

<Note>
짧은 발표와 운영자 요약은 [BlueBubbles 제거 및 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage)를 참조하세요.
</Note>

## 마이그레이션 체크리스트

기존 BlueBubbles 구성을 이미 알고 있고 가장 짧고 안전한 경로를 원할 때 이 체크리스트를 사용하세요.

1. Messages.app을 실행하는 Mac에서 `imsg`를 직접 확인합니다(`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. 동작 키를 `channels.bluebubbles`에서 `channels.imessage`로 복사합니다: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms`, `actions`.
3. 더 이상 존재하지 않는 전송 키를 제거합니다: `serverUrl`, `password`, Webhook URL, BlueBubbles 서버 설정.
4. Gateway가 Messages Mac에서 실행 중이 아니라면 `channels.imessage.cliPath`를 SSH 래퍼로 설정하고 원격 첨부 파일 가져오기를 위해 `remoteHost`를 설정합니다.
5. Gateway를 중지한 상태에서 `channels.imessage`를 활성화한 다음 `openclaw channels status --probe --channel imessage`를 실행합니다.
6. DM 하나, 허용된 그룹 하나, 활성화한 경우 첨부 파일, 그리고 에이전트가 사용할 것으로 예상하는 모든 비공개 API 작업을 테스트합니다.
7. iMessage 경로가 검증된 후 BlueBubbles 서버와 기존 `channels.bluebubbles` 구성을 삭제합니다.

## 이 마이그레이션이 적합한 경우

- Messages.app에 로그인된 동일한 Mac(또는 SSH로 접근 가능한 Mac)에서 이미 `imsg`를 실행하고 있습니다.
- 별도의 BlueBubbles 서버도, 인증할 REST 엔드포인트도, Webhook 배관도 없이 움직이는 부분을 하나 줄이고 싶습니다. 서버 + 클라이언트 앱 + 헬퍼 대신 단일 CLI 바이너리만 사용합니다.
- 비공개 API 프로브가 `available: true`를 보고하는 [지원되는 macOS / `imsg` 빌드](/ko/channels/imessage#requirements-and-permissions-macos)를 사용 중입니다.

## imsg가 하는 일

`imsg`는 Messages용 로컬 macOS CLI입니다. OpenClaw는 `imsg rpc`를 자식 프로세스로 시작하고 stdin/stdout을 통해 JSON-RPC로 통신합니다. 노출할 HTTP 서버, Webhook URL, 백그라운드 데몬, launch agent, 포트가 없습니다.

- 읽기는 읽기 전용 SQLite 핸들을 사용하여 `~/Library/Messages/chat.db`에서 가져옵니다.
- 실시간 인바운드 메시지는 `imsg watch` / `watch.subscribe`에서 가져오며, 이는 폴링 폴백과 함께 `chat.db` 파일 시스템 이벤트를 따릅니다.
- 전송은 일반 텍스트 및 파일 전송에 Messages.app 자동화를 사용합니다.
- 고급 작업은 `imsg launch`를 사용하여 `imsg` 헬퍼를 Messages.app에 주입합니다. 이것이 읽음 확인, 입력 표시기, 리치 전송, 편집, 전송 취소, 스레드 답장, tapback, 그룹 관리를 가능하게 합니다.
- Linux 빌드는 복사된 `chat.db`를 검사할 수 있지만, 전송하거나, 실시간 Mac 데이터베이스를 감시하거나, Messages.app을 구동할 수는 없습니다. OpenClaw iMessage의 경우 로그인된 Mac에서 `imsg`를 실행하거나 해당 Mac으로 향하는 SSH 래퍼를 통해 실행하세요.

## 시작하기 전에

1. Messages.app을 실행하는 Mac에 `imsg`를 설치합니다.

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   `imsg chats`가 `unable to open database file`, 빈 출력 또는 `authorization denied`로 실패하면 `imsg`를 실행하는 터미널, 편집기, Node 프로세스, Gateway 서비스 또는 SSH 부모 프로세스에 전체 디스크 접근 권한을 부여한 다음 해당 부모 프로세스를 다시 엽니다.

2. OpenClaw 구성을 변경하기 전에 읽기, 감시, 전송, RPC 표면을 확인합니다.

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42`를 `imsg chats`에서 가져온 실제 채팅 ID로 바꿉니다. 전송에는 Messages.app에 대한 자동화 권한이 필요합니다. OpenClaw가 SSH를 통해 실행될 예정이라면 OpenClaw가 사용할 동일한 SSH 래퍼 또는 사용자 컨텍스트를 통해 이 명령을 실행하세요.

3. 고급 작업이 필요할 때 비공개 API 브리지를 활성화합니다.

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch`는 SIP가 비활성화되어 있어야 합니다. 기본 전송, 기록, 감시는 `imsg launch` 없이도 작동하지만, 고급 작업은 작동하지 않습니다.

4. 활성화된 `channels.imessage` 구성을 추가한 후 OpenClaw를 통해 브리지를 확인합니다.

   ```bash
   openclaw channels status --probe
   ```

   `imessage.privateApi.available: true`가 필요합니다. `false`를 보고하면 먼저 이를 수정하세요. [기능 감지](/ko/channels/imessage#private-api-actions)를 참조하세요. `channels status --probe`는 구성되고 활성화된 계정만 프로브합니다.

5. 구성을 스냅샷으로 저장합니다.

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 구성 변환

iMessage와 BlueBubbles는 많은 채널 수준 구성을 공유합니다. 변경되는 키는 대부분 전송(REST 서버 대 로컬 CLI)입니다. 동작 키(`dmPolicy`, `groupPolicy`, `allowFrom` 등)는 같은 의미를 유지합니다.

| BlueBubbles                                                | 번들 iMessage                             | 참고                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 의미는 동일합니다.                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.serverUrl`                           | _(제거됨)_                                | REST 서버가 없습니다 — Plugin이 stdio를 통해 `imsg rpc`를 실행합니다.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(제거됨)_                                | Webhook 인증이 필요 없습니다.                                                                                                                                                                                                                                                                                                                         |
| _(암시적)_                                                 | `channels.imessage.cliPath`               | `imsg` 경로입니다(기본값 `imsg`). SSH에는 래퍼 스크립트를 사용하세요.                                                                                                                                                                                                                                                                                 |
| _(암시적)_                                                 | `channels.imessage.dbPath`                | 선택적 Messages.app `chat.db` 재정의입니다. 생략하면 자동 감지됩니다.                                                                                                                                                                                                                                                                                 |
| _(암시적)_                                                 | `channels.imessage.remoteHost`            | `host` 또는 `user@host` — `cliPath`가 SSH 래퍼이고 SCP 첨부파일 가져오기를 원하는 경우에만 필요합니다.                                                                                                                                                                                                                                                |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 값은 동일합니다(`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 페어링 승인은 토큰이 아니라 핸들 기준으로 이전됩니다.                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 값은 동일합니다(`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 동일합니다.                                                                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **`groups: { "*": { ... } }` 와일드카드 항목이 있으면 그것까지 포함해 그대로 복사하세요.** 그룹별 `requireMention`, `tools`, `toolsBySender`는 이전됩니다. `groupPolicy: "allowlist"`에서 `groups` 블록이 비어 있거나 없으면 모든 그룹 메시지가 조용히 버려집니다 — 아래의 "그룹 레지스트리 함정"을 참고하세요. |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 기본값은 `true`입니다. 번들 Plugin에서는 비공개 API 프로브가 실행 중일 때만 동작합니다.                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 형태는 동일하고, **동일하게 기본값은 꺼짐**입니다. BlueBubbles에서 첨부파일을 흐르게 했다면 iMessage 블록에서 이를 명시적으로 다시 설정해야 합니다 — 암시적으로 이전되지 않으며, 그렇게 하기 전까지는 들어오는 사진/미디어가 `Inbound message` 로그 줄 없이 조용히 버려집니다.                                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 로컬 루트입니다. 와일드카드 규칙은 동일합니다.                                                                                                                                                                                                                                                                                                        |
| _(해당 없음)_                                              | `channels.imessage.remoteAttachmentRoots` | SCP 가져오기를 위해 `remoteHost`가 설정된 경우에만 사용됩니다.                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage의 기본값은 16 MB입니다(BlueBubbles 기본값은 8 MB였습니다). 더 낮은 한도를 유지하려면 명시적으로 설정하세요.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 둘 다 기본값은 4000입니다.                                                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 동일한 옵트인입니다. DM 전용입니다 — 그룹 채팅은 두 채널 모두에서 메시지별 즉시 디스패치를 유지합니다. 명시적 `messages.inbound.byChannel.imessage` 없이 활성화하면 기본 인바운드 디바운스가 2500 ms로 넓어집니다. [iMessage 문서 § 분할 전송 DM 병합](/ko/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)을 참고하세요. |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(해당 없음)_                             | iMessage는 이미 `chat.db`에서 발신자 표시 이름을 읽습니다.                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 작업별 토글: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                          |

다중 계정 구성(`channels.bluebubbles.accounts.*`)은 `channels.imessage.accounts.*`로 일대일 변환됩니다.

## 그룹 레지스트리 함정

번들 iMessage Plugin은 별도의 그룹 allowlist 게이트 **두 개**를 연달아 실행합니다. 그룹 메시지가 에이전트에 도달하려면 둘 다 통과해야 합니다.

1. **발신자 / 채팅 대상 allowlist**(`channels.imessage.groupAllowFrom`) — `isAllowedIMessageSender`가 확인합니다. 들어오는 메시지를 발신자 핸들, `chat_guid`, `chat_identifier`, 또는 `chat_id`로 매칭합니다. 형태는 BlueBubbles와 동일합니다.
2. **그룹 레지스트리**(`channels.imessage.groups`) — `inbound-processing.ts:199`의 `resolveChannelGroupPolicy`가 확인합니다. `groupPolicy: "allowlist"`에서는 이 게이트가 다음 중 하나를 요구합니다.
   - `groups: { "*": { ... } }` 와일드카드 항목(`allowAll = true` 설정), 또는
   - `groups` 아래의 명시적인 `chat_id`별 항목.

게이트 1은 통과하지만 게이트 2가 실패하면 메시지는 버려집니다. Plugin은 기본 로그 수준에서 더 이상 조용히 지나가지 않도록 두 가지 `warn` 수준 신호를 내보냅니다.

- `groupPolicy: "allowlist"`가 설정되어 있지만 `channels.imessage.groups`가 비어 있을 때(`"*"` 와일드카드 없음, `chat_id`별 항목 없음) 계정별로 시작 시 한 번 발생하는 `warn` — 메시지가 도착하기 전에 발생합니다.
- 런타임에 특정 그룹이 처음 버려질 때 `chat_id`별로 한 번 발생하는 `warn`으로, chat_id와 허용을 위해 `groups`에 추가해야 할 정확한 키를 명시합니다.

DM은 다른 코드 경로를 사용하므로 계속 동작합니다.

이것이 가장 흔한 BlueBubbles → 번들 iMessage 마이그레이션 실패 모드입니다. 운영자는 `groupAllowFrom`과 `groupPolicy`는 복사하지만 `groups` 블록은 건너뜁니다. BlueBubbles의 `groups: { "*": { "requireMention": true } }`가 관련 없는 멘션 설정처럼 보이기 때문입니다. 실제로는 레지스트리 게이트에 필수입니다.

`groupPolicy: "allowlist"` 이후에도 그룹 메시지를 계속 흐르게 하는 최소 구성은 다음과 같습니다.

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

`requireMention: true` under `*`는 mention 패턴이 구성되어 있지 않을 때 무해합니다. 런타임은 `canDetectMention = false`로 설정하고 `inbound-processing.ts:512`에서 mention 드롭을 바로 우회합니다. mention 패턴이 구성되어 있으면(`agents.list[].groupChat.mentionPatterns`) 예상대로 동작합니다.

Gateway 로그에 `imessage: dropping group message from chat_id=<id>` 또는 시작 줄 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`가 표시되면 게이트 2에서 드롭하는 것입니다. `groups` 블록을 추가하세요.

## 단계별 안내

1. 기존 BlueBubbles 블록 옆에 iMessage 블록을 추가합니다. Gateway가 아직 BlueBubbles 트래픽을 라우팅하는 동안에는 비활성화된 상태로 유지하세요.

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
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

2. **트래픽이 중요해지기 전에 프로브하세요** — Gateway를 중지하고, iMessage 블록을 임시로 활성화한 다음, CLI에서 iMessage가 정상으로 보고되는지 확인합니다.

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe`는 구성되고 활성화된 계정만 프로브합니다. 두 채널 모니터를 모두 실행하려는 의도가 아니라면 BlueBubbles와 iMessage를 둘 다 활성화한 상태로 Gateway를 다시 시작하지 마세요. 즉시 전환하지 않을 경우 Gateway를 다시 시작하기 전에 `channels.imessage.enabled`를 다시 `false`로 설정하세요. OpenClaw 트래픽을 활성화하기 전에 Mac을 검증하려면 [시작하기 전에](#before-you-start)의 직접 `imsg` 명령을 사용하세요.

3. **전환합니다.** 활성화된 iMessage 계정이 정상으로 보고되면 BlueBubbles 구성을 제거하고 iMessage를 활성화된 상태로 유지합니다.

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Gateway를 다시 시작합니다. 이제 인바운드 iMessage 트래픽이 번들 Plugin을 통해 흐릅니다.

4. **DM을 검증합니다.** 에이전트에 다이렉트 메시지를 보내고, 답장이 도착하는지 확인합니다.

5. **그룹을 별도로 검증합니다.** DM과 그룹은 서로 다른 코드 경로를 사용합니다. DM 성공이 그룹 라우팅을 증명하지는 않습니다. 페어링된 그룹 채팅에서 에이전트에 메시지를 보내고 답장이 도착하는지 확인합니다. 그룹이 조용해지면(에이전트 답장 없음, 오류 없음), Gateway 로그에서 `imessage: dropping group message from chat_id=<id>` 또는 시작 시 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 줄을 확인하세요. 둘 다 기본 로그 수준에서 발생합니다. 둘 중 하나가 표시되면 `groups` 블록이 없거나 비어 있는 것입니다. 위의 "Group registry footgun"을 참조하세요.

6. **작업 표면을 검증합니다** — 페어링된 DM에서 에이전트에 반응, 편집, 보내기 취소, 답장, 사진 전송, 그리고 (그룹에서) 그룹 이름 변경 / 참가자 추가 또는 제거를 요청합니다. 각 작업은 Messages.app에 네이티브로 도착해야 합니다. 작업 중 하나라도 "iMessage `<action>` requires the imsg private API bridge"를 발생시키면 `imsg launch`를 다시 실행하고 `channels status --probe`를 새로 고치세요.

7. iMessage DM, 그룹, 작업을 검증한 뒤 **BlueBubbles 서버와 구성을 제거합니다**. OpenClaw는 `channels.bluebubbles`를 사용하지 않습니다.

## 작업 동등성 한눈에 보기

| 작업                                                       | 레거시 BlueBubbles                 | 번들 iMessage                                                                                                          |
| ---------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 텍스트 전송 / SMS 폴백                                     | ✅                                 | ✅                                                                                                                     |
| 미디어 전송(사진, 동영상, 파일, 음성)                      | ✅                                 | ✅                                                                                                                     |
| 스레드 답장(`reply_to_guid`)                               | ✅                                 | ✅ ([#51892](https://github.com/openclaw/openclaw/issues/51892) 해결)                                                  |
| Tapback(`react`)                                           | ✅                                 | ✅                                                                                                                     |
| 편집 / 보내기 취소(macOS 13+ 수신자)                       | ✅                                 | ✅                                                                                                                     |
| 화면 효과와 함께 전송                                      | ✅                                 | ✅ ([#9394](https://github.com/openclaw/openclaw/issues/9394)의 일부 해결)                                             |
| 리치 텍스트 굵게 / 기울임꼴 / 밑줄 / 취소선                | ✅                                 | ✅ (attributedBody를 통한 typed-run 서식 지정)                                                                         |
| 그룹 이름 변경 / 그룹 아이콘 설정                          | ✅                                 | ✅                                                                                                                     |
| 참가자 추가 / 제거, 그룹 나가기                            | ✅                                 | ✅                                                                                                                     |
| 읽음 확인 및 입력 중 표시기                                | ✅                                 | ✅ (비공개 API 프로브에 의해 제어됨)                                                                                  |
| 동일 발신자 DM 병합                                        | ✅                                 | ✅ (DM 전용, `channels.imessage.coalesceSameSenderDms`로 옵트인)                                                       |
| Gateway 중단 중 수신된 인바운드 메시지 캐치업              | ✅ (Webhook 재생 + 기록 가져오기)  | ✅ (`channels.imessage.catchup.enabled`로 옵트인, [#78649](https://github.com/openclaw/openclaw/issues/78649) 해결)    |

이제 iMessage 캐치업을 번들 Plugin에서 옵트인 기능으로 사용할 수 있습니다. Gateway 시작 시 `channels.imessage.catchup.enabled`가 `true`이면 Gateway는 `imsg watch`가 사용하는 것과 동일한 JSON-RPC 클라이언트에 대해 한 번의 `chats.list` + 채팅별 `messages.history` 패스를 실행하고, 누락된 각 인바운드 행을 라이브 디스패치 경로(허용 목록, 그룹 정책, 디바운서, 에코 캐시)를 통해 재생하며, 후속 시작 시 중단된 지점부터 이어갈 수 있도록 계정별 커서를 유지합니다. 조정 방법은 [Gateway 다운타임 이후 캐치업](/ko/channels/imessage#catching-up-after-gateway-downtime)을 참조하세요.

## 페어링, 세션, ACP 바인딩

- **페어링 승인**은 핸들을 기준으로 유지됩니다. 알려진 발신자를 다시 승인할 필요는 없습니다. `channels.imessage.allowFrom`은 BlueBubbles가 사용하던 동일한 `+15555550123` / `user@example.com` 문자열을 인식합니다.
- **세션**은 에이전트 + 채팅별로 범위가 유지됩니다. 기본 `session.dmScope=main`에서는 DM이 에이전트 기본 세션으로 합쳐지고, 그룹 세션은 `chat_id`별로 격리된 상태를 유지합니다. 세션 키는 다릅니다(`agent:<id>:imessage:group:<chat_id>`와 BlueBubbles의 해당 키). BlueBubbles 세션 키 아래의 이전 대화 기록은 iMessage 세션으로 이어지지 않습니다.
- `match.channel: "bluebubbles"`를 참조하는 **ACP 바인딩**은 `"imessage"`로 업데이트해야 합니다. `match.peer.id` 형태(`chat_id:`, `chat_guid:`, `chat_identifier:`, 베어 핸들)는 동일합니다.

## 롤백 채널 없음

다시 전환할 수 있는 지원되는 BlueBubbles 런타임은 없습니다. iMessage 검증이 실패하면 `channels.imessage.enabled: false`를 설정하고, Gateway를 다시 시작한 뒤, `imsg` 차단 요인을 해결하고 전환을 다시 시도하세요.

답장 캐시는 `~/.openclaw/state/imessage/reply-cache.jsonl`에 있습니다(모드 `0600`, 상위 디렉터리 `0700`). 새로 시작하고 싶다면 삭제해도 안전합니다.

## 관련 항목

- [BlueBubbles 제거 및 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage) — 짧은 공지와 운영자 요약.
- [iMessage](/ko/channels/imessage) — `imsg launch` 설정과 기능 감지를 포함한 전체 iMessage 채널 참조.
- `/channels/bluebubbles` — 이 마이그레이션 가이드로 리디렉션되는 레거시 URL.
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름.
- [채널 라우팅](/ko/channels/channel-routing) — Gateway가 아웃바운드 답장에 사용할 채널을 선택하는 방식.
