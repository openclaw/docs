---
read_when:
    - Você quer usar o GitHub Copilot como provedor de modelo
    - Você precisa do fluxo `openclaw models auth login-github-copilot`
summary: Entre no GitHub Copilot pelo OpenClaw usando o fluxo de dispositivo ou a importação de token não interativa
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T10:04:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot é o assistente de codificação com IA do GitHub. Ele fornece acesso aos modelos do Copilot para sua conta e plano do GitHub. O OpenClaw pode usar o Copilot como provedor de modelos de duas maneiras diferentes.

## Duas formas de usar o Copilot no OpenClaw

<Tabs>
  <Tab title="Provedor integrado (github-copilot)">
    Use o fluxo nativo de login do dispositivo para obter um token do GitHub e, em seguida, trocá-lo por
    tokens da API do Copilot quando o OpenClaw for executado. Este é o caminho **padrão** e mais simples
    porque não exige o VS Code.

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

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Use a extensão **Copilot Proxy** do VS Code como uma ponte local. O OpenClaw se comunica com
    o endpoint `/v1` do proxy e usa a lista de modelos que você configura lá.

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
| `--set-default` | Também aplica o modelo padrão recomendado pelo provedor |

```bash
# Pular confirmação
openclaw models auth login-github-copilot --yes

# Fazer login e definir o modelo padrão em uma etapa
openclaw models auth login --provider github-copilot --method device --set-default
```

## Integração não interativa

Se você já tem um token de acesso OAuth do GitHub para o Copilot, importe-o durante
a configuração sem interface interativa com `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Você também pode omitir `--auth-choice`; passar `--github-copilot-token` infere a
opção de autenticação do provedor GitHub Copilot. Se a flag for omitida, a integração
recorre a `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` e depois `GITHUB_TOKEN`. Use
`--secret-input-mode ref` com `COPILOT_GITHUB_TOKEN` definido para armazenar um
`tokenRef` baseado em variável de ambiente em vez de texto simples em `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interativo obrigatório">
    O fluxo de login do dispositivo exige um TTY interativo. Execute-o diretamente em um
    terminal, não em um script não interativo ou pipeline de CI.
  </Accordion>

  <Accordion title="A disponibilidade de modelos depende do seu plano">
    A disponibilidade de modelos do Copilot depende do seu plano do GitHub. Se um modelo for
    rejeitado, tente outro ID (por exemplo, `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Seleção de transporte">
    IDs de modelo Claude usam automaticamente o transporte Anthropic Messages. Modelos GPT,
    o-series e Gemini mantêm o transporte OpenAI Responses. O OpenClaw
    seleciona o transporte correto com base na referência do modelo.
  </Accordion>

  <Accordion title="Compatibilidade de solicitações">
    O OpenClaw envia cabeçalhos de solicitação no estilo IDE do Copilot em transportes do Copilot,
    incluindo turnos integrados de Compaction, resultado de ferramenta e acompanhamento de imagem. Ele
    não habilita continuação de Responses no nível do provedor para o Copilot, a menos que
    esse comportamento tenha sido verificado com a API do Copilot.
  </Accordion>

  <Accordion title="Ordem de resolução de variáveis de ambiente">
    O OpenClaw resolve a autenticação do Copilot a partir de variáveis de ambiente na seguinte
    ordem de prioridade:

    | Prioridade | Variável              | Observações                      |
    | ---------- | --------------------- | -------------------------------- |
    | 1          | `COPILOT_GITHUB_TOKEN` | Prioridade mais alta, específica do Copilot |
    | 2          | `GH_TOKEN`            | Token da CLI do GitHub (fallback) |
    | 3          | `GITHUB_TOKEN`        | Token padrão do GitHub (mais baixa) |

    Quando várias variáveis estão definidas, o OpenClaw usa a de maior prioridade.
    O fluxo de login do dispositivo (`openclaw models auth login-github-copilot`) armazena
    seu token no repositório de perfis de autenticação e tem precedência sobre todas as variáveis
    de ambiente.

  </Accordion>

  <Accordion title="Armazenamento de token">
    O login armazena um token do GitHub no repositório de perfis de autenticação e o troca
    por um token da API do Copilot quando o OpenClaw é executado. Você não precisa gerenciar o
    token manualmente.
  </Accordion>
</AccordionGroup>

<Warning>
O comando de login do dispositivo exige um TTY interativo. Use a integração não interativa
quando precisar de configuração sem interface interativa.
</Warning>

## Embeddings de busca de memória

O GitHub Copilot também pode atuar como provedor de embeddings para
[busca de memória](/pt-BR/concepts/memory-search). Se você tem uma assinatura do Copilot e
fez login, o OpenClaw pode usá-lo para embeddings sem uma chave de API separada.

### Detecção automática

Quando `memorySearch.provider` é `"auto"` (o padrão), o GitHub Copilot é tentado
na prioridade 15 -- depois de embeddings locais, mas antes do OpenAI e outros
provedores pagos. Se um token do GitHub estiver disponível, o OpenClaw descobre os
modelos de embedding disponíveis na API do Copilot e escolhe automaticamente o melhor.

### Configuração explícita

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opcional: substitua o modelo descoberto automaticamente
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Como funciona

1. O OpenClaw resolve seu token do GitHub (a partir de variáveis de ambiente ou perfil de autenticação).
2. Troca-o por um token de API do Copilot de curta duração.
3. Consulta o endpoint `/models` do Copilot para descobrir modelos de embedding disponíveis.
4. Escolhe o melhor modelo (prefere `text-embedding-3-small`).
5. Envia solicitações de embedding para o endpoint `/embeddings` do Copilot.

A disponibilidade de modelos depende do seu plano do GitHub. Se nenhum modelo de embedding estiver
disponível, o OpenClaw pula o Copilot e tenta o próximo provedor.

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
