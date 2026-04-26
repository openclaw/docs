---
read_when:
    - Gerando vídeos via o agente
    - Configurando provedores e modelos de geração de vídeo
    - Entendendo os parâmetros da ferramenta `video_generate`
sidebarTitle: Video generation
summary: Gerar vídeos via `video_generate` a partir de referências de texto, imagem ou vídeo em 14 backends de provedores
title: Geração de vídeo
x-i18n:
    generated_at: "2026-04-26T11:40:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
    source_path: tools/video-generation.md
    workflow: 15
---

Os agentes do OpenClaw podem gerar vídeos a partir de prompts de texto, imagens de referência ou
vídeos existentes. Há suporte para quatorze backends de provedores, cada um com
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
    > Gere um vídeo cinematográfico de 5 segundos de uma lagosta simpática surfando ao pôr do sol.

    O agente chama `video_generate` automaticamente. Nenhuma allowlist de ferramenta
    é necessária.

  </Step>
</Steps>

## Como a geração assíncrona funciona

A geração de vídeo é assíncrona. Quando o agente chama `video_generate` em uma
sessão:

1. O OpenClaw envia a solicitação ao provedor e retorna imediatamente um ID de tarefa.
2. O provedor processa o job em segundo plano (normalmente de 30 segundos a 5 minutos, dependendo do provedor e da resolução).
3. Quando o vídeo fica pronto, o OpenClaw desperta a mesma sessão com um evento interno de conclusão.
4. O agente publica o vídeo finalizado de volta na conversa original.

Enquanto um job está em andamento, chamadas duplicadas de `video_generate` na mesma
sessão retornam o status da tarefa atual em vez de iniciar outra
geração. Use `openclaw tasks list` ou `openclaw tasks show <taskId>` para
verificar o progresso pela CLI.

Fora de execuções de agente com suporte de sessão (por exemplo, invocações diretas de ferramenta),
a ferramenta recorre à geração inline e retorna o caminho final da mídia
no mesmo turno.

Arquivos de vídeo gerados são salvos no armazenamento de mídia gerenciado pelo OpenClaw quando
o provedor retorna bytes. O limite padrão de salvamento de vídeo gerado segue
o limite de mídia de vídeo, e `agents.defaults.mediaMaxMb` o aumenta para
renders maiores. Quando um provedor também retorna uma URL de saída hospedada, o OpenClaw
pode entregar essa URL em vez de falhar a tarefa se a persistência local
rejeitar um arquivo grande demais.

### Ciclo de vida da tarefa

| Estado      | Significado                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Tarefa criada, aguardando o provedor aceitá-la.                                               |
| `running`   | O provedor está processando (normalmente de 30 segundos a 5 minutos, dependendo do provedor e da resolução). |
| `succeeded` | Vídeo pronto; o agente desperta e o publica na conversa.                                      |
| `failed`    | Erro do provedor ou timeout; o agente desperta com detalhes do erro.                          |

Verifique o status pela CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Se uma tarefa de vídeo já estiver `queued` ou `running` para a sessão atual,
`video_generate` retorna o status da tarefa existente em vez de iniciar uma nova.
Use `action: "status"` para verificar explicitamente sem acionar uma nova
geração.

## Provedores compatíveis

