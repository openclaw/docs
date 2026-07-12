---
read_when:
    - 번들 iMessage Plugin으로 BlueBubbles에서 이전 계획 수립하기
    - BlueBubbles 구성 키를 iMessage의 해당 항목으로 변환하기
    - iMessage Plugin을 활성화하기 전에 imsg 확인하기
summary: 기존 BlueBubbles 구성을 번들 iMessage Plugin으로 마이그레이션합니다. 키 매핑, 그룹 허용 목록 게이트, 전환 검증을 다룹니다.
title: BlueBubbles에서 마이그레이션하기
x-i18n:
    generated_at: "2026-07-12T14:57:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

BlueBubbles 지원은 제거되었습니다. OpenClaw는 번들로 제공되는 `imessage` plugin을 통해서만 iMessage를 지원합니다. 이 plugin은 JSON-RPC를 통해 [`steipete/imsg`](https://github.com/steipete/imsg)를 구동하며 BlueBubbles가 사용하던 것과 동일한 비공개 API 표면(`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, 네이티브 투표, 그룹 관리, 첨부 파일)에 접근합니다. 하나의 CLI 바이너리가 BlueBubbles 서버 + 클라이언트 앱 + webhook 연결 구성을 대체합니다. REST 엔드포인트도, webhook 인증도 필요하지 않습니다.

이 가이드에서는 기존 `channels.bluebubbles` 구성을 `channels.imessage`로 마이그레이션합니다. 지원되는 다른 마이그레이션 경로는 없습니다. 현재 OpenClaw에서는 남아 있는 `channels.bluebubbles` 블록이 비활성 상태이며, 어떤 런타임도 이를 읽지 않습니다.

<Note>
간략한 공지와 운영자용 요약은 [BlueBubbles 제거 및 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage)를 참조하십시오.
</Note>

## 마이그레이션 체크리스트

기존 BlueBubbles 구성을 이미 알고 있는 경우 가장 짧고 안전한 경로는 다음과 같습니다.

1. Messages.app이 실행되는 Mac에서 `imsg`를 직접 확인합니다(`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. 동작 키를 `channels.bluebubbles`에서 `channels.imessage`로 복사합니다: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms`, `actions`.
3. 더 이상 존재하지 않는 전송 계층 키를 제거합니다: `serverUrl`, `password`, webhook URL, BlueBubbles 서버 설정.
4. Gateway가 Messages Mac에서 실행되지 않는 경우 `channels.imessage.cliPath`를 SSH 래퍼로 설정하고 원격 첨부 파일 가져오기를 위해 `remoteHost`를 설정합니다.
5. `channels.imessage`를 활성화하고 Gateway를 재시작한 다음 `openclaw channels status --probe --channel imessage`를 실행합니다.
6. DM 하나, 허용된 그룹 하나, 활성화한 경우 첨부 파일, 그리고 에이전트가 사용할 것으로 예상되는 모든 비공개 API 동작을 테스트합니다.
7. iMessage 경로를 확인한 후 BlueBubbles 서버와 기존 `channels.bluebubbles` 구성을 삭제합니다.

## imsg의 역할

`imsg`는 Messages용 로컬 macOS CLI입니다. OpenClaw는 `imsg rpc`를 자식 프로세스로 시작하고 stdin/stdout을 통해 JSON-RPC로 통신합니다. 노출할 HTTP 서버, webhook URL, 백그라운드 데몬, 시작 에이전트 또는 포트가 없습니다.

- 읽기는 읽기 전용 SQLite 핸들을 사용하여 `~/Library/Messages/chat.db`에서 수행됩니다.
- 실시간 수신 메시지는 `imsg watch` / `watch.subscribe`에서 가져오며, 폴링 대체 방식을 사용해 `chat.db` 파일 시스템 이벤트를 추적합니다.
- 일반 텍스트 및 파일 전송에는 Messages.app 자동화를 사용합니다.
- 고급 동작은 `imsg launch`를 사용하여 `imsg` 도우미를 Messages.app에 주입합니다. 이를 통해 읽음 확인, 입력 중 표시, 리치 메시지 전송, 편집, 전송 취소, 스레드 답장, 탭백, 투표 및 그룹 관리를 사용할 수 있습니다.
- Linux 빌드에서는 복사된 `chat.db`를 검사할 수 있지만, 메시지를 보내거나 실시간 Mac 데이터베이스를 감시하거나 Messages.app을 구동할 수는 없습니다. OpenClaw iMessage를 사용하려면 로그인된 Mac에서 `imsg`를 실행하거나 해당 Mac에 연결되는 SSH 래퍼를 통해 실행하십시오.

## 시작하기 전에

1. Messages.app이 실행되는 Mac에 `imsg`를 설치합니다.

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   일반적인 로컬 설정에서는 OpenClaw 설정 과정에서 사용자가 확인한 후 로그인된 Messages Mac에 Homebrew를 사용하여 `imsg`를 설치하거나 업데이트하도록 제안할 수 있습니다. 수동 설정과 SSH 래퍼 토폴로지는 계속 운영자가 관리해야 합니다. `imsg`를 실행할 동일한 로컬 또는 원격 사용자 컨텍스트에서 Homebrew 업데이트를 반복하십시오. `imsg chats`가 `unable to open database file`, 빈 출력 또는 `authorization denied` 오류로 실패하면 `imsg`를 시작하는 터미널, 편집기, Node 프로세스, Gateway 서비스 또는 SSH 상위 프로세스에 전체 디스크 접근 권한을 부여한 다음 해당 상위 프로세스를 다시 여십시오.

2. OpenClaw 구성을 변경하기 전에 읽기, 감시, 전송 및 RPC 표면을 확인합니다.

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42`를 `imsg chats`에서 확인한 실제 채팅 ID로 바꾸십시오. 전송하려면 Messages.app에 대한 자동화 권한이 필요합니다. OpenClaw가 SSH를 통해 실행되는 경우 OpenClaw가 사용할 것과 동일한 SSH 래퍼 또는 사용자 컨텍스트를 통해 이러한 명령을 실행하십시오. 읽기는 작동하지만 AppleEvents `-1743` 오류로 전송이 실패하면 자동화 권한이 `/usr/libexec/sshd-keygen-wrapper`에 부여되었는지 확인하십시오. [AppleEvents -1743 오류가 발생하는 SSH 래퍼 전송](/ko/channels/imessage#requirements-and-permissions-macos)을 참조하십시오.

3. 비공개 API 브리지를 활성화합니다. 답장, 탭백, 효과, 투표, 첨부 파일 답장 및 그룹 동작이 이 기능에 의존하므로 OpenClaw iMessage에서 사용할 것을 강력히 권장합니다.

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch`를 사용하려면 SIP를 비활성화해야 합니다. 최신 macOS에서는 라이브러리 검증도 완화해야 합니다. [imsg 비공개 API 활성화](/ko/channels/imessage#enabling-the-imsg-private-api)를 참조하십시오. 기본 전송, 기록 및 감시는 `imsg launch` 없이도 작동하지만 전체 OpenClaw iMessage 동작 표면은 작동하지 않습니다.

4. `channels.imessage`를 활성화하고 Gateway를 시작한 후 OpenClaw를 통해 브리지를 확인합니다.

   ```bash
   openclaw channels status --probe
   ```

   iMessage 계정은 `works`를 보고해야 합니다. `--json`을 사용하면 프로브 페이로드에 `privateApi.available: true`가 포함됩니다. `false`가 보고되면 먼저 이를 해결하십시오. [기능 감지](/ko/channels/imessage#private-api-actions)를 참조하십시오. 프로브에는 연결 가능한 Gateway가 필요하며, 그렇지 않으면 CLI는 구성만 포함된 출력으로 대체됩니다. 또한 구성되고 활성화된 계정만 프로브합니다.

5. 구성을 스냅샷으로 저장합니다.

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## 구성 변환

iMessage와 BlueBubbles는 대부분의 채널 수준 동작 키를 공유합니다. 변경되는 것은 전송 방식(REST 서버와 로컬 CLI) 및 그룹 레지스트리 키 형식입니다.

| BlueBubbles                                                | 번들 iMessage                             | 참고                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 의미는 동일합니다(블록이 존재하면 기본값은 `true`).                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.serverUrl`                           | _(제거됨)_                                | REST 서버가 없습니다. Plugin이 stdio를 통해 `imsg rpc`를 실행합니다.                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.password`                            | _(제거됨)_                                | Webhook 인증이 필요하지 않습니다.                                                                                                                                                                                                                                                                                     |
| _(암시적)_                                                 | `channels.imessage.cliPath`               | `imsg` 경로입니다(기본값 `imsg`). SSH에는 래퍼 스크립트를 사용하십시오.                                                                                                                                                                                                                                               |
| _(암시적)_                                                 | `channels.imessage.dbPath`                | 선택적 Messages.app `chat.db` 재정의입니다. 생략하면 자동으로 감지됩니다.                                                                                                                                                                                                                                            |
| _(암시적)_                                                 | `channels.imessage.remoteHost`            | `host` 또는 `user@host`입니다. `cliPath`가 SSH 래퍼이고 SCP로 첨부 파일을 가져오려는 경우에만 필요합니다.                                                                                                                                                                                                              |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 값은 동일하며(`pairing` / `allowlist` / `open` / `disabled`), 기본값은 `pairing`입니다.                                                                                                                                                                                                                               |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 핸들 형식은 동일합니다(`+15555550123`, `user@example.com`). 페어링 저장소의 승인은 이전되지 않습니다. 아래를 참조하십시오.                                                                                                                                                                                            |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 값은 동일하며(`allowlist` / `open` / `disabled`), 기본값은 `allowlist`입니다.                                                                                                                                                                                                                                         |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 동일합니다. 설정하지 않으면 iMessage는 `allowFrom`으로 대체합니다. 명시적으로 비어 있는 `groupAllowFrom: []`은 `groupPolicy: "allowlist"`에서 모든 그룹을 차단합니다.                                                                                                                                                  |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | `"*"` 와일드카드 항목은 그대로 복사하고, 그룹별 항목의 키는 숫자형 iMessage `chat_id`로 다시 지정하십시오. "그룹 레지스트리 함정"을 참조하십시오. `requireMention`, `tools`, `toolsBySender`, `systemPrompt`는 그대로 이전됩니다.                                                                                       |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 기본값은 `true`입니다. 번들 Plugin에서는 비공개 API 프로브가 작동 중일 때만 실행됩니다.                                                                                                                                                                                                                               |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 형태가 동일하며 기본적으로 비활성화됩니다. BlueBubbles에서 첨부 파일을 처리했다면 이를 명시적으로 설정하십시오. 설정하기 전까지 수신 사진/미디어가 아무런 알림 없이 삭제됩니다(`Inbound message` 로그 줄도 없음).                                                                                                      |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 로컬 루트이며 와일드카드 규칙도 동일합니다.                                                                                                                                                                                                                                                                           |
| _(해당 없음)_                                              | `channels.imessage.remoteAttachmentRoots` | SCP 가져오기를 위해 `remoteHost`가 설정된 경우에만 사용됩니다.                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage의 기본값은 16 MB입니다(BlueBubbles의 기본값은 8 MB였습니다). 더 낮은 제한을 유지하려면 명시적으로 설정하십시오.                                                                                                                                                                                              |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 양쪽 모두 기본값은 4000입니다.                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 동일한 옵트인 방식입니다. DM에만 적용되며 그룹은 메시지별 디스패치를 유지합니다. `messages.inbound.byChannel.imessage` 또는 전역 `messages.inbound.debounceMs`가 설정되지 않은 경우 기본 수신 디바운스를 7000 ms로 늘립니다. [분할 전송 DM 병합](/ko/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)을 참조하십시오. |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(해당 없음)_                              | `imsg`는 이미 `chat.db`에서 보낸 사람의 표시 이름을 제공합니다.                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 작업별 토글(`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`)은 동일하며 새로운 `polls`가 추가됩니다. 모두 기본적으로 활성화되지만 비공개 API 작업에는 여전히 브리지가 필요합니다.                         |

다중 계정 구성(`channels.bluebubbles.accounts.*`)은 `channels.imessage.accounts.*`로 일대일 대응하여 변환됩니다.

## 그룹 레지스트리 함정

번들 iMessage Plugin은 두 개의 그룹 게이트를 연속으로 실행합니다. 그룹 메시지가 에이전트에 도달하려면 두 게이트를 모두 통과해야 합니다.

1. **보낸 사람/채팅 대상 허용 목록**(`channels.imessage.groupAllowFrom`) — 보낸 사람 핸들 또는 채팅 대상(`chat_id:`, `chat_guid:`, `chat_identifier:` 항목)과 일치시킵니다. `groupAllowFrom`이 설정되지 않으면 이 게이트는 `allowFrom`으로 대체합니다. 명시적인 `groupAllowFrom: []`은 이 대체 동작을 비활성화하고 `groupPolicy: "allowlist"`에서 모든 그룹 메시지를 삭제합니다.
2. **그룹 레지스트리**(`channels.imessage.groups`) — 숫자형 iMessage `chat_id`를 키로 사용합니다.
   - `groups` 블록이 없거나 비어 있는 경우: 게이트 1의 유효한 보낸 사람 허용 목록이 비어 있지 않으면 그룹이 이 게이트를 통과합니다. 보낸 사람 필터링이 액세스를 제어하며 전체 삭제 시작 경고는 발생하지 않습니다.
   - 항목이 있지만 `"*"`가 없는 `groups`: 나열된 `chat_id` 키만 통과합니다. 그룹을 하나라도 나열하면 `groupPolicy: "open"`에서도 레지스트리가 허용 목록으로 바뀝니다.
   - `groups: { "*": { ... } }`: 모든 그룹이 이 게이트를 통과합니다.

마이그레이션 시 주의할 점은 BlueBubbles가 `groups` 항목의 키로 채팅 GUID/채팅 식별자를 사용했지만, iMessage 레지스트리는 숫자형 `chat_id`를 키로 사용한다는 것입니다. 그룹별 항목을 그대로 복사하면 키가 절대 일치하지 않는 비어 있지 않은 레지스트리가 생성되므로 모든 그룹 메시지가 게이트 2에서 삭제됩니다. `"*"` 와일드카드는 그대로 복사하고, 특정 그룹 항목의 키는 `imsg chats`에서 얻은 `chat_id` 값으로 다시 지정하십시오.

두 삭제 경로 모두 기본 로그 수준에서 `warn` 줄로 확인할 수 있습니다.

- 시작 시 계정마다 한 번: `groupPolicy: "allowlist"`가 설정되어 있고 유효한 그룹 보낸 사람 허용 목록이 비어 있으면 `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`가 표시됩니다. 보낸 사람을 허용하려면 `groupAllowFrom`(또는 `allowFrom`)을 설정하십시오. `groups`만 추가해서는 보낸 사람 게이트를 충족하지 못합니다.
- 런타임에 `chat_id`마다 한 번: 레지스트리가 그룹을 삭제하면 `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`가 표시되며 추가해야 할 정확한 키가 명시됩니다.

DM은 어느 경우에도 계속 작동합니다. DM은 다른 코드 경로를 사용하므로 DM이 성공한다고 해서 그룹 라우팅이 작동한다는 의미는 아닙니다.

`groupPolicy: "allowlist"`를 사용하는 최소 보낸 사람 범위 구성은 다음과 같습니다.

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

이 구성은 모든 그룹에서 구성된 보낸 사람을 허용합니다. 허용할 채팅의 범위를 제한하거나 `requireMention` 같은 채팅별 옵션을 설정하려면 `groups` 항목을 추가하십시오. BlueBubbles의 `"*"` 항목은 그대로 복사하되, 특정 항목의 키는 숫자형 iMessage `chat_id` 값으로 다시 지정하십시오.

## 단계별 안내

1. 구성을 변환하십시오. 편집하는 동안 새 블록을 비활성화된 상태로 유지하십시오. 이전 `channels.bluebubbles` 블록은 현재 OpenClaw에서 무시되므로 참고용으로 함께 둘 수 있습니다.

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // 전환할 준비가 되면 true로 변경
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // bluebubbles.allowFrom에서 복사
         groupPolicy: "allowlist",
         groupAllowFrom: [], // bluebubbles.groupAllowFrom에서 복사
         groups: { "*": { requireMention: true } }, // 와일드카드는 그대로 복사하고, 채팅별 항목의 키는 chat_id로 다시 지정
         // 작업은 기본적으로 활성화되며, 비활성화하려면 개별 토글을 false로 설정
       },
     },
   }
   ```

2. **전환하고 점검하십시오.** `channels.imessage.enabled: true`로 설정하고 Gateway를 다시 시작한 다음, 채널이 정상 상태로 보고되는지 확인하십시오.

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # "works"가 표시되어야 함. --json에는 privateApi.available: true가 표시됨
   ```

   점검하려면 연결 가능한 Gateway가 필요하며, 구성되고 활성화된 계정만 점검합니다. Mac 자체를 검증하려면 [시작하기 전에](#before-you-start)의 직접 `imsg` 명령을 사용하십시오.

3. **DM을 확인하십시오.** 에이전트에게 다이렉트 메시지를 보내고 답장이 도착하는지 확인하십시오.

4. **그룹을 별도로 확인하십시오.** DM과 그룹은 서로 다른 코드 경로를 사용하므로 DM 성공만으로는 그룹이 라우팅된다는 것을 입증할 수 없습니다. 허용된 그룹 채팅에서 메시지를 보내고 답장이 도착하는지 확인하십시오. 그룹이 아무 반응도 하지 않는다면(에이전트 답장도 오류도 없는 경우), 위의 "그룹 레지스트리 함정"에 나온 두 `warn` 줄이 Gateway 로그에 있는지 확인하십시오. 시작 경고는 유효한 발신자 허용 목록이 비어 있음을 의미하며, `chat_id`별 경고는 항목이 있는 `groups` 레지스트리에 해당 채팅이 포함되지 않았음을 의미합니다.

5. **작업 표면을 확인하십시오.** 페어링된 DM에서 에이전트에게 반응 추가, 편집, 전송 취소, 답장, 사진 전송을 요청하고, 그룹에서는 그룹 이름 변경 또는 참여자 추가/제거를 요청하십시오. 각 작업은 Messages.app에 네이티브로 반영되어야 합니다. 작업에서 `iMessage <action> requires the imsg private API bridge`가 발생하면 `imsg launch`를 다시 실행하고 `openclaw channels status --probe`로 새로 점검하십시오.

6. iMessage DM, 그룹 및 작업을 확인한 후 **BlueBubbles 서버와 `channels.bluebubbles` 블록을 제거하십시오.** OpenClaw는 `channels.bluebubbles`를 읽지 않습니다.

## 작업 기능 비교 요약

| 작업                                                | 레거시 BlueBubbles | 번들 iMessage                                                                |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| 텍스트 전송 / SMS 폴백                              | ✅                 | ✅                                                                            |
| 미디어 전송(사진, 동영상, 파일, 음성)               | ✅                 | ✅                                                                            |
| 스레드 답장(`reply_to_guid`)                        | ✅                 | ✅ ([#51892](https://github.com/openclaw/openclaw/issues/51892) 해결)         |
| Tapback(`react`)                                    | ✅                 | ✅                                                                            |
| 편집 / 전송 취소(macOS 13+ 수신자)                 | ✅                 | ✅                                                                            |
| 화면 효과와 함께 전송                               | ✅                 | ✅ ([#9394](https://github.com/openclaw/openclaw/issues/9394)의 일부 해결)    |
| 리치 텍스트 굵게 / 기울임꼴 / 밑줄 / 취소선        | ✅                 | ✅ (attributedBody를 통한 타입 지정 실행 서식)                               |
| 네이티브 Messages 투표(생성 및 투표)                | ❌                 | ✅ (`actions.polls`; 네이티브 렌더링에는 수신자의 iOS/macOS 26+ 필요)        |
| 그룹 이름 변경 / 그룹 아이콘 설정                   | ✅                 | ✅                                                                            |
| 참여자 추가 / 제거, 그룹 나가기                     | ✅                 | ✅                                                                            |
| 읽음 확인 및 입력 표시기                            | ✅                 | ✅ (비공개 API 점검 통과 시에만 사용 가능)                                  |
| 동일 발신자 DM 병합                                 | ✅                 | ✅ (DM 전용, `channels.imessage.coalesceSameSenderDms`로 선택적 활성화)      |
| 재시작 후 인바운드 복구                             | ✅                 | ✅ (자동: `since_rowid` 재생 + GUID 중복 제거, 로컬에서는 더 넓은 범위)      |

iMessage는 Gateway가 중단된 동안 누락된 메시지를 복구합니다. 시작 시 `imsg watch.subscribe`의 `since_rowid`를 통해 마지막으로 디스패치된 rowid부터 재생하고, GUID를 기준으로 중복을 제거하며, 오래된 백로그의 수명 제한으로 Push 플러시 "백로그 폭탄"을 억제합니다. 이 작업은 `imsg` RPC 연결을 통해 실행되므로 원격 SSH `cliPath` 설정에서도 작동합니다. 로컬 설정은 `chat.db`를 읽을 수 있으므로 복구 범위가 더 넓습니다. [브리지 또는 Gateway 재시작 후 인바운드 복구](/ko/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)를 참조하십시오.

## 페어링, 세션 및 ACP 바인딩

- **허용 목록은 핸들을 기준으로 이전됩니다.** `channels.imessage.allowFrom`은 BlueBubbles에서 사용한 것과 동일한 `+15555550123` / `user@example.com` 문자열을 인식하므로 그대로 복사하십시오.
- **페어링 저장소의 승인은 이전되지 않습니다.** 페어링 저장소는 채널별로 구분되며 이전 BlueBubbles 저장소를 마이그레이션하지 않습니다. 페어링을 통해서만 승인되었던 발신자는 iMessage에서 다시 한 번 페어링해야 하며, 그렇지 않으면 해당 핸들을 `allowFrom`에 추가해야 합니다.
- **세션**은 에이전트 + 채팅별 범위로 유지됩니다. 기본 `session.dmScope=main`에서는 DM이 에이전트의 기본 세션으로 통합되며, 그룹 세션은 `chat_id`별로 분리된 상태를 유지합니다(`agent:<agentId>:imessage:group:<chat_id>`). BlueBubbles 세션 키에 저장된 이전 대화 기록은 iMessage 세션으로 이전되지 않습니다.
- `match.channel: "bluebubbles"`를 참조하는 **ACP 바인딩**은 `"imessage"`로 변경해야 합니다. `match.peer.id` 형식(`chat_id:`, `chat_guid:`, `chat_identifier:`, 접두사가 없는 핸들)은 동일합니다.

## 롤백 채널 없음

다시 전환할 수 있는 지원 대상 BlueBubbles 런타임은 없습니다. iMessage 검증에 실패하면 `channels.imessage.enabled: false`로 설정하고 Gateway를 다시 시작한 다음, `imsg` 차단 요인을 해결하고 전환을 다시 시도하십시오.

답장 캐시는 SQLite Plugin 상태에 저장됩니다. 이전 `imessage/reply-cache.jsonl` 사이드카가 있으면 `openclaw doctor --fix`가 이를 가져온 후 보관합니다.

## 관련 문서

- [BlueBubbles 제거 및 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage) — 간략한 공지 및 운영자 요약입니다.
- [iMessage](/ko/channels/imessage) — `imsg launch` 설정과 기능 감지를 포함한 전체 iMessage 채널 참고 문서입니다.
- `/channels/bluebubbles` — 이 마이그레이션 가이드로 리디렉션되는 레거시 URL입니다.
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름입니다.
- [채널 라우팅](/ko/channels/channel-routing) — Gateway가 아웃바운드 답장에 사용할 채널을 선택하는 방법입니다.
