---
read_when:
    - Você quer usar modelos da OpenAI no OpenClaw
    - Você quer usar a autenticação por assinatura do Codex em vez de chaves de API
    - Você precisa de um comportamento de execução de agentes GPT-5 mais rigoroso
summary: Use a OpenAI via chaves de API ou assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T05:55:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7e98179f5a7d90289ed6cdad1c4dd03834f42e3fcc747d24c7d29a47e103392
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fornece APIs de desenvolvedor para modelos GPT, e Codex também está disponível como um agente de codificação em planos do ChatGPT por meio dos clientes Codex da OpenAI. OpenClaw mantém essas superfícies separadas para que a configuração permaneça previsível.

OpenClaw oferece suporte a três rotas da família OpenAI. A maioria dos assinantes do ChatGPT/Codex que desejam o comportamento do Codex deve usar o runtime nativo app-server do Codex. O prefixo do modelo seleciona o provedor/nome do modelo; uma configuração de runtime separada seleciona quem executa o loop de agente incorporado:

- **Chave de API** - acesso direto à OpenAI Platform com cobrança baseada em uso (modelos `openai/*`)
- **Assinatura do Codex com runtime nativo do Codex** - login ChatGPT/Codex mais execução app-server do Codex (modelos `openai/*` mais `agents.defaults.agentRuntime.id: "codex"`)
- **Assinatura do Codex por meio do PI** - login ChatGPT/Codex com o executor PI normal do OpenClaw (modelos `openai-codex/*`)

OpenAI oferece suporte explícito ao uso de OAuth de assinatura em ferramentas e fluxos de trabalho externos como o OpenClaw.

Provedor, modelo, runtime e canal são camadas separadas. Se esses rótulos estiverem sendo misturados, leia [Runtimes de agente](/pt-BR/concepts/agent-runtimes) antes de alterar a configuração.

## Escolha rápida

