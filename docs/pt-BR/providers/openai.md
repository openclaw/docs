---
read_when:
    - Você quer usar modelos da OpenAI no OpenClaw
    - Você quer autenticação por assinatura do Codex em vez de chaves de API
    - Você precisa de um comportamento mais rigoroso de execução do agente GPT-5
summary: Use a OpenAI por meio de chaves de API ou de uma assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:35:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fornece APIs de desenvolvedor para modelos GPT, e Codex também está disponível como um agente de codificação de plano ChatGPT por meio dos clientes Codex da OpenAI. O OpenClaw mantém essas superfícies separadas para que a configuração permaneça previsível.

O OpenClaw usa `openai/*` como a rota canônica de modelo da OpenAI. Turnos de agente incorporados em modelos OpenAI são executados pelo runtime nativo do servidor de app do Codex por padrão; a autenticação direta por chave de API da OpenAI permanece disponível para superfícies OpenAI sem agente, como imagens, embeddings, fala e tempo real.

- **Modelos de agente** - modelos `openai/*` pelo runtime Codex; entre com autenticação Codex para uso de assinatura ChatGPT/Codex ou configure um backup de chave de API OpenAI compatível com Codex quando você quiser intencionalmente autenticação por chave de API.
- **APIs OpenAI sem agente** - acesso direto à OpenAI Platform com cobrança baseada em uso por meio de `OPENAI_API_KEY` ou onboarding de chave de API da OpenAI.
- **Configuração legada** - referências de modelo `openai-codex/*` são reparadas por `openclaw doctor --fix` para `openai/*` mais o runtime Codex.

A OpenAI oferece suporte explicitamente ao uso de OAuth de assinatura em ferramentas externas e fluxos de trabalho como o OpenClaw.

Provedor, modelo, runtime e canal são camadas separadas. Se esses rótulos estiverem sendo misturados, leia [Runtimes de agente](/pt-BR/concepts/agent-runtimes) antes de alterar a configuração.

## Escolha rápida

| Objetivo                                             | Use                                                      | Observações                                                            |
| ---------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| Assinatura ChatGPT/Codex com runtime Codex nativo    | `openai/gpt-5.5`                                         | Configuração padrão de agente OpenAI. Entre com autenticação Codex.    |
| Cobrança direta por chave de API para modelos de agente | `openai/gpt-5.5` mais um perfil de chave de API compatível com Codex | Use `auth.order.openai` para colocar o backup depois da autenticação de assinatura. |
| Cobrança direta por chave de API por PI explícito    | `openai/gpt-5.5` mais runtime de provedor/modelo `pi`    | Selecione um perfil normal de chave de API `openai`.                   |
| Alias mais recente da API ChatGPT Instant            | `openai/chat-latest`                                     | Somente chave de API direta. Alias móvel para experimentos, não o padrão. |
| Autenticação de assinatura ChatGPT/Codex por PI explícito | `openai/gpt-5.5` mais runtime de provedor/modelo `pi`    | Selecione um perfil de autenticação `openai-codex` para a rota de compatibilidade. |
| Geração ou edição de imagens                         | `openai/gpt-image-2`                                     | Funciona com `OPENAI_API_KEY` ou OAuth OpenAI Codex.                   |
| Imagens com fundo transparente                       | `openai/gpt-image-1.5`                                   | Use `outputFormat=png` ou `webp` e `openai.background=transparent`.    |

## Mapa de nomes

Os nomes são parecidos, mas não intercambiáveis:

| Nome que você vê                         | Camada                     | Significado                                                                                                           |
| ---------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `openai`                                 | Prefixo do provedor        | Rota canônica de modelo da OpenAI; turnos de agente usam o runtime Codex.                                             |
| `openai-codex`                           | Prefixo legado de autenticação/perfil | Namespace mais antigo de perfil OAuth/assinatura OpenAI Codex. Perfis existentes e `auth.order.openai-codex` ainda funcionam. |
| Plugin `codex`                           | Plugin                     | Plugin integrado do OpenClaw que fornece runtime nativo do servidor de app do Codex e controles de chat `/codex`.     |
| `agentRuntime.id: codex` de provedor/modelo | Runtime de agente          | Força o harness nativo do servidor de app do Codex para turnos incorporados correspondentes.                          |
| `/codex ...`                             | Conjunto de comandos de chat | Vincule/controle threads do servidor de app do Codex a partir de uma conversa.                                        |
| `runtime: "acp", agentId: "codex"`       | Rota de sessão ACP         | Caminho de fallback explícito que executa Codex por ACP/acpx.                                                         |

