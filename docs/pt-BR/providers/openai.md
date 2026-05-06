---
read_when:
    - Você quer usar modelos da OpenAI no OpenClaw
    - Você quer autenticação por assinatura do Codex em vez de chaves de API
    - Você precisa de um comportamento de execução de agente GPT-5 mais rigoroso
summary: Use a OpenAI por meio de chaves de API ou de uma assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T09:11:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5606cafb8dfec888b922874202aa0fdcad8cbd4fec1a1e15a9074ad14bc5486
    source_path: providers/openai.md
    workflow: 16
---

A OpenAI fornece APIs de desenvolvedor para modelos GPT, e o Codex também está disponível como um agente de programação de plano ChatGPT por meio dos clientes Codex da OpenAI. O OpenClaw mantém essas superfícies separadas para que a configuração permaneça previsível.

O OpenClaw oferece suporte a três rotas da família OpenAI. A maioria dos assinantes do ChatGPT/Codex que desejam o comportamento do Codex deve usar o runtime nativo do servidor de aplicativo do Codex. O prefixo do modelo seleciona o provedor/nome do modelo; uma configuração de runtime separada seleciona quem executa o loop do agente incorporado:

- **Chave de API** - acesso direto à OpenAI Platform com cobrança baseada em uso (modelos `openai/*`)
- **Assinatura do Codex com runtime nativo do Codex** - login do ChatGPT/Codex mais execução no servidor de aplicativo do Codex (modelos `openai/*` mais `agents.defaults.agentRuntime.id: "codex"`)
- **Assinatura do Codex por meio do PI** - login do ChatGPT/Codex com o executor PI normal do OpenClaw (modelos `openai-codex/*`)

A OpenAI oferece suporte explícito ao uso de OAuth de assinatura em ferramentas e fluxos de trabalho externos como o OpenClaw.

Provedor, modelo, runtime e canal são camadas separadas. Se esses rótulos estiverem sendo misturados, leia [Runtimes de agentes](/pt-BR/concepts/agent-runtimes) antes de alterar a configuração.

## Escolha rápida

