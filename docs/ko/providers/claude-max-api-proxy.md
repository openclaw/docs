---
read_when:
    - Claude Max 구독을 OpenAI 호환 도구와 함께 사용하려고 합니다
    - Claude Code CLI를 감싸는 로컬 API 서버가 필요합니다
    - 구독 기반 Anthropic 액세스와 API 키 기반 Anthropic 액세스를 비교 평가하려고 합니다
summary: Claude 구독 자격 증명을 OpenAI 호환 엔드포인트로 노출하는 커뮤니티 프록시
title: Claude Max API Proxy
x-i18n:
    generated_at: "2026-04-12T23:30:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 534bc3d189e68529fb090258eb0d6db6d367eb7e027ad04b1f0be55f6aa7d889
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy**는 Claude Max/Pro 구독을 OpenAI 호환 API 엔드포인트로 노출하는 커뮤니티 도구입니다. 이를 통해 OpenAI API 형식을 지원하는 모든 도구에서 구독을 사용할 수 있습니다.

<Warning>
이 경로는 기술적 호환성만을 위한 것입니다. Anthropic은 과거에 Claude Code 외부에서의 일부 구독 사용을 차단한 적이 있습니다. 이를 사용할지 여부는 스스로 판단해야 하며, 의존하기 전에 Anthropic의 현재 약관을 직접 확인해야 합니다.
</Warning>

## 왜 이것을 사용하나요?

| Approach                | Cost                                                | Best For                                   |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Anthropic API           | 토큰당 과금(Opus 기준 입력 약 $15/M, 출력 $75/M)    | 프로덕션 앱, 높은 사용량                   |
| Claude Max subscription | 월 $200 정액                                        | 개인 사용, 개발, 무제한 사용               |

Claude Max 구독이 있고 이를 OpenAI 호환 도구와 함께 사용하려는 경우, 이 프록시는 일부 워크플로에서 비용을 줄일 수 있습니다. 프로덕션 사용에는 여전히 API 키가 더 명확한 정책 경로입니다.

## 작동 방식

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

프록시는 다음과 같이 동작합니다:

1. `http://localhost:3456/v1/chat/completions`에서 OpenAI 형식 요청을 받습니다
2. 이를 Claude Code CLI 명령으로 변환합니다
3. OpenAI 형식으로 응답을 반환합니다(스트리밍 지원)

## 시작하기

<Steps>
  <Step title="프록시 설치">
    Node.js 20+ 및 Claude Code CLI가 필요합니다.

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
    사용자 지정 OpenAI 호환 엔드포인트로 프록시를 가리키도록 OpenClaw를 설정합니다:

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

## 사용 가능한 모델

| Model ID          | Maps To         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## 고급

<AccordionGroup>
  <Accordion title="프록시 스타일 OpenAI 호환 참고 사항">
    이 경로는 다른 사용자 지정 `/v1` 백엔드와 동일한 프록시 스타일 OpenAI 호환 경로를 사용합니다:

    - OpenAI 전용 네이티브 요청 shaping은 적용되지 않습니다
    - `service_tier`, Responses `store`, 프롬프트 캐시 힌트, OpenAI 추론 호환 payload shaping은 지원되지 않습니다
    - 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는 프록시 URL에 주입되지 않습니다

  </Accordion>

  <Accordion title="LaunchAgent로 macOS에서 자동 시작">
    프록시를 자동으로 실행하도록 LaunchAgent를 생성합니다:

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

## 링크

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **이슈:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## 참고

- 이것은 Anthropic이나 OpenClaw가 공식 지원하는 도구가 아닌 **커뮤니티 도구**입니다
- Claude Code CLI 인증이 완료된 활성 Claude Max/Pro 구독이 필요합니다
- 프록시는 로컬에서 실행되며 데이터를 제3자 서버로 전송하지 않습니다
- 스트리밍 응답이 완전히 지원됩니다

<Note>
Claude CLI 또는 API 키를 사용하는 기본 Anthropic 통합은 [Anthropic provider](/ko/providers/anthropic)를 참조하세요. OpenAI/Codex 구독은 [OpenAI provider](/ko/providers/openai)를 참조하세요.
</Note>

## 관련

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/ko/providers/anthropic" icon="bolt">
    Claude CLI 또는 API 키를 사용하는 기본 OpenClaw 통합.
  </Card>
  <Card title="OpenAI provider" href="/ko/providers/openai" icon="robot">
    OpenAI/Codex 구독용.
  </Card>
  <Card title="모델 provider" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, 모델 참조 및 장애 조치 동작 개요.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 구성 참조.
  </Card>
</CardGroup>
