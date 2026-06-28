---
read_when:
    - Você quer usar a assinatura Claude Max com ferramentas compatíveis com OpenAI
    - Você quer um servidor de API local que encapsule a Claude Code CLI
    - Você quer avaliar o acesso à Anthropic baseado em assinatura versus baseado em chave de API
summary: Proxy da comunidade para expor credenciais de assinatura do Claude como um endpoint compatível com OpenAI
title: Proxy de API do Claude Max
x-i18n:
    generated_at: "2026-06-28T20:44:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** é uma ferramenta da comunidade que expõe sua assinatura Claude Max/Pro como um endpoint de API compatível com OpenAI. Isso permite usar sua assinatura com qualquer ferramenta que ofereça suporte ao formato da API OpenAI.

<Warning>
Este caminho é apenas para compatibilidade técnica. A Anthropic já bloqueou no passado alguns usos de assinatura fora do Claude Code. Você deve decidir por conta própria se deseja usá-lo e verificar as regras atuais de cobrança da Anthropic antes de depender dele.

A documentação de suporte atual da Anthropic diz que `claude -p` é uso programático/do Agent SDK.
A atualização de suporte da Anthropic de 15 de junho de 2026 pausou o plano anunciado de créditos separados para o Agent SDK. Por enquanto, o Claude Agent SDK, `claude -p` e o uso em aplicativos de terceiros ainda consomem os limites de uso da assinatura conectada.

Antes de depender deste caminho, consulte o [artigo sobre o plano do Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) da Anthropic,
além dos artigos de suporte do Claude Code para contas
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
ou
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).
</Warning>

## Por que usar isso?

| Abordagem                 | Rota de custo                                    | Melhor para                                |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| API Anthropic             | Pague por token pelo Claude Console ou pela nuvem | Aplicativos de produção, automação compartilhada, volume |
| Proxy de assinatura Claude | Regras de plano e créditos do Claude Code / `claude -p` | Experimentos pessoais com ferramentas compatíveis |

Se você tem uma assinatura Claude Max ou Pro e quer usá-la com
ferramentas compatíveis com OpenAI, esse proxy pode atender a alguns fluxos de trabalho pessoais. Ele não é um caminho ilimitado de tarifa fixa. As chaves de API continuam sendo o caminho mais claro de política e cobrança para uso em produção.

## Como funciona

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

O proxy:

1. Aceita solicitações no formato OpenAI em `http://localhost:3456/v1/chat/completions`
2. Converte-as em comandos do Claude Code CLI
3. Retorna respostas no formato OpenAI (com suporte a streaming)

## Primeiros passos

<Steps>
  <Step title="Instale o proxy">
    Requer Node.js 22+ e Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Inicie o servidor">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Teste o proxy">
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

## Catálogo integrado

| ID do modelo      | Mapeia para     |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Observações no estilo de proxy compatível com OpenAI">
    Este caminho usa a mesma rota no estilo de proxy compatível com OpenAI que outros backends
    `/v1` personalizados:

    - A formatação de solicitação nativa somente para OpenAI não se aplica
    - Sem `service_tier`, sem Responses `store`, sem dicas de cache de prompt e sem
      formatação de payload de compatibilidade de raciocínio da OpenAI
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

## Observações

- Esta é uma **ferramenta da comunidade**, sem suporte oficial da Anthropic ou da OpenClaw
- Requer uma assinatura Claude Max/Pro ativa com Claude Code CLI autenticado
- Herda o comportamento de cobrança, créditos de uso e limites de taxa de `claude -p` do Claude Code
- O proxy é executado localmente e não envia dados a servidores de terceiros
- Respostas em streaming têm suporte completo

<Note>
Para integração nativa com a Anthropic usando Claude CLI ou chaves de API, consulte [provedor Anthropic](/pt-BR/providers/anthropic). Para assinaturas OpenAI/Codex, consulte [provedor OpenAI](/pt-BR/providers/openai).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Provedor Anthropic" href="/pt-BR/providers/anthropic" icon="bolt">
    Integração nativa do OpenClaw com Claude CLI ou chaves de API.
  </Card>
  <Card title="Provedor OpenAI" href="/pt-BR/providers/openai" icon="robot">
    Para assinaturas OpenAI/Codex.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
</CardGroup>
