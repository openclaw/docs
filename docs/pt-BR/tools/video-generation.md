---
read_when:
    - Geração de vídeos via o agente
    - Configuração de provedores e modelos de geração de vídeo
    - Entendendo os parâmetros da ferramenta `video_generate`
summary: Gere vídeos a partir de texto, imagens ou vídeos existentes usando 14 backends de provedores
title: Geração de vídeo
x-i18n:
    generated_at: "2026-04-25T13:58:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a16c56939967a6268e62a267598fe03d2eb3195384ad805652498004fdaf886
    source_path: tools/video-generation.md
    workflow: 15
---

Os agentes do OpenClaw podem gerar vídeos a partir de prompts de texto, imagens de referência ou vídeos existentes. Há suporte para catorze backends de provedores, cada um com diferentes opções de modelo, modos de entrada e conjuntos de recursos. O agente escolhe automaticamente o provedor correto com base na sua configuração e nas chaves de API disponíveis.

<Note>
A ferramenta `video_generate` só aparece quando pelo menos um provedor de geração de vídeo está disponível. Se você não a vir nas ferramentas do seu agente, defina uma chave de API de provedor ou configure `agents.defaults.videoGenerationModel`.
</Note>

O OpenClaw trata a geração de vídeo em três modos de runtime:

- `generate` para solicitações de texto para vídeo sem mídia de referência
- `imageToVideo` quando a solicitação inclui uma ou mais imagens de referência
- `videoToVideo` quando a solicitação inclui um ou mais vídeos de referência

Os provedores podem oferecer suporte a qualquer subconjunto desses modos. A ferramenta valida o
modo ativo antes do envio e informa os modos compatíveis em `action=list`.

## Início rápido

1. Defina uma chave de API para qualquer provedor compatível:

```bash
export GEMINI_API_KEY="your-key"
```

2. Opcionalmente, fixe um modelo padrão:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Peça ao agente:

> Gere um vídeo cinematográfico de 5 segundos de uma lagosta amigável surfando ao pôr do sol.

O agente chama `video_generate` automaticamente. Não é necessário permitir a ferramenta em allowlist.

## O que acontece quando você gera um vídeo

A geração de vídeo é assíncrona. Quando o agente chama `video_generate` em uma sessão:

1. O OpenClaw envia a solicitação ao provedor e retorna imediatamente um ID de tarefa.
2. O provedor processa o trabalho em segundo plano (normalmente de 30 segundos a 5 minutos, dependendo do provedor e da resolução).
3. Quando o vídeo fica pronto, o OpenClaw reativa a mesma sessão com um evento interno de conclusão.
4. O agente publica o vídeo finalizado de volta na conversa original.

Enquanto um trabalho está em andamento, chamadas duplicadas de `video_generate` na mesma sessão retornam o status da tarefa atual em vez de iniciar outra geração. Use `openclaw tasks list` ou `openclaw tasks show <taskId>` para verificar o progresso pela CLI.

Fora de execuções de agente com suporte a sessão (por exemplo, invocações diretas de ferramenta), a ferramenta recorre à geração inline e retorna o caminho final da mídia no mesmo turno.

Os arquivos de vídeo gerados são salvos no armazenamento de mídia gerenciado pelo OpenClaw quando o
provedor retorna bytes. O limite padrão de salvamento para vídeos gerados segue o limite de mídia de
vídeo, e `agents.defaults.mediaMaxMb` o aumenta para renderizações maiores.
Quando um provedor também retorna uma URL de saída hospedada, o OpenClaw pode entregar essa URL
em vez de falhar a tarefa se a persistência local rejeitar um arquivo grande demais.

### Ciclo de vida da tarefa

Cada solicitação `video_generate` passa por quatro estados:

1. **queued** -- tarefa criada, aguardando o provedor aceitá-la.
2. **running** -- o provedor está processando (normalmente de 30 segundos a 5 minutos, dependendo do provedor e da resolução).
3. **succeeded** -- vídeo pronto; o agente é reativado e o publica na conversa.
4. **failed** -- erro do provedor ou timeout; o agente é reativado com detalhes do erro.

Verifique o status pela CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevenção de duplicatas: se uma tarefa de vídeo já estiver `queued` ou `running` para a sessão atual, `video_generate` retorna o status da tarefa existente em vez de iniciar uma nova. Use `action: "status"` para verificar explicitamente sem disparar uma nova geração.

## Provedores compatíveis