Isso significa que uma configuração pode conter intencionalmente referências de modelo `openai/*` enquanto perfis de autenticação ainda apontam para credenciais compatíveis com Codex. Prefira `auth.order.openai` para novas configurações; perfis `openai-codex:*` existentes e `auth.order.openai-codex` continuam compatíveis. `openclaw doctor --fix` reescreve referências de modelo legadas `openai-codex/*` para a rota canônica de modelo da OpenAI.

<Note>
GPT-5.5 está disponível tanto pelo acesso direto com chave de API da OpenAI Platform quanto por rotas de assinatura/OAuth. Para assinatura ChatGPT/Codex mais execução Codex nativa, use `openai/gpt-5.5`; a configuração de runtime não definida agora seleciona o harness Codex para turnos de agente OpenAI. Use perfis de chave de API da OpenAI somente quando quiser autenticação direta por chave de API para um modelo de agente OpenAI.
</Note>

<Note>
Turnos de modelo de agente OpenAI exigem o Plugin integrado do servidor de app Codex. A configuração explícita de runtime PI permanece disponível como uma rota de compatibilidade opcional. Quando PI é selecionado explicitamente com um perfil de autenticação `openai-codex`, o OpenClaw mantém a referência de modelo pública como `openai/*` e roteia PI internamente pelo transporte legado de autenticação Codex. Execute `openclaw doctor --fix` para reparar referências de modelo `openai-codex/*` obsoletas ou pins antigos de sessão PI que não venham de uma configuração explícita de runtime.
</Note>

## Cobertura de recursos do OpenClaw

| Capacidade OpenAI        | Superfície OpenClaw                                                              | Status                                                 |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | provedor de modelo `openai/<model>`                                              | Sim                                                    |
| Modelos de assinatura Codex | `openai/<model>` com OAuth `openai-codex`                                     | Sim                                                    |
| Referências de modelo Codex legadas | `openai-codex/<model>`                                                | Reparado pelo doctor para `openai/<model>`             |
| Harness do servidor de app Codex | `openai/<model>` com runtime omitido ou `agentRuntime.id: codex` de provedor/modelo | Sim                                                    |
| Busca na web do lado do servidor | Ferramenta nativa OpenAI Responses                                        | Sim, quando a busca na web está habilitada e nenhum provedor está fixado |
| Imagens                  | `image_generate`                                                                 | Sim                                                    |
| Vídeos                   | `video_generate`                                                                 | Sim                                                    |
| Texto para fala          | `messages.tts.provider: "openai"` / `tts`                                        | Sim                                                    |
| Fala para texto em lote  | `tools.media.audio` / compreensão de mídia                                       | Sim                                                    |
| Fala para texto em streaming | Voice Call `streaming.provider: "openai"`                                    | Sim                                                    |
| Voz em tempo real        | Voice Call `realtime.provider: "openai"` / Talk da Control UI                    | Sim                                                    |
| Embeddings               | provedor de embeddings de memória                                                | Sim                                                    |

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

Para endpoints compatíveis com OpenAI que exigem rótulos de embedding assimétricos, defina `queryInputType` e `documentInputType` em `memorySearch`. O OpenClaw os encaminha como campos de solicitação `input_type` específicos do provedor: embeddings de consulta usam `queryInputType`; fragmentos de memória indexados e indexação em lote usam `documentInputType`. Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config#provider-specific-config) para ver o exemplo completo.

