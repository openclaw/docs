---
read_when:
    - 타사 OpenClaw Plugin을 찾으려는 경우
    - 자신의 Plugin을 게시하거나 등록하려는 경우
summary: '커뮤니티에서 관리하는 OpenClaw Plugin: 찾아보고, 설치하고, 직접 제출하기'
title: 커뮤니티 Plugin
x-i18n:
    generated_at: "2026-05-02T20:57:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

커뮤니티 Plugin은 새 채널, 도구, 공급자 또는 기타 기능으로 OpenClaw를 확장하는 타사 패키지입니다. 커뮤니티가 빌드하고 유지 관리하며, 보통 [ClawHub](/ko/tools/clawhub)에 게시되고 단일 명령으로 설치할 수 있습니다. ClawHub 팩 설치가 배포되는 동안, 순수 패키지 명세의 기본 실행값은 계속 Npm입니다.

ClawHub는 커뮤니티 Plugin을 찾는 표준 검색 표면입니다. 검색 가능성을 위해 여기에 Plugin을 추가하려고 문서 전용 PR을 열지 마세요. 대신 ClawHub에 게시하세요.

```bash
openclaw plugins install clawhub:<package-name>
```

npm에서 호스팅되는 패키지에는 `openclaw plugins install <package-name>`를 사용하세요.

## 등록된 Plugin

### Apify

20,000개 이상의 바로 사용 가능한 스크레이퍼로 모든 웹사이트에서 데이터를 스크레이핑하세요. 요청만으로 에이전트가 Instagram, Facebook, TikTok, YouTube, Google Maps, Google Search, 전자상거래 사이트 등에서 데이터를 추출하게 할 수 있습니다.

- **npm:** `@apify/apify-openclaw-plugin`
- **저장소:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex 앱 서버 브리지

Codex App Server 대화를 위한 독립 OpenClaw 브리지입니다. 채팅을 Codex 스레드에 연결하고, 일반 텍스트로 대화하며, 재개, 계획, 리뷰, 모델 선택, Compaction 등을 위한 채팅 네이티브 명령으로 제어할 수 있습니다.

- **npm:** `openclaw-codex-app-server`
- **저장소:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream 모드를 사용하는 엔터프라이즈 로봇 통합입니다. 모든 DingTalk 클라이언트를 통해 텍스트, 이미지, 파일 메시지를 지원합니다.

- **npm:** `@largezhou/ddingtalk`
- **저장소:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw용 무손실 컨텍스트 관리 Plugin입니다. 증분 Compaction을 사용하는 DAG 기반 대화 요약으로, 토큰 사용량을 줄이면서 전체 컨텍스트 충실도를 보존합니다.

- **npm:** `@martian-engineering/lossless-claw`
- **저장소:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

에이전트 추적을 Opik으로 내보내는 공식 Plugin입니다. 에이전트 동작, 비용, 토큰, 오류 등을 모니터링하세요.

- **npm:** `@opik/opik-openclaw`
- **저장소:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw 에이전트에 실시간 립싱크, 감정 표현, 텍스트 음성 변환이 포함된 Live2D 아바타를 제공하세요. AI 애셋 생성을 위한 제작자 도구와 Prometheus Marketplace로의 원클릭 배포가 포함됩니다. 현재 알파 단계입니다.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **저장소:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

QQ Bot API를 통해 OpenClaw를 QQ에 연결하세요. 비공개 채팅, 그룹 멘션, 채널 메시지, 음성, 이미지, 동영상, 파일을 포함한 리치 미디어를 지원합니다.

현재 OpenClaw 릴리스에는 QQ Bot이 번들로 포함되어 있습니다. 일반 설치에는 [QQ Bot](/ko/channels/qqbot)의 번들 설정을 사용하세요. Tencent가 유지 관리하는 독립 실행형 패키지를 의도적으로 사용하려는 경우에만 이 외부 Plugin을 설치하세요.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **저장소:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom 팀의 OpenClaw용 WeCom 채널 Plugin입니다. WeCom Bot WebSocket 영구 연결을 기반으로 하며, 다이렉트 메시지와 그룹 채팅, 스트리밍 응답, 선제적 메시징, 이미지/파일 처리, Markdown 서식, 내장 액세스 제어, 문서/회의/메시징 Skills를 지원합니다.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **저장소:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Tencent Yuanbao 팀의 OpenClaw용 Yuanbao 채널 Plugin입니다. WebSocket 영구 연결을 기반으로 하며, 다이렉트 메시지와 그룹 채팅, 스트리밍 응답, 선제적 메시징, 이미지/파일/오디오/동영상 처리, Markdown 서식, 내장 액세스 제어, 슬래시 명령 메뉴를 지원합니다.

- **npm:** `openclaw-plugin-yuanbao`
- **저장소:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Plugin 제출

유용하고 문서화되어 있으며 안전하게 운영할 수 있는 커뮤니티 Plugin을 환영합니다.

<Steps>
  <Step title="ClawHub 또는 npm에 게시">
    Plugin은 `openclaw plugins install \<package-name\>`로 설치할 수 있어야 합니다.
    npm 전용 배포가 특별히 필요한 경우가 아니라면 [ClawHub](/ko/tools/clawhub)에 게시하세요.
    전체 가이드는 [Plugin 빌드](/ko/plugins/building-plugins)를 참고하세요.

  </Step>

  <Step title="GitHub에서 호스팅">
    소스 코드는 설정 문서와 이슈 트래커가 포함된 공개 저장소에 있어야 합니다.

  </Step>

  <Step title="문서 PR은 소스 문서 변경에만 사용">
    Plugin을 검색 가능하게 만들기 위해 문서 PR이 필요하지 않습니다. 대신 ClawHub에 게시하세요.

    설치 안내 수정이나 기본 문서 세트에 속하는 교차 저장소 문서 추가처럼 OpenClaw의 소스 문서에 실제 콘텐츠 변경이 필요한 경우에만 문서 PR을 여세요.

  </Step>
</Steps>

## 품질 기준

| 요구 사항                   | 이유                                          |
| --------------------------- | --------------------------------------------- |
| ClawHub 또는 npm에 게시됨   | 사용자가 `openclaw plugins install`을 사용할 수 있어야 함 |
| 공개 GitHub 저장소          | 소스 리뷰, 이슈 추적, 투명성                 |
| 설정 및 사용 문서           | 사용자가 구성 방법을 알아야 함               |
| 활발한 유지 관리            | 최근 업데이트 또는 신속한 이슈 처리          |

노력이 부족한 래퍼, 소유권이 불명확한 패키지, 유지 관리되지 않는 패키지는 거절될 수 있습니다.

## 관련

- [Plugin 설치 및 구성](/ko/tools/plugin) — 모든 Plugin을 설치하는 방법
- [Plugin 빌드](/ko/plugins/building-plugins) — 직접 만들기
- [Plugin 매니페스트](/ko/plugins/manifest) — 매니페스트 스키마
