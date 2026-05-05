---
read_when:
    - Procurando uma visão geral dos recursos de mídia do OpenClaw
    - Decidindo qual provedor de mídia configurar
    - Entendendo como funciona a geração assíncrona de mídia
sidebarTitle: Media overview
summary: Visão geral dos recursos de imagem, vídeo, música, fala e compreensão de mídia
title: Visão geral da mídia
x-i18n:
    generated_at: "2026-05-05T05:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c57781188ca8a2dbcf378ef82dcea6645c56ed5c5dbb3222c9e4b58ab1398bf1
    source_path: tools/media-overview.md
    workflow: 16
---

O OpenClaw gera imagens, vídeos e música, entende mídia recebida
(imagens, áudio, vídeo) e fala respostas em voz alta com síntese de fala. Todos
os recursos de mídia são orientados por ferramentas: o agente decide quando usá-los com base
na conversa, e cada ferramenta só aparece quando pelo menos um provedor de suporte
está configurado.

## Recursos

<CardGroup cols={2}>
  <Card title="Image generation" href="/pt-BR/tools/image-generation" icon="image">
    Crie e edite imagens a partir de prompts de texto ou imagens de referência via
    `image_generate`. Síncrono — conclui junto com a resposta.
  </Card>
  <Card title="Video generation" href="/pt-BR/tools/video-generation" icon="video">
    Texto para vídeo, imagem para vídeo e vídeo para vídeo via `video_generate`.
    Assíncrono — executa em segundo plano e publica o resultado quando estiver pronto.
  </Card>
  <Card title="Music generation" href="/pt-BR/tools/music-generation" icon="music">
    Gere música ou faixas de áudio via `music_generate`. Assíncrono em provedores
    compartilhados; o caminho de workflow do ComfyUI executa de forma síncrona.
  </Card>
  <Card title="Text-to-speech" href="/pt-BR/tools/tts" icon="microphone">
    Converta respostas de saída em áudio falado via a ferramenta `tts` mais a
    configuração `messages.tts`. Síncrono.
  </Card>
  <Card title="Media understanding" href="/pt-BR/nodes/media-understanding" icon="eye">
    Resuma imagens, áudio e vídeo recebidos usando provedores de modelo com
    capacidade de visão e Plugins dedicados de compreensão de mídia.
  </Card>
  <Card title="Speech-to-text" href="/pt-BR/nodes/audio" icon="ear-listen">
    Transcreva mensagens de voz recebidas por meio de provedores de STT em lote ou de
    STT por streaming de Chamada de voz.
  </Card>
</CardGroup>

## Matriz de recursos por provedor

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
| CLI local   |        |       |        |  ✓  |     |                   |                      |
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
A compreensão de mídia usa qualquer modelo com capacidade de visão ou áudio registrado
na sua configuração de provedor. A matriz acima lista provedores com suporte
dedicado de compreensão de mídia; a maioria dos provedores de LLM multimodal (Anthropic, Google,
OpenAI etc.) também consegue entender mídia recebida quando configurada como o modelo de
resposta ativo.
</Note>

## Assíncrono vs. síncrono

| Recurso          | Modo        | Motivo                                                            |
| ---------------- | ----------- | ----------------------------------------------------------------- |
| Imagem           | Síncrono    | Respostas do provedor retornam em segundos; conclui junto com a resposta. |
| Síntese de fala  | Síncrono    | Respostas do provedor retornam em segundos; anexadas ao áudio da resposta. |
| Vídeo            | Assíncrono  | O processamento do provedor leva de 30 s a vários minutos.        |
| Música (compartilhado) | Assíncrono  | Mesma característica de processamento do provedor que vídeo.      |
| Música (ComfyUI) | Síncrono    | O workflow local executa junto com o servidor ComfyUI configurado. |

Para ferramentas assíncronas, o OpenClaw envia a solicitação ao provedor, retorna um id de tarefa
imediatamente e acompanha o job no livro-razão de tarefas. O agente continua
respondendo a outras mensagens enquanto o job executa. Quando o provedor termina,
o OpenClaw desperta o agente com os caminhos da mídia gerada para que ele possa avisar o
usuário e, quando exigido pela política de entrega da origem, retransmitir o resultado pela
ferramenta de mensagem. Para rotas de grupo/canal somente com ferramenta de mensagem, o OpenClaw trata
evidência ausente de entrega por ferramenta de mensagem como uma tentativa de conclusão com falha e envia
o fallback da mídia gerada diretamente ao canal original.

## Transcrição de fala e Chamada de voz

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio e xAI conseguem transcrever
áudio recebido pelo caminho em lote `tools.media.audio` quando configurados.
Plugins de canal que fazem preflight de uma nota de voz para controle de menção ou análise de
comando marcam o anexo transcrito no contexto recebido, para que a etapa compartilhada de
compreensão de mídia reutilize essa transcrição em vez de fazer uma segunda
chamada de STT para o mesmo áudio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI também registram provedores de STT por
streaming de Chamada de voz, para que áudio telefônico ao vivo possa ser encaminhado ao fornecedor
selecionado sem esperar por uma gravação concluída.

## Mapeamentos de provedores (como fornecedores se dividem entre superfícies)

<AccordionGroup>
  <Accordion title="Google">
    Superfícies de imagem, vídeo, música, TTS em lote, voz em tempo real de backend e
    compreensão de mídia.
  </Accordion>
  <Accordion title="OpenAI">
    Superfícies de imagem, vídeo, TTS em lote, STT em lote, STT por streaming de Chamada de voz, voz em tempo real de backend
    e embeddings de memória.
  </Accordion>
  <Accordion title="DeepInfra">
    Superfícies de roteamento de chat/modelo, geração/edição de imagens, texto para vídeo, TTS em lote,
    STT em lote, compreensão de mídia de imagem e embeddings de memória.
    Modelos nativos da DeepInfra de rerank/classificação/detecção de objetos não são
    registrados até que o OpenClaw tenha contratos de provedor dedicados para essas
    categorias.
  </Accordion>
  <Accordion title="xAI">
    Imagem, vídeo, busca, execução de código, TTS em lote, STT em lote e STT por streaming de Chamada de voz.
    A voz em tempo real da xAI é um recurso upstream, mas não é
    registrada no OpenClaw até que o contrato compartilhado de voz em tempo real consiga
    representá-la.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Geração de imagens](/pt-BR/tools/image-generation)
- [Geração de vídeos](/pt-BR/tools/video-generation)
- [Geração de música](/pt-BR/tools/music-generation)
- [Síntese de fala](/pt-BR/tools/tts)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Nós de áudio](/pt-BR/nodes/audio)