## Introdução

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

    ### Resumo de rota

    | Referência de modelo  | Configuração de runtime   | Rota                        | Autenticação     |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omitido / `agentRuntime.id: "codex"` de provedor/modelo | Harness do servidor de app Codex | Perfil OpenAI compatível com Codex |
    | `openai/gpt-5.4-mini` | omitido / `agentRuntime.id: "codex"` de provedor/modelo | Harness do servidor de app Codex | Perfil OpenAI compatível com Codex |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"` de provedor/modelo              | Runtime incorporado PI      | perfil `openai` ou perfil `openai-codex` selecionado |

    <Note>
    Modelos de agente `openai/*` usam o harness do servidor de app Codex. Para usar autenticação por chave de API para um modelo de agente, crie um perfil de chave de API compatível com Codex e ordene-o com `auth.order.openai`; `OPENAI_API_KEY` permanece como fallback direto para superfícies da API OpenAI sem agente. Entradas `auth.order.openai-codex` mais antigas ainda funcionam.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Para testar o modelo Instant atual do ChatGPT pela API OpenAI, defina o modelo como `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` é um alias móvel. A OpenAI o documenta como o modelo Instant mais recente usado no ChatGPT e recomenda `gpt-5.5` para uso de API em produção, então mantenha `openai/gpt-5.5` como o padrão estável, a menos que você queira explicitamente esse comportamento de alias. Atualmente, o alias aceita apenas verbosidade de texto `medium`, então o OpenClaw normaliza substituições incompatíveis de verbosidade de texto da OpenAI para este modelo.

    <Warning>
    O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark`. Solicitações ativas à API OpenAI rejeitam esse modelo, e o catálogo Codex atual também não o expõe.
    </Warning>

  </Tab>

  <Tab title="Assinatura do Codex">
    **Ideal para:** usar sua assinatura do ChatGPT/Codex com execução nativa do servidor de aplicativo do Codex em vez de uma chave de API separada. A nuvem do Codex exige login no ChatGPT.

    <Steps>
      <Step title="Execute o OAuth do Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configurações sem interface ou hostis a callbacks, adicione `--device-code` para entrar com um fluxo de código de dispositivo do ChatGPT em vez do callback de navegador em localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use a rota canônica de modelo da OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Nenhuma configuração de runtime é necessária para o caminho padrão. Turnos de agentes da OpenAI
        selecionam automaticamente o runtime nativo do servidor de aplicativo do Codex, e o OpenClaw
        instala ou repara o plugin Codex empacotado quando essa rota é escolhida.
      </Step>
      <Step title="Verifique se a autenticação do Codex está disponível">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Depois que o gateway estiver em execução, envie `/codex status` ou `/codex models`
        no chat para verificar o runtime nativo do servidor de aplicativo.
      </Step>
    </Steps>

    ### Resumo da rota

    | Ref. do modelo | Configuração de runtime | Rota | Autenticação |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omitido / provider/model `agentRuntime.id: "codex"` | Harness nativo do servidor de aplicativo do Codex | Login do Codex ou perfil de autenticação `openai` ordenado |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | Runtime incorporado do PI com transporte interno de autenticação do Codex | Perfil `openai-codex` selecionado |
    | `openai-codex/gpt-5.5` | reparado pelo doctor | Rota legada reescrita para `openai/gpt-5.5` | Perfil `openai-codex` existente |

    <Warning>
    Não configure refs de modelo `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ou
    `openai-codex/gpt-5.3*` mais antigas. Contas OAuth do ChatGPT/Codex agora rejeitam
    esses modelos. Use `openai/gpt-5.5`; turnos de agentes da OpenAI agora selecionam o runtime
    do Codex por padrão.
    </Warning>

    <Note>
    O prefixo de modelo `openai-codex/*` é uma configuração legada reparada pelo doctor. Para
    a configuração comum de assinatura mais runtime nativo, entre com a autenticação do Codex,
    mas mantenha a ref. do modelo como `openai/gpt-5.5`. Novas configurações devem colocar a ordem de
    autenticação do agente OpenAI em `auth.order.openai`; entradas antigas em `auth.order.openai-codex`
    continuam válidas.
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

    Com uma chave de API de backup, mantenha o modelo em `openai/gpt-5.5` e coloque a
    ordem de autenticação em `openai`. O OpenClaw tentará a assinatura primeiro e depois
    a chave de API, enquanto permanece no harness do Codex:

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
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    O onboarding não importa mais material OAuth de `~/.codex`. Entre com OAuth pelo navegador (padrão) ou com o fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de autenticação de agentes.
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

    Se uma configuração mais antiga ainda tiver `openai-codex/gpt-*` ou um pin de sessão OpenAI PI
    obsoleto sem configuração explícita de runtime, repare-a:

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

    `openai/*` é a rota de modelo para turnos de agentes da OpenAI pelo Codex. O id
    de provedor de autenticação/perfil `openai-codex` continua aceito para perfis
    existentes e listagem pela CLI.

    ### Indicador de status

    O chat `/status` mostra qual runtime de modelo está ativo para a sessão atual.
    O harness do servidor de aplicativo do Codex empacotado aparece como `Runtime: OpenAI Codex` para
    turnos de modelo de agentes da OpenAI. Pins de sessão PI obsoletos são reparados para Codex, a menos que
    a configuração fixe explicitamente o PI.

    ### Aviso do doctor

    Se rotas `openai-codex/*` ou pins OpenAI PI obsoletos permanecerem na configuração ou no
    estado da sessão, `openclaw doctor --fix` os reescreve para `openai/*` com o runtime
    do Codex, a menos que o PI esteja explicitamente configurado.

    ### Limite da janela de contexto

    O OpenClaw trata metadados de modelo e o limite de contexto do runtime como valores separados.

    Para `openai/gpt-5.5` pelo catálogo OAuth do Codex:

    - `contextWindow` nativo: `1000000`
    - Limite padrão de runtime `contextTokens`: `272000`

    Na prática, o limite padrão menor tem características melhores de latência e qualidade. Substitua-o com `contextTokens`:

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

    O OpenClaw usa metadados do catálogo upstream do Codex para `gpt-5.5` quando eles estão
    presentes. Se a descoberta ao vivo do Codex omitir a linha `gpt-5.5` enquanto
    a conta estiver autenticada, o OpenClaw sintetiza essa linha de modelo OAuth para que
    execuções de cron, subagente e modelo padrão configurado não falhem com
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticação nativa do servidor de aplicativo do Codex

