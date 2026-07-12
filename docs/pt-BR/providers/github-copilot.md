---
read_when:
    - Você quer usar o GitHub Copilot como provedor de modelos
    - Você precisa do fluxo `openclaw models auth login-github-copilot`
    - Você está escolhendo entre o provedor Copilot integrado, o harness do Copilot SDK e o Copilot Proxy
summary: Entre no GitHub Copilot pelo OpenClaw usando o fluxo de dispositivo ou a importação não interativa de token
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T00:17:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot é o assistente de programação com IA do GitHub. Ele fornece acesso aos modelos do Copilot para sua conta e seu plano do GitHub. O OpenClaw pode usar o Copilot como provedor de modelos ou runtime de agente de três maneiras diferentes.

## Três maneiras de usar o Copilot no OpenClaw

<Tabs>
  <Tab title="Provedor integrado (github-copilot)">
    Use o fluxo nativo de login por dispositivo para obter um token do GitHub e, em seguida, trocá-lo por tokens da API do Copilot quando o OpenClaw for executado. Este é o caminho **padrão** e mais simples, pois não requer o VS Code.

    <Steps>
      <Step title="Execute o comando de login">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Você receberá uma solicitação para acessar uma URL e inserir um código de uso único. Mantenha o terminal aberto até a conclusão.
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

  <Tab title="Plugin de integração do SDK do Copilot (copilot)">
    Instale o plugin externo `@openclaw/copilot` quando quiser que a CLI e o SDK do Copilot do GitHub controlem o loop de agente de baixo nível para modelos `github-copilot/*` selecionados.

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

    Escolha essa opção quando quiser sessões nativas da CLI do Copilot, estado de thread gerenciado pelo SDK e Compaction controlada pelo Copilot para essas interações do agente. Sem a habilitação explícita de `agentRuntime`, os modelos `github-copilot/*` continuarão usando o provedor integrado. Consulte [Integração do SDK do Copilot](/pt-BR/plugins/copilot) para ver o contrato completo do runtime.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Use a extensão **Copilot Proxy** do VS Code como uma ponte local. O OpenClaw se comunica com o endpoint `/v1` do proxy (por padrão, `http://localhost:3000/v1`) e usa a lista de modelos que você configurar.

    O plugin `copilot-proxy` é fornecido com o OpenClaw e vem habilitado por padrão. Configure a URL base e os IDs dos modelos com:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Escolha essa opção quando já estiver executando o Copilot Proxy no VS Code ou precisar rotear por meio dele. A extensão do VS Code deve permanecer em execução.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (residência de dados)

Se sua organização usa um tenant do GitHub Enterprise com residência de dados (um host `*.ghe.com`, como `your-org.ghe.com`), o Copilot opera em endpoints locais do tenant, em vez do `github.com` público. O OpenClaw oferece isso como uma opção de autenticação de primeira classe, para que você não precise editar URLs manualmente.

<Steps>
  <Step title="Escolha a opção de autenticação Enterprise">
    Durante a integração inicial ou em `openclaw models auth`, escolha **GitHub Copilot (Enterprise / data residency)**. Você receberá uma solicitação para informar seu domínio Enterprise (por exemplo, `your-org.ghe.com`) e, em seguida, o login por dispositivo será executado nesse tenant.

    Insira somente a raiz do tenant (`your-org.ghe.com`). Hosts de serviço derivados, como `api.your-org.ghe.com` ou `copilot-api.your-org.ghe.com`, não são aceitos; o OpenClaw deriva esses endpoints automaticamente a partir da raiz do tenant.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="O domínio é persistido na configuração">
    O host escolhido é armazenado nos parâmetros do provedor, para que as atualizações posteriores do token e as conclusões sejam direcionadas automaticamente ao tenant:

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

O fluxo por dispositivo, a troca de tokens e as conclusões são resolvidos, respectivamente, para `https://your-org.ghe.com/login/device/code`, `https://api.your-org.ghe.com/copilot_internal/v2/token` e `https://copilot-api.your-org.ghe.com`. Os tokens de residência de dados carregam uma marca do tenant e nenhuma indicação de proxy; portanto, a URL base das conclusões usa como alternativa o host do Copilot do tenant, em vez do endpoint público.

<Note>
A troca de domínio sempre executa novamente o login por dispositivo. Se você já tiver um token do Copilot armazenado e escolher um domínio diferente (`github.com` público ↔ um tenant `*.ghe.com` ou de um tenant para outro), o OpenClaw não reutilizará o token existente — ele força um novo login para que o escopo do token corresponda ao domínio que será gravado na configuração. A repetição do login para o *mesmo* domínio ainda oferece a opção de reutilizar o token atual. Voltar ao `github.com` público limpa o `githubDomain` persistido, para que a configuração retorne ao padrão.
</Note>

<Note>
A variável de ambiente `COPILOT_GITHUB_DOMAIN` substitui o domínio resolvido em todos os caminhos do Copilot que o utilizam — o login por dispositivo Enterprise (`--method device-enterprise`), o atalho independente `openclaw models auth login-github-copilot`, a atualização de tokens, os embeddings e as conclusões. Defina-a como seu host `*.ghe.com` para configurações totalmente sem interface ou de CI. Deixe-a indefinida (e sem o parâmetro na configuração) para usar o `github.com` público. Os logins persistem o domínio para o qual emitiram o token (e o removem ao fazer login no `github.com` público), garantindo que o roteamento permaneça correto mesmo depois que a variável de ambiente for removida.
</Note>

## Flags opcionais

| Comando                                                                | Flag            | Descrição                                                        |
| ---------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Sobrescreve um perfil de autenticação existente sem solicitar confirmação |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | Também aplica o modelo padrão recomendado pelo provedor          |

