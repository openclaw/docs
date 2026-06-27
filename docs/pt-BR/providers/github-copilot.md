---
read_when:
    - Você quer usar o GitHub Copilot como provedor de modelo
    - Você precisa do fluxo `openclaw models auth login-github-copilot`
    - Você está escolhendo entre o provedor Copilot integrado, o harness do SDK do Copilot e o Copilot Proxy
summary: Entre no GitHub Copilot pelo OpenClaw usando o fluxo de dispositivo ou a importação de token não interativa
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:03:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot é o assistente de codificação com IA do GitHub. Ele fornece acesso aos
modelos Copilot para sua conta e plano do GitHub. OpenClaw pode usar Copilot como um
provedor de modelos ou ambiente de execução de agente de três maneiras diferentes.

## Três maneiras de usar Copilot no OpenClaw

<Tabs>
  <Tab title="Provedor integrado (github-copilot)">
    Use o fluxo nativo de login por dispositivo para obter um token do GitHub e depois trocá-lo por
    tokens da API do Copilot quando o OpenClaw for executado. Este é o caminho **padrão** e mais simples
    porque não exige VS Code.

    <Steps>
      <Step title="Execute o comando de login">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Você será solicitado a visitar uma URL e inserir um código de uso único. Mantenha o
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

  <Tab title="Plugin de harness do SDK do Copilot (copilot)">
    Instale o Plugin externo `@openclaw/copilot` quando quiser que a CLI e o SDK
    do Copilot do GitHub controlem o loop de agente de baixo nível para modelos
    `github-copilot/*` selecionados.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    Depois, habilite um modelo ou provedor no ambiente de execução:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    Escolha isto quando quiser sessões nativas da CLI do Copilot, estado de thread
    gerenciado pelo SDK e Compaction controlada pelo Copilot para esses turnos de agente. Consulte
    [harness do SDK do Copilot](/pt-BR/plugins/copilot) para ver o contrato completo do ambiente de execução.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Use a extensão **Copilot Proxy** do VS Code como uma ponte local. OpenClaw se comunica com
    o endpoint `/v1` do proxy e usa a lista de modelos que você configurar lá.

    <Note>
    Escolha isto quando você já executa o Copilot Proxy no VS Code ou precisa rotear
    por meio dele. Você deve habilitar o Plugin e manter a extensão do VS Code em execução.
    </Note>

  </Tab>
</Tabs>

## Flags opcionais

| Flag            | Descrição                                           |
| --------------- | --------------------------------------------------- |
| `--yes`         | Pula o prompt de confirmação                        |
| `--set-default` | Também aplica o modelo padrão recomendado do provedor |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Onboarding não interativo

