---
read_when:
    - Você quer usar modelos OpenAI no OpenClaw
    - Você quer autenticação por assinatura Codex em vez de chaves de API
    - Você precisa de um comportamento de execução de agente GPT-5 mais restrito
summary: Use o OpenAI via chaves de API ou assinatura Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T06:08:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8337990d0de692b32746b05ab344695fc5a54ab3855993ac7795fabf38d4d19d
    source_path: providers/openai.md
    workflow: 15
---

A OpenAI fornece APIs de desenvolvedor para modelos GPT. O OpenClaw oferece suporte a três rotas da família OpenAI. O prefixo do modelo seleciona a rota:

- **Chave de API** — acesso direto à plataforma OpenAI com cobrança por uso (modelos `openai/*`)
- **Assinatura Codex via Pi** — login no ChatGPT/Codex com acesso por assinatura (modelos `openai-codex/*`)
- **Harness app-server do Codex** — execução nativa do app-server do Codex (modelos `openai/*` mais `agents.defaults.embeddedHarness.runtime: "codex"`)

A OpenAI oferece suporte explícito ao uso de OAuth por assinatura em ferramentas e fluxos externos como o OpenClaw.

<Note>
O GPT-5.5 está atualmente disponível no OpenClaw por rotas de assinatura/OAuth:
`openai-codex/gpt-5.5` com o runner Pi, ou `openai/gpt-5.5` com o
harness app-server do Codex. O acesso direto por chave de API para `openai/gpt-5.5` é
compatível assim que a OpenAI ativar o GPT-5.5 na API pública; até lá use um
modelo com API ativada, como `openai/gpt-5.4`, para configurações com `OPENAI_API_KEY`.
</Note>

## Cobertura de recursos do OpenClaw