| Objetivo                                             | Use                                              | Observações                                                               |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Assinatura ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-5.5` mais `agentRuntime.id: "codex"` | Configuração Codex recomendada para a maioria dos usuários. Faça login com autenticação `openai-codex`. |
| Cobrança direta por chave de API                     | `openai/gpt-5.5`                                 | Defina `OPENAI_API_KEY` ou execute a integração de chave de API da OpenAI. |
| Autenticação de assinatura ChatGPT/Codex por meio do PI | `openai-codex/gpt-5.5`                        | Use apenas quando você quiser intencionalmente o executor PI normal.      |
| Geração ou edição de imagens                         | `openai/gpt-image-2`                             | Funciona com `OPENAI_API_KEY` ou OAuth OpenAI Codex.                      |
| Imagens com fundo transparente                       | `openai/gpt-image-1.5`                           | Use `outputFormat=png` ou `webp` e `openai.background=transparent`.       |

## Mapa de nomes

Os nomes são semelhantes, mas não são intercambiáveis:

| Nome que você vê                   | Camada            | Significado                                                                                       |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefixo do provedor | Rota direta da API da OpenAI Platform.                                                          |
| `openai-codex`                     | Prefixo do provedor | Rota OAuth/assinatura OpenAI Codex por meio do executor PI normal do OpenClaw.                  |
| Plugin `codex`                     | Plugin            | Plugin OpenClaw incluído que fornece runtime nativo app-server do Codex e controles de chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime de agente | Força o ambiente app-server nativo do Codex para turnos incorporados.                            |
| `/codex ...`                       | Conjunto de comandos de chat | Vincula/controla threads app-server do Codex a partir de uma conversa.                |
| `runtime: "acp", agentId: "codex"` | Rota de sessão ACP | Caminho de fallback explícito que executa Codex por meio de ACP/acpx.                            |

Isso significa que uma configuração pode conter intencionalmente tanto `openai-codex/*` quanto o Plugin `codex`. Isso é válido quando você quer OAuth do Codex por meio do PI e também quer controles de chat nativos `/codex` disponíveis. `openclaw doctor` alerta sobre essa combinação para que você possa confirmar que ela é intencional; ele não a reescreve.

<Note>
GPT-5.5 está disponível tanto por acesso direto com chave de API da OpenAI Platform quanto por rotas de assinatura/OAuth. Para assinatura ChatGPT/Codex mais execução nativa do Codex, use `openai/gpt-5.5` com `agentRuntime.id: "codex"`. Use `openai-codex/gpt-5.5` apenas para OAuth do Codex por meio do PI, ou `openai/gpt-5.5` sem uma substituição de runtime do Codex para tráfego direto de `OPENAI_API_KEY`.
</Note>

<Note>
Habilitar o Plugin OpenAI, ou selecionar um modelo `openai-codex/*`, não habilita o Plugin app-server Codex incluído. OpenClaw habilita esse Plugin apenas quando você seleciona explicitamente o ambiente nativo do Codex com `agentRuntime.id: "codex"` ou usa uma referência de modelo legada `codex/*`.
Se o Plugin `codex` incluído estiver habilitado, mas `openai-codex/*` ainda resolver por meio do PI, `openclaw doctor` alerta e deixa a rota inalterada.
</Note>

## Cobertura de recursos do OpenClaw

| Capacidade da OpenAI     | Superfície do OpenClaw                                      | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | provedor de modelo `openai/<model>`                        | Sim                                                    |
| Modelos de assinatura Codex | `openai-codex/<model>` com OAuth `openai-codex`           | Sim                                                    |
| Ambiente app-server do Codex | `openai/<model>` com `agentRuntime.id: codex`            | Sim                                                    |
| Busca na web no lado do servidor | Ferramenta nativa OpenAI Responses                  | Sim, quando a busca na web está habilitada e nenhum provedor está fixado |
| Imagens                   | `image_generate`                                           | Sim                                                    |
| Vídeos                    | `video_generate`                                           | Sim                                                    |
| Texto para fala           | `messages.tts.provider: "openai"` / `tts`                  | Sim                                                    |
| Fala para texto em lote   | `tools.media.audio` / compreensão de mídia                 | Sim                                                    |
| Fala para texto por streaming | Voice Call `streaming.provider: "openai"`              | Sim                                                    |
| Voz em tempo real         | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sim                                                    |
| Embeddings                | provedor de embeddings de memória                          | Sim                                                    |

## Embeddings de memória

OpenClaw pode usar OpenAI, ou um endpoint de embeddings compatível com OpenAI, para indexação de `memory_search` e embeddings de consulta:

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

Para endpoints compatíveis com OpenAI que exigem rótulos de embedding assimétricos, defina `queryInputType` e `documentInputType` em `memorySearch`. OpenClaw encaminha esses valores como campos de solicitação `input_type` específicos do provedor: embeddings de consulta usam `queryInputType`; fragmentos de memória indexados e indexação em lote usam `documentInputType`. Consulte a [Referência de configuração de memória](/pt-BR/reference/memory-config#provider-specific-config) para ver o exemplo completo.

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

    ### Resumo de rotas

    | Referência de modelo   | Configuração de runtime     | Rota                        | Autenticação     |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitido / `agentRuntime.id: "pi"`    | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitido / `agentRuntime.id: "pi"`    | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Ambiente app-server do Codex | app-server do Codex |

    <Note>
    `openai/*` é a rota direta por chave de API da OpenAI, a menos que você force explicitamente o ambiente app-server do Codex. Use `openai-codex/*` para OAuth do Codex por meio do executor PI padrão, ou use `openai/gpt-5.5` com `agentRuntime.id: "codex"` para execução app-server nativa do Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **não** expõe `openai/gpt-5.3-codex-spark`. Solicitações reais à API OpenAI rejeitam esse modelo, e o catálogo Codex atual também não o expõe.
    </Warning>

  </Tab>

  <Tab title="Assinatura do Codex">
    **Ideal para:** usar sua assinatura ChatGPT/Codex com execução app-server nativa do Codex em vez de uma chave de API separada. A nuvem Codex exige login ChatGPT.

    <Steps>
      <Step title="Execute OAuth do Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou execute OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configurações headless ou hostis a callback, adicione `--device-code` para fazer login com um fluxo de código de dispositivo do ChatGPT em vez do callback do navegador em localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use o runtime nativo do Codex">
        ```bash
        openclaw config set plugins.entries.codex '{ enabled: true }' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{ id: "codex", fallback: "none" }' --strict-json
        ```
      </Step>
      <Step title="Verifique se a autenticação do Codex está disponível">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Depois que o Gateway estiver em execução, envie `/codex status` ou `/codex models` no chat para verificar o runtime app-server nativo.
      </Step>
    </Steps>

    ### Resumo de rotas

    | Referência de modelo | Configuração de runtime | Rota | Autenticação |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Ambiente app-server nativo do Codex | Login Codex ou perfil `openai-codex` selecionado |
    | `openai-codex/gpt-5.5` | omitido / `runtime: "pi"` | OAuth ChatGPT/Codex por meio do PI | Login Codex |
    | `openai-codex/gpt-5.4-mini` | omitido / `runtime: "pi"` | OAuth ChatGPT/Codex por meio do PI | Login Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Ainda usa PI, a menos que um Plugin reivindique explicitamente `openai-codex` | Login Codex |

    <Note>
    Continue usando o id de provedor `openai-codex` para comandos de autenticação/perfil. O
    prefixo de modelo `openai-codex/*` também é a rota PI explícita para OAuth do Codex.
    Ele não seleciona nem habilita automaticamente o harness de app-server Codex incluído. Para
    a configuração comum de assinatura mais runtime nativo, entre com
    `openai-codex`, mas mantenha a ref do modelo como `openai/gpt-5.5` e defina
    `agentRuntime.id: "codex"`.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    Para manter o OAuth do Codex no executor PI normal, use
    `openai-codex/gpt-5.5` e omita a substituição de runtime do Codex.

    <Note>
    O onboarding não importa mais material OAuth de `~/.codex`. Entre com OAuth pelo navegador (padrão) ou pelo fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de autenticação de agentes.
    </Note>

    ### Indicador de status

    O chat `/status` mostra qual runtime de modelo está ativo para a sessão atual.
    O harness PI padrão aparece como `Runtime: OpenClaw Pi Default`. Quando o
    harness de app-server Codex incluído é selecionado, `/status` mostra
    `Runtime: OpenAI Codex`. Sessões existentes mantêm seu id de harness registrado, então use
    `/new` ou `/reset` após alterar `agentRuntime` se quiser que `/status`
    reflita uma nova escolha de PI/Codex.

    ### Aviso do doctor

    Se o Plugin `codex` incluído estiver habilitado enquanto uma rota `openai-codex/*` estiver
    selecionada, `openclaw doctor` avisa que o modelo ainda é resolvido por meio do PI.
    Mantenha a configuração inalterada somente quando essa rota de autenticação por assinatura PI for
    intencional. Mude para `openai/<model>` mais `agentRuntime.id: "codex"` quando
    quiser execução nativa pelo app-server Codex.

    ### Limite da janela de contexto

    O OpenClaw trata metadados de modelo e o limite de contexto do runtime como valores separados.

    Para `openai-codex/gpt-5.5` por meio do OAuth do Codex:

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

    O OpenClaw usa metadados do catálogo upstream do Codex para `gpt-5.5` quando eles
    estão presentes. Se a descoberta ao vivo do Codex omitir a linha `openai-codex/gpt-5.5` enquanto
    a conta estiver autenticada, o OpenClaw sintetiza essa linha de modelo OAuth para que
    execuções de cron, subagente e modelo padrão configurado não falhem com
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticação do app-server Codex nativo

O harness de app-server Codex nativo usa refs de modelo `openai/*` mais
`agentRuntime.id: "codex"`, mas sua autenticação ainda é baseada em conta. O OpenClaw
seleciona a autenticação nesta ordem:

1. Um perfil de autenticação OpenClaw `openai-codex` explícito vinculado ao agente.
2. A conta existente do app-server, como um login local do Codex CLI ChatGPT.
3. Apenas para inicializações locais do app-server por stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando o app-server informa que não há conta e ainda exige
   autenticação da OpenAI.

Isso significa que um login local de assinatura ChatGPT/Codex não é substituído apenas
porque o processo Gateway também tem `OPENAI_API_KEY` para modelos OpenAI diretos
ou embeddings. O fallback por chave de API em env é apenas o caminho local de stdio sem conta; ele
não é enviado para conexões WebSocket do app-server. Quando um perfil Codex
estilo assinatura é selecionado, o OpenClaw também mantém `CODEX_API_KEY` e `OPENAI_API_KEY`
fora do processo filho stdio app-server gerado e envia as credenciais selecionadas
por meio do RPC de login do app-server.

## Geração de imagens

O Plugin `openai` incluído registra geração de imagens por meio da ferramenta `image_generate`.
Ele oferece suporte à geração de imagens com chave de API OpenAI e à geração de imagens com
OAuth do Codex por meio da mesma ref de modelo `openai/gpt-image-2`.

| Capacidade                | Chave de API OpenAI                | OAuth do Codex                       |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref do modelo             | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticação              | `OPENAI_API_KEY`                   | Login OAuth OpenAI Codex             |
| Transporte                | API OpenAI Images                  | Backend Codex Responses              |
| Máx. de imagens por solicitação | 4                            | 4                                    |
| Modo de edição            | Habilitado (até 5 imagens de referência) | Habilitado (até 5 imagens de referência) |
| Substituições de tamanho  | Compatíveis, incluindo tamanhos 2K/4K | Compatíveis, incluindo tamanhos 2K/4K |
| Proporção / resolução     | Não encaminhadas para a API OpenAI Images | Mapeadas para um tamanho compatível quando seguro |

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
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"`, e
`background: "transparent"`; a opção de provedor `openai.background` mais antiga
ainda é aceita. O OpenClaw também protege as rotas públicas OpenAI e
OAuth OpenAI Codex reescrevendo solicitações transparentes padrão `openai/gpt-image-2`
para `gpt-image-1.5`; Azure e endpoints personalizados compatíveis com OpenAI mantêm
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
`openclaw infer image edit` ao iniciar a partir de um arquivo de entrada.
`--openai-background` continua disponível como alias específico da OpenAI.

Para instalações com OAuth do Codex, mantenha a mesma ref `openai/gpt-image-2`. Quando um
perfil OAuth `openai-codex` está configurado, o OpenClaw resolve esse token de acesso OAuth
armazenado e envia solicitações de imagem por meio do backend Codex Responses. Ele
não tenta primeiro `OPENAI_API_KEY` nem faz fallback silencioso para uma chave de API para essa
solicitação. Configure `models.providers.openai` explicitamente com uma chave de API,
URL base personalizada ou endpoint Azure quando quiser a rota direta da API OpenAI Images.
Se esse endpoint de imagem personalizado estiver em um endereço LAN/privado confiável, defina também
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; o OpenClaw mantém
endpoints de imagem privados/internos compatíveis com OpenAI bloqueados, a menos que essa adesão esteja
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

O Plugin `openai` incluído registra geração de vídeo por meio da ferramenta `video_generate`.

| Capacidade            | Valor                                                                             |
| --------------------- | --------------------------------------------------------------------------------- |
| Modelo padrão         | `openai/sora-2`                                                                   |
| Modos                 | Texto para vídeo, imagem para vídeo, edição de vídeo único                        |
| Entradas de referência | 1 imagem ou 1 vídeo                                                              |
| Substituições de tamanho | Compatíveis                                                                      |
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

## Contribuição de prompt GPT-5

O OpenClaw adiciona uma contribuição compartilhada de prompt GPT-5 para execuções da família GPT-5 entre provedores. Ela se aplica pelo id do modelo, então `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e outras refs compatíveis com GPT-5 recebem a mesma sobreposição. Modelos GPT-4.x mais antigos não recebem.

O harness Codex nativo incluído usa o mesmo comportamento GPT-5 e a mesma sobreposição de Heartbeat por meio das instruções de desenvolvedor do app-server Codex, então sessões `openai/gpt-5.x` forçadas por `agentRuntime.id: "codex"` mantêm a mesma orientação de acompanhamento e Heartbeat proativo, embora o Codex controle o restante do prompt do harness.

A contribuição GPT-5 adiciona um contrato de comportamento marcado para persistência de persona, segurança de execução, disciplina de ferramentas, formato de saída, verificações de conclusão e verificação. O comportamento de resposta específico do canal e de mensagens silenciosas permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A orientação GPT-5 está sempre habilitada para modelos correspondentes. A camada de estilo de interação amigável é separada e configurável.

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
Os valores não diferenciam maiúsculas de minúsculas em runtime, então `"Off"` e `"off"` desabilitam a camada de estilo amigável.
</Tip>

<Note>
O `plugins.entries.openai.config.personality` legado ainda é lido como fallback de compatibilidade quando a configuração compartilhada `agents.defaults.promptOverlays.gpt5.personality` não está definida.
</Note>

## Voz e fala

<AccordionGroup>
  <Accordion title="Síntese de fala (TTS)">
    O Plugin `openai` incluído registra síntese de fala para a superfície `messages.tts`.

    | Configuração | Caminho da configuração | Padrão |
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
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base de TTS sem afetar o endpoint da API de chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    O Plugin `openai` incluído registra fala para texto em lote por meio da
    superfície de transcrição de compreensão de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: REST da OpenAI `/v1/audio/transcriptions`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível com o OpenClaw onde quer que a transcrição de áudio de entrada use
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e anexos
      de áudio de canais

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

  <Accordion title="Realtime transcription">
    O Plugin `openai` incluído registra transcrição em tempo real para o Plugin Voice Call.

    | Configuração | Caminho da configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (não definido) |
    | Prompt | `...openai.prompt` | (não definido) |
    | Duração do silêncio | `...openai.silenceDurationMs` | `800` |
    | Limite de VAD | `...openai.vadThreshold` | `0.5` |
    | Chave de API | `...openai.apiKey` | Recorre a `OPENAI_API_KEY` |

    <Note>
    Usa uma conexão WebSocket com `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este provedor de streaming é para o caminho de transcrição em tempo real do Voice Call; atualmente, a voz do Discord grava segmentos curtos e usa o caminho de transcrição em lote `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    O Plugin `openai` incluído registra voz em tempo real para o Plugin Voice Call.

    | Configuração | Caminho da configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Limite de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Chave de API | `...openai.apiKey` | Recorre a `OPENAI_API_KEY` |

    <Note>
    Compatível com Azure OpenAI por meio das chaves de configuração `azureEndpoint` e `azureDeployment` para pontes de tempo real de backend. Compatível com chamadas de ferramentas bidirecionais. Usa o formato de áudio G.711 u-law.
    </Note>

    <Note>
    O Talk da UI de Controle usa sessões em tempo real no navegador da OpenAI com um segredo
    efêmero de cliente cunhado pelo Gateway e uma troca SDP WebRTC direta do navegador com a
    API Realtime da OpenAI. A verificação ao vivo do mantenedor está disponível com
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    a parte da OpenAI cunha um segredo de cliente no Node, gera uma oferta SDP do navegador
    com mídia de microfone falsa, publica-a na OpenAI e aplica a resposta SDP
    sem registrar segredos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints da Azure OpenAI

O provedor `openai` incluído pode apontar para um recurso da Azure OpenAI para geração de imagens
ao substituir a URL base. No caminho de geração de imagens, o OpenClaw
detecta nomes de host da Azure em `models.providers.openai.baseUrl` e muda para
o formato de solicitação da Azure automaticamente.

<Note>
A voz em tempo real usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Veja o acordeão **Realtime
voice** em [Voz e fala](#voice-and-speech) para suas configurações da Azure.
</Note>

Use a Azure OpenAI quando:

- Você já tiver uma assinatura, cota ou contrato empresarial da Azure OpenAI
- Você precisar de residência de dados regional ou controles de conformidade que a Azure oferece
- Você quiser manter o tráfego dentro de uma locação existente da Azure

### Configuração

Para geração de imagens da Azure por meio do provedor `openai` incluído, aponte
`models.providers.openai.baseUrl` para seu recurso da Azure e defina `apiKey` como
a chave da Azure OpenAI (não uma chave da OpenAI Platform):

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

O OpenClaw reconhece estes sufixos de host da Azure para a rota de geração de imagens
da Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitações de geração de imagens em um host da Azure reconhecido, o OpenClaw:

- Envia o cabeçalho `api-key` em vez de `Authorization: Bearer`
- Usa caminhos com escopo de implantação (`/openai/deployments/{deployment}/...`)
- Acrescenta `?api-version=...` a cada solicitação
- Usa um tempo limite padrão de solicitação de 600s para chamadas de geração de imagens da Azure.
  Valores `timeoutMs` por chamada ainda substituem esse padrão.

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato padrão
de solicitação de imagem da OpenAI.

<Note>
O roteamento da Azure para o caminho de geração de imagens do provedor `openai` requer
OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizado como o endpoint público da OpenAI e falharão com implantações
de imagem da Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão específica de prévia ou GA da Azure
para o caminho de geração de imagens da Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Nomes de modelo são nomes de implantação

A Azure OpenAI vincula modelos a implantações. Para solicitações de geração de imagens da Azure
roteadas pelo provedor `openai` incluído, o campo `model` no OpenClaw
deve ser o **nome da implantação da Azure** que você configurou no portal da Azure, não
o id público do modelo da OpenAI.

Se você criar uma implantação chamada `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

A mesma regra de nome de implantação se aplica a chamadas de geração de imagens roteadas pelo
provedor `openai` incluído.

### Disponibilidade regional

A geração de imagens da Azure está atualmente disponível apenas em um subconjunto de regiões
(por exemplo, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Verifique a lista atual de regiões da Microsoft antes de criar uma
implantação e confirme se o modelo específico é oferecido na sua região.

### Diferenças de parâmetros

A Azure OpenAI e a OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
A Azure pode rejeitar opções que a OpenAI pública permite (por exemplo, certos
valores de `background` em `gpt-image-2`) ou expô-las apenas em versões específicas
do modelo. Essas diferenças vêm da Azure e do modelo subjacente, não do
OpenClaw. Se uma solicitação da Azure falhar com um erro de validação, verifique o
conjunto de parâmetros compatível com sua implantação e versão de API específicas no
portal da Azure.

<Note>
A Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe
os cabeçalhos de atribuição ocultos do OpenClaw — veja o acordeão **Rotas nativas vs. compatíveis com OpenAI**
em [Configuração avançada](#advanced-configuration).

Para tráfego de chat ou Responses na Azure (além de geração de imagens), use o
fluxo de integração ou uma configuração de provedor da Azure dedicada — `openai.baseUrl` sozinho
não adota o formato de API/autenticação da Azure. Um provedor
`azure-openai-responses/*` separado existe; veja
o acordeão de compactação do lado do servidor abaixo.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) tanto para `openai/*` quanto para `openai-codex/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de recorrer a SSE
    - Após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o resfriamento
    - Anexa cabeçalhos estáveis de identidade de sessão e turno para novas tentativas e reconexões
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamento |
    |-------|----------|
    | `"auto"` (padrão) | WebSocket primeiro, fallback para SSE |
    | `"sse"` | Força somente SSE |
    | `"websocket"` | Força somente WebSocket |

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

  <Accordion title="WebSocket warm-up">
    O OpenClaw habilita o aquecimento de WebSocket por padrão para `openai/*` e `openai-codex/*` para reduzir a latência do primeiro turno.

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

  <Accordion title="Fast mode">
    O OpenClaw expõe uma alternância compartilhada de modo rápido para `openai/*` e `openai-codex/*`:

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
    Substituições de sessão têm precedência sobre a configuração. Limpar a substituição de sessão na UI de Sessões retorna a sessão ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
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
    Para modelos OpenAI Responses diretos (`openai/*` em `api.openai.com`), o wrapper de stream do harness Pi do Plugin OpenAI habilita automaticamente a Compaction no lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    Isso se aplica ao caminho integrado do harness Pi e aos hooks do provedor OpenAI usados por execuções incorporadas. O harness nativo do servidor de aplicativo Codex gerencia o próprio contexto por meio do Codex e é configurado separadamente com `agents.defaults.agentRuntime.id`.

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

  <Accordion title="Modo GPT agentic estrito">
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
    - Não trata mais um turno apenas de plano como progresso bem-sucedido quando uma ação de ferramenta está disponível
    - Tenta novamente o turno com um direcionamento para agir agora
    - Habilita automaticamente `update_plan` para trabalho substancial
    - Exibe um estado bloqueado explícito se o modelo continuar planejando sem agir

    <Note>
    Restrito apenas a execuções da família GPT-5 da OpenAI e do Codex. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, Codex e Azure OpenAI de forma diferente de proxies `/v1` genéricos compatíveis com OpenAI:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` apenas para modelos compatíveis com o esforço `none` da OpenAI
    - Omitem o raciocínio desabilitado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Definem esquemas de ferramentas como modo estrito por padrão
    - Anexam cabeçalhos ocultos de atribuição apenas em hosts nativos verificados
    - Mantêm a formatação de requisição exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de raciocínio, dicas de cache de prompt)

    **Rotas de proxy/compatíveis:**
    - Usam comportamento de compatibilidade mais flexível
    - Removem `store` de Completions de payloads `openai-completions` não nativos
    - Aceitam JSON de repasse avançado `params.extra_body`/`params.extraBody` para proxies de Completions compatíveis com OpenAI
    - Aceitam `params.chat_template_kwargs` para proxies de Completions compatíveis com OpenAI, como vLLM
    - Não forçam esquemas de ferramentas estritos nem cabeçalhos exclusivos de rotas nativas

    O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe os cabeçalhos ocultos de atribuição.

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
