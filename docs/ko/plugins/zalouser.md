---
read_when:
    - OpenClaw에서 Zalo Personal(비공식) 지원을 사용하려고 합니다
    - zalouser Plugin을 구성하거나 개발하고 있습니다.
summary: 'Zalo Personal Plugin: 네이티브 zca-js를 통한 QR 로그인 + 메시징(Plugin 설치 + 채널 구성 + 도구)'
title: Zalo 개인용 Plugin
x-i18n:
    generated_at: "2026-07-12T15:33:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

OpenClaw에서 네이티브 `zca-js`를 사용하여 일반 Zalo 사용자 계정을
자동화하는 Plugin을 통해 Zalo Personal을 지원합니다. 외부 `zca`/`openzca` CLI 바이너리는
필요하지 않습니다.

<Warning>
비공식 자동화로 인해 계정이 정지되거나 차단될 수 있습니다. 위험을 감수하고 사용하십시오.
</Warning>

## 명명

채널 ID는 비공식적인 **개인 Zalo 사용자 계정**을 자동화한다는 점을
명확히 나타내기 위해 `zalouser`입니다. 별도의 `zalo` 채널 ID는 공식적으로
번들되는 Zalo Bot/Webhook 통합입니다. 자세한 내용은 [Zalo](/ko/channels/zalo)를 참조하십시오.

## 실행 위치

이 Plugin은 **Gateway 프로세스 내부**에서 실행됩니다. 원격 Gateway를 사용하는 경우
해당 호스트에 설치하고 구성한 다음 Gateway를 다시 시작하십시오.

## 설치

### npm에서 설치

```bash
openclaw plugins install @openclaw/zalouser
```

현재 공식 릴리스 태그를 따르려면 버전 없는 패키지 이름을 사용하고, 재현 가능한
설치가 필요한 경우에만 정확한 버전을 고정하십시오. 이후 Gateway를
다시 시작하십시오.

### 로컬 폴더에서 설치(개발용)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

이후 Gateway를 다시 시작하십시오.

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

DM/그룹 접근 제어, 다중 계정 설정, 환경 변수 및 문제 해결에 대해서는
[Zalo 개인 채널 구성](/ko/channels/zalouser)을 참조하십시오.

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "OpenClaw에서 보내는 인사"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "이름"
openclaw directory groups list --channel zalouser --query "이름"
openclaw directory groups members --channel zalouser --group-id <id>
```

## 에이전트 도구

도구 이름: `zalouser`

작업: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

채널 메시지 작업(에이전트 도구가 아님)은 메시지
반응을 위한 `react`도 지원합니다.

## 관련 문서

- [Zalo 개인 채널 구성](/ko/channels/zalouser)
- [Zalo(공식 Bot/Webhook 채널)](/ko/channels/zalo)
- [Plugin 빌드](/ko/plugins/building-plugins)
- [ClawHub](/clawhub)
