---
read_when:
    - OpenAI 호환 도구에서 Claude Max 구독을 사용하려는 경우
    - Claude Code CLI를 감싸는 로컬 API 서버가 필요합니다
    - 구독 기반 Anthropic 액세스와 API 키 기반 Anthropic 액세스를 비교 평가하려는 경우
summary: Claude 구독 자격 증명을 OpenAI 호환 엔드포인트로 노출하는 커뮤니티 프록시
title: Claude Max API 프록시
x-i18n:
    generated_at: "2026-07-12T01:10:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy**는 Claude Max/Pro 구독을 OpenAI 호환 API 엔드포인트로 노출하는 커뮤니티 npm 패키지(OpenClaw Plugin 아님)입니다. 따라서 Anthropic API 키 대신 OpenAI 호환 도구에서 구독을 사용할 수 있습니다.

<Warning>
기술적으로만 호환되며 공식적으로 승인된 경로가 아닙니다. Anthropic은 과거에 Claude Code 외부에서 일부 구독 사용을 차단한 적이 있으므로, 이에 의존하기 전에 Anthropic의 현재 요금 청구 규칙을 확인하세요.

Anthropic의 Claude Code 문서에서는 `claude -p`를 Agent SDK/프로그래밍 방식 사용으로 설명합니다. Anthropic이 2026년 6월 15일에 발표한 지원 업데이트에 따르면 Claude Agent SDK, `claude -p`, 서드 파티 앱 사용량은 로그인한 구독의 사용량 한도에서 차감됩니다(이전에 발표된 별도의 Agent SDK 크레딧 요금제는 일시 중단됨). Anthropic의 [Agent SDK 요금제 문서](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) 및 [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) 요금제 문서와 OpenClaw 자체 Claude CLI 요금 청구 참고 사항은 [Anthropic 공급자](/ko/providers/anthropic)를 참조하세요.
</Warning>

## 사용 이유

| 방식                      | 비용 처리 경로                                    | 적합한 용도                                |
| ------------------------- | ------------------------------------------------- | ------------------------------------------ |
| Anthropic API 키          | Claude Console을 통해 토큰당 결제                 | 프로덕션 앱, 공유 자동화, 대규모 사용      |
| Claude 구독 프록시        | Claude Code / `claude -p` 요금제 및 크레딧 규칙   | 호환 도구를 이용한 개인 실험               |

이 프록시를 사용하면 Claude Max 또는 Pro 구독을 OpenAI 호환 도구에서 사용할 수 있습니다. 무제한 정액제 경로가 아니며 Claude Code의 사용량 한도가 그대로 적용됩니다. 프로덕션 용도에서는 API 키가 여전히 더 명확한 요금 청구 경로입니다.

## 작동 방식

```text
애플리케이션 -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (OpenAI 형식)                  (형식 변환)                   (로그인 사용)
```

프록시는 요청마다 Claude Code CLI를 하위 프로세스로 실행하고, OpenAI 형식의 채팅 요청을 CLI 프롬프트로 변환한 다음 응답을 OpenAI 형식으로 스트리밍하거나 반환합니다.

## 시작하기

<Steps>
  <Step title="프록시 설치">
    Node.js 20 이상과 인증된 Claude Code CLI가 필요합니다.

    ```bash
    npm install -g claude-max-api-proxy

    # Claude CLI 인증 여부 확인
    claude --version
    claude auth login   # 아직 인증하지 않은 경우
    ```

  </Step>
  <Step title="서버 시작">
    ```bash
    claude-max-api
    # 서버는 http://localhost:3456 에서 실행됨
    ```
  </Step>
  <Step title="프록시 테스트">
    ```bash
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="OpenClaw 구성">
    프록시를 사용자 지정 OpenAI 호환 엔드포인트로 사용하도록 OpenClaw를 지정합니다.

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

<Note>
아래 모델 ID는 OpenClaw의 Anthropic 모델 참조가 아니라 프록시 자체 카탈로그의 ID입니다. 각 ID는 Claude Code CLI 모델 별칭(`opus`, `sonnet`, `haiku`)에 매핑되므로 Anthropic이 CLI에서 해당 별칭을 업데이트할 때마다 기반 모델이 변경됩니다. 특정 매핑에 의존하기 전에 프록시의 최신 README를 확인하세요.
</Note>

| 모델 ID           | CLI 별칭  | 현재 매핑       |
| ----------------- | --------- | --------------- |
| `claude-opus-4`   | `opus`    | Claude Opus 4.5 |
| `claude-sonnet-4` | `sonnet`  | Claude Sonnet 4 |
| `claude-haiku-4`  | `haiku`   | Claude Haiku 4  |

## 고급 구성

<AccordionGroup>
  <Accordion title="프록시 방식 OpenAI 호환 관련 참고 사항">
    이 방식은 다른 자체 호스팅 OpenAI 호환 백엔드와 동일하게 OpenClaw의 일반 사용자 지정 `/v1` OpenAI 호환 경로를 사용합니다.

    - OpenAI 전용 기본 요청 형식 조정은 적용되지 않습니다.
    - `/fast`와 `service_tier`는 `api.anthropic.com`으로 직접 전송되는 트래픽에만 적용됩니다. 프록시 경로에서는 `service_tier`를 변경하지 않습니다([Anthropic 공급자 고속 모드](/ko/providers/anthropic#advanced-configuration) 참조).
    - Responses의 `store`, 프롬프트 캐시 힌트 또는 OpenAI 추론 호환 페이로드 형식 조정은 제공되지 않습니다.
    - OpenClaw의 OpenAI/Codex 출처 표시 헤더(`originator`, `version`, `User-Agent`)는 기본 `api.openai.com` OAuth 트래픽에만 전송되며, 이 프록시와 같은 사용자 지정 `OPENAI_BASE_URL` 대상에는 전송되지 않습니다.

  </Accordion>

  <Accordion title="LaunchAgent를 사용하여 macOS에서 자동 시작">
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

- Claude Code의 `claude -p` 요금 청구, 사용량 크레딧 및 속도 제한 동작이 그대로 적용됩니다.
- `127.0.0.1`에만 바인딩되며, CLI 자체에서 Anthropic을 호출하는 경우를 제외하고 서드 파티 서버로 데이터를 전송하지 않습니다.
- 스트리밍 응답을 지원합니다.
- 인증 실패는 시작 시 확인되지 않고 채팅 요청이 실제로 실행될 때만 드러납니다. CLI가 인증되지 않은 경우 서버가 시작을 거부하는 대신 첫 번째 요청이 실패합니다.

<Note>
Claude CLI 또는 API 키를 사용하는 기본 Anthropic 연동은 [Anthropic 공급자](/ko/providers/anthropic)를 참조하세요. OpenAI/Codex 구독은 [OpenAI 공급자](/ko/providers/openai)를 참조하세요.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Anthropic 공급자" href="/ko/providers/anthropic" icon="bolt">
    Claude CLI 또는 API 키를 사용하는 OpenClaw 기본 연동입니다.
  </Card>
  <Card title="OpenAI 공급자" href="/ko/providers/openai" icon="robot">
    OpenAI/Codex 구독용입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 공급자, 모델 참조 및 장애 조치 동작의 개요입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 구성 참조입니다.
  </Card>
</CardGroup>