| Provedor              | Modelo padrão                  | Texto | Imagem de ref.                                       | Vídeo de ref.    | Chave de API                              |
| --------------------- | ------------------------------ | ----- | ---------------------------------------------------- | ---------------- | ----------------------------------------- |
| Alibaba               | `wan2.6-t2v`                   | Sim   | Sim (URL remota)                                     | Sim (URL remota) | `MODELSTUDIO_API_KEY`                     |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`      | Sim   | Até 2 imagens (apenas modelos I2V; primeiro + último quadro) | Não              | `BYTEPLUS_API_KEY`                        |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`      | Sim   | Até 2 imagens (primeiro + último quadro via role)    | Não              | `BYTEPLUS_API_KEY`                        |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` | Sim   | Até 9 imagens de referência                          | Até 3 vídeos     | `BYTEPLUS_API_KEY`                        |
| ComfyUI               | `workflow`                     | Sim   | 1 imagem                                             | Não              | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`  |
| fal                   | `fal-ai/minimax/video-01-live` | Sim   | 1 imagem                                             | Não              | `FAL_KEY`                                 |
| Google                | `veo-3.1-fast-generate-preview`| Sim   | 1 imagem                                             | 1 vídeo          | `GEMINI_API_KEY`                          |
| MiniMax               | `MiniMax-Hailuo-2.3`           | Sim   | 1 imagem                                             | Não              | `MINIMAX_API_KEY`                         |
| OpenAI                | `sora-2`                       | Sim   | 1 imagem                                             | 1 vídeo          | `OPENAI_API_KEY`                          |
| Qwen                  | `wan2.6-t2v`                   | Sim   | Sim (URL remota)                                     | Sim (URL remota) | `QWEN_API_KEY`                            |
| Runway                | `gen4.5`                       | Sim   | 1 imagem                                             | 1 vídeo          | `RUNWAYML_API_SECRET`                     |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`       | Sim   | 1 imagem                                             | Não              | `TOGETHER_API_KEY`                        |
| Vydra                 | `veo3`                         | Sim   | 1 imagem (`kling`)                                   | Não              | `VYDRA_API_KEY`                           |
| xAI                   | `grok-imagine-video`           | Sim   | 1 imagem                                             | 1 vídeo          | `XAI_API_KEY`                             |

Alguns provedores aceitam variáveis de ambiente adicionais ou alternativas para a chave de API. Veja as [páginas individuais dos provedores](#related) para detalhes.

Execute `video_generate action=list` para inspecionar provedores, modelos e
modos de runtime disponíveis em tempo de execução.

### Matriz de capacidades declaradas

Este é o contrato explícito de modos usado por `video_generate`, testes de contrato
e a varredura ativa compartilhada.

| Provedor | `generate` | `imageToVideo` | `videoToVideo` | Lanes ativas compartilhadas atualmente                                                                                                   |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor precisa de URLs de vídeo remotas `http(s)`                     |
| BytePlus | Sim        | Sim            | Não            | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Sim        | Sim            | Não            | Não está na varredura compartilhada; a cobertura específica do workflow fica com os testes do Comfy                                     |
| fal      | Sim        | Sim            | Não            | `generate`, `imageToVideo`                                                                                                               |
| Google   | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque a varredura Gemini/Veo atual com buffer não aceita essa entrada |
| MiniMax  | Sim        | Sim            | Não            | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` compartilhado ignorado porque este caminho atual de organização/entrada precisa de acesso a inpaint/remix do lado do provedor |
| Qwen     | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor precisa de URLs de vídeo remotas `http(s)`                    |
| Runway   | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` executa apenas quando o modelo selecionado é `runway/gen4_aleph`                            |
| Together | Sim        | Sim            | Não            | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Sim        | Sim            | Não            | `generate`; `imageToVideo` compartilhado ignorado porque o `veo3` incluído é somente texto e o `kling` incluído exige uma URL de imagem remota |
| xAI      | Sim        | Sim            | Sim            | `generate`, `imageToVideo`; `videoToVideo` ignorado porque este provedor atualmente precisa de uma URL MP4 remota                      |

## Parâmetros da ferramenta

### Obrigatórios

| Parâmetro | Tipo   | Descrição                                                                    |
| --------- | ------ | ---------------------------------------------------------------------------- |
| `prompt`  | string | Descrição em texto do vídeo a gerar (obrigatória para `action: "generate"`) |

### Entradas de conteúdo

| Parâmetro   | Tipo     | Descrição                                                                                                                              |
| ----------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image`     | string   | Imagem única de referência (caminho ou URL)                                                                                            |
| `images`    | string[] | Múltiplas imagens de referência (até 9)                                                                                                |
| `imageRoles`| string[] | Dicas opcionais de role por posição, paralelas à lista combinada de imagens. Valores canônicos: `first_frame`, `last_frame`, `reference_image` |
| `video`     | string   | Vídeo único de referência (caminho ou URL)                                                                                             |
| `videos`    | string[] | Múltiplos vídeos de referência (até 4)                                                                                                 |
| `videoRoles`| string[] | Dicas opcionais de role por posição, paralelas à lista combinada de vídeos. Valor canônico: `reference_video`                         |
| `audioRef`  | string   | Áudio único de referência (caminho ou URL). Usado, por exemplo, para música de fundo ou referência de voz quando o provedor oferece suporte a entradas de áudio |
| `audioRefs` | string[] | Múltiplos áudios de referência (até 3)                                                                                                 |
| `audioRoles`| string[] | Dicas opcionais de role por posição, paralelas à lista combinada de áudios. Valor canônico: `reference_audio`                         |