| Provedor              | Modelo padrão                   | Texto | Imagem de ref                                         | Vídeo de ref                                    | Autenticação                           |
| --------------------- | ------------------------------- | :---: | ----------------------------------------------------- | ----------------------------------------------- | -------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓    | Sim (URL remota)                                      | Sim (URL remota)                                | `MODELSTUDIO_API_KEY`                  |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓    | Até 2 imagens (apenas modelos I2V; primeiro + último frame) | —                                         | `BYTEPLUS_API_KEY`                     |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓    | Até 2 imagens (primeiro + último frame por role)      | —                                               | `BYTEPLUS_API_KEY`                     |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓    | Até 9 imagens de referência                           | Até 3 vídeos                                    | `BYTEPLUS_API_KEY`                     |
| ComfyUI               | `workflow`                      |  ✓    | 1 imagem                                              | —                                               | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓    | 1 imagem; até 9 com Seedance reference-to-video       | Até 3 vídeos com Seedance reference-to-video    | `FAL_KEY`                              |
| Google                | `veo-3.1-fast-generate-preview` |  ✓    | 1 imagem                                              | 1 vídeo                                         | `GEMINI_API_KEY`                       |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓    | 1 imagem                                              | —                                               | `MINIMAX_API_KEY` ou OAuth do MiniMax  |
| OpenAI                | `sora-2`                        |  ✓    | 1 imagem                                              | 1 vídeo                                         | `OPENAI_API_KEY`                       |
| Qwen                  | `wan2.6-t2v`                    |  ✓    | Sim (URL remota)                                      | Sim (URL remota)                                | `QWEN_API_KEY`                         |
| Runway                | `gen4.5`                        |  ✓    | 1 imagem                                              | 1 vídeo                                         | `RUNWAYML_API_SECRET`                  |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓    | 1 imagem                                              | —                                               | `TOGETHER_API_KEY`                     |
| Vydra                 | `veo3`                          |  ✓    | 1 imagem (`kling`)                                    | —                                               | `VYDRA_API_KEY`                        |
| xAI                   | `grok-imagine-video`            |  ✓    | 1 imagem de primeiro frame ou até 7 `reference_image`s | 1 vídeo                                        | `XAI_API_KEY`                          |

