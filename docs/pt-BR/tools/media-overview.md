---
read_when:
    - Procurando uma visão geral dos recursos de mídia do OpenClaw
    - Decidindo qual provedor de mídia configurar
    - Entendendo como a geração assíncrona de mídia funciona
sidebarTitle: Media overview
summary: Recursos de imagem, vídeo, música, fala e compreensão de mídia em resumo
title: Visão geral de mídia
x-i18n:
    generated_at: "2026-06-27T18:16:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw gera imagens, vídeos e música, entende mídia recebida
(imagens, áudio, vídeo) e fala respostas em voz alta com conversão de texto em fala. Todos
os recursos de mídia são orientados por ferramentas: o agente decide quando usá-los com base
na conversa, e cada ferramenta só aparece quando pelo menos um provedor de suporte
está configurado.

A fala ao vivo usa o contrato de sessão Talk em vez do caminho da ferramenta de mídia de uso único.
Talk tem três modos: `realtime` nativo do provedor, `stt-tts` local ou em streaming
e `transcription` para captura de fala apenas para observação. Esses modos
compartilham catálogos de provedores, envelopes de eventos e semântica de cancelamento com
telefonia, reuniões, tempo real no navegador e clientes nativos push-to-talk.

## Recursos

<CardGroup cols={2}>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Crie e edite imagens a partir de prompts de texto ou imagens de referência via
    `image_generate`. Assíncrono em sessões de chat — executa em segundo plano e
    publica o resultado quando estiver pronto.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Texto para vídeo, imagem para vídeo e vídeo para vídeo via `video_generate`.
    Assíncrono — executa em segundo plano e publica o resultado quando estiver pronto.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Gere músicas ou faixas de áudio via `music_generate`. Assíncrono em sessões de chat
    no ciclo de vida compartilhado de tarefas de geração de mídia.
  </Card>
  <Card title="Texto para fala" href="/pt-BR/tools/tts" icon="microphone">
    Converta respostas enviadas em áudio falado via ferramenta `tts` mais a configuração
    `messages.tts`. Síncrono.
  </Card>
  <Card title="Entendimento de mídia" href="/pt-BR/nodes/media-understanding" icon="eye">
    Resuma imagens, áudio e vídeo recebidos usando provedores de modelos com capacidade de visão
    e plugins dedicados de entendimento de mídia.
  </Card>
  <Card title="Fala para texto" href="/pt-BR/nodes/audio" icon="ear-listen">
    Transcreva mensagens de voz recebidas por provedores de STT em lote ou STT em streaming
    de Voice Call.
  </Card>
</CardGroup>

## Matriz de recursos por provedor

| Provedor          | Imagem | Vídeo | Música | TTS | STT | Voz em tempo real | Entendimento de mídia |
| ----------------- | :----: | :---: | :----: | :-: | :-: | :---------------: | :-------------------: |
| Alibaba           |        |   ✓   |        |     |     |                   |                       |
| BytePlus          |        |   ✓   |        |     |     |                   |                       |
| ComfyUI           |   ✓    |   ✓   |   ✓    |     |     |                   |                       |
| DeepInfra         |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |           ✓           |
| Deepgram          |        |       |        |     |  ✓  |         ✓         |                       |
| ElevenLabs        |        |       |        |  ✓  |  ✓  |                   |                       |
| fal               |   ✓    |   ✓   |   ✓    |     |     |                   |                       |
| Google            |   ✓    |   ✓   |   ✓    |  ✓  |     |         ✓         |           ✓           |
| Gradium           |        |       |        |  ✓  |     |                   |                       |
| Local CLI         |        |       |        |  ✓  |     |                   |                       |
| Microsoft         |        |       |        |  ✓  |     |                   |                       |
| Microsoft Foundry |   ✓    |       |        |     |     |                   |                       |
| MiniMax           |   ✓    |   ✓   |   ✓    |  ✓  |     |                   |                       |
| Mistral           |        |       |        |     |  ✓  |                   |                       |
| OpenAI            |   ✓    |   ✓   |        |  ✓  |  ✓  |         ✓         |           ✓           |
| OpenRouter        |   ✓    |   ✓   |   ✓    |  ✓  |  ✓  |                   |           ✓           |
| Qwen              |        |   ✓   |        |     |     |                   |                       |
| Runway            |        |   ✓   |        |     |     |                   |                       |
| SenseAudio        |        |       |        |     |  ✓  |                   |                       |
| Together          |        |   ✓   |        |     |     |                   |                       |
| Vydra             |   ✓    |   ✓   |        |  ✓  |     |                   |                       |
| xAI               |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |           ✓           |
| Xiaomi MiMo       |   ✓    |       |        |  ✓  |     |                   |           ✓           |