As dicas de role são encaminhadas ao provedor exatamente como estão. Os valores canônicos vêm
da união `VideoGenerationAssetRole`, mas os provedores podem aceitar strings de
role adicionais. Os arrays `*Roles` não devem ter mais entradas do que a
lista de referência correspondente; erros de contagem falham com uma mensagem clara.
Use uma string vazia para deixar uma posição sem definir.

### Controles de estilo

| Parâmetro        | Tipo    | Descrição                                                                              |
| ---------------- | ------- | -------------------------------------------------------------------------------------- |
| `aspectRatio`    | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` ou `adaptive` |
| `resolution`     | string  | `480P`, `720P`, `768P` ou `1080P`                                                      |
| `durationSeconds`| number  | Duração alvo em segundos (arredondada para o valor compatível mais próximo do provedor) |
| `size`           | string  | Dica de tamanho quando o provedor oferece suporte a isso                              |
| `audio`          | boolean | Ativa áudio gerado na saída quando compatível. Diferente de `audioRef*` (entradas)    |
| `watermark`      | boolean | Alterna a marca d'água do provedor quando compatível                                   |

`adaptive` é um sentinela específico do provedor: ele é encaminhado exatamente como está para
provedores que declaram `adaptive` em suas capacidades (por exemplo, o BytePlus
Seedance o usa para detectar automaticamente a proporção a partir das
dimensões da imagem de entrada). Provedores que não o declaram expõem o valor via
`details.ignoredOverrides` no resultado da ferramenta para que a remoção fique visível.

### Avançado

| Parâmetro        | Tipo   | Descrição                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`         | string | `"generate"` (padrão), `"status"` ou `"list"`                                                                                                                                                                                                                                                                                                      |
| `model`          | string | Substituição de provedor/modelo (por exemplo `runway/gen4.5`)                                                                                                                                                                                                                                                                                      |
| `filename`       | string | Dica de nome de arquivo de saída                                                                                                                                                                                                                                                                                                                   |
| `timeoutMs`      | number | Timeout opcional da solicitação ao provedor, em milissegundos                                                                                                                                                                                                                                                                                      |
| `providerOptions`| object | Opções específicas do provedor como um objeto JSON (por exemplo `{"seed": 42, "draft": true}`). Provedores que declaram um schema tipado validam as chaves e os tipos; chaves desconhecidas ou incompatibilidades fazem o candidato ser ignorado durante o fallback. Provedores sem schema declarado recebem as opções exatamente como estão. Execute `video_generate action=list` para ver o que cada provedor aceita |

Nem todos os provedores oferecem suporte a todos os parâmetros. O OpenClaw já normaliza a duração para o valor compatível mais próximo do provedor e também remapeia dicas de geometria traduzidas, como tamanho para proporção, quando um provedor de fallback expõe uma superfície de controle diferente. Substituições realmente não compatíveis são ignoradas em regime de melhor esforço e informadas como avisos no resultado da ferramenta. Limites rígidos de capacidade (como entradas de referência em excesso) falham antes do envio.

Os resultados da ferramenta informam as configurações aplicadas. Quando o OpenClaw remapeia duração ou geometria durante o fallback de provedor, os valores retornados de `durationSeconds`, `size`, `aspectRatio` e `resolution` refletem o que foi enviado, e `details.normalization` registra a tradução entre o solicitado e o aplicado.

As entradas de referência também selecionam o modo de runtime:

- Sem mídia de referência: `generate`
- Qualquer imagem de referência: `imageToVideo`
- Qualquer vídeo de referência: `videoToVideo`
- Entradas de áudio de referência não alteram o modo resolvido; elas se aplicam por cima do modo que as referências de imagem/vídeo selecionarem e só funcionam com provedores que declaram `maxInputAudios`

Referências mistas de imagem e vídeo não são uma superfície de capacidade compartilhada estável.
Prefira um tipo de referência por solicitação.

#### Fallback e opções tipadas

Algumas verificações de capacidade são aplicadas na camada de fallback, em vez da
fronteira da ferramenta, para que uma solicitação que exceda os limites do provedor principal
ainda possa ser executada em um fallback compatível:

- Se o candidato ativo não declarar `maxInputAudios` (ou o declarar como
  `0`), ele será ignorado quando a solicitação contiver referências de áudio, e o
  próximo candidato será tentado.
- Se `maxDurationSeconds` do candidato ativo for menor que o
  `durationSeconds` solicitado e o candidato não declarar uma lista
  `supportedDurationSeconds`, ele será ignorado.
- Se a solicitação contiver `providerOptions` e o candidato ativo
  declarar explicitamente um schema tipado para `providerOptions`, o candidato será
  ignorado quando as chaves fornecidas não estiverem no schema ou quando os tipos de valor
  não corresponderem. Provedores que ainda não declararam um schema recebem as
  opções exatamente como estão (pass-through compatível com versões anteriores). Um provedor pode
  optar explicitamente por não aceitar nenhuma provider option declarando um schema vazio
  (`capabilities.providerOptions: {}`), o que causa a mesma ignorada de uma
  incompatibilidade de tipo.

O primeiro motivo de ignorada em uma solicitação é registrado em `warn` para que operadores vejam
quando o provedor principal foi ignorado; ignoradas subsequentes são registradas em
`debug` para manter silenciosas cadeias longas de fallback. Se todos os candidatos forem ignorados,
o erro agregado inclui o motivo da ignorada para cada um.

## Ações

- **generate** (padrão) -- cria um vídeo a partir do prompt informado e de entradas de referência opcionais.
- **status** -- verifica o estado da tarefa de vídeo em andamento para a sessão atual sem iniciar outra geração.
- **list** -- mostra provedores, modelos e suas capacidades disponíveis.

## Seleção de modelo

Ao gerar um vídeo, o OpenClaw resolve o modelo nesta ordem:

1. **Parâmetro de ferramenta `model`** -- se o agente especificar um na chamada.
2. **`videoGenerationModel.primary`** -- da configuração.
3. **`videoGenerationModel.fallbacks`** -- tentados em ordem.
4. **Detecção automática** -- usa provedores com autenticação válida, começando pelo provedor padrão atual e depois os demais provedores em ordem alfabética.

