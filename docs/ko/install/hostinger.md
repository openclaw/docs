---
read_when:
    - Hostinger에서 OpenClaw 설정하기
    - OpenClaw용 관리형 VPS 찾기
    - Hostinger 원클릭 OpenClaw 사용하기
summary: Hostinger에서 OpenClaw 호스팅하기
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T00:50:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

[Hostinger](https://www.hostinger.com/openclaw)에서 지속적으로 실행되는 OpenClaw Gateway를 운영하세요. **1-Click** 관리형 배포 또는 직접 관리하는 **VPS** 설치 방식 중 하나를 선택할 수 있습니다.

## 사전 요구 사항

- Hostinger 계정([가입](https://www.hostinger.com/openclaw))
- 약 5~10분

## 옵션 A: 1-Click OpenClaw

Hostinger가 인프라, Docker 및 자동 업데이트를 처리합니다. 실행 중인 인스턴스를 가장 빠르게 구축하는 방법입니다.

<Steps>
  <Step title="구매 및 시작">
    1. [Hostinger OpenClaw 페이지](https://www.hostinger.com/openclaw)에서 관리형 OpenClaw 요금제를 선택하고 결제를 완료합니다.

    <Note>
    결제 중에 미리 구매되어 OpenClaw에 즉시 통합되는 **Ready-to-Use AI** 크레딧을 선택할 수 있습니다. 다른 제공업체의 외부 계정이나 API 키가 필요하지 않으며 바로 채팅을 시작할 수 있습니다. 또는 설정 중에 Anthropic, OpenAI, Google Gemini 또는 xAI의 자체 키를 입력할 수 있습니다.
    </Note>

  </Step>

  <Step title="메시징 채널 선택">
    연결할 채널을 하나 이상 선택합니다.

    - **WhatsApp** -- 설정 마법사에 표시된 QR 코드를 스캔합니다.
    - **Telegram** -- [BotFather](https://t.me/BotFather)에서 받은 봇 토큰을 붙여 넣습니다.

  </Step>

  <Step title="설치 완료">
    **Finish**를 클릭하여 인스턴스를 배포합니다. 준비가 완료되면 hPanel의 **OpenClaw Overview**에서 OpenClaw 대시보드에 접속합니다.
  </Step>

</Steps>

## 옵션 B: VPS의 OpenClaw

서버를 더 세밀하게 제어할 수 있습니다. Hostinger는 VPS에 Docker를 통해 OpenClaw를 배포하며, 사용자는 hPanel의 **Docker Manager**를 통해 관리합니다.

<Steps>
  <Step title="VPS 구매">
    1. [Hostinger OpenClaw 페이지](https://www.hostinger.com/openclaw)에서 VPS용 OpenClaw 요금제를 선택하고 결제를 완료합니다.

    <Note>
    결제 중에 **Ready-to-Use AI** 크레딧을 선택할 수 있습니다. 이 크레딧은 미리 구매되어 OpenClaw에 즉시 통합되므로 다른 제공업체의 외부 계정이나 API 키 없이 채팅을 시작할 수 있습니다.
    </Note>

  </Step>

  <Step title="OpenClaw 구성">
    VPS 프로비저닝이 완료되면 구성 필드를 입력합니다.

    - **Gateway token** -- 자동으로 생성되며 나중에 사용할 수 있도록 저장합니다.
    - **WhatsApp number** -- 국가 코드를 포함한 전화번호입니다(선택 사항).
    - **Telegram bot token** -- [BotFather](https://t.me/BotFather)에서 받은 토큰입니다(선택 사항).
    - **API keys** -- 결제 중 Ready-to-Use AI 크레딧을 선택하지 않은 경우에만 필요합니다.

  </Step>

  <Step title="OpenClaw 시작">
    **Deploy**를 클릭합니다. 실행이 시작되면 hPanel에서 **Open**을 클릭하여 OpenClaw 대시보드를 엽니다.
  </Step>

</Steps>

로그 확인, 재시작 및 업데이트는 hPanel의 Docker Manager 인터페이스에서 수행합니다. 업데이트하려면 Docker Manager에서 **Update**를 눌러 최신 이미지를 가져옵니다.

## 설정 확인

연결한 채널에서 어시스턴트에게 "안녕하세요"라고 보냅니다. OpenClaw가 응답하고 초기 환경설정 과정을 안내합니다.

## 문제 해결

**대시보드가 로드되지 않음** -- 컨테이너 프로비저닝이 완료될 때까지 몇 분 정도 기다린 다음 hPanel에서 Docker Manager 로그를 확인합니다.

**Docker 컨테이너가 계속 재시작됨** -- Docker Manager 로그를 열고 구성 오류가 있는지 확인합니다(누락된 토큰, 유효하지 않은 API 키).

**Telegram 봇이 응답하지 않음** -- DM 페어링이 필요한 경우 알 수 없는 발신자는 응답 대신 짧은 페어링 코드를 받습니다. OpenClaw 대시보드 채팅에서 승인하거나, 컨테이너 셸에 접근할 수 있다면 `openclaw pairing approve telegram <CODE>`로 승인합니다. [페어링](/ko/channels/pairing)을 참조하세요.

## 다음 단계

- [채널](/ko/channels) -- Telegram, WhatsApp, Discord 등을 연결합니다
- [Gateway 구성](/ko/gateway/configuration) -- 모든 구성 옵션

## 관련 문서

- [설치 개요](/ko/install)
- [VPS 호스팅](/ko/vps)
- [DigitalOcean](/ko/install/digitalocean)
