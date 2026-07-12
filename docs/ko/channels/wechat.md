---
read_when:
    - OpenClaw을 WeChat 또는 Weixin에 연결하려고 합니다
    - openclaw-weixin 채널 Plugin을 설치하거나 문제를 해결하고 있습니다.
    - 외부 채널 Plugin이 Gateway와 함께 실행되는 방식을 이해해야 합니다.
summary: 외부 openclaw-weixin Plugin을 통한 WeChat 채널 설정
title: WeChat
x-i18n:
    generated_at: "2026-07-12T14:59:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw은 Tencent의 외부
`@tencent-weixin/openclaw-weixin` 채널 Plugin을 통해 WeChat에 연결합니다.

상태: Tencent Weixin 팀이 유지 관리하는 외부 Plugin입니다. 일대일 채팅과
미디어를 지원합니다. 그룹 채팅은 Plugin 기능 메타데이터에 명시되어 있지
않습니다(일대일 채팅만 선언합니다).

## 명칭

- **WeChat**은 이 문서에서 사용자에게 표시되는 이름입니다.
- **Weixin**은 Tencent 패키지와 Plugin ID에서 사용하는 이름입니다.
- `openclaw-weixin`은 OpenClaw 채널 ID입니다(`weixin`과 `wechat`도 별칭으로 작동합니다).
- `@tencent-weixin/openclaw-weixin`은 npm 패키지입니다.

CLI 명령과 구성 경로에서는 `openclaw-weixin`을 사용하십시오.

## 작동 방식

WeChat 코드는 OpenClaw 코어 저장소에 포함되어 있지 않습니다. OpenClaw은
범용 채널 Plugin 계약을 제공하고, 외부 Plugin은 WeChat 전용 런타임을
제공합니다.

1. `openclaw plugins install`은 `@tencent-weixin/openclaw-weixin`을 설치합니다.
2. Gateway가 Plugin 매니페스트를 검색하고 Plugin 진입점을 로드합니다.
3. Plugin이 채널 ID `openclaw-weixin`을 등록합니다.
4. `openclaw channels login --channel openclaw-weixin`이 QR 로그인을 시작합니다.
5. Plugin은 OpenClaw 상태 디렉터리 아래에 계정 자격 증명을 저장합니다
   (기본값은 `~/.openclaw`).
6. Gateway가 시작되면 Plugin은 구성된 각 계정의 Weixin 모니터를 시작합니다.
7. 수신 WeChat 메시지는 채널 계약을 통해 정규화되고 선택한 OpenClaw
   에이전트로 라우팅된 후 Plugin의 발신 경로를 통해 다시 전송됩니다.

이러한 분리는 중요합니다. OpenClaw 코어는 특정 채널에 종속되지 않습니다.
WeChat 로그인, Tencent iLink API 호출, 미디어 업로드/다운로드, 컨텍스트 토큰,
계정 모니터링은 외부 Plugin이 담당합니다.

## 설치

빠른 설치:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

수동 설치:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

설치 후 Gateway를 다시 시작하십시오.

```bash
openclaw gateway restart
```

## 로그인

Gateway를 실행하는 동일한 머신에서 QR 로그인을 실행하십시오.

```bash
openclaw channels login --channel openclaw-weixin
```

휴대전화의 WeChat으로 QR 코드를 스캔하고 로그인을 확인하십시오. 스캔에
성공하면 Plugin이 계정 토큰을 로컬에 저장합니다.

다른 WeChat 계정을 추가하려면 같은 로그인 명령을 다시 실행하십시오. 여러
계정을 사용하는 경우 계정, 채널, 발신자별로 일대일 메시지 세션을 격리하십시오.

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## 액세스 제어

일대일 메시지는 채널 Plugin에 대한 일반적인 OpenClaw 페어링 및 허용 목록
모델을 사용합니다.

새 발신자를 승인하십시오.

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

전체 액세스 제어 모델은 [페어링](/ko/channels/pairing)을 참조하십시오.

## 호환성

Plugin은 시작 시 호스트 OpenClaw 버전을 확인합니다.

| Plugin 계열 | OpenClaw 버전                                                  | npm 태그  |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (현재 2.4.6, 초기 2.x는 `>=2026.3.22` 허용)       | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Plugin에서 OpenClaw 버전이 너무 오래되었다고 보고하면 OpenClaw을
업데이트하거나 레거시 Plugin 계열을 설치하십시오.

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## 사이드카 프로세스

WeChat Plugin은 Tencent iLink API를 모니터링하는 동안 Gateway 옆에서 보조
작업을 실행할 수 있습니다. 이슈 #68451에서는 이 보조 경로로 인해 OpenClaw의
범용 비활성 Gateway 정리 버그가 드러났습니다. 하위 프로세스가 상위 Gateway
프로세스를 정리하려고 시도하여 systemd와 같은 프로세스 관리자에서 재시작
루프가 발생할 수 있었습니다.

현재 OpenClaw의 시작 정리는 현재 프로세스와 그 상위 프로세스를 제외하므로,
채널 보조 프로세스가 자신을 실행한 Gateway를 종료할 수 없습니다. 이 수정은
범용이며 코어에 있는 WeChat 전용 경로가 아닙니다.

## 문제 해결

설치 및 상태를 확인하십시오.

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

채널이 설치된 것으로 표시되지만 연결되지 않으면 Plugin이 활성화되어 있는지
확인하고 다시 시작하십시오.

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

WeChat을 활성화한 후 Gateway가 반복적으로 다시 시작되면 OpenClaw과 Plugin을
모두 업데이트하십시오.

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

시작 시 설치된 Plugin 패키지에 `requires compiled runtime
output for TypeScript entry`가 필요하다고 보고되면, npm 패키지가 OpenClaw에
필요한 컴파일된 JavaScript 런타임 파일 없이 게시된 것입니다. Plugin 게시자가
수정된 패키지를 배포한 후 업데이트하거나 다시 설치하십시오. 또는 Plugin을
일시적으로 비활성화하거나 제거하십시오.

일시적으로 비활성화:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## 관련 문서

- 채널 개요: [채팅 채널](/ko/channels)
- 페어링: [페어링](/ko/channels/pairing)
- 채널 라우팅: [채널 라우팅](/ko/channels/channel-routing)
- Plugin 아키텍처: [Plugin 아키텍처](/ko/plugins/architecture)
- 채널 Plugin SDK: [채널 Plugin SDK](/ko/plugins/sdk-channel-plugins)
- 외부 패키지: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