O harness nativo do servidor de aplicativo do Codex usa refs de modelo `openai/*` mais configuração
de runtime omitida ou provider/model `agentRuntime.id: "codex"`, mas sua autenticação
ainda é baseada em conta. O OpenClaw seleciona a autenticação nesta ordem:

1. Perfis de autenticação OpenAI ordenados para o agente, de preferência em
   `auth.order.openai`. Perfis `openai-codex:*` existentes e
   `auth.order.openai-codex` continuam válidos para instalações mais antigas.
2. A conta existente do servidor de aplicativo, como um login local do ChatGPT pela CLI do Codex.
3. Somente para inicializações locais do servidor de aplicativo stdio, `CODEX_API_KEY` e depois
   `OPENAI_API_KEY`, quando o servidor de aplicativo não relata nenhuma conta e ainda exige
   autenticação OpenAI.

Isso significa que um login local de assinatura ChatGPT/Codex não é substituído apenas
porque o processo do gateway também tem `OPENAI_API_KEY` para modelos OpenAI diretos
ou embeddings. O fallback de chave de API por variável de ambiente é apenas o caminho local stdio sem conta; ele
não é enviado a conexões WebSocket do servidor de aplicativo. Quando um perfil de Codex
no estilo assinatura é selecionado, o OpenClaw também mantém `CODEX_API_KEY` e `OPENAI_API_KEY`
fora do processo filho stdio do servidor de aplicativo gerado e envia as credenciais selecionadas
pela RPC de login do servidor de aplicativo. Quando esse perfil de assinatura é bloqueado por um
limite de uso do Codex, o OpenClaw pode alternar para o próximo perfil de chave de API `openai:*`
ordenado sem mudar o modelo selecionado nem sair do harness do Codex. Depois que o
tempo de redefinição da assinatura passa, o perfil de assinatura fica elegível novamente.

