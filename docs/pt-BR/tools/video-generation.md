---
read_when:
    - Gerando vídeos por meio do agente
    - Configuração de provedores e modelos de geração de vídeo
    - Entendendo os parâmetros da ferramenta video_generate
sidebarTitle: Video generation
summary: Gere vídeos por meio de video_generate usando referências de texto, imagem ou vídeo em 16 backends de provedores
title: Geração de vídeos
x-i18n:
    generated_at: "2026-07-12T15:44:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

Os agentes do OpenClaw geram vídeos a partir de prompts de texto, imagens de referência ou
vídeos existentes por meio de `video_generate`. Há suporte a dezesseis backends de
provedores; o agente escolhe o adequado automaticamente com base na configuração e
nas chaves de API disponíveis.

<Note>
`video_generate` só aparece quando pelo menos um provedor de geração de vídeo está
disponível. Se ele não estiver presente nas ferramentas do agente, defina uma chave de API de provedor ou
configure `agents.defaults.videoGenerationModel`.
</Note>

`video_generate` tem três modos de execução, determinados pelas entradas de referência
na chamada:

- `generate` - nenhuma mídia de referência (texto para vídeo).
- `imageToVideo` - uma ou mais imagens de referência.
- `videoToVideo` - um ou mais vídeos de referência.

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
    > Gere um vídeo cinematográfico de 5 segundos de uma lagosta simpática surfando ao pôr do sol.

    O agente chama `video_generate` automaticamente. Não é necessário incluir a ferramenta
    em uma lista de permissões.

  </Step>
</Steps>

## Como funciona a geração assíncrona

A geração de vídeo é assíncrona:

1. O OpenClaw envia a solicitação ao provedor e retorna imediatamente um id de tarefa.
2. O provedor processa o trabalho em segundo plano (normalmente de 30 segundos a vários minutos, dependendo do provedor e da resolução; provedores lentos baseados em fila podem executar até o tempo limite configurado).
3. Quando o vídeo fica pronto, o OpenClaw reativa a mesma sessão com um evento interno de conclusão.
4. O agente o informa pelo modo normal de resposta visível da sessão:
   resposta final automática ou `message(action="send")` quando a sessão exige
   a ferramenta de mensagens. Se a sessão solicitante estiver inativa, ou se sua reativação falhar e
   a mídia gerada ainda estiver ausente da resposta de conclusão, o OpenClaw envia
   uma alternativa direta idempotente com a mídia.

Enquanto um trabalho está em andamento, chamadas duplicadas de `video_generate` na mesma
sessão retornam o status atual da tarefa em vez de iniciar outra
geração. Use `action: "status"` para verificar sem acionar uma nova
geração, ou `openclaw tasks list` / `openclaw tasks show <lookup>` pela
CLI (consulte [Tarefas em segundo plano](/pt-BR/automation/tasks)).

Fora de execuções de agente vinculadas a uma sessão (por exemplo, invocações diretas de ferramentas),
a ferramenta recorre à geração em linha e retorna o caminho final da mídia
no mesmo turno.

Os arquivos de vídeo gerados são salvos no armazenamento de mídia gerenciado pelo OpenClaw quando o
provedor retorna bytes. O limite padrão é de 16MB (o limite compartilhado de mídia de
vídeo); `agents.defaults.mediaMaxMb` aumenta esse limite para renderizações maiores. Quando um
provedor também retorna uma URL de saída hospedada, o OpenClaw entrega essa URL em vez
de causar falha na tarefa caso a persistência local rejeite um arquivo grande demais.

### Ciclo de vida da tarefa

| Estado      | Significado                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `queued`    | Tarefa criada, aguardando o provedor aceitá-la.                                                                           |
| `running`   | O provedor está processando (normalmente de 30 segundos a vários minutos, dependendo do provedor e da resolução).          |
| `succeeded` | Vídeo pronto; o agente é reativado e o publica na conversa.                                                               |
| `failed`    | Erro ou tempo limite do provedor; o agente é reativado com os detalhes do erro.                                            |

Verifique o status pela CLI:

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## Provedores compatíveis

