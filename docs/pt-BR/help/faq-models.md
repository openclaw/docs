---
read_when:
    - Escolhendo ou trocando modelos, configurando aliases
    - Depurando failover de modelo / "Todos os modelos falharam"
    - Entendendo perfis de autenticação e como gerenciá-los
sidebarTitle: Models FAQ
summary: 'FAQ: padrões de modelo, seleção, aliases, troca, failover e perfis de autenticação'
title: 'FAQ: modelos e autenticação'
x-i18n:
    generated_at: "2026-04-25T18:19:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e060b48951b76d76a7f613b2abe3fdd845e34ae9eb5cbb36f45544f114edace7
    source_path: help/faq-models.md
    workflow: 15
---

  Perguntas e respostas sobre modelos e perfis de autenticação. Para configuração, sessões, gateway, canais e
  solução de problemas, consulte o [FAQ](/pt-BR/help/faq) principal.

  ## Modelos: padrões, seleção, aliases, troca

  <AccordionGroup>
  <Accordion title='O que é o "modelo padrão"?'>
    O modelo padrão do OpenClaw é aquele que você define em:

    ```
    agents.defaults.model.primary
    ```

    Os modelos são referenciados como `provider/model` (exemplo: `openai/gpt-5.5` ou `openai-codex/gpt-5.5`). Se você omitir o provider, o OpenClaw primeiro tenta um alias, depois uma correspondência única de provider configurado para esse id de modelo exato, e só então recorre ao provider padrão configurado como um caminho de compatibilidade obsoleto. Se esse provider não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provider/model configurado em vez de apresentar um padrão obsoleto de provider removido. Mesmo assim, você deve definir **explicitamente** `provider/model`.

  </Accordion>

  <Accordion title="Qual modelo você recomenda?">
    **Padrão recomendado:** use o modelo de geração mais recente e mais robusto disponível na sua pilha de providers.
    **Para agentes com ferramentas habilitadas ou entrada não confiável:** priorize robustez do modelo em vez de custo.
    **Para chat rotineiro/de baixo risco:** use modelos de fallback mais baratos e faça o roteamento por função do agente.

    O MiniMax tem sua própria documentação: [MiniMax](/pt-BR/providers/minimax) e
    [Modelos locais](/pt-BR/gateway/local-models).

    Regra prática: use o **melhor modelo que você puder pagar** para trabalho de alto risco, e um modelo mais barato
    para chat rotineiro ou resumos. Você pode rotear modelos por agente e usar subagentes para
    paralelizar tarefas longas (cada subagente consome tokens). Consulte [Modelos](/pt-BR/concepts/models) e
    [Subagentes](/pt-BR/tools/subagents).

    Aviso importante: modelos mais fracos/com quantização excessiva são mais vulneráveis a
    injeção de prompt e comportamento inseguro. Consulte [Segurança](/pt-BR/gateway/security).

    Mais contexto: [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Como troco de modelo sem apagar minha configuração?">
    Use **comandos de modelo** ou edite apenas os campos de **modelo**. Evite substituir a configuração completa.

    Opções seguras:

    - `/model` no chat (rápido, por sessão)
    - `openclaw models set ...` (atualiza apenas a configuração do modelo)
    - `openclaw configure --section model` (interativo)
    - edite `agents.defaults.model` em `~/.openclaw/openclaw.json`

    Evite `config.apply` com um objeto parcial, a menos que você pretenda substituir a configuração inteira.
    Para edições por RPC, primeiro inspecione com `config.schema.lookup` e prefira `config.patch`. O payload de lookup fornece o caminho normalizado, documentação/restrições superficiais do schema e resumos imediatos dos filhos.
    para atualizações parciais.
    Se você sobrescreveu a configuração, restaure a partir do backup ou execute `openclaw doctor` novamente para reparar.

    Documentação: [Modelos](/pt-BR/concepts/models), [Configure](/pt-BR/cli/configure), [Config](/pt-BR/cli/config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usar modelos self-hosted (llama.cpp, vLLM, Ollama)?">
    Sim. Ollama é o caminho mais fácil para modelos locais.

    Configuração mais rápida:

    1. Instale o Ollama em `https://ollama.com/download`
    2. Baixe um modelo local, como `ollama pull gemma4`
    3. Se você também quiser modelos em nuvem, execute `ollama signin`
    4. Execute `openclaw onboard` e escolha `Ollama`
    5. Escolha `Local` ou `Cloud + Local`

    Observações:

    - `Cloud + Local` oferece modelos em nuvem mais seus modelos locais do Ollama
    - modelos em nuvem como `kimi-k2.5:cloud` não precisam de download local
    - para troca manual, use `openclaw models list` e `openclaw models set ollama/<model>`

    Observação de segurança: modelos menores ou fortemente quantizados são mais vulneráveis a injeção de prompt.
    Recomendamos fortemente **modelos grandes** para qualquer bot que possa usar ferramentas.
    Se você ainda quiser modelos pequenos, ative sandboxing e listas de permissão estritas de ferramentas.

    Documentação: [Ollama](/pt-BR/providers/ollama), [Modelos locais](/pt-BR/gateway/local-models),
    [Providers de modelo](/pt-BR/concepts/model-providers), [Segurança](/pt-BR/gateway/security),
    [Sandboxing](/pt-BR/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quais modelos o OpenClaw, Flawd e Krill usam?">
    - Essas implantações podem ser diferentes e mudar ao longo do tempo; não há uma recomendação fixa de provider.
    - Verifique a configuração atual em tempo de execução em cada gateway com `openclaw models status`.
    - Para agentes sensíveis à segurança/com ferramentas habilitadas, use o modelo de geração mais recente e mais robusto disponível.
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

    Estes são os aliases internos. Aliases personalizados podem ser adicionados via `agents.defaults.models`.

    Você pode listar os modelos disponíveis com `/model`, `/model list` ou `/model status`.

    `/model` (e `/model list`) mostra um seletor compacto e numerado. Selecione por número:

    ```
    /model 3
    ```

    Você também pode forçar um perfil de autenticação específico para o provider (por sessão):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Dica: `/model status` mostra qual agente está ativo, qual arquivo `auth-profiles.json` está sendo usado e qual perfil de autenticação será tentado em seguida.
    Também mostra o endpoint configurado do provider (`baseUrl`) e o modo da API (`api`) quando disponível.

    **Como removo a fixação de um perfil definido com @profile?**

    Execute `/model` novamente **sem** o sufixo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se quiser voltar ao padrão, escolha-o em `/model` (ou envie `/model <provider/model padrão>`).
    Use `/model status` para confirmar qual perfil de autenticação está ativo.

  </Accordion>

  <Accordion title="Posso usar GPT 5.5 para tarefas diárias e Codex 5.5 para programação?">
    Sim. Defina um como padrão e troque quando necessário:

    - **Troca rápida (por sessão):** `/model openai/gpt-5.5` para tarefas atuais com chave de API direta da OpenAI ou `/model openai-codex/gpt-5.5` para tarefas com OAuth do GPT-5.5 Codex.
    - **Padrão:** defina `agents.defaults.model.primary` como `openai/gpt-5.5` para uso com chave de API ou `openai-codex/gpt-5.5` para uso com OAuth do GPT-5.5 Codex.
    - **Subagentes:** roteie tarefas de programação para subagentes com um modelo padrão diferente.

    Consulte [Modelos](/pt-BR/concepts/models) e [Comandos de barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como configuro o modo rápido para GPT 5.5?">
    Use um controle por sessão ou um padrão de configuração:

    - **Por sessão:** envie `/fast on` enquanto a sessão estiver usando `openai/gpt-5.5` ou `openai-codex/gpt-5.5`.
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

    Para OpenAI, o modo rápido corresponde a `service_tier = "priority"` em requisições nativas Responses compatíveis. Substituições de sessão com `/fast` têm precedência sobre os padrões de configuração.

    Consulte [Thinking and fast mode](/pt-BR/tools/thinking) e [Modo rápido da OpenAI](/pt-BR/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Por que vejo "Model ... is not allowed" e depois nenhuma resposta?'>
    Se `agents.defaults.models` estiver definido, ele se torna a **lista de permissão** para `/model` e qualquer
    substituição de sessão. Escolher um modelo que não está nessa lista retorna:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Esse erro é retornado **em vez de** uma resposta normal. Correção: adicione o modelo a
    `agents.defaults.models`, remova a lista de permissão ou escolha um modelo em `/model list`.

  </Accordion>

  <Accordion title='Por que vejo "Unknown model: minimax/MiniMax-M2.7"?'>
    Isso significa que o **provider não está configurado** (nenhuma configuração de provider MiniMax nem perfil de
    autenticação foi encontrado), então o modelo não pode ser resolvido.

    Checklist de correção:

    1. Atualize para uma versão atual do OpenClaw (ou execute a partir do código-fonte `main`) e depois reinicie o gateway.
    2. Certifique-se de que o MiniMax está configurado (assistente ou JSON), ou de que a autenticação do MiniMax
       existe no ambiente/perfis de autenticação para que o provider correspondente possa ser injetado
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` ou MiniMax
       OAuth armazenado para `minimax-portal`).
    3. Use o id de modelo exato (diferencia maiúsculas de minúsculas) para seu caminho de autenticação:
       `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed` para configuração com chave de API,
       ou `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para configuração com OAuth.
    4. Execute:

       ```bash
       openclaw models list
       ```

       e escolha a partir da lista (ou `/model list` no chat).

    Consulte [MiniMax](/pt-BR/providers/minimax) e [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar MiniMax como padrão e OpenAI para tarefas complexas?">
    Sim. Use o **MiniMax como padrão** e troque de modelo **por sessão** quando necessário.
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

    Depois:

    ```
    /model gpt
    ```

    **Opção B: agentes separados**

    - Agente A padrão: MiniMax
    - Agente B padrão: OpenAI
    - Faça o roteamento por agente ou use `/agent` para trocar

    Documentação: [Modelos](/pt-BR/concepts/models), [Roteamento de múltiplos agentes](/pt-BR/concepts/multi-agent), [MiniMax](/pt-BR/providers/minimax), [OpenAI](/pt-BR/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt são atalhos internos?">
    Sim. O OpenClaw inclui alguns atalhos padrão (aplicados apenas quando o modelo existe em `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` para configurações com chave de API, ou `openai-codex/gpt-5.5` quando configurado para OAuth do Codex
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Se você definir seu próprio alias com o mesmo nome, seu valor terá precedência.

  </Accordion>

  <Accordion title="Como defino/substituo atalhos de modelo (aliases)?">
    Os aliases vêm de `agents.defaults.models.<modelId>.alias`. Exemplo:

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

    Depois, `/model sonnet` (ou `/<alias>` quando compatível) será resolvido para esse id de modelo.

  </Accordion>

  <Accordion title="Como adiciono modelos de outros providers, como OpenRouter ou Z.AI?">
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
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Se você referenciar um `provider/model`, mas a chave exigida do provider estiver ausente, receberá um erro de autenticação em tempo de execução (por exemplo, `No API key found for provider "zai"`).

    **Nenhuma chave de API encontrada para o provider após adicionar um novo agente**

    Isso geralmente significa que o **novo agente** tem um armazenamento de autenticação vazio. A autenticação é por agente e
    fica armazenada em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opções de correção:

    - Execute `openclaw agents add <id>` e configure a autenticação durante o assistente.
    - Ou copie `auth-profiles.json` do `agentDir` do agente principal para o `agentDir` do novo agente.

    **Não** reutilize `agentDir` entre agentes; isso causa colisões de autenticação/sessão.

  </Accordion>
</AccordionGroup>

## Failover de modelo e "All models failed"

<AccordionGroup>
  <Accordion title="Como o failover funciona?">
    O failover acontece em dois estágios:

    1. **Rotação de perfil de autenticação** dentro do mesmo provider.
    2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

    Cooldowns se aplicam a perfis com falha (backoff exponencial), para que o OpenClaw possa continuar respondendo mesmo quando um provider está com rate limit ou falhando temporariamente.

    O bucket de rate limit inclui mais do que respostas simples `429`. O OpenClaw
    também trata mensagens como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e limites
    periódicos de janela de uso (`weekly/monthly limit reached`) como
    rate limits dignos de failover.

    Algumas respostas com aparência de cobrança não são `402`, e algumas respostas HTTP `402`
    também permanecem nesse bucket transitório. Se um provider retornar
    texto explícito de cobrança em `401` ou `403`, o OpenClaw ainda pode manter isso
    na trilha de cobrança, mas correspondências de texto específicas do provider permanecem limitadas ao
    provider ao qual pertencem (por exemplo, OpenRouter `Key limit exceeded`). Se uma mensagem `402`
    em vez disso parecer um limite de janela de uso repetível ou
    um limite de gastos de organização/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), o OpenClaw trata isso como
    `rate_limit`, não como uma desativação longa por cobrança.

    Erros de overflow de contexto são diferentes: assinaturas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` ou `ollama error: context length
    exceeded` permanecem no caminho de Compaction/tentativa novamente em vez de avançar o fallback
    de modelo.

    O texto genérico de erro de servidor é intencionalmente mais restrito do que "qualquer coisa com
    unknown/error nele". O OpenClaw trata formas transitórias com escopo de provider
    como Anthropic simples `An unknown error occurred`, OpenRouter simples
    `Provider returned error`, erros de stop-reason como `Unhandled stop reason:
    error`, payloads JSON `api_error` com texto transitório de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) e erros de provider ocupado como `ModelNotReadyException` como
    sinais de timeout/sobrecarga dignos de failover quando o contexto do provider
    corresponde.
    Texto genérico interno de fallback como `LLM request failed with an unknown
    error.` permanece conservador e não aciona fallback de modelo por si só.

  </Accordion>

  <Accordion title='O que significa "No credentials found for profile anthropic:default"?'>
    Isso significa que o sistema tentou usar o id de perfil de autenticação `anthropic:default`, mas não conseguiu encontrar credenciais para ele no armazenamento de autenticação esperado.

    **Checklist de correção:**

    - **Confirme onde os perfis de autenticação ficam** (caminhos novos vs legados)
      - Atual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legado: `~/.openclaw/agent/*` (migrado por `openclaw doctor`)
    - **Confirme que sua variável de ambiente foi carregada pelo Gateway**
      - Se você definiu `ANTHROPIC_API_KEY` no seu shell, mas executa o Gateway via systemd/launchd, ele pode não herdá-la. Coloque-a em `~/.openclaw/.env` ou ative `env.shellEnv`.
    - **Certifique-se de estar editando o agente correto**
      - Configurações com múltiplos agentes significam que pode haver vários arquivos `auth-profiles.json`.
    - **Faça uma verificação básica do status de modelo/autenticação**
      - Use `openclaw models status` para ver os modelos configurados e se os providers estão autenticados.

    **Checklist de correção para "No credentials found for profile anthropic"**

    Isso significa que a execução está fixada em um perfil de autenticação Anthropic, mas o Gateway
    não consegue encontrá-lo em seu armazenamento de autenticação.

    - **Use Claude CLI**
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

  <Accordion title="Por que ele também tentou Google Gemini e falhou?">
    Se sua configuração de modelo incluir Google Gemini como fallback (ou se você trocou para um atalho Gemini), o OpenClaw tentará usá-lo durante o fallback de modelo. Se você não configurou credenciais do Google, verá `No API key found for provider "google"`.

    Correção: forneça autenticação do Google ou remova/evite modelos do Google em `agents.defaults.model.fallbacks` / aliases para que o fallback não seja roteado para lá.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Causa: o histórico da sessão contém **blocos de thinking sem assinaturas** (geralmente de
    um stream abortado/parcial). O Google Antigravity exige assinaturas para blocos de thinking.

    Correção: o OpenClaw agora remove blocos de thinking sem assinatura para Claude no Google Antigravity. Se isso ainda aparecer, inicie uma **nova sessão** ou defina `/thinking off` para esse agente.

  </Accordion>
</AccordionGroup>

## Perfis de autenticação: o que são e como gerenciá-los

Relacionado: [/concepts/oauth](/pt-BR/concepts/oauth) (fluxos de OAuth, armazenamento de tokens, padrões de múltiplas contas)

<AccordionGroup>
  <Accordion title="O que é um perfil de autenticação?">
    Um perfil de autenticação é um registro nomeado de credenciais (OAuth ou chave de API) vinculado a um provider. Os perfis ficam em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Quais são ids de perfil típicos?">
    O OpenClaw usa ids com prefixo do provider, como:

    - `anthropic:default` (comum quando não existe identidade de email)
    - `anthropic:<email>` para identidades OAuth
    - ids personalizados que você escolher (por exemplo, `anthropic:work`)

  </Accordion>

  <Accordion title="Posso controlar qual perfil de autenticação é tentado primeiro?">
    Sim. A configuração oferece suporte a metadados opcionais para perfis e uma ordenação por provider (`auth.order.<provider>`). Isso **não** armazena segredos; mapeia ids para provider/modo e define a ordem de rotação.

    O OpenClaw pode pular temporariamente um perfil se ele estiver em um **cooldown** curto (rate limits/timeouts/falhas de autenticação) ou em um estado **desativado** mais longo (cobrança/créditos insuficientes). Para inspecionar isso, execute `openclaw models status --json` e verifique `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Cooldowns de rate limit podem ter escopo de modelo. Um perfil que está em cooldown
    para um modelo ainda pode ser utilizável para um modelo irmão no mesmo provider,
    enquanto janelas de cobrança/desativação ainda bloqueiam o perfil inteiro.

    Você também pode definir uma substituição de ordem **por agente** (armazenada no `auth-state.json` desse agente) via CLI:

    ```bash
    # Usa por padrão o agente padrão configurado (omita --agent)
    openclaw models auth order get --provider anthropic

    # Limita a rotação a um único perfil (tenta apenas este)
    openclaw models auth order set --provider anthropic anthropic:default

    # Ou define uma ordem explícita (fallback dentro do provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Limpa a substituição (volta para config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Para direcionar um agente específico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Para verificar o que de fato será tentado, use:

    ```bash
    openclaw models status --probe
    ```

    Se um perfil armazenado for omitido da ordem explícita, o probe informa
    `excluded_by_auth_order` para esse perfil em vez de tentá-lo silenciosamente.

  </Accordion>

  <Accordion title="OAuth vs chave de API - qual é a diferença?">
    O OpenClaw oferece suporte a ambos:

    - **OAuth** geralmente aproveita acesso por assinatura (quando aplicável).
    - **Chaves de API** usam cobrança por token.

    O assistente oferece suporte explícito a Anthropic Claude CLI, OpenAI Codex OAuth e chaves de API.

  </Accordion>
</AccordionGroup>

## Relacionado

- [FAQ](/pt-BR/help/faq) — o FAQ principal
- [FAQ — início rápido e configuração da primeira execução](/pt-BR/help/faq-first-run)
- [Seleção de modelo](/pt-BR/concepts/model-providers)
- [Failover de modelo](/pt-BR/concepts/model-failover)