## Geração de imagens

O plugin `openai` empacotado registra geração de imagens pela ferramenta `image_generate`.
Ele oferece suporte tanto à geração de imagens com chave de API OpenAI quanto à geração de imagens
com OAuth do Codex pela mesma ref. de modelo `openai/gpt-image-2`.

| Recurso                | Chave de API OpenAI                     | OAuth do Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref. do modelo                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticação                      | `OPENAI_API_KEY`                   | Login OAuth do OpenAI Codex           |
| Transporte                 | API OpenAI Images                  | Backend Codex Responses              |
| Máximo de imagens por solicitação    | 4                                  | 4                                    |
| Modo de edição                 | Habilitado (até 5 imagens de referência) | Habilitado (até 5 imagens de referência)   |
| Substituições de tamanho            | Compatíveis, incluindo tamanhos 2K/4K   | Compatíveis, incluindo tamanhos 2K/4K     |
| Proporção / resolução | Não encaminhado para a API OpenAI Images | Mapeado para um tamanho compatível quando seguro |

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
Consulte [Geração de Imagens](/pt-BR/tools/image-generation) para parâmetros de ferramenta compartilhados, seleção de provedor e comportamento de failover.
</Note>

`gpt-image-2` é o padrão tanto para geração de texto para imagem da OpenAI quanto para edição de imagens.
`gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` continuam utilizáveis como
substituições explícitas de modelo. Use `openai/gpt-image-1.5` para saída PNG/WebP
com fundo transparente; a API atual de `gpt-image-2` rejeita
`background: "transparent"`.

Para uma solicitação de fundo transparente, agentes devem chamar `image_generate` com
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"` e
`background: "transparent"`; a opção de provedor antiga `openai.background` ainda é
aceita. O OpenClaw também protege as rotas públicas OpenAI e
OpenAI Codex OAuth reescrevendo solicitações transparentes padrão `openai/gpt-image-2`
para `gpt-image-1.5`; endpoints Azure e OpenAI-compatíveis personalizados mantêm
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
`--openai-background` permanece disponível como um alias específico da OpenAI.

Para instalações com OAuth do Codex, mantenha a mesma ref. `openai/gpt-image-2`. Quando um
perfil OAuth `openai-codex` estiver configurado, o OpenClaw resolve esse token de acesso OAuth
armazenado e envia solicitações de imagem pelo backend Codex Responses. Ele
não tenta primeiro `OPENAI_API_KEY` nem faz fallback silencioso para uma chave de API para essa
solicitação. Configure `models.providers.openai` explicitamente com uma chave de API,
URL base personalizada ou endpoint Azure quando quiser a rota direta da API OpenAI Images.
Se esse endpoint de imagem personalizado estiver em uma LAN/endereço privado confiável, também defina
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; o OpenClaw mantém
endpoints de imagem OpenAI-compatíveis privados/internos bloqueados, a menos que essa adesão explícita
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

O Plugin `openai` incluído registra geração de vídeo por meio da ferramenta `video_generate`.

| Recurso           | Valor                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Modelo padrão     | `openai/sora-2`                                                                                    |
| Modos             | Texto para vídeo, imagem para vídeo, edição de vídeo único                                         |
| Entradas de referência | 1 imagem ou 1 vídeo                                                                           |
| Substituições de tamanho | Compatíveis                                                                                |
| Outras substituições | `aspectRatio`, `resolution`, `audio`, `watermark` são ignorados com um aviso da ferramenta      |

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

## Contribuição de prompt do GPT-5

