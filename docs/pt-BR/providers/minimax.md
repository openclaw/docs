---
read_when:
    - Você quer modelos MiniMax no OpenClaw
    - Você precisa de orientação de configuração do MiniMax
summary: Use modelos MiniMax no OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-26T11:36:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b91f8c4c12c993457fb1535bbb2f3401474a3ec432b24189792a20041e756dc
    source_path: providers/minimax.md
    workflow: 15
---

O provedor MiniMax do OpenClaw usa **MiniMax M2.7** por padrão.

O MiniMax também oferece:

- Síntese de fala empacotada via T2A v2
- Entendimento de imagem empacotado via `MiniMax-VL-01`
- Geração de música empacotada via `music-2.6`
- `web_search` empacotado por meio da API de busca do MiniMax Coding Plan

Divisão de provedores:

| ID do provedor   | Auth      | Capacidades                                                                                       |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `minimax`        | Chave de API | Texto, geração de imagem, geração de música, geração de vídeo, entendimento de imagem, fala, busca na web |
| `minimax-portal` | OAuth     | Texto, geração de imagem, geração de música, geração de vídeo, entendimento de imagem, fala      |

## Catálogo integrado

| Modelo                   | Tipo             | Descrição                                  |
| ------------------------ | ---------------- | ------------------------------------------ |
| `MiniMax-M2.7`           | Chat (reasoning) | Modelo hospedado padrão de reasoning       |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Camada de reasoning M2.7 mais rápida       |
| `MiniMax-VL-01`          | Vision           | Modelo de entendimento de imagem           |
| `image-01`               | Geração de imagem | Texto para imagem e edição imagem para imagem |
| `music-2.6`              | Geração de música | Modelo padrão de música                    |
| `music-2.5`              | Geração de música | Camada anterior de geração de música       |
| `music-2.0`              | Geração de música | Camada legada de geração de música         |
| `MiniMax-Hailuo-2.3`     | Geração de vídeo | Fluxos de texto para vídeo e referência por imagem |

## Primeiros passos

Escolha seu método preferido de autenticação e siga as etapas de configuração.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Melhor para:** configuração rápida com MiniMax Coding Plan via OAuth, sem necessidade de chave de API.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Execute o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Isso autentica em `api.minimax.io`.
          </Step>
          <Step title="Verifique se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Execute o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Isso autentica em `api.minimaxi.com`.
          </Step>
          <Step title="Verifique se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Configurações com OAuth usam o id de provedor `minimax-portal`. As referências de modelo seguem o formato `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Link de indicação para o MiniMax Coding Plan (10% de desconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Chave de API">
    **Melhor para:** MiniMax hospedado com API compatível com Anthropic.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Execute o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Isso configura `api.minimax.io` como URL base.
          </Step>
          <Step title="Verifique se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Execute o onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Isso configura `api.minimaxi.com` como URL base.
          </Step>
          <Step title="Verifique se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Exemplo de configuração

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    No caminho de streaming compatível com Anthropic, o OpenClaw desabilita o thinking do MiniMax por padrão, a menos que você defina `thinking` explicitamente. O endpoint de streaming do MiniMax emite `reasoning_content` em chunks delta no estilo OpenAI em vez de blocos nativos de thinking da Anthropic, o que pode vazar reasoning interno para a saída visível se deixado habilitado implicitamente.
    </Warning>

    <Note>
    Configurações com chave de API usam o id de provedor `minimax`. As referências de modelo seguem o formato `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurar via `openclaw configure`

Use o assistente interativo de configuração para definir o MiniMax sem editar JSON:

<Steps>
  <Step title="Inicie o assistente">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Selecione Model/auth">
    Escolha **Model/auth** no menu.
  </Step>
  <Step title="Escolha uma opção de autenticação do MiniMax">
    Escolha uma das opções disponíveis do MiniMax:

    | Opção de autenticação | Descrição |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internacional (Plano de Coding) |
    | `minimax-cn-oauth` | OAuth da China (Plano de Coding) |
    | `minimax-global-api` | Chave de API internacional |
    | `minimax-cn-api` | Chave de API da China |

  </Step>
  <Step title="Escolha seu modelo padrão">
    Selecione seu modelo padrão quando solicitado.
  </Step>
</Steps>

## Capacidades

### Geração de imagens

O Plugin MiniMax registra o modelo `image-01` para a ferramenta `image_generate`. Ele oferece suporte a:

- **Geração de texto para imagem** com controle de proporção
- **Edição de imagem para imagem** (referência de assunto) com controle de proporção
- Até **9 imagens de saída** por solicitação
- Até **1 imagem de referência** por solicitação de edição
- Proporções compatíveis: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Para usar o MiniMax para geração de imagens, defina-o como o provedor de geração de imagens:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

O Plugin usa a mesma `MINIMAX_API_KEY` ou autenticação OAuth que os modelos de texto. Nenhuma configuração adicional é necessária se o MiniMax já estiver configurado.

Tanto `minimax` quanto `minimax-portal` registram `image_generate` com o mesmo
modelo `image-01`. Configurações com chave de API usam `MINIMAX_API_KEY`; configurações OAuth podem usar
o caminho de autenticação `minimax-portal` incluído.

A geração de imagens sempre usa o endpoint dedicado de imagem do MiniMax
(`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`,
pois esse campo configura a URL base compatível com chat/Anthropic. Defina
`MINIMAX_API_HOST=https://api.minimaxi.com` para rotear a geração de imagens
pelo endpoint CN; o endpoint global padrão é
`https://api.minimax.io`.

