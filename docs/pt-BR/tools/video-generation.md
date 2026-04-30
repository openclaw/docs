---
read_when:
    - Gerando vídeos por meio do agente
    - Configuração de provedores e modelos de geração de vídeo
    - Entendendo os parâmetros da ferramenta video_generate
sidebarTitle: Video generation
summary: Gere vídeos via video_generate a partir de referências de texto, imagem ou vídeo em 16 backends de provedores
title: Geração de vídeo
x-i18n:
    generated_at: "2026-04-30T10:13:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91409057210af560d389513c2049d643c3e1602df51aa9825ceb01571626cdf
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

O OpenClaw trata a geração de vídeo como três modos de tempo de execução:

- `generate` — solicitações de texto para vídeo sem mídia de referência.
- `imageToVideo` — a solicitação inclui uma ou mais imagens de referência.
- `videoToVideo` — a solicitação inclui um ou mais vídeos de referência.

Os provedores podem ser compatíveis com qualquer subconjunto desses modos. A ferramenta valida o
modo ativo antes do envio e relata os modos compatíveis em `action=list`.

## Início rápido

<Steps>
  <Step title="Configure a autenticação">
    Defina uma chave de API para qualquer provedor compatível:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Escolha um modelo padrão (opcional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Peça ao agente">
    > Gere um vídeo cinematográfico de 5 segundos de uma lagosta simpática surfando ao pôr do sol.

    O agente chama `video_generate` automaticamente. Nenhuma lista de permissões de ferramentas
    é necessária.

  </Step>
</Steps>

## Como a geração assíncrona funciona

A geração de vídeo é assíncrona. Quando o agente chama `video_generate` em uma
sessão:

1. O OpenClaw envia a solicitação ao provedor e retorna imediatamente um id de tarefa.
2. O provedor processa o trabalho em segundo plano (normalmente de 30 segundos a 5 minutos, dependendo do provedor e da resolução).
3. Quando o vídeo fica pronto, o OpenClaw desperta a mesma sessão com um evento interno de conclusão.
4. O agente publica o vídeo finalizado de volta na conversa original.

Enquanto um trabalho está em andamento, chamadas duplicadas de `video_generate` na mesma
sessão retornam o status da tarefa atual em vez de iniciar outra
geração. Use `openclaw tasks list` ou `openclaw tasks show <taskId>` para
verificar o progresso pela CLI.

Fora de execuções de agente com sessão de apoio (por exemplo, invocações diretas de ferramentas),
a ferramenta recorre à geração em linha e retorna o caminho da mídia final
no mesmo turno.

Arquivos de vídeo gerados são salvos no armazenamento de mídia gerenciado pelo OpenClaw quando
o provedor retorna bytes. O limite padrão de salvamento de vídeos gerados segue
o limite de mídia de vídeo, e `agents.defaults.mediaMaxMb` o aumenta para
renderizações maiores. Quando um provedor também retorna uma URL de saída hospedada, o OpenClaw
pode entregar essa URL em vez de falhar a tarefa se a persistência local
rejeitar um arquivo grande demais.

### Ciclo de vida da tarefa

| Estado      | Significado                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Tarefa criada, aguardando o provedor aceitá-la.                                                  |
| `running`   | O provedor está processando (normalmente de 30 segundos a 5 minutos, dependendo do provedor e da resolução). |
| `succeeded` | Vídeo pronto; o agente desperta e o publica na conversa.                                         |
| `failed`    | Erro ou tempo limite do provedor; o agente desperta com detalhes do erro.                        |

Verifique o status pela CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Se uma tarefa de vídeo já estiver `queued` ou `running` para a sessão atual,
`video_generate` retorna o status da tarefa existente em vez de iniciar uma nova
tarefa. Use `action: "status"` para verificar explicitamente sem acionar uma nova
geração.

## Provedores compatíveis

| Provedor              | Modelo padrão                  | Texto | Ref. de imagem                                      | Ref. de vídeo                                  | Autenticação                             |
| --------------------- | ------------------------------ | :---: | -------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                   |   ✓   | Sim (URL remota)                                   | Sim (URL remota)                               | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`      |   ✓   | Até 2 imagens (somente modelos I2V; primeiro + último quadro) | —                                      | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`      |   ✓   | Até 2 imagens (primeiro + último quadro via função) | —                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` |   ✓   | Até 9 imagens de referência                        | Até 3 vídeos                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                     |   ✓   | 1 imagem                                           | —                                              | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`        |   ✓   | —                                                  | —                                              | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live` |   ✓   | 1 imagem; até 9 com Seedance de referência para vídeo | Até 3 vídeos com Seedance de referência para vídeo | `FAL_KEY`                           |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 imagem                                           | 1 vídeo                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`           |   ✓   | 1 imagem                                           | —                                              | `MINIMAX_API_KEY` ou MiniMax OAuth       |
| OpenAI                | `sora-2`                       |   ✓   | 1 imagem                                           | 1 vídeo                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`          |   ✓   | Até 4 imagens (primeiro/último quadro ou referências) | —                                          | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                   |   ✓   | Sim (URL remota)                                   | Sim (URL remota)                               | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                       |   ✓   | 1 imagem                                           | 1 vídeo                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`       |   ✓   | 1 imagem                                           | —                                              | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                         |   ✓   | 1 imagem (`kling`)                                 | —                                              | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`           |   ✓   | 1 imagem de primeiro quadro ou até 7 `reference_image`s | 1 vídeo                                  | `XAI_API_KEY`                            |

Alguns provedores aceitam variáveis de ambiente de chave de API adicionais ou alternativas. Consulte
as [páginas de provedores](#related) individuais para obter detalhes.

Execute `video_generate action=list` para inspecionar provedores, modelos e
modos de tempo de execução disponíveis em tempo de execução.

### Matriz de capacidades

O contrato de modo explícito usado por `video_generate`, testes de contrato e
a varredura compartilhada ao vivo:

| Provedor   | `generate` | `imageToVideo` | `videoToVideo` | Trilhas compartilhadas ao vivo hoje                                                                                                      |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor precisa de URLs de vídeo `http(s)` remotas                      |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Não está na varredura compartilhada; a cobertura específica de workflow fica com os testes do Comfy                                      |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; os esquemas de vídeo nativos do DeepInfra são de texto para vídeo no contrato incluído                                       |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` somente ao usar Seedance de referência para vídeo                                             |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque a varredura atual Gemini/Veo baseada em buffer não aceita essa entrada |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque este caminho de organização/entrada atualmente precisa de acesso de inpaint/remix do lado do provedor |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor precisa de URLs de vídeo `http(s)` remotas                      |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` roda somente quando o modelo selecionado é `runway/gen4_aleph`                                |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; `imageToVideo` compartilhado ignorado porque o `veo3` incluído é somente texto e o `kling` incluído exige uma URL de imagem remota |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor atualmente precisa de uma URL MP4 remota                        |

## Parâmetros da ferramenta

### Obrigatórios

<ParamField path="prompt" type="string" required>
  Descrição em texto do vídeo a gerar. Obrigatório para `action: "generate"`.
</ParamField>

### Entradas de conteúdo

<ParamField path="image" type="string">Imagem de referência única (caminho ou URL).</ParamField>
<ParamField path="images" type="string[]">Várias imagens de referência (até 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Dicas opcionais de função por posição, paralelas à lista combinada de imagens.
Valores canônicos: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Vídeo de referência único (caminho ou URL).</ParamField>
<ParamField path="videos" type="string[]">Vários vídeos de referência (até 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Dicas opcionais de função por posição, paralelas à lista combinada de vídeos.
Valor canônico: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Áudio de referência único (caminho ou URL). Usado para música de fundo ou
referência de voz quando o provedor oferece suporte a entradas de áudio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Vários áudios de referência (até 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Dicas opcionais de função por posição, paralelas à lista combinada de áudio.
Valor canônico: `reference_audio`.
</ParamField>

<Note>
As dicas de função são encaminhadas ao provedor como estão. Os valores
canônicos vêm da união `VideoGenerationAssetRole`, mas os provedores podem
aceitar strings de função adicionais. Arrays `*Roles` não devem ter mais
entradas do que a lista de referência correspondente; erros de deslocamento
de uma posição falham com uma mensagem clara. Use uma string vazia para
deixar uma posição sem definição. Para xAI, defina toda função de imagem como
`reference_image` para usar seu modo de geração `reference_images`; omita a
função ou use `first_frame` para imagem-para-vídeo com uma única imagem.
</Note>

### Controles de estilo

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` ou `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` ou `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Duração alvo em segundos (arredondada para o valor compatível mais próximo do provedor).
</ParamField>
<ParamField path="size" type="string">Dica de tamanho quando o provedor oferece suporte.</ParamField>
<ParamField path="audio" type="boolean">
  Habilita áudio gerado na saída quando houver suporte. Diferente de `audioRef*` (entradas).
</ParamField>
<ParamField path="watermark" type="boolean">Alterna a marca d'água do provedor quando houver suporte.</ParamField>

`adaptive` é um sentinela específico do provedor: ele é encaminhado como
está para provedores que declaram `adaptive` em seus recursos (por exemplo,
o BytePlus Seedance o usa para detectar automaticamente a proporção a partir
das dimensões da imagem de entrada). Provedores que não o declaram expõem o
valor via `details.ignoredOverrides` no resultado da ferramenta para que o
descarte fique visível.

### Avançado

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retorna a tarefa da sessão atual; `"list"` inspeciona provedores.
</ParamField>
<ParamField path="model" type="string">Substituição de provedor/modelo (por exemplo, `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Dica de nome de arquivo de saída.</ParamField>
<ParamField path="timeoutMs" type="number">Tempo limite opcional da solicitação ao provedor em milissegundos.</ParamField>
<ParamField path="providerOptions" type="object">
  Opções específicas do provedor como objeto JSON (por exemplo, `{"seed": 42, "draft": true}`).
  Provedores que declaram um esquema tipado validam as chaves e os tipos; chaves
  desconhecidas ou incompatibilidades ignoram o candidato durante o fallback.
  Provedores sem um esquema declarado recebem as opções como estão. Execute
  `video_generate action=list` para ver o que cada provedor aceita.
</ParamField>

<Note>
Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw
normaliza a duração para o valor compatível mais próximo do provedor e
remapeia dicas de geometria traduzidas, como tamanho-para-proporção, quando
um provedor de fallback expõe uma superfície de controle diferente.
Substituições realmente sem suporte são ignoradas com base no melhor esforço
e relatadas como avisos no resultado da ferramenta. Limites rígidos de
recurso (como excesso de entradas de referência) falham antes do envio. Os
resultados da ferramenta relatam as configurações aplicadas;
`details.normalization` captura qualquer tradução de solicitado-para-aplicado.
</Note>

Entradas de referência selecionam o modo de runtime:

- Nenhuma mídia de referência → `generate`
- Qualquer referência de imagem → `imageToVideo`
- Qualquer referência de vídeo → `videoToVideo`
- Entradas de áudio de referência **não** alteram o modo resolvido; elas são
  aplicadas sobre qualquer modo selecionado pelas referências de imagem/vídeo
  e funcionam apenas com provedores que declaram `maxInputAudios`.

Referências mistas de imagem e vídeo não são uma superfície de recurso
compartilhada estável. Prefira um tipo de referência por solicitação.

#### Fallback e opções tipadas

Algumas verificações de recurso são aplicadas na camada de fallback em vez
de no limite da ferramenta, portanto uma solicitação que excede os limites
do provedor primário ainda pode ser executada em um fallback capaz:

- Candidato ativo que não declara `maxInputAudios` (ou declara `0`) é ignorado
  quando a solicitação contém referências de áudio; o próximo candidato é tentado.
- `maxDurationSeconds` do candidato ativo abaixo do `durationSeconds`
  solicitado sem uma lista `supportedDurationSeconds` declarada → ignorado.
- A solicitação contém `providerOptions` e o candidato ativo declara
  explicitamente um esquema tipado `providerOptions` → ignorado se as chaves
  fornecidas não estiverem no esquema ou se os tipos de valor não corresponderem.
  Provedores sem um esquema declarado recebem as opções como estão
  (repasse compatível com versões anteriores). Um provedor pode recusar todas
  as opções de provedor declarando um esquema vazio (`capabilities.providerOptions: {}`),
  o que causa o mesmo salto de uma incompatibilidade de tipo.

O primeiro motivo de salto em uma solicitação é registrado em `warn` para
que operadores vejam quando o provedor primário foi preterido; saltos
subsequentes são registrados em `debug` para manter cadeias longas de
fallback silenciosas. Se todos os candidatos forem ignorados, o erro agregado
inclui o motivo do salto de cada um.

## Ações

| Ação       | O que faz                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| `generate` | Padrão. Cria um vídeo a partir do prompt fornecido e de entradas de referência opcionais.                  |
| `status`   | Verifica o estado da tarefa de vídeo em andamento para a sessão atual sem iniciar outra geração.           |
| `list`     | Mostra provedores, modelos e seus recursos disponíveis.                                                    |

## Seleção de modelo

O OpenClaw resolve o modelo nesta ordem:

1. **Parâmetro de ferramenta `model`** — se o agente especificar um na chamada.
2. **`videoGenerationModel.primary`** da configuração.
3. **`videoGenerationModel.fallbacks`** em ordem.
4. **Detecção automática** — provedores que têm autenticação válida, começando pelo
   provedor padrão atual e depois pelos provedores restantes em ordem alfabética.

Se um provedor falhar, o próximo candidato é tentado automaticamente. Se
todos os candidatos falharem, o erro inclui detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar
apenas as entradas explícitas `model`, `primary` e `fallbacks`.

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

## Notas de provedores

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
    modelos gerais `*-pro-*` oferecem suporte a uma única imagem de
    referência (primeiro quadro). Passe a imagem posicionalmente ou defina
    `role: "first_frame"`. IDs de modelo T2V são alternados automaticamente
    para a variante I2V correspondente quando uma imagem é fornecida.

    Chaves `providerOptions` compatíveis: `seed` (número), `draft` (booleano —
    força 480p), `camera_fixed` (booleano).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Requer o Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID do provedor: `byteplus-seedance15`. Modelo:
    `seedance-1-5-pro-251215`.

    Usa a API unificada `content[]`. Oferece suporte a no máximo 2 imagens
    de entrada (`first_frame` + `last_frame`). Todas as entradas devem ser
    URLs `https://` remotas. Defina `role: "first_frame"` / `"last_frame"`
    em cada imagem, ou passe imagens posicionalmente.

    `aspectRatio: "adaptive"` detecta automaticamente a proporção a partir
    da imagem de entrada. `audio: true` é mapeado para `generate_audio`.
    `providerOptions.seed` (número) é encaminhado.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Requer o Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID do provedor: `byteplus-seedance2`. Modelos:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Usa a API unificada `content[]`. Oferece suporte a até 9 imagens de
    referência, 3 vídeos de referência e 3 áudios de referência. Todas as
    entradas devem ser URLs `https://` remotas. Defina `role` em cada ativo —
    valores compatíveis: `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecta automaticamente a proporção a partir
    da imagem de entrada. `audio: true` é mapeado para `generate_audio`.
    `providerOptions.seed` (número) é encaminhado.

  </Accordion>
  <Accordion title="ComfyUI">
    Execução local ou em nuvem orientada por workflow. Oferece suporte a
    texto-para-vídeo e imagem-para-vídeo pelo grafo configurado.
  </Accordion>
  <Accordion title="fal">
    Usa um fluxo com fila para tarefas de longa duração. A maioria dos
    modelos de vídeo da fal aceita uma única referência de imagem. Modelos
    Seedance 2.0 de referência-para-vídeo aceitam até 9 imagens, 3 vídeos e
    3 referências de áudio, com no máximo 12 arquivos de referência no total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Oferece suporte a uma referência de imagem ou uma referência de vídeo.
  </Accordion>
  <Accordion title="MiniMax">
    Apenas referência de imagem única.
  </Accordion>
  <Accordion title="OpenAI">
    Apenas a substituição `size` é encaminhada. Outras substituições de estilo
    (`aspectRatio`, `resolution`, `audio`, `watermark`) são ignoradas com
    um aviso.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa a API assíncrona `/videos` do OpenRouter. O OpenClaw envia a tarefa,
    consulta `polling_url` e baixa `unsigned_urls` ou o endpoint documentado
    de conteúdo da tarefa. O padrão incluído `google/veo-3.1-fast` anuncia
    durações de 4/6/8 segundos, resoluções `720P`/`1080P` e proporções
    `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Mesmo backend DashScope da Alibaba. Entradas de referência devem ser
    URLs `http(s)` remotas; arquivos locais são rejeitados antecipadamente.
  </Accordion>
  <Accordion title="Runway">
    Oferece suporte a arquivos locais via URIs de dados. Vídeo-para-vídeo
    requer `runway/gen4_aleph`. Execuções somente texto expõem proporções
    `16:9` e `9:16`.
  </Accordion>
  <Accordion title="Together">
    Apenas referência de imagem única.
  </Accordion>
  <Accordion title="Vydra">
    Usa `https://www.vydra.ai/api/v1` diretamente para evitar redirecionamentos
    que descartam autenticação. `veo3` é incluído apenas como texto-para-vídeo;
    `kling` requer uma URL de imagem remota.
  </Accordion>
  <Accordion title="xAI">
    Oferece suporte a texto-para-vídeo, imagem-para-vídeo com um único primeiro
    quadro, até 7 entradas `reference_image` por meio de `reference_images`
    da xAI, e fluxos remotos de edição/extensão de vídeo.
  </Accordion>
</AccordionGroup>

## Modos de recursos do provedor

O contrato compartilhado de geração de vídeo oferece suporte a recursos específicos por modo em vez de apenas limites agregados planos. Novas implementações de provedor devem preferir blocos de modo explícitos:

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

Campos agregados planos como `maxInputImages` e `maxInputVideos` **não** são suficientes para anunciar suporte ao modo de transformação. Os provedores devem declarar `generate`, `imageToVideo` e `videoToVideo` explicitamente para que testes ao vivo, testes de contrato e a ferramenta compartilhada `video_generate` possam validar o suporte a modos de forma determinística.

Quando um modelo em um provedor tiver suporte mais amplo a entradas de referência do que os demais, use `maxInputImagesByModel`, `maxInputVideosByModel` ou `maxInputAudiosByModel` em vez de aumentar o limite de todo o modo.

## Testes ao vivo

Cobertura ao vivo opcional para os provedores compartilhados incluídos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Encapsulador do repositório:

```bash
pnpm test:live:media video
```

Este arquivo ao vivo carrega variáveis de ambiente de provedor ausentes de `~/.profile`, por padrão prefere chaves de API ao vivo/de ambiente antes de perfis de autenticação armazenados e executa um smoke seguro para release por padrão:

- `generate` para cada provedor não FAL na varredura.
- Prompt de lagosta de um segundo.
- Limite de operação por provedor de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão).

FAL é opcional porque a latência da fila do lado do provedor pode dominar o tempo de release:

```bash
pnpm test:live:media video --video-providers fal
```

Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados que a varredura compartilhada pode exercitar com segurança com mídia local:

- `imageToVideo` quando `capabilities.imageToVideo.enabled`.
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e o provedor/modelo aceita entrada de vídeo local baseada em buffer na varredura compartilhada.

Hoje, a faixa ao vivo compartilhada de `videoToVideo` cobre `runway` somente quando você seleciona `runway/gen4_aleph`.

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

Ou pela CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Relacionados

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