| Provedor              | Modelo padrão                   | Texto | Ref. de imagem                                         | Ref. de vídeo                                      | Autenticação                             |
| --------------------- | ------------------------------- | :---: | ------------------------------------------------------ | -------------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |   ✓   | Sim (URL remota)                                       | Sim (URL remota)                                   | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |   ✓   | Até 2 imagens (somente modelos I2V; primeiro + último quadro) | -                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |   ✓   | Até 2 imagens (primeiro + último quadro via função)    | -                                                  | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |   ✓   | Até 9 imagens de referência                            | Até 3 vídeos                                       | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |   ✓   | 1 imagem                                               | -                                                  | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |   ✓   | -                                                      | -                                                  | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |   ✓   | 1 imagem; até 9 com referência para vídeo do Seedance  | Até 3 vídeos com referência para vídeo do Seedance | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |   ✓   | 1 imagem                                               | 1 vídeo                                            | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |   ✓   | 1 imagem                                               | -                                                  | `MINIMAX_API_KEY` ou OAuth do MiniMax    |
| OpenAI                | `sora-2`                        |   ✓   | 1 imagem                                               | 1 vídeo                                            | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |   ✓   | Até 4 imagens (primeiro/último quadro ou referências)  | -                                                  | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |   ✓   | Sim (URL remota)                                       | Sim (URL remota)                                   | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |   ✓   | 1 imagem                                               | 1 vídeo                                            | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |   ✓   | Somente `Wan-AI/Wan2.2-I2V-A14B`                       | -                                                  | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |   ✓   | 1 imagem (`kling`)                                     | -                                                  | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |   ✓   | Clássico: 1 primeiro quadro ou 7 referências; 1.5: 1 quadro | Clássico: 1 vídeo                             | `XAI_API_KEY`                            |

