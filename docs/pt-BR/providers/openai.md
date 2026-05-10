---
read_when:
    - Você quer usar modelos da OpenAI no OpenClaw
    - Você quer autenticação por assinatura do Codex em vez de chaves de API
    - Você precisa de um comportamento mais rigoroso de execução de agentes GPT-5
summary: Use a OpenAI por meio de chaves de API ou assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-10T19:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5022874c9517e670b70ba90fb400f99f850746c341cb6e967c2abc96d8255548
    source_path: providers/openai.md
    workflow: 16
---

A OpenAI fornece APIs para desenvolvedores para modelos GPT, e o Codex também está disponível como um agente de codificação de plano ChatGPT por meio dos clientes Codex da OpenAI. O OpenClaw mantém essas superfícies separadas para que a configuração permaneça previsível.

O OpenClaw usa `openai/*` como a rota canônica de modelos OpenAI. Turnos de agente incorporados em modelos OpenAI são executados pelo runtime app-server nativo do Codex por padrão; a autenticação direta por chave de API da OpenAI continua disponível para superfícies OpenAI que não são de agente, como imagens, embeddings, fala e realtime.

- **Modelos de agente** - modelos `openai/*` pelo runtime Codex; entre com a autenticação `openai-codex` para uso de assinatura ChatGPT/Codex, ou configure um perfil de chave de API `openai-codex` quando você quiser intencionalmente autenticação por chave de API.
- **APIs OpenAI que não são de agente** - acesso direto à OpenAI Platform com cobrança baseada em uso por meio de `OPENAI_API_KEY` ou onboarding de chave de API da OpenAI.
- **Configuração legada** - refs de modelo `openai-codex/*` são reparadas por `openclaw doctor --fix` para `openai/*` mais o runtime Codex.

A OpenAI oferece suporte explícito ao uso de OAuth de assinatura em ferramentas e fluxos de trabalho externos como o OpenClaw.

Provider, modelo, runtime e canal são camadas separadas. Se esses rótulos estiverem sendo misturados, leia [Runtimes de agente](/pt-BR/concepts/agent-runtimes) antes de alterar a configuração.

## Escolha rápida

| Objetivo                                             | Use                                                     | Observações                                                           |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Assinatura ChatGPT/Codex com runtime Codex nativo    | `openai/gpt-5.5`                                        | Configuração padrão de agente OpenAI. Entre com a autenticação `openai-codex`. |
| Cobrança direta por chave de API para modelos de agente | `openai/gpt-5.5` mais um perfil de chave de API `openai-codex` | Use `auth.order.openai-codex` para preferir esse perfil.              |
| Cobrança direta por chave de API por meio de PI explícito | `openai/gpt-5.5` mais runtime provider/model `pi`       | Selecione um perfil normal de chave de API `openai`.                  |
| Alias mais recente da API ChatGPT Instant            | `openai/chat-latest`                                    | Somente chave de API direta. Alias móvel para experimentos, não o padrão. |
| Autenticação de assinatura ChatGPT/Codex por meio de PI explícito | `openai/gpt-5.5` mais runtime provider/model `pi`       | Selecione um perfil de autenticação `openai-codex` para a rota de compatibilidade. |
| Geração ou edição de imagens                         | `openai/gpt-image-2`                                    | Funciona com `OPENAI_API_KEY` ou OpenAI Codex OAuth.                  |
| Imagens com fundo transparente                       | `openai/gpt-image-1.5`                                  | Use `outputFormat=png` ou `webp` e `openai.background=transparent`.   |

## Mapa de nomes

Os nomes são semelhantes, mas não são intercambiáveis:

| Nome que você vê                         | Camada              | Significado                                                                                      |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefixo do provider | Rota canônica de modelos OpenAI; turnos de agente usam o runtime Codex.                           |
| `openai-codex`                          | Prefixo de autenticação/perfil | Provedor de perfil de autenticação OAuth/assinatura OpenAI Codex.                                 |
| Plugin `codex`                          | Plugin              | Plugin incluído do OpenClaw que fornece o runtime app-server nativo do Codex e controles de chat `/codex`. |
| provider/model `agentRuntime.id: codex` | Runtime de agente   | Força o harness app-server nativo do Codex para turnos incorporados correspondentes.              |
| `/codex ...`                            | Conjunto de comandos de chat | Vincula/controla threads app-server do Codex a partir de uma conversa.                            |
| `runtime: "acp", agentId: "codex"`      | Rota de sessão ACP  | Caminho de fallback explícito que executa o Codex por meio de ACP/acpx.                           |

Isso significa que uma configuração pode conter intencionalmente refs de modelo `openai/*` e perfis de autenticação `openai-codex`. `openclaw doctor --fix` reescreve refs de modelo legadas `openai-codex/*` para a rota canônica de modelos OpenAI.

<Note>
GPT-5.5 está disponível tanto por acesso direto com chave de API da OpenAI Platform quanto por rotas de assinatura/OAuth. Para assinatura ChatGPT/Codex com execução Codex nativa, use `openai/gpt-5.5`; uma configuração de runtime não definida agora seleciona o harness Codex para turnos de agente OpenAI. Use perfis de chave de API da OpenAI somente quando quiser autenticação direta por chave de API para um modelo de agente OpenAI.
</Note>

<Note>
Turnos de modelo de agente OpenAI exigem o Plugin app-server Codex incluído. A configuração explícita de runtime PI permanece disponível como uma rota de compatibilidade opcional. Quando PI é selecionado explicitamente com um perfil de autenticação `openai-codex`, o OpenClaw mantém a ref de modelo pública como `openai/*` e roteia PI internamente pelo transporte legado de autenticação Codex. Execute `openclaw doctor --fix` para reparar refs de modelo `openai-codex/*` obsoletas ou pins antigos de sessão PI que não vêm de configuração explícita de runtime.
</Note>

## Cobertura de recursos do OpenClaw

| Capacidade OpenAI        | Superfície OpenClaw                                                              | Status                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Provider de modelo `openai/<model>`                                              | Sim                                                    |
| Modelos de assinatura Codex | `openai/<model>` com OAuth `openai-codex`                                      | Sim                                                    |
| Refs de modelo Codex legadas | `openai-codex/<model>`                                                        | Reparadas pelo doctor para `openai/<model>`            |
| Harness app-server Codex  | `openai/<model>` com runtime omitido ou provider/model `agentRuntime.id: codex`  | Sim                                                    |
| Pesquisa na web do lado do servidor | Ferramenta nativa OpenAI Responses                                      | Sim, quando a pesquisa na web está habilitada e nenhum provider está fixado |
| Imagens                   | `image_generate`                                                                 | Sim                                                    |
| Vídeos                    | `video_generate`                                                                 | Sim                                                    |
| Texto para fala           | `messages.tts.provider: "openai"` / `tts`                                        | Sim                                                    |
| Fala para texto em lote   | `tools.media.audio` / entendimento de mídia                                      | Sim                                                    |
| Fala para texto por streaming | Voice Call `streaming.provider: "openai"`                                    | Sim                                                    |
| Voz realtime              | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Sim                                                    |
| Embeddings                | provider de embeddings de memória                                                | Sim                                                    |

## Embeddings de memória

O OpenClaw pode usar a OpenAI, ou um endpoint de embeddings compatível com OpenAI, para indexação `memory_search` e embeddings de consulta:

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

