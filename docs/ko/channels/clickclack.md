---
read_when:
    - OpenClaw를 ClickClack 워크스페이스에 연결하기
    - ClickClack 봇 ID 테스트하기
summary: ClickClack 봇 토큰 채널 설정 및 대상 구문
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack은 일급 ClickClack 봇 토큰을 통해 OpenClaw를 자체 호스팅 ClickClack 워크스페이스에 연결합니다.

OpenClaw 에이전트가 ClickClack 봇 사용자로 표시되도록 하려면 이 기능을 사용하세요. ClickClack은 독립 서비스 봇과 사용자 소유 봇을 지원합니다. 사용자 소유 봇은 `owner_user_id`를 유지하며, 사용자가 부여한 토큰 범위만 받습니다.

## 빠른 설정

ClickClack에서 봇 토큰을 생성합니다.

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

사용자 소유 봇의 경우 `--owner <user_id>`를 추가합니다.

OpenClaw를 구성합니다.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

그런 다음 실행합니다.

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

`plugins.allow`가 비어 있지 않은 제한 목록이면, 채널 설정에서 ClickClack을 명시적으로 선택하거나 `openclaw plugins enable clickclack`을 실행할 때 해당 목록에 `clickclack`이 추가됩니다. 온보딩 설치도 동일한 명시적 선택 동작을 사용합니다. 이러한 경로는 `plugins.deny` 또는 전역 `plugins.enabled: false` 설정을 재정의하지 않습니다. 직접 `openclaw plugins install @openclaw/clickclack`을 실행하면 일반 플러그인 설치 정책을 따르며, 기존 허용 목록에도 ClickClack을 기록합니다.

## 여러 봇

각 계정은 자체 ClickClack 실시간 연결을 열고 자체 봇 토큰을 사용합니다.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"`은 짧은 봇 답장을 위해 `api.runtime.llm.complete`를 직접 사용합니다.
계정에서 `agentId`를 설정하면, 플러그인이 해당 봇 에이전트에 대해 완료를 실행할 수 있도록 OpenClaw는 명시적인 `plugins.entries.clickclack.llm.allowAgentIdOverride` 신뢰 비트를 요구합니다. 기본 에이전트 경로만 사용하는 경우에는 꺼 둡니다.

## 대상

- `channel:<name-or-id>`는 워크스페이스 채널로 보냅니다. 접두사가 없는 대상은 기본적으로 `channel:`이 적용됩니다.
- `dm:<user_id>`는 해당 사용자와의 직접 대화를 만들거나 재사용합니다.
- `thread:<message_id>`는 기존 스레드에 답장합니다.

예:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 권한

ClickClack 토큰 범위는 ClickClack API에서 적용됩니다.

- `bot:read`: 워크스페이스/채널/메시지/스레드/DM/실시간/프로필 데이터를 읽습니다.
- `bot:write`: `bot:read`에 더해 채널 메시지, 스레드 답장, DM, 업로드를 허용합니다.
- `bot:admin`: `bot:write`에 더해 채널 생성을 허용합니다.

OpenClaw는 일반 에이전트 채팅에 `bot:write`만 필요합니다.

## 문제 해결

- `ClickClack is not configured`: `channels.clickclack.token` 또는 `CLICKCLACK_BOT_TOKEN`을 설정합니다.
- `workspace not found`: `workspace`를 ClickClack에서 반환한 워크스페이스 ID 또는 슬러그로 설정합니다.
- 인바운드 답장이 없음: 토큰에 실시간 읽기 권한이 있고 봇이 자신의 메시지에 답장하지 않는지 확인합니다.
- 채널 전송 실패: 봇이 워크스페이스의 멤버이고 `bot:write`를 가지고 있는지 확인합니다.
