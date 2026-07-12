---
read_when:
    - 기존 BlueBubbles 채널을 사용 중이며 iMessage로 이전해야 합니다
    - 지원되는 OpenClaw iMessage 설정을 선택하고 있습니다
    - BlueBubbles 제거에 대한 간단한 설명이 필요합니다.
summary: OpenClaw에서 BlueBubbles 지원이 제거되었습니다. 신규 및 마이그레이션된 iMessage 설정에는 imsg를 사용하는 번들 iMessage Plugin을 사용하십시오.
title: BlueBubbles 제거 및 imsg iMessage 경로
x-i18n:
    generated_at: "2026-07-12T14:57:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# BlueBubbles 제거 및 imsg iMessage 경로

OpenClaw는 더 이상 BlueBubbles 채널을 제공하지 않습니다. iMessage 지원은 번들로 제공되는 `imessage` Plugin을 통해 이루어집니다. Gateway는 로컬에서 또는 SSH 래퍼를 통해 [`imsg`](https://github.com/steipete/imsg)를 자식 프로세스로 실행하고, stdin/stdout을 통해 JSON-RPC로 통신합니다. 서버도, Webhook도, 포트도 없습니다.

구성에 아직 `channels.bluebubbles`가 포함되어 있다면 `channels.imessage`로 마이그레이션하십시오. 기존 `/channels/bluebubbles` 문서 URL은 전체 구성 변환표와 전환 체크리스트가 있는 [BlueBubbles에서 이전하기](/ko/channels/imessage-from-bluebubbles)로 리디렉션됩니다.

## 변경 사항

- 지원되는 iMessage 경로에는 BlueBubbles HTTP 서버, Webhook 경로, REST 비밀번호 또는 BlueBubbles Plugin 런타임이 없습니다.
- OpenClaw는 Messages.app에 로그인된 Mac에서 `imsg`를 통해 메시지를 읽고 감시합니다.
- 기본적인 전송, 수신, 기록 및 미디어 기능은 일반 `imsg` 인터페이스와 macOS 권한을 사용합니다.
- 고급 동작(스레드 답장, 탭백, 편집, 전송 취소, 효과, 읽음 확인, 입력 표시기, 그룹 관리)에는 비공개 API 브리지가 필요합니다. SIP를 비활성화해야 하는 `imsg launch`를 실행하십시오.
- Linux 및 Windows Gateway에서도 로그인된 Mac에서 `imsg`를 실행하는 SSH 래퍼를 `channels.imessage.cliPath`로 지정하여 iMessage를 사용할 수 있습니다.

## 수행할 작업

1. Messages가 실행되는 Mac에 `imsg`를 설치하고 확인합니다.

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. `imsg`와 OpenClaw를 실행하는 프로세스 컨텍스트에 Full Disk Access 및 Automation 권한을 부여합니다.

3. 기존 구성을 변환합니다.

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Gateway를 다시 시작하고 확인합니다.

   ```bash
   openclaw channels status --probe
   ```

5. 기존 BlueBubbles 서버를 삭제하기 전에 DM, 그룹, 첨부 파일 및 의존하는 모든 비공개 API 동작을 테스트합니다.

## 마이그레이션 참고 사항

- `channels.bluebubbles.serverUrl` 및 `channels.bluebubbles.password`에 해당하는 iMessage 설정은 없습니다. 연결하거나 인증할 서버가 없기 때문입니다.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` 및 `actions.*`는 `channels.imessage`에서도 같은 의미를 유지합니다.
- `channels.imessage.includeAttachments`는 여전히 기본적으로 꺼져 있습니다. 수신 사진, 음성 메모, 동영상 또는 파일이 에이전트에 전달되어야 한다면 명시적으로 설정하십시오.
- `groupPolicy: "allowlist"`를 사용하는 경우 모든 `"*"` 와일드카드 항목을 포함하여 기존 `groups` 블록을 복사하십시오. 그룹 발신자 허용 목록과 그룹 레지스트리는 별도의 게이트입니다. 항목이 있지만 일치하는 `chat_id`가 없는(또는 `"*"`가 없는) `groups` 블록은 런타임에 메시지를 폐기하며, 빈 `groups` 블록은 발신자 필터링에서 메시지 통과를 계속 허용하더라도 시작 경고를 기록합니다.
- `match.channel: "bluebubbles"`가 있는 ACP 바인딩은 `"imessage"`로 변경해야 합니다.
- 기존 BlueBubbles 세션 키는 iMessage 세션 키로 변환되지 않습니다. 페어링 승인은 발신자 핸들을 기준으로 하므로 복사한 `allowFrom` 항목은 계속 작동하지만, BlueBubbles 세션 키에 저장된 대화 기록은 이전되지 않습니다.

## 관련 문서

- [BlueBubbles에서 이전하기](/ko/channels/imessage-from-bluebubbles)
- [iMessage](/ko/channels/imessage)
- [구성 참조 - iMessage](/ko/gateway/config-channels#imessage)