O OpenClaw adiciona uma contribuição compartilhada de prompt do GPT-5 para execuções da família GPT-5 entre provedores. Ela se aplica pelo id do modelo, portanto `openai/gpt-5.5`, refs legadas anteriores ao reparo como `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e outras refs compatíveis com GPT-5 recebem a mesma sobreposição. Modelos GPT-4.x mais antigos não recebem.

O harness Codex nativo incluído usa o mesmo comportamento do GPT-5 e a mesma sobreposição de Heartbeat por meio das instruções de desenvolvedor do servidor de aplicativo Codex, portanto sessões `openai/gpt-5.x` roteadas pelo Codex mantêm a mesma orientação de acompanhamento e Heartbeat proativo, embora o Codex seja dono do restante do prompt do harness.

A contribuição do GPT-5 adiciona um contrato de comportamento marcado para persistência de persona, segurança de execução, disciplina de ferramentas, formato de saída, verificações de conclusão e verificação. O comportamento de resposta específico do canal e de mensagem silenciosa permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A orientação do GPT-5 está sempre habilitada para modelos correspondentes. A camada de estilo de interação amigável é separada e configurável.

| Valor                  | Efeito                                          |
| ---------------------- | ----------------------------------------------- |
| `"friendly"` (padrão)  | Habilitar a camada de estilo de interação amigável |
| `"on"`                 | Alias para `"friendly"`                         |
| `"off"`                | Desabilitar apenas a camada de estilo amigável  |

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
Os valores não diferenciam maiúsculas de minúsculas em tempo de execução, portanto `"Off"` e `"off"` desabilitam a camada de estilo amigável.
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
    | Instruções | `messages.tts.providers.openai.instructions` | (não definido, somente `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para arquivos |
    | Chave de API | `messages.tts.providers.openai.apiKey` | Recorre a `OPENAI_API_KEY` |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corpo extra | `messages.tts.providers.openai.extraBody` / `extra_body` | (não definido) |

    Modelos disponíveis: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Vozes disponíveis: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` é mesclado ao JSON da solicitação `/audio/speech` após os campos gerados pelo OpenClaw, portanto use-o para endpoints compatíveis com OpenAI que exigem chaves adicionais, como `lang`. Chaves de protótipo são ignoradas.

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
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base de TTS sem afetar o endpoint da API de chat. O TTS da OpenAI ainda é configurado por meio de uma chave de API; para retorno de fala ao vivo somente com OAuth, use o caminho de voz em tempo real em vez de fala STT -> TTS em modo de agente.
    </Note>

  </Accordion>

  <Accordion title="Fala para texto">
    O Plugin `openai` incluído registra fala para texto em lote por meio da
    superfície de transcrição de entendimento de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível com o OpenClaw sempre que a transcrição de áudio de entrada usa
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e anexos
      de áudio de canal

    Para forçar a OpenAI para transcrição de áudio de entrada:

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
    | Autenticação | `...openai.apiKey`, `OPENAI_API_KEY` ou OAuth `openai-codex` | Chaves de API se conectam diretamente; OAuth emite um segredo de cliente de transcrição Realtime |

    <Note>
    Usa uma conexão WebSocket com `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Quando apenas o OAuth `openai-codex` está configurado, o Gateway emite um segredo de cliente efêmero de transcrição Realtime antes de abrir o WebSocket. Este provedor de streaming é para o caminho de transcrição em tempo real do Voice Call; a voz do Discord atualmente grava segmentos curtos e usa o caminho de transcrição em lote `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real">
    O Plugin `openai` incluído registra voz em tempo real para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura (ponte de implantação do Azure) | `...openai.temperature` | `0.8` |
    | Limite de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Preenchimento de prefixo | `...openai.prefixPaddingMs` | `300` |
    | Esforço de raciocínio | `...openai.reasoningEffort` | (não definido) |
    | Autenticação | `...openai.apiKey`, `OPENAI_API_KEY` ou OAuth `openai-codex` | O Talk no navegador e pontes de backend que não sejam Azure podem usar OAuth do Codex |

    Vozes Realtime integradas disponíveis para `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    A OpenAI recomenda `marin` e `cedar` para a melhor qualidade Realtime. Este
    é um conjunto separado das vozes de texto para fala acima; não presuma que uma voz de TTS
    como `fable`, `nova` ou `onyx` seja válida para sessões Realtime.

    <Note>
    As pontes Realtime de backend da OpenAI usam o formato de sessão WebSocket Realtime GA, que não aceita `session.temperature`. Implantações do Azure OpenAI continuam disponíveis por meio de `azureEndpoint` e `azureDeployment` e mantêm o formato de sessão compatível com a implantação. Oferece suporte a chamadas de ferramentas bidirecionais e áudio G.711 u-law.
    </Note>

    <Note>
    A voz Realtime é selecionada quando a sessão é criada. A OpenAI permite que a maioria
    dos campos da sessão seja alterada depois, mas a voz não pode ser alterada depois que o
    modelo tiver emitido áudio nessa sessão. O OpenClaw atualmente expõe os
    ids de voz Realtime integrados como strings.
    </Note>

    <Note>
    O Talk da interface de controle usa sessões Realtime da OpenAI no navegador com um segredo de cliente
    efêmero emitido pelo Gateway e uma troca SDP WebRTC direta do navegador com a
    API Realtime da OpenAI. Quando nenhuma chave de API direta da OpenAI está configurada, o
    Gateway pode emitir esse segredo de cliente com o perfil OAuth `openai-codex`
    selecionado. O relay do Gateway e as pontes WebSocket Realtime de backend do Voice Call usam
    o mesmo fallback OAuth para endpoints nativos da OpenAI. A verificação ao vivo de mantenedor
    está disponível com
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    os trechos da OpenAI verificam tanto a ponte WebSocket de backend quanto a troca
    SDP WebRTC do navegador sem registrar segredos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints do Azure OpenAI

