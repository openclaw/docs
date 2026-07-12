---
read_when:
    - Você quer modelos MiniMax no OpenClaw
    - Você precisa de orientações para configurar o MiniMax
summary: Use modelos MiniMax no OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T00:19:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  O plugin `minimax` incluído registra dois provedores e mais cinco recursos: chat, geração de imagens, geração de música, geração de vídeo, compreensão de imagens, fala (T2A v2) e pesquisa na web.

  | ID do provedor   | Autenticação | Recursos                                                                                                  |
  | ---------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
  | `minimax`        | Chave de API | Texto, geração de imagens, geração de música, geração de vídeo, compreensão de imagens, fala, pesquisa na web |
  | `minimax-portal` | OAuth        | Texto, geração de imagens, geração de música, geração de vídeo, compreensão de imagens, fala                  |

  <Tip>
  Link de indicação para o MiniMax Coding Plan (10% de desconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Catálogo integrado

  | Modelo                   | Tipo                    | Descrição                                           |
  | ------------------------ | ----------------------- | --------------------------------------------------- |
  | `MiniMax-M3`             | Chat (raciocínio)       | Modelo de raciocínio hospedado padrão                |
  | `MiniMax-M2.7`           | Chat (raciocínio)       | Modelo de raciocínio hospedado anterior              |
  | `MiniMax-M2.7-highspeed` | Chat (raciocínio)       | Camada de raciocínio M2.7 mais rápida                |
  | `MiniMax-VL-01`          | Visão                   | Modelo de compreensão de imagens                     |
  | `image-01`               | Geração de imagens      | Edição de texto para imagem e de imagem para imagem  |
  | `music-2.6`              | Geração de música       | Modelo de música padrão                              |
  | `MiniMax-Hailuo-2.3`     | Geração de vídeo        | Fluxos de texto para vídeo e de imagem para vídeo    |

  As referências de modelo seguem o método de autenticação: `minimax/<model>` para configurações com chave de API e `minimax-portal/<model>` para configurações com OAuth.

  ## Primeiros passos

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Ideal para:** configuração rápida com o MiniMax Coding Plan via OAuth, sem necessidade de chave de API.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Executar a integração inicial">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            URL base resultante do provedor: `api.minimax.io`.
          </Step>
          <Step title="Verificar se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Executar a integração inicial">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            URL base resultante do provedor: `api.minimaxi.com`.
          </Step>
          <Step title="Verificar se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    As configurações com OAuth usam o ID de provedor `minimax-portal`. As referências de modelo seguem o formato `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="Chave de API">
    **Ideal para:** MiniMax hospedado com API compatível com a Anthropic.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Executar a integração inicial">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Isso configura `api.minimax.io` como a URL base.
          </Step>
          <Step title="Verificar se o modelo está disponível">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Executar a integração inicial">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Isso configura `api.minimaxi.com` como a URL base.
          </Step>
          <Step title="Verificar se o modelo está disponível">
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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
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
    O endpoint de streaming compatível com a Anthropic do MiniMax-M2.x emite `reasoning_content` em fragmentos delta no estilo da OpenAI, em vez de blocos de raciocínio nativos da Anthropic, o que expõe o raciocínio interno na saída visível caso o raciocínio permaneça implicitamente ativado. O OpenClaw desativa o raciocínio do M2.x por padrão, a menos que você defina `thinking` explicitamente. O MiniMax-M3 (e o M3.x com compatibilidade futura) é uma exceção: o M3 emite blocos de raciocínio adequados da Anthropic e exige que o raciocínio esteja ativo para produzir conteúdo visível; por isso, o OpenClaw mantém o M3 no caminho de raciocínio adaptativo do provedor. Consulte a seção Padrões de raciocínio em Configuração avançada abaixo.
    </Warning>

    <Note>
    As configurações com chave de API usam o ID de provedor `minimax`. As referências de modelo seguem o formato `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configurar por meio de `openclaw configure`

<Steps>
  <Step title="Inicie o assistente">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Selecione Modelo/autenticação">
    Escolha **Modelo/autenticação** no menu.
  </Step>
  <Step title="Escolha uma opção de autenticação da MiniMax">
    | Opção de autenticação  | Descrição                              |
    | ----------------------- | -------------------------------------- |
    | `minimax-global-oauth` | OAuth internacional (Plano de Coding)  |
    | `minimax-cn-oauth`     | OAuth da China (Plano de Coding)       |
    | `minimax-global-api`   | Chave de API internacional             |
    | `minimax-cn-api`       | Chave de API da China                  |
  </Step>
  <Step title="Escolha seu modelo padrão">
    Selecione seu modelo padrão quando solicitado.
  </Step>
</Steps>

## Recursos

### Geração de imagens

O plugin MiniMax registra o modelo `image-01` para a ferramenta `image_generate` tanto em `minimax` quanto em `minimax-portal`, reutilizando a mesma `MINIMAX_API_KEY` ou autenticação OAuth dos modelos de texto.

- Geração de texto para imagem e edição de imagem para imagem (referência de assunto), ambas com controle da proporção
- Até 9 imagens de saída por solicitação e 1 imagem de referência por solicitação de edição
- Proporções compatíveis: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

A geração de imagens sempre usa o endpoint dedicado de imagens da MiniMax (`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`, pois esse campo configura a URL base compatível com chat/Anthropic. Defina `MINIMAX_API_HOST=https://api.minimaxi.com` para encaminhar a geração de imagens pelo endpoint da China; o endpoint global padrão é `https://api.minimax.io`.

<Note>
Consulte [Geração de imagens](/pt-BR/tools/image-generation) para conhecer os parâmetros compartilhados da ferramenta, a seleção de provedor e o comportamento de failover.
</Note>

### Conversão de texto em fala

O plugin `minimax` incluído registra o MiniMax T2A v2 como provedor de fala para `messages.tts`.

- Modelo TTS padrão: `speech-2.8-hd`
- Voz padrão: `English_expressive_narrator`
- IDs dos modelos incluídos: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Ordem de resolução da autenticação: `messages.tts.providers.minimax.apiKey`, depois perfis de autenticação OAuth/token de `minimax-portal`, depois chaves de ambiente do Plano de Tokens (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`) e, por fim, `MINIMAX_API_KEY`
- Se nenhum host de TTS estiver configurado, o OpenClaw reutiliza o host OAuth configurado de `minimax-portal` e remove sufixos de caminho compatíveis com Anthropic, como `/anthropic`
- Anexos de áudio comuns permanecem em MP3. Destinos de mensagens de voz (Feishu, Telegram e outros canais que solicitam um anexo compatível com mensagens de voz) são transcodificados do MP3 da MiniMax para Opus a 48 kHz com `ffmpeg`, pois, por exemplo, a API de arquivos do Feishu/Lark aceita apenas `file_type: "opus"` para mensagens de áudio nativas
- O MiniMax T2A aceita valores fracionários de `speed` e `vol`, mas `pitch` é enviado como um número inteiro; o OpenClaw trunca valores fracionários de `pitch` antes da solicitação à API

| Configuração                              | Variável de ambiente    | Padrão                        | Descrição                                      |
| ----------------------------------------- | ---------------------- | ----------------------------- | ---------------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host da API MiniMax T2A.                       |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID do modelo TTS.                              |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID da voz usada para a saída de fala.          |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Velocidade de reprodução, `0.5..2.0`.          |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volume, `(0, 10]`.                             |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Deslocamento inteiro de tom, `-12..12`.        |

### Geração de música

O plugin MiniMax incluído registra a geração de música por meio da ferramenta compartilhada `music_generate` tanto para `minimax` quanto para `minimax-portal`.

- Modelo de música padrão: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Também oferece suporte a `music-2.6-free`, `music-cover` e `music-cover-free`
- Controles do prompt: `lyrics`, `instrumental`
- Formato de saída: `mp3`
- Execuções com suporte de sessão são desvinculadas por meio do fluxo compartilhado de tarefa/status, incluindo `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Consulte [Geração de música](/pt-BR/tools/music-generation) para conhecer os parâmetros compartilhados da ferramenta, a seleção de provedor e o comportamento de failover.
</Note>

### Geração de vídeos

O plugin MiniMax incluído registra a geração de vídeos por meio da ferramenta compartilhada `video_generate` tanto para `minimax` quanto para `minimax-portal`.

- Modelo de vídeo padrão: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Também oferece suporte a `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` e `I2V-01`
- Modos: fluxos de texto para vídeo e de referência de imagem única
- Oferece suporte a `resolution` (`768P` ou `1080P` nos modelos Hailuo 2.3/02); `aspectRatio` não é compatível e é ignorado

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para ver os parâmetros compartilhados da ferramenta, a seleção de provedor e o comportamento de failover.
</Note>

### Compreensão de imagens

O Plugin MiniMax registra a compreensão de imagens separadamente do catálogo de texto:

| ID do provedor   | Modelo de imagem padrão | Extração de texto de PDF |
| ---------------- | ------------------------ | ------------------------ |
| `minimax`        | `MiniMax-VL-01`          | `MiniMax-M2.7`           |
| `minimax-portal` | `MiniMax-VL-01`          | `MiniMax-M2.7`           |

É por isso que o roteamento automático de mídia pode usar a compreensão de imagens do MiniMax mesmo quando o catálogo integrado de provedores de texto também inclui referências de chat M3 com recursos de imagem. A compreensão de PDFs usa `MiniMax-M2.7` somente para extração de texto; o MiniMax não registra um caminho de conversão de PDF em imagem.

### Pesquisa na web

O Plugin MiniMax também registra `web_search` por meio da API de pesquisa do MiniMax Token Plan (`/v1/coding_plan/search`).

- ID do provedor: `minimax`
- Resultados estruturados: títulos, URLs, trechos, consultas relacionadas
- Variável de ambiente preferencial: `MINIMAX_CODE_PLAN_KEY`
- Aliases de ambiente aceitos: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Fallback de compatibilidade: `MINIMAX_API_KEY` quando ela já aponta para uma credencial de plano de tokens
- Reutilização de região: `plugins.entries.minimax.config.webSearch.region`, depois `MINIMAX_API_HOST` e, por fim, as URLs base do provedor MiniMax
- A pesquisa permanece no ID de provedor `minimax`; a configuração OAuth para CN/global pode direcionar a região indiretamente por meio de `models.providers.minimax-portal.baseUrl` e fornecer autenticação bearer por meio de `MINIMAX_OAUTH_TOKEN`

A configuração fica em `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulte [Pesquisa do MiniMax](/pt-BR/tools/minimax-search) para ver a configuração e o uso completos da pesquisa na web.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Opções de configuração">
    | Opção | Descrição |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Dê preferência a `https://api.minimax.io/anthropic` (compatível com Anthropic); `https://api.minimax.io/v1` é opcional para payloads compatíveis com OpenAI |
    | `models.providers.minimax.api` | Dê preferência a `anthropic-messages`; `openai-completions` é opcional para payloads compatíveis com OpenAI |
    | `models.providers.minimax.apiKey` | Chave de API do MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Defina `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Defina aliases para os modelos que você deseja na lista de permissões |
    | `models.mode` | Mantenha `merge` se quiser adicionar o MiniMax junto aos modelos integrados |
  </Accordion>

  <Accordion title="Padrões de raciocínio">
    Com `api: "anthropic-messages"`, o OpenClaw injeta `thinking: { type: "disabled" }` nos modelos MiniMax M2.x, a menos que um wrapper anterior já tenha definido o campo `thinking` no payload. Isso impede que o endpoint de streaming do M2.x emita `reasoning_content` em blocos delta no estilo OpenAI, o que exporia o raciocínio interno na saída visível.

    O MiniMax-M3 (e M3.x) é uma exceção: o M3 retorna um array `content` vazio com `stop_reason: "end_turn"` quando o raciocínio está desativado. Por isso, o OpenClaw remove o padrão implícito de desativação para o M3 e, quando um nível de raciocínio está definido, força `thinking: { type: "adaptive" }`.

    Níveis de raciocínio disponíveis por família de modelos:

    | Família de modelos | Níveis                                    | Padrão     |
    | ------------------ | ----------------------------------------- | ---------- |
    | `MiniMax-M3`       | `off`, `adaptive`                         | `adaptive` |
    | `MiniMax-M2.x`     | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` ou `params.fastMode: true` substitui `MiniMax-M2.7` por `MiniMax-M2.7-highspeed` no caminho de streaming compatível com Anthropic (`api: "anthropic-messages"`, provedor `minimax` ou `minimax-portal`).
  </Accordion>

  <Accordion title="Exemplo de fallback">
    **Mais indicado para:** manter seu modelo mais poderoso de última geração como principal e usar o MiniMax M2.7 como failover. O exemplo abaixo usa o Opus como modelo principal concreto; substitua-o pelo modelo principal de última geração de sua preferência.

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
    - API de uso do Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` ou `https://api.minimax.io/v1/token_plan/remains` (requer uma chave de plano de programação).
    - A consulta periódica de uso deriva o host de `models.providers.minimax-portal.baseUrl` ou `models.providers.minimax.baseUrl` quando configurados. Assim, configurações globais que usam `https://api.minimax.io/anthropic` consultam `api.minimax.io`. URLs base ausentes ou malformadas mantêm o fallback para CN por compatibilidade.
    - O OpenClaw normaliza o uso do plano de programação do MiniMax para a mesma exibição de `% restante` usada por outros provedores. Os campos brutos `usage_percent` / `usagePercent` do MiniMax representam a cota restante, não a cota consumida, portanto o OpenClaw os inverte. Campos baseados em contagem têm prioridade quando presentes.
    - Quando a API retorna `model_remains`, o OpenClaw dá preferência à entrada do modelo de chat, deriva o rótulo da janela de `start_time` / `end_time` quando necessário e inclui o nome do modelo selecionado no rótulo do plano para facilitar a diferenciação das janelas do plano de programação.
    - Os instantâneos de uso tratam `minimax`, `minimax-cn`, `minimax-portal` e `minimax-portal-cn` como a mesma superfície de cota do MiniMax e dão preferência ao OAuth armazenado do MiniMax antes de recorrer às variáveis de ambiente da chave do Coding Plan.

  </Accordion>
</AccordionGroup>

## Observações

- Modelo de chat padrão: `MiniMax-M3`. Modelos de chat alternativos: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- A integração inicial e a configuração direta por chave de API gravam definições de modelo para o M3 e para ambas as variantes do M2.7
- A compreensão de imagens usa o provedor de mídia `MiniMax-VL-01`, pertencente ao Plugin
- Atualize os valores de preços em `models.json` se precisar de acompanhamento exato de custos
- Use `openclaw models list` para confirmar o ID atual do provedor e depois altere-o com `openclaw models set minimax/MiniMax-M3` ou `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Consulte [Provedores de modelos](/pt-BR/concepts/model-providers) para ver as regras dos provedores.
</Note>

## Solução de problemas

<AccordionGroup>
  <Accordion title='"Modelo desconhecido: minimax/MiniMax-M3"'>
    Isso geralmente significa que o **provedor MiniMax não está configurado** (nenhuma entrada de provedor correspondente e nenhum perfil de autenticação ou chave de ambiente do MiniMax foram encontrados). Corrija da seguinte forma:

    - Execute `openclaw configure` e selecione uma opção de autenticação do **MiniMax**, ou
    - Adicione manualmente o bloco `models.providers.minimax` ou `models.providers.minimax-portal` correspondente, ou
    - Defina `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou um perfil de autenticação do MiniMax para que o provedor correspondente possa ser injetado.

    O ID do modelo **diferencia maiúsculas de minúsculas**:

    - Caminho por chave de API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
    - Caminho por OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7-highspeed`

    Em seguida, verifique novamente com:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [Perguntas frequentes](/pt-BR/help/faq).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagens e seleção de provedor.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Pesquisa do MiniMax" href="/pt-BR/tools/minimax-search" icon="magnifying-glass">
    Configuração da pesquisa na web por meio do MiniMax Token Plan.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas gerais e perguntas frequentes.
  </Card>
</CardGroup>
