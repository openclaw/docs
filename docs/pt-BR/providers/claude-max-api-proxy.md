---
read_when:
    - Você quer usar a assinatura Claude Max com ferramentas compatíveis com OpenAI
    - Você quer um servidor de API local que encapsule a CLI do Claude Code
    - Você quer avaliar acesso ao Anthropic baseado em assinatura versus baseado em chave de API
summary: Proxy da comunidade para expor credenciais de assinatura do Claude como um endpoint compatível com OpenAI
title: Proxy de API do Claude Max
x-i18n:
    generated_at: "2026-04-12T23:30:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 534bc3d189e68529fb090258eb0d6db6d367eb7e027ad04b1f0be55f6aa7d889
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Proxy de API do Claude Max

**claude-max-api-proxy** é uma ferramenta da comunidade que expõe sua assinatura Claude Max/Pro como um endpoint de API compatível com OpenAI. Isso permite usar sua assinatura com qualquer ferramenta que ofereça suporte ao formato de API da OpenAI.

<Warning>
Este caminho é apenas de compatibilidade técnica. A Anthropic já bloqueou, no passado, alguns usos de assinatura
fora do Claude Code. Cabe a você decidir se quer usá-lo e verificar os termos atuais da Anthropic antes de depender disso.
</Warning>

## Por que usar isso?

| Abordagem               | Custo                                               | Melhor para                                |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| API da Anthropic        | Pagamento por token (~$15/M de entrada, $75/M de saída para Opus) | Apps de produção, alto volume              |
| Assinatura Claude Max   | $200/mês fixos                                      | Uso pessoal, desenvolvimento, uso ilimitado |

Se você tem uma assinatura Claude Max e quer usá-la com ferramentas compatíveis com OpenAI, este proxy pode reduzir o custo em alguns fluxos de trabalho. Chaves de API continuam sendo o caminho de política mais claro para uso em produção.

## Como funciona

```
Seu app → claude-max-api-proxy → CLI do Claude Code → Anthropic (via assinatura)
(formato OpenAI)               (converte formato)    (usa seu login)
```

O proxy:

1. Aceita solicitações no formato OpenAI em `http://localhost:3456/v1/chat/completions`
2. Converte essas solicitações em comandos da CLI do Claude Code
3. Retorna respostas no formato OpenAI (com streaming suportado)

## Primeiros passos

<Steps>
  <Step title="Instale o proxy">
    Requer Node.js 20+ e a CLI do Claude Code.

    ```bash
    npm install -g claude-max-api-proxy

    # Verifique se a CLI do Claude está autenticada
    claude --version
    ```

  </Step>
  <Step title="Inicie o servidor">
    ```bash
    claude-max-api
    # O servidor roda em http://localhost:3456
    ```
  </Step>
  <Step title="Teste o proxy">
    ```bash
    # Verificação de integridade
    curl http://localhost:3456/health

    # Listar modelos
    curl http://localhost:3456/v1/models

    # Conclusão de chat
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configure o OpenClaw">
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

## Modelos disponíveis

| ID do modelo       | Corresponde a   |
| ------------------ | --------------- |
| `claude-opus-4`    | Claude Opus 4   |
| `claude-sonnet-4`  | Claude Sonnet 4 |
| `claude-haiku-4`   | Claude Haiku 4  |

## Avançado

<AccordionGroup>
  <Accordion title="Observações no estilo proxy compatível com OpenAI">
    Este caminho usa a mesma rota no estilo proxy compatível com OpenAI que outros
    backends personalizados `/v1`:

    - A modelagem nativa de solicitações somente para OpenAI não se aplica
    - Sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt e sem
      modelagem de payload compatível com raciocínio da OpenAI
    - Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
      não são injetados na URL do proxy

  </Accordion>

  <Accordion title="Início automático no macOS com LaunchAgent">
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
- Requer uma assinatura Claude Max/Pro ativa com a CLI do Claude Code autenticada
- O proxy roda localmente e não envia dados para servidores de terceiros
- Respostas em streaming são totalmente suportadas

<Note>
Para integração nativa com Anthropic via CLI do Claude ou chaves de API, consulte [provider Anthropic](/pt-BR/providers/anthropic). Para assinaturas OpenAI/Codex, consulte [provider OpenAI](/pt-BR/providers/openai).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Provider Anthropic" href="/pt-BR/providers/anthropic" icon="bolt">
    Integração nativa do OpenClaw com a CLI do Claude ou chaves de API.
  </Card>
  <Card title="Provider OpenAI" href="/pt-BR/providers/openai" icon="robot">
    Para assinaturas OpenAI/Codex.
  </Card>
  <Card title="Providers de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
</CardGroup>
