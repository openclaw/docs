---
read_when:
    - Você quer usar a assinatura Claude Max com ferramentas compatíveis com a OpenAI
    - Você quer um servidor de API local que encapsule a CLI do Claude Code
    - Você quer avaliar o acesso à Anthropic baseado em assinatura em comparação com o baseado em chave de API
summary: Proxy da comunidade para expor credenciais de assinatura do Claude como um endpoint compatível com a OpenAI
title: Proxy de API do Claude Max
x-i18n:
    generated_at: "2026-07-12T00:18:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** é um pacote npm da comunidade (não é um plugin do OpenClaw) que
expõe uma assinatura Claude Max/Pro como um endpoint de API compatível com a OpenAI, para que
você possa direcionar qualquer ferramenta compatível com a OpenAI à sua assinatura em vez de
usar uma chave de API da Anthropic.

<Warning>
Apenas compatibilidade técnica, não um caminho oficialmente autorizado. A Anthropic já
bloqueou no passado alguns usos de assinaturas fora do Claude Code; verifique
as regras atuais de cobrança da Anthropic antes de depender disso.

A documentação do Claude Code da Anthropic descreve `claude -p` como uso
programático/do Agent SDK. De acordo com a atualização de suporte da Anthropic de 15 de junho de 2026,
o Claude Agent SDK, `claude -p` e o uso de aplicativos de terceiros consomem os
limites de uso da assinatura com sessão iniciada (o plano de créditos separado para o Agent SDK,
anunciado anteriormente, está suspenso). Consulte o [artigo sobre o plano do Agent
SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
os artigos sobre os planos [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
e [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan),
além do [provedor Anthropic](/pt-BR/providers/anthropic), para ver as observações
do próprio OpenClaw sobre a cobrança da CLI do Claude.
</Warning>

## Por que usar isto

| Abordagem                 | Forma de cobrança                                | Mais indicado para                                      |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Chave de API da Anthropic | Pagamento por token pelo Claude Console           | Aplicativos de produção, automação compartilhada, volume |
| Proxy da assinatura Claude | Regras de plano e créditos do Claude Code / `claude -p` | Experimentos pessoais com ferramentas compatíveis       |

Este proxy permite que uma assinatura Claude Max ou Pro funcione com ferramentas
compatíveis com a OpenAI. Ele não é um caminho ilimitado com tarifa fixa — ele herda os limites
de uso do Claude Code. As chaves de API continuam sendo o caminho de cobrança mais claro para uso em produção.

## Como funciona

```text
Seu aplicativo -> claude-max-api-proxy -> CLI do Claude Code / claude -p -> Anthropic
     (formato OpenAI)                   (converte o formato)            (usa seu login)
```

O proxy inicia a CLI do Claude Code como um subprocesso para cada solicitação, converte
solicitações de chat no formato OpenAI em prompts da CLI e transmite (ou retorna) a
resposta no formato OpenAI.

## Primeiros passos

<Steps>
  <Step title="Instalar o proxy">
    Requer Node.js 20+ e uma CLI do Claude Code autenticada.

    ```bash
    npm install -g claude-max-api-proxy

    # Verifique se a CLI do Claude está autenticada
    claude --version
    claude auth login   # se ainda não estiver autenticada
    ```

  </Step>
  <Step title="Iniciar o servidor">
    ```bash
    claude-max-api
    # O servidor é executado em http://localhost:3456
    ```
  </Step>
  <Step title="Testar o proxy">
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
  <Step title="Configurar o OpenClaw">
    Direcione o OpenClaw ao proxy como um endpoint personalizado compatível com a OpenAI:

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
Os IDs de modelo abaixo pertencem ao catálogo do próprio proxy, não às
referências de modelo Anthropic do OpenClaw. Cada ID corresponde a um alias de modelo da CLI
do Claude Code (`opus`, `sonnet`, `haiku`), portanto o modelo subjacente muda sempre que
a Anthropic atualiza esse alias na CLI. Consulte o README atual do proxy antes de depender de
um mapeamento específico.
</Note>

| ID do modelo       | Alias da CLI | Mapeamento atual |
| ------------------ | ------------ | --------------- |
| `claude-opus-4`    | `opus`       | Claude Opus 4.5 |
| `claude-sonnet-4`  | `sonnet`     | Claude Sonnet 4 |
| `claude-haiku-4`   | `haiku`      | Claude Haiku 4  |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Observações sobre o proxy compatível com a OpenAI">
    Isto usa a rota personalizada genérica `/v1` do OpenClaw compatível com a OpenAI, o mesmo
    caminho de qualquer outro backend auto-hospedado compatível com a OpenAI:

    - A formatação de solicitações exclusiva da OpenAI nativa não se aplica.
    - `/fast` e `service_tier` aplicam-se somente ao tráfego direto para `api.anthropic.com`;
      as rotas de proxy deixam `service_tier` inalterado (consulte
      [modo rápido do provedor Anthropic](/pt-BR/providers/anthropic#advanced-configuration)).
    - Sem `store` da Responses, dicas de cache de prompts ou formatação de payload de
      compatibilidade de raciocínio da OpenAI.
    - Os cabeçalhos de atribuição OpenAI/Codex do OpenClaw (`originator`, `version`,
      `User-Agent`) são enviados somente no tráfego OAuth nativo para `api.openai.com`, e não
      para destinos personalizados de `OPENAI_BASE_URL` como este proxy.

  </Accordion>

  <Accordion title="Inicialização automática no macOS com LaunchAgent">
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

- Herda o comportamento de cobrança, créditos de uso e limites de taxa de `claude -p` do Claude Code.
- Vincula-se apenas a `127.0.0.1`; não envia dados a nenhum servidor de terceiros além da própria chamada da CLI à Anthropic.
- Há suporte a respostas por streaming.
- Falhas de autenticação não são verificadas na inicialização e só aparecem quando uma solicitação de chat é realmente executada; se a CLI não estiver autenticada, espere que a primeira solicitação falhe, em vez de o servidor se recusar a iniciar.

<Note>
Para integração nativa com a Anthropic usando a CLI do Claude ou chaves de API, consulte o [provedor Anthropic](/pt-BR/providers/anthropic). Para assinaturas OpenAI/Codex, consulte o [provedor OpenAI](/pt-BR/providers/openai).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedor Anthropic" href="/pt-BR/providers/anthropic" icon="bolt">
    Integração nativa do OpenClaw com a CLI do Claude ou chaves de API.
  </Card>
  <Card title="Provedor OpenAI" href="/pt-BR/providers/openai" icon="robot">
    Para assinaturas OpenAI/Codex.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
</CardGroup>
