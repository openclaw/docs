---
read_when:
    - Você quer usar modelos OpenAI no OpenClaw
    - Você quer autenticação por assinatura Codex em vez de chaves de API
    - Você precisa de um comportamento de execução de agente GPT-5 mais estrito
summary: Usar OpenAI por chaves de API ou assinatura Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T13:54:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

A OpenAI fornece APIs para desenvolvedores para modelos GPT. O OpenClaw oferece suporte a três rotas da família OpenAI. O prefixo do modelo seleciona a rota:

- **Chave de API** — acesso direto à OpenAI Platform com cobrança por uso (modelos `openai/*`)
- **Assinatura Codex via Pi** — login no ChatGPT/Codex com acesso por assinatura (modelos `openai-codex/*`)
- **Harness do servidor de aplicativo Codex** — execução nativa do servidor de aplicativo Codex (modelos `openai/*` mais `agents.defaults.embeddedHarness.runtime: "codex"`)

A OpenAI oferece suporte explícito ao uso de OAuth por assinatura em ferramentas e fluxos de trabalho externos, como o OpenClaw.

Provedor, modelo, runtime e canal são camadas separadas. Se esses rótulos
estiverem se misturando, leia [Agent runtimes](/pt-BR/concepts/agent-runtimes) antes de
alterar a configuração.

## Escolha rápida

| Objetivo                                      | Use                                                      | Observações                                                                  |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Cobrança direta por chave de API              | `openai/gpt-5.4`                                         | Defina `OPENAI_API_KEY` ou execute o onboarding de chave de API da OpenAI.   |
| GPT-5.5 com autenticação por assinatura ChatGPT/Codex | `openai-codex/gpt-5.5`                                   | Rota Pi padrão para OAuth do Codex. Melhor primeira escolha para configurações por assinatura. |
| GPT-5.5 com comportamento nativo do servidor de aplicativo Codex | `openai/gpt-5.5` mais `embeddedHarness.runtime: "codex"` | Usa o harness do servidor de aplicativo Codex, não a rota pública da API OpenAI. |
| Geração ou edição de imagens                  | `openai/gpt-image-2`                                     | Funciona com `OPENAI_API_KEY` ou OAuth OpenAI Codex.                        |

<Note>
Atualmente, o GPT-5.5 está disponível no OpenClaw por rotas de assinatura/OAuth:
`openai-codex/gpt-5.5` com o runner Pi, ou `openai/gpt-5.5` com o
harness do servidor de aplicativo Codex. O acesso direto por chave de API para `openai/gpt-5.5` é
compatível assim que a OpenAI ativar o GPT-5.5 na API pública; até lá, use um
modelo com API ativada, como `openai/gpt-5.4`, para configurações com `OPENAI_API_KEY`.
</Note>

<Note>
Ativar o Plugin OpenAI, ou selecionar um modelo `openai-codex/*`, não
ativa o Plugin empacotado do servidor de aplicativo Codex. O OpenClaw ativa esse Plugin apenas
quando você seleciona explicitamente o harness nativo do Codex com
`embeddedHarness.runtime: "codex"` ou usa uma ref de modelo legada `codex/*`.
</Note>

## Cobertura de recursos do OpenClaw

