---
read_when:
    - Hostinger에서 OpenClaw 설정하기
    - OpenClaw용 관리형 VPS를 찾고 있습니다
    - Hostinger 1-Click OpenClaw 사용하기
summary: Hostinger에 OpenClaw 호스팅하기
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T14:04:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

[Hostinger](https://www.hostinger.com/openclaw)에서 **1-Click** 관리형 배포 또는 **VPS** 설치를 통해 지속적으로 실행되는 OpenClaw Gateway를 운영하세요.

## 사전 요구 사항

- Hostinger 계정([signup](https://www.hostinger.com/openclaw))
- 약 5~10분

## 옵션 A: 1-Click OpenClaw

가장 빠르게 시작하는 방법입니다. Hostinger가 인프라, Docker, 자동 업데이트를 처리합니다.

<Steps>
  <Step title="구매 및 실행">
    1. [Hostinger OpenClaw 페이지](https://www.hostinger.com/openclaw)에서 Managed OpenClaw 플랜을 선택하고 결제를 완료합니다.

    <Note>
    결제 중에 미리 구매되어 OpenClaw 내부에 즉시 통합되는 **Ready-to-Use AI** 크레딧을 선택할 수 있습니다. 외부 계정이나 다른 provider의 API key 없이도 바로 대화를 시작할 수 있습니다. 또는 설정 중에 Anthropic, OpenAI, Google Gemini, xAI의 자체 키를 제공할 수 있습니다.
    </Note>

  </Step>

  <Step title="메시징 채널 선택">
    연결할 채널을 하나 이상 선택하세요:

    - **WhatsApp** -- 설정 마법사에 표시되는 QR 코드를 스캔합니다.
    - **Telegram** -- [BotFather](https://t.me/BotFather)의 bot 토큰을 붙여넣습니다.

  </Step>

  <Step title="설치 완료">
    **Finish**를 클릭해 인스턴스를 배포합니다. 준비가 완료되면 hPanel의 **OpenClaw Overview**에서 OpenClaw 대시보드에 접근합니다.
  </Step>

</Steps>

## 옵션 B: VPS의 OpenClaw

서버를 더 세밀하게 제어할 수 있습니다. Hostinger가 VPS에 Docker를 통해 OpenClaw를 배포하고, 사용자는 hPanel의 **Docker Manager**를 통해 관리합니다.

<Steps>
  <Step title="VPS 구매">
    1. [Hostinger OpenClaw 페이지](https://www.hostinger.com/openclaw)에서 OpenClaw on VPS 플랜을 선택하고 결제를 완료합니다.

    <Note>
    결제 중에 **Ready-to-Use AI** 크레딧을 선택할 수 있습니다. 이 크레딧은 미리 구매되어 OpenClaw 내부에 즉시 통합되므로 외부 계정이나 다른 provider의 API key 없이도 대화를 시작할 수 있습니다.
    </Note>

  </Step>

  <Step title="OpenClaw 구성">
    VPS가 프로비저닝되면 구성 필드를 입력합니다:

    - **Gateway token** -- 자동 생성되며 나중에 사용할 수 있도록 저장해 두세요.
    - **WhatsApp number** -- 국가 코드를 포함한 본인 번호(선택 사항).
    - **Telegram bot token** -- [BotFather](https://t.me/BotFather)에서 가져옵니다(선택 사항).
    - **API keys** -- 결제 중 Ready-to-Use AI 크레딧을 선택하지 않은 경우에만 필요합니다.

  </Step>

  <Step title="OpenClaw 시작">
    **Deploy**를 클릭합니다. 실행되면 hPanel에서 **Open**을 클릭해 OpenClaw 대시보드를 엽니다.
  </Step>

</Steps>

로그, 재시작, 업데이트는 모두 hPanel의 Docker Manager 인터페이스에서 직접 관리합니다. 업데이트하려면 Docker Manager에서 **Update**를 누르면 최신 이미지가 pull됩니다.

## 설정 확인

연결한 채널에서 assistant에게 "Hi"를 보내세요. OpenClaw가 응답하고 초기 환경설정을 안내합니다.

## 문제 해결

**대시보드가 로드되지 않음** -- 컨테이너 프로비저닝이 끝날 때까지 몇 분 기다리세요. hPanel의 Docker Manager 로그를 확인하세요.

**Docker 컨테이너가 계속 재시작됨** -- Docker Manager 로그를 열고 구성 오류(토큰 누락, 잘못된 API key)를 확인하세요.

**Telegram bot이 응답하지 않음** -- 연결을 완료하려면 Telegram의 pairing 코드 메시지를 OpenClaw 채팅 안에 직접 메시지로 보내세요.

## 다음 단계

- [채널](/ko/channels) -- Telegram, WhatsApp, Discord 등 연결
- [Gateway configuration](/ko/gateway/configuration) -- 모든 구성 옵션
