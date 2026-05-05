---
read_when:
    - Escolha ou troca de modelos, configuração de aliases
    - Depuração da alternância de modelo em caso de falha / "Todos os modelos falharam"
    - Entendendo perfis de autenticação e como gerenciá-los
sidebarTitle: Models FAQ
summary: 'Perguntas frequentes: padrões de modelo, seleção, apelidos, troca, alternância em caso de falha e perfis de autenticação'
title: 'Perguntas frequentes: modelos e autenticação'
x-i18n:
    generated_at: "2026-05-05T01:47:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e60abcd6aa99121200de0e45cc3efa6334e668cbe6a4b590610c53d17e03a54
    source_path: help/faq-models.md
    workflow: 16
---

  P&R sobre modelos e perfis de autenticação. Para configuração, sessões, gateway, canais e
  solução de problemas, consulte a [FAQ](/pt-BR/help/faq) principal.

  ## Modelos: padrões, seleção, aliases, troca

  <AccordionGroup>
  <Accordion title='What is the "default model"?'>
    O modelo padrão do OpenClaw é o que você definir como:

    ```
    agents.defaults.model.primary
    ```

    Modelos são referenciados como `provider/model` (exemplo: `openai/gpt-5.5` ou `openai-codex/gpt-5.5`). Se você omitir o provedor, o OpenClaw primeiro tenta um alias, depois uma correspondência única de provedor configurado para esse ID exato de modelo e só então recorre ao provedor padrão configurado como um caminho de compatibilidade obsoleto. Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado em vez de exibir um padrão obsoleto de provedor removido. Mesmo assim, você deve definir `provider/model` **explicitamente**.

  </Accordion>

  <Accordion title="What model do you recommend?">
    **Padrão recomendado:** use o modelo de geração mais recente e mais forte disponível na sua pilha de provedores.
    **Para agentes com ferramentas habilitadas ou entrada não confiável:** priorize a força do modelo em vez do custo.
    **Para conversas rotineiras/de baixo risco:** use modelos de fallback mais baratos e roteie por função do agente.

    O MiniMax tem sua própria documentação: [MiniMax](/pt-BR/providers/minimax) e
    [Modelos locais](/pt-BR/gateway/local-models).

    Regra prática: use o **melhor modelo que você puder pagar** para trabalho de alto risco, e um modelo mais barato
    para conversas rotineiras ou resumos. Você pode rotear modelos por agente e usar subagentes para
    paralelizar tarefas longas (cada subagente consome tokens). Consulte [Modelos](/pt-BR/concepts/models) e
    [Subagentes](/pt-BR/tools/subagents).

    Aviso forte: modelos mais fracos/com quantização excessiva são mais vulneráveis a injeção de prompt
    e comportamento inseguro. Consulte [Segurança](/pt-BR/gateway/security).

    Mais contexto: [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="How do I switch models without wiping my config?">
    Use **comandos de modelo** ou edite apenas os campos de **modelo**. Evite substituições completas de configuração.

    Opções seguras:

    - `/model` no chat (rápido, por sessão)
    - `openclaw models set ...` (atualiza apenas a configuração de modelo)
    - `openclaw configure --section model` (interativo)
    - edite `agents.defaults.model` em `~/.openclaw/openclaw.json`

    Evite `config.apply` com um objeto parcial, a menos que você pretenda substituir toda a configuração.
    Para edições por RPC, inspecione primeiro com `config.schema.lookup` e prefira `config.patch`. O payload de lookup fornece o caminho normalizado, documentos/restrições rasos do esquema e resumos imediatos dos filhos.
    para atualizações parciais.
    Se você sobrescreveu a configuração, restaure a partir de um backup ou execute novamente `openclaw doctor` para reparar.

    Documentação: [Modelos](/pt-BR/concepts/models), [Configurar](/pt-BR/cli/configure), [Configuração](/pt-BR/cli/config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Can I use self-hosted models (llama.cpp, vLLM, Ollama)?">
    Sim. Ollama é o caminho mais fácil para modelos locais.

    Configuração mais rápida:

    1. Instale o Ollama a partir de `https://ollama.com/download`
    2. Baixe um modelo local, como `ollama pull gemma4`
    3. Se também quiser modelos em nuvem, execute `ollama signin`
    4. Execute `openclaw onboard` e escolha `Ollama`
    5. Escolha `Local` ou `Cloud + Local`

    Observações:

    - `Cloud + Local` oferece modelos em nuvem mais seus modelos Ollama locais
    - modelos em nuvem como `kimi-k2.5:cloud` não precisam de um download local
    - para troca manual, use `openclaw models list` e `openclaw models set ollama/<model>`

    Observação de segurança: modelos menores ou fortemente quantizados são mais vulneráveis a injeção de prompt.
    Recomendamos fortemente **modelos grandes** para qualquer bot que possa usar ferramentas.
    Se ainda quiser modelos pequenos, habilite sandboxing e allowlists estritas de ferramentas.

    Documentação: [Ollama](/pt-BR/providers/ollama), [Modelos locais](/pt-BR/gateway/local-models),
    [Provedores de modelo](/pt-BR/concepts/model-providers), [Segurança](/pt-BR/gateway/security),
    [Sandboxing](/pt-BR/gateway/sandboxing).

  </Accordion>

  <Accordion title="What do OpenClaw, Flawd, and Krill use for models?">
    - Essas implantações podem diferir e mudar com o tempo; não há recomendação fixa de provedor.
    - Verifique a configuração atual em tempo de execução em cada Gateway com `openclaw models status`.
    - Para agentes sensíveis à segurança/com ferramentas habilitadas, use o modelo de geração mais recente e mais forte disponível.

  </Accordion>

  <Accordion title="How do I switch models on the fly (without restarting)?">
    Use o comando `/model` como uma mensagem independente:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Estes são os aliases integrados. Aliases personalizados podem ser adicionados via `agents.defaults.models`.

    Você pode listar modelos disponíveis com `/model`, `/model list` ou `/model status`.

    `/model` (e `/model list`) mostra um seletor compacto e numerado. Selecione por número:

    ```
    /model 3
    ```

    Você também pode forçar um perfil de autenticação específico para o provedor (por sessão):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Dica: `/model status` mostra qual agente está ativo, qual arquivo `auth-profiles.json` está sendo usado e qual perfil de autenticação será tentado em seguida.
    Ele também mostra o endpoint configurado do provedor (`baseUrl`) e o modo de API (`api`) quando disponíveis.

    **Como removo a fixação de um perfil que defini com @profile?**

    Execute novamente `/model` **sem** o sufixo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se quiser voltar ao padrão, escolha-o em `/model` (ou envie `/model <default provider/model>`).
    Use `/model status` para confirmar qual perfil de autenticação está ativo.

  </Accordion>

  <Accordion title="Can I use GPT 5.5 for daily tasks and Codex 5.5 for coding?">
    Sim. Trate a escolha do modelo e a escolha do runtime separadamente:

    - **Agente de codificação Codex nativo:** defina `agents.defaults.model.primary` como `openai/gpt-5.5` e `agents.defaults.agentRuntime.id` como `"codex"`. Faça login com `openclaw models auth login --provider openai-codex` quando quiser autenticação de assinatura ChatGPT/Codex.
    - **Tarefas diretas da API da OpenAI por meio do PI:** use `/model openai/gpt-5.5` sem substituição de runtime Codex e configure `OPENAI_API_KEY`.
    - **OAuth do Codex por meio do PI:** use `/model openai-codex/gpt-5.5` apenas quando quiser intencionalmente o executor PI normal com OAuth do Codex.
    - **Subagentes:** roteie tarefas de codificação para um agente exclusivo do Codex com seu próprio modelo e padrão de `agentRuntime`.

    Consulte [Modelos](/pt-BR/concepts/models) e [Comandos de barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="How do I configure fast mode for GPT 5.5?">
    Use uma alternância de sessão ou um padrão de configuração:

    - **Por sessão:** envie `/fast on` enquanto a sessão está usando `openai/gpt-5.5` ou `openai-codex/gpt-5.5`.
    - **Padrão por modelo:** defina `agents.defaults.models["openai/gpt-5.5"].params.fastMode` ou `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` como `true`.

    Exemplo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Para OpenAI, o modo rápido mapeia para `service_tier = "priority"` em solicitações Responses nativas compatíveis. Substituições de sessão `/fast` prevalecem sobre padrões de configuração.

    Consulte [Pensamento e modo rápido](/pt-BR/tools/thinking) e [Modo rápido da OpenAI](/pt-BR/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Why do I see "Model ... is not allowed" and then no reply?'>
    Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e quaisquer
    substituições de sessão. Escolher um modelo que não esteja nessa lista retorna:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Esse erro é retornado **em vez de** uma resposta normal. Correção: adicione o modelo a
    `agents.defaults.models`, remova a allowlist ou escolha um modelo em `/model list`.
    Se o comando também incluiu `--runtime codex`, adicione o modelo primeiro e tente novamente
    o mesmo comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Why do I see "Unknown model: minimax/MiniMax-M2.7"?'>
    Isso significa que o **provedor não está configurado** (nenhuma configuração de provedor MiniMax ou perfil de autenticação
    foi encontrado), então o modelo não pode ser resolvido.

    Checklist de correção:

    1. Atualize para uma versão atual do OpenClaw (ou execute a partir do `main` do código-fonte) e reinicie o Gateway.
    2. Certifique-se de que o MiniMax está configurado (assistente ou JSON), ou que a autenticação do MiniMax
       existe em env/perfis de autenticação para que o provedor correspondente possa ser injetado
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` ou OAuth MiniMax armazenado
       para `minimax-portal`).
    3. Use o ID exato do modelo (diferencia maiúsculas de minúsculas) para o seu caminho de autenticação:
       `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed` para configuração
       com chave de API, ou `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para configuração com OAuth.
    4. Execute:

       ```bash
       openclaw models list
       ```

       e escolha a partir da lista (ou `/model list` no chat).

    Consulte [MiniMax](/pt-BR/providers/minimax) e [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Can I use MiniMax as my default and OpenAI for complex tasks?">
    Sim. Use **MiniMax como padrão** e troque de modelo **por sessão** quando necessário.
    Fallbacks são para **erros**, não para "tarefas difíceis", então use `/model` ou um agente separado.

    **Opção A: trocar por sessão**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Então:

    ```
    /model gpt
    ```

    **Opção B: agentes separados**

    - Padrão do Agente A: MiniMax
    - Padrão do Agente B: OpenAI
    - Roteie por agente ou use `/agent` para trocar

    Documentação: [Modelos](/pt-BR/concepts/models), [Roteamento Multiagente](/pt-BR/concepts/multi-agent), [MiniMax](/pt-BR/providers/minimax), [OpenAI](/pt-BR/providers/openai).

  </Accordion>

  <Accordion title="Are opus / sonnet / gpt built-in shortcuts?">
    Sim. O OpenClaw inclui alguns atalhos padrão (aplicados apenas quando o modelo existe em `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` para configurações com chave de API, ou `openai-codex/gpt-5.5` quando configurado para OAuth do Codex
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Se você definir seu próprio alias com o mesmo nome, seu valor prevalece.

  </Accordion>

  <Accordion title="How do I define/override model shortcuts (aliases)?">
    Aliases vêm de `agents.defaults.models.<modelId>.alias`. Exemplo:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Então `/model sonnet` (ou `/<alias>` quando compatível) resolve para esse ID de modelo.

  </Accordion>

  <Accordion title="How do I add models from other providers like OpenRouter or Z.AI?">
    OpenRouter (pague por token; muitos modelos):

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
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Se você referenciar um provedor/modelo, mas a chave obrigatória do provedor estiver ausente, você receberá um erro de autenticação em tempo de execução (por exemplo, `No API key found for provider "zai"`).

    **Nenhuma chave de API encontrada para o provedor após adicionar um novo agente**

    Isso geralmente significa que o **novo agente** tem um armazenamento de autenticação vazio. A autenticação é por agente e
    armazenada em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opções de correção:

    - Execute `openclaw agents add <id>` e configure a autenticação durante o assistente.
    - Ou copie apenas perfis estáticos portáteis de `api_key` / `token` do armazenamento de autenticação do agente principal para o armazenamento de autenticação do novo agente.
    - Para perfis OAuth, faça login a partir do novo agente quando ele precisar da própria conta; caso contrário, o OpenClaw pode ler o agente padrão/principal sem clonar tokens de atualização.

    **Não** reutilize `agentDir` entre agentes; isso causa colisões de autenticação/sessão.

  </Accordion>
</AccordionGroup>

## Failover de modelos e "Todos os modelos falharam"

<AccordionGroup>
  <Accordion title="Como o failover funciona?">
    O failover acontece em duas etapas:

    1. **Rotação de perfis de autenticação** dentro do mesmo provedor.
    2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

    Cooldowns se aplicam aos perfis com falha (backoff exponencial), então o OpenClaw pode continuar respondendo mesmo quando um provedor está limitado por taxa ou falhando temporariamente.

    O bucket de limite de taxa inclui mais do que respostas `429` simples. O OpenClaw
    também trata mensagens como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e limites periódicos
    de janelas de uso (`weekly/monthly limit reached`) como limites de taxa
    elegíveis para failover.

    Algumas respostas que parecem de cobrança não são `402`, e algumas respostas HTTP `402`
    também permanecem nesse bucket transitório. Se um provedor retornar
    texto explícito de cobrança em `401` ou `403`, o OpenClaw ainda poderá manter isso na
    faixa de cobrança, mas os correspondentes de texto específicos de provedor permanecem no escopo do
    provedor ao qual pertencem (por exemplo, OpenRouter `Key limit exceeded`). Se uma mensagem `402`
    parecer, em vez disso, uma janela de uso repetível ou
    limite de gastos de organização/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), o OpenClaw a tratará como
    `rate_limit`, não como uma desativação longa por cobrança.

    Erros de estouro de contexto são diferentes: assinaturas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` ou `ollama error: context length
    exceeded` permanecem no caminho de Compaction/tentativa novamente em vez de avançar o
    fallback de modelo.

    Texto genérico de erro do servidor é intencionalmente mais restrito do que "qualquer coisa com
    unknown/error nele". O OpenClaw trata formatos transitórios com escopo de provedor
    como o `An unknown error occurred` simples da Anthropic, o
    `Provider returned error` simples do OpenRouter, erros de motivo de parada como `Unhandled stop reason:
    error`, payloads JSON `api_error` com texto transitório de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) e erros de provedor ocupado como `ModelNotReadyException` como
    sinais de timeout/sobrecarga elegíveis para failover quando o contexto do provedor
    corresponde.
    Texto genérico de fallback interno como `LLM request failed with an unknown
    error.` permanece conservador e não aciona fallback de modelo por si só.

  </Accordion>

  <Accordion title='O que significa "No credentials found for profile anthropic:default"?'>
    Significa que o sistema tentou usar o ID de perfil de autenticação `anthropic:default`, mas não conseguiu encontrar credenciais para ele no armazenamento de autenticação esperado.

    **Checklist de correção:**

    - **Confirme onde os perfis de autenticação ficam** (caminhos novos vs. legados)
      - Atual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legado: `~/.openclaw/agent/*` (migrado por `openclaw doctor`)
    - **Confirme se sua variável de ambiente é carregada pelo Gateway**
      - Se você definiu `ANTHROPIC_API_KEY` no seu shell, mas executa o Gateway via systemd/launchd, ele pode não herdá-la. Coloque-a em `~/.openclaw/.env` ou habilite `env.shellEnv`.
    - **Certifique-se de estar editando o agente correto**
      - Configurações multiagente significam que pode haver vários arquivos `auth-profiles.json`.
    - **Faça uma verificação básica do status de modelo/autenticação**
      - Use `openclaw models status` para ver os modelos configurados e se os provedores estão autenticados.

    **Checklist de correção para "No credentials found for profile anthropic"**

    Isso significa que a execução está fixada em um perfil de autenticação da Anthropic, mas o Gateway
    não consegue encontrá-lo em seu armazenamento de autenticação.

    - **Use a Claude CLI**
      - Execute `openclaw models auth login --provider anthropic --method cli --set-default` no host do gateway.
    - **Se você quiser usar uma chave de API em vez disso**
      - Coloque `ANTHROPIC_API_KEY` em `~/.openclaw/.env` no **host do gateway**.
      - Limpe qualquer ordem fixada que force um perfil ausente:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirme que você está executando comandos no host do gateway**
      - No modo remoto, perfis de autenticação ficam na máquina do gateway, não no seu laptop.

  </Accordion>

  <Accordion title="Por que ele também tentou o Google Gemini e falhou?">
    Se sua configuração de modelo incluir Google Gemini como fallback (ou se você tiver mudado para uma forma abreviada do Gemini), o OpenClaw tentará usá-lo durante o fallback de modelo. Se você não tiver configurado credenciais do Google, verá `No API key found for provider "google"`.

    Correção: forneça autenticação do Google ou remova/evite modelos do Google em `agents.defaults.model.fallbacks` / aliases para que o fallback não direcione para lá.

    **Solicitação de LLM rejeitada: assinatura de pensamento necessária (Google Antigravity)**

    Causa: o histórico da sessão contém **blocos de pensamento sem assinaturas** (muitas vezes de
    um stream abortado/parcial). O Google Antigravity exige assinaturas para blocos de pensamento.

    Correção: o OpenClaw agora remove blocos de pensamento não assinados para o Google Antigravity Claude. Se ainda aparecer, inicie uma **nova sessão** ou defina `/thinking off` para esse agente.

  </Accordion>
</AccordionGroup>

## Perfis de autenticação: o que são e como gerenciá-los

Relacionado: [/concepts/oauth](/pt-BR/concepts/oauth) (fluxos OAuth, armazenamento de tokens, padrões de várias contas)

<AccordionGroup>
  <Accordion title="What is an auth profile?">
    Um perfil de autenticação é um registro de credencial nomeado (OAuth ou chave de API) vinculado a um provedor. Os perfis ficam em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Para inspecionar perfis salvos sem expor segredos, execute `openclaw models auth list` (opcionalmente `--provider <id>` ou `--json`). Consulte [CLI de modelos](/pt-BR/cli/models#openclaw-models-auth-list) para obter detalhes.

  </Accordion>

  <Accordion title="What are typical profile IDs?">
    O OpenClaw usa IDs prefixados por provedor, como:

    - `anthropic:default` (comum quando não existe identidade de email)
    - `anthropic:<email>` para identidades OAuth
    - IDs personalizados que você escolhe (por exemplo, `anthropic:work`)

  </Accordion>

  <Accordion title="Can I control which auth profile is tried first?">
    Sim. A configuração aceita metadados opcionais para perfis e uma ordenação por provedor (`auth.order.<provider>`). Isso **não** armazena segredos; mapeia IDs para provedor/modo e define a ordem de rotação.

    O OpenClaw pode ignorar temporariamente um perfil se ele estiver em um **cooldown** curto (limites de taxa/timeouts/falhas de autenticação) ou em um estado **desativado** mais longo (cobrança/créditos insuficientes). Para inspecionar isso, execute `openclaw models status --json` e verifique `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Cooldowns de limite de taxa podem ter escopo por modelo. Um perfil que está em cooldown
    para um modelo ainda pode ser utilizável para um modelo irmão no mesmo provedor,
    enquanto janelas de cobrança/desativação ainda bloqueiam o perfil inteiro.

    Você também pode definir uma substituição de ordem **por agente** (armazenada no `auth-state.json` desse agente) pela CLI:

    ```bash
    # Usa como padrão o agente padrão configurado (omita --agent)
    openclaw models auth order get --provider anthropic

    # Bloquear a rotação em um único perfil (tentar apenas este)
    openclaw models auth order set --provider anthropic anthropic:default

    # Ou definir uma ordem explícita (fallback dentro do provedor)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Limpar substituição (voltar para config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Para apontar para um agente específico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Para verificar o que será realmente tentado, use:

    ```bash
    openclaw models status --probe
    ```

    Se um perfil armazenado for omitido da ordem explícita, a sondagem relata
    `excluded_by_auth_order` para esse perfil em vez de tentar silenciosamente.

  </Accordion>

  <Accordion title="OAuth vs API key - what is the difference?">
    O OpenClaw aceita ambos:

    - **OAuth** muitas vezes aproveita o acesso por assinatura (quando aplicável).
    - **Chaves de API** usam cobrança por token.

    O assistente oferece suporte explicitamente à Anthropic Claude CLI, ao OpenAI Codex OAuth e a chaves de API.

  </Accordion>
</AccordionGroup>

## Relacionados

- [FAQ](/pt-BR/help/faq) — a FAQ principal
- [FAQ — início rápido e configuração da primeira execução](/pt-BR/help/faq-first-run)
- [Seleção de modelo](/pt-BR/concepts/model-providers)
- [Failover de modelo](/pt-BR/concepts/model-failover)
