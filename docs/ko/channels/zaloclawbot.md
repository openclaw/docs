---
read_when:
    - QR 코드 로그인 기능이 있는 개인용 Zalo 어시스턴트 봇을 원합니다
    - openclaw-zaloclawbot 채널 Plugin을 설치하거나 문제를 해결하고 있습니다
summary: 외부 openclaw-zaloclawbot Plugin을 통한 Zalo ClawBot 채널 설정
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-27T17:13:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw는 카탈로그에 등록된 외부
`@zalo-platforms/openclaw-zaloclawbot` Plugin을 통해 Zalo ClawBot에 연결합니다. 로그인은 Zalo Mini App QR
코드를 사용합니다.

## 호환성

| Plugin 버전 | OpenClaw 버전 | npm dist-tag | 상태        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.x          | >=2026.4.10      | `latest`     | 활성 / 베타 |

## 필수 조건

- Node.js **>= 22**
- [OpenClaw](https://docs.openclaw.ai/install)가 설치되어 있어야 합니다(`openclaw` CLI 사용 가능).
- 로그인 QR 코드를 스캔할 모바일 기기의 Zalo 계정.

## onboard로 설치(권장)

OpenClaw 온보딩 마법사를 실행하고 채널 메뉴에서 **Zalo ClawBot**을 선택합니다.

```bash
openclaw onboard
```

마법사는 공식 카탈로그에서 Plugin을 설치하고(무결성 검증), 터미널에 로그인 QR을 바로 표시하며, Zalo 앱으로 스캔하면 채널 설정을 완료합니다. 추가 명령은 필요하지 않습니다.

## 수동 설치

이미 온보딩된 Gateway에 채널을 추가하려면 다음 단계를 따르세요.

### 1. Plugin 설치

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

위에 표시된 정확한 고정 버전을 사용하세요(공식 카탈로그 항목과 일치). 그러면 OpenClaw가 설치 중에 카탈로그 무결성 해시와 대조해 패키지를 검증합니다.

### 2. 구성에서 Plugin 활성화

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. QR 코드 생성 및 로그인

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Zalo 모바일 앱으로 터미널에 표시된 QR 코드를 스캔하고, Zalo Mini App 안에서 이용 약관에 동의한 다음 세션을 승인합니다.

### 4. Gateway 재시작

```bash
openclaw gateway restart
```

---

## 작동 방식

자체 Zalo Official Account(OA)를 등록하고 정적 개발자 자격 증명을 붙여 넣어야 하는 표준 개발자 Zalo 채널과 달리, Zalo ClawBot은 공유 공식 인프라를 사용하는 **소유자 귀속 개인 비서**로 작동합니다.

1. **보안 온보딩:** QR 코드는 공유 공식 OA 아래 새로 프로비저닝된 비공개 봇을 사용자의 Zalo User ID에 직접 바인딩하는 안전한 Zalo Mini App으로 연결됩니다.
2. **소유자 귀속 개인정보 보호:** 설계상 봇은 _오직_ 소유자와만 통신하도록 제한됩니다. 다른 사용자의 메시지는 플랫폼 수준에서 삭제되므로 연결이 비공개로 안전하게 유지됩니다.
3. **공식 API 경로:** Plugin은 브라우저나 웹 세션 자동화 대신
   Zalo Bot Platform API를 사용합니다.

## 내부 구조

Zalo ClawBot Plugin은 지속적인 롱 폴링 메시지 루프를 통해 Zalo API와 통신합니다. 깔끔하고 가벼운 런타임을 유지하기 위해 다음과 같이 동작합니다.

- 롱 폴 연결은 `getUpdates` 엔드포인트를 사용합니다.
- 로컬 데스크톱/터미널 Gateway 실행에서는 Webhook이 기본적으로 비활성화됩니다.
- 메시지는 클라이언트 측에서 처리되며 로컬 에이전트 런타임에 직접 매핑됩니다.

외부 Plugin은 OpenClaw 상태 디렉터리 아래에서 봇 자격 증명을 관리합니다.
해당 디렉터리를 민감한 것으로 취급하고, 나머지 OpenClaw 상태와 동일한 접근 제어 및
백업 정책에 포함하세요.

---

## 문제 해결

- **QR 로그인 시간 초과:** 로그인 토큰(`zbsk`)은 보안상의 이유로 5분 후 만료됩니다. 스캔하기 전에 QR 코드가 만료되면 로그인 명령을 다시 실행해 새 코드를 생성하면 됩니다.
- **Gateway 로드 실패:** OpenClaw 호스트 버전이 `2026.4.10` 이상인지 확인하세요. 이전 버전은 외부 npm Plugin 설치 원장을 지원하지 않습니다.