| Capacidade OpenAI          | Superfície do OpenClaw                                     | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | provedor de modelo `openai/<model>`                        | Sim                                                    |
| Modelos por assinatura Codex | `openai-codex/<model>` com OAuth `openai-codex`           | Sim                                                    |
| Harness do servidor de aplicativo Codex | `openai/<model>` com `embeddedHarness.runtime: codex`     | Sim                                                    |
| Pesquisa web no servidor  | Ferramenta nativa OpenAI Responses                         | Sim, quando a pesquisa web está ativada e nenhum provedor está fixado |
| Imagens                   | `image_generate`                                           | Sim                                                    |
| Vídeos                    | `video_generate`                                           | Sim                                                    |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                  | Sim                                                    |
| Speech-to-text em lote    | `tools.media.audio` / compreensão de mídia                 | Sim                                                    |
| Speech-to-text em streaming | Voice Call `streaming.provider: "openai"`                | Sim                                                    |
| Voz em tempo real         | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sim                                                    |
| Embeddings                | provedor de embeddings de memória                          | Sim                                                    |

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API (OpenAI Platform)">
    **Melhor para:** acesso direto à API e cobrança por uso.

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

    | Ref do modelo | Rota | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Futura rota direta de API quando a OpenAI ativar GPT-5.5 na API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` é a rota direta por chave de API da OpenAI, a menos que você force explicitamente
    o harness do servidor de aplicativo Codex. O próprio GPT-5.5 atualmente é apenas de assinatura/OAuth;
    use `openai-codex/*` para OAuth Codex pelo runner Pi padrão, ou
    use `openai/gpt-5.5` com `embeddedHarness.runtime: "codex"` para execução nativa
    do servidor de aplicativo Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark`. Solicitações reais à API OpenAI rejeitam esse modelo, e o catálogo atual do Codex também não o expõe.
    </Warning>

  </Tab>

  <Tab title="Assinatura Codex">
    **Melhor para:** usar sua assinatura do ChatGPT/Codex em vez de uma chave de API separada. O cloud do Codex exige login no ChatGPT.

    <Steps>
      <Step title="Execute o OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configurações headless ou hostis a callback, adicione `--device-code` para entrar com um fluxo de código de dispositivo do ChatGPT em vez do callback localhost do navegador:

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

    | Ref do modelo | Rota | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | OAuth ChatGPT/Codex via Pi | login Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness do servidor de aplicativo Codex | autenticação do servidor de aplicativo Codex |

    <Note>
    Continue usando o ID de provedor `openai-codex` para comandos de auth/perfil. O
    prefixo de modelo `openai-codex/*` também é a rota explícita do Pi para OAuth Codex.
    Ele não seleciona nem ativa automaticamente o harness empacotado do servidor de aplicativo Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    O onboarding não importa mais material OAuth de `~/.codex`. Faça login com OAuth no navegador (padrão) ou com o fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de autenticação do agente.
    </Note>

    ### Indicador de status

    O chat `/status` mostra qual runtime de modelo está ativo para a sessão atual.
    O harness Pi padrão aparece como `Runtime: OpenClaw Pi Default`. Quando o
    harness empacotado do servidor de aplicativo Codex está selecionado, `/status` mostra
    `Runtime: OpenAI Codex`. Sessões existentes mantêm seu ID de harness registrado, então use
    `/new` ou `/reset` após alterar `embeddedHarness` se quiser que `/status` reflita uma nova escolha entre Pi/Codex.

    ### Limite da janela de contexto

    O OpenClaw trata metadados do modelo e o limite de contexto em runtime como valores separados.

    Para `openai-codex/gpt-5.5` via OAuth Codex:

    - `contextWindow` nativo: `1000000`
    - limite padrão de `contextTokens` em runtime: `272000`

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
    Use `contextWindow` para declarar metadados nativos do modelo. Use `contextTokens` para limitar o orçamento de contexto em runtime.
    </Note>

    ### Recuperação do catálogo

    O OpenClaw usa metadados do catálogo upstream do Codex para `gpt-5.5` quando eles
    estão presentes. Se a descoberta ao vivo do Codex omitir a linha `openai-codex/gpt-5.5` enquanto
    a conta estiver autenticada, o OpenClaw sintetiza essa linha de modelo OAuth para que
    execuções de Cron, subagente e de modelo padrão configurado não falhem com
    `Unknown model`.

  </Tab>
</Tabs>

## Geração de imagens

O Plugin empacotado `openai` registra a geração de imagens por meio da ferramenta `image_generate`.
Ele oferece suporte tanto à geração de imagens por chave de API OpenAI quanto à geração de imagens
por OAuth Codex usando a mesma ref de modelo `openai/gpt-image-2`.

| Capacidade                | Chave de API OpenAI                | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref do modelo             | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | login OAuth OpenAI Codex             |
| Transporte                | OpenAI Images API                  | backend Codex Responses              |
| Máximo de imagens por solicitação | 4                                  | 4                                    |
| Modo de edição            | Ativado (até 5 imagens de referência) | Ativado (até 5 imagens de referência)   |
| Substituições de tamanho  | Compatíveis, incluindo tamanhos 2K/4K | Compatíveis, incluindo tamanhos 2K/4K     |
| Proporção / resolução     | Não encaminhada para a OpenAI Images API | Mapeada para um tamanho compatível quando seguro |

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
Consulte [Image Generation](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

`gpt-image-2` é o padrão tanto para geração de imagens a partir de texto da OpenAI quanto para
edição de imagens. `gpt-image-1` continua utilizável como substituição explícita de modelo, mas novos
fluxos de trabalho de imagem da OpenAI devem usar `openai/gpt-image-2`.

Para instalações com OAuth Codex, mantenha a mesma ref `openai/gpt-image-2`. Quando um
perfil OAuth `openai-codex` está configurado, o OpenClaw resolve esse token de
acesso OAuth armazenado e envia solicitações de imagem pelo backend Codex Responses. Ele
não tenta primeiro `OPENAI_API_KEY` nem recorre silenciosamente a uma chave de API para essa
solicitação. Configure `models.providers.openai` explicitamente com uma chave de API,
base URL personalizada ou endpoint Azure quando quiser a rota direta da OpenAI Images API
em vez disso.
Se esse endpoint de imagem personalizado estiver em um endereço confiável de LAN/rede privada, também defina
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; o OpenClaw mantém
endpoints privados/internos de imagem compatíveis com OpenAI bloqueados, a menos que esse opt-in esteja
presente.

Gerar:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Geração de vídeo

O Plugin empacotado `openai` registra geração de vídeo por meio da ferramenta `video_generate`.

| Capacidade       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo padrão    | `openai/sora-2`                                                                   |
| Modos            | Texto para vídeo, imagem para vídeo, edição de um único vídeo                     |
| Entradas de referência | 1 imagem ou 1 vídeo                                                         |
| Substituições de tamanho | Compatíveis                                                                  |
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
Consulte [Video Generation](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Contribuição de prompt do GPT-5

O OpenClaw adiciona uma contribuição compartilhada de prompt GPT-5 para execuções da família GPT-5 em todos os provedores. Ela se aplica por ID do modelo, então `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e outras refs compatíveis com GPT-5 recebem a mesma sobreposição. Modelos mais antigos GPT-4.x não recebem.

O harness nativo empacotado do Codex usa o mesmo comportamento de GPT-5 e a mesma sobreposição de Heartbeat por meio de instruções de desenvolvedor do servidor de aplicativo Codex, então sessões `openai/gpt-5.x` forçadas por `embeddedHarness.runtime: "codex"` mantêm a mesma orientação de acompanhamento e Heartbeat proativo, mesmo que o Codex controle o restante do prompt do harness.

A contribuição GPT-5 adiciona um contrato de comportamento com tags para persistência de persona, segurança de execução, disciplina de ferramentas, formato de saída, verificações de conclusão e verificação. O comportamento específico de resposta por canal e de mensagem silenciosa permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A orientação GPT-5 está sempre ativada para modelos correspondentes. A camada de estilo de interação amigável é separada e configurável.

| Valor                  | Efeito                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (padrão) | Ativa a camada de estilo de interação amigável |
| `"on"`                 | Alias para `"friendly"`                      |
| `"off"`                | Desativa apenas a camada de estilo amigável  |

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
Os valores não diferenciam maiúsculas de minúsculas em runtime, então `"Off"` e `"off"` desativam a camada de estilo amigável.
</Tip>

<Note>
O legado `plugins.entries.openai.config.personality` ainda é lido como fallback de compatibilidade quando a configuração compartilhada `agents.defaults.promptOverlays.gpt5.personality` não está definida.
</Note>

## Voz e fala

<AccordionGroup>
  <Accordion title="Síntese de fala (TTS)">
    O Plugin empacotado `openai` registra síntese de fala para a superfície `messages.tts`.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidade | `messages.tts.providers.openai.speed` | (não definido) |
    | Instruções | `messages.tts.providers.openai.instructions` | (não definido, apenas `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para arquivos |
    | Chave de API | `messages.tts.providers.openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Defina `OPENAI_TTS_BASE_URL` para substituir a base URL do TTS sem afetar o endpoint da API de chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    O Plugin empacotado `openai` registra speech-to-text em lote por meio da
    superfície de transcrição da compreensão de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível no OpenClaw sempre que a transcrição de áudio de entrada usa
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e anexos
      de áudio de canais

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

    Idioma e dicas de prompt são encaminhados à OpenAI quando fornecidos pela
    configuração compartilhada de mídia de áudio ou por solicitação de transcrição por chamada.

  </Accordion>

  <Accordion title="Transcrição em tempo real">
    O Plugin empacotado `openai` registra transcrição em tempo real para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (não definido) |
    | Prompt | `...openai.prompt` | (não definido) |
    | Duração do silêncio | `...openai.silenceDurationMs` | `800` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Chave de API | `...openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |

    <Note>
    Usa uma conexão WebSocket para `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Esse provedor de streaming é para o caminho de transcrição em tempo real do Voice Call; a voz do Discord atualmente grava segmentos curtos e usa em vez disso o caminho de transcrição em lote `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real">
    O Plugin empacotado `openai` registra voz em tempo real para o Plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Chave de API | `...openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |

    <Note>
    Compatível com Azure OpenAI por meio das chaves de configuração `azureEndpoint` e `azureDeployment`. Compatível com chamada bidirecional de ferramentas. Usa formato de áudio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints Azure OpenAI

O provedor empacotado `openai` pode direcionar tráfego para um recurso Azure OpenAI para geração de
imagens substituindo a base URL. No caminho de geração de imagens, o OpenClaw
detecta hostnames do Azure em `models.providers.openai.baseUrl` e muda automaticamente para
o formato de requisição do Azure.

<Note>
A voz em tempo real usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Consulte o accordion **Voz em tempo real** em [Voice and speech](#voice-and-speech) para as configurações
de Azure.
</Note>

Use Azure OpenAI quando:

- Você já tiver uma assinatura, cota ou contrato corporativo do Azure OpenAI
- Precisar de residência regional de dados ou controles de conformidade fornecidos pelo Azure
- Quiser manter o tráfego dentro de uma tenancy Azure existente

### Configuração

Para geração de imagens no Azure por meio do provedor empacotado `openai`, aponte
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

O OpenClaw reconhece estes sufixos de host do Azure para a rota de geração de imagens do Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitações de geração de imagem em um host Azure reconhecido, o OpenClaw:

- Envia o cabeçalho `api-key` em vez de `Authorization: Bearer`
- Usa caminhos com escopo de deployment (`/openai/deployments/{deployment}/...`)
- Adiciona `?api-version=...` a cada solicitação

Outras base URLs (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato padrão
de requisição de imagem da OpenAI.

<Note>
O roteamento Azure para o caminho de geração de imagens do provedor `openai`
exige OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizado como o endpoint público da OpenAI e falharão em deployments
de imagem do Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão específica de preview ou GA do Azure
para o caminho de geração de imagens do Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Nomes de modelo são nomes de deployment

O Azure OpenAI vincula modelos a deployments. Para solicitações de geração de imagens do Azure
roteadas pelo provedor empacotado `openai`, o campo `model` no OpenClaw
deve ser o **nome do deployment no Azure** que você configurou no portal Azure, não
o ID público do modelo OpenAI.

Se você criar um deployment chamado `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

A mesma regra de nome de deployment se aplica a chamadas de geração de imagem roteadas pelo
provedor empacotado `openai`.

### Disponibilidade regional

A geração de imagens no Azure está atualmente disponível apenas em um subconjunto de regiões
(por exemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Verifique a lista atual de regiões da Microsoft antes de criar um
deployment, e confirme se o modelo específico é oferecido em sua região.

### Diferenças de parâmetros

Azure OpenAI e OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções que a OpenAI pública permite (por exemplo certos
valores de `background` em `gpt-image-2`) ou expô-las apenas em versões
específicas do modelo. Essas diferenças vêm do Azure e do modelo subjacente, não
do OpenClaw. Se uma solicitação ao Azure falhar com um erro de validação, verifique o
conjunto de parâmetros compatível com seu deployment e versão de API específicos no
portal do Azure.

<Note>
O Azure OpenAI usa comportamento e transporte nativos de compatibilidade, mas não recebe
os cabeçalhos ocultos de atribuição do OpenClaw — consulte o accordion **Native vs OpenAI-compatible
routes** em [Advanced configuration](#advanced-configuration).

Para tráfego de chat ou Responses no Azure (além de geração de imagens), use o
fluxo de onboarding ou uma configuração dedicada de provedor Azure — `openai.baseUrl` sozinho
não aplica o formato de API/auth do Azure. Existe um provedor separado
`azure-openai-responses/*`; consulte
o accordion de compaction no servidor abaixo.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) tanto para `openai/*` quanto para `openai-codex/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de recorrer a SSE
    - Após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o período de espera
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
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Aquecimento de WebSocket">
    O OpenClaw ativa o aquecimento de WebSocket por padrão para `openai/*` e `openai-codex/*` para reduzir a latência do primeiro turno.

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
    O OpenClaw expõe um toggle compartilhado de modo rápido para `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

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
    Substituições de sessão prevalecem sobre a configuração. Limpar a substituição da sessão na UI de Sessions retorna a sessão ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritário (service_tier)">
    A API da OpenAI expõe processamento prioritário por meio de `service_tier`. Defina isso por modelo no OpenClaw:

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
    `serviceTier` só é encaminhado para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você rotear qualquer um dos provedores por um proxy, o OpenClaw deixa `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no servidor (Responses API)">
    Para modelos diretos OpenAI Responses (`openai/*` em `api.openai.com`), o wrapper de stream Pi-harness do Plugin OpenAI ativa automaticamente compaction no servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    Isso se aplica ao caminho integrado do harness Pi e aos hooks do provedor OpenAI usados por execuções embutidas. O harness nativo do servidor de aplicativo Codex gerencia seu próprio contexto via Codex e é configurado separadamente com `agents.defaults.embeddedHarness.runtime`.

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
    `responsesServerCompaction` controla apenas a injeção de `context_management`. Modelos diretos OpenAI Responses ainda forçam `store: true`, a menos que a compatibilidade defina `supportsStore: false`.
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
    - Não trata mais um turno apenas de planejamento como progresso bem-sucedido quando há uma ação de ferramenta disponível
    - Tenta novamente o turno com uma orientação para agir agora
    - Ativa automaticamente `update_plan` para trabalho substancial
    - Exibe um estado explícito de bloqueio se o modelo continuar planejando sem agir

    <Note>
    Com escopo apenas para execuções OpenAI e Codex da família GPT-5. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos OpenAI, Codex e Azure OpenAI de forma diferente de proxies genéricos compatíveis com OpenAI `/v1`:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` apenas para modelos que oferecem suporte ao esforço `none` da OpenAI
    - Omitir reasoning desativado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Usar como padrão schemas estritos de ferramentas
    - Anexar cabeçalhos ocultos de atribuição apenas em hosts nativos verificados
    - Manter formatação de requisição exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de reasoning, dicas de cache de prompt)

    **Rotas compatíveis/proxy:**
    - Usam comportamento de compatibilidade mais frouxo
    - Removem `store` de Completions de payloads `openai-completions` não nativos
    - Aceitam JSON pass-through avançado `params.extra_body`/`params.extraBody` para proxies de Completions compatíveis com OpenAI
    - Não forçam schemas estritos de ferramentas nem cabeçalhos exclusivos de rotas nativas

    O Azure OpenAI usa comportamento e transporte nativos de compatibilidade, mas não recebe os cabeçalhos ocultos de atribuição.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Image generation" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Video generation" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="OAuth and auth" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de auth e regras de reutilização de credenciais.
  </Card>
</CardGroup>
