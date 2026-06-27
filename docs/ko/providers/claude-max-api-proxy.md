---
read_when:
    - OpenAI 호환 도구와 함께 Claude Max 구독을 사용하려는 경우
    - Claude Code CLI를 감싸는 로컬 API 서버가 필요합니다
    - 구독 기반 Anthropic 액세스와 API 키 기반 Anthropic 액세스를 평가하려는 경우
summary: Claude 구독 자격 증명을 OpenAI 호환 엔드포인트로 노출하는 커뮤니티 프록시
title: Claude Max API 프록시
x-i18n:
    generated_at: "2026-06-27T18:01:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy**는 Claude Max/Pro 구독을 OpenAI 호환 API 엔드포인트로 노출하는 커뮤니티 도구입니다. 이를 통해 OpenAI API 형식을 지원하는 모든 도구에서 구독을 사용할 수 있습니다.

<Warning>
이 경로는 기술적 호환성만을 위한 것입니다. Anthropic은 과거에 Claude Code 외부의 일부 구독 사용을 차단한 적이 있습니다. 이를 사용할지 여부는 직접 결정해야 하며, 의존하기 전에 Anthropic의 현재 청구 규칙을 확인해야 합니다.

Anthropic의 현재 지원 문서에 따르면 `claude -p`는 Agent SDK/프로그래밍 방식 사용입니다. 2026년 6월 15일부터 구독 플랜의 `claude -p` 사용량은 먼저 별도의 월간 Agent SDK 크레딧에서 차감되고, 사용량 크레딧이 활성화되어 있으면 이후 표준 API 요율의 사용량 크레딧에서 차감됩니다.
</Warning>

## 왜 사용하나요?

| 접근 방식                  | 비용 경로                                      | 적합한 용도                                   |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | Claude Console 또는 클라우드를 통해 토큰당 결제   | 프로덕션 앱, 공유 자동화, 대량 사용 |
| Claude 구독 프록시 | Claude Code / `claude -p` 플랜 및 크레딧 규칙 | 호환 도구를 이용한 개인 실험 |

Claude Max 또는 Pro 구독이 있고 OpenAI 호환 도구와 함께 사용하고 싶다면 이 프록시가 일부 개인 워크플로에 맞을 수 있습니다. 무제한 정액 경로는 아닙니다. 프로덕션 사용에는 API 키가 더 명확한 정책 및 청구 경로입니다.

## 작동 방식

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

프록시는 다음을 수행합니다.

1. `http://localhost:3456/v1/chat/completions`에서 OpenAI 형식 요청을 수락합니다
2. 이를 Claude Code CLI 명령으로 변환합니다
3. OpenAI 형식으로 응답을 반환합니다(스트리밍 지원)

## 시작하기

<Steps>
  <Step title="프록시 설치">
    Node.js 22+ 및 Claude Code CLI가 필요합니다.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="서버 시작">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="프록시 테스트">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="OpenClaw 구성">
    OpenClaw가 프록시를 사용자 지정 OpenAI 호환 엔드포인트로 사용하도록 지정합니다.

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## 기본 제공 카탈로그

| 모델 ID          | 매핑 대상         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## 고급 구성

<AccordionGroup>
  <Accordion title="프록시 방식 OpenAI 호환 참고 사항">
    이 경로는 다른 사용자 지정 `/v1` 백엔드와 동일한 프록시 방식 OpenAI 호환 라우트를 사용합니다.

    - 네이티브 OpenAI 전용 요청 셰이핑은 적용되지 않습니다
    - `service_tier`, Responses `store`, 프롬프트 캐시 힌트, OpenAI reasoning 호환 페이로드 셰이핑이 없습니다
    - 숨겨진 OpenClaw 기여 식별 헤더(`originator`, `version`, `User-Agent`)는 프록시 URL에 삽입되지 않습니다

  </Accordion>

  <Accordion title="LaunchAgent로 macOS에서 자동 시작">
    프록시를 자동으로 실행하도록 LaunchAgent를 만듭니다.

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## 참고 사항

- 이는 **커뮤니티 도구**이며 Anthropic 또는 OpenClaw에서 공식 지원하지 않습니다
- Claude Code CLI 인증이 완료된 활성 Claude Max/Pro 구독이 필요합니다
- Claude Code `claude -p`의 청구, 사용량 크레딧, 속도 제한 동작을 상속합니다
- 프록시는 로컬에서 실행되며 데이터를 타사 서버로 보내지 않습니다
- 스트리밍 응답이 완전히 지원됩니다

<Note>
Claude CLI 또는 API 키를 사용하는 네이티브 Anthropic 통합은 [Anthropic provider](/ko/providers/anthropic)를 참조하세요. OpenAI/Codex 구독은 [OpenAI provider](/ko/providers/openai)를 참조하세요.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/ko/providers/anthropic" icon="bolt">
    Claude CLI 또는 API 키를 사용하는 네이티브 OpenClaw 통합입니다.
  </Card>
  <Card title="OpenAI provider" href="/ko/providers/openai" icon="robot">
    OpenAI/Codex 구독용입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, 모델 참조, 장애 조치 동작의 개요입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 구성 참조입니다.
  </Card>
</CardGroup>
