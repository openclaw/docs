---
read_when:
    - OpenClaw에서 Zalo Personal(비공식) 지원을 원합니다
    - zalouser Plugin을 구성하거나 개발하고 있습니다
summary: 'Zalo Personal Plugin: 네이티브 zca-js를 통한 QR 로그인 + 메시징(Plugin 설치 + 채널 구성 + 도구)'
title: Zalo 개인 Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

Zalo 개인 계정을 위한 OpenClaw 지원을 Plugin으로 제공하며, 네이티브 `zca-js`를 사용해 일반 Zalo 사용자 계정을 자동화합니다.

<Warning>
비공식 자동화는 계정 정지 또는 차단으로 이어질 수 있습니다. 본인 책임하에 사용하세요.
</Warning>

## 명명

채널 ID는 `zalouser`이며, 이는 **개인 Zalo 사용자 계정**(비공식)을 자동화한다는 점을 명확히 하기 위한 것입니다. `zalo`는 향후 공식 Zalo API 통합 가능성을 위해 예약해 둡니다.

## 실행 위치

이 Plugin은 **Gateway 프로세스 내부**에서 실행됩니다.

원격 Gateway를 사용하는 경우, **Gateway를 실행하는 머신**에 설치/구성한 다음 Gateway를 다시 시작하세요.

외부 `zca`/`openzca` CLI 바이너리는 필요하지 않습니다.

## 설치

### 옵션 A: npm에서 설치

```bash
openclaw plugins install @openclaw/zalouser
```

현재 공식 릴리스 태그를 따르려면 bare 패키지를 사용하세요. 재현 가능한 설치가 필요할 때만 정확한
버전을 고정하세요.

이후 Gateway를 다시 시작하세요.

### 옵션 B: 로컬 폴더에서 설치(개발)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

이후 Gateway를 다시 시작하세요.

## 구성

채널 구성은 `channels.zalouser` 아래에 있습니다(`plugins.entries.*`가 아님).

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## 에이전트 도구

도구 이름: `zalouser`

작업: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

채널 메시지 작업은 메시지 반응을 위해 `react`도 지원합니다.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins)
- [커뮤니티 Plugin](/ko/plugins/community)
