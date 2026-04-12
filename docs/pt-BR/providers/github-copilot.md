---
read_when:
    - Você quer usar o GitHub Copilot como provider de modelo
    - Você precisa do fluxo `openclaw models auth login-github-copilot`
summary: Entrar no GitHub Copilot pelo OpenClaw usando o fluxo de dispositivo
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-12T23:31:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51fee006e7d4e78e37b0c29356b0090b132de727d99b603441767d3fb642140b
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

O GitHub Copilot é o assistente de programação com IA do GitHub. Ele fornece acesso aos
modelos do Copilot para sua conta e seu plano do GitHub. O OpenClaw pode usar o Copilot como
provider de modelo de duas maneiras diferentes.

## Duas formas de usar o Copilot no OpenClaw

<Tabs>
  <Tab title="Provider builtin (github-copilot)">
    Use o fluxo nativo de login por dispositivo para obter um token do GitHub e depois trocá-lo por
    tokens de API do Copilot quando o OpenClaw for executado. Este é o caminho **padrão** e mais simples
    porque não requer o VS Code.

    <Steps>
      <Step title="Execute o comando de login">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Você receberá um prompt para visitar uma URL e inserir um código de uso único. Mantenha o
        terminal aberto até que o processo seja concluído.
      </Step>
      <Step title="Defina um modelo padrão">
        ```bash
        openclaw models set github-copilot/gpt-4o
        ```

        Ou na configuração:

        ```json5
        {
          agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Use a extensão **Copilot Proxy** do VS Code como uma ponte local. O OpenClaw se comunica com
    o endpoint `/v1` do proxy e usa a lista de modelos que você configurar ali.

    <Note>
    Escolha esta opção quando você já usar o Copilot Proxy no VS Code ou precisar rotear
    por meio dele. Você deve habilitar o plugin e manter a extensão do VS Code em execução.
    </Note>

  </Tab>
</Tabs>

## Flags opcionais

| Flag            | Descrição                                           |
| --------------- | --------------------------------------------------- |
| `--yes`         | Pula o prompt de confirmação                        |
| `--set-default` | Também aplica o modelo padrão recomendado do provider |

```bash
# Pular confirmação
openclaw models auth login-github-copilot --yes

# Fazer login e definir o modelo padrão em uma única etapa
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="TTY interativo obrigatório">
    O fluxo de login por dispositivo requer um TTY interativo. Execute-o diretamente em um
    terminal, não em um script não interativo nem em um pipeline de CI.
  </Accordion>

  <Accordion title="A disponibilidade de modelos depende do seu plano">
    A disponibilidade de modelos do Copilot depende do seu plano do GitHub. Se um modelo
    for rejeitado, tente outro ID (por exemplo, `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Seleção de transporte">
    IDs de modelo Claude usam automaticamente o transporte Anthropic Messages. Modelos GPT,
    da série o e Gemini continuam usando o transporte OpenAI Responses. O OpenClaw
    seleciona o transporte correto com base na ref do modelo.
  </Accordion>

  <Accordion title="Ordem de resolução de variáveis de ambiente">
    O OpenClaw resolve a autenticação do Copilot a partir de variáveis de ambiente na seguinte
    ordem de prioridade:

    | Prioridade | Variável              | Observações                         |
    | ---------- | --------------------- | ----------------------------------- |
    | 1          | `COPILOT_GITHUB_TOKEN` | Prioridade mais alta, específica do Copilot |
    | 2          | `GH_TOKEN`            | Token da GitHub CLI (fallback)      |
    | 3          | `GITHUB_TOKEN`        | Token padrão do GitHub (prioridade mais baixa) |

    Quando várias variáveis estão definidas, o OpenClaw usa a de maior prioridade.
    O fluxo de login por dispositivo (`openclaw models auth login-github-copilot`) armazena
    seu token no armazenamento de perfis de autenticação e tem precedência sobre todas as
    variáveis de ambiente.

  </Accordion>

  <Accordion title="Armazenamento de token">
    O login armazena um token do GitHub no armazenamento de perfis de autenticação e o troca
    por um token de API do Copilot quando o OpenClaw é executado. Você não precisa gerenciar o
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
Requer um TTY interativo. Execute o comando de login diretamente em um terminal, não
dentro de um script headless nem de um job de CI.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
