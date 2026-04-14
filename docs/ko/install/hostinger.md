---
read_when:
    - Hostinger에서 OpenClaw 설정하기
    - OpenClaw용 관리형 VPS 찾기
    - Hostinger 1-Click OpenClaw 사용하기
summary: Hostinger에서 OpenClaw 호스팅하기
title: Hostinger
x-i18n:
    generated_at: "2026-04-14T02:08:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf173cdcf6344f8ee22e839a27f4e063a3a102186f9acc07c4a33d4794e2c034
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

**1-Click** 관리형 배포 또는 **VPS** 설치를 통해 [Hostinger](https://www.hostinger.com/openclaw)에서 지속적으로 실행되는 OpenClaw Gateway를 운영하세요.

## 사전 준비

- Hostinger 계정([가입](https://www.hostinger.com/openclaw))
- 약 5~10분

## 옵션 A: 1-Click OpenClaw

가장 빠르게 시작하는 방법입니다. Hostinger가 인프라, Docker, 자동 업데이트를 처리합니다.

<Steps>
  <Step title="구매 및 시작">
    1. [Hostinger OpenClaw 페이지](https://www.hostinger.com/openclaw)에서 Managed OpenClaw 요금제를 선택하고 결제를 완료합니다.

    <Note>
    결제 중에 미리 구매되어 OpenClaw 안에서 즉시 통합되는 **Ready-to-Use AI** 크레딧을 선택할 수 있습니다. 다른 제공업체의 외부 계정이나 API 키가 필요하지 않습니다. 바로 채팅을 시작할 수 있습니다. 또는 설정 중에 Anthropic, OpenAI, Google Gemini, 또는 xAI의 자체 키를 제공할 수도 있습니다.
    </Note>

  </Step>

  <Step title="메시징 채널 선택">
    연결할 채널을 하나 이상 선택합니다.

    - **WhatsApp** -- 설정 마법사에 표시되는 QR 코드를 스캔합니다.
    - **Telegram** -- [BotFather](https://t.me/BotFather)에서 받은 봇 토큰을 붙여넣습니다.

  </Step>

  <Step title="설치 완료">
    **Finish**를 클릭해 인스턴스를 배포합니다. 준비가 완료되면 hPanel의 **OpenClaw Overview**에서 OpenClaw 대시보드에 접속합니다.
  </Step>

</Steps>

## 옵션 B: VPS에서 OpenClaw

서버를 더 세밀하게 제어할 수 있습니다. Hostinger가 VPS에 Docker를 통해 OpenClaw를 배포하고, 사용자는 hPanel의 **Docker Manager**를 통해 이를 관리합니다.

<Steps>
  <Step title="VPS 구매">
    1. [Hostinger OpenClaw 페이지](https://www.hostinger.com/openclaw)에서 VPS용 OpenClaw 요금제를 선택하고 결제를 완료합니다.

    <Note>
    결제 중에 **Ready-to-Use AI** 크레딧을 선택할 수 있습니다. 이 크레딧은 미리 구매되어 OpenClaw 안에서 즉시 통합되므로, 다른 제공업체의 외부 계정이나 API 키 없이도 채팅을 시작할 수 있습니다.
    </Note>

  </Step>

  <Step title="OpenClaw 구성">
    VPS가 프로비저닝되면 구성 필드를 입력합니다.

    - **Gateway 토큰** -- 자동 생성되며, 나중에 사용할 수 있도록 저장해 두세요.
    - **WhatsApp 번호** -- 국가 코드를 포함한 본인 번호(선택 사항)
    - **Telegram 봇 토큰** -- [BotFather](https://t.me/BotFather)에서 발급(선택 사항)
    - **API 키** -- 결제 중 Ready-to-Use AI 크레딧을 선택하지 않은 경우에만 필요합니다.

  </Step>

  <Step title="OpenClaw 시작">
    **Deploy**를 클릭합니다. 실행이 시작되면 hPanel에서 **Open**을 클릭해 OpenClaw 대시보드를 엽니다.
  </Step>

</Steps>

로그, 재시작, 업데이트는 모두 hPanel의 Docker Manager 인터페이스에서 직접 관리합니다. 업데이트하려면 Docker Manager에서 **Update**를 누르면 최신 이미지를 가져옵니다.

## 설정 확인

연결한 채널에서 어시스턴트에게 "Hi"를 보내세요. OpenClaw가 응답하고 초기 환경 설정을 안내합니다.

## 문제 해결

**대시보드가 로드되지 않음** -- 컨테이너 프로비저닝이 완료될 때까지 몇 분 정도 기다리세요. hPanel의 Docker Manager 로그를 확인하세요.

**Docker 컨테이너가 계속 재시작됨** -- Docker Manager 로그를 열고 구성 오류(누락된 토큰, 잘못된 API 키)가 있는지 확인하세요.

**Telegram 봇이 응답하지 않음** -- 연결을 완료하려면 Telegram에서 받은 페어링 코드 메시지를 OpenClaw 채팅 안에 직접 메시지로 보내세요.

## 다음 단계

- [채널](/ko/channels) -- Telegram, WhatsApp, Discord 등 연결하기
- [Gateway 구성](/ko/gateway/configuration) -- 모든 구성 옵션
