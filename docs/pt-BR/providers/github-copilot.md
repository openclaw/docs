---
read_when:
    - Você quer usar o GitHub Copilot como provedor de modelos
    - Você precisa do fluxo `openclaw models auth login-github-copilot`
    - Você está escolhendo entre o provedor Copilot integrado, o harness do SDK do Copilot e o Copilot Proxy
summary: Faça login no GitHub Copilot pelo OpenClaw usando o fluxo de dispositivo ou a importação não interativa de token
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T15:39:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

O GitHub Copilot é o assistente de programação com IA do GitHub. Ele fornece acesso aos modelos do Copilot
para sua conta e seu plano do GitHub. O OpenClaw pode usar o Copilot como provedor de
modelos ou runtime de agente de três maneiras diferentes.

## Três maneiras de usar o Copilot no OpenClaw

<Tabs>
  <Tab title="Provedor integrado (github-copilot)">
    Use o fluxo nativo de login por dispositivo para obter um token do GitHub e, em seguida, troque-o por
    tokens da API do Copilot quando o OpenClaw for executado. Este é o caminho **padrão** e mais simples,
    pois não requer o VS Code.

    <Steps>
      <Step title="Execute o comando de login">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Você receberá uma solicitação para acessar uma URL e inserir um código de uso único. Mantenha o
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
    Instale o plugin externo `@openclaw/copilot` quando quiser que a CLI e o SDK do
    Copilot do GitHub controlem o loop de agente de baixo nível para modelos
    `github-copilot/*` selecionados.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    Em seguida, habilite o runtime para um modelo ou provedor:

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

    Escolha esta opção quando quiser sessões nativas da CLI do Copilot, estado de thread
    gerenciado pelo SDK e Compaction controlada pelo Copilot para esses turnos do agente. Sem a
    habilitação explícita de `agentRuntime`, os modelos `github-copilot/*` continuam usando o
    provedor integrado. Consulte [Harness do SDK do Copilot](/pt-BR/plugins/copilot) para ver o contrato
    completo do runtime.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Use a extensão **Copilot Proxy** do VS Code como uma ponte local. O OpenClaw se comunica com
    o endpoint `/v1` do proxy (padrão `http://localhost:3000/v1`) e usa a
    lista de modelos que você configurar.

    O plugin `copilot-proxy` é fornecido com o OpenClaw e vem habilitado por padrão.
    Configure a URL base e os IDs dos modelos com:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Escolha esta opção quando já estiver executando o Copilot Proxy no VS Code ou precisar rotear
    por meio dele. A extensão do VS Code deve permanecer em execução.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (residência de dados)

Se sua organização usa um tenant do GitHub Enterprise com residência de dados (um host
`*.ghe.com`, como `your-org.ghe.com`), o Copilot fica em endpoints locais do tenant,
em vez do `github.com` público. O OpenClaw disponibiliza isso como uma
opção de autenticação de primeira classe, para que você não precise editar URLs manualmente.

<Steps>
  <Step title="Escolha a opção de autenticação Enterprise">
    Na integração inicial ou em `openclaw models auth`, escolha
    **GitHub Copilot (Enterprise / data residency)**. Será solicitado
    o domínio Enterprise (por exemplo, `your-org.ghe.com`) e, em seguida, o login por
    dispositivo será executado nesse tenant.

    Insira apenas a raiz do tenant (`your-org.ghe.com`). Hosts de serviço derivados, como
    `api.your-org.ghe.com` ou `copilot-api.your-org.ghe.com`, não são aceitos;
    o OpenClaw deriva automaticamente esses endpoints da raiz do tenant.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="O domínio é persistido na configuração">
    O host escolhido é armazenado nos parâmetros do provedor para que atualizações posteriores do token
    e conclusões sejam direcionadas automaticamente ao tenant:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