Para endpoints compatíveis com OpenAI que exigem rótulos de embeddings assimétricos, defina `queryInputType` e `documentInputType` em `memorySearch`. O OpenClaw os encaminha como campos de solicitação `input_type` específicos do provider: embeddings de consulta usam `queryInputType`; trechos de memória indexados e indexação em lote usam `documentInputType`. Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config#provider-specific-config) para o exemplo completo.

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API (OpenAI Platform)">
    **Ideal para:** acesso direto à API e cobrança baseada em uso.

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

    ### Resumo da rota

    | Ref de modelo          | Configuração de runtime    | Rota                        | Autenticação     |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omitido / provider/model `agentRuntime.id: "codex"` | Harness app-server Codex | perfil `openai-codex` |
    | `openai/gpt-5.4-mini` | omitido / provider/model `agentRuntime.id: "codex"` | Harness app-server Codex | perfil `openai-codex` |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "pi"`              | Runtime incorporado PI   | perfil `openai` ou perfil `openai-codex` selecionado |

    <Note>
    Modelos de agente `openai/*` usam o harness app-server Codex. Para usar autenticação por chave de API para um modelo de agente, crie um perfil de chave de API `openai-codex` e ordene-o com `auth.order.openai-codex`; `OPENAI_API_KEY` permanece o fallback direto para superfícies de API OpenAI que não são de agente.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Para experimentar o modelo Instant atual do ChatGPT pela API OpenAI, defina o modelo como `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` é um alias móvel. A OpenAI o documenta como o modelo Instant mais recente usado no ChatGPT e recomenda `gpt-5.5` para uso da API em produção, portanto mantenha `openai/gpt-5.5` como padrão estável, a menos que você queira explicitamente esse comportamento de alias. Atualmente, o alias aceita somente verbosidade de texto `medium`, então o OpenClaw normaliza substituições incompatíveis de verbosidade de texto OpenAI para esse modelo.

    <Warning>
    O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark`. Solicitações live da API OpenAI rejeitam esse modelo, e o catálogo Codex atual também não o expõe.
    </Warning>

  </Tab>

  <Tab title="Assinatura Codex">
    **Ideal para:** usar sua assinatura ChatGPT/Codex com execução app-server Codex nativa em vez de uma chave de API separada. O Codex cloud exige login no ChatGPT.

    <Steps>
      <Step title="Execute o OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configurações headless ou hostis a callback, adicione `--device-code` para entrar com um fluxo de código de dispositivo do ChatGPT em vez do callback do navegador localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Nenhuma configuração de runtime é necessária para o caminho padrão. As rodadas de agente da OpenAI
        selecionam automaticamente o runtime nativo do app-server do Codex, e o OpenClaw
        instala ou repara o Plugin Codex integrado quando essa rota é escolhida.
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Depois que o Gateway estiver em execução, envie `/codex status` ou `/codex models`
        no chat para verificar o runtime nativo do app-server.
      </Step>
    </Steps>

    ### Resumo da rota

    | Referência do modelo | Configuração de runtime | Rota | Autenticação |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omitido / provider/model `agentRuntime.id: "codex"` | Harness nativo do app-server do Codex | Login do Codex ou perfil `openai-codex` selecionado |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | Runtime integrado PI com transporte interno de autenticação do Codex | Perfil `openai-codex` selecionado |
    | `openai-codex/gpt-5.5` | reparado pelo doctor | Rota legada reescrita para `openai/gpt-5.5` | Perfil `openai-codex` existente |

    <Warning>
    Não configure referências de modelo `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ou
    `openai-codex/gpt-5.3*` mais antigas. Contas OAuth do ChatGPT/Codex agora rejeitam
    esses modelos. Use `openai/gpt-5.5`; as rodadas de agente da OpenAI agora selecionam o runtime Codex
    por padrão.
    </Warning>

    <Note>
    Continue usando o ID de provider `openai-codex` para comandos de autenticação/perfil. O
    prefixo de modelo `openai-codex/*` é uma configuração legada reparada pelo doctor. Para a
    configuração comum com assinatura mais runtime nativo, entre com `openai-codex`,
    mas mantenha a referência do modelo como `openai/gpt-5.5`.
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

    <Note>
    O onboarding não importa mais material OAuth de `~/.codex`. Entre com OAuth pelo navegador (padrão) ou pelo fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de autenticação de agentes.
    </Note>

    ### Verificar e recuperar o roteamento OAuth do Codex

    Use estes comandos para ver qual modelo, runtime e rota de autenticação seu agente
    padrão está usando:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Para um agente específico, adicione `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Se uma configuração mais antiga ainda tiver `openai-codex/gpt-*` ou um pin de sessão PI
    obsoleto da OpenAI sem configuração explícita de runtime, repare-a:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Se `models auth list --provider openai-codex` não mostrar nenhum perfil utilizável, entre
    novamente:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` continua sendo o ID de provider de autenticação/perfil. `openai/*` é a
    rota de modelo para rodadas de agente da OpenAI pelo Codex.

    ### Indicador de status

    O `/status` do chat mostra qual runtime de modelo está ativo para a sessão atual.
    O harness integrado do app-server do Codex aparece como `Runtime: OpenAI Codex` para
    rodadas de modelo de agente da OpenAI. Pins de sessão PI obsoletos são reparados para Codex, a menos que
    a configuração fixe explicitamente PI.

    ### Aviso do doctor

    Se rotas `openai-codex/*` ou pins PI obsoletos da OpenAI permanecerem na configuração ou no
    estado da sessão, `openclaw doctor --fix` os reescreve para `openai/*` com o
    runtime Codex, a menos que PI esteja configurado explicitamente.

    ### Limite da janela de contexto

    O OpenClaw trata os metadados do modelo e o limite de contexto do runtime como valores separados.

    Para `openai/gpt-5.5` pelo catálogo OAuth do Codex:

    - `contextWindow` nativo: `1000000`
    - Limite padrão de `contextTokens` do runtime: `272000`

    O limite padrão menor tem melhores características de latência e qualidade na prática. Sobrescreva-o com `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
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

    OpenClaw usa metadados de catálogo do Codex upstream para `gpt-5.5` quando eles estão
    presentes. Se a descoberta ao vivo do Codex omitir a linha `gpt-5.5` enquanto
    a conta estiver autenticada, OpenClaw sintetiza essa linha de modelo OAuth para que
    execuções de cron, subagente e modelo padrão configurado não falhem com
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticação nativa do servidor de app Codex

O harness nativo do servidor de app Codex usa refs de modelo `openai/*` mais configuração
de runtime omitida ou provider/model `agentRuntime.id: "codex"`, mas sua autenticação ainda é
baseada em conta. OpenClaw
seleciona a autenticação nesta ordem:

1. Um perfil de autenticação OpenClaw `openai-codex` explícito vinculado ao agente.
2. A conta existente do servidor de app, como um login local do Codex CLI ChatGPT.
3. Somente para inicializações locais do servidor de app stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando o servidor de app informa que não há conta e ainda exige
   autenticação OpenAI.

Isso significa que um login local de assinatura ChatGPT/Codex não é substituído apenas
porque o processo de Gateway também tem `OPENAI_API_KEY` para modelos OpenAI diretos
ou embeddings. O fallback de chave de API em env é apenas o caminho local stdio sem conta; ele
não é enviado para conexões WebSocket do servidor de app. Quando um perfil Codex
no estilo assinatura é selecionado, OpenClaw também mantém `CODEX_API_KEY` e `OPENAI_API_KEY`
fora do processo filho stdio do servidor de app gerado e envia as credenciais selecionadas
por meio do RPC de login do servidor de app.

## Geração de imagens

O plugin `openai` incluído registra a geração de imagens por meio da ferramenta `image_generate`.
Ele oferece suporte tanto à geração de imagens com chave de API OpenAI quanto à geração de imagens
com OAuth do Codex por meio da mesma ref de modelo `openai/gpt-image-2`.

| Capacidade                 | Chave de API OpenAI                    | OAuth do Codex                         |
| -------------------------- | -------------------------------------- | -------------------------------------- |
| Ref de modelo              | `openai/gpt-image-2`                   | `openai/gpt-image-2`                   |
| Autenticação               | `OPENAI_API_KEY`                       | Login OAuth do OpenAI Codex            |
| Transporte                 | API OpenAI Images                      | Backend Codex Responses                |
| Máx. de imagens por solicitação | 4                                  | 4                                      |
| Modo de edição             | Ativado (até 5 imagens de referência)  | Ativado (até 5 imagens de referência)  |
| Substituições de tamanho   | Compatíveis, incluindo tamanhos 2K/4K  | Compatíveis, incluindo tamanhos 2K/4K  |
| Proporção / resolução      | Não encaminhado para a API OpenAI Images | Mapeado para um tamanho compatível quando seguro |

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
PNG/WebP com fundo transparente; a API `gpt-image-2` atual rejeita
`background: "transparent"`.

Para uma solicitação com fundo transparente, os agentes devem chamar `image_generate` com
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"`, e
`background: "transparent"`; a opção de provedor `openai.background` mais antiga
ainda é aceita. OpenClaw também protege as rotas públicas OpenAI e
OAuth do OpenAI Codex reescrevendo solicitações transparentes padrão `openai/gpt-image-2`
para `gpt-image-1.5`; endpoints Azure e personalizados compatíveis com OpenAI mantêm
seus nomes de implantação/modelo configurados.

A mesma configuração é exposta para execuções de CLI sem interface:

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

Para instalações OAuth do Codex, mantenha a mesma ref `openai/gpt-image-2`. Quando um
perfil OAuth `openai-codex` está configurado, OpenClaw resolve esse token de acesso OAuth
armazenado e envia solicitações de imagem pelo backend Codex Responses. Ele
não tenta primeiro `OPENAI_API_KEY` nem faz fallback silencioso para uma chave de API para essa
solicitação. Configure `models.providers.openai` explicitamente com uma chave de API,
URL base personalizada ou endpoint Azure quando quiser a rota direta da API OpenAI Images.
Se esse endpoint de imagem personalizado estiver em um endereço LAN/privado confiável, defina também
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantém
endpoints de imagem privados/internos compatíveis com OpenAI bloqueados, a menos que essa adesão
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

O plugin `openai` incluído registra a geração de vídeo por meio da ferramenta `video_generate`.

| Capacidade         | Valor                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Modelo padrão      | `openai/sora-2`                                                                   |
| Modos              | Texto para vídeo, imagem para vídeo, edição de vídeo único                        |
| Entradas de referência | 1 imagem ou 1 vídeo                                                           |
| Substituições de tamanho | Compatíveis                                                                 |
| Outras substituições | `aspectRatio`, `resolution`, `audio`, `watermark` são ignorados com um aviso da ferramenta |

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
Consulte [Geração de Vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Contribuição de prompt GPT-5

OpenClaw adiciona uma contribuição de prompt GPT-5 compartilhada para execuções da família GPT-5 entre provedores. Ela se aplica por id de modelo, portanto `openai/gpt-5.5`, refs legadas pré-reparo como `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e outras refs GPT-5 compatíveis recebem a mesma sobreposição. Modelos GPT-4.x mais antigos não recebem.

O harness nativo do Codex incluído usa o mesmo comportamento GPT-5 e a sobreposição de Heartbeat por meio de instruções de desenvolvedor do servidor de app Codex, portanto sessões `openai/gpt-5.x` roteadas pelo Codex mantêm a mesma orientação de acompanhamento e Heartbeat proativo, embora o Codex controle o restante do prompt do harness.

A contribuição do GPT-5 adiciona um contrato de comportamento etiquetado para persistência de persona, segurança da execução, disciplina de ferramentas, formato da saída, verificações de conclusão e verificação. O comportamento de resposta específico do canal e de mensagens silenciosas permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A orientação do GPT-5 está sempre habilitada para modelos correspondentes. A camada de estilo de interação amigável é separada e configurável.

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
Os valores não diferenciam maiúsculas de minúsculas em tempo de execução, então `"Off"` e `"off"` desabilitam a camada de estilo amigável.
</Tip>

<Note>
O `plugins.entries.openai.config.personality` legado ainda é lido como fallback de compatibilidade quando a configuração compartilhada `agents.defaults.promptOverlays.gpt5.personality` não está definida.
</Note>

## Voz e fala

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    O Plugin `openai` incluído registra síntese de fala para a superfície `messages.tts`.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidade | `messages.tts.providers.openai.speed` | (não definido) |
    | Instruções | `messages.tts.providers.openai.instructions` | (não definido, apenas `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para arquivos |
    | Chave de API | `messages.tts.providers.openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corpo extra | `messages.tts.providers.openai.extraBody` / `extra_body` | (não definido) |

    Modelos disponíveis: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Vozes disponíveis: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` é mesclado ao JSON da solicitação `/audio/speech` após os campos gerados pelo OpenClaw, então use-o para endpoints compatíveis com OpenAI que exigem chaves adicionais, como `lang`. Chaves de protótipo são ignoradas.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base de TTS sem afetar o endpoint da API de chat. O TTS da OpenAI ainda é configurado por meio de uma chave de API; para resposta por fala ao vivo somente com OAuth, use o caminho de voz Realtime em vez de fala STT -> TTS em modo de agente.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    O Plugin `openai` incluído registra conversão de fala em texto em lote pela
    superfície de transcrição de entendimento de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível no OpenClaw em todos os lugares onde a transcrição de áudio de entrada usa
      `tools.media.audio`, incluindo segmentos de canais de voz do Discord e anexos
      de áudio de canais

    Para forçar OpenAI para transcrição de áudio de entrada:

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
    configuração compartilhada de mídia de áudio ou pela solicitação de transcrição por chamada.

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
    | Autenticação | `...openai.apiKey`, `OPENAI_API_KEY` ou OAuth `openai-codex` | Chaves de API conectam diretamente; OAuth emite um segredo de cliente de transcrição Realtime |

    <Note>
    Usa uma conexão WebSocket para `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Quando apenas OAuth `openai-codex` está configurado, o Gateway emite um segredo de cliente efêmero de transcrição Realtime antes de abrir o WebSocket. Esse provedor de streaming é para o caminho de transcrição Realtime do Voice Call; a voz do Discord atualmente grava segmentos curtos e usa o caminho de transcrição em lote `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    O Plugin `openai` incluído registra voz Realtime para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura (ponte de implantação do Azure) | `...openai.temperature` | `0.8` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Preenchimento de prefixo | `...openai.prefixPaddingMs` | `300` |
    | Esforço de raciocínio | `...openai.reasoningEffort` | (não definido) |
    | Autenticação | `...openai.apiKey`, `OPENAI_API_KEY` ou OAuth `openai-codex` | O Browser Talk e pontes de backend que não são Azure podem usar OAuth do Codex |

    Vozes Realtime internas disponíveis para `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    A OpenAI recomenda `marin` e `cedar` para a melhor qualidade Realtime. Este
    é um conjunto separado das vozes de Text-to-speech acima; não presuma que uma voz de TTS
    como `fable`, `nova` ou `onyx` seja válida para sessões Realtime.

    <Note>
    Pontes Realtime de backend da OpenAI usam o formato de sessão WebSocket Realtime GA, que não aceita `session.temperature`. Implantações do Azure OpenAI permanecem disponíveis via `azureEndpoint` e `azureDeployment` e mantêm o formato de sessão compatível com a implantação. Oferece suporte a chamadas de ferramentas bidirecionais e áudio G.711 u-law.
    </Note>

    <Note>
    A voz Realtime é selecionada quando a sessão é criada. A OpenAI permite que a maioria dos
    campos da sessão mude depois, mas a voz não pode ser alterada depois que o
    modelo tiver emitido áudio nessa sessão. O OpenClaw atualmente expõe os
    ids das vozes Realtime internas como strings.
    </Note>

    <Note>
    O Control UI Talk usa sessões Realtime de navegador da OpenAI com um segredo
    de cliente efêmero emitido pelo Gateway e uma troca direta de SDP WebRTC do navegador contra a
    API Realtime da OpenAI. Quando nenhuma chave direta de API da OpenAI está configurada, o
    Gateway pode emitir esse segredo de cliente com o perfil OAuth `openai-codex`
    selecionado. O relay do Gateway e as pontes WebSocket Realtime de backend do Voice Call usam
    o mesmo fallback OAuth para endpoints nativos da OpenAI. A verificação ao vivo por mantenedores
    está disponível com
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    as etapas da OpenAI verificam tanto a ponte WebSocket de backend quanto a troca
    SDP WebRTC do navegador sem registrar segredos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints do Azure OpenAI

O provedor `openai` incluído pode apontar para um recurso Azure OpenAI para geração
de imagens ao substituir a URL base. No caminho de geração de imagens, o OpenClaw
detecta hostnames do Azure em `models.providers.openai.baseUrl` e muda para
o formato de solicitação do Azure automaticamente.

<Note>
A voz Realtime usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Consulte o acordeão **Realtime
voice** em [Voz e fala](#voice-and-speech) para suas configurações do Azure.
</Note>

Use Azure OpenAI quando:

- Você já tem uma assinatura, cota ou acordo empresarial do Azure OpenAI
- Você precisa de residência regional de dados ou controles de conformidade que o Azure fornece
- Você quer manter o tráfego dentro de uma locação existente do Azure

### Configuração

Para geração de imagens no Azure pelo provedor `openai` incluído, aponte
`models.providers.openai.baseUrl` para o seu recurso do Azure e defina `apiKey` como
a chave do Azure OpenAI (não uma chave da OpenAI Platform):

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

O OpenClaw reconhece estes sufixos de host do Azure para a rota de geração de imagens
do Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitações de geração de imagens em um host reconhecido do Azure, o OpenClaw:

- Envia o cabeçalho `api-key` em vez de `Authorization: Bearer`
- Usa caminhos com escopo de implantação (`/openai/deployments/{deployment}/...`)
- Acrescenta `?api-version=...` a cada solicitação
- Usa um tempo limite padrão de 600 s para chamadas de geração de imagens do Azure.
  Valores `timeoutMs` por chamada ainda substituem esse padrão.

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato
padrão de solicitação de imagens da OpenAI.

<Note>
O roteamento do Azure para o caminho de geração de imagens do provedor `openai` exige
OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizado como o endpoint público da OpenAI e falharão contra implantações de imagem
do Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão específica de preview ou GA do Azure
para o caminho de geração de imagens do Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Nomes de modelo são nomes de implantação

O Azure OpenAI vincula modelos a implantações. Para solicitações de geração de imagens do Azure
roteadas pelo provedor `openai` incluído, o campo `model` no OpenClaw
deve ser o **nome da implantação do Azure** que você configurou no portal do Azure, não
o id público do modelo OpenAI.

Se você criar uma implantação chamada `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

A mesma regra de nome de implantação se aplica a chamadas de geração de imagens roteadas pelo
provedor `openai` incluído.

### Disponibilidade regional

A geração de imagens do Azure está atualmente disponível apenas em um subconjunto de regiões
(por exemplo, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Verifique a lista atual de regiões da Microsoft antes de criar uma
implantação e confirme que o modelo específico é oferecido na sua região.

### Diferenças de parâmetros

Azure OpenAI e OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções que a OpenAI pública permite (por exemplo, certos
valores de `background` em `gpt-image-2`) ou expô-las apenas em versões específicas de modelo.
Essas diferenças vêm do Azure e do modelo subjacente, não do
OpenClaw. Se uma solicitação do Azure falhar com um erro de validação, verifique o
conjunto de parâmetros compatível com sua implantação e versão de API específicas no
portal do Azure.

<Note>
O Azure OpenAI usa transporte nativo e comportamento compatível, mas não recebe
os cabeçalhos ocultos de atribuição do OpenClaw — consulte o acordeão **Rotas nativas vs compatíveis com OpenAI**
em [Configuração avançada](#advanced-configuration).

Para tráfego de chat ou Responses no Azure (além da geração de imagens), use o
fluxo de onboarding ou uma configuração dedicada de provedor Azure — apenas `openai.baseUrl`
não aplica o formato de API/autenticação do Azure. Existe um provedor separado
`azure-openai-responses/*`; consulte
o acordeão Compaction no lado do servidor abaixo.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro, com fallback para SSE (`"auto"`), para `openai/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de fazer fallback para SSE
    - Após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o período de resfriamento
    - Anexa cabeçalhos estáveis de identidade da sessão e do turno para novas tentativas e reconexões
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
    - [Realtime API com WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respostas da API com streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Modo rápido">
    O OpenClaw expõe uma alternância compartilhada de modo rápido para `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuração:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando ativado, o OpenClaw mapeia o modo rápido para processamento prioritário da OpenAI (`service_tier = "priority"`). Valores existentes de `service_tier` são preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Substituições de sessão prevalecem sobre a configuração. Limpar a substituição de sessão na UI Sessions retorna a sessão ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritário (service_tier)">
    A API da OpenAI expõe processamento prioritário por meio de `service_tier`. Defina-o por modelo no OpenClaw:

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
    `serviceTier` só é encaminhado para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você rotear qualquer um dos provedores por meio de um proxy, o OpenClaw deixa `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no lado do servidor (Responses API)">
    Para modelos OpenAI Responses diretos (`openai/*` em `api.openai.com`), o wrapper de fluxo Pi-harness do Plugin OpenAI ativa automaticamente a Compaction no lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    Isso se aplica ao caminho Pi harness integrado e aos hooks de provedor OpenAI usados por execuções incorporadas. O harness nativo de servidor de aplicativo Codex gerencia seu próprio contexto por meio do Codex e é configurado pela rota de agente padrão da OpenAI ou pela política de runtime de provedor/modelo.

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
      <Tab title="Limite personalizado">
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
    `responsesServerCompaction` controla apenas a injeção de `context_management`. Modelos OpenAI Responses diretos ainda forçam `store: true`, a menos que a compatibilidade defina `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT strict-agentic">
    Para execuções da família GPT-5 em `openai/*`, o OpenClaw pode usar um contrato de execução incorporado mais rígido:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Com `strict-agentic`, o OpenClaw:
    - Não trata mais um turno apenas de plano como progresso bem-sucedido quando uma ação de ferramenta está disponível
    - Tenta novamente o turno com um direcionamento para agir agora
    - Ativa automaticamente `update_plan` para trabalho substancial
    - Expõe um estado bloqueado explícito se o modelo continuar planejando sem agir

    <Note>
    Limitado apenas a execuções da família GPT-5 da OpenAI e do Codex. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, do Codex e do Azure OpenAI de forma diferente de proxies `/v1` genéricos compatíveis com OpenAI:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` apenas para modelos que oferecem suporte ao esforço `none` da OpenAI
    - Omitem raciocínio desativado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Definem esquemas de ferramentas como modo estrito por padrão
    - Anexam cabeçalhos ocultos de atribuição apenas em hosts nativos verificados
    - Mantêm formatação de solicitação exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de raciocínio, dicas de cache de prompt)

    **Rotas de proxy/compatíveis:**
    - Usam comportamento compatível mais flexível
    - Removem `store` de Completions de payloads `openai-completions` não nativos
    - Aceitam passagem JSON avançada de `params.extra_body`/`params.extraBody` para proxies de Completions compatíveis com OpenAI
    - Aceitam `params.chat_template_kwargs` para proxies de Completions compatíveis com OpenAI, como vLLM
    - Não forçam esquemas de ferramentas estritos nem cabeçalhos exclusivos de rotas nativas

    O Azure OpenAI usa transporte nativo e comportamento compatível, mas não recebe os cabeçalhos ocultos de atribuição.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
