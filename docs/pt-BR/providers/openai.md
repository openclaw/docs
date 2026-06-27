---
read_when:
    - Você quer usar modelos da OpenAI no OpenClaw
    - Você quer autenticação por assinatura do Codex em vez de chaves de API
    - Você precisa de um comportamento de execução de agente GPT-5 mais rigoroso
summary: Use OpenAI por meio de chaves de API ou assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T18:05:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fornece APIs de desenvolvedor para modelos GPT, e o Codex também está disponível como um
agente de programação de plano ChatGPT por meio dos clientes Codex da OpenAI. OpenClaw usa um
id de provedor, `openai`, para ambos os formatos de autenticação.

OpenClaw usa `openai/*` como a rota canônica de modelos OpenAI. Turnos de agente
incorporados em modelos OpenAI são executados pelo runtime nativo app-server do Codex por
padrão; a autenticação direta por chave de API da OpenAI continua disponível para superfícies
OpenAI que não são de agente, como imagens, embeddings, fala e realtime.

- **Modelos de agente** - modelos `openai/*` pelo runtime do Codex; entre com
  autenticação Codex para uso de assinatura ChatGPT/Codex, ou configure um backup
  de chave de API OpenAI compatível com Codex quando você intencionalmente quiser autenticação por chave de API.
- **APIs OpenAI que não são de agente** - acesso direto à OpenAI Platform com cobrança
  baseada em uso por `OPENAI_API_KEY` ou onboarding com chave de API da OpenAI.
- **Configuração herdada** - refs de modelo Codex herdadas são reparadas por
  `openclaw doctor --fix` para `openai/*` mais o runtime do Codex.

OpenAI oferece suporte explícito ao uso de OAuth de assinatura em ferramentas e fluxos de trabalho externos como OpenClaw.

Provedor, modelo, runtime e canal são camadas separadas. Se esses rótulos estão
sendo misturados, leia [Runtimes de agente](/pt-BR/concepts/agent-runtimes) antes de
alterar a configuração.

## Escolha rápida