Quando a configuração inicial ou a configuração por chave de API grava entradas explícitas de `models.providers.minimax`,
o OpenClaw materializa `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` como modelos de chat somente texto. A compreensão de imagem
é exposta separadamente pelo provedor de mídia `MiniMax-VL-01`, de propriedade do Plugin.

<Note>
Consulte [Geração de imagens](/pt-BR/tools/image-generation) para ver parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

### Texto para fala

O Plugin `minimax` incluído registra o MiniMax T2A v2 como provedor de fala para
`messages.tts`.

- Modelo TTS padrão: `speech-2.8-hd`
- Voz padrão: `English_expressive_narrator`
- Os ids de modelo incluídos compatíveis incluem `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` e `speech-01-turbo`.
- A resolução de autenticação é `messages.tts.providers.minimax.apiKey`, depois
  perfis de autenticação OAuth/token de `minimax-portal`, depois chaves de ambiente do Plano Token
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), e depois `MINIMAX_API_KEY`.
- Se nenhum host de TTS estiver configurado, o OpenClaw reutiliza o host OAuth `minimax-portal`
  configurado e remove sufixos de caminho compatíveis com Anthropic,
  como `/anthropic`.
- Anexos de áudio normais continuam em MP3.
- Destinos de nota de voz, como Feishu e Telegram, são transcodificados do MP3 do MiniMax
  para Opus em 48kHz com `ffmpeg`, porque a API de arquivos do Feishu/Lark só
  aceita `file_type: "opus"` para mensagens de áudio nativas.
- O MiniMax T2A aceita `speed` e `vol` fracionários, mas `pitch` é enviado como
  inteiro; o OpenClaw trunca valores fracionários de `pitch` antes da solicitação à API.

| Configuração                            | Variável de ambiente   | Padrão                        | Descrição                            |
| --------------------------------------- | ---------------------- | ----------------------------- | ------------------------------------ |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host da API MiniMax T2A.             |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Id do modelo TTS.                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Id da voz usado para saída de fala.  |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Velocidade de reprodução, `0.5..2.0`.|
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volume, `(0, 10]`.                   |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Deslocamento de tom inteiro, `-12..12`. |

### Geração de música

O Plugin MiniMax incluído registra geração de música por meio da ferramenta compartilhada
`music_generate` para `minimax` e `minimax-portal`.

- Modelo de música padrão: `minimax/music-2.6`
- Modelo de música OAuth: `minimax-portal/music-2.6`
- Também oferece suporte a `minimax/music-2.5` e `minimax/music-2.0`
- Controles de prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato de saída: `mp3`
- Execuções com suporte de sessão são desacopladas por meio do fluxo compartilhado de tarefa/status, incluindo `action: "status"`

Para usar o MiniMax como provedor de música padrão:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Consulte [Geração de música](/pt-BR/tools/music-generation) para ver parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

### Geração de vídeo

O Plugin MiniMax incluído registra geração de vídeo por meio da ferramenta compartilhada
`video_generate` para `minimax` e `minimax-portal`.

- Modelo de vídeo padrão: `minimax/MiniMax-Hailuo-2.3`
- Modelo de vídeo OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Modos: fluxos de texto para vídeo e de referência com imagem única
- Suporte a `aspectRatio` e `resolution`

Para usar o MiniMax como provedor de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para ver parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

### Compreensão de imagens

O Plugin MiniMax registra a compreensão de imagens separadamente do catálogo
de texto:

| ID do provedor   | Modelo de imagem padrão |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

É por isso que o roteamento automático de mídia pode usar a compreensão de imagens do MiniMax mesmo
quando o catálogo incluído do provedor de texto ainda mostra referências de chat M2.7 somente texto.

### Pesquisa na web

O Plugin MiniMax também registra `web_search` por meio da API de pesquisa do MiniMax Coding Plan.

- Id do provedor: `minimax`
- Resultados estruturados: títulos, URLs, snippets, consultas relacionadas
- Variável de ambiente preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de ambiente aceito: `MINIMAX_CODING_API_KEY`
- Fallback de compatibilidade: `MINIMAX_API_KEY` quando ela já aponta para um token de coding plan
- Reutilização de região: `plugins.entries.minimax.config.webSearch.region`, depois `MINIMAX_API_HOST`, depois URLs base do provedor MiniMax
- A pesquisa permanece no id do provedor `minimax`; a configuração OAuth CN/global ainda pode direcionar a região indiretamente por meio de `models.providers.minimax-portal.baseUrl`

