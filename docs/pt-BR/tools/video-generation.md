---
read_when:
    - Gerando vídeos pelo agente
    - Configuração de provedores e modelos de geração de vídeo
    - Entendendo os parâmetros da ferramenta video_generate
sidebarTitle: Video generation
summary: Gere vídeos por meio de video_generate a partir de referências de texto, imagem ou vídeo em 16 backends de provedores
title: Geração de vídeo
x-i18n:
    generated_at: "2026-05-05T06:15:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a86a820cc9f27baf4b17954d7ded7c2b7ff9eb456e7e75c3b2e7a7653cd675fd
    source_path: tools/video-generation.md
    workflow: 16
---

Os agentes do OpenClaw podem gerar vídeos a partir de prompts de texto, imagens de referência ou
vídeos existentes. Dezesseis backends de provedores são compatíveis, cada um com
diferentes opções de modelo, modos de entrada e conjuntos de recursos. O agente escolhe o
provedor certo automaticamente com base na sua configuração e nas chaves de API
disponíveis.

<Note>
A ferramenta `video_generate` só aparece quando pelo menos um provedor de geração de vídeo
está disponível. Se você não a vir nas ferramentas do seu agente, defina uma
chave de API de provedor ou configure `agents.defaults.videoGenerationModel`.
</Note>

O OpenClaw trata a geração de vídeo como três modos de runtime:

- `generate` — solicitações de texto para vídeo sem mídia de referência.
- `imageToVideo` — a solicitação inclui uma ou mais imagens de referência.
- `videoToVideo` — a solicitação inclui um ou mais vídeos de referência.

Os provedores podem oferecer suporte a qualquer subconjunto desses modos. A ferramenta valida o
modo ativo antes do envio e informa os modos compatíveis em `action=list`.

## Início rápido