Alguns provedores aceitam variáveis de ambiente de chave de API adicionais ou alternativas. Consulte
as [páginas individuais dos provedores](#related) para detalhes.

Execute `video_generate action=list` para inspecionar provedores, modelos e
modos de runtime disponíveis em runtime.

### Matriz de capacidades

O contrato explícito de modo usado por `video_generate`, testes de contrato e
a varredura compartilhada ao vivo:

| Provedor | `generate` | `imageToVideo` | `videoToVideo` | Lanes compartilhados ao vivo hoje                                                                                                        |
| -------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor precisa de URLs de vídeo remotas `http(s)`                     |
| BytePlus |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  |     ✓      |       ✓        |       —        | Não está na varredura compartilhada; a cobertura específica de workflow fica com os testes do Comfy                                     |
| fal      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` apenas ao usar Seedance reference-to-video                                                   |
| Google   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque a varredura Gemini/Veo atual com buffer não aceita essa entrada |
| MiniMax  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque este caminho atual de organização/entrada precisa de acesso do lado do provedor a inpaint/remix |
| Qwen     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor precisa de URLs de vídeo remotas `http(s)`                     |
| Runway   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` só é executado quando o modelo selecionado é `runway/gen4_aleph`                            |
| Together |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra    |     ✓      |       ✓        |       —        | `generate`; `imageToVideo` compartilhado ignorado porque o `veo3` empacotado é somente texto e o `kling` empacotado exige uma URL de imagem remota |
| xAI      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor atualmente precisa de uma URL MP4 remota                      |

## Parâmetros da ferramenta

### Obrigatórios

<ParamField path="prompt" type="string" required>
  Descrição em texto do vídeo a gerar. Obrigatório para `action: "generate"`.
</ParamField>

### Entradas de conteúdo

<ParamField path="image" type="string">Imagem única de referência (caminho ou URL).</ParamField>
<ParamField path="images" type="string[]">Múltiplas imagens de referência (até 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Dicas opcionais de role por posição em paralelo à lista combinada de imagens.
Valores canônicos: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Vídeo único de referência (caminho ou URL).</ParamField>
<ParamField path="videos" type="string[]">Múltiplos vídeos de referência (até 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Dicas opcionais de role por posição em paralelo à lista combinada de vídeos.
Valor canônico: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Áudio único de referência (caminho ou URL). Usado para música de fundo ou
referência de voz quando o provedor oferece suporte a entradas de áudio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Múltiplos áudios de referência (até 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Dicas opcionais de role por posição em paralelo à lista combinada de áudios.
Valor canônico: `reference_audio`.
</ParamField>

<Note>
Dicas de role são encaminhadas ao provedor como estão. Os valores canônicos vêm da
união `VideoGenerationAssetRole`, mas os provedores podem aceitar strings de
role adicionais. Arrays `*Roles` não podem ter mais entradas do que a
lista de referências correspondente; erros de off-by-one falham com uma mensagem clara.
Use uma string vazia para deixar uma posição sem valor. Para xAI, defina todo role de imagem como
`reference_image` para usar seu modo de geração `reference_images`; omita o
role ou use `first_frame` para image-to-video com uma única imagem.
</Note>

### Controles de estilo

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, ou `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, ou `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Duração desejada em segundos (arredondada para o valor compatível mais próximo do provedor).
</ParamField>
<ParamField path="size" type="string">Dica de tamanho quando o provedor oferece suporte.</ParamField>
<ParamField path="audio" type="boolean">
  Habilita áudio gerado na saída quando compatível. Diferente de `audioRef*` (entradas).
</ParamField>
<ParamField path="watermark" type="boolean">Alterna marca d’água do provedor quando compatível.</ParamField>

`adaptive` é um sentinela específico do provedor: ele é encaminhado como está para
provedores que declaram `adaptive` em suas capacidades (por exemplo, o BytePlus
Seedance o usa para detectar automaticamente a proporção a partir das
dimensões da imagem de entrada). Provedores que não o declaram expõem o valor via
`details.ignoredOverrides` no resultado da ferramenta para que a remoção fique visível.

### Avançado

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retorna a tarefa atual da sessão; `"list"` inspeciona provedores.
</ParamField>
<ParamField path="model" type="string">Substituição de provedor/modelo (por exemplo `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Dica de nome de arquivo de saída.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout opcional da solicitação ao provedor em milissegundos.</ParamField>
<ParamField path="providerOptions" type="object">
  Opções específicas do provedor como objeto JSON (por exemplo `{"seed": 42, "draft": true}`).
  Provedores que declaram um schema tipado validam as chaves e os tipos; chaves
  desconhecidas ou incompatibilidades fazem o candidato ser ignorado durante o fallback. Provedores sem
  schema declarado recebem as opções como estão. Execute `video_generate action=list`
  para ver o que cada provedor aceita.
</ParamField>

<Note>
Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw normaliza a duração para
o valor compatível mais próximo do provedor e remapeia dicas de geometria traduzidas
como size-to-aspect-ratio quando um provedor de fallback expõe uma superfície de controle
diferente. Substituições realmente não compatíveis são ignoradas em regime best-effort
e informadas como avisos no resultado da ferramenta. Limites rígidos de capacidade
(como referências demais) falham antes do envio. Os resultados da ferramenta
informam as configurações aplicadas; `details.normalization` captura qualquer
tradução de solicitado para aplicado.
</Note>

As entradas de referência selecionam o modo de runtime:

- Sem mídia de referência → `generate`
- Qualquer referência de imagem → `imageToVideo`
- Qualquer referência de vídeo → `videoToVideo`
- Entradas de áudio de referência **não** alteram o modo resolvido; elas se aplicam por
  cima do modo selecionado pelas referências de imagem/vídeo e só funcionam
  com provedores que declaram `maxInputAudios`.

Referências mistas de imagem e vídeo não são uma superfície compartilhada de capacidade estável.
Prefira um tipo de referência por solicitação.

#### Fallback e opções tipadas

Algumas verificações de capacidade são aplicadas na camada de fallback em vez do
limite da ferramenta, então uma solicitação que excede os limites do provedor principal ainda pode
ser executada em um fallback compatível:

- Candidato ativo que não declara `maxInputAudios` (ou `0`) é ignorado quando
  a solicitação contém referências de áudio; o próximo candidato é tentado.
- `maxDurationSeconds` do candidato ativo abaixo de `durationSeconds` solicitado
  sem uma lista `supportedDurationSeconds` declarada → ignorado.
- A solicitação contém `providerOptions` e o candidato ativo declara explicitamente
  um schema tipado para `providerOptions` → ignorado se as chaves fornecidas
  não estiverem no schema ou se os tipos dos valores não corresponderem. Provedores sem
  schema declarado recebem as opções como estão (pass-through
  compatível com versões anteriores). Um provedor pode recusar todas as provider options
  declarando um schema vazio (`capabilities.providerOptions: {}`), o que
  causa o mesmo ignore que uma incompatibilidade de tipo.

O primeiro motivo de ignore em uma solicitação é registrado em `warn` para que os operadores vejam quando
seu provedor principal foi ignorado; ignores subsequentes são registrados em `debug` para
manter silenciosas cadeias longas de fallback. Se todo candidato for ignorado, o
erro agregado inclui o motivo do ignore de cada um.

## Ações

| Ação       | O que faz                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| `generate` | Padrão. Cria um vídeo a partir do prompt informado e entradas de referência opcionais.                  |
| `status`   | Verifica o estado da tarefa de vídeo em andamento para a sessão atual sem iniciar outra geração.        |
| `list`     | Mostra provedores, modelos e suas capacidades disponíveis.                                              |

## Seleção de modelo

O OpenClaw resolve o modelo nesta ordem:

1. **Parâmetro da ferramenta `model`** — se o agente especificar um na chamada.
2. **`videoGenerationModel.primary`** da configuração.
3. **`videoGenerationModel.fallbacks`** em ordem.
4. **Detecção automática** — provedores que têm autenticação válida, começando pelo
   provedor padrão atual e depois pelos demais provedores em ordem
   alfabética.

Se um provedor falhar, o próximo candidato será tentado automaticamente. Se todos os
candidatos falharem, o erro incluirá detalhes de cada tentativa.

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

## Observações sobre provedores

<AccordionGroup>
  <Accordion title="Alibaba">
    Usa o endpoint assíncrono DashScope / Model Studio. Imagens e
    vídeos de referência devem ser URLs remotas `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID do provedor: `byteplus`.

    Modelos: `seedance-1-0-pro-250528` (padrão),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Modelos T2V (`*-t2v-*`) não aceitam entradas de imagem; modelos I2V e
    modelos gerais `*-pro-*` oferecem suporte a uma única imagem de referência (primeiro
    frame). Passe a imagem por posição ou defina `role: "first_frame"`.
    IDs de modelo T2V são automaticamente trocados para a variante I2V
    correspondente quando uma imagem é fornecida.

    Chaves `providerOptions` compatíveis: `seed` (number), `draft` (boolean —
    força 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Exige o Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID do provedor: `byteplus-seedance15`. Modelo:
    `seedance-1-5-pro-251215`.

    Usa a API unificada `content[]`. Oferece suporte a no máximo 2 imagens de entrada
    (`first_frame` + `last_frame`). Todas as entradas devem ser URLs remotas `https://`.
    Defina `role: "first_frame"` / `"last_frame"` em cada imagem, ou
    passe as imagens por posição.

    `aspectRatio: "adaptive"` detecta automaticamente a proporção a partir da imagem de entrada.
    `audio: true` é mapeado para `generate_audio`. `providerOptions.seed`
    (number) é encaminhado.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Exige o Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID do provedor: `byteplus-seedance2`. Modelos:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Usa a API unificada `content[]`. Oferece suporte a até 9 imagens de referência,
    3 vídeos de referência e 3 áudios de referência. Todas as entradas devem ser URLs remotas
    `https://`. Defina `role` em cada ativo — valores compatíveis:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecta automaticamente a proporção a partir da imagem de entrada.
    `audio: true` é mapeado para `generate_audio`. `providerOptions.seed`
    (number) é encaminhado.

  </Accordion>
  <Accordion title="ComfyUI">
    Execução local ou em nuvem orientada por workflow. Oferece suporte a texto para vídeo e
    imagem para vídeo por meio do grafo configurado.
  </Accordion>
  <Accordion title="fal">
    Usa um fluxo com fila para jobs de longa duração. A maioria dos modelos de vídeo do fal
    aceita uma única imagem de referência. Modelos
    Seedance 2.0 reference-to-video aceitam até 9 imagens, 3 vídeos e 3 referências de áudio, com
    no máximo 12 arquivos de referência no total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Oferece suporte a uma imagem ou um vídeo de referência.
  </Accordion>
  <Accordion title="MiniMax">
    Apenas uma única imagem de referência.
  </Accordion>
  <Accordion title="OpenAI">
    Apenas a substituição `size` é encaminhada. Outras substituições de estilo
    (`aspectRatio`, `resolution`, `audio`, `watermark`) são ignoradas com
    aviso.
  </Accordion>
  <Accordion title="Qwen">
    Mesmo backend DashScope do Alibaba. Entradas de referência devem ser URLs remotas
    `http(s)`; arquivos locais são rejeitados antecipadamente.
  </Accordion>
  <Accordion title="Runway">
    Oferece suporte a arquivos locais via URIs de dados. Video-to-video exige
    `runway/gen4_aleph`. Execuções somente de texto expõem proporções `16:9` e `9:16`.
  </Accordion>
  <Accordion title="Together">
    Apenas uma única imagem de referência.
  </Accordion>
  <Accordion title="Vydra">
    Usa `https://www.vydra.ai/api/v1` diretamente para evitar redirecionamentos
    que removem a autenticação. `veo3` vem empacotado como somente texto para vídeo; `kling` exige
    uma URL de imagem remota.
  </Accordion>
  <Accordion title="xAI">
    Oferece suporte a texto para vídeo, image-to-video com uma única imagem de primeiro frame, até 7
    entradas `reference_image` por meio de `reference_images` da xAI e fluxos remotos
    de edição/extensão de vídeo.
  </Accordion>
</AccordionGroup>

## Modos de capacidade do provedor

O contrato compartilhado de geração de vídeo oferece suporte a capacidades específicas por modo
em vez de apenas limites agregados planos. Novas implementações de provedor
devem preferir blocos explícitos de modo:

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

Campos agregados planos como `maxInputImages` e `maxInputVideos`
**não** são suficientes para anunciar suporte a modos de transformação. Os provedores devem
declarar `generate`, `imageToVideo` e `videoToVideo` explicitamente para que testes ao vivo,
testes de contrato e a ferramenta compartilhada `video_generate` possam validar
o suporte a modo de forma determinística.

Quando um modelo dentro de um provedor tiver suporte mais amplo a entrada de referências do que o
restante, use `maxInputImagesByModel`, `maxInputVideosByModel` ou
`maxInputAudiosByModel` em vez de aumentar o limite de todo o modo.

## Testes ao vivo

Cobertura ao vivo opt-in para os provedores compartilhados empacotados:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper do repositório:

```bash
pnpm test:live:media video
```

Esse arquivo ao vivo carrega variáveis de ambiente de provedores ausentes a partir de `~/.profile`, prioriza
chaves de API de env/ao vivo em vez de perfis de autenticação armazenados por padrão e executa por padrão
um smoke seguro para lançamento:

- `generate` para todo provedor fora do FAL na varredura.
- Prompt de lagosta de um segundo.
- Limite de operação por provedor de
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão).

O FAL é opt-in porque a latência da fila do lado do provedor pode dominar o tempo
de lançamento:

```bash
pnpm test:live:media video --video-providers fal
```

Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar
modos de transformação declarados que a varredura compartilhada consegue exercitar com segurança usando mídia local:

- `imageToVideo` quando `capabilities.imageToVideo.enabled`.
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e o
  provedor/modelo aceita entrada de vídeo local com buffer na varredura
  compartilhada.

Hoje, o lane ao vivo compartilhado de `videoToVideo` cobre `runway` apenas quando você
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

Ou pela CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Relacionado

- [Alibaba Model Studio](/pt-BR/providers/alibaba)
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — rastreamento de tarefas para geração assíncrona de vídeo
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
