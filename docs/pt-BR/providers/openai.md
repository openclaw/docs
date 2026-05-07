---
read_when:
    - Você quer usar modelos da OpenAI no OpenClaw
    - Você quer autenticação por assinatura do Codex em vez de chaves de API
    - Você precisa de um comportamento de execução de agentes GPT-5 mais rigoroso
summary: Use a OpenAI por meio de chaves de API ou assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:24:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fornece APIs de desenvolvedor para modelos GPT, e o Codex também está disponível como um
agente de codificação do plano ChatGPT por meio dos clientes Codex da OpenAI. O OpenClaw mantém essas
superfícies separadas para que a configuração permaneça previsível.

O OpenClaw usa `openai/*` como a rota canônica de modelos da OpenAI. Turnos de agente
embutidos em modelos OpenAI passam pelo runtime app-server nativo do Codex por
padrão; a autenticação direta por chave de API da OpenAI continua disponível para
superfícies OpenAI que não são de agente, como imagens, embeddings, fala e realtime.

- **Modelos de agente** - modelos `openai/*` pelo runtime do Codex; entre com a
  autenticação `openai-codex` para uso de assinatura ChatGPT/Codex, ou configure um
  perfil de chave de API `openai-codex` quando você intencionalmente quiser autenticação por chave de API.
- **APIs OpenAI que não são de agente** - acesso direto à OpenAI Platform com cobrança
  baseada em uso por meio de `OPENAI_API_KEY` ou onboarding de chave de API da OpenAI.
- **Configuração legada** - referências de modelo `openai-codex/*` são reparadas por
  `openclaw doctor --fix` para `openai/*` mais o runtime do Codex.

A OpenAI oferece suporte explícito ao uso de OAuth de assinatura em ferramentas e fluxos de trabalho externos como o OpenClaw.

Provedor, modelo, runtime e canal são camadas separadas. Se esses rótulos
estiverem se misturando, leia [Runtimes de agentes](/pt-BR/concepts/agent-runtimes) antes
de alterar a configuração.

## Escolha rápida

