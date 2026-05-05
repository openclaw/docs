---
read_when:
    - Procurando uma visão geral dos recursos de mídia do OpenClaw
    - Como decidir qual provedor de mídia configurar
    - Entendendo como funciona a geração assíncrona de mídia
sidebarTitle: Media overview
summary: Visão geral das capacidades de imagem, vídeo, música, fala e compreensão de mídia
title: Visão geral de mídia
x-i18n:
    generated_at: "2026-05-05T06:15:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw gera imagens, vídeos e música, entende mídia recebida
(imagens, áudio, vídeo) e fala respostas em voz alta com texto para fala. Todos
os recursos de mídia são orientados por ferramentas: o agente decide quando usá-los com base
na conversa, e cada ferramenta só aparece quando pelo menos um provedor de suporte
está configurado.

## Recursos

<CardGroup cols={2}>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Crie e edite imagens a partir de prompts de texto ou imagens de referência via
    `image_generate`. Síncrono — conclui junto com a resposta.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Texto para vídeo, imagem para vídeo e vídeo para vídeo via `video_generate`.
    Assíncrono — roda em segundo plano e publica o resultado quando estiver pronto.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Gere música ou faixas de áudio via `music_generate`. Assíncrono em
    provedores compartilhados; o caminho de workflow do ComfyUI roda de forma síncrona.
  </Card>
  <Card title="Texto para fala" href="/pt-BR/tools/tts" icon="microphone">
    Converta respostas enviadas em áudio falado via a ferramenta `tts` mais a
    configuração `messages.tts`. Síncrono.
  </Card>
  <Card title="Entendimento de mídia" href="/pt-BR/nodes/media-understanding" icon="eye">
    Resuma imagens, áudio e vídeo recebidos usando provedores de modelo com
    capacidade de visão e plugins dedicados de entendimento de mídia.
  </Card>
  <Card title="Fala para texto" href="/pt-BR/nodes/audio" icon="ear-listen">
    Transcreva mensagens de voz recebidas por meio de provedores de STT em lote ou STT
    por streaming de chamada de voz.
  </Card>
</CardGroup>

## Matriz de recursos por provedor

| Provedor    | Imagem | Vídeo | Música | TTS | STT | Voz em tempo real | Entendimento de mídia |
| ----------- | :----: | :---: | :----: | :-: | :-: | :---------------: | :-------------------: |
| Alibaba     |        |   ✓   |        |     |     |                   |                       |
| BytePlus    |        |   ✓   |        |     |     |                   |                       |
| ComfyUI     |   ✓    |   ✓   |   ✓    |     |     |                   |                       |
| DeepInfra   |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |           ✓           |
| Deepgram    |        |       |        |     |  ✓  |         ✓         |                       |
| ElevenLabs  |        |       |        |  ✓  |  ✓  |                   |                       |
| fal         |   ✓    |   ✓   |        |     |     |                   |                       |
| Google      |   ✓    |   ✓   |   ✓    |  ✓  |     |         ✓         |           ✓           |
| Gradium     |        |       |        |  ✓  |     |                   |                       |
| Local CLI   |        |       |        |  ✓  |     |                   |                       |
| Microsoft   |        |       |        |  ✓  |     |                   |                       |
| MiniMax     |   ✓    |   ✓   |   ✓    |  ✓  |     |                   |                       |
| Mistral     |        |       |        |     |  ✓  |                   |                       |
| OpenAI      |   ✓    |   ✓   |        |  ✓  |  ✓  |         ✓         |           ✓           |
| OpenRouter  |   ✓    |   ✓   |        |  ✓  |     |                   |           ✓           |
| Qwen        |        |   ✓   |        |     |     |                   |                       |
| Runway      |        |   ✓   |        |     |     |                   |                       |
| SenseAudio  |        |       |        |     |  ✓  |                   |                       |
| Together    |        |   ✓   |        |     |     |                   |                       |
| Vydra       |   ✓    |   ✓   |        |  ✓  |     |                   |                       |
| xAI         |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |           ✓           |
| Xiaomi MiMo |   ✓    |       |        |  ✓  |     |                   |           ✓           |