```bash
# Ignorar a confirmação para refazer o login
openclaw models auth login-github-copilot --yes

# Fazer login e definir o modelo padrão em uma única etapa
openclaw models auth login --provider github-copilot --method device --set-default
```

## Integração inicial não interativa

O fluxo de login por dispositivo requer uma TTY interativa. Para uma configuração sem interface, importe um token de acesso OAuth existente do GitHub com `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Você também pode omitir `--auth-choice`; fornecer `--github-copilot-token` infere a opção de autenticação do provedor GitHub Copilot. Se a flag for omitida, a integração inicial recorre, nesta ordem, a `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` e `GITHUB_TOKEN`. Use `--secret-input-mode ref` com `COPILOT_GITHUB_TOKEN` definida para armazenar uma `tokenRef` baseada em variável de ambiente, em vez de texto simples em `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interativa obrigatória">
    O fluxo de login por dispositivo requer uma TTY interativa. Execute-o diretamente em um terminal, não em um script não interativo nem em um pipeline de CI.
  </Accordion>

  <Accordion title="A disponibilidade dos modelos depende do seu plano">
    A disponibilidade dos modelos do Copilot depende do seu plano do GitHub. Se um modelo for rejeitado, tente outro ID (por exemplo, `github-copilot/gpt-5.5`). Consulte os [modelos compatíveis por plano do Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan) do GitHub para ver a lista atual de modelos.
  </Accordion>

  <Accordion title="Atualização em tempo real do catálogo pela API do Copilot">
    Depois que o caminho de autenticação por login de dispositivo (ou variável de ambiente) resolver um token do GitHub, o OpenClaw atualizará o catálogo de modelos sob demanda a partir de `${baseUrl}/models` (o mesmo endpoint usado pelo Copilot no VS Code), permitindo que o runtime acompanhe os direitos de acesso de cada conta e as janelas de contexto exatas sem alterações contínuas no manifesto. Modelos do Copilot recém-publicados ficam visíveis sem uma atualização do OpenClaw, e as janelas de contexto refletem os limites reais de cada modelo (por exemplo, 400 mil para a série gpt-5.x e 1 milhão para as variantes internas `claude-opus-*-1m`).

    O catálogo estático incluído permanece como alternativa visível quando a descoberta está desabilitada, o usuário não tem um perfil de autenticação do GitHub, a troca de tokens falha ou a chamada HTTPS para `/models` apresenta erro. Para desativar esse comportamento e usar exclusivamente o catálogo estático do manifesto (cenários offline ou isolados da rede):

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
    IDs de modelos Claude usam automaticamente o transporte Anthropic Messages. Modelos Gemini usam o transporte OpenAI Chat Completions; modelos GPT e da série o continuam usando o transporte OpenAI Responses. O OpenClaw seleciona o transporte correto com base na referência do modelo.
  </Accordion>

  <Accordion title="Compatibilidade das solicitações">
    O OpenClaw envia cabeçalhos de solicitação no estilo das IDEs do Copilot nos transportes do Copilot (versões do editor/plugin do VS Code e o ID de integração `vscode-chat`), marca as interações de acompanhamento com resultados de ferramentas como iniciadas pelo agente e define o cabeçalho de visão do Copilot quando uma interação contém uma imagem de entrada.
  </Accordion>

  <Accordion title="Ordem de resolução das variáveis de ambiente">
    O OpenClaw resolve a autenticação do Copilot a partir das variáveis de ambiente na seguinte ordem de prioridade:

    | Prioridade | Variável               | Observações                                  |
    | ---------- | ---------------------- | -------------------------------------------- |
    | 1          | `COPILOT_GITHUB_TOKEN` | Maior prioridade, específica do Copilot      |
    | 2          | `GH_TOKEN`             | Token da CLI do GitHub (alternativa)         |
    | 3          | `GITHUB_TOKEN`         | Token padrão do GitHub (menor prioridade)    |

    Quando várias variáveis estão definidas, o OpenClaw usa aquela com maior prioridade. O fluxo de login por dispositivo (`openclaw models auth login-github-copilot`) armazena seu token no repositório de perfis de autenticação e tem precedência sobre todas as variáveis de ambiente.

  </Accordion>

  <Accordion title="Armazenamento de tokens">
    O login armazena um token do GitHub no repositório de perfis de autenticação (ID do perfil `github-copilot:github`) e o troca por um token de curta duração da API do Copilot quando o OpenClaw é executado. Você não precisa gerenciar o token manualmente.
  </Accordion>
</AccordionGroup>

## Embeddings para pesquisa de memória

O GitHub Copilot também pode atuar como provedor de embeddings para a [pesquisa de memória](/pt-BR/concepts/memory-search). Se você tiver uma assinatura do Copilot e estiver conectado, o OpenClaw poderá usá-lo para embeddings sem uma chave de API separada.

### Configuração

Defina `memorySearch.provider` explicitamente para usar embeddings do GitHub Copilot. Se houver um token do GitHub disponível, o OpenClaw descobrirá os modelos de embedding disponíveis pela API do Copilot e escolherá automaticamente o melhor deles.

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

1. O OpenClaw resolve seu token do GitHub (a partir de variáveis de ambiente ou do perfil de autenticação).
2. Troca-o por um token de curta duração da API do Copilot.
3. Consulta o endpoint `/models` do Copilot para descobrir os modelos de embedding disponíveis.
4. Escolhe o melhor modelo (ordem de preferência: `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002`).
5. Envia solicitações de embedding ao endpoint `/embeddings` do Copilot.

A disponibilidade dos modelos depende do seu plano do GitHub. Se nenhum modelo de embedding estiver disponível, o OpenClaw ignorará o Copilot e tentará o próximo provedor.

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e o comportamento de failover.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