| Objetivo                                             | Use                                                     | Observações                                                           |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Assinatura ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-5.5`                                        | Configuração padrão de agente OpenAI. Entre com autenticação `openai-codex`. |
| Cobrança direta por chave de API para modelos de agente | `openai/gpt-5.5` mais um perfil de chave de API `openai-codex` | Use `auth.order.openai-codex` para preferir esse perfil.              |
| Cobrança direta por chave de API via PI explícito    | `openai/gpt-5.5` mais `agentRuntime.id: "pi"`           | Selecione um perfil normal de chave de API `openai`.                  |
| Alias mais recente da API ChatGPT Instant            | `openai/chat-latest`                                    | Apenas chave de API direta. Alias móvel para experimentos, não o padrão. |
| Autenticação de assinatura ChatGPT/Codex via PI explícito | `openai/gpt-5.5` mais `agentRuntime.id: "pi"`           | Selecione um perfil de autenticação `openai-codex` para a rota de compatibilidade. |
| Geração ou edição de imagens                         | `openai/gpt-image-2`                                    | Funciona com `OPENAI_API_KEY` ou OAuth do OpenAI Codex.               |
| Imagens com fundo transparente                       | `openai/gpt-image-1.5`                                  | Use `outputFormat=png` ou `webp` e `openai.background=transparent`.   |

## Mapa de nomes

Os nomes são semelhantes, mas não intercambiáveis:

| Nome que você vê                   | Camada              | Significado                                                                                       |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefixo de provedor | Rota canônica de modelos da OpenAI; turnos de agente usam o runtime do Codex.                     |
| `openai-codex`                     | Prefixo de autenticação/perfil | Provedor de perfil de autenticação OAuth/assinatura do OpenAI Codex.                              |
| `codex` plugin                     | Plugin              | Plugin OpenClaw incluído que fornece o runtime app-server nativo do Codex e controles de chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime de agente   | Força o harness app-server nativo do Codex para turnos embutidos.                                 |
| `/codex ...`                       | Conjunto de comandos de chat | Vincula/controla threads do app-server do Codex a partir de uma conversa.                         |
| `runtime: "acp", agentId: "codex"` | Rota de sessão ACP  | Caminho de fallback explícito que executa o Codex por meio de ACP/acpx.                           |

Isso significa que uma configuração pode conter intencionalmente tanto referências de modelo `openai/*` quanto
perfis de autenticação `openai-codex`. `openclaw doctor --fix` reescreve referências de modelo legadas
`openai-codex/*` para a rota canônica de modelos da OpenAI.

<Note>
GPT-5.5 está disponível tanto por acesso direto com chave de API da OpenAI Platform quanto por
rotas de assinatura/OAuth. Para assinatura ChatGPT/Codex mais execução nativa do Codex,
use `openai/gpt-5.5`; uma configuração de runtime ausente agora seleciona o harness do Codex
para turnos de agente OpenAI. Use perfis de chave de API da OpenAI apenas quando quiser
autenticação direta por chave de API para um modelo de agente OpenAI.
</Note>

<Note>
Turnos de modelo de agente OpenAI exigem o Plugin app-server Codex incluído. A configuração explícita
do runtime PI continua disponível como uma rota de compatibilidade opcional. Quando o PI é
selecionado explicitamente com um perfil de autenticação `openai-codex`, o OpenClaw mantém a
referência pública do modelo como `openai/*` e roteia o PI internamente pelo transporte legado
de autenticação Codex. Execute `openclaw doctor --fix` para reparar referências de modelo
`openai-codex/*` obsoletas ou pins antigos de sessão PI que não venham da configuração
explícita de runtime.
</Note>

## Cobertura de recursos do OpenClaw

| Capacidade da OpenAI      | Superfície do OpenClaw                                           | Status                                                 |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Provedor de modelo `openai/<model>`                               | Sim                                                    |
| Modelos de assinatura Codex | `openai/<model>` com OAuth `openai-codex`                       | Sim                                                    |
| Referências legadas de modelo Codex | `openai-codex/<model>`                                    | Reparadas pelo doctor para `openai/<model>`            |
| Harness app-server do Codex | `openai/<model>` com runtime omitido ou `agentRuntime.id: codex` | Sim                                                    |
| Pesquisa na web do lado do servidor | Ferramenta nativa OpenAI Responses                         | Sim, quando a pesquisa na web está habilitada e nenhum provedor está fixado |
| Imagens                   | `image_generate`                                                  | Sim                                                    |
| Vídeos                    | `video_generate`                                                  | Sim                                                    |
| Texto para fala           | `messages.tts.provider: "openai"` / `tts`                         | Sim                                                    |
| Fala para texto em lote   | `tools.media.audio` / entendimento de mídia                       | Sim                                                    |
| Fala para texto em streaming | Voice Call `streaming.provider: "openai"`                      | Sim                                                    |
| Voz realtime              | Voice Call `realtime.provider: "openai"` / Control UI Talk        | Sim                                                    |
| Embeddings                | provedor de embeddings de memória                                 | Sim                                                    |

## Embeddings de memória

O OpenClaw pode usar a OpenAI, ou um endpoint de embeddings compatível com OpenAI, para
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

Para endpoints compatíveis com OpenAI que exigem rótulos assimétricos de embedding, defina
`queryInputType` e `documentInputType` em `memorySearch`. O OpenClaw encaminha
esses valores como campos de solicitação `input_type` específicos do provedor: embeddings de consulta usam
`queryInputType`; blocos de memória indexados e indexação em lote usam
`documentInputType`. Veja a [referência de configuração de memória](/pt-BR/reference/memory-config#provider-specific-config) para o exemplo completo.

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Melhor para:** acesso direto à API e cobrança baseada em uso.

    <Steps>
      <Step title="Get your API key">
        Crie ou copie uma chave de API no [painel da OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumo da rota

    | Referência de modelo  | Configuração de runtime     | Rota                        | Autenticação     |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omitido / `agentRuntime.id: "codex"` | Harness app-server do Codex | perfil `openai-codex` |
    | `openai/gpt-5.4-mini` | omitido / `agentRuntime.id: "codex"` | Harness app-server do Codex | perfil `openai-codex` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | Runtime embutido PI      | perfil `openai` ou perfil `openai-codex` selecionado |

    <Note>
    Modelos de agente `openai/*` usam o harness app-server do Codex. Para usar autenticação por chave de API
    para um modelo de agente, crie um perfil de chave de API `openai-codex` e ordene
    com `auth.order.openai-codex`; `OPENAI_API_KEY` continua sendo o fallback direto
    para superfícies OpenAI API que não são de agente.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Para experimentar o modelo Instant atual do ChatGPT pela API da OpenAI, defina o modelo
    como `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` é um alias móvel. A OpenAI o documenta como o modelo Instant mais recente
    usado no ChatGPT e recomenda `gpt-5.5` para uso de API em produção, então
    mantenha `openai/gpt-5.5` como o padrão estável, a menos que você queira explicitamente esse
    comportamento de alias. No momento, o alias aceita apenas verbosidade de texto `medium`, então
    o OpenClaw normaliza substituições incompatíveis de verbosidade de texto da OpenAI para este
    modelo.

    <Warning>
    O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark`. Solicitações ao vivo da API da OpenAI rejeitam esse modelo, e o catálogo atual do Codex também não o expõe.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **Melhor para:** usar sua assinatura ChatGPT/Codex com execução nativa do app-server do Codex em vez de uma chave de API separada. O Codex cloud exige login no ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configurações headless ou hostis a callback, adicione `--device-code` para entrar com um fluxo de código de dispositivo do ChatGPT em vez do callback de navegador localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Nenhuma configuração de ambiente de execução é necessária para o caminho padrão. Turnos de agente OpenAI
        selecionam automaticamente o ambiente de execução nativo do app-server do Codex, e o OpenClaw
        instala ou repara o Plugin Codex incluído quando esta rota é escolhida.
      </Step>
      <Step title="Verifique se a autenticação do Codex está disponível">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Depois que o Gateway estiver em execução, envie `/codex status` ou `/codex models`
        no chat para verificar o ambiente de execução nativo do app-server.
      </Step>
    </Steps>

    ### Resumo da rota

    | Referência de modelo | Configuração de ambiente de execução | Rota | Autenticação |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omitida / `agentRuntime.id: "codex"` | Harness nativo do app-server do Codex | Login no Codex ou perfil `openai-codex` selecionado |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | Ambiente de execução incorporado do PI com transporte interno de autenticação Codex | Perfil `openai-codex` selecionado |
    | `openai-codex/gpt-5.5` | reparada pelo doctor | Rota legada reescrita para `openai/gpt-5.5` | Perfil `openai-codex` existente |

    <Warning>
    Não configure referências de modelo `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ou
    `openai-codex/gpt-5.3*` mais antigas. Contas OAuth ChatGPT/Codex agora rejeitam
    esses modelos. Use `openai/gpt-5.5`; turnos de agente OpenAI agora selecionam o ambiente de execução Codex
    por padrão.
    </Warning>

    <Note>
    Continue usando o id de provedor `openai-codex` para comandos de autenticação/perfil. O
    prefixo de modelo `openai-codex/*` é configuração legada reparada pelo doctor. Para a
    configuração comum de assinatura mais ambiente de execução nativo, faça login com `openai-codex`,
    mas mantenha a referência de modelo como `openai/gpt-5.5`.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    <Note>
    A integração inicial não importa mais material OAuth de `~/.codex`. Faça login com OAuth pelo navegador (padrão) ou com o fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de autenticação de agentes.
    </Note>

    ### Verificar e recuperar o roteamento OAuth do Codex

    Use estes comandos para ver qual modelo, ambiente de execução e rota de autenticação seu agente padrão
    está usando:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Para um agente específico, adicione `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Se uma configuração mais antiga ainda tiver `openai-codex/gpt-*` ou um pin de sessão OpenAI PI
    obsoleto sem configuração explícita de ambiente de execução, repare-a:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Se `models auth list --provider openai-codex` não mostrar nenhum perfil utilizável, faça
    login novamente:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` continua sendo o id do provedor de autenticação/perfil. `openai/*` é a
    rota de modelo para turnos de agente OpenAI pelo Codex.

    ### Indicador de status

    O `/status` no chat mostra qual ambiente de execução de modelo está ativo para a sessão atual.
    O harness app-server do Codex incluído aparece como `Runtime: OpenAI Codex` para
    turnos de modelo de agente OpenAI. Pins de sessão PI obsoletos são reparados para Codex, a menos que
    a configuração fixe explicitamente PI.

    ### Aviso do doctor

    Se rotas `openai-codex/*` ou pins OpenAI PI obsoletos permanecerem na configuração ou
    no estado da sessão, `openclaw doctor --fix` os reescreverá para `openai/*` com o
    ambiente de execução Codex, a menos que PI esteja configurado explicitamente.

    ### Limite da janela de contexto

    O OpenClaw trata metadados do modelo e o limite de contexto do ambiente de execução como valores separados.

    Para `openai/gpt-5.5` pelo catálogo OAuth do Codex:

    - `contextWindow` nativo: `1000000`
    - Limite padrão de `contextTokens` do ambiente de execução: `272000`

    O limite padrão menor tem melhores características de latência e qualidade na prática. Substitua-o com `contextTokens`:

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
    Use `contextWindow` para declarar metadados nativos do modelo. Use `contextTokens` para limitar o orçamento de contexto do ambiente de execução.
    </Note>

    ### Recuperação de catálogo

    O OpenClaw usa metadados do catálogo upstream do Codex para `gpt-5.5` quando eles estão
    presentes. Se a descoberta Codex ao vivo omitir a linha `gpt-5.5` enquanto
    a conta estiver autenticada, o OpenClaw sintetiza essa linha de modelo OAuth para que
    execuções de Cron, subagente e modelo padrão configurado não falhem com
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticação nativa do app-server do Codex

O harness nativo do app-server do Codex usa referências de modelo `openai/*` mais configuração de ambiente de execução
omitida ou `agentRuntime.id: "codex"`, mas sua autenticação ainda é
baseada em conta. O OpenClaw
seleciona a autenticação nesta ordem:

1. Um perfil de autenticação `openai-codex` explícito do OpenClaw vinculado ao agente.
2. A conta existente do app-server, como um login local ChatGPT na CLI do Codex.
3. Somente para inicializações locais de app-server stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando o app-server informa que não há conta e ainda exige
   autenticação OpenAI.

Isso significa que um login local de assinatura ChatGPT/Codex não é substituído apenas
porque o processo do Gateway também tem `OPENAI_API_KEY` para modelos OpenAI diretos
ou embeddings. O fallback de chave de API por env é apenas o caminho local stdio sem conta; ele
não é enviado para conexões de app-server WebSocket. Quando um perfil Codex
do tipo assinatura é selecionado, o OpenClaw também mantém `CODEX_API_KEY` e `OPENAI_API_KEY`
fora do processo filho app-server stdio iniciado e envia as credenciais selecionadas
pela RPC de login do app-server.

## Geração de imagens

O Plugin `openai` incluído registra geração de imagens pela ferramenta `image_generate`.
Ele oferece suporte tanto à geração de imagens por chave de API OpenAI quanto à geração de imagens por OAuth Codex
pela mesma referência de modelo `openai/gpt-image-2`.

| Capacidade                | Chave de API OpenAI                | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Referência de modelo      | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticação              | `OPENAI_API_KEY`                   | Login OAuth OpenAI Codex             |
| Transporte                | API OpenAI Images                  | Backend Codex Responses              |
| Máximo de imagens por solicitação | 4                            | 4                                    |
| Modo de edição            | Habilitado (até 5 imagens de referência) | Habilitado (até 5 imagens de referência) |
| Sobrescritas de tamanho   | Compatível, incluindo tamanhos 2K/4K | Compatível, incluindo tamanhos 2K/4K |
| Proporção / resolução     | Não encaminhada para a API OpenAI Images | Mapeada para um tamanho compatível quando seguro |

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
Veja [Geração de Imagens](/pt-BR/tools/image-generation) para parâmetros de ferramenta compartilhados, seleção de provedor e comportamento de failover.
</Note>

`gpt-image-2` é o padrão tanto para geração de texto para imagem OpenAI quanto para
edição de imagens. `gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` continuam utilizáveis como
sobrescritas explícitas de modelo. Use `openai/gpt-image-1.5` para saída PNG/WebP
com fundo transparente; a API atual `gpt-image-2` rejeita
`background: "transparent"`.

Para uma solicitação com fundo transparente, os agentes devem chamar `image_generate` com
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"` e
`background: "transparent"`; a opção de provedor `openai.background` mais antiga
ainda é aceita. O OpenClaw também protege as rotas públicas OpenAI e
OAuth OpenAI Codex reescrevendo solicitações transparentes padrão `openai/gpt-image-2`
para `gpt-image-1.5`; Azure e endpoints personalizados compatíveis com OpenAI mantêm
seus nomes de implantação/modelo configurados.

A mesma configuração é exposta para execuções headless pela CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Use as mesmas flags `--output-format` e `--background` com
`openclaw infer image edit` ao começar de um arquivo de entrada.
`--openai-background` continua disponível como um alias específico da OpenAI.

Para instalações OAuth Codex, mantenha a mesma referência `openai/gpt-image-2`. Quando um
perfil OAuth `openai-codex` estiver configurado, o OpenClaw resolve esse token de acesso OAuth
armazenado e envia solicitações de imagem pelo backend Codex Responses. Ele
não tenta primeiro `OPENAI_API_KEY` nem faz fallback silenciosamente para uma chave de API para essa
solicitação. Configure `models.providers.openai` explicitamente com uma chave de API,
URL base personalizada ou endpoint Azure quando quiser a rota direta da API OpenAI Images.
Se esse endpoint de imagem personalizado estiver em uma LAN/endereço privado confiável, defina também
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

O Plugin `openai` incluído registra geração de vídeo pela ferramenta `video_generate`.

| Capacidade       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo padrão    | `openai/sora-2`                                                                   |
| Modos            | Texto para vídeo, imagem para vídeo, edição de vídeo único                        |
| Entradas de referência | 1 imagem ou 1 vídeo                                                          |
| Sobrescritas de tamanho | Compatível                                                                 |
| Outras sobrescritas | `aspectRatio`, `resolution`, `audio`, `watermark` são ignorados com um aviso da ferramenta |

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
Veja [Geração de Vídeo](/pt-BR/tools/video-generation) para parâmetros de ferramenta compartilhados, seleção de provedor e comportamento de failover.
</Note>

## Contribuição de prompt GPT-5

O OpenClaw adiciona uma contribuição de prompt GPT-5 compartilhada para execuções da família GPT-5 em vários provedores. Ela se aplica por id de modelo, então `openai/gpt-5.5`, referências legadas antes do reparo como `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e outras referências GPT-5 compatíveis recebem a mesma sobreposição. Modelos GPT-4.x mais antigos não recebem.

O harness Codex nativo incluído usa o mesmo comportamento GPT-5 e a sobreposição de Heartbeat por meio das instruções de desenvolvedor do app-server do Codex, então sessões `openai/gpt-5.x` forçadas por `agentRuntime.id: "codex"` mantêm as mesmas orientações de acompanhamento e Heartbeat proativo, embora o Codex controle o restante do prompt do harness.

A contribuição do GPT-5 adiciona um contrato de comportamento marcado para persistência de persona, segurança de execução, disciplina de ferramentas, formato de saída, verificações de conclusão e verificação. O comportamento de resposta específico de canal e de mensagens silenciosas permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A orientação do GPT-5 fica sempre habilitada para modelos correspondentes. A camada de estilo de interação amigável é separada e configurável.

| Valor                  | Efeito                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (padrão) | Habilita a camada de estilo de interação amigável |
| `"on"`                 | Alias para `"friendly"`                      |
| `"off"`                | Desabilita apenas a camada de estilo amigável       |

<Tabs>
  <Tab title="Configuração">
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
  <Accordion title="Síntese de fala (TTS)">
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

    `extraBody` é mesclado ao JSON de solicitação de `/audio/speech` depois dos campos gerados pelo OpenClaw, então use-o para endpoints compatíveis com OpenAI que exigem chaves adicionais, como `lang`. Chaves de protótipo são ignoradas.

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
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base de TTS sem afetar o endpoint da API de chat.
    </Note>

  </Accordion>

  <Accordion title="Fala para texto">
    O Plugin `openai` incluído registra fala para texto em lote por meio
    da superfície de transcrição de entendimento de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível com o OpenClaw em qualquer lugar onde a transcrição de áudio de entrada use
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e anexos de áudio
      de canais

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

  <Accordion title="Transcrição em tempo real">
    O Plugin `openai` incluído registra transcrição em tempo real para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (não definido) |
    | Prompt | `...openai.prompt` | (não definido) |
    | Duração do silêncio | `...openai.silenceDurationMs` | `800` |
    | Limite de VAD | `...openai.vadThreshold` | `0.5` |
    | Chave de API | `...openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |

    <Note>
    Usa uma conexão WebSocket para `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este provedor de streaming é para o caminho de transcrição em tempo real do Voice Call; atualmente, a voz do Discord grava segmentos curtos e usa o caminho de transcrição em lote `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real">
    O Plugin `openai` incluído registra voz em tempo real para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Limite de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Chave de API | `...openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |

    <Note>
    Compatível com Azure OpenAI por meio das chaves de configuração `azureEndpoint` e `azureDeployment` para bridges em tempo real de backend. Compatível com chamadas de ferramentas bidirecionais. Usa formato de áudio G.711 u-law.
    </Note>

    <Note>
    O Talk da Control UI usa sessões em tempo real da OpenAI no navegador com um segredo efêmero de cliente
    emitido pelo Gateway e uma troca SDP WebRTC direta no navegador contra a
    OpenAI Realtime API. A verificação ao vivo por mantenedores está disponível com
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    a etapa da OpenAI emite um segredo de cliente no Node, gera uma oferta SDP no navegador
    com mídia de microfone falsa, publica-a na OpenAI e aplica a resposta SDP
    sem registrar segredos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints do Azure OpenAI

O provedor `openai` incluído pode direcionar um recurso do Azure OpenAI para geração de imagens
substituindo a URL base. No caminho de geração de imagens, o OpenClaw
detecta nomes de host do Azure em `models.providers.openai.baseUrl` e muda automaticamente para
o formato de solicitação do Azure.

<Note>
Voz em tempo real usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Consulte o accordion **Voz em tempo real** em [Voz e fala](#voice-and-speech) para suas configurações do Azure.
</Note>

Use Azure OpenAI quando:

- Você já tem uma assinatura, cota ou contrato empresarial do Azure OpenAI
- Você precisa de residência regional de dados ou controles de conformidade fornecidos pelo Azure
- Você quer manter o tráfego dentro de uma tenancy existente do Azure

### Configuração

Para geração de imagens do Azure por meio do provedor `openai` incluído, aponte
`models.providers.openai.baseUrl` para seu recurso do Azure e defina `apiKey` como
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
- Anexa `?api-version=...` a cada solicitação
- Usa um tempo limite padrão de solicitação de 600 s para chamadas de geração de imagens do Azure.
  Valores `timeoutMs` por chamada ainda substituem esse padrão.

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato padrão
de solicitação de imagem da OpenAI.

<Note>
O roteamento do Azure para o caminho de geração de imagens do provedor `openai` exige
OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizado como o endpoint público da OpenAI e falharão contra implantações de imagem do Azure.
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
o id do modelo público da OpenAI.

Se você criar uma implantação chamada `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

A mesma regra de nome de implantação se aplica a chamadas de geração de imagens roteadas por
meio do provedor `openai` incluído.

### Disponibilidade regional

A geração de imagens do Azure está disponível atualmente apenas em um subconjunto de regiões
(por exemplo, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulte a lista atual de regiões da Microsoft antes de criar uma
implantação e confirme se o modelo específico é oferecido na sua região.

### Diferenças de parâmetros

O Azure OpenAI e a OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções que a OpenAI pública permite (por exemplo, determinados
valores de `background` em `gpt-image-2`) ou expô-las apenas em versões específicas de modelo.
Essas diferenças vêm do Azure e do modelo subjacente, não do
OpenClaw. Se uma solicitação do Azure falhar com um erro de validação, verifique o
conjunto de parâmetros compatível com sua implantação específica e versão da API no
portal do Azure.

<Note>
O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe
os cabeçalhos ocultos de atribuição do OpenClaw — consulte o accordion **Rotas nativas vs compatíveis com OpenAI** em [Configuração avançada](#advanced-configuration).

Para tráfego de chat ou Responses no Azure (além da geração de imagens), use o
fluxo de onboarding ou uma configuração dedicada de provedor Azure — `openai.baseUrl` sozinho
não adota o formato de API/autenticação do Azure. Existe um provedor separado
`azure-openai-responses/*`; consulte o accordion Server-side compaction abaixo.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) para `openai/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de recorrer a SSE
    - Após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o período de resfriamento
    - Anexa cabeçalhos estáveis de identidade de sessão e turno para novas tentativas e reconexões
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamento |
    |-------|----------|
    | `"auto"` (padrão) | WebSocket primeiro, fallback para SSE |
    | `"sse"` | Forçar apenas SSE |
    | `"websocket"` | Forçar apenas WebSocket |

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
    - [Respostas da API de streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Aquecimento do WebSocket">
    O OpenClaw habilita o aquecimento do WebSocket por padrão para `openai/*` a fim de reduzir a latência do primeiro turno.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo rápido">
    O OpenClaw expõe uma alternância compartilhada de modo rápido para `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuração:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando habilitado, o OpenClaw mapeia o modo rápido para o processamento prioritário da OpenAI (`service_tier = "priority"`). Valores existentes de `service_tier` são preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`.

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
    Substituições de sessão têm precedência sobre a configuração. Limpar a substituição de sessão na UI de Sessões retorna a sessão ao padrão configurado.
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
    `serviceTier` só é encaminhado para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você rotear qualquer um dos provedores por um proxy, o OpenClaw deixará `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no lado do servidor (Responses API)">
    Para modelos OpenAI Responses diretos (`openai/*` em `api.openai.com`), o wrapper de stream do Pi-harness do Plugin OpenAI habilita automaticamente a Compaction no lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    Isso se aplica ao caminho integrado do Pi harness e aos hooks do provedor OpenAI usados por execuções incorporadas. O harness nativo do servidor de app Codex gerencia seu próprio contexto por meio do Codex e é configurado separadamente com `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Habilitar explicitamente">
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
      <Tab title="Desabilitar">
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

  <Accordion title="Modo GPT agente estrito">
    Para execuções da família GPT-5 em `openai/*`, o OpenClaw pode usar um contrato de execução incorporada mais estrito:

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
    - Deixa de tratar um turno apenas com plano como progresso bem-sucedido quando uma ação de ferramenta está disponível
    - Tenta novamente o turno com um direcionamento para agir agora
    - Habilita automaticamente `update_plan` para trabalhos substanciais
    - Exibe um estado bloqueado explícito se o modelo continuar planejando sem agir

    <Note>
    Restrito apenas a execuções da família GPT-5 da OpenAI e do Codex. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, Codex e Azure OpenAI de forma diferente de proxies `/v1` genéricos compatíveis com OpenAI:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` apenas para modelos compatíveis com o esforço `none` da OpenAI
    - Omitem reasoning desabilitado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Definem esquemas de ferramentas como modo estrito por padrão
    - Anexam cabeçalhos de atribuição ocultos apenas em hosts nativos verificados
    - Mantêm a modelagem de solicitação exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de reasoning, dicas de cache de prompt)

    **Rotas de proxy/compatíveis:**
    - Usam comportamento de compatibilidade mais flexível
    - Removem `store` de Completions de payloads `openai-completions` não nativos
    - Aceitam JSON de passagem avançado em `params.extra_body`/`params.extraBody` para proxies de Completions compatíveis com OpenAI
    - Aceitam `params.chat_template_kwargs` para proxies de Completions compatíveis com OpenAI, como vLLM
    - Não forçam esquemas de ferramentas estritos nem cabeçalhos exclusivos de rotas nativas

    O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe os cabeçalhos de atribuição ocultos.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
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