| Objetivo                                             | Use                                                      | Observações                                                           |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Assinatura ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-5.5`                                         | Configuração padrão de agente OpenAI. Entre com autenticação Codex.   |
| Cobrança direta por chave de API para modelos de agente | `openai/gpt-5.5` mais um perfil de chave de API compatível com Codex | Use `auth.order.openai` para colocar o backup depois da autenticação por assinatura. |
| Cobrança direta por chave de API pelo OpenClaw explícito | `openai/gpt-5.5` mais runtime de provedor/modelo `openclaw` | Selecione um perfil normal de chave de API `openai`.                  |
| Alias mais recente da API ChatGPT Instant            | `openai/chat-latest`                                     | Somente chave de API direta. Alias móvel para experimentos, não o padrão. |
| Autenticação de assinatura ChatGPT/Codex pelo OpenClaw | `openai/gpt-5.5` mais runtime de provedor/modelo `openclaw` | Selecione um perfil OAuth `openai` para a rota de compatibilidade.    |
| Geração ou edição de imagens                         | `openai/gpt-image-2`                                     | Funciona com `OPENAI_API_KEY` ou OAuth OpenAI Codex.                  |
| Imagens com fundo transparente                       | `openai/gpt-image-1.5`                                   | Use `outputFormat=png` ou `webp` e `openai.background=transparent`.   |

## Mapa de nomes

Os nomes são parecidos, mas não são intercambiáveis:

| Nome que você vê                         | Camada            | Significado                                                                                       |
| ---------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                 | Prefixo de provedor | Rota canônica de modelos OpenAI; turnos de agente usam o runtime do Codex.                        |
| prefixo herdado OpenAI Codex             | Prefixo herdado   | Namespace mais antigo de modelo/perfil. `openclaw doctor --fix` o migra para `openai`.           |
| Plugin `codex`                           | Plugin            | Plugin OpenClaw incluído que fornece o runtime nativo app-server do Codex e controles de chat `/codex`. |
| provider/model `agentRuntime.id: codex`  | Runtime de agente | Força o harness nativo app-server do Codex para turnos incorporados correspondentes.              |
| `/codex ...`                             | Conjunto de comandos de chat | Vincula/controla threads app-server do Codex a partir de uma conversa.                            |
| `runtime: "acp", agentId: "codex"`       | Rota de sessão ACP | Caminho de fallback explícito que executa Codex por ACP/acpx.                                     |

Isso significa que uma configuração pode conter intencionalmente refs de modelo `openai/*` enquanto
perfis de autenticação apontam para credenciais de chave de API ou OAuth ChatGPT/Codex. Use
`auth.order.openai` para configuração; `openclaw doctor --fix` reescreve refs de modelo
Codex herdadas herdadas, ids de perfil de autenticação Codex herdados e
ordem de autenticação Codex herdada para a rota canônica OpenAI.

<Note>
GPT-5.5 está disponível tanto por acesso direto com chave de API da OpenAI Platform quanto por
rotas de assinatura/OAuth. Para assinatura ChatGPT/Codex mais execução nativa do Codex,
use `openai/gpt-5.5`; configuração de runtime não definida agora seleciona o harness do Codex
para turnos de agente OpenAI. Use perfis de chave de API OpenAI somente quando quiser
autenticação direta por chave de API para um modelo de agente OpenAI.
</Note>

<Note>
Turnos de modelo de agente OpenAI exigem o Plugin app-server Codex incluído. A configuração
explícita de runtime do OpenClaw continua disponível como uma rota de compatibilidade opcional. Quando OpenClaw é
selecionado explicitamente com um perfil OAuth `openai`, OpenClaw mantém a
ref pública de modelo como `openai/*` e roteia internamente pelo transporte de autenticação Codex.
Execute `openclaw doctor --fix` para reparar refs de modelo Codex herdadas obsoletas,
`codex-cli/*` ou pins antigos de sessão de runtime que não vêm de
configuração explícita de runtime.
</Note>

## Cobertura de recursos do OpenClaw

| Capacidade OpenAI        | Superfície OpenClaw                                                                          | Status                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses         | provedor de modelo `openai/<model>`                                                          | Sim                                                                    |
| Modelos de assinatura Codex | `openai/<model>` com OAuth OpenAI                                                         | Sim                                                                    |
| Refs de modelo Codex herdadas | refs de modelo Codex herdadas ou `codex-cli/<model>`                                    | Reparadas pelo doctor para `openai/<model>`                            |
| Harness app-server do Codex | `openai/<model>` com runtime omitido ou provider/model `agentRuntime.id: codex`           | Sim                                                                    |
| Pesquisa web do lado do servidor | Ferramenta nativa OpenAI Responses                                                   | Sim, quando pesquisa web está ativada e nenhum provedor está fixado    |
| Imagens                  | `image_generate`                                                                             | Sim                                                                    |
| Vídeos                   | `video_generate`                                                                             | Sim                                                                    |
| Texto para fala          | `messages.tts.provider: "openai"` / `tts`                                                     | Sim                                                                    |
| Fala para texto em lote  | `tools.media.audio` / compreensão de mídia                                                    | Sim                                                                    |
| Fala para texto em streaming | Voice Call `streaming.provider: "openai"`                                                | Sim                                                                    |
| Voz realtime             | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Sim (exige créditos da OpenAI Platform, não assinatura Codex/ChatGPT) |
| Embeddings               | provedor de embeddings de memória                                                            | Sim                                                                    |

<Note>
  A voz Realtime da OpenAI (usada por `realtime.provider: "openai"` do Voice Call e
  pelo Control UI Talk com `talk.realtime.provider: "openai"`) passa pela
  **API Realtime da OpenAI Platform** pública, que é cobrada contra créditos da OpenAI
  Platform, em vez da cota de assinatura Codex/ChatGPT. Uma conta
  com OAuth OpenAI saudável que executa modelos de chat baseados em Codex sem problema
  ainda precisa de um perfil de autenticação por chave de API OpenAI ou uma chave de API Platform com
  cobrança Platform financiada para voz Realtime.

Correção: adicione créditos Platform em
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
para a organização que dá suporte às suas credenciais realtime. Voz Realtime aceita
o perfil de autenticação por chave de API `openai` criado por `openclaw onboard --auth-choice openai-api-key`,
uma `OPENAI_API_KEY` Platform configurada via `talk.realtime.providers.openai.apiKey`
para Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
para Voice Call, ou a variável de ambiente `OPENAI_API_KEY`. Perfis OAuth OpenAI
ainda podem executar modelos de chat `openai/*` baseados em Codex na mesma
instalação OpenClaw, mas não configuram voz Realtime.
</Note>

## Embeddings de memória

OpenClaw pode usar OpenAI, ou um endpoint de embeddings compatível com OpenAI, para
indexação `memory_search` e embeddings de consulta:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Para endpoints compatíveis com OpenAI que exigem rótulos de embedding assimétricos, defina
`queryInputType` e `documentInputType` em `memorySearch`. OpenClaw encaminha
esses valores como campos de solicitação `input_type` específicos do provedor: embeddings de consulta usam
`queryInputType`; fragmentos de memória indexados e indexação em lote usam
`documentInputType`. Veja a [referência de configuração de memória](/pt-BR/reference/memory-config#provider-specific-config) para o exemplo completo.

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API (OpenAI Platform)">
    **Melhor para:** acesso direto à API e cobrança baseada em uso.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API no [painel da OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumo de rotas

    | Ref de modelo          | Configuração de runtime      | Rota                        | Autenticação     |
    | ---------------------- | ---------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omitido / provider/model `agentRuntime.id: "codex"` | Harness app-server do Codex | Perfil OpenAI compatível com Codex |
    | `openai/gpt-5.4-mini` | omitido / provider/model `agentRuntime.id: "codex"` | Harness app-server do Codex | Perfil OpenAI compatível com Codex |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | Runtime incorporado do OpenClaw | Perfil `openai` selecionado |

    <Note>
    Os modelos de agente `openai/*` usam o harness de app-server do Codex. Para usar
    autenticação por chave de API para um modelo de agente, crie um perfil de chave de API
    compatível com Codex e ordene-o com `auth.order.openai`; `OPENAI_API_KEY` continua sendo o fallback direto para
    superfícies de API OpenAI que não são de agente. Execute `openclaw doctor --fix` para migrar entradas antigas
    legadas de ordem de autenticação Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Para experimentar o modelo Instant atual do ChatGPT pela API OpenAI, defina o modelo
    como `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` é um alias móvel. A OpenAI o documenta como o modelo Instant mais recente
    usado no ChatGPT e recomenda `gpt-5.5` para uso de API em produção, portanto
    mantenha `openai/gpt-5.5` como o padrão estável, a menos que você queira explicitamente esse
    comportamento de alias. Atualmente, o alias aceita apenas verbosidade de texto `medium`, então
    o OpenClaw normaliza substituições incompatíveis de verbosidade de texto da OpenAI para este
    modelo.

    <Warning>
    O OpenClaw **não** expõe `gpt-5.3-codex-spark` na rota direta por chave de API da OpenAI. Ele está disponível apenas por meio de entradas do catálogo de assinatura Codex quando sua conta conectada o expõe.
    </Warning>

  </Tab>

  <Tab title="Assinatura Codex">
    **Melhor para:** usar sua assinatura ChatGPT/Codex com execução nativa do app-server Codex em vez de uma chave de API separada. A nuvem Codex exige login no ChatGPT.

    <Steps>
      <Step title="Executar OAuth do Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai
        ```

        Para configurações sem interface ou hostis a callback, adicione `--device-code` para entrar com um fluxo de código de dispositivo do ChatGPT em vez do callback de navegador localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Usar a rota canônica de modelo OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Nenhuma configuração de runtime é necessária para o caminho padrão. Turnos de agente OpenAI
        selecionam automaticamente o runtime nativo do app-server Codex, e o OpenClaw
        instala ou repara o Plugin Codex incluído quando esta rota é escolhida.
      </Step>
      <Step title="Verificar se a autenticação Codex está disponível">
        ```bash
        openclaw models list --provider openai
        ```

        Depois que o Gateway estiver em execução, envie `/codex status` ou `/codex models`
        no chat para verificar o runtime nativo do app-server.
      </Step>
    </Steps>

    ### Resumo de rotas

    | Ref. de modelo | Configuração de runtime | Rota | Autenticação |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omitida / provedor/modelo `agentRuntime.id: "codex"` | Harness nativo do app-server Codex | Login Codex ou perfil de autenticação `openai` ordenado |
    | `openai/gpt-5.5` | provedor/modelo `agentRuntime.id: "openclaw"` | Runtime incorporado do OpenClaw com transporte interno de autenticação Codex | Perfil OAuth `openai` selecionado |
    | ref. legada Codex GPT-5.5 | reparada pelo doctor | Rota legada reescrita para `openai/gpt-5.5` | Perfil OAuth OpenAI migrado |
    | `codex-cli/gpt-5.5` | reparada pelo doctor | Rota CLI legada reescrita para `openai/gpt-5.5` | Autenticação do app-server Codex |

    <Warning>
    Prefira `openai/gpt-5.5` para novas configurações de agente respaldadas por assinatura. Refs
    legadas antigas de GPT Codex são rotas legadas do OpenClaw, não o caminho nativo
    do runtime Codex; execute `openclaw doctor --fix` quando quiser migrá-las para refs
    canônicas `openai/*`. `gpt-5.3-codex-spark` continua limitado a contas cujo
    catálogo de assinatura Codex anuncia esse modelo; refs diretas por chave de API da OpenAI e
    Azure para ele continuam suprimidas.
    </Warning>

    <Note>
    O prefixo legado de modelo Codex é configuração legada reparada pelo doctor. Para
    a configuração comum de assinatura mais runtime nativo, entre com autenticação Codex,
    mas mantenha a ref. do modelo como `openai/gpt-5.5`. Novas configurações devem colocar a
    ordem de autenticação de agentes OpenAI em `auth.order.openai`; o doctor migra entradas
    antigas legadas de ordem de autenticação Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    Com um backup por chave de API, mantenha o modelo em `openai/gpt-5.5` e coloque a
    ordem de autenticação em `openai`. O OpenClaw tentará a assinatura primeiro, depois
    a chave de API, enquanto permanece no harness Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    O onboarding não importa mais material OAuth de `~/.codex`. Entre com OAuth no navegador (padrão) ou com o fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de autenticação de agente.
    </Note>

    ### Verificar e recuperar roteamento OAuth do Codex

    Use estes comandos para ver qual modelo, runtime e rota de autenticação seu agente
    padrão está usando:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Para um agente específico, adicione `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Se uma configuração antiga ainda tiver refs legadas de GPT Codex ou um pin obsoleto de sessão de runtime OpenAI
    sem configuração explícita de runtime, repare-a:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Se `models auth list --provider openai` não mostrar nenhum perfil utilizável, entre
    novamente:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Use `--profile-id` quando quiser vários logins OAuth Codex no mesmo
    agente e depois quiser controlá-los por ordenação de autenticação ou `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` é a rota de modelo para turnos de agente OpenAI pelo Codex. Execute
    `openclaw doctor --fix` para migrar ids de perfil antigos com prefixo legado OpenAI Codex e
    entradas de ordem antes de depender da ordenação de perfis.

    ### Indicador de status

    O chat `/status` mostra qual runtime de modelo está ativo para a sessão atual.
    O harness de app-server Codex incluído aparece como `Runtime: OpenAI Codex` para
    turnos de modelo de agente OpenAI. Pins obsoletos de sessão de runtime OpenAI são reparados para Codex, a menos que
    a configuração fixe explicitamente o OpenClaw.

    ### Aviso do doctor

    Se refs legadas de modelo Codex ou pins obsoletos de runtime OpenAI permanecerem na configuração ou no
    estado de sessão, `openclaw doctor --fix` os reescreve para `openai/*` com o
    runtime Codex, a menos que o OpenClaw esteja explicitamente configurado.

    ### Limite da janela de contexto

    O OpenClaw trata metadados de modelo e o limite de contexto do runtime como valores separados.

    Para `openai/gpt-5.5` por meio do catálogo OAuth Codex:

    - `contextWindow` nativo: `1000000`
    - Limite padrão de runtime `contextTokens`: `272000`

    O limite padrão menor tem melhores características de latência e qualidade na prática. Substitua-o com `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Use `contextWindow` para declarar metadados nativos do modelo. Use `contextTokens` para limitar o orçamento de contexto do runtime.
    </Note>

    ### Recuperação do catálogo

    O OpenClaw usa metadados do catálogo upstream Codex para `gpt-5.5` quando eles estão
    presentes. Se a descoberta Codex ao vivo omitir a linha `gpt-5.5` enquanto
    a conta estiver autenticada, o OpenClaw sintetiza essa linha de modelo OAuth para que
    Cron, subagentes e execuções de modelo padrão configurado não falhem com
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticação nativa do app-server Codex

O harness nativo do app-server Codex usa refs de modelo `openai/*` mais configuração de
runtime omitida ou provedor/modelo `agentRuntime.id: "codex"`, mas sua autenticação
ainda é baseada em conta. O OpenClaw seleciona a autenticação nesta ordem:

1. Perfis de autenticação OpenAI ordenados para o agente, preferencialmente em
   `auth.order.openai`. Execute `openclaw doctor --fix` para migrar ids antigos
   legados de perfil de autenticação Codex e a ordem legada de autenticação Codex.
2. A conta existente do app-server, como um login local ChatGPT da CLI Codex.
3. Apenas para inicializações locais do app-server por stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando o app-server informa que não há conta e ainda exige
   autenticação OpenAI.

Isso significa que um login local de assinatura ChatGPT/Codex não é substituído apenas
porque o processo do Gateway também tem `OPENAI_API_KEY` para modelos OpenAI diretos
ou embeddings. O fallback de chave de API por env é apenas o caminho local de stdio sem conta; ele
não é enviado para conexões WebSocket do app-server. Quando um perfil Codex
do tipo assinatura é selecionado, o OpenClaw também mantém `CODEX_API_KEY` e `OPENAI_API_KEY`
fora do processo filho stdio do app-server iniciado e envia as credenciais selecionadas
por meio do RPC de login do app-server. Quando esse perfil de assinatura é bloqueado por um
limite de uso do Codex, o OpenClaw pode alternar para o próximo perfil de chave de API
`openai:*` ordenado sem alterar o modelo selecionado nem sair do harness
Codex. Depois que o horário de redefinição da assinatura passa, o perfil de assinatura
fica elegível novamente.

## Geração de imagens

O Plugin `openai` incluído registra a geração de imagens por meio da ferramenta `image_generate`.
Ele é compatível tanto com geração de imagens por chave de API da OpenAI quanto com geração de imagens por OAuth
Codex por meio da mesma ref. de modelo `openai/gpt-image-2`.

| Capacidade                | Chave de API OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref. de modelo                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticação                      | `OPENAI_API_KEY`                   | Login OAuth OpenAI Codex           |
| Transporte                 | API OpenAI Images                  | Backend Codex Responses              |
| Máximo de imagens por solicitação    | 4                                  | 4                                    |
| Modo de edição                 | Ativado (até 5 imagens de referência) | Ativado (até 5 imagens de referência)   |
| Substituições de tamanho            | Compatíveis, incluindo tamanhos 2K/4K   | Compatíveis, incluindo tamanhos 2K/4K     |
| Proporção / resolução | Não encaminhada para a API OpenAI Images | Mapeada para um tamanho compatível quando seguro |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consulte [Geração de Imagens](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

`gpt-image-2` é o padrão tanto para geração de texto para imagem da OpenAI quanto para edição de imagens.
`gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` continuam utilizáveis como
substituições explícitas de modelo. Use `openai/gpt-image-1.5` para saída
PNG/WebP com fundo transparente; a API atual `gpt-image-2` rejeita
`background: "transparent"`.

Para uma solicitação de fundo transparente, os agentes devem chamar `image_generate` com
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"` e
`background: "transparent"`; a opção mais antiga de provedor `openai.background`
ainda é aceita. O OpenClaw também protege as rotas públicas OAuth da OpenAI e do
OpenAI Codex reescrevendo solicitações transparentes padrão de `openai/gpt-image-2`
para `gpt-image-1.5`; endpoints Azure e personalizados compatíveis com OpenAI mantêm
seus nomes de implantação/modelo configurados.

A mesma configuração é exposta para execuções CLI sem interface:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Use as mesmas flags `--output-format` e `--background` com
`openclaw infer image edit` ao começar a partir de um arquivo de entrada.
`--openai-background` continua disponível como um alias específico da OpenAI.
Use `--quality low|medium|high|auto` quando precisar controlar a qualidade e o
custo do OpenAI Images. Use `--openai-moderation low|auto` para passar a dica de
moderação específica do provedor da OpenAI a partir de `image generate` ou `image edit`.

Para instalações OAuth do ChatGPT/Codex, mantenha a mesma ref `openai/gpt-image-2`. Quando um
perfil OAuth `openai` está configurado, o OpenClaw resolve esse token de acesso OAuth
armazenado e envia solicitações de imagem pelo backend Codex Responses. Ele
não tenta primeiro `OPENAI_API_KEY` nem recorre silenciosamente a uma chave de API para essa
solicitação. Configure `models.providers.openai` explicitamente com uma chave de API,
URL base personalizada ou endpoint Azure quando quiser usar a rota direta da API
OpenAI Images.
Se esse endpoint de imagem personalizado estiver em uma LAN/endereço privado confiável, também defina
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; o OpenClaw mantém
endpoints de imagem privados/internos compatíveis com OpenAI bloqueados, a menos que essa opção explícita
esteja presente.

Gerar:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Gerar um PNG transparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Geração de vídeo

O Plugin `openai` incluído registra a geração de vídeo por meio da ferramenta `video_generate`.

| Capacidade       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo padrão    | `openai/sora-2`                                                                   |
| Modos            | Texto para vídeo, imagem para vídeo, edição de vídeo único                        |
| Entradas de referência | 1 imagem ou 1 vídeo                                                          |
| Substituições de tamanho | Compatíveis com texto para vídeo e imagem para vídeo                    |
| Outras substituições  | `aspectRatio`, `resolution`, `audio`, `watermark` são ignorados com um aviso da ferramenta |

As solicitações de imagem para vídeo da OpenAI usam `POST /v1/videos` com um
`input_reference` de imagem. Edições de vídeo único usam `POST /v1/videos/edits` com o
vídeo carregado no campo `video`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Contribuição de prompt GPT-5

O OpenClaw adiciona uma contribuição de prompt GPT-5 compartilhada para execuções da família GPT-5 em superfícies de prompt montadas pelo OpenClaw. Ela se aplica pelo ID do modelo, portanto rotas OpenClaw/provedor como refs legadas pré-reparo (ref legada Codex GPT-5.5), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e outras refs GPT-5 compatíveis recebem a mesma sobreposição. Modelos GPT-4.x mais antigos não recebem.

O harness Codex nativo incluído não recebe essa sobreposição GPT-5 do OpenClaw por meio das instruções de desenvolvedor do app-server do Codex. O Codex nativo mantém o comportamento base, de modelo e de documentação de projeto pertencente ao Codex, enquanto o OpenClaw desabilita a personalidade integrada do Codex para threads nativas, para que os arquivos de personalidade do workspace do agente permaneçam autoritativos. O OpenClaw contribui apenas contexto de runtime, como entrega por canal, ferramentas dinâmicas do OpenClaw, delegação ACP, contexto de workspace e Skills do OpenClaw.

A contribuição GPT-5 adiciona um contrato de comportamento marcado para persistência de persona, segurança de execução, disciplina de ferramentas, formato de saída, verificações de conclusão e verificação em prompts correspondentes montados pelo OpenClaw. O comportamento de resposta específico do canal e de mensagem silenciosa permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A camada de estilo de interação amigável é separada e configurável.

| Valor                  | Efeito                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (padrão) | Habilita a camada de estilo de interação amigável |
| `"on"`                 | Alias para `"friendly"`                      |
| `"off"`                | Desabilita apenas a camada de estilo amigável       |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Os valores não diferenciam maiúsculas de minúsculas em runtime, então `"Off"` e `"off"` desabilitam a camada de estilo amigável.
</Tip>

<Note>
O legado `plugins.entries.openai.config.personality` ainda é lido como fallback de compatibilidade quando a configuração compartilhada `agents.defaults.promptOverlays.gpt5.personality` não está definida.
</Note>

## Voz e fala

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    O Plugin `openai` incluído registra síntese de fala para a superfície `messages.tts`.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Velocidade | `messages.tts.providers.openai.speed` | (não definido) |
    | Instruções | `messages.tts.providers.openai.instructions` | (não definido, apenas `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para arquivos |
    | Chave de API | `messages.tts.providers.openai.apiKey` | Recai para `OPENAI_API_KEY` |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corpo extra | `messages.tts.providers.openai.extraBody` / `extra_body` | (não definido) |

    Modelos disponíveis: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Vozes disponíveis: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` é mesclado no JSON da solicitação `/audio/speech` após os campos gerados pelo OpenClaw, portanto use-o para endpoints compatíveis com OpenAI que exigem chaves adicionais, como `lang`. Chaves de protótipo são ignoradas.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base de TTS sem afetar o endpoint da API de chat. OpenAI TTS e voz Realtime são ambos configurados por meio de uma chave de API da OpenAI Platform; instalações apenas com OAuth ainda podem usar modelos de chat apoiados pelo Codex, mas não retorno de fala ao vivo da OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    O Plugin `openai` incluído registra fala para texto em lote por meio da
    superfície de transcrição de compreensão de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: REST da OpenAI `/v1/audio/transcriptions`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível com o OpenClaw onde quer que a transcrição de áudio recebida use
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e anexos
      de áudio de canais

    Para forçar a OpenAI para transcrição de áudio recebido:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Dicas de idioma e prompt são encaminhadas para a OpenAI quando fornecidas pela
    configuração compartilhada de mídia de áudio ou por solicitação de transcrição por chamada.

  </Accordion>

  <Accordion title="Realtime transcription">
    O Plugin `openai` incluído registra transcrição Realtime para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (não definido) |
    | Prompt | `...openai.prompt` | (não definido) |
    | Duração do silêncio | `...openai.silenceDurationMs` | `800` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Autenticação | `...openai.apiKey`, `OPENAI_API_KEY` ou OAuth `openai` | Chaves de API conectam diretamente; OAuth emite um segredo de cliente de transcrição Realtime |

    <Note>
    Usa uma conexão WebSocket com `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Quando apenas OAuth `openai` está configurado, o Gateway emite um segredo efêmero de cliente de transcrição Realtime antes de abrir o WebSocket. Este provedor de streaming é para o caminho de transcrição Realtime do Voice Call; a voz do Discord atualmente grava segmentos curtos e usa o caminho de transcrição em lote `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    O Plugin `openai` incluído registra voz Realtime para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura (ponte de implantação Azure) | `...openai.temperature` | `0.8` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Preenchimento de prefixo | `...openai.prefixPaddingMs` | `300` |
    | Esforço de raciocínio | `...openai.reasoningEffort` | (não definido) |
    | Autenticação | Perfil de autenticação por chave de API `openai`, `...openai.apiKey` ou `OPENAI_API_KEY` | Chave de API da OpenAI Platform obrigatória; OAuth da OpenAI não configura voz Realtime |

    Vozes Realtime integradas disponíveis para `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    A OpenAI recomenda `marin` e `cedar` para a melhor qualidade Realtime. Este
    é um conjunto separado das vozes de texto para fala acima; não presuma que uma voz TTS
    como `fable`, `nova` ou `onyx` seja válida para sessões Realtime.

    <Note>
    Pontes realtime de backend da OpenAI usam o formato de sessão WebSocket Realtime GA, que não aceita `session.temperature`. Implantações Azure OpenAI continuam disponíveis via `azureEndpoint` e `azureDeployment` e mantêm o formato de sessão compatível com a implantação. Compatível com chamada bidirecional de ferramentas e áudio G.711 u-law.
    </Note>

    <Note>
    A voz Realtime é selecionada quando a sessão é criada. A OpenAI permite que a maioria
    dos campos da sessão mude posteriormente, mas a voz não pode ser alterada depois que o
    modelo emitiu áudio nessa sessão. O OpenClaw atualmente expõe os IDs
    de voz Realtime integrados como strings.
    </Note>

    <Note>
    O Control UI Talk usa sessões em tempo real no navegador da OpenAI com um
    segredo efêmero de cliente emitido pelo Gateway e uma troca direta de SDP
    WebRTC do navegador com a API Realtime da OpenAI. O Gateway emite esse
    segredo de cliente com o perfil de autenticação por chave de API `openai`
    selecionado ou com a chave de API configurada da Plataforma OpenAI. O relay
    do Gateway e as pontes WebSocket em tempo real do backend Voice Call usam o
    mesmo caminho de autenticação somente por chave de API para endpoints
    nativos da OpenAI. A verificação ao vivo por mantenedores está disponível com
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    as pernas da OpenAI verificam tanto a ponte WebSocket do backend quanto a
    troca SDP WebRTC do navegador sem registrar segredos em logs.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints Azure OpenAI

O provedor `openai` incluído pode apontar para um recurso Azure OpenAI para
geração de imagens ao sobrescrever a URL base. No caminho de geração de imagens,
o OpenClaw detecta nomes de host do Azure em `models.providers.openai.baseUrl` e
muda automaticamente para o formato de requisição do Azure.

<Note>
A voz em tempo real usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Veja o acordeão **Voz em
tempo real** em [Voz e fala](#voice-and-speech) para suas configurações do Azure.
</Note>

Use Azure OpenAI quando:

- Você já tem uma assinatura, cota ou contrato empresarial do Azure OpenAI
- Você precisa de residência regional de dados ou controles de conformidade fornecidos pelo Azure
- Você quer manter o tráfego dentro de uma tenancy existente do Azure

### Configuração

Para geração de imagens no Azure pelo provedor `openai` incluído, aponte
`models.providers.openai.baseUrl` para seu recurso Azure e defina `apiKey` como
a chave do Azure OpenAI (não uma chave da Plataforma OpenAI):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

O OpenClaw reconhece estes sufixos de host do Azure para a rota de geração de
imagens no Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para requisições de geração de imagens em um host Azure reconhecido, o OpenClaw:

- Envia o cabeçalho `api-key` em vez de `Authorization: Bearer`
- Usa caminhos com escopo de implantação (`/openai/deployments/{deployment}/...`)
- Acrescenta `?api-version=...` a cada requisição
- Usa um tempo limite padrão de requisição de 600s para chamadas de geração de imagens no Azure.
  Valores `timeoutMs` por chamada ainda substituem esse padrão.

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o
formato padrão de requisição de imagem da OpenAI.

<Note>
O roteamento do Azure para o caminho de geração de imagens do provedor `openai`
requer OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` customizada como o endpoint público da OpenAI e falharão com
implantações de imagem do Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão preview ou GA específica
do Azure para o caminho de geração de imagens no Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Nomes de modelo são nomes de implantação

O Azure OpenAI vincula modelos a implantações. Para requisições de geração de
imagens no Azure roteadas pelo provedor `openai` incluído, o campo `model` no
OpenClaw deve ser o **nome da implantação do Azure** que você configurou no
portal do Azure, não o id público do modelo da OpenAI.

Se você criar uma implantação chamada `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

A mesma regra de nome de implantação se aplica a chamadas de geração de imagens
roteadas pelo provedor `openai` incluído.

### Disponibilidade regional

A geração de imagens no Azure está disponível atualmente apenas em um subconjunto
de regiões (por exemplo, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Verifique a lista atual de regiões da Microsoft antes de criar uma
implantação e confirme que o modelo específico é oferecido na sua região.

### Diferenças de parâmetros

Azure OpenAI e OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções que a OpenAI pública permite (por exemplo, certos
valores de `background` em `gpt-image-2`) ou expô-las somente em versões
específicas de modelo. Essas diferenças vêm do Azure e do modelo subjacente, não
do OpenClaw. Se uma requisição ao Azure falhar com um erro de validação, verifique
o conjunto de parâmetros compatível com sua implantação e versão de API
específicas no portal do Azure.

<Note>
O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não
recebe os cabeçalhos ocultos de atribuição do OpenClaw — veja o acordeão
**Rotas nativas vs compatíveis com OpenAI** em [Configuração avançada](#advanced-configuration).

Para tráfego de chat ou Responses no Azure (além de geração de imagens), use o
fluxo de onboarding ou uma configuração dedicada de provedor Azure — apenas
`openai.baseUrl` não adota o formato de API/autenticação do Azure. Existe um
provedor separado `azure-openai-responses/*`; veja o acordeão de Compaction no
lado do servidor abaixo.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) para `openai/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de cair para SSE
    - Após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o resfriamento
    - Anexa cabeçalhos estáveis de sessão e identidade de turno para novas tentativas e reconexões
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamento |
    |-------|----------|
    | `"auto"` (padrão) | WebSocket primeiro, fallback para SSE |
    | `"sse"` | Forçar somente SSE |
    | `"websocket"` | Forçar somente WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentação relacionada da OpenAI:
    - [API Realtime com WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respostas da API em streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Modo rápido">
    O OpenClaw expõe uma alternância compartilhada de modo rápido para `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Configuração:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando ativado, o OpenClaw mapeia o modo rápido para o processamento prioritário da OpenAI (`service_tier = "priority"`). Valores existentes de `service_tier` são preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`. `fastMode: "auto"` inicia novas chamadas de modelo em modo rápido até o corte automático, depois inicia chamadas posteriores de nova tentativa, fallback, resultado de ferramenta ou continuação sem modo rápido. O corte tem padrão de 60 segundos; defina `params.fastAutoOnSeconds` no modelo ativo para alterá-lo.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Substituições de sessão prevalecem sobre a configuração. Limpar a substituição de sessão na UI de Sessões retorna a sessão ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritário (service_tier)">
    A API da OpenAI expõe processamento prioritário via `service_tier`. Defina-o por modelo no OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores compatíveis: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` é encaminhado somente para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você rotear qualquer provedor por um proxy, o OpenClaw deixa `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no lado do servidor (API Responses)">
    Para modelos diretos OpenAI Responses (`openai/*` em `api.openai.com`), o wrapper de stream OpenClaw do Plugin OpenAI ativa automaticamente Compaction no lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    Isso se aplica ao caminho de runtime integrado do OpenClaw e aos hooks do provedor OpenAI usados por execuções incorporadas. O harness nativo do servidor de aplicativo Codex gerencia seu próprio contexto pelo Codex e é configurado pela rota padrão de agente da OpenAI ou pela política de runtime de provedor/modelo.

    <Tabs>
      <Tab title="Ativar explicitamente">
        Útil para endpoints compatíveis, como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Limite customizado">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Desativar">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` controla apenas a injeção de `context_management`. Modelos diretos OpenAI Responses ainda forçam `store: true`, a menos que a compatibilidade defina `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agente estrito">
    Para execuções da família GPT-5 em `openai/*`, o OpenClaw pode usar um contrato de execução incorporada mais estrito:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Com `strict-agentic`, o OpenClaw:
    - Ativa automaticamente `update_plan` para trabalhos substanciais
    - Tenta novamente turnos estruturalmente vazios ou somente com raciocínio com uma continuação de resposta visível
    - Usa eventos explícitos de plano do harness quando o harness selecionado os fornece

    O OpenClaw não classifica a prosa do assistente para decidir se um turno é um plano, uma atualização de progresso ou uma resposta final.

    <Note>
    Escopo limitado somente a execuções da família GPT-5 da OpenAI e do Codex. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, Codex e Azure OpenAI de forma diferente de proxies `/v1` genéricos compatíveis com OpenAI:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` somente para modelos compatíveis com o esforço `none` da OpenAI
    - Omitem raciocínio desativado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Definem esquemas de ferramentas como modo estrito por padrão
    - Anexam cabeçalhos ocultos de atribuição apenas em hosts nativos verificados
    - Mantêm o formato de requisição exclusivo da OpenAI (`service_tier`, `store`, compatibilidade de raciocínio, dicas de cache de prompt)

    **Rotas proxy/compatíveis:**
    - Use comportamento de compatibilidade mais flexível
    - Remova `store` de Completions de cargas `openai-completions` não nativas
    - Aceite JSON de repasse avançado de `params.extra_body`/`params.extraBody` para proxies de Completions compatíveis com OpenAI
    - Aceite `params.chat_template_kwargs` para proxies de Completions compatíveis com OpenAI, como vLLM
    - Não force esquemas de ferramentas estritos nem cabeçalhos apenas nativos

    Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe os cabeçalhos de atribuição ocultos.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados de ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados de ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