O fluxo por dispositivo, a troca de token e as conclusões são resolvidos, respectivamente, para
`https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token` e
`https://copilot-api.your-org.ghe.com`. Tokens de residência de dados contêm
uma marca do tenant e nenhuma indicação de proxy; portanto, a URL base de conclusões usa como alternativa o
host do Copilot do tenant, em vez do endpoint público.

<Note>
A troca de domínio sempre executa novamente o login por dispositivo. Se você já tiver um token
do Copilot armazenado e escolher um domínio diferente (`github.com` público ↔ um tenant
`*.ghe.com`, ou de um tenant para outro), o OpenClaw não reutilizará o token existente —
ele força um novo login para que o token fique restrito ao domínio que será gravado na
configuração. Executar novamente o login para o *mesmo* domínio ainda oferece a opção de reutilizar o token
atual. Voltar para o `github.com` público remove o `githubDomain` persistido,
fazendo a configuração retornar ao padrão.
</Note>

<Note>
A variável de ambiente `COPILOT_GITHUB_DOMAIN` substitui o domínio resolvido
em todos os caminhos do Copilot que o resolvem — o login por dispositivo Enterprise
(`--method device-enterprise`), o atalho independente
`openclaw models auth login-github-copilot`, a atualização de tokens, embeddings
e conclusões. Defina-a como seu host `*.ghe.com` para configurações totalmente
sem interface gráfica ou de CI. Deixe-a indefinida (e sem o parâmetro na configuração) para usar o
`github.com` público. Os logins persistem o domínio para o qual geraram o token (e o removem
ao fazer login no `github.com` público), de modo que o roteamento permaneça correto mesmo após a
variável de ambiente ser removida.
</Note>

## Flags opcionais

| Comando                                                                | Flag            | Descrição                                                    |
| ---------------------------------------------------------------------- | --------------- | ------------------------------------------------------------ |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Substitui um perfil de autenticação existente sem solicitar confirmação |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | Também aplica o modelo padrão recomendado pelo provedor      |

```bash
# Ignorar a confirmação de novo login
openclaw models auth login-github-copilot --yes

# Fazer login e definir o modelo padrão em uma única etapa
openclaw models auth login --provider github-copilot --method device --set-default
```

## Integração inicial não interativa