A configuração fica em `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulte [Pesquisa MiniMax](/pt-BR/tools/minimax-search) para ver a configuração e o uso completos da pesquisa na web.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Opções de configuração">
    | Opção | Descrição |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Prefira `https://api.minimax.io/anthropic` (compatível com Anthropic); `https://api.minimax.io/v1` é opcional para cargas compatíveis com OpenAI |
    | `models.providers.minimax.api` | Prefira `anthropic-messages`; `openai-completions` é opcional para cargas compatíveis com OpenAI |
    | `models.providers.minimax.apiKey` | Chave de API do MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Defina `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Dê alias aos modelos que você deseja na allowlist |
    | `models.mode` | Mantenha `merge` se quiser adicionar o MiniMax junto com os integrados |
  </Accordion>

  <Accordion title="Padrões de thinking">
    Em `api: "anthropic-messages"`, o OpenClaw injeta `thinking: { type: "disabled" }` a menos que thinking já esteja explicitamente definido em params/config.

    Isso evita que o endpoint de streaming do MiniMax emita `reasoning_content` em blocos delta no estilo OpenAI, o que exporia o raciocínio interno na saída visível.

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` ou `params.fastMode: true` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed` no caminho de stream compatível com Anthropic.
  </Accordion>

  <Accordion title="Exemplo de fallback">
    **Melhor para:** manter seu modelo mais forte da geração mais recente como principal e usar failover para o MiniMax M2.7. O exemplo abaixo usa Opus como principal concreto; troque pelo seu modelo principal de última geração preferido.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Detalhes de uso do Coding Plan">
    - API de uso do Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (requer uma chave de coding plan).
    - O OpenClaw normaliza o uso do coding plan do MiniMax para a mesma exibição de `% restante` usada por outros provedores. Os campos brutos `usage_percent` / `usagePercent` do MiniMax representam a cota restante, não a cota consumida, então o OpenClaw os inverte. Campos baseados em contagem têm prioridade quando presentes.
    - Quando a API retorna `model_remains`, o OpenClaw prefere a entrada do modelo de chat, deriva o rótulo da janela a partir de `start_time` / `end_time` quando necessário e inclui o nome do modelo selecionado no rótulo do plano para facilitar a distinção entre janelas do coding plan.
    - Snapshots de uso tratam `minimax`, `minimax-cn` e `minimax-portal` como a mesma superfície de cota do MiniMax e preferem OAuth MiniMax armazenado antes de recorrer às variáveis de ambiente da chave do Coding Plan.
  </Accordion>
</AccordionGroup>

## Observações

- As referências de modelo seguem o caminho de autenticação:
  - Configuração com chave de API: `minimax/<model>`
  - Configuração OAuth: `minimax-portal/<model>`
- Modelo de chat padrão: `MiniMax-M2.7`
- Modelo de chat alternativo: `MiniMax-M2.7-highspeed`
- A configuração inicial e a configuração direta por chave de API gravam definições de modelo somente texto para ambas as variantes M2.7
- A compreensão de imagens usa o provedor de mídia `MiniMax-VL-01`, de propriedade do Plugin
- Atualize os valores de preço em `models.json` se precisar de rastreamento de custo exato
- Use `openclaw models list` para confirmar o id atual do provedor e depois altere com `openclaw models set minimax/MiniMax-M2.7` ou `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link de indicação para MiniMax Coding Plan (10% de desconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Consulte [Provedores de modelo](/pt-BR/concepts/model-providers) para ver as regras de provedores.
</Note>

## Solução de problemas

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Isso normalmente significa que o **provedor MiniMax não está configurado** (não há entrada de provedor correspondente e nenhuma chave de ambiente/perfil de autenticação MiniMax encontrada). Uma correção para essa detecção está em **2026.1.12**. Corrija fazendo o seguinte:

    - Atualize para **2026.1.12** (ou execute a partir do código-fonte `main`) e reinicie o Gateway.
    - Execute `openclaw configure` e selecione uma opção de autenticação **MiniMax**, ou
    - Adicione manualmente o bloco correspondente `models.providers.minimax` ou `models.providers.minimax-portal`, ou
    - Defina `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou um perfil de autenticação MiniMax para que o provedor correspondente possa ser injetado.

    Certifique-se de que o id do modelo diferencia **maiúsculas de minúsculas**:

    - Caminho com chave de API: `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
    - Caminho OAuth: `minimax-portal/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7-highspeed`

    Depois confira novamente com:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Pesquisa MiniMax" href="/pt-BR/tools/minimax-search" icon="magnifying-glass">
    Configuração de pesquisa na web via MiniMax Coding Plan.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e FAQ.
  </Card>
</CardGroup>
