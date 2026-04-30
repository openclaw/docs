---
read_when:
    - Procurando uma visão geral dos recursos de mídia do OpenClaw
    - Decidindo qual provedor de mídia configurar
    - Entendendo como funciona a geração assíncrona de mídia
sidebarTitle: Media overview
summary: Visão geral dos recursos de imagem, vídeo, música, fala e compreensão de mídia
title: Visão geral da mídia
x-i18n:
    generated_at: "2026-04-30T10:12:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

O OpenClaw gera imagens, vídeos e música, entende mídia recebida
(imagens, áudio, vídeo) e fala respostas em voz alta com conversão de texto em fala. Todos
os recursos de mídia são orientados por ferramentas: o agente decide quando usá-los com base
na conversa, e cada ferramenta só aparece quando pelo menos um provedor de suporte
está configurado.

## Capacidades

<CardGroup cols={2}>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Crie e edite imagens a partir de prompts de texto ou imagens de referência via
    `image_generate`. Síncrono — conclui em linha com a resposta.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Texto para vídeo, imagem para vídeo e vídeo para vídeo via `video_generate`.
    Assíncrono — executa em segundo plano e publica o resultado quando estiver pronto.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Gere música ou faixas de áudio via `music_generate`. Assíncrono em provedores
    compartilhados; o caminho de workflow do ComfyUI executa de forma síncrona.
  </Card>
  <Card title="Texto para fala" href="/pt-BR/tools/tts" icon="microphone">
    Converta respostas enviadas em áudio falado via a ferramenta `tts` mais a
    configuração `messages.tts`. Síncrono.
  </Card>
  <Card title="Compreensão de mídia" href="/pt-BR/nodes/media-understanding" icon="eye">
    Resuma imagens, áudio e vídeo recebidos usando provedores de modelo com visão
    e plugins dedicados de compreensão de mídia.
  </Card>
  <Card title="Fala para texto" href="/pt-BR/nodes/audio" icon="ear-listen">
    Transcreva mensagens de voz recebidas por meio de STT em lote ou provedores de
    STT de streaming do Voice Call.
  </Card>
</CardGroup>

## Matriz de capacidades por provedor

| Provedor    | Imagem | Vídeo | Música | TTS | STT | Voz em tempo real | Compreensão de mídia |
| ----------- | :----: | :---: | :----: | :-: | :-: | :---------------: | :------------------: |
| Alibaba     |        |   ✓   |        |     |     |                   |                      |
| BytePlus    |        |   ✓   |        |     |     |                   |                      |
| ComfyUI     |   ✓    |   ✓   |   ✓    |     |     |                   |                      |
| DeepInfra   |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |          ✓           |
| Deepgram    |        |       |        |     |  ✓  |         ✓         |                      |
| ElevenLabs  |        |       |        |  ✓  |  ✓  |                   |                      |
| fal         |   ✓    |   ✓   |        |     |     |                   |                      |
| Google      |   ✓    |   ✓   |   ✓    |  ✓  |     |         ✓         |          ✓           |
| Gradium     |        |       |        |  ✓  |     |                   |                      |
| Local CLI   |        |       |        |  ✓  |     |                   |                      |
| Microsoft   |        |       |        |  ✓  |     |                   |                      |
| MiniMax     |   ✓    |   ✓   |   ✓    |  ✓  |     |                   |                      |
| Mistral     |        |       |        |     |  ✓  |                   |                      |
| OpenAI      |   ✓    |   ✓   |        |  ✓  |  ✓  |         ✓         |          ✓           |
| OpenRouter  |   ✓    |   ✓   |        |  ✓  |     |                   |          ✓           |
| Qwen        |        |   ✓   |        |     |     |                   |                      |
| Runway      |        |   ✓   |        |     |     |                   |                      |
| SenseAudio  |        |       |        |     |  ✓  |                   |                      |
| Together    |        |   ✓   |        |     |     |                   |                      |
| Vydra       |   ✓    |   ✓   |        |  ✓  |     |                   |                      |
| xAI         |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |          ✓           |
| Xiaomi MiMo |   ✓    |       |        |  ✓  |     |                   |          ✓           |