O provedor `openai` incluído pode apontar para um recurso do Azure OpenAI para geração de imagens
substituindo a URL base. No caminho de geração de imagens, o OpenClaw
detecta nomes de host do Azure em `models.providers.openai.baseUrl` e muda para
o formato de solicitação do Azure automaticamente.

<Note>
A voz em tempo real usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Consulte o acordeão **Voz em tempo real**
em [Voz e fala](#voice-and-speech) para suas configurações do Azure.
</Note>

Use o Azure OpenAI quando:

- Você já tem uma assinatura, cota ou contrato empresarial do Azure OpenAI
- Você precisa de residência regional de dados ou controles de conformidade fornecidos pelo Azure
- Você quer manter o tráfego dentro de uma locação existente do Azure

### Configuração

Para geração de imagens do Azure por meio do provedor `openai` incluído, aponte
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

Para solicitações de geração de imagens em um host do Azure reconhecido, o OpenClaw:

- Envia o cabeçalho `api-key` em vez de `Authorization: Bearer`
- Usa caminhos com escopo de implantação (`/openai/deployments/{deployment}/...`)
- Anexa `?api-version=...` a cada solicitação
- Usa um tempo limite de solicitação padrão de 600s para chamadas de geração de imagens do Azure.
  Valores `timeoutMs` por chamada ainda substituem esse padrão.

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato
padrão de solicitação de imagem da OpenAI.

<Note>
O roteamento do Azure para o caminho de geração de imagens do provedor `openai` requer
OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizado como o endpoint público da OpenAI e falharão em implantações
de imagens do Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão específica de preview ou GA do Azure
para o caminho de geração de imagens do Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Nomes de modelos são nomes de implantação

O Azure OpenAI vincula modelos a implantações. Para solicitações de geração de imagens do Azure
roteadas pelo provedor `openai` incluído, o campo `model` no OpenClaw
deve ser o **nome da implantação do Azure** que você configurou no portal do Azure, não
o ID público do modelo da OpenAI.

Se você criar uma implantação chamada `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

A mesma regra de nome de implantação se aplica às chamadas de geração de imagens roteadas pelo
provedor `openai` incluído.

### Disponibilidade regional

A geração de imagens do Azure está disponível atualmente apenas em um subconjunto de regiões
(por exemplo, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Verifique a lista atual de regiões da Microsoft antes de criar uma
implantação e confirme se o modelo específico é oferecido na sua região.

### Diferenças de parâmetros

O Azure OpenAI e a OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções que a OpenAI pública permite (por exemplo, certos valores de
`background` em `gpt-image-2`) ou expô-las apenas em versões específicas de modelo.
Essas diferenças vêm do Azure e do modelo subjacente, não do
OpenClaw. Se uma solicitação do Azure falhar com um erro de validação, verifique o
conjunto de parâmetros compatível com sua implantação específica e versão da API no
portal do Azure.

<Note>
O Azure OpenAI usa transporte nativo e comportamento compatível, mas não recebe
os cabeçalhos ocultos de atribuição do OpenClaw — veja o acordeão **Rotas nativas vs. compatíveis com OpenAI**
em [Configuração avançada](#advanced-configuration).

Para tráfego de chat ou Responses no Azure (além da geração de imagens), use o
fluxo de integração ou uma configuração dedicada de provedor do Azure — `openai.baseUrl` sozinho
não adota o formato de API/autenticação do Azure. Existe um provedor separado
`azure-openai-responses/*`; veja
o acordeão de compactação no lado do servidor abaixo.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) para `openai/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de fazer fallback para SSE
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
    - [API Realtime com WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respostas de API em streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Modo rápido">
    O OpenClaw expõe um alternador compartilhado de modo rápido para `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuração:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando ativado, o OpenClaw mapeia o modo rápido para o processamento prioritário da OpenAI (`service_tier = "priority"`). Valores existentes de `service_tier` são preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`.

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
    Substituições de sessão prevalecem sobre a configuração. Limpar a substituição da sessão na UI de Sessões retorna a sessão ao padrão configurado.
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
    `serviceTier` é encaminhado apenas para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você rotear qualquer um dos provedores por um proxy, o OpenClaw deixa `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no lado do servidor (Responses API)">
    Para modelos OpenAI Responses diretos (`openai/*` em `api.openai.com`), o wrapper de stream do harness Pi do Plugin OpenAI ativa automaticamente a compactação no lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    Isso se aplica ao caminho integrado do harness Pi e aos hooks do provedor OpenAI usados por execuções incorporadas. O harness nativo do servidor de apps Codex gerencia seu próprio contexto por meio do Codex e é configurado pela rota padrão de agente da OpenAI ou pela política de runtime de provedor/modelo.

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

  <Accordion title="Modo GPT estritamente agêntico">
    Para execuções da família GPT-5 em `openai/*`, o OpenClaw pode usar um contrato de execução incorporado mais estrito:

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
    - Não trata mais um turno apenas com plano como progresso bem-sucedido quando uma ação de ferramenta está disponível
    - Tenta novamente o turno com uma orientação para agir agora
    - Ativa automaticamente `update_plan` para trabalhos substanciais
    - Expõe um estado bloqueado explícito se o modelo continuar planejando sem agir

    <Note>
    Escopo limitado apenas a execuções das famílias GPT-5 da OpenAI e do Codex. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs. compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, Codex e Azure OpenAI de forma diferente de proxies `/v1` genéricos compatíveis com OpenAI:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` apenas para modelos compatíveis com o esforço `none` da OpenAI
    - Omitem raciocínio desativado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Definem esquemas de ferramentas como modo estrito por padrão
    - Anexam cabeçalhos ocultos de atribuição apenas em hosts nativos verificados
    - Mantêm formatação de solicitação exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de raciocínio, dicas de cache de prompt)

    **Rotas proxy/compatíveis:**
    - Usam comportamento de compatibilidade mais flexível
    - Removem `store` de Completions de payloads `openai-completions` não nativos
    - Aceitam JSON avançado de passagem direta `params.extra_body`/`params.extraBody` para proxies Completions compatíveis com OpenAI
    - Aceitam `params.chat_template_kwargs` para proxies Completions compatíveis com OpenAI, como vLLM
    - Não forçam esquemas de ferramentas estritos nem cabeçalhos exclusivos de rotas nativas

    O Azure OpenAI usa transporte nativo e comportamento compatível, mas não recebe os cabeçalhos ocultos de atribuição.

  </Accordion>
</AccordionGroup>

## Relacionado

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