O fluxo de login por dispositivo requer uma TTY interativa. Para configuração sem interface gráfica, importe
um token de acesso OAuth existente do GitHub com `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Você também pode omitir `--auth-choice`; passar `--github-copilot-token` infere a
opção de autenticação do provedor GitHub Copilot. Se a flag for omitida, a integração inicial
usa como alternativa `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` e, por fim, `GITHUB_TOKEN`. Use
`--secret-input-mode ref` com `COPILOT_GITHUB_TOKEN` definido para armazenar um
`tokenRef` baseado em variável de ambiente, em vez de texto simples no `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interativa obrigatória">
    O fluxo de login por dispositivo requer uma TTY interativa. Execute-o diretamente em um
    terminal, não em um script não interativo nem em um pipeline de CI.
  </Accordion>

  <Accordion title="A disponibilidade dos modelos depende do seu plano">
    A disponibilidade dos modelos do Copilot depende do seu plano do GitHub. Se um modelo for
    rejeitado, tente outro ID (por exemplo, `github-copilot/gpt-5.5`). Consulte os
    [modelos compatíveis por plano do Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    do GitHub para ver a lista atual de modelos.
  </Accordion>

  <Accordion title="Atualização em tempo real do catálogo pela API do Copilot">
    Depois que o caminho de autenticação por login em dispositivo (ou variável de ambiente) resolve um token do GitHub,
    o OpenClaw atualiza o catálogo de modelos sob demanda a partir de `${baseUrl}/models`
    (o mesmo endpoint usado pelo Copilot do VS Code), para que o runtime acompanhe
    as permissões de cada conta e janelas de contexto precisas sem alterações
    constantes no manifesto. Modelos recém-publicados do Copilot ficam visíveis sem uma atualização
    do OpenClaw, e as janelas de contexto refletem os limites reais de cada modelo
    (por exemplo, 400k para a série gpt-5.x e 1M para as variantes internas
    `claude-opus-*-1m`).

    O catálogo estático incluído permanece como alternativa visível quando a descoberta
    está desabilitada, o usuário não tem um perfil de autenticação do GitHub, a troca de token
    falha ou a chamada HTTPS para `/models` apresenta erro. Para desativar esse recurso e depender
    totalmente do catálogo estático do manifesto (cenários offline ou isolados da rede):

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
    IDs de modelos Claude usam automaticamente o transporte Anthropic Messages.
    Modelos Gemini usam o transporte OpenAI Chat Completions; modelos GPT e da série o
    continuam usando o transporte OpenAI Responses. O OpenClaw seleciona o transporte
    correto com base na referência do modelo.
  </Accordion>

  <Accordion title="Compatibilidade das solicitações">
    O OpenClaw envia cabeçalhos de solicitação no estilo do IDE do Copilot nos transportes do Copilot
    (versões do editor/plugin do VS Code e o ID de integração `vscode-chat`),
    marca os turnos de acompanhamento de resultados de ferramentas como iniciados pelo agente e define o cabeçalho
    de visão do Copilot quando um turno contém entrada de imagem.
  </Accordion>

  <Accordion title="Ordem de resolução das variáveis de ambiente">
    O OpenClaw resolve a autenticação do Copilot pelas variáveis de ambiente na seguinte
    ordem de prioridade:

    | Prioridade | Variável               | Observações                              |
    | ---------- | ---------------------- | ---------------------------------------- |
    | 1          | `COPILOT_GITHUB_TOKEN` | Prioridade mais alta, específica do Copilot |
    | 2          | `GH_TOKEN`             | Token da CLI do GitHub (alternativa)     |
    | 3          | `GITHUB_TOKEN`         | Token padrão do GitHub (prioridade mais baixa) |

    Quando várias variáveis estão definidas, o OpenClaw usa aquela com maior prioridade.
    O fluxo de login por dispositivo (`openclaw models auth login-github-copilot`) armazena
    seu token no repositório de perfis de autenticação e tem precedência sobre todas as variáveis
    de ambiente.

  </Accordion>

  <Accordion title="Armazenamento de tokens">
    O login armazena um token do GitHub no repositório de perfis de autenticação (ID do perfil
    `github-copilot:github`) e o troca por um token de curta duração da API do Copilot
    quando o OpenClaw é executado. Você não precisa gerenciar o token manualmente.
  </Accordion>
</AccordionGroup>

## Embeddings de busca na memória

O GitHub Copilot também pode atuar como provedor de embeddings para a
[busca na memória](/pt-BR/concepts/memory-search). Se você tiver uma assinatura do Copilot e
já tiver feito login, o OpenClaw poderá usá-lo para embeddings sem uma chave de API separada.

### Configuração

Defina `memorySearch.provider` explicitamente para usar embeddings do GitHub Copilot. Se houver
um token do GitHub disponível, o OpenClaw descobrirá os modelos de embeddings disponíveis pela
API do Copilot e escolherá automaticamente o melhor.

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

1. O OpenClaw resolve seu token do GitHub (pelas variáveis de ambiente ou pelo perfil de autenticação).
2. Troca-o por um token de curta duração da API do Copilot.
3. Consulta o endpoint `/models` do Copilot para descobrir os modelos de embeddings disponíveis.
4. Escolhe o melhor modelo (ordem de preferência: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`).
5. Envia solicitações de embeddings ao endpoint `/embeddings` do Copilot.

A disponibilidade dos modelos depende do seu plano do GitHub. Se nenhum modelo de embeddings estiver
disponível, o OpenClaw ignora o Copilot e tenta o próximo provedor.

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
