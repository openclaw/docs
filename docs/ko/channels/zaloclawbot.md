---
read_when:
    - QR 코드 로그인 기능을 갖춘 개인용 Zalo 어시스턴트 봇이 필요합니다
    - openclaw-zaloclawbot 채널 Plugin을 설치하거나 문제를 해결하고 있습니다.
summary: 외부 openclaw-zaloclawbot Plugin을 통한 Zalo ClawBot 채널 설정
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-12T15:01:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw는 카탈로그에 등록된 외부 `@zalo-platforms/openclaw-zaloclawbot` Plugin을 통해 Zalo ClawBot에 연결됩니다. 로그인에는 Zalo Mini App QR 코드를 사용하며, 구성의 Plugin ID는 `openclaw-zaloclawbot`입니다.

## 호환성

| Plugin 버전 | OpenClaw 버전 | npm dist-tag | 상태          |
| ----------- | ------------- | ------------ | ------------- |
| 0.1.4       | >=2026.4.10   | `latest`     | 활성 / 베타   |

## 사전 요구 사항

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install)가 설치되어 있어야 합니다(`openclaw` CLI 사용 가능).
- 로그인 QR 코드를 스캔할 수 있도록 모바일 기기에 로그인된 Zalo 계정이 있어야 합니다.

## 온보딩으로 설치(권장)

```bash
openclaw onboard
```

채널 메뉴에서 **Zalo ClawBot**을 선택하십시오. 마법사가 공식 카탈로그에서 Plugin을 설치하고(무결성 검증), 터미널에 로그인 QR 코드를 표시한 다음, Zalo 앱으로 코드를 스캔하면 채널 설정을 완료합니다.

## 수동 설치

이미 온보딩된 Gateway에 채널을 추가하려면 다음을 수행하십시오.

### 1. Plugin 설치

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

OpenClaw가 설치 중 패키지를 카탈로그 무결성 해시와 대조하여 검증할 수 있도록 정확히 고정된 버전을 사용하십시오.

### 2. 구성에서 Plugin 활성화

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. QR 코드 생성 및 로그인

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

터미널에 표시된 QR 코드를 Zalo 모바일 앱으로 스캔하고, Zalo Mini App 내의 이용 약관에 동의한 다음 세션을 승인하십시오.

### 4. Gateway 재시작

```bash
openclaw gateway restart
```

## 작동 방식

자체 Zalo Official Account(OA)를 등록하고 정적 개발자 자격 증명을 구성해야 하는 표준 Zalo 채널과 달리, Zalo ClawBot은 공유 공식 인프라에서 작동하는 **소유자 전용 개인 비서**입니다.

1. **온보딩:** QR 코드를 열면 Zalo Mini App으로 연결되며, 공유 공식 OA 아래에 새로 프로비저닝된 비공개 봇을 사용자의 Zalo 사용자 ID에 직접 연결합니다.
2. **소유자 전용 개인정보 보호:** 봇은 소유자와만 통신합니다. 다른 사용자의 메시지는 플랫폼 수준에서 삭제됩니다.
3. **공식 API 경로:** Plugin은 브라우저 또는 웹 세션 자동화가 아닌 Zalo Bot Platform API를 사용합니다.

## 내부 작동 방식

Plugin은 지속적인 롱 폴링 루프(`getUpdates`)를 통해 Zalo와 통신합니다. 로컬 데스크톱/터미널 Gateway 실행에서는 Webhook이 기본적으로 비활성화됩니다. 메시지는 클라이언트 측에서 처리되어 로컬 에이전트 런타임에 매핑됩니다.

Plugin은 OpenClaw 상태 디렉터리에서 봇 자격 증명을 관리합니다. 해당 디렉터리를 민감한 정보로 취급하고 나머지 OpenClaw 상태와 동일한 액세스 제어 및 백업 정책을 적용하십시오.

이 Plugin의 런타임은 전적으로 외부 `@zalo-platforms/openclaw-zaloclawbot` 패키지에 있습니다. 아래의 설치/구성 이외 동작 세부 정보는 Plugin 유지관리자가 보고한 내용이며 OpenClaw 코어 소스와 대조하여 검증되지 않았습니다.

## 문제 해결

- **QR 로그인 시간 초과:** 보안을 위해 로그인 토큰(`zbsk`)은 5분 후 만료됩니다. 스캔하기 전에 QR 코드가 만료되면 로그인 명령을 다시 실행하여 새 코드를 생성하십시오.
- **Gateway 로드 실패:** OpenClaw 호스트 버전이 `2026.4.10` 이상인지 확인하십시오. 이전 버전은 이 ID에 필요한 외부 npm Plugin 설치 원장을 지원하지 않습니다.

## 관련 항목

- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [Zalo](/ko/channels/zalo) - 번들로 제공되는 Zalo Bot Creator / Marketplace 채널
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 흐름
- [Plugin](/ko/tools/plugin) - Plugin 설치 및 관리
