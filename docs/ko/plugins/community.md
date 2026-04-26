---
read_when:
    - 서드파티 OpenClaw Plugin을 찾고 싶습니다
    - 직접 만든 Plugin을 게시하거나 목록에 올리고 싶습니다
summary: '커뮤니티 유지 관리 OpenClaw Plugin: 둘러보기, 설치, 직접 제출하기'
title: 커뮤니티 Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

커뮤니티 Plugin은 새로운
채널, 도구, provider 또는 기타 기능으로 OpenClaw를 확장하는 서드파티 패키지입니다. 이들은 커뮤니티가 만들고 유지 관리하며,
[ClawHub](/ko/tools/clawhub) 또는 npm에 게시되고,
단일 명령으로 설치할 수 있습니다.

ClawHub는 커뮤니티 Plugin의 표준 검색 표면입니다. 단순히 검색 가능성을 위해 여기에 Plugin을 추가하려고 docs 전용 PR을 열지 마세요.
대신 ClawHub에 게시하세요.

```bash
openclaw plugins install <package-name>
```

OpenClaw는 먼저 ClawHub를 확인하고 자동으로 npm으로 폴백합니다.

## 등록된 Plugin

### Apify

20,000개 이상의 준비된 스크래퍼를 사용해 어떤 웹사이트에서든 데이터를 스크래핑합니다. 에이전트가
Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, 전자상거래 사이트 등에서 데이터를 추출하게 할 수 있으며, 그냥 요청만 하면 됩니다.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server 대화를 위한 독립형 OpenClaw 브리지입니다. 채팅을
Codex 스레드에 바인드하고, 일반 텍스트로 대화하며, 재개, 계획, 검토, 모델 선택, Compaction 등을 위한 채팅 네이티브 명령으로 제어할 수 있습니다.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream 모드를 사용하는 엔터프라이즈 로봇 통합입니다. 어떤 DingTalk 클라이언트에서든 텍스트, 이미지, 파일 메시지를 지원합니다.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw용 Lossless Context Management Plugin입니다. DAG 기반 대화
요약과 점진적 Compaction을 통해 전체 컨텍스트 충실도를 유지하면서
토큰 사용량을 줄입니다.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

에이전트 trace를 Opik으로 내보내는 공식 Plugin입니다. 에이전트 동작,
비용, 토큰, 오류 등을 모니터링할 수 있습니다.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw 에이전트에 실시간 립싱크, 감정
표현, text-to-speech가 포함된 Live2D 아바타를 부여합니다. AI 자산 생성을 위한 제작 도구와
Prometheus Marketplace에 대한 원클릭 배포도 포함되어 있습니다. 현재 alpha입니다.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

QQ Bot API를 통해 OpenClaw를 QQ에 연결합니다. 개인 채팅, 그룹
멘션, 채널 메시지, 그리고 음성, 이미지, 비디오,
파일을 포함한 리치 미디어를 지원합니다.

현재 OpenClaw 릴리스에는 QQ Bot이 번들되어 있습니다. 일반 설치에는
[QQ Bot](/ko/channels/qqbot)의 번들 설정을 사용하세요. Tencent가 유지 관리하는 독립 패키지를 의도적으로 원할 때만
이 외부 Plugin을 설치하세요.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom 팀이 만든 OpenClaw용 WeCom 채널 Plugin입니다.
WeCom Bot WebSocket 지속 연결을 기반으로 하며, 다이렉트 메시지 및 그룹
채팅, 스트리밍 응답, 선제적 메시징, 이미지/파일 처리, Markdown
서식, 내장 액세스 제어, 문서/회의/메시징 Skills를 지원합니다.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Plugin 제출하기

유용하고, 문서화되어 있으며, 안전하게 운영할 수 있는 커뮤니티 Plugin을 환영합니다.

<Steps>
  <Step title="ClawHub 또는 npm에 게시">
    Plugin은 `openclaw plugins install \<package-name\>`으로 설치 가능해야 합니다.
    [ClawHub](/ko/tools/clawhub)(권장) 또는 npm에 게시하세요.
    전체 가이드는 [Plugin 만들기](/ko/plugins/building-plugins)를 참조하세요.

  </Step>

  <Step title="GitHub에 호스팅">
    소스 코드는 설정 문서와 issue
    tracker가 포함된 공개 저장소에 있어야 합니다.

  </Step>

  <Step title="문서 PR은 소스 문서 변경이 있을 때만 사용">
    Plugin을 검색 가능하게 만들기 위해 docs PR이 필요한 것은 아닙니다. 대신
    ClawHub에 게시하세요.

    OpenClaw의 소스 문서에 실제 콘텐츠
    변경이 필요할 때만 docs PR을 여세요. 예를 들어 설치 가이드 수정이나
    기본 문서 세트에 속하는 크로스 repo
    문서 추가 같은 경우입니다.

  </Step>
</Steps>

## 품질 기준

| 요구 사항                  | 이유                                           |
| ------------------------- | ---------------------------------------------- |
| ClawHub 또는 npm에 게시    | 사용자는 `openclaw plugins install`이 동작해야 함 |
| 공개 GitHub repo          | 소스 검토, issue 추적, 투명성                  |
| 설정 및 사용 문서         | 사용자는 구성 방법을 알아야 함                 |
| 활발한 유지 관리          | 최근 업데이트 또는 응답성 있는 issue 처리       |

성의 없는 래퍼, 불분명한 소유권 또는 유지 관리되지 않는 패키지는 거절될 수 있습니다.

## 관련 항목

- [Plugin 설치 및 구성](/ko/tools/plugin) — 모든 Plugin 설치 방법
- [Plugin 만들기](/ko/plugins/building-plugins) — 직접 만들기
- [Plugin 매니페스트](/ko/plugins/manifest) — 매니페스트 스키마