Se um provedor falhar, o próximo candidato será tentado automaticamente. Se todos os candidatos falharem, o erro incluirá detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` se quiser
que a geração de vídeo use apenas as entradas explícitas `model`, `primary` e `fallbacks`.

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
    Usa o endpoint assíncrono do DashScope / Model Studio. Imagens e vídeos de referência devem ser URLs remotas `http(s)`.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    Id do provedor: `byteplus`.

    Modelos: `seedance-1-0-pro-250528` (padrão), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Modelos T2V (`*-t2v-*`) não aceitam entradas de imagem; modelos I2V e modelos gerais `*-pro-*` oferecem suporte a uma única imagem de referência (primeiro quadro). Passe a imagem por posição ou defina `role: "first_frame"`. IDs de modelo T2V são automaticamente trocados para a variante I2V correspondente quando uma imagem é fornecida.

    Chaves compatíveis de `providerOptions`: `seed` (number), `draft` (boolean — força 480p), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    Requer o Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Id do provedor: `byteplus-seedance15`. Modelo: `seedance-1-5-pro-251215`.

    Usa a API unificada `content[]`. Oferece suporte a no máximo 2 imagens de entrada (`first_frame` + `last_frame`). Todas as entradas devem ser URLs remotas `https://`. Defina `role: "first_frame"` / `"last_frame"` em cada imagem ou passe as imagens por posição.

    `aspectRatio: "adaptive"` detecta automaticamente a proporção a partir da imagem de entrada. `audio: true` corresponde a `generate_audio`. `providerOptions.seed` (number) é encaminhado.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    Requer o Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Id do provedor: `byteplus-seedance2`. Modelos: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Usa a API unificada `content[]`. Oferece suporte a até 9 imagens de referência, 3 vídeos de referência e 3 áudios de referência. Todas as entradas devem ser URLs remotas `https://`. Defina `role` em cada recurso — valores compatíveis: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecta automaticamente a proporção a partir da imagem de entrada. `audio: true` corresponde a `generate_audio`. `providerOptions.seed` (number) é encaminhado.

  </Accordion>

  <Accordion title="ComfyUI">
    Execução local ou em nuvem orientada por workflow. Oferece suporte a texto para vídeo e imagem para vídeo por meio do grafo configurado.
  </Accordion>

  <Accordion title="fal">
    Usa um fluxo com fila para trabalhos de longa duração. Apenas uma imagem de referência.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Oferece suporte a uma imagem ou um vídeo de referência.
  </Accordion>

  <Accordion title="MiniMax">
    Apenas uma imagem de referência.
  </Accordion>

  <Accordion title="OpenAI">
    Apenas a substituição `size` é encaminhada. Outras substituições de estilo (`aspectRatio`, `resolution`, `audio`, `watermark`) são ignoradas com um aviso.
  </Accordion>

  <Accordion title="Qwen">
    Mesmo backend DashScope que Alibaba. As entradas de referência devem ser URLs remotas `http(s)`; arquivos locais são rejeitados antecipadamente.
  </Accordion>

  <Accordion title="Runway">
    Oferece suporte a arquivos locais via URIs de dados. Vídeo para vídeo exige `runway/gen4_aleph`. Execuções somente texto expõem proporções `16:9` e `9:16`.
  </Accordion>

  <Accordion title="Together">
    Apenas uma imagem de referência.
  </Accordion>

  <Accordion title="Vydra">
    Usa `https://www.vydra.ai/api/v1` diretamente para evitar redirecionamentos que descartam autenticação. `veo3` vem incluído apenas como texto para vídeo; `kling` exige uma URL de imagem remota.
  </Accordion>

  <Accordion title="xAI">
    Oferece suporte a texto para vídeo, imagem para vídeo e fluxos remotos de edição/extensão de vídeo.
  </Accordion>
</AccordionGroup>

## Modos de capacidade do provedor

O contrato compartilhado de geração de vídeo agora permite que os provedores declarem
capacidades específicas por modo, em vez de apenas limites agregados planos. Novas
implementações de provedores devem preferir blocos de modo explícitos:

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

Campos agregados planos como `maxInputImages` e `maxInputVideos` não são
suficientes para anunciar suporte a modos de transformação. Os provedores devem declarar
`generate`, `imageToVideo` e `videoToVideo` explicitamente para que testes ao vivo,
testes de contrato e a ferramenta compartilhada `video_generate` possam validar o suporte
a modos de forma determinística.

## Testes ao vivo

Cobertura ao vivo opt-in para os provedores compartilhados incluídos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper do repositório:

```bash
pnpm test:live:media video
```

Esse arquivo live carrega variáveis de ambiente de provedor ausentes de `~/.profile`, dá preferência
a chaves de API live/env em vez de perfis de autenticação armazenados por padrão e executa um smoke seguro para release por padrão:

- `generate` para todo provedor não FAL na varredura
- prompt de lagosta de um segundo
- limite de operação por provedor a partir de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` por padrão)

FAL é opt-in porque a latência da fila do lado do provedor pode dominar o tempo da release:

```bash
pnpm test:live:media video --video-providers fal
```

Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados
que a varredura compartilhada pode exercitar com segurança usando mídia local:

- `imageToVideo` quando `capabilities.imageToVideo.enabled`
- `videoToVideo` quando `capabilities.videoToVideo.enabled` e o provedor/modelo
  aceita entrada de vídeo local com buffer na varredura compartilhada

Hoje, a lane live compartilhada de `videoToVideo` cobre:

- `runway` apenas quando você seleciona `runway/gen4_aleph`

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

- [Visão geral das ferramentas](/pt-BR/tools)
- [Tarefas em segundo plano](/pt-BR/automation/tasks) -- rastreamento de tarefas para geração assíncrona de vídeo
- [Alibaba Model Studio](/pt-BR/providers/alibaba)
- [BytePlus](/pt-BR/concepts/model-providers#byteplus-international)
- [ComfyUI](/pt-BR/providers/comfy)
- [fal](/pt-BR/providers/fal)
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [OpenAI](/pt-BR/providers/openai)
- [Qwen](/pt-BR/providers/qwen)
- [Runway](/pt-BR/providers/runway)
- [Together AI](/pt-BR/providers/together)
- [Vydra](/pt-BR/providers/vydra)
- [xAI](/pt-BR/providers/xai)
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults)
- [Modelos](/pt-BR/concepts/models)