<Steps>
  <Step title="Configurar autenticação">
    Defina uma chave de API para qualquer provedor compatível:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Escolher um modelo padrão (opcional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Pedir ao agente">
    > Gere um vídeo cinematográfico de 5 segundos de uma lagosta amigável surfando ao pôr do sol.

    O agente chama `video_generate` automaticamente. Não é necessário colocar a ferramenta
    em uma allowlist.

  </Step>
</Steps>

## Como a geração assíncrona funciona

A geração de vídeo é assíncrona. Quando o agente chama `video_generate` em uma
sessão:

1. O OpenClaw envia a solicitação ao provedor e retorna imediatamente um id de tarefa.
2. O provedor processa o trabalho em segundo plano (normalmente de 30 segundos a vários minutos, dependendo do provedor e da resolução; provedores lentos baseados em fila podem executar até o tempo limite configurado).
3. Quando o vídeo fica pronto, o OpenClaw desperta a mesma sessão com um evento interno de conclusão.
4. O agente informa o usuário e anexa o vídeo finalizado. Em chats de grupo/canal
   que usam entrega visível somente por ferramenta de mensagem, o agente retransmite o
   resultado pela ferramenta de mensagem em vez de o OpenClaw publicá-lo diretamente.

Enquanto um trabalho está em andamento, chamadas duplicadas de `video_generate` na mesma
sessão retornam o status da tarefa atual em vez de iniciar outra
geração. Use `openclaw tasks list` ou `openclaw tasks show <taskId>` para
verificar o progresso pela CLI.

Fora de execuções de agente com sessão (por exemplo, invocações diretas de ferramenta),
a ferramenta volta para a geração inline e retorna o caminho final da mídia
no mesmo turno.

Arquivos de vídeo gerados são salvos no armazenamento de mídia gerenciado pelo OpenClaw quando
o provedor retorna bytes. O limite padrão de salvamento de vídeo gerado segue
o limite de mídia de vídeo, e `agents.defaults.mediaMaxMb` o aumenta para
renders maiores. Quando um provedor também retorna uma URL de saída hospedada, o OpenClaw
pode entregar essa URL em vez de falhar a tarefa se a persistência local
rejeitar um arquivo grande demais.

### Ciclo de vida da tarefa

| Estado      | Significado                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Tarefa criada, aguardando o provedor aceitá-la.                                                       |
| `running`   | O provedor está processando (normalmente de 30 segundos a vários minutos, dependendo do provedor e da resolução). |
| `succeeded` | Vídeo pronto; o agente desperta e o publica na conversa.                                              |
| `failed`    | Erro do provedor ou tempo limite; o agente desperta com detalhes do erro.                             |

Verifique o status pela CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Se uma tarefa de vídeo já estiver `queued` ou `running` para a sessão atual,
`video_generate` retornará o status da tarefa existente em vez de iniciar uma nova
tarefa. Use `action: "status"` para verificar explicitamente sem acionar uma nova
geração.

## Provedores compatíveis

| Provedor              | Modelo padrão                  | Texto | Ref. de imagem                                      | Ref. de vídeo                                  | Autenticação                            |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Sim (URL remota)                                     | Sim (URL remota)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Até 2 imagens (somente modelos I2V; primeiro + último quadro) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Até 2 imagens (primeiro + último quadro via função)  | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Até 9 imagens de referência                          | Até 3 vídeos                                    | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 imagem                                             | —                                               | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 imagem; até 9 com Seedance reference-to-video      | Até 3 vídeos com Seedance reference-to-video    | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 imagem                                             | 1 vídeo                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 imagem                                             | —                                               | `MINIMAX_API_KEY` ou OAuth da MiniMax    |
| OpenAI                | `sora-2`                        |  ✓   | 1 imagem                                             | 1 vídeo                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Até 4 imagens (primeiro/último quadro ou referências) | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Sim (URL remota)                                     | Sim (URL remota)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 imagem                                             | 1 vídeo                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 imagem                                             | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 imagem (`kling`)                                   | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 imagem de primeiro quadro ou até 7 `reference_image`s | 1 vídeo                                         | `XAI_API_KEY`                            |

Alguns provedores aceitam variáveis de ambiente de chave de API adicionais ou alternativas. Veja
as [páginas de provedores](#related) individuais para detalhes.

Execute `video_generate action=list` para inspecionar provedores, modelos e
modos de runtime disponíveis em tempo de execução.

### Matriz de capacidades

O contrato explícito de modo usado por `video_generate`, testes de contrato e
a varredura live compartilhada:

| Provedor   | `generate` | `imageToVideo` | `videoToVideo` | Lanes live compartilhadas hoje                                                                                                           |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor precisa de URLs de vídeo `http(s)` remotas                     |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Não está na varredura compartilhada; a cobertura específica de workflow fica com os testes do Comfy                                      |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; esquemas de vídeo nativos da DeepInfra são de texto para vídeo no contrato empacotado                                        |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` somente ao usar Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque a varredura atual Gemini/Veo baseada em buffer não aceita essa entrada |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque este caminho de org/entrada atualmente precisa de acesso a inpaint/remix no lado do provedor |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor precisa de URLs de vídeo `http(s)` remotas                     |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` executa somente quando o modelo selecionado é `runway/gen4_aleph`                            |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; `imageToVideo` compartilhado ignorado porque o `veo3` empacotado é somente texto e o `kling` empacotado exige uma URL de imagem remota |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor atualmente precisa de uma URL MP4 remota                       |

## Parâmetros da ferramenta

### Obrigatório

<ParamField path="prompt" type="string" required>
  Descrição em texto do vídeo a gerar. Obrigatório para `action: "generate"`.
</ParamField>

### Entradas de conteúdo

<ParamField path="image" type="string">Uma única imagem de referência (caminho ou URL).</ParamField>
<ParamField path="images" type="string[]">Várias imagens de referência (até 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Dicas opcionais de função por posição, paralelas à lista combinada de imagens.
Valores canônicos: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Um único vídeo de referência (caminho ou URL).</ParamField>
<ParamField path="videos" type="string[]">Vários vídeos de referência (até 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Dicas opcionais de função por posição, paralelas à lista combinada de vídeos.
Valor canônico: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Um único áudio de referência (caminho ou URL). Usado para música de fundo ou
referência de voz quando o provedor oferece suporte a entradas de áudio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Vários áudios de referência (até 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Dicas opcionais de função por posição, paralelas à lista combinada de áudios.
Valor canônico: `reference_audio`.
</ParamField>

<Note>
As dicas de função são encaminhadas ao provedor sem alterações. Os valores canônicos vêm da
união `VideoGenerationAssetRole`, mas os provedores podem aceitar strings de
função adicionais. Os arrays `*Roles` não podem ter mais entradas do que a
lista de referências correspondente; erros de índice por uma posição falham com um erro claro.
Use uma string vazia para deixar um slot não definido. Para xAI, defina todas as funções de imagem como
`reference_image` para usar o modo de geração `reference_images`; omita a
função ou use `first_frame` para imagem para vídeo com uma única imagem.
</Note>

### Controles de estilo

<ParamField path="aspectRatio" type="string">
  Dica de proporção, como `1:1`, `16:9`, `9:16`, `adaptive` ou um valor específico do provedor. O OpenClaw normaliza ou ignora valores sem suporte por provedor.
</ParamField>
<ParamField path="resolution" type="string">Dica de resolução, como `480P`, `720P`, `768P`, `1080P`, `4K` ou um valor específico do provedor. O OpenClaw normaliza ou ignora valores sem suporte por provedor.</ParamField>
<ParamField path="durationSeconds" type="number">
  Duração desejada em segundos (arredondada para o valor mais próximo com suporte do provedor).
</ParamField>
<ParamField path="size" type="string">Dica de tamanho quando o provedor oferece suporte a isso.</ParamField>
<ParamField path="audio" type="boolean">
  Habilite áudio gerado na saída quando houver suporte. Diferente de `audioRef*` (entradas).
</ParamField>
<ParamField path="watermark" type="boolean">Ative ou desative a marca d'água do provedor quando houver suporte.</ParamField>

`adaptive` é um sentinela específico do provedor: ele é encaminhado sem alterações para
provedores que declaram `adaptive` em suas capacidades (por exemplo, o BytePlus
Seedance o usa para detectar automaticamente a proporção a partir das
dimensões da imagem de entrada). Provedores que não o declaram exibem o valor em
`details.ignoredOverrides` no resultado da ferramenta, para que o descarte fique visível.

### Avançado

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retorna a tarefa atual da sessão; `"list"` inspeciona os provedores.
</ParamField>
<ParamField path="model" type="string">Substituição de provedor/modelo (por exemplo, `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Dica de nome do arquivo de saída.</ParamField>
<ParamField path="timeoutMs" type="number">Tempo limite opcional da operação do provedor em milissegundos.</ParamField>
<ParamField path="providerOptions" type="object">
  Opções específicas do provedor como um objeto JSON (por exemplo, `{"seed": 42, "draft": true}`).
  Provedores que declaram um esquema tipado validam as chaves e os tipos; chaves
  desconhecidas ou incompatibilidades ignoram o candidato durante a alternância. Provedores sem um
  esquema declarado recebem as opções sem alterações. Execute `video_generate action=list`
  para ver o que cada provedor aceita.
</ParamField>

<Note>
Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw normaliza a duração para
o valor mais próximo com suporte do provedor e remapeia dicas de geometria traduzidas,
como tamanho para proporção, quando um provedor alternativo expõe uma
superfície de controle diferente. Substituições realmente sem suporte são ignoradas com base no melhor esforço
e relatadas como avisos no resultado da ferramenta. Limites rígidos de capacidade
(como referências de entrada em excesso) falham antes do envio. Os resultados da ferramenta
relatam as configurações aplicadas; `details.normalization` captura qualquer
tradução do solicitado para o aplicado.
</Note>

As entradas de referência selecionam o modo de execução:

- Nenhuma mídia de referência → `generate`
- Qualquer referência de imagem → `imageToVideo`
- Qualquer referência de vídeo → `videoToVideo`
- Entradas de áudio de referência **não** alteram o modo resolvido; elas se aplicam
  sobre qualquer modo selecionado pelas referências de imagem/vídeo e funcionam apenas
  com provedores que declaram `maxInputAudios`.

Misturar referências de imagem e vídeo não é uma superfície de capacidade compartilhada estável.
Prefira um tipo de referência por solicitação.

#### Alternância e opções tipadas

Algumas verificações de capacidade são aplicadas na camada de alternância, e não no
limite da ferramenta, de modo que uma solicitação que exceda os limites do provedor primário ainda pode
ser executada em um provedor alternativo capaz:

- Um candidato ativo que não declara `maxInputAudios` (ou declara `0`) é ignorado quando
  a solicitação contém referências de áudio; o próximo candidato é tentado.
- O `maxDurationSeconds` do candidato ativo abaixo do `durationSeconds` solicitado,
  sem lista `supportedDurationSeconds` declarada → ignorado.
- A solicitação contém `providerOptions` e o candidato ativo declara explicitamente
  um esquema tipado de `providerOptions` → ignorado se as chaves fornecidas
  não estiverem no esquema ou se os tipos de valor não corresponderem. Provedores sem um
  esquema declarado recebem as opções sem alterações (repasse
  compatível com versões anteriores). Um provedor pode recusar todas as opções de provedor
  declarando um esquema vazio (`capabilities.providerOptions: {}`), o que
  causa o mesmo descarte que uma incompatibilidade de tipo.

O primeiro motivo de descarte em uma solicitação é registrado em `warn`, para que os operadores vejam quando
o provedor primário foi preterido; descartes subsequentes são registrados em `debug` para
manter cadeias longas de alternância silenciosas. Se todos os candidatos forem descartados, o
erro agregado incluirá o motivo de descarte de cada um.

## Ações

| Ação       | O que faz                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| `generate` | Padrão. Cria um vídeo a partir do prompt fornecido e de entradas de referência opcionais.                  |
| `status`   | Verifica o estado da tarefa de vídeo em andamento para a sessão atual sem iniciar outra geração.           |
| `list`     | Mostra os provedores, modelos e suas capacidades disponíveis.                                              |

## Seleção de modelo

O OpenClaw resolve o modelo nesta ordem:

1. **Parâmetro da ferramenta `model`** — se o agente especificar um na chamada.
2. **`videoGenerationModel.primary`** da configuração.
3. **`videoGenerationModel.fallbacks`** em ordem.
4. **Detecção automática** — provedores que têm autenticação válida, começando pelo
   provedor padrão atual e depois os provedores restantes em ordem
   alfabética.

Se um provedor falhar, o próximo candidato será tentado automaticamente. Se todos
os candidatos falharem, o erro incluirá detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar
apenas as entradas explícitas de `model`, `primary` e `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Observações dos provedores

<AccordionGroup>
  <Accordion title="Alibaba">
    Usa o endpoint assíncrono do DashScope / Model Studio. Imagens e
    vídeos de referência devem ser URLs `http(s)` remotas.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID do provedor: `byteplus`.

    Modelos: `seedance-1-0-pro-250528` (padrão),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Modelos T2V (`*-t2v-*`) não aceitam entradas de imagem; modelos I2V e
    modelos gerais `*-pro-*` oferecem suporte a uma única imagem de referência (primeiro
    quadro). Passe a imagem posicionalmente ou defina `role: "first_frame"`.
    IDs de modelo T2V são automaticamente trocados para a variante I2V
    correspondente quando uma imagem é fornecida.

    Chaves `providerOptions` com suporte: `seed` (número), `draft` (booleano —
    força 480p), `camera_fixed` (booleano).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Requer o Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID do provedor: `byteplus-seedance15`. Modelo:
    `seedance-1-5-pro-251215`.

    Usa a API unificada `content[]`. Oferece suporte a no máximo 2 imagens de entrada
    (`first_frame` + `last_frame`). Todas as entradas devem ser URLs `https://`
    remotas. Defina `role: "first_frame"` / `"last_frame"` em cada imagem, ou
    passe as imagens posicionalmente.

    `aspectRatio: "adaptive"` detecta automaticamente a proporção a partir da imagem de entrada.
    `audio: true` é mapeado para `generate_audio`. `providerOptions.seed`
    (número) é encaminhado.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Requer o Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID do provedor: `byteplus-seedance2`. Modelos:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Usa a API unificada `content[]`. Oferece suporte a até 9 imagens de referência,
    3 vídeos de referência e 3 áudios de referência. Todas as entradas devem ser URLs
    `https://` remotas. Defina `role` em cada ativo — valores com suporte:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecta automaticamente a proporção a partir da imagem de entrada.
    `audio: true` é mapeado para `generate_audio`. `providerOptions.seed`
    (número) é encaminhado.

  </Accordion>
  <Accordion title="ComfyUI">
    Execução local ou em nuvem orientada por workflows. Suporta texto para vídeo e
    imagem para vídeo por meio do grafo configurado.
  </Accordion>
  <Accordion title="fal">
    Usa um fluxo baseado em fila para jobs de longa duração. O OpenClaw aguarda até 20
    minutos por padrão antes de tratar um job de fila fal em andamento como expirado.
    A maioria dos modelos de vídeo fal aceita uma única referência de imagem. Os
    modelos de referência para vídeo Seedance 2.0 aceitam até 9 imagens, 3 vídeos e
    3 referências de áudio, com no máximo 12 arquivos de referência no total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Suporta uma referência de imagem ou uma referência de vídeo. Solicitações de
    áudio gerado são ignoradas com um aviso no caminho da API Gemini porque essa API
    rejeita o parâmetro `generateAudio` para a geração de vídeo Veo atual.
  </Accordion>
  <Accordion title="MiniMax">
    Apenas uma referência de imagem. O MiniMax aceita resoluções `768P` e `1080P`;
    solicitações como `720P` são normalizadas para o valor compatível mais próximo
    antes do envio.
  </Accordion>
  <Accordion title="OpenAI">
    Somente a substituição de `size` é encaminhada. Outras substituições de estilo
    (`aspectRatio`, `resolution`, `audio`, `watermark`) são ignoradas com
    um aviso.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa a API assíncrona `/videos` da OpenRouter. O OpenClaw envia o
    job, consulta `polling_url` e baixa `unsigned_urls` ou o
    endpoint de conteúdo do job documentado. O padrão `google/veo-3.1-fast` incluído
    anuncia durações de 4/6/8 segundos, resoluções `720P`/`1080P` e
    proporções `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    O mesmo backend DashScope da Alibaba. As entradas de referência devem ser URLs
    `http(s)` remotas; arquivos locais são rejeitados antecipadamente.
  </Accordion>
  <Accordion title="Runway">
    Suporta arquivos locais via URIs de dados. Vídeo para vídeo requer
    `runway/gen4_aleph`. Execuções apenas com texto expõem proporções
    `16:9` e `9:16`.
  </Accordion>
  <Accordion title="Together">
    Apenas uma referência de imagem.
  </Accordion>
  <Accordion title="Vydra">
    Usa `https://www.vydra.ai/api/v1` diretamente para evitar redirecionamentos
    que removem autenticação. `veo3` é incluído apenas como texto para vídeo; `kling`
    requer uma URL de imagem remota.
  </Accordion>
  <Accordion title="xAI">
    Suporta texto para vídeo, imagem única de primeiro quadro para vídeo, até 7
    entradas `reference_image` por meio de `reference_images` da xAI e fluxos remotos
    de edição/extensão de vídeo.
  </Accordion>
</AccordionGroup>

## Modos de capacidade de provedores

O contrato compartilhado de geração de vídeo oferece suporte a capacidades
específicas por modo, em vez de apenas limites agregados planos. Novas implementações
de provedores devem preferir blocos de modo explícitos:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Campos agregados planos como `maxInputImages` e `maxInputVideos` **não** são
suficientes para anunciar suporte a modos de transformação. Provedores devem
declarar `generate`, `imageToVideo` e `videoToVideo` explicitamente para que testes
live, testes de contrato e a ferramenta compartilhada `video_generate` possam
validar o suporte a modos de forma determinística.

Quando um modelo de um provedor tem suporte mais amplo a entradas de referência do
que o restante, use `maxInputImagesByModel`, `maxInputVideosByModel` ou
`maxInputAudiosByModel` em vez de aumentar o limite de todo o modo.

## Testes live

Cobertura live opcional para os provedores compartilhados incluídos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper do repositório:

```bash
pnpm test:live:media video
```

Esse arquivo live carrega variáveis de ambiente ausentes do provedor a partir de
`~/.profile`, prefere chaves de API live/de ambiente antes de perfis de autenticação
armazenados por padrão e executa um smoke seguro para releases por padrão:

- `generate` para todos os provedores não FAL na varredura.
- Prompt de lagosta de um segundo.
- Limite de operação por provedor a partir de
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão).

FAL é opcional porque a latência da fila do lado do provedor pode dominar o tempo
de release:

```bash
pnpm test:live:media video --video-providers fal
```

Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de
transformação declarados que a varredura compartilhada consegue exercitar com
segurança usando mídia local:

- `imageToVideo` quando `capabilities.imageToVideo.enabled`.
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e o
  provedor/modelo aceita entrada de vídeo local baseada em buffer na varredura
  compartilhada.

Hoje a lane live compartilhada de `videoToVideo` cobre `runway` somente quando você
seleciona `runway/gen4_aleph`.

## Configuração

Defina o modelo padrão de geração de vídeo na sua configuração do OpenClaw:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Ou via CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Relacionado

- [Alibaba Model Studio](/pt-BR/providers/alibaba)
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — acompanhamento de tarefas para geração assíncrona de vídeo
- [BytePlus](/pt-BR/concepts/model-providers#byteplus-international)
- [ComfyUI](/pt-BR/providers/comfy)
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults)
- [fal](/pt-BR/providers/fal)
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [Modelos](/pt-BR/concepts/models)
- [OpenAI](/pt-BR/providers/openai)
- [Qwen](/pt-BR/providers/qwen)
- [Runway](/pt-BR/providers/runway)
- [Together AI](/pt-BR/providers/together)
- [Visão geral das ferramentas](/pt-BR/tools)
- [Vydra](/pt-BR/providers/vydra)
- [xAI](/pt-BR/providers/xai)
