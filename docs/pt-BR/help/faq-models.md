---
read_when:
    - Escolher ou alternar modelos, configurar apelidos
    - Depuração da alternância de modelo em caso de falha / "Todos os modelos falharam"
    - Entendendo perfis de autenticação e como gerenciá-los
sidebarTitle: Models FAQ
summary: 'FAQ: padrões de modelo, seleção, apelidos, troca, alternância em caso de falha e perfis de autenticação'
title: 'Perguntas frequentes: modelos e autenticação'
x-i18n:
    generated_at: "2026-05-07T13:19:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  Perguntas e respostas sobre modelos e perfis de autenticação. Para configuração, sessões, gateway, canais e
  solução de problemas, consulte a [FAQ](/pt-BR/help/faq) principal.

  ## Modelos: padrões, seleção, aliases, troca

  <AccordionGroup>
  <Accordion title='O que é o "modelo padrão"?'>
    O modelo padrão do OpenClaw é qualquer um que você definir como:

    ```
    agents.defaults.model.primary
    ```

    Modelos são referenciados como `provider/model` (exemplo: `openai/gpt-5.5` ou `anthropic/claude-sonnet-4-6`). Se você omitir o provedor, o OpenClaw primeiro tenta um alias, depois uma correspondência única de provedor configurado para esse ID de modelo exato, e só então recorre ao provedor padrão configurado como um caminho de compatibilidade obsoleto. Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado em vez de exibir um padrão obsoleto de provedor removido. Ainda assim, você deve definir `provider/model` **explicitamente**.

  </Accordion>

  <Accordion title="Qual modelo vocês recomendam?">
    **Padrão recomendado:** use o modelo mais forte de última geração disponível no seu conjunto de provedores.
    **Para agentes com ferramentas habilitadas ou entrada não confiável:** priorize a força do modelo em vez do custo.
    **Para chat rotineiro/de baixo risco:** use modelos de fallback mais baratos e roteie por função do agente.

    O MiniMax tem sua própria documentação: [MiniMax](/pt-BR/providers/minimax) e
    [Modelos locais](/pt-BR/gateway/local-models).

    Regra prática: use o **melhor modelo que você puder pagar** para trabalho de alto risco, e um modelo mais barato
    para chat rotineiro ou resumos. Você pode rotear modelos por agente e usar subagentes para
    paralelizar tarefas longas (cada subagente consome tokens). Consulte [Modelos](/pt-BR/concepts/models) e
    [Subagentes](/pt-BR/tools/subagents).

    Aviso importante: modelos mais fracos/excessivamente quantizados são mais vulneráveis a injeção de prompt
    e comportamento inseguro. Consulte [Segurança](/pt-BR/gateway/security).

    Mais contexto: [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Como troco de modelo sem apagar minha configuração?">
    Use **comandos de modelo** ou edite apenas os campos de **modelo**. Evite substituições completas da configuração.

    Opções seguras:

    - `/model` no chat (rápido, por sessão)
    - `openclaw models set ...` (atualiza apenas a configuração de modelo)
    - `openclaw configure --section model` (interativo)
    - edite `agents.defaults.model` em `~/.openclaw/openclaw.json`

    Evite `config.apply` com um objeto parcial, a menos que você pretenda substituir a configuração inteira.
    Para edições por RPC, inspecione primeiro com `config.schema.lookup` e prefira `config.patch`. A carga útil de lookup fornece o caminho normalizado, documentação/restrições de esquema superficiais e resumos imediatos dos filhos.
    para atualizações parciais.
    Se você sobrescreveu a configuração, restaure a partir de um backup ou execute `openclaw doctor` novamente para reparar.

    Documentação: [Modelos](/pt-BR/concepts/models), [Configurar](/pt-BR/cli/configure), [Configuração](/pt-BR/cli/config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usar modelos auto-hospedados (llama.cpp, vLLM, Ollama)?">
    Sim. O Ollama é o caminho mais fácil para modelos locais.

    Configuração mais rápida:

    1. Instale o Ollama de `https://ollama.com/download`
    2. Baixe um modelo local, como `ollama pull gemma4`
    3. Se você também quiser modelos em nuvem, execute `ollama signin`
    4. Execute `openclaw onboard` e escolha `Ollama`
    5. Escolha `Local` ou `Cloud + Local`

    Observações:

    - `Cloud + Local` oferece modelos em nuvem mais seus modelos Ollama locais
    - modelos em nuvem como `kimi-k2.5:cloud` não precisam de download local
    - para troca manual, use `openclaw models list` e `openclaw models set ollama/<model>`

    Nota de segurança: modelos menores ou muito quantizados são mais vulneráveis a injeção de prompt.
    Recomendamos fortemente **modelos grandes** para qualquer bot que possa usar ferramentas.
    Se você ainda quiser modelos pequenos, habilite sandboxing e allowlists rigorosas de ferramentas.

    Documentação: [Ollama](/pt-BR/providers/ollama), [Modelos locais](/pt-BR/gateway/local-models),
    [Provedores de modelo](/pt-BR/concepts/model-providers), [Segurança](/pt-BR/gateway/security),
    [Sandboxing](/pt-BR/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quais modelos OpenClaw, Flawd e Krill usam?">
    - Essas implantações podem diferir e mudar ao longo do tempo; não há recomendação fixa de provedor.
    - Verifique a configuração atual de runtime em cada Gateway com `openclaw models status`.
    - Para agentes sensíveis à segurança/com ferramentas habilitadas, use o modelo mais forte de última geração disponível.

  </Accordion>

  <Accordion title="Como troco de modelo em tempo real (sem reiniciar)?">
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

    Esses são os aliases integrados. Aliases personalizados podem ser adicionados via `agents.defaults.models`.

    Você pode listar os modelos disponíveis com `/model`, `/model list` ou `/model status`.

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

    Execute `/model` novamente **sem** o sufixo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se quiser voltar ao padrão, escolha-o em `/model` (ou envie `/model <default provider/model>`).
    Use `/model status` para confirmar qual perfil de autenticação está ativo.

  </Accordion>

  <Accordion title="Posso usar GPT 5.5 para tarefas diárias e Codex 5.5 para programação?">
    Sim. Trate a escolha de modelo e a escolha de runtime separadamente:

    - **Agente de programação Codex nativo:** defina `agents.defaults.model.primary` como `openai/gpt-5.5`. Faça login com `openclaw models auth login --provider openai-codex` quando quiser autenticação por assinatura ChatGPT/Codex.
    - **Tarefas diretas da API da OpenAI fora do loop do agente:** configure `OPENAI_API_KEY` para imagens, embeddings, fala, tempo real e outras superfícies da API da OpenAI que não sejam de agente.
    - **Autenticação por chave de API para agente OpenAI:** use `/model openai/gpt-5.5` com um perfil de chave de API `openai-codex` ordenado.
    - **Subagentes:** roteie tarefas de programação para um agente exclusivo do Codex com seu próprio modelo e padrão `agentRuntime`.

    Consulte [Modelos](/pt-BR/concepts/models) e [Comandos de barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como configuro o modo rápido para GPT 5.5?">
    Use uma alternância de sessão ou um padrão de configuração:

    - **Por sessão:** envie `/fast on` enquanto a sessão estiver usando `openai/gpt-5.5`.
    - **Padrão por modelo:** defina `agents.defaults.models["openai/gpt-5.5"].params.fastMode` como `true`.

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

    Para a OpenAI, o modo rápido mapeia para `service_tier = "priority"` em solicitações Responses nativas compatíveis. Substituições de sessão `/fast` têm precedência sobre padrões de configuração.

    Consulte [Pensamento e modo rápido](/pt-BR/tools/thinking) e [Modo rápido da OpenAI](/pt-BR/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Por que vejo "Model ... is not allowed" e depois nenhuma resposta?'>
    Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e quaisquer
    substituições de sessão. Escolher um modelo que não esteja nessa lista retorna:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Esse erro é retornado **em vez de** uma resposta normal. Correção: adicione o modelo a
    `agents.defaults.models`, remova a allowlist ou escolha um modelo em `/model list`.
    Se o comando também incluiu `--runtime codex`, adicione o modelo primeiro e depois tente novamente
    o mesmo comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Por que vejo "Unknown model: minimax/MiniMax-M2.7"?'>
    Isso significa que o **provedor não está configurado** (nenhuma configuração de provedor MiniMax ou perfil de autenticação
    foi encontrado), portanto o modelo não pode ser resolvido.

    Checklist de correção:

    1. Atualize para uma versão atual do OpenClaw (ou execute a partir do `main` do código-fonte) e reinicie o Gateway.
    2. Certifique-se de que o MiniMax esteja configurado (assistente ou JSON), ou que a autenticação MiniMax
       exista em env/perfis de autenticação para que o provedor correspondente possa ser injetado
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` ou OAuth MiniMax armazenado
       para `minimax-portal`).
    3. Use o ID de modelo exato (diferencia maiúsculas de minúsculas) para seu caminho de autenticação:
       `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed` para configuração com chave de API,
       ou `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para configuração OAuth.
    4. Execute:

       ```bash
       openclaw models list
       ```

       e escolha na lista (ou `/model list` no chat).

    Consulte [MiniMax](/pt-BR/providers/minimax) e [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar MiniMax como meu padrão e OpenAI para tarefas complexas?">
    Sim. Use **MiniMax como padrão** e troque de modelo **por sessão** quando necessário.
    Fallbacks são para **erros**, não para "tarefas difíceis"; portanto, use `/model` ou um agente separado.

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

    - Padrão do agente A: MiniMax
    - Padrão do agente B: OpenAI
    - Roteie por agente ou use `/agent` para alternar

    Documentação: [Modelos](/pt-BR/concepts/models), [Roteamento multiagente](/pt-BR/concepts/multi-agent), [MiniMax](/pt-BR/providers/minimax), [OpenAI](/pt-BR/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt são atalhos integrados?">
    Sim. O OpenClaw vem com algumas abreviações padrão (aplicadas apenas quando o modelo existe em `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Se você definir seu próprio alias com o mesmo nome, seu valor terá precedência.

  </Accordion>

  <Accordion title="Como defino/substituo atalhos de modelo (aliases)?">
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

  <Accordion title="Como adiciono modelos de outros provedores, como OpenRouter ou Z.AI?">
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

    Se você referencia um provedor/modelo, mas a chave obrigatória do provedor está ausente, receberá um erro de autenticação em tempo de execução (por exemplo, `No API key found for provider "zai"`).

    **Nenhuma chave de API encontrada para o provedor após adicionar um novo agente**

    Isso geralmente significa que o **novo agente** tem um armazenamento de autenticação vazio. A autenticação é por agente e
    fica armazenada em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opções de correção:

    - Execute `openclaw agents add <id>` e configure a autenticação durante o assistente.
    - Ou copie apenas perfis portáteis estáticos de `api_key` / `token` do armazenamento de autenticação do agente principal para o armazenamento de autenticação do novo agente.
    - Para perfis OAuth, faça login a partir do novo agente quando ele precisar da própria conta; caso contrário, o OpenClaw pode ler o agente padrão/principal sem clonar tokens de atualização.

    **Não** reutilize `agentDir` entre agentes; isso causa colisões de autenticação/sessão.

  </Accordion>
</AccordionGroup>

## Failover de modelo e "Todos os modelos falharam"

<AccordionGroup>
  <Accordion title="Como funciona o failover?">
    O failover acontece em duas etapas:

    1. **Rotação de perfil de autenticação** dentro do mesmo provedor.
    2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

    Cooldowns se aplicam a perfis com falha (backoff exponencial), então o OpenClaw pode continuar respondendo mesmo quando um provedor está com limite de taxa ou falhando temporariamente.

    O bucket de limite de taxa inclui mais do que respostas `429` simples. O OpenClaw
    também trata mensagens como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e limites periódicos
    de janela de uso (`weekly/monthly limit reached`) como limites de taxa
    que justificam failover.

    Algumas respostas que parecem ser de cobrança não são `402`, e algumas respostas HTTP `402`
    também permanecem nesse bucket transitório. Se um provedor retorna
    texto explícito de cobrança em `401` ou `403`, o OpenClaw ainda pode manter isso na
    faixa de cobrança, mas correspondentes de texto específicos do provedor permanecem limitados ao
    provedor que os possui (por exemplo, OpenRouter `Key limit exceeded`). Se uma mensagem `402`
    em vez disso parecer uma janela de uso repetível ou
    limite de gastos de organização/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), o OpenClaw a trata como
    `rate_limit`, não como uma desativação longa de cobrança.

    Erros de estouro de contexto são diferentes: assinaturas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` ou `ollama error: context length
    exceeded` permanecem no caminho de compaction/tentativa novamente em vez de avançar para o fallback de
    modelo.

    Texto genérico de erro de servidor é intencionalmente mais restrito do que "qualquer coisa com
    unknown/error nele". O OpenClaw trata formatos transitórios com escopo de provedor,
    como o `An unknown error occurred` simples da Anthropic, o `Provider returned error`
    simples da OpenRouter, erros de motivo de parada como `Unhandled stop reason:
    error`, payloads JSON `api_error` com texto transitório de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) e erros de provedor ocupado como `ModelNotReadyException` como
    sinais de tempo limite/sobrecarga que justificam failover quando o contexto do provedor
    corresponde.
    Texto genérico de fallback interno como `LLM request failed with an unknown
    error.` permanece conservador e não aciona fallback de modelo por si só.

  </Accordion>

  <Accordion title='O que significa "No credentials found for profile anthropic:default"?'>
    Isso significa que o sistema tentou usar o ID de perfil de autenticação `anthropic:default`, mas não conseguiu encontrar credenciais para ele no armazenamento de autenticação esperado.

    **Checklist de correção:**

    - **Confirme onde os perfis de autenticação ficam** (caminhos novos vs legados)
      - Atual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legado: `~/.openclaw/agent/*` (migrado por `openclaw doctor`)
    - **Confirme que sua variável de ambiente foi carregada pelo Gateway**
      - Se você definiu `ANTHROPIC_API_KEY` no shell, mas executa o Gateway via systemd/launchd, ele pode não herdá-la. Coloque-a em `~/.openclaw/.env` ou habilite `env.shellEnv`.
    - **Verifique se você está editando o agente correto**
      - Configurações multiagente significam que pode haver vários arquivos `auth-profiles.json`.
    - **Faça uma checagem básica do status de modelo/autenticação**
      - Use `openclaw models status` para ver modelos configurados e se os provedores estão autenticados.

    **Checklist de correção para "No credentials found for profile anthropic"**

    Isso significa que a execução está fixada em um perfil de autenticação da Anthropic, mas o Gateway
    não consegue encontrá-lo no armazenamento de autenticação.

    - **Use a Claude CLI**
      - Execute `openclaw models auth login --provider anthropic --method cli --set-default` no host do gateway.
    - **Se você quiser usar uma chave de API em vez disso**
      - Coloque `ANTHROPIC_API_KEY` em `~/.openclaw/.env` no **host do gateway**.
      - Limpe qualquer ordem fixada que force um perfil ausente:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirme que você está executando os comandos no host do gateway**
      - No modo remoto, os perfis de autenticação ficam na máquina do gateway, não no seu laptop.

  </Accordion>

  <Accordion title="Por que ele também tentou o Google Gemini e falhou?">
    Se sua configuração de modelo inclui o Google Gemini como fallback (ou se você trocou para um atalho do Gemini), o OpenClaw tentará usá-lo durante o fallback de modelo. Se você não configurou credenciais do Google, verá `No API key found for provider "google"`.

    Correção: forneça autenticação do Google ou remova/evite modelos do Google em `agents.defaults.model.fallbacks` / aliases para que o fallback não roteie para lá.

    **Solicitação de LLM rejeitada: assinatura de thinking obrigatória (Google Antigravity)**

    Causa: o histórico da sessão contém **blocos de thinking sem assinaturas** (frequentemente de
    um stream abortado/parcial). O Google Antigravity exige assinaturas para blocos de thinking.

    Correção: o OpenClaw agora remove blocos de thinking não assinados para Google Antigravity Claude. Se ainda aparecer, inicie uma **nova sessão** ou defina `/thinking off` para esse agente.

  </Accordion>
</AccordionGroup>

## Perfis de autenticação: o que são e como gerenciá-los

Relacionado: [/concepts/oauth](/pt-BR/concepts/oauth) (fluxos OAuth, armazenamento de tokens, padrões multi-conta)

<AccordionGroup>
  <Accordion title="O que é um perfil de autenticação?">
    Um perfil de autenticação é um registro de credencial nomeado (OAuth ou chave de API) vinculado a um provedor. Os perfis ficam em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Para inspecionar perfis salvos sem despejar segredos, execute `openclaw models auth list` (opcionalmente `--provider <id>` ou `--json`). Consulte [CLI de modelos](/pt-BR/cli/models#auth-profiles) para detalhes.

  </Accordion>

  <Accordion title="Quais são IDs de perfil típicos?">
    O OpenClaw usa IDs prefixados pelo provedor, como:

    - `anthropic:default` (comum quando não existe identidade de email)
    - `anthropic:<email>` para identidades OAuth
    - IDs personalizados que você escolher (por exemplo, `anthropic:work`)

  </Accordion>

  <Accordion title="Posso controlar qual perfil de autenticação é tentado primeiro?">
    Sim. A configuração oferece suporte a metadados opcionais para perfis e uma ordenação por provedor (`auth.order.<provider>`). Isso **não** armazena segredos; mapeia IDs para provedor/modo e define a ordem de rotação.

    O OpenClaw pode ignorar temporariamente um perfil se ele estiver em um **cooldown** curto (limites de taxa/tempos limite/falhas de autenticação) ou em um estado **desativado** mais longo (cobrança/créditos insuficientes). Para inspecionar isso, execute `openclaw models status --json` e verifique `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Cooldowns de limite de taxa podem ter escopo por modelo. Um perfil que está em cooldown
    para um modelo ainda pode ser utilizável para um modelo irmão no mesmo provedor,
    enquanto janelas de cobrança/desativação ainda bloqueiam o perfil inteiro.

    Você também pode definir uma substituição de ordem **por agente** (armazenada no `auth-state.json` desse agente) via CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Para direcionar a um agente específico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Para verificar o que será realmente tentado, use:

    ```bash
    openclaw models status --probe
    ```

    Se um perfil armazenado for omitido da ordem explícita, a sondagem relata
    `excluded_by_auth_order` para esse perfil em vez de tentá-lo silenciosamente.

  </Accordion>

  <Accordion title="OAuth vs chave de API - qual é a diferença?">
    O OpenClaw oferece suporte a ambos:

    - **OAuth** frequentemente aproveita acesso de assinatura (quando aplicável).
    - **Chaves de API** usam cobrança por token.

    O assistente oferece suporte explícito à Claude CLI da Anthropic, OAuth do OpenAI Codex e chaves de API.

  </Accordion>
</AccordionGroup>

## Relacionado

- [FAQ](/pt-BR/help/faq) — a FAQ principal
- [FAQ — início rápido e configuração da primeira execução](/pt-BR/help/faq-first-run)
- [Seleção de modelo](/pt-BR/concepts/model-providers)
- [Failover de modelo](/pt-BR/concepts/model-failover)
