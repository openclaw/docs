---
read_when:
    - 타사 OpenClaw Plugin을 찾고 싶습니다
    - 자체 Plugin을 게시하거나 목록에 등록하려는 경우
summary: '커뮤니티에서 관리하는 OpenClaw Plugin: 둘러보고, 설치하고, 직접 만든 Plugin 제출하기'
title: 커뮤니티 Plugin
x-i18n:
    generated_at: "2026-04-30T09:34:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

커뮤니티 플러그인은 OpenClaw에 새로운
채널, 도구, 제공자 또는 기타 기능을 확장하는 서드파티 패키지입니다. 커뮤니티가 빌드하고 유지 관리하며,
일반적으로 [ClawHub](/ko/tools/clawhub)에 게시되고 단일 명령으로 설치할 수 있습니다.
아직 ClawHub로 이동하지 않은 패키지의 경우 npm은 계속 지원되는 대체 수단입니다.

ClawHub는 커뮤니티 플러그인의 공식 검색 표면입니다. 검색 가능성을 위해
여기에 플러그인을 추가하려고 문서 전용 PR을 열지 마세요. 대신 ClawHub에 게시하세요.

```bash
openclaw plugins install <package-name>
```

OpenClaw는 먼저 ClawHub를 확인하고 자동으로 npm으로 대체합니다.

## 등록된 플러그인

### Apify

20,000개 이상의 즉시 사용 가능한 스크레이퍼로 모든 웹사이트에서 데이터를 스크레이핑하세요. 에이전트가
Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, 전자상거래 사이트 등에서 데이터를 추출하게 할 수 있습니다. 요청하기만 하면 됩니다.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server 대화를 위한 독립 OpenClaw 브리지입니다. 채팅을
Codex 스레드에 바인딩하고, 일반 텍스트로 대화하며, 재개, 계획, 리뷰, 모델 선택, Compaction 등을 위한
채팅 네이티브 명령으로 제어할 수 있습니다.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream 모드를 사용하는 엔터프라이즈 로봇 통합입니다. 모든 DingTalk 클라이언트를 통해
텍스트, 이미지, 파일 메시지를 지원합니다.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw용 무손실 컨텍스트 관리 플러그인입니다. DAG 기반 대화
요약과 증분 Compaction으로, 토큰 사용량을 줄이면서 전체 컨텍스트 충실도를
보존합니다.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

에이전트 추적을 Opik으로 내보내는 공식 플러그인입니다. 에이전트 동작,
비용, 토큰, 오류 등을 모니터링하세요.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw 에이전트에 실시간 립싱크, 감정
표현, 텍스트 음성 변환이 포함된 Live2D 아바타를 부여하세요. AI 에셋 생성을 위한 크리에이터 도구와
Prometheus Marketplace로의 원클릭 배포를 포함합니다. 현재 알파 버전입니다.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

QQ Bot API를 통해 OpenClaw를 QQ에 연결합니다. 비공개 채팅, 그룹
멘션, 채널 메시지와 음성, 이미지, 동영상,
파일을 포함한 리치 미디어를 지원합니다.

현재 OpenClaw 릴리스에는 QQ Bot이 번들로 포함되어 있습니다. 일반 설치에는
[QQ Bot](/ko/channels/qqbot)의 번들 설정을 사용하세요. Tencent가 유지 관리하는 독립 패키지를 의도적으로 사용하려는 경우에만
이 외부 플러그인을 설치하세요.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom 팀이 만든 OpenClaw용 WeCom 채널 플러그인입니다.
WeCom Bot WebSocket 영구 연결을 기반으로 하며, 다이렉트 메시지와 그룹
채팅, 스트리밍 답변, 선제적 메시징, 이미지/파일 처리, Markdown
서식, 기본 제공 접근 제어, 문서/회의/메시징 Skills를 지원합니다.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Tencent Yuanbao 팀이 만든 OpenClaw용 Yuanbao 채널 플러그인입니다.
WebSocket 영구 연결을 기반으로 하며, 다이렉트 메시지와 그룹 채팅,
스트리밍 답변, 선제적 메시징, 이미지/파일/오디오/비디오 처리,
Markdown 서식, 기본 제공 접근 제어, 슬래시 명령 메뉴를 지원합니다.

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## 플러그인 제출

유용하고, 문서화되어 있으며, 안전하게 운영할 수 있는 커뮤니티 플러그인을 환영합니다.

<Steps>
  <Step title="ClawHub 또는 npm에 게시">
    플러그인은 `openclaw plugins install \<package-name\>`로 설치할 수 있어야 합니다.
    npm 전용 배포가 특별히 필요한 경우가 아니라면 [ClawHub](/ko/tools/clawhub)에
    게시하세요.
    전체 가이드는 [플러그인 빌드](/ko/plugins/building-plugins)를 참조하세요.

  </Step>

  <Step title="GitHub에 호스팅">
    소스 코드는 설정 문서와 이슈
    트래커가 있는 공개 저장소에 있어야 합니다.

  </Step>

  <Step title="소스 문서 변경에만 문서 PR 사용">
    플러그인을 검색 가능하게 만들기 위해 문서 PR이 필요하지 않습니다. 대신
    ClawHub에 게시하세요.

    설치 안내 수정이나 기본 문서 세트에 속하는 교차 저장소
    문서 추가처럼 OpenClaw의 소스 문서에 실제 콘텐츠
    변경이 필요한 경우에만 문서 PR을 여세요.

  </Step>
</Steps>

## 품질 기준

| 요구 사항                 | 이유                                           |
| --------------------------- | --------------------------------------------- |
| ClawHub 또는 npm에 게시됨 | 사용자는 `openclaw plugins install`이 동작해야 합니다 |
| 공개 GitHub 저장소          | 소스 리뷰, 이슈 추적, 투명성   |
| 설정 및 사용 문서        | 사용자는 구성 방법을 알아야 합니다        |
| 활발한 유지 관리          | 최근 업데이트 또는 신속한 이슈 처리   |

노력이 부족한 래퍼, 불분명한 소유권, 유지 관리되지 않는 패키지는 거절될 수 있습니다.

## 관련 항목

- [플러그인 설치 및 구성](/ko/tools/plugin) — 모든 플러그인을 설치하는 방법
- [플러그인 빌드](/ko/plugins/building-plugins) — 직접 만들기
- [Plugin Manifest](/ko/plugins/manifest) — 매니페스트 스키마