<Note>
A compreensão de mídia usa qualquer modelo com visão ou compatível com áudio registrado
na sua configuração de provedor. A matriz acima lista provedores com suporte dedicado
a compreensão de mídia; a maioria dos provedores de LLM multimodal (Anthropic, Google,
OpenAI etc.) também consegue entender mídia recebida quando configurada como o modelo de
resposta ativo.
</Note>

## Assíncrono versus síncrono

| Capacidade       | Modo        | Motivo                                                            |
| ---------------- | ----------- | ----------------------------------------------------------------- |
| Imagem           | Síncrono    | As respostas do provedor retornam em segundos; conclui em linha com a resposta. |
| Texto para fala  | Síncrono    | As respostas do provedor retornam em segundos; anexadas ao áudio da resposta. |
| Vídeo            | Assíncrono  | O processamento do provedor leva de 30 s a vários minutos.        |
| Música (compartilhada) | Assíncrono | A mesma característica de processamento do provedor que vídeo.    |
| Música (ComfyUI) | Síncrono    | O workflow local executa em linha no servidor ComfyUI configurado. |

Para ferramentas assíncronas, o OpenClaw envia a solicitação ao provedor, retorna um id de tarefa
imediatamente e rastreia o trabalho no livro-razão de tarefas. O agente continua
respondendo a outras mensagens enquanto o trabalho executa. Quando o provedor termina,
o OpenClaw acorda o agente para que ele possa publicar a mídia concluída de volta no
canal original.

## Fala para texto e Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio e xAI podem transcrever
áudio recebido pelo caminho em lote `tools.media.audio` quando configurados.
Plugins de canal que fazem preflight de uma nota de voz para filtragem por menção ou análise
de comando marcam o anexo transcrito no contexto de entrada, para que a etapa compartilhada
de compreensão de mídia reutilize essa transcrição em vez de fazer uma segunda chamada
STT para o mesmo áudio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI também registram provedores de STT de
streaming do Voice Call, para que áudio telefônico ao vivo possa ser encaminhado ao fornecedor
selecionado sem esperar por uma gravação concluída.

## Mapeamentos de provedores (como os fornecedores se dividem entre superfícies)

<AccordionGroup>
  <Accordion title="Google">
    Superfícies de imagem, vídeo, música, TTS em lote, voz em tempo real de backend e
    compreensão de mídia.
  </Accordion>
  <Accordion title="OpenAI">
    Superfícies de imagem, vídeo, TTS em lote, STT em lote, STT de streaming do Voice Call,
    voz em tempo real de backend e embeddings de memória.
  </Accordion>
  <Accordion title="DeepInfra">
    Superfícies de chat/roteamento de modelo, geração/edição de imagens, texto para vídeo,
    TTS em lote, STT em lote, compreensão de mídia de imagem e embeddings de memória.
    Modelos nativos da DeepInfra de rerank/classificação/detecção de objetos não são
    registrados até que o OpenClaw tenha contratos de provedor dedicados para essas
    categorias.
  </Accordion>
  <Accordion title="xAI">
    Imagem, vídeo, pesquisa, execução de código, TTS em lote, STT em lote e STT de streaming do Voice
    Call. Voz em tempo real da xAI é uma capacidade upstream, mas não é registrada no OpenClaw até
    que o contrato compartilhado de voz em tempo real possa representá-la.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Geração de imagens](/pt-BR/tools/image-generation)
- [Geração de vídeos](/pt-BR/tools/video-generation)
- [Geração de música](/pt-BR/tools/music-generation)
- [Texto para fala](/pt-BR/tools/tts)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Nós de áudio](/pt-BR/nodes/audio)