Alguns provedores aceitam variáveis de ambiente de chave de API adicionais ou alternativas. Consulte
as [páginas dos provedores](#related) individuais para obter detalhes.

Execute `video_generate action=list` para inspecionar os provedores, modelos e
modos de execução disponíveis durante a execução.

### Matriz de recursos

O contrato explícito de modos usado por `video_generate`, pelos testes de contrato e
pela varredura compartilhada em ambiente real:

| Provedor   | `generate` | `imageToVideo` | `videoToVideo` | Cenários compartilhados em ambiente real atualmente                                                                                                      |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor exige URLs de vídeo `http(s)` remotas                                             |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                                |
| ComfyUI    |     ✓      |       ✓        |       -        | Não incluído na varredura compartilhada; a cobertura específica do fluxo de trabalho fica nos testes do Comfy                                             |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; os esquemas de vídeo nativos do DeepInfra são de texto para vídeo no contrato do plugin                                                        |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` somente ao usar referência para vídeo do Seedance                                                               |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque a varredura atual do Gemini/Veo baseada em buffer não aceita essa entrada         |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                                |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque este caminho de organização/entrada atualmente exige acesso à edição de vídeo pelo provedor |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                                |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor exige URLs de vídeo `http(s)` remotas                                             |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` é executado somente quando o modelo selecionado é `runway/gen4_aleph`                                          |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                                |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; `imageToVideo` compartilhado ignorado porque o `veo3` incluído aceita somente texto e o `kling` incluído exige uma URL de imagem remota        |
| xAI        |     ✓      |       ✓        |       ✓        | O Clássico oferece suporte a todos os modos; o Video 1.5 aceita somente imagem para vídeo; a entrada MP4 remota mantém `videoToVideo` fora da varredura compartilhada |

## Parâmetros da ferramenta

### Obrigatório

<ParamField path="prompt" type="string" required>
  Descrição textual do vídeo a ser gerado. Obrigatória para `action: "generate"`.
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
As dicas de função são encaminhadas ao provedor sem alterações. Os valores
canônicos vêm da união `VideoGenerationAssetRole`, mas os provedores podem
aceitar outras strings de função. Os arrays `*Roles` não devem ter mais
entradas do que a lista de referências correspondente; erros de deslocamento
por uma posição falham com uma mensagem clara. Use uma string vazia para deixar
uma posição sem definição. Para a xAI, defina todas as funções de imagem como
`reference_image` para usar seu modo de geração `reference_images`; omita a
função ou use `first_frame` para conversão de imagem única em vídeo.
</Note>

### Controles de estilo

<ParamField path="aspectRatio" type="string">
  Dica de proporção, como `1:1`, `16:9`, `9:16`, `adaptive` ou um valor específico do provedor. O OpenClaw normaliza ou ignora valores incompatíveis conforme o provedor.
</ParamField>
<ParamField path="resolution" type="string">Dica de resolução, como `360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K` ou um valor específico do provedor. O OpenClaw normaliza ou ignora valores incompatíveis conforme o provedor.</ParamField>
<ParamField path="durationSeconds" type="number">
  Duração desejada em segundos (arredondada para o valor compatível mais próximo oferecido pelo provedor).
</ParamField>
<ParamField path="size" type="string">Dica de tamanho quando o provedor oferece suporte.</ParamField>
<ParamField path="audio" type="boolean">
  Ativa o áudio gerado na saída quando houver suporte. Diferente de `audioRef*` (entradas).
</ParamField>
<ParamField path="watermark" type="boolean">Ativa ou desativa a marca-d'água do provedor quando houver suporte.</ParamField>

`adaptive` é um sentinela específico do provedor: ele é encaminhado sem
alterações aos provedores que declaram `adaptive` em suas capacidades (por
exemplo, o BytePlus Seedance o utiliza para detectar automaticamente a
proporção com base nas dimensões da imagem de entrada). Os provedores que não
o declaram apresentam o valor por meio de `details.ignoredOverrides` no
resultado da ferramenta, para tornar o descarte visível.

### Avançado

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retorna a tarefa atual da sessão; `"list"` inspeciona os provedores.
</ParamField>
<ParamField path="model" type="string">Substituição de provedor/modelo (por exemplo, `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Dica de nome do arquivo de saída.</ParamField>
<ParamField path="timeoutMs" type="number">Tempo limite opcional da operação do provedor em milissegundos. Quando omitido, o OpenClaw usa `agents.defaults.videoGenerationModel.timeoutMs`, caso esteja configurado; caso contrário, usa o padrão do provedor definido pelo autor do plugin, quando houver.</ParamField>
<ParamField path="providerOptions" type="object">
  Opções específicas do provedor como um objeto JSON (por exemplo, `{"seed": 42, "draft": true}`).
  Os provedores que declaram um esquema tipado validam as chaves e os tipos;
  chaves desconhecidas ou incompatibilidades fazem o candidato ser ignorado
  durante o fallback. Os provedores sem um esquema declarado recebem as opções
  sem alterações. Execute `video_generate action=list` para ver o que cada
  provedor aceita.
</ParamField>

<Note>
Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw
normaliza a duração para o valor compatível mais próximo oferecido pelo
provedor e remapeia dicas de geometria traduzidas, como tamanho para proporção,
quando um provedor de fallback expõe uma superfície de controle diferente.
Substituições realmente incompatíveis são ignoradas da melhor maneira possível
e relatadas como avisos no resultado da ferramenta. Limites rígidos de
capacidade (como entradas de referência em excesso) causam falha antes do envio.
Os resultados da ferramenta relatam as configurações aplicadas;
`details.normalization` registra qualquer conversão do valor solicitado para o
valor aplicado.
</Note>

As entradas de referência selecionam o modo de execução:

- Nenhuma mídia de referência -> `generate`
- Qualquer referência de imagem -> `imageToVideo`
- Qualquer referência de vídeo -> `videoToVideo`
- Entradas de áudio de referência **não** alteram o modo resolvido; elas são
  aplicadas sobre o modo selecionado pelas referências de imagem/vídeo e
  funcionam somente com provedores que declaram `maxInputAudios`.

Referências mistas de imagem e vídeo não constituem uma superfície estável de
capacidade compartilhada. Prefira um único tipo de referência por solicitação.

#### Fallback e opções tipadas

Algumas verificações de capacidade são aplicadas na camada de fallback, e não
no limite da ferramenta. Assim, uma solicitação que exceda os limites do
provedor principal ainda pode ser executada em um fallback compatível:

- O candidato ativo que não declara `maxInputAudios` (ou declara `0`) é ignorado
  quando a solicitação contém referências de áudio; o próximo candidato é
  tentado. A mesma proteção se aplica às quantidades de referências de imagem
  e vídeo em relação a `maxInputImages`/`maxInputVideos`.
- O candidato ativo cujo `maxDurationSeconds` seja inferior ao
  `durationSeconds` solicitado e que não tenha uma lista
  `supportedDurationSeconds` declarada -> é ignorado.
- A solicitação contém `providerOptions` e o candidato ativo declara
  explicitamente um esquema tipado de `providerOptions` -> é ignorado se as
  chaves fornecidas não estiverem no esquema ou se os tipos dos valores não
  corresponderem. Os provedores sem um esquema declarado recebem as opções sem
  alterações (repasse retrocompatível). Um provedor pode recusar todas as opções
  do provedor declarando um esquema vazio (`capabilities.providerOptions: {}`),
  o que causa o mesmo descarte que uma incompatibilidade de tipo.

O primeiro motivo de descarte de uma solicitação é registrado no nível `warn`,
para que os operadores vejam quando o provedor principal foi preterido; os
descartes posteriores são registrados no nível `debug`, para manter silenciosas
as longas cadeias de fallback. Se todos os candidatos forem ignorados, o erro
agregado incluirá o motivo de descarte de cada um.

## Ações

| Ação       | O que faz                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `generate` | Padrão. Cria um vídeo com base no prompt fornecido e nas entradas de referência opcionais.                          |
| `status`   | Verifica o estado da tarefa de vídeo em andamento na sessão atual sem iniciar outra geração.                        |
| `list`     | Exibe os provedores e modelos disponíveis, bem como suas capacidades.                                               |

## Seleção de modelo

O OpenClaw resolve o modelo nesta ordem:

1. **Parâmetro `model` da ferramenta** - se o agente especificar um na chamada.
2. **`videoGenerationModel.primary`** da configuração.
3. **`videoGenerationModel.fallbacks`** na ordem definida.
4. **Detecção automática** - provedores com autenticação válida, começando pelo
   provedor padrão atual e depois pelos provedores restantes em ordem
   alfabética.

Se um provedor falhar, o próximo candidato será tentado automaticamente. Se
todos os candidatos falharem, o erro incluirá os detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar
somente as entradas explícitas `model`, `primary` e `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // substituição opcional do tempo limite da solicitação ao provedor por ferramenta
      },
    },
  },
}
```

## Observações sobre provedores

<AccordionGroup>
  <Accordion title="Alibaba">
    Usa o endpoint assíncrono do DashScope / Model Studio. As imagens e os
    vídeos de referência devem ser URLs `http(s)` remotas.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID do provedor: `byteplus`.

    Modelos: `seedance-1-0-pro-250528` (padrão),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Os modelos T2V (`*-t2v-*`) não aceitam entradas de imagem; os modelos I2V
    e os modelos gerais `*-pro-*` oferecem suporte a uma única imagem de
    referência (primeiro quadro). Passe a imagem posicionalmente ou defina
    `role: "first_frame"`. Os IDs de modelos T2V são alterados automaticamente
    para a variante I2V correspondente quando uma imagem é fornecida.

    Chaves de `providerOptions` compatíveis: `seed` (número), `draft` (booleano -
    força 480p), `camera_fixed` (booleano).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Requer o plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (externo, não incluído). ID do provedor: `byteplus-seedance15`. Modelo:
    `seedance-1-5-pro-251215`.

    Usa a API unificada `content[]`. Oferece suporte a no máximo 2 imagens de
    entrada (`first_frame` + `last_frame`). Todas as entradas devem ser URLs
    `https://` remotas. Defina `role: "first_frame"` / `"last_frame"` em cada
    imagem ou passe as imagens posicionalmente.

    `aspectRatio: "adaptive"` detecta automaticamente a proporção com base na
    imagem de entrada. `audio: true` é mapeado para `generate_audio`.
    `providerOptions.seed` (número) é encaminhado.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Requer o plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (externo, não incluído). ID do provedor: `byteplus-seedance2`. Modelos:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Usa a API unificada `content[]`. Oferece suporte a até 9 imagens de
    referência, 3 vídeos de referência e 3 áudios de referência. Todas as
    entradas devem ser URLs `https://` remotas. Defina `role` em cada recurso -
    valores compatíveis:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecta automaticamente a proporção com base na
    imagem de entrada. `audio: true` é mapeado para `generate_audio`.
    `providerOptions.seed` (número) é encaminhado.

  </Accordion>
  <Accordion title="ComfyUI">
    Execução local ou na nuvem orientada por fluxos de trabalho. Oferece suporte a texto para vídeo e
    imagem para vídeo por meio do grafo configurado.
  </Accordion>
  <Accordion title="fal">
    Usa um fluxo baseado em fila para trabalhos de longa duração. Por padrão, o OpenClaw aguarda até 20
    minutos antes de considerar que um trabalho da fila do fal ainda em andamento
    atingiu o tempo limite. A maioria dos modelos de vídeo do fal
    aceita uma única referência de imagem. Os modelos Seedance 2.0 de referência para vídeo
    aceitam até 9 imagens, 3 vídeos e 3 referências de áudio, com
    no máximo 12 arquivos de referência no total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Oferece suporte a uma referência de imagem ou vídeo. As solicitações de áudio gerado são
    ignoradas com um aviso no caminho da API Gemini porque essa API rejeita
    o parâmetro `generateAudio` na geração de vídeo atual do Veo.
  </Accordion>
  <Accordion title="MiniMax">
    Apenas uma única referência de imagem. O MiniMax aceita as resoluções `768P` e `1080P`;
    solicitações como `720P` são normalizadas para o valor compatível mais próximo
    antes do envio.
  </Accordion>
  <Accordion title="OpenAI">
    Apenas a substituição de `size` é encaminhada. Outras substituições de estilo
    (`aspectRatio`, `resolution`, `audio`, `watermark`) são ignoradas com
    um aviso.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa a API assíncrona `/videos` do OpenRouter. O OpenClaw envia o
    trabalho, consulta `polling_url` e baixa `unsigned_urls` ou o
    endpoint de conteúdo do trabalho documentado. O padrão integrado `google/veo-3.1-fast`
    anuncia durações de 4/6/8 segundos, resoluções `720P`/`1080P` e
    proporções `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Usa o mesmo backend DashScope que o Alibaba. As entradas de referência devem ser URLs
    `http(s)` remotas; arquivos locais são rejeitados antecipadamente.
  </Accordion>
  <Accordion title="Runway">
    Oferece suporte a arquivos locais por meio de URIs de dados. Vídeo para vídeo requer
    `runway/gen4_aleph`. Execuções somente com texto disponibilizam as proporções
    `16:9` e `9:16`.
  </Accordion>
  <Accordion title="Together">
    Apenas uma única referência de imagem.
  </Accordion>
  <Accordion title="Vydra">
    Usa `https://www.vydra.ai/api/v1` diretamente para evitar redirecionamentos
    que descartam a autenticação. `veo3` é integrado apenas como texto para vídeo; `kling` requer
    uma URL de imagem remota.
  </Accordion>
  <Accordion title="xAI">
    O modelo padrão `grok-imagine-video` oferece suporte a texto para vídeo, imagem para vídeo com uma única
    imagem de primeiro quadro, até 7 entradas `reference_image` por meio de
    `reference_images` da xAI e fluxos remotos de edição/extensão de vídeo. A geração usa
    `480P` por padrão; imagem para vídeo com uma única imagem herda a proporção da origem quando
    `aspectRatio` é omitido. A edição/extensão de vídeo herda a geometria da entrada e
    não aceita substituições de proporção ou resolução. A extensão aceita de 2 a 10
    segundos.

    `grok-imagine-video-1.5` oferece apenas imagem para vídeo: forneça exatamente uma imagem.
    Ele oferece suporte a 1-15 segundos e `480P`, `720P` ou `1080P`, usando
    `480P` por padrão; omita `aspectRatio` para herdar a proporção da imagem de origem. Os identificadores
    de prévia e datados da versão 1.5 recebem a mesma validação e são encaminhados
    sem alterações.

  </Accordion>
