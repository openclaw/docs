---
read_when:
    - Procurando uma visão geral dos recursos de mídia do OpenClaw
    - Decidindo qual provedor de mídia configurar
    - Entendendo como a geração de mídia assíncrona funciona
sidebarTitle: Media overview
summary: Recursos de imagem, vídeo, música, fala e compreensão de mídia em resumo
title: Visão geral de mídia
x-i18n:
    generated_at: "2026-04-26T11:39:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70be8062c01f57bf53ab08aad4f1561e3958adc94e478224821d722fd500e09f
    source_path: tools/media-overview.md
    workflow: 15
---

O OpenClaw gera imagens, vídeos e música, entende mídia recebida
(imagens, áudio, vídeo) e reproduz respostas em voz alta com texto para fala. Todos os
recursos de mídia são orientados por ferramentas: o agente decide quando usá-los com base
na conversa, e cada ferramenta só aparece quando pelo menos um provedor
de suporte está configurado.

## Recursos

<CardGroup cols={2}>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Crie e edite imagens a partir de prompts de texto ou imagens de referência via
    `image_generate`. Síncrono — é concluído inline com a resposta.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Texto para vídeo, imagem para vídeo e vídeo para vídeo via `video_generate`.
    Assíncrono — é executado em segundo plano e publica o resultado quando estiver pronto.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Gere música ou faixas de áudio via `music_generate`. Assíncrono em provedores compartilhados;
    o caminho de workflow do ComfyUI é executado de forma síncrona.
  </Card>
  <Card title="Texto para fala" href="/pt-BR/tools/tts" icon="microphone">
    Converta respostas de saída em áudio falado via a ferramenta `tts` mais a
    configuração `messages.tts`. Síncrono.
  </Card>
  <Card title="Compreensão de mídia" href="/pt-BR/nodes/media-understanding" icon="eye">
    Resuma imagens, áudio e vídeo recebidos usando provedores de modelo
    com recursos de visão e plugins dedicados de compreensão de mídia.
  </Card>
  <Card title="Fala para texto" href="/pt-BR/nodes/audio" icon="ear-listen">
    Transcreva mensagens de voz recebidas por meio de STT em lote ou provedores
    de STT em streaming do Voice Call.
  </Card>
</CardGroup>

## Matriz de recursos por provedor

| Provedor    | Imagem | Vídeo | Música | TTS | STT | Voz em tempo real | Compreensão de mídia |
| ----------- | :----: | :---: | :----: | :-: | :-: | :---------------: | :------------------: |
| Alibaba     |        |   ✓   |        |     |     |                   |                      |
| BytePlus    |        |   ✓   |        |     |     |                   |                      |
| ComfyUI     |   ✓    |   ✓   |   ✓    |     |     |                   |                      |
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
| Qwen        |        |   ✓   |        |     |     |                   |                      |
| Runway      |        |   ✓   |        |     |     |                   |                      |
| SenseAudio  |        |       |        |     |  ✓  |                   |                      |
| Together    |        |   ✓   |        |     |     |                   |                      |
| Vydra       |   ✓    |   ✓   |        |  ✓  |     |                   |                      |
| xAI         |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |          ✓           |
| Xiaomi MiMo |   ✓    |       |        |  ✓  |     |                   |          ✓           |

<Note>
A compreensão de mídia usa qualquer modelo com capacidade de visão ou áudio registrado
na configuração do seu provedor. A matriz acima lista provedores com suporte dedicado
à compreensão de mídia; a maioria dos provedores de LLM multimodal (Anthropic, Google,
OpenAI etc.) também pode entender mídia recebida quando configurada como o modelo
de resposta ativo.
</Note>

## Assíncrono vs síncrono

| Recurso          | Modo         | Motivo                                                             |
| ---------------- | ------------ | ------------------------------------------------------------------ |
| Imagem           | Síncrono     | As respostas do provedor retornam em segundos; conclui inline com a resposta. |
| Texto para fala  | Síncrono     | As respostas do provedor retornam em segundos; anexadas ao áudio da resposta. |
| Vídeo            | Assíncrono   | O processamento do provedor leva de 30 s a vários minutos.         |
| Música (compartilhado) | Assíncrono | Mesma característica de processamento do provedor que vídeo.       |
| Música (ComfyUI) | Síncrono     | O workflow local é executado inline no servidor ComfyUI configurado. |

Para ferramentas assíncronas, o OpenClaw envia a solicitação ao provedor, retorna um ID de tarefa
imediatamente e acompanha o job no ledger de tarefas. O agente continua
respondendo a outras mensagens enquanto o job é executado. Quando o provedor termina,
o OpenClaw reativa o agente para que ele possa publicar a mídia finalizada de volta no
canal original.

## Fala para texto e Voice Call

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio e xAI podem transcrever
áudio recebido por meio do caminho em lote `tools.media.audio` quando configurados.
Plugins de canal que fazem pré-verificação de uma nota de voz para gating de menção ou
parsing de comando marcam o anexo transcrito no contexto de entrada, para que a etapa compartilhada
de compreensão de mídia reutilize essa transcrição em vez de fazer uma segunda
chamada de STT para o mesmo áudio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI também registram provedores de
STT em streaming do Voice Call, para que áudio telefônico ao vivo possa ser encaminhado ao
fornecedor selecionado sem esperar por uma gravação concluída.

## Mapeamentos de provedor (como os fornecedores se dividem entre as superfícies)

<AccordionGroup>
  <Accordion title="Google">
    Superfícies de imagem, vídeo, música, TTS em lote, voz em tempo real de backend e
    compreensão de mídia.
  </Accordion>
  <Accordion title="OpenAI">
    Superfícies de imagem, vídeo, TTS em lote, STT em lote, STT em streaming do Voice Call, voz em tempo real de backend
    e embedding de memória.
  </Accordion>
  <Accordion title="xAI">
    Imagem, vídeo, busca, execução de código, TTS em lote, STT em lote e STT em
    streaming do Voice Call. A voz Realtime do xAI é um recurso upstream, mas
    não é registrada no OpenClaw até que o contrato compartilhado de realtime-voice possa
    representá-la.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Geração de imagens](/pt-BR/tools/image-generation)
- [Geração de vídeo](/pt-BR/tools/video-generation)
- [Geração de música](/pt-BR/tools/music-generation)
- [Texto para fala](/pt-BR/tools/tts)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Nós de áudio](/pt-BR/nodes/audio)