| Recurso da OpenAI        | Superfície do OpenClaw                                   | Status                                                 |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | provider de modelo `openai/<model>`                      | Sim                                                    |
| Modelos de assinatura Codex | `openai-codex/<model>` com OAuth `openai-codex`       | Sim                                                    |
| Harness app-server do Codex | `openai/<model>` com `embeddedHarness.runtime: codex` | Sim                                                    |
| Pesquisa web no lado do servidor | Ferramenta nativa OpenAI Responses                | Sim, quando a pesquisa web está ativada e nenhum provider está fixado |
| Imagens                  | `image_generate`                                         | Sim                                                    |
| Vídeos                   | `video_generate`                                         | Sim                                                    |
| Texto para fala          | `messages.tts.provider: "openai"` / `tts`                | Sim                                                    |
| Fala para texto em lote  | `tools.media.audio` / entendimento de mídia              | Sim                                                    |
| Fala para texto em streaming | Voice Call `streaming.provider: "openai"`            | Sim                                                    |
| Voz em tempo real        | Voice Call `realtime.provider: "openai"` / Talk da interface do Control | Sim                                      |
| Embeddings               | provider de embeddings de memória                        | Sim                                                    |

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API (OpenAI Platform)">
    **Melhor para:** acesso direto à API e cobrança por uso.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API do [painel da OpenAI Platform](https://platform.openai.com/api-keys).
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

    | Ref do modelo | Rota | Autenticação |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Futura rota direta de API quando a OpenAI ativar o GPT-5.5 na API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` é a rota direta por chave de API da OpenAI, a menos que você force explicitamente
    o harness app-server do Codex. O próprio GPT-5.5 atualmente é apenas de assinatura/OAuth;
    use `openai-codex/*` para OAuth do Codex por meio do runner Pi padrão.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark`. Requisições ativas da API OpenAI rejeitam esse modelo, e o catálogo atual do Codex também não o expõe.
    </Warning>

  </Tab>

  <Tab title="Assinatura Codex">
    **Melhor para:** usar sua assinatura ChatGPT/Codex em vez de uma chave de API separada. O Codex em nuvem exige login no ChatGPT.

    <Steps>
      <Step title="Execute o OAuth do Codex">
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
      <Step title="Defina o modelo padrão">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumo da rota

    | Ref do modelo | Rota | Autenticação |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | OAuth ChatGPT/Codex via Pi | login Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server do Codex | autenticação do app-server do Codex |

    <Note>
    Continue usando o id do provider `openai-codex` para comandos de autenticação/perfil. O
    prefixo de modelo `openai-codex/*` também é a rota Pi explícita para OAuth do Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    O onboarding não importa mais material OAuth de `~/.codex`. Entre com OAuth por navegador (padrão) ou com o fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de autenticação por agente.
    </Note>

    ### Indicador de status

    O `/status` do chat mostra qual harness incorporado está ativo para a sessão atual. O harness Pi padrão aparece como `Runner: pi (embedded)` e não adiciona um badge separado. Quando o harness app-server do Codex empacotado é selecionado, `/status` acrescenta o id do harness não-Pi ao lado de `Fast`, por exemplo `Fast · codex`. Sessões existentes mantêm o id de harness registrado, então use `/new` ou `/reset` após alterar `embeddedHarness` se quiser que `/status` reflita uma nova escolha entre Pi/Codex.

    ### Limite da janela de contexto

    O OpenClaw trata os metadados do modelo e o limite de contexto em runtime como valores separados.

    Para `openai-codex/gpt-5.5` via OAuth do Codex:

    - `contextWindow` nativo: `1000000`
    - limite padrão `contextTokens` em runtime: `272000`

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
    Use `contextWindow` para declarar os metadados nativos do modelo. Use `contextTokens` para limitar o orçamento de contexto em runtime.
    </Note>

  </Tab>
</Tabs>

## Geração de imagem

O plugin empacotado `openai` registra geração de imagem por meio da ferramenta `image_generate`.
Ele oferece suporte tanto à geração de imagem com chave de API da OpenAI quanto à geração de imagem via OAuth do Codex usando a mesma ref de modelo `openai/gpt-image-2`.

| Recurso                   | Chave de API OpenAI                 | OAuth Codex                           |
| ------------------------- | ----------------------------------- | ------------------------------------- |
| Ref do modelo             | `openai/gpt-image-2`                | `openai/gpt-image-2`                  |
| Autenticação              | `OPENAI_API_KEY`                    | login OAuth OpenAI Codex              |
| Transporte                | API Images da OpenAI                | backend Codex Responses               |
| Máximo de imagens por requisição | 4                            | 4                                     |
| Modo de edição            | Ativado (até 5 imagens de referência) | Ativado (até 5 imagens de referência) |
| Substituições de tamanho  | Compatível, incluindo tamanhos 2K/4K | Compatível, incluindo tamanhos 2K/4K  |
| Proporção / resolução     | Não encaminhado para a API Images da OpenAI | Mapeado para um tamanho compatível quando seguro |

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
Consulte [Geração de imagem](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provider e comportamento de failover.
</Note>

`gpt-image-2` é o padrão tanto para geração de imagem a partir de texto da OpenAI quanto para edição de imagem. `gpt-image-1` continua utilizável como substituição explícita de modelo, mas novos fluxos de imagem da OpenAI devem usar `openai/gpt-image-2`.

Para instalações com OAuth Codex, mantenha a mesma ref `openai/gpt-image-2`. Quando um
perfil OAuth `openai-codex` estiver configurado, o OpenClaw resolve esse token de acesso OAuth armazenado e envia requisições de imagem por meio do backend Codex Responses. Ele não tenta primeiro `OPENAI_API_KEY` nem usa fallback silencioso para uma chave de API nessa requisição. Configure `models.providers.openai` explicitamente com uma chave de API, URL base personalizada ou endpoint Azure quando quiser a rota direta da API Images da OpenAI.
Se esse endpoint de imagem personalizado estiver em uma LAN/endereço privado confiável, também defina `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; o OpenClaw mantém endpoints de imagem OpenAI-compatible privados/internos bloqueados, a menos que essa ativação opcional esteja presente.

Gerar:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Geração de vídeo

O plugin empacotado `openai` registra geração de vídeo por meio da ferramenta `video_generate`.

| Recurso         | Valor                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| Modelo padrão    | `openai/sora-2`                                                                  |
| Modos            | Texto para vídeo, imagem para vídeo, edição de vídeo único                       |
| Entradas de referência | 1 imagem ou 1 vídeo                                                        |
| Substituições de tamanho | Compatível                                                                |
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
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provider e comportamento de failover.
</Note>

## Contribuição de prompt do GPT-5

O OpenClaw adiciona uma contribuição de prompt compartilhada do GPT-5 para execuções da família GPT-5 entre providers. Ela se aplica por id do modelo, então `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e outras refs compatíveis de GPT-5 recebem a mesma sobreposição. Modelos mais antigos da linha GPT-4.x não recebem.

O harness nativo do Codex empacotado usa o mesmo comportamento de GPT-5 e a mesma sobreposição de Heartbeat por meio das instruções de desenvolvedor do app-server do Codex, então sessões `openai/gpt-5.x` forçadas por `embeddedHarness.runtime: "codex"` mantêm a mesma orientação de continuidade e Heartbeat proativo, mesmo que o Codex controle o restante do prompt do harness.

A contribuição do GPT-5 adiciona um contrato de comportamento com tags para persistência de persona, segurança de execução, disciplina de ferramentas, formato de saída, verificações de conclusão e verificação. O comportamento específico de canal para resposta e mensagem silenciosa permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A orientação do GPT-5 está sempre ativada para modelos correspondentes. A camada de estilo de interação amigável é separada e configurável.

| Valor                  | Efeito                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (padrão)  | Ativa a camada de estilo de interação amigável |
| `"on"`                 | Alias para `"friendly"`                     |
| `"off"`                | Desativa apenas a camada de estilo amigável |

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
Os valores não diferenciam maiúsculas de minúsculas em runtime, então `"Off"` e `"off"` desativam a camada de estilo amigável.
</Tip>

<Note>
O legado `plugins.entries.openai.config.personality` ainda é lido como fallback de compatibilidade quando a configuração compartilhada `agents.defaults.promptOverlays.gpt5.personality` não está definida.
</Note>

## Voz e fala

<AccordionGroup>
  <Accordion title="Síntese de fala (TTS)">
    O plugin empacotado `openai` registra síntese de fala para a superfície `messages.tts`.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidade | `messages.tts.providers.openai.speed` | (não definido) |
    | Instruções | `messages.tts.providers.openai.instructions` | (não definido, apenas `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para arquivos |
    | Chave de API | `messages.tts.providers.openai.apiKey` | Usa fallback para `OPENAI_API_KEY` |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modelos disponíveis: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Vozes disponíveis: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

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
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base do TTS sem afetar o endpoint da API de chat.
    </Note>

  </Accordion>

  <Accordion title="Fala para texto">
    O plugin empacotado `openai` registra fala para texto em lote por meio da
    superfície de transcrição de entendimento de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: REST da OpenAI `/v1/audio/transcriptions`
    - Caminho de entrada: upload multipart de arquivo de áudio
    - Compatível no OpenClaw em qualquer lugar em que a transcrição de áudio de entrada use
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e
      anexos de áudio de canal

    Para forçar OpenAI na transcrição de áudio de entrada:

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
    configuração compartilhada de mídia de áudio ou por requisição de transcrição por chamada.

  </Accordion>

  <Accordion title="Transcrição em tempo real">
    O plugin empacotado `openai` registra transcrição em tempo real para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (não definido) |
    | Prompt | `...openai.prompt` | (não definido) |
    | Duração do silêncio | `...openai.silenceDurationMs` | `800` |
    | Limite de VAD | `...openai.vadThreshold` | `0.5` |
    | Chave de API | `...openai.apiKey` | Usa fallback para `OPENAI_API_KEY` |

    <Note>
    Usa uma conexão WebSocket para `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Esse provider de streaming é para o caminho de transcrição em tempo real do Voice Call; a voz no Discord atualmente grava pequenos segmentos e usa o caminho de transcrição em lote de `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real">
    O plugin empacotado `openai` registra voz em tempo real para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Limite de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Chave de API | `...openai.apiKey` | Usa fallback para `OPENAI_API_KEY` |

    <Note>
    Compatível com Azure OpenAI via chaves de configuração `azureEndpoint` e `azureDeployment`. Compatível com chamada bidirecional de ferramentas. Usa formato de áudio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints Azure OpenAI

O provider empacotado `openai` pode apontar para um recurso Azure OpenAI para geração de imagem substituindo a URL base. No caminho de geração de imagem, o OpenClaw detecta hostnames Azure em `models.providers.openai.baseUrl` e muda automaticamente para o formato de requisição do Azure.

<Note>
A voz em tempo real usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Consulte o accordion **Voz
em tempo real** em [Voz e fala](#voice-and-speech) para as configurações do Azure.
</Note>

Use Azure OpenAI quando:

- Você já tem uma assinatura, cota ou contrato corporativo do Azure OpenAI
- Você precisa de residência regional de dados ou controles de conformidade fornecidos pelo Azure
- Você quer manter o tráfego dentro de uma tenancy Azure existente

### Configuração

Para geração de imagem no Azure por meio do provider empacotado `openai`, aponte
`models.providers.openai.baseUrl` para seu recurso Azure e defina `apiKey` como
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

O OpenClaw reconhece estes sufixos de host Azure para a rota de geração de imagem do Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para requisições de geração de imagem em um host Azure reconhecido, o OpenClaw:

- Envia o cabeçalho `api-key` em vez de `Authorization: Bearer`
- Usa caminhos com escopo de implantação (`/openai/deployments/{deployment}/...`)
- Acrescenta `?api-version=...` a cada requisição

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato padrão de requisição de imagem da OpenAI.

<Note>
O roteamento Azure para o caminho de geração de imagem do provider `openai`
exige OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizado como o endpoint público da OpenAI e falharão em implantações
de imagem no Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão específica preview ou GA do Azure
para o caminho de geração de imagem no Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Nomes de modelo são nomes de implantação

O Azure OpenAI vincula modelos a implantações. Para requisições de geração de imagem no Azure
roteadas pelo provider empacotado `openai`, o campo `model` no OpenClaw
deve ser o **nome da implantação Azure** que você configurou no portal Azure, e não
o id público do modelo OpenAI.

Se você criar uma implantação chamada `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

A mesma regra de nome de implantação se aplica a chamadas de geração de imagem roteadas por
meio do provider empacotado `openai`.

### Disponibilidade regional

A geração de imagem no Azure está atualmente disponível apenas em um subconjunto de regiões
(por exemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Verifique a lista atual de regiões da Microsoft antes de criar uma
implantação e confirme se o modelo específico é oferecido na sua região.

### Diferenças de parâmetros

Azure OpenAI e OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções que a OpenAI pública permite (por exemplo certos
valores de `background` em `gpt-image-2`) ou expô-las apenas em versões específicas do
modelo. Essas diferenças vêm do Azure e do modelo subjacente, não do
OpenClaw. Se uma requisição do Azure falhar com um erro de validação, verifique o
conjunto de parâmetros compatível com sua implantação e versão de API específicas no
portal Azure.

<Note>
O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe
os cabeçalhos ocultos de atribuição do OpenClaw — consulte o accordion **Rotas nativas vs compatíveis com OpenAI**
em [Configuração avançada](#advanced-configuration).

Para tráfego de chat ou Responses no Azure (além de geração de imagem), use o
fluxo de onboarding ou uma configuração de provider Azure dedicada — `openai.baseUrl` sozinho
não adota o formato de API/autenticação do Azure. Existe um provider separado
`azure-openai-responses/*`; consulte
o accordion de Compaction no lado do servidor abaixo.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) tanto para `openai/*` quanto para `openai-codex/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de recorrer a SSE
    - Após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o cooldown
    - Anexa cabeçalhos estáveis de identidade de sessão e turno para novas tentativas e reconexões
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamento |
    |-------|----------|
    | `"auto"` (padrão) | WebSocket primeiro, fallback para SSE |
    | `"sse"` | Força apenas SSE |
    | `"websocket"` | Força apenas WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
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
    O OpenClaw ativa aquecimento de WebSocket por padrão para `openai/*` e `openai-codex/*` para reduzir a latência do primeiro turno.

    ```json5
    // Desativar aquecimento
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
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

    Quando ativado, o OpenClaw mapeia o modo rápido para processamento prioritário da OpenAI (`service_tier = "priority"`). Valores existentes de `service_tier` são preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Substituições de sessão prevalecem sobre a configuração. Limpar a substituição de sessão na interface de Sessions devolve a sessão ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritário (service_tier)">
    A API da OpenAI expõe processamento prioritário por meio de `service_tier`. Defina por modelo no OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores compatíveis: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` só é encaminhado para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você roteia qualquer um desses providers por um proxy, o OpenClaw deixa `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no lado do servidor (API Responses)">
    Para modelos diretos de OpenAI Responses (`openai/*` em `api.openai.com`), o wrapper de stream do harness Pi do plugin OpenAI ativa automaticamente Compaction no lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    Isso se aplica ao caminho interno do harness Pi e aos hooks do provider OpenAI usados por execuções incorporadas. O harness nativo app-server do Codex gerencia seu próprio contexto por meio do Codex e é configurado separadamente com `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Ativar explicitamente">
        Útil para endpoints compatíveis como Azure OpenAI Responses:

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
                "openai/gpt-5.4": {
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
                "openai/gpt-5.4": {
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
    `responsesServerCompaction` controla apenas a injeção de `context_management`. Modelos diretos de OpenAI Responses ainda forçam `store: true`, a menos que a compatibilidade defina `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agêntico estrito">
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
    - Ativa automaticamente `update_plan` para trabalho substancial
    - Expõe um estado explícito de bloqueio se o modelo continuar planejando sem agir

    <Note>
    Limitado apenas a execuções da família GPT-5 de OpenAI e Codex. Outros providers e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos OpenAI, Codex e Azure OpenAI de forma diferente de proxies genéricos `/v1` compatíveis com OpenAI:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` apenas para modelos que oferecem suporte ao valor `none` da OpenAI
    - Omitirem raciocínio desativado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Tornam schemas de ferramentas estritos por padrão
    - Anexarem cabeçalhos ocultos de atribuição apenas em hosts nativos verificados
    - Mantêm modelagem de requisição exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de raciocínio, dicas de cache de prompt)

    **Rotas de proxy/compatíveis:**
    - Usam comportamento de compatibilidade mais flexível
    - Não forçam schemas estritos de ferramentas nem cabeçalhos exclusivos de rotas nativas

    O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe os cabeçalhos ocultos de atribuição.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagem" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provider.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provider.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