<Note>
O entendimento de mídia usa qualquer modelo com capacidade de visão ou áudio registrado
na configuração do seu provedor. A matriz acima lista provedores com suporte dedicado
a entendimento de mídia; a maioria dos provedores de LLM multimodais (Anthropic, Google,
OpenAI etc.) também consegue entender mídia recebida quando configurada como o modelo de
resposta ativo.
</Note>

## Assíncrono vs. síncrono

| Recurso          | Modo         | Motivo                                                                                               |
| ---------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Imagem           | Síncrono     | As respostas do provedor retornam em segundos; conclui junto com a resposta.                         |
| Texto para fala  | Síncrono     | As respostas do provedor retornam em segundos; anexadas ao áudio da resposta.                        |
| Vídeo            | Assíncrono   | O processamento do provedor leva de 30 s a vários minutos; filas lentas podem rodar até o timeout configurado. |
| Música (compartilhada) | Assíncrono | Mesma característica de processamento do provedor que vídeo.                                         |
| Música (ComfyUI) | Síncrono     | O workflow local roda de forma inline contra o servidor ComfyUI configurado.                         |

Para ferramentas assíncronas, o OpenClaw envia a solicitação ao provedor, retorna um id
de tarefa imediatamente e acompanha o job no ledger de tarefas. O agente continua
respondendo a outras mensagens enquanto o job roda. Quando o provedor termina,
o OpenClaw desperta o agente com os caminhos da mídia gerada para que ele possa avisar o
usuário e, quando exigido pela política de entrega da origem, retransmitir o resultado pela
ferramenta de mensagem. Para rotas de grupo/canal somente com ferramenta de mensagem, o OpenClaw trata
a ausência de evidência de entrega pela ferramenta de mensagem como uma tentativa de conclusão com falha e envia
o fallback de mídia gerada diretamente ao canal original.

## Fala para texto e chamada de voz

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio e xAI conseguem transcrever
áudio recebido pelo caminho em lote `tools.media.audio` quando configurados.
Plugins de canal que fazem preflight de uma nota de voz para controle de menções ou análise de
comandos marcam o anexo transcrito no contexto recebido, para que a etapa compartilhada de
entendimento de mídia reutilize essa transcrição em vez de fazer uma segunda
chamada STT para o mesmo áudio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI também registram provedores de STT por streaming
de chamada de voz, para que áudio telefônico ao vivo possa ser encaminhado ao fornecedor selecionado
sem aguardar uma gravação concluída.

## Mapeamentos de provedores (como os fornecedores se dividem entre superfícies)

<AccordionGroup>
  <Accordion title="Google">
    Superfícies de imagem, vídeo, música, TTS em lote, voz em tempo real de backend e
    entendimento de mídia.
  </Accordion>
  <Accordion title="OpenAI">
    Superfícies de imagem, vídeo, TTS em lote, STT em lote, STT por streaming de chamada de voz, voz em tempo real de backend
    e embeddings de memória.
  </Accordion>
  <Accordion title="DeepInfra">
    Superfícies de roteamento de chat/modelo, geração/edição de imagens, texto para vídeo, TTS em lote,
    STT em lote, entendimento de mídia de imagem e embeddings de memória.
    Modelos nativos da DeepInfra de reranqueamento/classificação/detecção de objetos não são
    registrados até que o OpenClaw tenha contratos de provedor dedicados para essas
    categorias.
  </Accordion>
  <Accordion title="xAI">
    Imagem, vídeo, busca, execução de código, TTS em lote, STT em lote e STT por streaming de chamada de voz.
    Voz em tempo real da xAI é um recurso upstream, mas não é
    registrado no OpenClaw até que o contrato compartilhado de voz em tempo real possa
    representá-lo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Geração de imagens](/pt-BR/tools/image-generation)
- [Geração de vídeos](/pt-BR/tools/video-generation)
- [Geração de música](/pt-BR/tools/music-generation)
- [Texto para fala](/pt-BR/tools/tts)
- [Entendimento de mídia](/pt-BR/nodes/media-understanding)
- [Nós de áudio](/pt-BR/nodes/audio)