</AccordionGroup>

## Modos de recursos dos provedores

O contrato compartilhado de geração de vídeo oferece suporte a recursos específicos por modo,
em vez de apenas limites agregados uniformes. Novas implementações de provedores
devem dar preferência a blocos de modo explícitos:

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

Campos agregados uniformes, como `maxInputImages` e `maxInputVideos`, **não**
são suficientes para anunciar suporte ao modo de transformação. Os provedores devem
declarar `generate`, `imageToVideo` e `videoToVideo` explicitamente para que testes
em produção, testes de contrato e a ferramenta compartilhada `video_generate` possam validar
o suporte aos modos de forma determinística.

Quando um modelo de um provedor tiver suporte a entradas de referência mais amplo que os
demais, use `maxInputImagesByModel`, `maxInputVideosByModel` ou
`maxInputAudiosByModel` em vez de aumentar o limite de todo o modo.

## Testes em produção

Cobertura opcional em produção para os provedores integrados compartilhados:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper do repositório:

```bash
pnpm test:live:media video
```

Por padrão, este arquivo de testes em produção usa as variáveis de ambiente já exportadas dos provedores antes dos perfis
de autenticação armazenados e executa um teste de fumaça seguro para lançamento:

- `generate` para todos os provedores que não sejam FAL na varredura.
- Prompt lobster de um segundo.
- Limite de tempo por operação e por provedor definido por
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão).

O FAL é opcional porque a latência da fila do lado do provedor pode dominar o tempo
de lançamento:

```bash
pnpm test:live:media video --video-providers fal
```

Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar os modos
de transformação declarados que a varredura compartilhada pode exercitar com segurança usando mídia local:

- `imageToVideo` quando `capabilities.imageToVideo.enabled`.
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e o
  provedor/modelo aceita entrada de vídeo local baseada em buffer na varredura
  compartilhada.

Atualmente, a execução em produção compartilhada de `videoToVideo` abrange apenas `runway` quando você
seleciona `runway/gen4_aleph`.

## Configuração

Defina o modelo padrão de geração de vídeo na configuração do OpenClaw:

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

Ou por meio da CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Relacionados

- [Alibaba Model Studio](/pt-BR/providers/alibaba)
- [Tarefas em segundo plano](/pt-BR/automation/tasks) - acompanhamento de tarefas para geração assíncrona de vídeos
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