Se você já tem um token de acesso OAuth do GitHub para Copilot, importe-o durante
a configuração sem interface com `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Você também pode omitir `--auth-choice`; passar `--github-copilot-token` infere a
escolha de autenticação do provedor GitHub Copilot. Se a flag for omitida, o onboarding
recorre a `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` e depois `GITHUB_TOKEN`. Use
`--secret-input-mode ref` com `COPILOT_GITHUB_TOKEN` definido para armazenar um
`tokenRef` baseado em variável de ambiente em vez de texto simples em `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interativo obrigatório">
    O fluxo de login por dispositivo exige um TTY interativo. Execute-o diretamente em um
    terminal, não em um script não interativo ou pipeline de CI.
  </Accordion>

  <Accordion title="A disponibilidade de modelos depende do seu plano">
    A disponibilidade de modelos do Copilot depende do seu plano do GitHub. Se um modelo for
    rejeitado, tente outro ID (por exemplo, `github-copilot/gpt-5.5`). Consulte os
    [modelos compatíveis por plano Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    do GitHub para ver a lista atual de modelos.
  </Accordion>

  <Accordion title="Atualização de catálogo ao vivo pela API do Copilot">
    Depois que o caminho de autenticação por login de dispositivo (ou variável de ambiente) resolve um token do GitHub,
    OpenClaw atualiza o catálogo de modelos sob demanda a partir de `${baseUrl}/models`
    (o mesmo endpoint usado pelo VS Code Copilot), para que o ambiente de execução acompanhe
    direitos por conta e janelas de contexto precisas sem rotatividade de manifesto.
    Modelos Copilot recém-publicados ficam visíveis sem uma atualização do OpenClaw,
    e as janelas de contexto refletem os limites reais por modelo
    (por exemplo, 400k para a série gpt-5.x, 1M para as variantes internas
    `claude-opus-*-1m`).

    O catálogo estático incluído permanece como fallback visível quando a descoberta
    está desabilitada, o usuário não tem perfil de autenticação do GitHub, a troca de token
    falha ou a chamada HTTPS para `/models` gera erro. Para desativar e confiar inteiramente
    no catálogo estático do manifesto (cenários offline / air-gapped):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Seleção de transporte">
    IDs de modelos Claude usam automaticamente o transporte Anthropic Messages. Modelos GPT,
    o-series e Gemini mantêm o transporte OpenAI Responses. OpenClaw
    seleciona o transporte correto com base na referência do modelo.
  </Accordion>

  <Accordion title="Compatibilidade de requisições">
    OpenClaw envia cabeçalhos de requisição no estilo IDE do Copilot em transportes Copilot,
    incluindo turnos de Compaction integrada, resultado de ferramenta e acompanhamento de imagem. Ele
    não habilita continuação Responses no nível do provedor para Copilot, a menos
    que esse comportamento tenha sido verificado em relação à API do Copilot.
  </Accordion>

  <Accordion title="Ordem de resolução de variáveis de ambiente">
    OpenClaw resolve a autenticação do Copilot a partir de variáveis de ambiente na seguinte
    ordem de prioridade:

    | Prioridade | Variável              | Observações                       |
    | ---------- | --------------------- | --------------------------------- |
    | 1          | `COPILOT_GITHUB_TOKEN` | Maior prioridade, específica do Copilot |
    | 2          | `GH_TOKEN`            | Token da CLI do GitHub (fallback) |
    | 3          | `GITHUB_TOKEN`        | Token padrão do GitHub (menor prioridade) |

    Quando várias variáveis estão definidas, OpenClaw usa a de maior prioridade.
    O fluxo de login por dispositivo (`openclaw models auth login-github-copilot`) armazena
    seu token no armazenamento de perfis de autenticação e tem precedência sobre todas as variáveis
    de ambiente.

  </Accordion>

  <Accordion title="Armazenamento de token">
    O login armazena um token do GitHub no armazenamento de perfis de autenticação e o troca
    por um token da API do Copilot quando o OpenClaw é executado. Você não precisa gerenciar o
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
O comando de login por dispositivo exige um TTY interativo. Use o onboarding não interativo
quando precisar de configuração sem interface.
</Warning>

## Embeddings de busca de memória

GitHub Copilot também pode atuar como provedor de embeddings para
[busca de memória](/pt-BR/concepts/memory-search). Se você tem uma assinatura do Copilot e
fez login, OpenClaw pode usá-lo para embeddings sem uma chave de API separada.

### Configuração

Defina `memorySearch.provider` explicitamente para usar embeddings do GitHub Copilot. Se um
token do GitHub estiver disponível, OpenClaw descobre os modelos de embedding disponíveis pela
API do Copilot e escolhe automaticamente o melhor.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Como funciona

1. OpenClaw resolve seu token do GitHub (a partir de variáveis de ambiente ou perfil de autenticação).
2. Troca-o por um token de curta duração da API do Copilot.
3. Consulta o endpoint `/models` do Copilot para descobrir modelos de embedding disponíveis.
4. Escolhe o melhor modelo (prefere `text-embedding-3-small`).
5. Envia requisições de embedding para o endpoint `/embeddings` do Copilot.

A disponibilidade de modelos depende do seu plano do GitHub. Se nenhum modelo de embedding estiver
disponível, OpenClaw pula o Copilot e tenta o próximo provedor.

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
