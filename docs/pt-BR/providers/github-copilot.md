---
read_when:
    - Você quer usar o GitHub Copilot como um provedor de modelo
    - Você precisa do fluxo `openclaw models auth login-github-copilot`
summary: Entre no GitHub Copilot pelo OpenClaw usando o fluxo de dispositivo
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-25T13:54:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b5361f196bbb27ba74f281b4665eaaba770d3532eae2d02f76a14f44d3b4618
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot é o assistente de programação com IA do GitHub. Ele fornece acesso aos
modelos do Copilot para sua conta e plano do GitHub. O OpenClaw pode usar o Copilot como um
provedor de modelo de duas maneiras diferentes.

## Duas maneiras de usar o Copilot no OpenClaw

<Tabs>
  <Tab title="Provedor integrado (github-copilot)">
    Use o fluxo nativo de login por dispositivo para obter um token do GitHub e, em seguida, trocá-lo por
    tokens da API do Copilot quando o OpenClaw for executado. Este é o caminho **padrão** e mais simples,
    porque não requer o VS Code.

    <Steps>
      <Step title="Execute o comando de login">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Você receberá um prompt para visitar uma URL e inserir um código de uso único. Mantenha o
        terminal aberto até a conclusão.
      </Step>
      <Step title="Defina um modelo padrão">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Ou na configuração:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Use a extensão **Copilot Proxy** do VS Code como uma ponte local. O OpenClaw se comunica com
    o endpoint `/v1` do proxy e usa a lista de modelos que você configurar lá.

    <Note>
    Escolha esta opção quando você já executa o Copilot Proxy no VS Code ou precisa rotear
    por meio dele. Você deve habilitar o Plugin e manter a extensão do VS Code em execução.
    </Note>

  </Tab>
</Tabs>

## Sinalizadores opcionais

| Flag            | Descrição                                           |
| --------------- | --------------------------------------------------- |
| `--yes`         | Pula o prompt de confirmação                        |
| `--set-default` | Também aplica o modelo padrão recomendado do provedor |

```bash
# Pular confirmação
openclaw models auth login-github-copilot --yes

# Fazer login e definir o modelo padrão em uma etapa
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="TTY interativo obrigatório">
    O fluxo de login por dispositivo requer um TTY interativo. Execute-o diretamente em um
    terminal, não em um script não interativo nem em um pipeline de CI.
  </Accordion>

  <Accordion title="A disponibilidade do modelo depende do seu plano">
    A disponibilidade de modelos do Copilot depende do seu plano do GitHub. Se um modelo
    for rejeitado, tente outro ID (por exemplo, `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Seleção de transporte">
    IDs de modelo Claude usam automaticamente o transporte Anthropic Messages. Modelos GPT,
    série o e Gemini mantêm o transporte OpenAI Responses. O OpenClaw
    seleciona o transporte correto com base na referência do modelo.
  </Accordion>

  <Accordion title="Compatibilidade de solicitações">
    O OpenClaw envia cabeçalhos de solicitação no estilo de IDE do Copilot em transportes do Copilot,
    incluindo Compaction integrado, tool-result e turnos de acompanhamento com imagem. Ele
    não habilita a continuação de Responses no nível do provedor para o Copilot, a menos que
    esse comportamento tenha sido verificado na API do Copilot.
  </Accordion>

  <Accordion title="Ordem de resolução de variáveis de ambiente">
    O OpenClaw resolve a autenticação do Copilot a partir de variáveis de ambiente na seguinte
    ordem de prioridade:

    | Prioridade | Variável              | Observações                       |
    | ---------- | --------------------- | --------------------------------- |
    | 1          | `COPILOT_GITHUB_TOKEN` | Maior prioridade, específica do Copilot |
    | 2          | `GH_TOKEN`            | Token do GitHub CLI (fallback)    |
    | 3          | `GITHUB_TOKEN`        | Token padrão do GitHub (menor prioridade) |

    Quando várias variáveis estão definidas, o OpenClaw usa a de maior prioridade.
    O fluxo de login por dispositivo (`openclaw models auth login-github-copilot`) armazena
    seu token no armazenamento de perfis de autenticação e tem precedência sobre todas as
    variáveis de ambiente.

  </Accordion>

  <Accordion title="Armazenamento de token">
    O login armazena um token do GitHub no armazenamento de perfis de autenticação e o troca
    por um token da API do Copilot quando o OpenClaw é executado. Você não precisa gerenciar o
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
Requer um TTY interativo. Execute o comando de login diretamente em um terminal, não
dentro de um script sem interface ou job de CI.
</Warning>

## Embeddings de pesquisa de memória

O GitHub Copilot também pode servir como um provedor de embeddings para
[pesquisa de memória](/pt-BR/concepts/memory-search). Se você tiver uma assinatura do Copilot e
tiver feito login, o OpenClaw poderá usá-lo para embeddings sem uma chave de API separada.

### Detecção automática

Quando `memorySearch.provider` é `"auto"` (o padrão), o GitHub Copilot é tentado
na prioridade 15 -- depois dos embeddings locais, mas antes do OpenAI e de outros
provedores pagos. Se um token do GitHub estiver disponível, o OpenClaw descobre os modelos
de embedding disponíveis pela API do Copilot e escolhe automaticamente o melhor.

### Configuração explícita

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opcional: substituir o modelo descoberto automaticamente
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Como funciona

1. O OpenClaw resolve seu token do GitHub (a partir de variáveis de ambiente ou perfil de autenticação).
2. Troca-o por um token da API do Copilot de curta duração.
3. Consulta o endpoint `/models` do Copilot para descobrir os modelos de embedding disponíveis.
4. Escolhe o melhor modelo (prefere `text-embedding-3-small`).
5. Envia solicitações de embedding para o endpoint `/embeddings` do Copilot.

A disponibilidade do modelo depende do seu plano do GitHub. Se nenhum modelo de embedding
estiver disponível, o OpenClaw ignora o Copilot e tenta o próximo provedor.

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