| Objetivo                                             | Use                                              | Observações                                                               |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Assinatura do ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-5.5` mais `agentRuntime.id: "codex"` | Configuração recomendada do Codex para a maioria dos usuários. Faça login com a autenticação `openai-codex`. |
| Cobrança direta por chave de API                     | `openai/gpt-5.5`                                 | Defina `OPENAI_API_KEY` ou execute a integração com chave de API da OpenAI. |
| Autenticação de assinatura do ChatGPT/Codex por meio do PI | `openai-codex/gpt-5.5`                           | Use somente quando você quiser intencionalmente o executor PI normal.     |
| Geração ou edição de imagens                         | `openai/gpt-image-2`                             | Funciona com `OPENAI_API_KEY` ou OAuth do OpenAI Codex.                   |
| Imagens com fundo transparente                       | `openai/gpt-image-1.5`                           | Use `outputFormat=png` ou `webp` e `openai.background=transparent`.       |

## Mapa de nomes

Os nomes são semelhantes, mas não intercambiáveis:

| Nome que você vê                    | Camada            | Significado                                                                                      |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefixo do provedor | Rota direta da API da OpenAI Platform.                                                            |
| `openai-codex`                     | Prefixo do provedor | Rota OAuth/assinatura do OpenAI Codex por meio do executor PI normal do OpenClaw.                 |
| Plugin `codex`                     | Plugin            | Plugin integrado do OpenClaw que fornece runtime nativo do servidor de aplicativo do Codex e controles de chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime do agente | Força o harness nativo do servidor de aplicativo do Codex para turnos incorporados.               |
| `/codex ...`                       | Conjunto de comandos de chat | Vincule/controle threads do servidor de aplicativo do Codex a partir de uma conversa.             |
| `runtime: "acp", agentId: "codex"` | Rota de sessão ACP | Caminho de fallback explícito que executa o Codex por meio de ACP/acpx.                           |

Isso significa que uma configuração pode conter intencionalmente tanto `openai-codex/*` quanto o Plugin `codex`. Isso é válido quando você quer OAuth do Codex por meio do PI e também quer que os controles de chat nativos `/codex` estejam disponíveis. `openclaw doctor` alerta sobre essa combinação para que você possa confirmar que ela é intencional; ele não a reescreve.

<Note>
O GPT-5.5 está disponível tanto por acesso direto com chave de API da OpenAI Platform quanto por rotas de assinatura/OAuth. Para assinatura do ChatGPT/Codex mais execução nativa do Codex, use `openai/gpt-5.5` com `agentRuntime.id: "codex"`. Use `openai-codex/gpt-5.5` somente para OAuth do Codex por meio do PI, ou `openai/gpt-5.5` sem uma substituição de runtime do Codex para tráfego direto de `OPENAI_API_KEY`.
</Note>

<Note>
Ativar o Plugin da OpenAI, ou selecionar um modelo `openai-codex/*`, não ativa o Plugin integrado do servidor de aplicativo do Codex. O OpenClaw ativa esse Plugin somente quando você seleciona explicitamente o harness nativo do Codex com `agentRuntime.id: "codex"` ou usa uma referência de modelo legada `codex/*`.
Se o Plugin integrado `codex` estiver ativado, mas `openai-codex/*` ainda resolver por meio do PI, `openclaw doctor` alerta e deixa a rota inalterada.
</Note>

## Cobertura de recursos do OpenClaw

| Capacidade da OpenAI       | Superfície do OpenClaw                                     | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Provedor de modelo `openai/<model>`                        | Sim                                                    |
| Modelos de assinatura do Codex | `openai-codex/<model>` com OAuth `openai-codex`        | Sim                                                    |
| Harness do servidor de aplicativo do Codex | `openai/<model>` com `agentRuntime.id: codex` | Sim                                                    |
| Pesquisa na web do lado do servidor | Ferramenta nativa OpenAI Responses                | Sim, quando a pesquisa na web está ativada e nenhum provedor está fixado |
| Imagens                   | `image_generate`                                           | Sim                                                    |
| Vídeos                    | `video_generate`                                           | Sim                                                    |
| Texto para fala           | `messages.tts.provider: "openai"` / `tts`                  | Sim                                                    |
| Fala para texto em lote   | `tools.media.audio` / compreensão de mídia                 | Sim                                                    |
| Fala para texto por streaming | Voice Call `streaming.provider: "openai"`              | Sim                                                    |
| Voz em tempo real         | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sim                                                    |
| Embeddings                | Provedor de embeddings de memória                          | Sim                                                    |

## Embeddings de memória

O OpenClaw pode usar a OpenAI, ou um endpoint de embeddings compatível com OpenAI, para embeddings de indexação e consulta de `memory_search`:

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

Para endpoints compatíveis com OpenAI que exigem rótulos de embedding assimétricos, defina `queryInputType` e `documentInputType` em `memorySearch`. O OpenClaw encaminha esses valores como campos de solicitação `input_type` específicos do provedor: embeddings de consulta usam `queryInputType`; blocos de memória indexados e indexação em lote usam `documentInputType`. Consulte a [Referência de configuração de memória](/pt-BR/reference/memory-config#provider-specific-config) para o exemplo completo.

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API (OpenAI Platform)">
    **Ideal para:** acesso direto à API e cobrança baseada em uso.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API no [painel da OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Execute a integração">
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

    | Referência de modelo   | Configuração de runtime    | Rota                        | Autenticação     |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitido / `agentRuntime.id: "pi"`    | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitido / `agentRuntime.id: "pi"`    | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Harness do servidor de aplicativo do Codex | Servidor de aplicativo do Codex |

    <Note>
    `openai/*` é a rota direta com chave de API da OpenAI, a menos que você force explicitamente o harness do servidor de aplicativo do Codex. Use `openai-codex/*` para OAuth do Codex por meio do executor PI padrão, ou use `openai/gpt-5.5` com `agentRuntime.id: "codex"` para execução nativa no servidor de aplicativo do Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark`. Solicitações ativas à API da OpenAI rejeitam esse modelo, e o catálogo atual do Codex também não o expõe.
    </Warning>

  </Tab>

  <Tab title="Assinatura do Codex">
    **Ideal para:** usar sua assinatura do ChatGPT/Codex com execução nativa no servidor de aplicativo do Codex em vez de uma chave de API separada. O Codex na nuvem exige login no ChatGPT.

    <Steps>
      <Step title="Execute o OAuth do Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configurações sem interface gráfica ou hostis a callbacks, adicione `--device-code` para fazer login com um fluxo de código de dispositivo do ChatGPT em vez do callback do navegador localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use o runtime nativo do Codex">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Verifique se a autenticação do Codex está disponível">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Depois que o Gateway estiver em execução, envie `/codex status` ou `/codex models`
        no chat para verificar o runtime nativo do servidor de aplicativo.
      </Step>
    </Steps>

    ### Resumo da rota

    | Referência de modelo | Configuração de runtime | Rota | Autenticação |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness nativo do servidor de aplicativo do Codex | Login do Codex ou perfil `openai-codex` selecionado |
    | `openai-codex/gpt-5.5` | omitido / `runtime: "pi"` | OAuth do ChatGPT/Codex por meio do PI | Login do Codex |
    | `openai-codex/gpt-5.4-mini` | omitido / `runtime: "pi"` | OAuth do ChatGPT/Codex por meio do PI | Login do Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Ainda PI, a menos que um Plugin reivindique explicitamente `openai-codex` | Login do Codex |

    <Warning>
    Não configure referências de modelos `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ou `openai-codex/gpt-5.3*` mais antigas. Contas OAuth do ChatGPT/Codex agora rejeitam esses modelos. Use `openai-codex/gpt-5.5` para a rota OAuth do PI, ou `openai/gpt-5.5` com `agentRuntime.id: "codex"` para execução nativa no runtime do Codex.
    </Warning>

    <Note>
    Continue usando o id de provedor `openai-codex` para comandos de autenticação/perfil. O
    prefixo de modelo `openai-codex/*` também é a rota PI explícita para o OAuth do Codex.
    Ele não seleciona nem habilita automaticamente o harness de app-server Codex incluído. Para
    a configuração comum de assinatura mais runtime nativo, entre com
    `openai-codex`, mas mantenha a referência de modelo como `openai/gpt-5.5` e defina
    `agentRuntime.id: "codex"`.
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

    Para manter o OAuth do Codex no executor PI normal, use
    `openai-codex/gpt-5.5` e omita a substituição do runtime Codex.

    <Note>
    O onboarding não importa mais material de OAuth de `~/.codex`. Entre com OAuth pelo navegador (padrão) ou pelo fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de autenticação de agentes.
    </Note>

    ### Indicador de status

    O chat `/status` mostra qual runtime de modelo está ativo para a sessão atual.
    O harness PI padrão aparece como `Runtime: OpenClaw Pi Default`. Quando o
    harness de app-server Codex incluído é selecionado, `/status` mostra
    `Runtime: OpenAI Codex`. Sessões existentes mantêm o id de harness registrado, então use
    `/new` ou `/reset` depois de alterar `agentRuntime` se quiser que `/status`
    reflita uma nova escolha PI/Codex.

    ### Aviso do doctor

    Se o Plugin `codex` incluído estiver habilitado enquanto uma rota `openai-codex/*` estiver
    selecionada, `openclaw doctor` avisa que o modelo ainda é resolvido pelo PI.
    Mantenha a configuração inalterada somente quando essa rota de autenticação por assinatura do PI for
    intencional. Mude para `openai/<model>` mais `agentRuntime.id: "codex"` quando
    quiser execução nativa pelo app-server Codex.

    ### Limite da janela de contexto

    O OpenClaw trata os metadados do modelo e o limite de contexto do runtime como valores separados.

    Para `openai-codex/gpt-5.5` pelo OAuth do Codex:

    - `contextWindow` nativo: `1000000`
    - Limite padrão de `contextTokens` do runtime: `272000`

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
    Use `contextWindow` para declarar metadados nativos do modelo. Use `contextTokens` para limitar o orçamento de contexto do runtime.
    </Note>

    ### Recuperação do catálogo

    O OpenClaw usa metadados do catálogo upstream do Codex para `gpt-5.5` quando eles estão
    presentes. Se a descoberta Codex ao vivo omitir a linha `openai-codex/gpt-5.5` enquanto
    a conta estiver autenticada, o OpenClaw sintetiza essa linha de modelo OAuth para que
    execuções de cron, subagente e modelo padrão configurado não falhem com
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticação nativa do app-server Codex

O harness nativo do app-server Codex usa referências de modelo `openai/*` mais
`agentRuntime.id: "codex"`, mas sua autenticação ainda é baseada em conta. O OpenClaw
seleciona a autenticação nesta ordem:

1. Um perfil de autenticação OpenClaw `openai-codex` explícito vinculado ao agente.
2. A conta existente do app-server, como uma entrada local no ChatGPT pela CLI Codex.
3. Somente para inicializações locais de app-server por stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando o app-server não relata nenhuma conta e ainda exige
   autenticação OpenAI.

Isso significa que uma entrada local por assinatura ChatGPT/Codex não é substituída só
porque o processo do Gateway também tem `OPENAI_API_KEY` para modelos OpenAI diretos
ou embeddings. O fallback de chave de API por env é apenas o caminho local stdio sem conta; ele
não é enviado a conexões WebSocket do app-server. Quando um perfil Codex em estilo de assinatura
é selecionado, o OpenClaw também mantém `CODEX_API_KEY` e `OPENAI_API_KEY`
fora do processo filho stdio do app-server gerado e envia as credenciais selecionadas
pelo RPC de login do app-server.

## Geração de imagens

O Plugin `openai` incluído registra geração de imagens pela ferramenta `image_generate`.
Ele oferece suporte tanto à geração de imagens com chave de API OpenAI quanto à geração de imagens com OAuth do Codex
pela mesma referência de modelo `openai/gpt-image-2`.

| Capacidade                | Chave de API OpenAI                | OAuth do Codex                       |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Referência de modelo      | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticação              | `OPENAI_API_KEY`                   | Entrada por OAuth do OpenAI Codex    |
| Transporte                | API OpenAI Images                  | Backend Codex Responses              |
| Máx. de imagens por solicitação | 4                                  | 4                                    |
| Modo de edição            | Habilitado (até 5 imagens de referência) | Habilitado (até 5 imagens de referência) |
| Substituições de tamanho  | Compatíveis, incluindo tamanhos 2K/4K | Compatíveis, incluindo tamanhos 2K/4K |
| Proporção / resolução     | Não encaminhada à API OpenAI Images | Mapeada para um tamanho compatível quando seguro |

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
Consulte [Geração de imagens](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

`gpt-image-2` é o padrão tanto para geração de texto para imagem da OpenAI quanto para edição de imagens.
`gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` continuam utilizáveis como
substituições explícitas de modelo. Use `openai/gpt-image-1.5` para saída
PNG/WebP com fundo transparente; a API atual de `gpt-image-2` rejeita
`background: "transparent"`.

Para uma solicitação com fundo transparente, os agentes devem chamar `image_generate` com
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"` e
`background: "transparent"`; a opção de provedor mais antiga `openai.background` ainda é
aceita. O OpenClaw também protege as rotas públicas OpenAI e
OAuth OpenAI Codex reescrevendo solicitações transparentes padrão de `openai/gpt-image-2`
para `gpt-image-1.5`; endpoints Azure e personalizados compatíveis com OpenAI mantêm
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
`openclaw infer image edit` ao começar a partir de um arquivo de entrada.
`--openai-background` continua disponível como alias específico da OpenAI.

Para instalações com OAuth do Codex, mantenha a mesma referência `openai/gpt-image-2`. Quando um
perfil OAuth `openai-codex` é configurado, o OpenClaw resolve esse token de acesso OAuth
armazenado e envia solicitações de imagem pelo backend Codex Responses. Ele
não tenta primeiro `OPENAI_API_KEY` nem faz fallback silencioso para uma chave de API nessa
solicitação. Configure `models.providers.openai` explicitamente com uma chave de API,
URL base personalizada ou endpoint Azure quando quiser a rota direta da API OpenAI Images.
Se esse endpoint de imagem personalizado estiver em uma LAN/endereço privado confiável, defina também
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; o OpenClaw mantém
endpoints de imagem privados/internos compatíveis com OpenAI bloqueados, a menos que esse opt-in esteja
presente.

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

| Capacidade            | Valor                                                                             |
| --------------------- | --------------------------------------------------------------------------------- |
| Modelo padrão         | `openai/sora-2`                                                                   |
| Modos                 | Texto para vídeo, imagem para vídeo, edição de vídeo único                        |
| Entradas de referência | 1 imagem ou 1 vídeo                                                               |
| Substituições de tamanho | Compatíveis                                                                         |
| Outras substituições  | `aspectRatio`, `resolution`, `audio`, `watermark` são ignorados com um aviso da ferramenta |

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

O OpenClaw adiciona uma contribuição de prompt GPT-5 compartilhada para execuções da família GPT-5 entre provedores. Ela se aplica por id de modelo, então `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e outras referências GPT-5 compatíveis recebem a mesma sobreposição. Modelos GPT-4.x mais antigos não recebem.

O harness Codex nativo incluído usa o mesmo comportamento GPT-5 e a mesma sobreposição de Heartbeat por meio de instruções de desenvolvedor do app-server Codex, então sessões `openai/gpt-5.x` forçadas por `agentRuntime.id: "codex"` mantêm a mesma orientação de acompanhamento e Heartbeat proativo, embora o Codex controle o restante do prompt do harness.

A contribuição GPT-5 adiciona um contrato de comportamento marcado para persistência de persona, segurança de execução, disciplina de ferramentas, formato da saída, verificações de conclusão e verificação. O comportamento de resposta específico do canal e de mensagem silenciosa permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A orientação GPT-5 está sempre habilitada para modelos correspondentes. A camada de estilo de interação amigável é separada e configurável.

| Valor                  | Efeito                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (padrão)  | Habilita a camada de estilo de interação amigável |
| `"on"`                 | Alias para `"friendly"`                     |
| `"off"`                | Desabilita apenas a camada de estilo amigável |

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
`plugins.entries.openai.config.personality` legado ainda é lido como fallback de compatibilidade quando a configuração compartilhada `agents.defaults.promptOverlays.gpt5.personality` não está definida.
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
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para mensagens de voz, `mp3` para arquivos |
    | Chave de API | `messages.tts.providers.openai.apiKey` | Recai para `OPENAI_API_KEY` |
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
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base de TTS sem afetar o endpoint da API de chat.
    </Note>

  </Accordion>

  <Accordion title="Fala para texto">
    O Plugin `openai` incluído registra fala para texto em lote por meio
    da superfície de transcrição de entendimento de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível com o OpenClaw em todos os locais onde a transcrição de áudio de entrada usa
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
    | Chave de API | `...openai.apiKey` | Recai para `OPENAI_API_KEY` |

    <Note>
    Usa uma conexão WebSocket com `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este provedor de streaming é para o caminho de transcrição em tempo real do Voice Call; atualmente, voz do Discord grava segmentos curtos e usa o caminho de transcrição em lote `tools.media.audio`.
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
    | Chave de API | `...openai.apiKey` | Recai para `OPENAI_API_KEY` |

    <Note>
    Oferece suporte ao Azure OpenAI por meio das chaves de configuração `azureEndpoint` e `azureDeployment` para pontes em tempo real de backend. Oferece suporte a chamadas de ferramentas bidirecionais. Usa o formato de áudio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk usa sessões em tempo real da OpenAI no navegador com um segredo
    efêmero de cliente emitido pelo Gateway e uma troca direta de SDP WebRTC no navegador contra a
    OpenAI Realtime API. A verificação ao vivo do mantenedor está disponível com
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    a etapa da OpenAI emite um segredo de cliente no Node, gera uma oferta SDP do navegador
    com mídia de microfone falsa, publica-a na OpenAI e aplica a resposta SDP
    sem registrar segredos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints do Azure OpenAI

O provedor `openai` incluído pode direcionar uma recurso do Azure OpenAI para geração
de imagens substituindo a URL base. No caminho de geração de imagens, o OpenClaw
detecta nomes de host do Azure em `models.providers.openai.baseUrl` e alterna para
o formato de solicitação do Azure automaticamente.

<Note>
A voz em tempo real usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Veja o acordeão **Voz em tempo real**
em [Voz e fala](#voice-and-speech) para suas configurações do Azure.
</Note>

Use Azure OpenAI quando:

- Você já tem uma assinatura, cota ou contrato empresarial do Azure OpenAI
- Você precisa de residência regional de dados ou controles de conformidade fornecidos pelo Azure
- Você quer manter o tráfego dentro de uma locação existente do Azure

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

Para solicitações de geração de imagens em um host do Azure reconhecido, o OpenClaw:

- Envia o cabeçalho `api-key` em vez de `Authorization: Bearer`
- Usa caminhos com escopo de implantação (`/openai/deployments/{deployment}/...`)
- Acrescenta `?api-version=...` a cada solicitação
- Usa um tempo limite padrão de solicitação de 600s para chamadas de geração de imagens do Azure.
  Valores `timeoutMs` por chamada ainda substituem esse padrão.

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato
padrão de solicitação de imagem da OpenAI.

<Note>
O roteamento do Azure para o caminho de geração de imagens do provedor `openai` exige
OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizado como o endpoint público da OpenAI e falharão contra implantações
de imagem do Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão específica preview ou GA do Azure
para o caminho de geração de imagens do Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Nomes de modelo são nomes de implantação

O Azure OpenAI vincula modelos a implantações. Para solicitações de geração de imagens do Azure
roteadas pelo provedor `openai` incluído, o campo `model` no OpenClaw
deve ser o **nome da implantação do Azure** que você configurou no portal do Azure, não
o id público do modelo da OpenAI.

Se você criar uma implantação chamada `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

A mesma regra de nome de implantação se aplica a chamadas de geração de imagens roteadas por meio
do provedor `openai` incluído.

### Disponibilidade regional

A geração de imagens do Azure está atualmente disponível apenas em um subconjunto de regiões
(por exemplo, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Verifique a lista atual de regiões da Microsoft antes de criar uma
implantação e confirme que o modelo específico é oferecido na sua região.

### Diferenças de parâmetros

O Azure OpenAI e a OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções que a OpenAI pública permite (por exemplo, certos
valores de `background` em `gpt-image-2`) ou expô-las apenas em versões de modelo
específicas. Essas diferenças vêm do Azure e do modelo subjacente, não
do OpenClaw. Se uma solicitação do Azure falhar com um erro de validação, verifique o
conjunto de parâmetros compatível com sua implantação e versão de API específicas no
portal do Azure.

<Note>
O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe
os cabeçalhos ocultos de atribuição do OpenClaw — veja o acordeão **Rotas nativas vs compatíveis com OpenAI**
em [Configuração avançada](#advanced-configuration).

Para tráfego de chat ou Responses no Azure (além de geração de imagens), use o
fluxo de integração ou uma configuração dedicada de provedor Azure — `openai.baseUrl` sozinho
não adota o formato de API/autenticação do Azure. Um provedor separado
`azure-openai-responses/*` existe; veja
o acordeão de Compaction no lado do servidor abaixo.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) tanto para `openai/*` quanto para `openai-codex/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de fazer fallback para SSE
    - Após uma falha, marca WebSocket como degradado por cerca de 60 segundos e usa SSE durante o resfriamento
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
            "openai-codex/gpt-5.5": {
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

  <Accordion title="Aquecimento de WebSocket">
    O OpenClaw habilita aquecimento de WebSocket por padrão para `openai/*` e `openai-codex/*` a fim de reduzir a latência do primeiro turno.

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
    O OpenClaw expõe uma alternância compartilhada de modo rápido para `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuração:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando habilitado, o OpenClaw mapeia o modo rápido para o processamento prioritário da OpenAI (`service_tier = "priority"`). Valores `service_tier` existentes são preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`.

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
    Substituições de sessão prevalecem sobre a configuração. Limpar a substituição de sessão na UI Sessions retorna a sessão para o padrão configurado.
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
    `serviceTier` é encaminhado apenas para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você rotear qualquer um dos provedores por meio de um proxy, o OpenClaw deixa `service_tier` inalterado.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no lado do servidor (Responses API)">
    Para modelos OpenAI Responses diretos (`openai/*` em `api.openai.com`), o wrapper de stream Pi-harness do Plugin da OpenAI habilita automaticamente a Compaction no lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    Isso se aplica ao caminho Pi harness integrado e aos hooks do provedor OpenAI usados por execuções incorporadas. O harness do servidor de app Codex nativo gerencia seu próprio contexto por meio do Codex e é configurado separadamente com `agents.defaults.agentRuntime.id`.

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

  <Accordion title="Modo GPT strict-agentic">
    Para execuções da família GPT-5 em `openai/*`, o OpenClaw pode usar um contrato de execução embutido mais estrito:

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
    - Habilita automaticamente `update_plan` para trabalhos substanciais
    - Mostra um estado bloqueado explícito se o modelo continuar planejando sem agir

    <Note>
    Limitado apenas a execuções da família GPT-5 da OpenAI e do Codex. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs. compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, Codex e Azure OpenAI de forma diferente de proxies `/v1` genéricos compatíveis com OpenAI:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` apenas para modelos que aceitam o esforço `none` da OpenAI
    - Omitem raciocínio desabilitado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Usam modo estrito por padrão em esquemas de ferramentas
    - Anexam cabeçalhos de atribuição ocultos apenas em hosts nativos verificados
    - Mantêm a modelagem de requisição exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de raciocínio, dicas de cache de prompt)

    **Rotas de proxy/compatíveis:**
    - Usam comportamento de compatibilidade mais flexível
    - Removem `store` de Completions de payloads `openai-completions` não nativos
    - Aceitam JSON avançado de repasse `params.extra_body`/`params.extraBody` para proxies de Completions compatíveis com OpenAI
    - Aceitam `params.chat_template_kwargs` para proxies de Completions compatíveis com OpenAI, como vLLM
    - Não forçam esquemas de ferramentas estritos nem cabeçalhos exclusivos de rotas nativas

    O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe os cabeçalhos de atribuição ocultos.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados de ferramentas de imagem e seleção de provedores.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados de ferramentas de vídeo e seleção de provedores.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
