---
read_when:
    - Escolha ou troca de modelos, configuração de aliases
    - Depuração do failover de modelos / "Todos os modelos falharam"
    - Noções básicas sobre perfis de autenticação e como gerenciá-los
sidebarTitle: Models FAQ
summary: 'Perguntas frequentes: padrões de modelo, seleção, aliases, alternância, failover e perfis de autenticação'
title: 'Perguntas frequentes: modelos e autenticação'
x-i18n:
    generated_at: "2026-07-12T15:16:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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

    Os modelos são referências `provider/model` (exemplo: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Sempre defina `provider/model` explicitamente. Se
    você omitir o provedor, o OpenClaw tenta primeiro encontrar um alias, depois uma
    correspondência única entre os provedores configurados para esse ID de modelo e, por fim, usa
    o provedor padrão configurado (caminho de compatibilidade obsoleto). Se esse
    provedor não tiver mais o modelo padrão configurado, o OpenClaw usará
    o primeiro provedor/modelo configurado, em vez de um padrão desatualizado.

  </Accordion>

  <Accordion title="Qual modelo vocês recomendam?">
    Use o modelo mais potente e de geração mais recente oferecido pelo seu conjunto de provedores,
    especialmente para agentes com ferramentas habilitadas ou que recebem entradas não confiáveis — modelos mais fracos ou
    excessivamente quantizados são mais vulneráveis à injeção de prompt e a comportamentos
    inseguros (consulte [Segurança](/pt-BR/gateway/security)). Direcione modelos mais baratos para
    conversas rotineiras/de baixo risco conforme a função do agente.

    Direcione modelos por agente e use subagentes para paralelizar tarefas longas (cada
    subagente consome seus próprios tokens). Consulte [Modelos](/pt-BR/concepts/models),
    [Subagentes](/pt-BR/tools/subagents), [MiniMax](/pt-BR/providers/minimax) e
    [Modelos locais](/pt-BR/gateway/local-models).

  </Accordion>

  <Accordion title="Como alterno modelos sem apagar minha configuração?">
    Altere apenas os campos de modelo — evite substituir toda a configuração.

    - `/model` na conversa (por sessão; consulte [Comandos de barra](/pt-BR/tools/slash-commands))
    - `openclaw models set ...` (atualiza apenas a configuração do modelo)
    - `openclaw configure --section model` (interativo)
    - edite `agents.defaults.model` diretamente em `~/.openclaw/openclaw.json`

    Para edições via RPC, inspecione primeiro com `config.schema.lookup` (caminho
    normalizado, documentação superficial do esquema e resumos dos elementos filhos) e prefira `config.patch`
    a `config.apply` com um objeto parcial. Se você tiver sobrescrito a configuração,
    restaure-a a partir do backup ou execute `openclaw doctor` para repará-la.

    Documentação: [Modelos](/pt-BR/concepts/models), [Configurar](/pt-BR/cli/configure),
    [Configuração](/pt-BR/cli/config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usar modelos auto-hospedados (llama.cpp, vLLM, Ollama)?">
    Sim — Ollama é o caminho mais fácil. Configuração rápida:

    1. Instale o Ollama por meio de `https://ollama.com/download`
    2. Baixe um modelo local, por exemplo, `ollama pull gemma4`
    3. Para usar também modelos em nuvem, execute `ollama signin`
    4. Execute `openclaw onboard`, escolha `Ollama` e depois `Local` ou `Cloud + Local`

    `Cloud + Local` oferece modelos em nuvem juntamente com seus modelos locais do Ollama;
    modelos em nuvem como `kimi-k2.5:cloud` não precisam ser baixados localmente. Para alternar
    manualmente: `openclaw models list` e depois `openclaw models set ollama/<model>`.

    Modelos menores/altamente quantizados são mais vulneráveis à injeção de prompt.
    Use modelos grandes para qualquer bot com acesso a ferramentas; se ainda assim usar modelos pequenos,
    habilite o sandbox e listas rigorosas de ferramentas permitidas.

    Documentação: [Ollama](/pt-BR/providers/ollama), [Modelos locais](/pt-BR/gateway/local-models),
    [Provedores de modelos](/pt-BR/concepts/model-providers), [Segurança](/pt-BR/gateway/security),
    [Sandbox](/pt-BR/gateway/sandboxing).

  </Accordion>

  <Accordion title="Como alterno modelos dinamicamente (sem reiniciar)?">
    Envie `/model <name>` como uma mensagem independente. Consulte
    [Comandos de barra](/pt-BR/tools/slash-commands) para ver a
    lista completa de comandos, incluindo o seletor numerado (`/model`, `/model
    list`, `/model 3`), `/model default` para remover uma substituição da sessão e
    `/model status` para obter detalhes sobre o endpoint/modo da API.

    Force um perfil de autenticação específico por sessão com `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Para desafixar um perfil definido com `@profile`, execute `/model` novamente sem o
    sufixo (por exemplo, `/model anthropic/claude-opus-4-6`) ou escolha o padrão em
    `/model`. Use `/model status` para confirmar o perfil de autenticação ativo.

  </Accordion>

  <Accordion title="Se dois provedores disponibilizarem o mesmo ID de modelo, qual deles o /model usará?">
    `/model provider/model` seleciona exatamente essa rota de provedor. Por exemplo,
    `qianfan/deepseek-v4-flash` e `deepseek/deepseek-v4-flash` são referências diferentes,
    mesmo que o ID do modelo seja igual — o OpenClaw não troca silenciosamente de
    provedor com base em uma correspondência apenas do ID.

    Uma referência `/model` selecionada pelo usuário aplica regras rigorosas ao fallback: se esse
    provedor/modelo ficar indisponível, a resposta falhará de forma visível em vez de
    usar `agents.defaults.model.fallbacks`. As cadeias de fallback configuradas
    ainda se aplicam aos padrões configurados, aos modelos principais de tarefas Cron e
    ao estado de fallback selecionado automaticamente. Quando uma execução sem substituição de sessão
    pode usar fallback, o OpenClaw tenta primeiro o provedor/modelo solicitado, depois
    os fallbacks configurados e, em seguida, o modelo principal configurado — portanto, IDs simples de modelo
    duplicados nunca retornam diretamente ao provedor padrão.

    Consulte [Modelos](/pt-BR/concepts/models) e [Failover de modelo](/pt-BR/concepts/model-failover).

  </Accordion>

  <Accordion title="Posso usar GPT 5.5 para tarefas diárias e Codex 5.5 para programação?">
    Sim — a escolha do modelo e a escolha do runtime são independentes:

    - **Agente de programação nativo do Codex:** defina `agents.defaults.model.primary` como
      `openai/gpt-5.5`. Entre com `openclaw models auth login --provider
      openai` para usar a autenticação da assinatura do ChatGPT/Codex.
    - **Tarefas diretas da API da OpenAI fora do loop do agente:** configure
      `OPENAI_API_KEY` para imagens, embeddings, fala, tempo real e outras
      superfícies da API da OpenAI não relacionadas a agentes.
    - **Autenticação por chave de API para o agente da OpenAI:** `/model openai/gpt-5.5` com um perfil
      de chave de API `openai` ordenado.
    - **Subagentes:** direcione tarefas de programação para um agente voltado ao Codex com seu
      próprio modelo `openai/gpt-5.5`.

    Consulte [Modelos](/pt-BR/concepts/models) e [Comandos de barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como configuro o modo rápido para o GPT 5.5?">
    - **Por sessão:** envie `/fast on` enquanto estiver usando `openai/gpt-5.5`.
    - **Padrão por modelo:** defina
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` como `true`.
    - **Limite automático:** `/fast auto` ou `params.fastMode: "auto"` executa novas
      chamadas de modelo no modo rápido até o limite e, depois, executa chamadas posteriores de nova tentativa, fallback,
      resultado de ferramenta ou continuação sem o modo rápido. O limite padrão é de
      60 segundos; substitua-o com `params.fastAutoOnSeconds` no modelo.

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

    O modo rápido corresponde a `service_tier = "priority"` nas solicitações nativas do OpenAI Responses;
    os valores existentes de `service_tier` são preservados, e o modo rápido não
    reescreve `reasoning` nem `text.verbosity`. As substituições de sessão com `/fast` têm
    precedência sobre os padrões da configuração.

    Consulte [Raciocínio e modo rápido](/pt-BR/tools/thinking) e a seção Modo rápido
    em Configuração avançada na página do provedor [OpenAI](/pt-BR/providers/openai).

  </Accordion>

  <Accordion title='Por que vejo "Model ... is not allowed" e depois não recebo resposta?'>
    Se `agents.defaults.models` estiver definido, ele se tornará a **lista de permissões** para
    `/model` e substituições da sessão. Escolher um modelo fora dessa lista retorna
    isto em vez de uma resposta normal:

    ```text
    O modelo "provider/model" não é permitido. Use /models para listar os provedores ou /models <provider> para listar os modelos.
    Adicione-o com: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Correção: adicione o modelo exato a `agents.defaults.models`, adicione um curinga de provedor
    como `"provider/*": {}` para catálogos dinâmicos, remova a
    lista de permissões ou escolha um modelo em `/model list`. Se o comando também
    incluía `--runtime codex`, atualize primeiro a lista de permissões e tente novamente o
    mesmo comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Por que vejo "Unknown model: minimax/MiniMax-M3"?'>
    Se você estiver usando uma versão mais antiga do OpenClaw, primeiro atualize-a (ou execute a partir do
    `main` do código-fonte) e reinicie o Gateway — `MiniMax-M3` talvez ainda não esteja no
    catálogo da versão instalada. Caso contrário, o provedor MiniMax não está
    configurado (nenhuma entrada de provedor ou perfil de autenticação foi encontrado), portanto o modelo não pode
    ser resolvido. Consulte a seção Solução de problemas na página do provedor
    [MiniMax](/pt-BR/providers/minimax) para ver a lista de verificação completa da correção,
    a tabela de IDs de provedor/modelo e um exemplo de bloco de configuração.

  </Accordion>

  <Accordion title="Posso usar MiniMax como padrão e OpenAI para tarefas complexas?">
    Sim. Use MiniMax como padrão e alterne os modelos por sessão — os fallbacks
    são para erros, não para "tarefas difíceis"; portanto, use `/model` ou um agente separado.

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

    Depois, `/model gpt`.

    **Opção B: agentes separados** — o Agente A usa MiniMax por padrão, e o Agente B
    usa OpenAI por padrão; direcione por agente ou use `/agent` para alternar.

    Documentação: [Modelos](/pt-BR/concepts/models), [Roteamento multiagente](/pt-BR/concepts/multi-agent),
    [MiniMax](/pt-BR/providers/minimax), [OpenAI](/pt-BR/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt são atalhos integrados?">
    Sim — são abreviações integradas, aplicadas somente quando o modelo de destino existe em
    `agents.defaults.models`:

    | Alias | Corresponde a |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Um alias personalizado com o mesmo nome substitui o integrado.

  </Accordion>

  <Accordion title="Como defino/substituo atalhos (aliases) de modelos?">
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

    Então, `/model sonnet` (ou `/<alias>`, quando houver suporte) é resolvido para esse
    ID de modelo.

  </Accordion>

  <Accordion title="Como adiciono modelos de outros provedores, como OpenRouter ou Z.AI?">
    OpenRouter (pagamento por token; muitos modelos):

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

    A ausência da chave de um provedor para um provedor/modelo referenciado gera um erro de autenticação
    em runtime (por exemplo, `No API key found for provider "zai"`).

    **Nenhuma chave de API encontrada para o provedor após adicionar um novo agente**

    Um novo agente tem um armazenamento de autenticação vazio — a autenticação é específica de cada agente e fica armazenada em:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Correção: execute `openclaw agents add <id>` e configure a autenticação no assistente ou
    copie somente os perfis estáticos portáteis de `api_key`/`token` do
    armazenamento do agente principal. Para OAuth, faça login pelo novo agente quando ele
    precisar de uma conta própria. Consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent) para ver
    as regras completas de reutilização de `agentDir` e compartilhamento de credenciais — nunca reutilize
    `agentDir` entre agentes.

  </Accordion>
</AccordionGroup>

## Failover de modelos e "Todos os modelos falharam"

<AccordionGroup>
  <Accordion title="Como funciona o failover?">
    Duas etapas:

    1. **Rotação de perfis de autenticação** dentro do mesmo provedor.
    2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

    Tempos de espera são aplicados aos perfis que falham (recuo exponencial), para que o OpenClaw
    continue respondendo quando um provedor está com limitação de taxa ou falhando temporariamente.

    O grupo de limitação de taxa abrange mais do que apenas `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` e limites periódicos
    de janela de uso (`weekly/monthly limit reached`) são todos considerados
    limitações de taxa que justificam failover.

    As respostas de cobrança nem sempre são `402`, e algumas respostas `402` permanecem no
    grupo transitório/de limitação de taxa, em vez de seguirem para o fluxo de cobrança. Texto explícito
    de cobrança em `401`/`403` ainda pode ser encaminhado para cobrança; os
    padrões de correspondência de texto específicos do provedor (por exemplo, `Key limit exceeded` do OpenRouter) permanecem restritos ao
    respectivo provedor. Uma resposta `402` que pareça indicar uma janela de uso com possibilidade de nova tentativa ou
    um limite de gastos da organização/do espaço de trabalho (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) é tratada como `rate_limit`, e não como uma
    desativação prolongada por cobrança.

    Erros de estouro de contexto ficam totalmente fora do caminho de fallback — assinaturas
    como `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` ou `ollama error: context length exceeded` seguem para
    Compaction/nova tentativa, em vez de avançar o fallback de modelo.

    O texto genérico de erro do servidor é mais restrito do que "qualquer coisa com desconhecido/erro
    no texto". Formatos transitórios específicos do provedor que contam como sinais de
    failover: `An unknown error occurred` isolado da Anthropic, `Provider returned error`
    isolado do OpenRouter, erros de motivo de parada como `Unhandled stop reason:
    error`, cargas JSON `api_error` com texto transitório do servidor (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)
    e erros de provedor ocupado como `ModelNotReadyException` quando o contexto do provedor
    corresponde. Texto genérico de fallback interno como `LLM request failed
    with an unknown error.` permanece conservador e não aciona o fallback
    por si só.

  </Accordion>

  <Accordion title='O que significa "Nenhuma credencial encontrada para o perfil anthropic:default"?'>
    O id do perfil de autenticação `anthropic:default` não tem credenciais no
    armazenamento de autenticação esperado.

    **Lista de verificação para correção:**

    - Confirme onde os perfis estão armazenados — atual:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; legado:
      `~/.openclaw/agent/*` (migrado por `openclaw doctor`).
    - Confirme se o Gateway carrega sua variável de ambiente. `ANTHROPIC_API_KEY` definida somente no
      seu shell não chegará a uma execução do Gateway via systemd/launchd — coloque-a em
      `~/.openclaw/.env` ou habilite `env.shellEnv`.
    - Confirme se você está editando o agente correto — configurações multiagente têm
      vários arquivos `auth-profiles.json`.
    - Execute `openclaw models status` para ver os modelos configurados e o estado de
      autenticação do provedor.

    **Para "Nenhuma credencial encontrada para o perfil anthropic" (sem sufixo de e-mail):**

    A execução está fixada em um perfil da Anthropic que o Gateway não consegue encontrar.

    - Use a CLI do Claude: execute `openclaw models auth login --provider anthropic
      --method cli --set-default` no host do Gateway.
    - Prefira uma chave de API: coloque `ANTHROPIC_API_KEY` em
      `~/.openclaw/.env` no host do Gateway e remova qualquer ordem fixada
      que force o uso do perfil ausente:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Modo remoto: os perfis de autenticação ficam na máquina do Gateway, não no seu
      laptop — confirme se você está executando os comandos nela.

  </Accordion>

  <Accordion title="Por que ele também tentou usar o Google Gemini e falhou?">
    Se a configuração do seu modelo inclui o Google Gemini como fallback (ou se você
    mudou para uma forma abreviada do Gemini), o OpenClaw tenta usá-lo durante o fallback. Se nenhuma
    credencial do Google estiver configurada, será exibido `No API key found for provider
    "google"`. Correção: adicione a autenticação do Google ou remova os modelos do Google de
    `agents.defaults.model.fallbacks`/aliases.

    **Solicitação de LLM rejeitada: assinatura de raciocínio obrigatória (Google Antigravity)**

    Causa: o histórico da sessão contém blocos de raciocínio sem assinaturas (geralmente
    devido a um fluxo interrompido/parcial); o Google Antigravity exige assinaturas
    nos blocos de raciocínio. O OpenClaw remove blocos de raciocínio não assinados para o Claude no Google
    Antigravity; se o erro ainda aparecer, inicie uma nova sessão ou defina
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

    Inspecione os perfis salvos sem exibir os segredos: `openclaw models auth
    list` (opcionalmente com `--provider <id>` ou `--json`). Consulte
    [CLI de modelos](/pt-BR/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Quais são os IDs de perfil típicos?">
    Prefixados pelo provedor: `anthropic:default` (comum quando não existe uma identidade de e-mail),
    `anthropic:<email>` para identidades OAuth ou um id personalizado que você
    escolher (por exemplo, `anthropic:work`).

  </Accordion>

  <Accordion title="Posso controlar qual perfil de autenticação é tentado primeiro?">
    Sim. A configuração `auth.order.<provider>` define a ordem de rotação por provedor
    (somente metadados — nenhum segredo é armazenado).

    O OpenClaw pode ignorar temporariamente um perfil durante um curto período de **espera** (limites de taxa,
    tempos limite, falhas de autenticação) ou durante um estado mais longo de **desativação**
    (cobrança/créditos insuficientes). Inspecione com `openclaw models status
    --json` e verifique `auth.unusableProfiles`. Ajuste com
    `auth.cooldowns.billingBackoffHours*`. Os tempos de espera por limitação de taxa podem ser
    específicos do modelo — um perfil em espera para um modelo ainda pode atender a
    outro modelo do mesmo provedor; janelas de cobrança/desativação bloqueiam
    o perfil inteiro.

    Defina uma substituição de ordem por agente (armazenada no `auth-state.json` desse agente):

    ```bash
    # Usa por padrão o agente padrão configurado (omita --agent)
    openclaw models auth order get --provider anthropic

    # Restringe a rotação a um único perfil
    openclaw models auth order set --provider anthropic anthropic:default

    # Ou define uma ordem explícita (fallback dentro do provedor)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Remove a substituição (volta para auth.order da configuração / round-robin)
    openclaw models auth order clear --provider anthropic

    # Direciona para um agente específico
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Verifique o que será realmente tentado: `openclaw models status --probe`. Um
    perfil armazenado omitido de uma ordem explícita relata
    `excluded_by_auth_order`, em vez de ser tentado silenciosamente.

  </Accordion>

  <Accordion title="OAuth versus chave de API — qual é a diferença?">
    - O **login via OAuth / CLI** geralmente usa o acesso da assinatura quando o
      provedor oferece suporte. Para a Anthropic, o backend da CLI do Claude no OpenClaw
      usa o `claude -p` do Claude Code, que atualmente é tratado pela Anthropic como
      uso programático/do Agent SDK, consumindo os limites de uso da assinatura —
      consulte [Anthropic](/pt-BR/providers/anthropic) para ver o status atual da pausa de cobrança
      e os links das fontes.
    - **Chaves de API** usam cobrança por token.

    O assistente oferece suporte à CLI do Anthropic Claude, ao OAuth do OpenAI Codex e a chaves de
    API.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Perguntas frequentes](/pt-BR/help/faq) — as perguntas frequentes principais
- [Perguntas frequentes — início rápido e configuração da primeira execução](/pt-BR/help/faq-first-run)
- [Seleção de modelos](/pt-BR/concepts/model-providers)
- [Failover de modelos](/pt-BR/concepts/model-failover)
