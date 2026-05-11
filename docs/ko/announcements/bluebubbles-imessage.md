---
read_when:
    - 기존 BlueBubbles 채널을 사용 중이었고 iMessage로 이동해야 하는 경우
    - 지원되는 OpenClaw iMessage 설정을 선택하고 있습니다
    - BlueBubbles 제거에 대한 간단한 설명이 필요합니다
summary: BlueBubbles 지원은 OpenClaw에서 제거되었습니다. 새 iMessage 설정 및 마이그레이션된 iMessage 설정에는 imsg와 함께 번들된 iMessage Plugin을 사용하세요.
title: BlueBubbles 제거와 imsg iMessage 경로
x-i18n:
    generated_at: "2026-05-11T20:20:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# BlueBubbles 제거 및 imsg iMessage 경로

OpenClaw는 더 이상 BlueBubbles 채널을 제공하지 않습니다. 이제 iMessage 지원은 번들로 제공되는 `imessage` plugin을 통해 실행되며, 이 plugin은 [`imsg`](https://github.com/steipete/imsg)를 로컬에서 또는 SSH 래퍼를 통해 시작하고 stdin/stdout으로 JSON-RPC를 통신합니다.

구성에 아직 `channels.bluebubbles`가 포함되어 있다면 `channels.imessage`로 마이그레이션하세요. 기존 `/channels/bluebubbles` 문서 URL은 [BlueBubbles에서 이전하기](/ko/channels/imessage-from-bluebubbles)로 리디렉션되며, 여기에는 전체 구성 변환 표와 전환 체크리스트가 있습니다.

## 변경된 사항

- 지원되는 OpenClaw iMessage 경로에는 BlueBubbles HTTP 서버, webhook 경로, REST 비밀번호, 또는 BlueBubbles plugin 런타임이 없습니다.
- OpenClaw는 Messages.app에 로그인된 Mac에서 `imsg`를 통해 메시지를 읽고 감시합니다.
- 기본 보내기, 받기, 기록, 미디아는 일반 `imsg` 표면과 macOS 권한을 사용합니다.
- 스레드 답장, 탭백, 편집, 보내기 취소, 효과, 읽음 확인, 입력 표시기, 그룹 관리 같은 고급 동작에는 private API 브리지를 사용할 수 있는 `imsg launch`가 필요합니다.
- Linux 및 Windows Gateway는 로그인된 Mac에서 `imsg`를 실행하는 SSH 래퍼로 `channels.imessage.cliPath`를 설정하여 iMessage를 계속 사용할 수 있습니다.

## 해야 할 일

1. Messages Mac에 `imsg`를 설치하고 확인합니다.

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. `imsg`와 OpenClaw를 실행하는 프로세스 컨텍스트에 전체 디스크 접근 권한과 자동화 권한을 부여합니다.

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

5. 기존 BlueBubbles 서버를 삭제하기 전에 DM, 그룹, 첨부 파일, 그리고 의존하는 private API 동작을 테스트합니다.

## 마이그레이션 참고 사항

- `channels.bluebubbles.serverUrl` 및 `channels.bluebubbles.password`에 해당하는 iMessage 항목은 없습니다.
- `channels.bluebubbles.allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, 첨부 파일 루트, 미디어 크기 제한, 청킹, 동작 토글에는 iMessage 대응 항목이 있습니다.
- `channels.imessage.includeAttachments`는 여전히 기본적으로 꺼져 있습니다. 인바운드 사진, 음성 메모, 동영상, 파일이 에이전트에 도달해야 한다면 명시적으로 설정하세요.
- `groupPolicy: "allowlist"`를 사용하는 경우 `"*"` 와일드카드 항목을 포함하여 기존 `groups` 블록을 복사합니다. 그룹 발신자 허용 목록과 그룹 레지스트리는 별도의 게이트입니다.
- `channel: "bluebubbles"`와 일치하던 ACP 바인딩은 `channel: "imessage"`로 변경해야 합니다.
- 기존 BlueBubbles 세션 키는 iMessage 세션 키가 되지 않습니다. 페어링 승인은 핸들 기준으로 이어지지만, BlueBubbles 세션 키 아래의 대화 기록은 이어지지 않습니다.

## 함께 보기

- [BlueBubbles에서 이전하기](/ko/channels/imessage-from-bluebubbles)
- [iMessage](/ko/channels/imessage)
- [구성 참조 - iMessage](/ko/gateway/config-channels#imessage)