<Note>
O entendimento de mídia usa qualquer modelo com capacidade de visão ou áudio registrado
na configuração do seu provedor. A matriz acima lista provedores com suporte dedicado
a entendimento de mídia; a maioria dos provedores de LLM multimodal (Anthropic, Google,
OpenAI etc.) também consegue entender mídia recebida quando configurada como o modelo de
resposta ativo.
</Note>

## Assíncrono vs. síncrono

| Recurso        | Modo         | Por quê                                                                                              |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Imagem         | Assíncrono   | O processamento do provedor pode durar mais que uma rodada de chat; anexos gerados usam o caminho compartilhado de conclusão. |
| Texto para fala | Síncrono    | As respostas do provedor retornam em segundos; anexadas ao áudio da resposta.                        |
| Vídeo          | Assíncrono   | O processamento do provedor leva de 30 s a vários minutos; filas lentas podem executar até o tempo limite configurado. |
| Música         | Assíncrono   | Mesma característica de processamento do provedor que vídeo.                                         |

Para ferramentas assíncronas, o OpenClaw envia a solicitação ao provedor, retorna um id de tarefa
imediatamente e acompanha o trabalho no livro-razão de tarefas. O agente continua
respondendo a outras mensagens enquanto o trabalho executa. Quando o provedor termina,
o OpenClaw desperta o agente com os caminhos da mídia gerada para que ele possa informar o
usuário pelo modo normal de resposta visível da sessão: entrega automática da resposta final
quando configurada, ou `message(action="send")` quando a sessão exige
a ferramenta de mensagem. Se a sessão solicitante estiver inativa ou sua ativação ativa
falhar, e alguma mídia gerada ainda estiver ausente na resposta de conclusão,
o OpenClaw envia um fallback direto idempotente apenas com a mídia ausente. Mídia
já entregue pela resposta de conclusão não é publicada novamente.

## Fala para texto e Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio e xAI podem transcrever
áudio recebido pelo caminho em lote `tools.media.audio` quando configurados.
Plugins de canal que pré-verificam uma nota de voz para controle de menções ou análise de comandos
marcam o anexo transcrito no contexto de entrada, para que a passagem compartilhada de
entendimento de mídia reutilize essa transcrição em vez de fazer uma segunda
chamada STT para o mesmo áudio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI também registram provedores de STT em streaming
para Voice Call, então o áudio telefônico ao vivo pode ser encaminhado ao fornecedor selecionado
sem esperar uma gravação concluída.

Para conversas de usuário ao vivo, prefira o [modo Talk](/pt-BR/nodes/talk). Anexos de áudio em lote
permanecem no caminho de mídia; tempo real no navegador, push-to-talk nativo,
telefonia e áudio de reuniões devem usar eventos Talk e os catálogos com escopo de sessão
retornados pelo Gateway.

## Mapeamentos de provedores (como fornecedores se dividem entre superfícies)

<AccordionGroup>
  <Accordion title="Google">
    Superfícies de imagem, vídeo, música, TTS em lote, voz em tempo real no backend e
    entendimento de mídia.
  </Accordion>
  <Accordion title="OpenAI">
    Superfícies de imagem, vídeo, TTS em lote, STT em lote, STT em streaming de Voice Call, voz em tempo real
    no backend e incorporação de memória.
  </Accordion>
  <Accordion title="DeepInfra">
    Superfícies de roteamento de chat/modelo, geração/edição de imagens, texto para vídeo, TTS em lote,
    STT em lote, entendimento de mídia por imagem e incorporação de memória.
    Modelos nativos do DeepInfra de rerank/classificação/detecção de objetos não são
    registrados até que o OpenClaw tenha contratos de provedor dedicados para essas
    categorias.
  </Accordion>
  <Accordion title="xAI">
    Imagem, vídeo, busca, execução de código, TTS em lote, STT em lote e STT em streaming de Voice
    Call. A voz em tempo real da xAI é um recurso upstream, mas
    não é registrada no OpenClaw até que o contrato compartilhado de voz em tempo real possa
    representá-la.
  </Accordion>
</AccordionGroup>

## Relacionados

- [Geração de imagens](/pt-BR/tools/image-generation)
- [Geração de vídeo](/pt-BR/tools/video-generation)
- [Geração de música](/pt-BR/tools/music-generation)
- [Texto para fala](/pt-BR/tools/tts)
- [Entendimento de mídia](/pt-BR/nodes/media-understanding)
- [Nós de áudio](/pt-BR/nodes/audio)
- [Modo Talk](/pt-BR/nodes/talk)
