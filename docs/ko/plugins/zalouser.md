---
read_when:
    - OpenClaw에서 Zalo Personal(비공식) 지원을 원합니다
    - zalouser Plugin을 구성하거나 개발하고 있습니다
summary: 'Zalo Personal Plugin: 네이티브 zca-js를 통한 QR 로그인 + 메시징(Plugin 설치 + 채널 구성 + 도구)'
title: Zalo 개인용 Plugin
x-i18n:
    generated_at: "2026-04-30T06:45:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

기본 `zca-js`를 사용해 일반 Zalo 사용자 계정을 자동화하는 Plugin을 통해 OpenClaw에서 Zalo Personal을 지원합니다.

<Warning>
비공식 자동화는 계정 정지 또는 차단으로 이어질 수 있습니다. 사용에 따른 책임은 사용자에게 있습니다.
</Warning>

## 이름 지정

채널 ID는 이것이 **개인 Zalo 사용자 계정**(비공식)을 자동화한다는 점을 명확히 하기 위해 `zalouser`입니다. 향후 공식 Zalo API 통합 가능성을 위해 `zalo`는 예약해 둡니다.

## 실행 위치

이 Plugin은 **Gateway 프로세스 내부**에서 실행됩니다.

원격 Gateway를 사용하는 경우 **Gateway를 실행하는 머신**에 설치/구성한 다음 Gateway를 다시 시작하세요.

외부 `zca`/`openzca` CLI 바이너리는 필요하지 않습니다.

## 설치

### 옵션 A: npm에서 설치

```bash
openclaw plugins install @openclaw/zalouser
```

npm에서 OpenClaw 소유 패키지가 deprecated로 표시되면 해당 패키지 버전은
이전 외부 패키지 계열의 것입니다. 더 최신 npm 패키지가 게시될 때까지 현재 패키징된 OpenClaw 빌드 또는
로컬 폴더 경로를 사용하세요.

그런 다음 Gateway를 다시 시작하세요.

### 옵션 B: 로컬 폴더에서 설치(dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

그런 다음 Gateway를 다시 시작하세요.

## 구성

채널 구성은 `plugins.entries.*`가 아니라 `channels.zalouser` 아래에 있습니다.

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

## Agent 도구

도구 이름: `zalouser`

작업: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

채널 메시지 작업은 메시지 반응을 위한 `react`도 지원합니다.

## 관련 항목

- [Plugin 빌드하기](/ko/plugins/building-plugins)
- [커뮤니티 Plugin](/ko/plugins/community)
