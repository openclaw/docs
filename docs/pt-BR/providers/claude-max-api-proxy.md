---
read_when:
    - |-
      Você quer usar a assinatura Claude Max com ferramentas compatíveis com OpenAI	RTLU to=final code
      Proxy da comunidade para expor credenciais de assinatura do Claude como um endpoint compatível com OpenAI
    - Você quer um servidor de API local que encapsule a CLI do Claude Code
    - Você quer avaliar acesso ao Anthropic baseado em assinatura versus baseado em chave de API
summary: Proxy da comunidade para expor credenciais de assinatura do Claude como um endpoint compatível com OpenAI
title: Proxy de API Claude Max
x-i18n:
    generated_at: "2026-04-24T06:06:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

**claude-max-api-proxy** é uma ferramenta da comunidade que expõe sua assinatura Claude Max/Pro como um endpoint de API compatível com OpenAI. Isso permite usar sua assinatura com qualquer ferramenta que suporte o formato da API OpenAI.

<Warning>
Este caminho é apenas de compatibilidade técnica. A Anthropic já bloqueou no passado alguns usos de assinatura
fora do Claude Code. Você deve decidir por conta própria se quer usá-lo e verificar os termos atuais da Anthropic antes de depender dele.
</Warning>

## Por que usar isso?

| Abordagem              | Custo                                                | Melhor para                                |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------ |
| API Anthropic          | Pagamento por token (~$15/M entrada, $75/M saída para Opus) | Apps de produção, alto volume       |
| Assinatura Claude Max  | $200/mês fixos                                       | Uso pessoal, desenvolvimento, uso ilimitado |

Se você tem uma assinatura Claude Max e quer usá-la com ferramentas compatíveis com OpenAI, esse proxy pode reduzir o custo em alguns fluxos de trabalho. Chaves de API continuam sendo o caminho de política mais claro para uso em produção.

## Como funciona

```
Seu app → claude-max-api-proxy → Claude Code CLI → Anthropic (via assinatura)
   (formato OpenAI)             (converte o formato)    (usa seu login)
```

O proxy:

1. Aceita solicitações em formato OpenAI em `http://localhost:3456/v1/chat/completions`
2. Converte essas solicitações em comandos da CLI do Claude Code
3. Retorna respostas em formato OpenAI (com suporte a streaming)

## Primeiros passos

<Steps>
  <Step title="Install the proxy">
    Requer Node.js 20+ e Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Start the server">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Test the proxy">
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
  <Step title="Configure OpenClaw">
    Aponte o OpenClaw para o proxy como um endpoint personalizado compatível com OpenAI:

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

## Catálogo integrado

| ID do modelo       | Mapeia para      |
| ------------------ | ---------------- |
| `claude-opus-4`    | Claude Opus 4    |
| `claude-sonnet-4`  | Claude Sonnet 4  |
| `claude-haiku-4`   | Claude Haiku 4   |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Observações sobre proxies compatíveis com OpenAI">
    Este caminho usa a mesma rota compatível com OpenAI em estilo proxy que outros
    backends personalizados `/v1`:

    - O formato nativo de solicitação exclusivo da OpenAI não se aplica
    - Sem `service_tier`, sem `store` do Responses, sem dicas de cache de prompt e sem
      modelagem de payload de compatibilidade de raciocínio da OpenAI
    - Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
      não são injetados na URL do proxy

  </Accordion>

  <Accordion title="Inicialização automática no macOS com LaunchAgent">
    Crie um LaunchAgent para executar o proxy automaticamente:

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

## Links

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Observações

- Esta é uma **ferramenta da comunidade**, sem suporte oficial da Anthropic nem do OpenClaw
- Requer uma assinatura ativa Claude Max/Pro com Claude Code CLI autenticado
- O proxy é executado localmente e não envia dados para servidores de terceiros
- Respostas em streaming têm suporte completo

<Note>
Para integração nativa com Anthropic usando Claude CLI ou chaves de API, consulte [Anthropic provider](/pt-BR/providers/anthropic). Para assinaturas OpenAI/Codex, consulte [OpenAI provider](/pt-BR/providers/openai).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/pt-BR/providers/anthropic" icon="bolt">
    Integração nativa do OpenClaw com Claude CLI ou chaves de API.
  </Card>
  <Card title="OpenAI provider" href="/pt-BR/providers/openai" icon="robot">
    Para assinaturas OpenAI/Codex.
  </Card>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, refs de modelo e comportamento de fallback.
  </Card>
  <Card title="Configuration" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
</CardGroup>
