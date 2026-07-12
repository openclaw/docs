---
read_when:
    - Escolha ou troca de modelos, configuração de aliases
    - Depuração do failover de modelos / "Todos os modelos falharam"
    - Entendendo os perfis de autenticação e como gerenciá-los
sidebarTitle: Models FAQ
summary: 'Perguntas frequentes: padrões de modelos, seleção, aliases, alternância, failover e perfis de autenticação'
title: 'Perguntas frequentes: modelos e autenticação'
x-i18n:
    generated_at: "2026-07-11T23:58:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  Perguntas e respostas sobre modelos e perfis de autenticação. Para configuração, sessões, Gateway, canais e
  solução de problemas, consulte as principais [Perguntas frequentes](/pt-BR/help/faq).

  ## Modelos: padrões, seleção, aliases e alternância

  <AccordionGroup>
  <Accordion title='O que é o "modelo padrão"?'>
    Definido com:

    ```text
    agents.defaults.model.primary
    ```

    Os modelos são referências `provedor/modelo` (exemplo: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Sempre defina `provedor/modelo` explicitamente. Se
    você omitir o provedor, o OpenClaw tenta primeiro encontrar um alias correspondente,
    depois uma correspondência única entre os provedores configurados para esse identificador
    de modelo e, por fim, recorre ao provedor padrão configurado (caminho de
    compatibilidade obsoleto). Se esse provedor não tiver mais o modelo padrão
    configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado em vez
    de usar um padrão desatualizado.

  </Accordion>

  <Accordion title="Qual modelo vocês recomendam?">
    Use o modelo mais avançado da geração mais recente oferecido pelo seu conjunto
    de provedores, especialmente para agentes com ferramentas habilitadas ou que
    recebam entradas não confiáveis — modelos mais fracos ou excessivamente
    quantizados são mais vulneráveis à injeção de prompt e a comportamentos
    inseguros (consulte [Segurança](/pt-BR/gateway/security)). Direcione modelos mais
    econômicos a conversas rotineiras ou de baixo risco de acordo com a função do agente.

    Direcione modelos por agente e use subagentes para paralelizar tarefas longas
    (cada subagente consome seus próprios tokens). Consulte [Modelos](/pt-BR/concepts/models),
    [Subagentes](/pt-BR/tools/subagents), [MiniMax](/pt-BR/providers/minimax) e
    [Modelos locais](/pt-BR/gateway/local-models).

  </Accordion>

  <Accordion title="Como alterno modelos sem apagar minha configuração?">
    Altere somente os campos de modelo — evite substituir toda a configuração.

    - `/model` na conversa (por sessão; consulte [Comandos de barra](/pt-BR/tools/slash-commands))
    - `openclaw models set ...` (atualiza somente a configuração do modelo)
    - `openclaw configure --section model` (interativo)
    - edite diretamente `agents.defaults.model` em `~/.openclaw/openclaw.json`

    Para edições via RPC, primeiro inspecione com `config.schema.lookup` (caminho
    normalizado, documentação superficial do esquema e resumos dos elementos
    filhos) e prefira `config.patch` a `config.apply` com um objeto parcial. Se
    você tiver sobrescrito a configuração, restaure-a pelo backup ou execute
    `openclaw doctor` para corrigi-la.

    Documentação: [Modelos](/pt-BR/concepts/models), [Configuração](/pt-BR/cli/configure),
    [Config](/pt-BR/cli/config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usar modelos auto-hospedados (llama.cpp, vLLM, Ollama)?">
    Sim — Ollama é o caminho mais fácil. Configuração rápida:

    1. Instale o Ollama por `https://ollama.com/download`
    2. Baixe um modelo local, por exemplo, `ollama pull gemma4`
    3. Para usar também modelos em nuvem, execute `ollama signin`
    4. Execute `openclaw onboard`, escolha `Ollama` e depois `Local` ou `Cloud + Local`

    `Cloud + Local` oferece modelos em nuvem junto com seus modelos locais do
    Ollama; modelos em nuvem como `kimi-k2.5:cloud` não precisam ser baixados
    localmente. Para alternar manualmente: `openclaw models list` e depois
    `openclaw models set ollama/<model>`.

    Modelos menores ou muito quantizados são mais vulneráveis à injeção de prompt.
    Use modelos grandes para qualquer bot com acesso a ferramentas; se ainda assim
    usar modelos pequenos, habilite o isolamento em sandbox e listas de permissões
    rigorosas para ferramentas.

    Documentação: [Ollama](/pt-BR/providers/ollama), [Modelos locais](/pt-BR/gateway/local-models),
    [Provedores de modelos](/pt-BR/concepts/model-providers), [Segurança](/pt-BR/gateway/security),
    [Isolamento em sandbox](/pt-BR/gateway/sandboxing).

  </Accordion>

  <Accordion title="Como alterno modelos dinamicamente (sem reiniciar)?">
    Envie `/model <name>` como uma mensagem independente. Consulte
    [Comandos de barra](/pt-BR/tools/slash-commands) para ver a
    lista completa de comandos, incluindo o seletor numerado (`/model`, `/model
    list`, `/model 3`), `/model default` para remover uma substituição da sessão e
    `/model status` para obter detalhes sobre o endpoint e o modo da API.

    Force um perfil de autenticação específico por sessão com `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Para desafixar um perfil definido com `@profile`, execute `/model` novamente
    sem o sufixo (por exemplo, `/model anthropic/claude-opus-4-6`) ou escolha o
    padrão em `/model`. Use `/model status` para confirmar o perfil de autenticação
    ativo.

  </Accordion>

  <Accordion title="Se dois provedores disponibilizarem o mesmo identificador de modelo, qual deles o /model usará?">
    `/model provider/model` seleciona exatamente essa rota de provedor. Por exemplo,
    `qianfan/deepseek-v4-flash` e `deepseek/deepseek-v4-flash` são referências
    diferentes, embora o identificador do modelo seja igual — o OpenClaw não
    alterna silenciosamente entre provedores com base apenas na correspondência
    do identificador.

    Uma referência `/model` selecionada pelo usuário é estrita quanto ao fallback:
    se esse provedor/modelo ficar indisponível, a resposta falhará de forma visível
    em vez de recorrer a `agents.defaults.model.fallbacks`. As cadeias de fallback
    configuradas ainda se aplicam aos padrões configurados, aos modelos primários
    de tarefas Cron e ao estado de fallback selecionado automaticamente. Quando
    uma execução sem substituição de sessão pode usar fallback, o OpenClaw tenta
    primeiro o provedor/modelo solicitado, depois os fallbacks configurados e,
    por fim, o modelo primário configurado — portanto, identificadores simples de
    modelo duplicados nunca retornam diretamente ao provedor padrão.

    Consulte [Modelos](/pt-BR/concepts/models) e [Failover de modelos](/pt-BR/concepts/model-failover).

  </Accordion>

  <Accordion title="Posso usar GPT 5.5 para tarefas diárias e Codex 5.5 para programação?">
    Sim — a escolha do modelo e a escolha do ambiente de execução são independentes:

    - **Agente de programação nativo do Codex:** defina `agents.defaults.model.primary`
      como `openai/gpt-5.5`. Entre com `openclaw models auth login --provider
      openai` para usar a autenticação da assinatura do ChatGPT/Codex.
    - **Tarefas diretas da API da OpenAI fora do ciclo do agente:** configure
      `OPENAI_API_KEY` para imagens, embeddings, fala, comunicação em tempo real e
      outras interfaces da API da OpenAI não relacionadas a agentes.
    - **Autenticação do agente OpenAI por chave de API:** use `/model openai/gpt-5.5`
      com um perfil ordenado de chaves de API do `openai`.
    - **Subagentes:** direcione tarefas de programação a um agente especializado
      no Codex com seu próprio modelo `openai/gpt-5.5`.

    Consulte [Modelos](/pt-BR/concepts/models) e [Comandos de barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como configuro o modo rápido para o GPT 5.5?">
    - **Por sessão:** envie `/fast on` enquanto estiver usando `openai/gpt-5.5`.
    - **Como padrão por modelo:** defina
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` como `true`.
    - **Limite automático:** `/fast auto` ou `params.fastMode: "auto"` executa
      rapidamente as novas chamadas de modelo até o limite e depois executa as
      chamadas posteriores de nova tentativa, fallback, resultado de ferramenta
      ou continuação sem o modo rápido. O limite padrão é de 60 segundos; substitua-o
      com `params.fastAutoOnSeconds` no modelo.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    O modo rápido corresponde a `service_tier = "priority"` nas solicitações
    nativas do OpenAI Responses; os valores existentes de `service_tier` são
    preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`.
    As substituições de sessão feitas com `/fast` têm precedência sobre os padrões
    da configuração.

    Consulte [Raciocínio e modo rápido](/pt-BR/tools/thinking) e a seção sobre modo rápido
    em Configuração avançada na página do provedor [OpenAI](/pt-BR/providers/openai).

  </Accordion>

  <Accordion title='Por que vejo "Model ... is not allowed" e depois não recebo resposta?'>
    Se `agents.defaults.models` estiver definido, ele se tornará a **lista de permissões**
    de `/model` e das substituições de sessão. Selecionar um modelo fora dessa
    lista retorna a mensagem a seguir em vez de uma resposta normal:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Correção: adicione o modelo exato a `agents.defaults.models`, adicione um
    curinga de provedor como `"provider/*": {}` para catálogos dinâmicos, remova
    a lista de permissões ou escolha um modelo em `/model list`. Se o comando
    também incluir `--runtime codex`, primeiro atualize a lista de permissões e
    depois execute novamente o mesmo comando
    `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Por que vejo "Unknown model: minimax/MiniMax-M3"?'>
    Se você estiver usando uma versão antiga do OpenClaw, primeiro atualize-a
    (ou execute o `main` a partir do código-fonte) e reinicie o Gateway —
    `MiniMax-M3` talvez ainda não esteja no catálogo da versão instalada. Caso
    contrário, o provedor MiniMax não está configurado (nenhuma entrada de provedor
    ou perfil de autenticação foi encontrado), portanto não é possível resolver
    o modelo. Consulte a seção Solução de problemas na página do provedor
    [MiniMax](/pt-BR/providers/minimax) para ver a lista de verificação completa da
    correção, a tabela de identificadores de provedor/modelo e um exemplo de
    bloco de configuração.

  </Accordion>

  <Accordion title="Posso usar o MiniMax como padrão e o OpenAI para tarefas complexas?">
    Sim. Use o MiniMax como padrão e alterne os modelos por sessão — os fallbacks
    servem para erros, não para "tarefas difíceis"; portanto, use `/model` ou um
    agente separado.

    **Opção A: alternar por sessão**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Depois, use `/model gpt`.

    **Opção B: agentes separados** — o Agente A usa o MiniMax como padrão e o
    Agente B usa o OpenAI como padrão; faça o direcionamento por agente ou use
    `/agent` para alternar.

    Documentação: [Modelos](/pt-BR/concepts/models), [Roteamento multiagente](/pt-BR/concepts/multi-agent),
    [MiniMax](/pt-BR/providers/minimax), [OpenAI](/pt-BR/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt são atalhos integrados?">
    Sim — são formas abreviadas integradas, aplicadas somente quando o modelo de
    destino existe em `agents.defaults.models`:

    | Alias | É resolvido como |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Um alias próprio com o mesmo nome substitui o integrado.

  </Accordion>

  <Accordion title="Como defino ou substituo atalhos de modelos (aliases)?">
    Os aliases ficam em `agents.defaults.models.<modelId>.alias`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    Depois, `/model sonnet` (ou `/<alias>`, quando houver suporte) será resolvido
    como esse identificador de modelo.

  </Accordion>

  <Accordion title="Como adiciono modelos de outros provedores, como OpenRouter ou Z.AI?">
    OpenRouter (cobrança por token; muitos modelos):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modelos GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    A ausência da chave de um provedor referenciado por um provedor/modelo gera
    um erro de autenticação no ambiente de execução (por exemplo,
    `No API key found for provider "zai"`).

    **Nenhuma chave de API encontrada para o provedor após adicionar um novo agente**

    Um novo agente tem um armazenamento de autenticação vazio — a autenticação
    é específica de cada agente e fica armazenada em:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Correção: execute `openclaw agents add <id>` e configure a autenticação no assistente ou
    copie apenas perfis estáticos portáveis de `api_key`/`token` do armazenamento
    do agente principal. Para OAuth, inicie sessão pelo novo agente quando ele
    precisar de uma conta própria. Consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent)
    para ver todas as regras de reutilização de `agentDir` e compartilhamento de
    credenciais — nunca reutilize `agentDir` entre agentes.

  </Accordion>
</AccordionGroup>

## Failover de modelos e "Falha em todos os modelos"

<AccordionGroup>
  <Accordion title="Como funciona o failover?">
    Duas etapas:

    1. **Rotação de perfis de autenticação** no mesmo provedor.
    2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

    Períodos de espera se aplicam aos perfis com falha (recuo exponencial), para que o OpenClaw
    continue respondendo quando um provedor sofre limitação de taxa ou falha temporariamente.

    A categoria de limitação de taxa abrange mais do que apenas `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` e limites periódicos
    de janela de uso (`weekly/monthly limit reached`) são todos considerados
    limitações de taxa que justificam failover.

    As respostas de cobrança nem sempre são `402`, e algumas respostas `402` permanecem na
    categoria transitória/de limitação de taxa, em vez de irem para a categoria de cobrança. Texto
    explícito de cobrança em `401`/`403` ainda pode ser encaminhado para cobrança; correspondências
    de texto específicas do provedor (por exemplo, `Key limit exceeded` do OpenRouter) permanecem
    restritas ao respectivo provedor. Uma resposta `402` que pareça indicar uma janela de uso
    com nova tentativa possível ou um limite de gastos da organização/do espaço de trabalho
    (`daily limit reached, resets tomorrow`, `organization spending limit exceeded`)
    é tratada como `rate_limit`, e não como uma desativação prolongada por cobrança.

    Erros de estouro de contexto ficam totalmente fora do caminho de fallback — assinaturas
    como `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` ou `ollama error: context length exceeded` seguem para
    Compaction/nova tentativa, em vez de avançar o fallback de modelo.

    O texto genérico de erro do servidor tem um escopo mais restrito do que "qualquer coisa com unknown/error
    no texto". Formatos transitórios restritos ao provedor que contam como sinais de
    failover: `An unknown error occurred` isolado da Anthropic, `Provider returned error`
    isolado do OpenRouter, erros de motivo de interrupção como `Unhandled stop reason:
    error`, cargas JSON `api_error` com texto transitório do servidor (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)
    e erros de provedor ocupado como `ModelNotReadyException` quando o contexto do provedor
    corresponde. Textos genéricos internos de fallback como `LLM request failed
    with an unknown error.` permanecem conservadores e não acionam o fallback
    por conta própria.

  </Accordion>

  <Accordion title='O que significa "No credentials found for profile anthropic:default"?'>
    O ID do perfil de autenticação `anthropic:default` não tem credenciais no
    armazenamento de autenticação esperado.

    **Lista de verificação para correção:**

    - Confirme onde os perfis ficam — atual:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; legado:
      `~/.openclaw/agent/*` (migrado por `openclaw doctor`).
    - Confirme se o Gateway carrega sua variável de ambiente. `ANTHROPIC_API_KEY` definida apenas no
      seu shell não chegará a uma execução do Gateway via systemd/launchd — coloque-a em
      `~/.openclaw/.env` ou habilite `env.shellEnv`.
    - Confirme se você está editando o agente correto — configurações multiagente têm
      vários arquivos `auth-profiles.json`.
    - Execute `openclaw models status` para ver os modelos configurados e o estado de
      autenticação do provedor.

    **Para "No credentials found for profile anthropic" (sem sufixo de e-mail):**

    A execução está fixada a um perfil da Anthropic que o Gateway não consegue encontrar.

    - Use a CLI do Claude: execute `openclaw models auth login --provider anthropic
      --method cli --set-default` no host do Gateway.
    - Se preferir uma chave de API: coloque `ANTHROPIC_API_KEY` em
      `~/.openclaw/.env` no host do Gateway e remova qualquer ordem fixada
      que force o uso do perfil ausente:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Modo remoto: os perfis de autenticação ficam na máquina do Gateway, não no seu
      laptop — confirme se você está executando os comandos nela.

  </Accordion>

  <Accordion title="Por que ele também tentou o Google Gemini e falhou?">
    Se a configuração do seu modelo inclui o Google Gemini como fallback (ou se você
    mudou para uma abreviação do Gemini), o OpenClaw tenta usá-lo durante o fallback. A ausência
    de credenciais do Google configuradas resulta em `No API key found for provider
    "google"`. Correção: adicione a autenticação do Google ou remova os modelos do Google de
    `agents.defaults.model.fallbacks`/aliases.

    **Solicitação ao LLM rejeitada: assinatura de raciocínio obrigatória (Google Antigravity)**

    Causa: o histórico da sessão contém blocos de raciocínio sem assinaturas (geralmente
    devido a um fluxo interrompido/parcial); o Google Antigravity exige assinaturas
    nos blocos de raciocínio. O OpenClaw remove blocos de raciocínio não assinados para o Google
    Antigravity Claude; se o problema persistir, inicie uma nova sessão ou defina
    `/thinking off` para esse agente.

  </Accordion>
</AccordionGroup>

## Perfis de autenticação: o que são e como gerenciá-los

Relacionado: [/concepts/oauth](/pt-BR/concepts/oauth) (fluxos OAuth, armazenamento de tokens, padrões de múltiplas contas)

<AccordionGroup>
  <Accordion title="O que é um perfil de autenticação?">
    Um registro de credenciais nomeado (OAuth ou chave de API) vinculado a um provedor, armazenado
    em:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Inspecione os perfis salvos sem exibir segredos: `openclaw models auth
    list` (opcionalmente com `--provider <id>` ou `--json`). Consulte
    [CLI de modelos](/pt-BR/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Quais são os IDs de perfil comuns?">
    Com prefixo do provedor: `anthropic:default` (comum quando não existe identidade de e-mail),
    `anthropic:<email>` para identidades OAuth ou um ID personalizado que você
    escolher (por exemplo, `anthropic:work`).

  </Accordion>

  <Accordion title="Posso controlar qual perfil de autenticação é tentado primeiro?">
    Sim. A configuração `auth.order.<provider>` define a ordem de rotação por provedor
    (somente metadados — nenhum segredo é armazenado).

    O OpenClaw pode ignorar um perfil durante um breve **período de espera** (limitações de taxa,
    tempos limite, falhas de autenticação) ou durante um estado **desativado** mais longo
    (cobrança/créditos insuficientes). Inspecione com `openclaw models status
    --json` e verifique `auth.unusableProfiles`. Ajuste com
    `auth.cooldowns.billingBackoffHours*`. Os períodos de espera por limitação de taxa podem ser
    específicos do modelo — um perfil em período de espera para um modelo ainda pode atender a
    um modelo relacionado no mesmo provedor; janelas de cobrança/desativação bloqueiam o
    perfil inteiro.

    Defina uma substituição de ordem por agente (armazenada no `auth-state.json` desse agente):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Verifique o que realmente será tentado: `openclaw models status --probe`. Um
    perfil armazenado omitido de uma ordem explícita informa
    `excluded_by_auth_order`, em vez de ser tentado silenciosamente.

  </Accordion>

  <Accordion title="OAuth versus chave de API — qual é a diferença?">
    - O **login via OAuth/CLI** geralmente usa o acesso da assinatura quando o
      provedor oferece suporte. Para a Anthropic, o backend da CLI do Claude no OpenClaw
      usa o `claude -p` do Claude Code, que a Anthropic atualmente trata como
      uso programático/do Agent SDK consumindo os limites de uso da assinatura —
      consulte [Anthropic](/pt-BR/providers/anthropic) para ver o status atual da pausa de cobrança
      e os links das fontes.
    - **Chaves de API** usam cobrança por token.

    O assistente oferece suporte à CLI do Anthropic Claude, ao OAuth do OpenAI Codex e a chaves
    de API.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Perguntas frequentes](/pt-BR/help/faq) — as principais perguntas frequentes
- [Perguntas frequentes — início rápido e configuração da primeira execução](/pt-BR/help/faq-first-run)
- [Seleção de modelo](/pt-BR/concepts/model-providers)
- [Failover de modelos](/pt-BR/concepts/model-failover)
