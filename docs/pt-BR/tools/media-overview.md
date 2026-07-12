---
read_when:
    - Procurando uma visão geral dos recursos de mídia do OpenClaw
    - Decidindo qual provedor de mídia configurar
    - Entendendo como funciona a geração assíncrona de mídia
sidebarTitle: Media overview
summary: Visão geral dos recursos de imagem, vídeo, música, fala e compreensão de mídia
title: Visão geral de mídia
x-i18n:
    generated_at: "2026-07-12T15:42:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

O OpenClaw gera imagens, vídeos e músicas, compreende mídia recebida
(imagens, áudio e vídeo) e fala as respostas em voz alta com conversão de texto em fala. Todos
os recursos de mídia são acionados por ferramentas: o agente decide quando usá-los com base
na conversa, e cada ferramenta só aparece quando pelo menos um provedor subjacente
está configurado.

A fala ao vivo usa o contrato de sessão do Talk em vez do caminho da ferramenta de mídia
de execução única. O Talk tem três modos: `realtime` nativo do provedor, `stt-tts`
local ou por streaming e `transcription` para captura de fala somente para observação. Esses modos
compartilham catálogos de provedores, envelopes de eventos e semântica de cancelamento com
telefonia, reuniões, tempo real no navegador e clientes nativos de pressione-para-falar.

## Recursos

<CardGroup cols={2}>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Crie e edite imagens a partir de prompts de texto ou imagens de referência por meio de
    `image_generate`. Assíncrono em sessões de chat — é executado em segundo plano e
    publica o resultado quando estiver pronto.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Texto para vídeo, imagem para vídeo e vídeo para vídeo por meio de `video_generate`.
    Assíncrono — é executado em segundo plano e publica o resultado quando estiver pronto.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Gere músicas ou faixas de áudio por meio de `music_generate`. Assíncrono em sessões de
    chat no ciclo de vida compartilhado das tarefas de geração de mídia.
  </Card>
  <Card title="Conversão de texto em fala" href="/pt-BR/tools/tts" icon="microphone">
    Converta respostas enviadas em áudio falado por meio da ferramenta `tts` e da
    configuração `messages.tts`. Síncrono.
  </Card>
  <Card title="Compreensão de mídia" href="/pt-BR/nodes/media-understanding" icon="eye">
    Resuma imagens, áudios e vídeos recebidos usando provedores de modelos
    com capacidade de visão e plugins dedicados à compreensão de mídia.
  </Card>
  <Card title="Conversão de fala em texto" href="/pt-BR/nodes/audio" icon="ear-listen">
    Transcreva mensagens de voz recebidas por meio de STT em lote ou provedores
    de STT por streaming do Voice Call.
  </Card>
</CardGroup>

## Matriz de recursos dos provedores

<Note>
Esta tabela abrange os plugins dedicados de geração de mídia, TTS e STT. Muitos
provedores de modelos de chat (Anthropic, Google, OpenAI e outros) também compreendem
mídia recebida por meio do modelo de resposta; consulte a lista completa de provedores em
[Compreensão de mídia](/pt-BR/nodes/media-understanding#provider-support-matrix).
</Note>

| Provedor          | Imagem | Vídeo | Música | TTS | STT | Voz em tempo real | Compreensão de mídia |
| ----------------- | :----: | :---: | :----: | :-: | :-: | :---------------: | :------------------: |
| Alibaba           |        |   ✓   |        |     |     |                   |                      |
| Azure Speech      |        |       |        |  ✓  |     |                   |                      |
| BytePlus          |        |   ✓   |        |     |     |                   |                      |
| ComfyUI           |   ✓    |   ✓   |   ✓    |     |     |                   |                      |
| Deepgram          |        |       |        |     |  ✓  |                   |                      |
| DeepInfra         |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |          ✓           |
| ElevenLabs        |        |       |        |  ✓  |  ✓  |                   |                      |
| fal               |   ✓    |   ✓   |   ✓    |     |     |                   |                      |
| Google            |   ✓    |   ✓   |   ✓    |  ✓  |  ✓  |         ✓         |          ✓           |
| Gradium           |        |       |        |  ✓  |     |                   |                      |
| Inworld           |        |       |        |  ✓  |     |                   |                      |
| LiteLLM           |   ✓    |       |        |     |     |                   |                      |
| CLI local         |        |       |        |  ✓  |     |                   |                      |
| Microsoft         |        |       |        |  ✓  |     |                   |                      |
| Microsoft Foundry |   ✓    |       |        |     |     |                   |                      |
| MiniMax           |   ✓    |   ✓   |   ✓    |  ✓  |     |                   |                      |
| Mistral           |        |       |        |     |  ✓  |                   |                      |
| OpenAI            |   ✓    |   ✓   |        |  ✓  |  ✓  |         ✓         |          ✓           |
| OpenRouter        |   ✓    |   ✓   |   ✓    |  ✓  |  ✓  |                   |          ✓           |
| PixVerse          |        |   ✓   |        |     |     |                   |                      |
| Qwen              |        |   ✓   |        |     |     |                   |          ✓           |
| Runway            |        |   ✓   |        |     |     |                   |                      |
| SenseAudio        |        |       |        |     |  ✓  |                   |                      |
| Together          |        |   ✓   |        |     |     |                   |                      |
| Volcengine        |        |       |        |  ✓  |     |                   |                      |
| Vydra             |   ✓    |   ✓   |        |  ✓  |     |                   |                      |
| xAI               |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |          ✓           |
| Xiaomi MiMo       |        |       |        |  ✓  |     |                   |                      |

<Note>
**Voz em tempo real** aqui significa comunicação bidirecional em tempo real nativa do provedor (modo
`realtime` do Talk, por exemplo, Gemini Live ou a API Realtime da OpenAI) — somente Google
e OpenAI a registram atualmente. Deepgram, ElevenLabs, Mistral, OpenAI e xAI
registram separadamente STT por streaming do Voice Call (áudio para texto unidirecional); consulte
[Conversão de fala em texto e Voice Call](#speech-to-text-and-voice-call) abaixo.
A voz em tempo real da xAI é um recurso do sistema upstream, mas não é registrada no
OpenClaw até que o contrato compartilhado de voz em tempo real possa representá-la.
</Note>

## Assíncrono versus síncrono

| Recurso                 | Modo       | Motivo                                                                                                                   |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Imagem                  | Assíncrono | O processamento do provedor pode durar além de um turno do chat; os anexos gerados usam o caminho compartilhado de conclusão. |
| Conversão de texto em fala | Síncrono   | As respostas do provedor retornam em segundos; são anexadas ao áudio da resposta.                                         |
| Vídeo                   | Assíncrono | O processamento do provedor leva de 30 s a vários minutos; filas lentas podem ser executadas até o tempo limite configurado. |
| Música                  | Assíncrono | Mesma característica de processamento pelo provedor que o vídeo.                                                         |

Para ferramentas assíncronas, o OpenClaw envia a solicitação ao provedor, retorna imediatamente
um id de tarefa e acompanha o trabalho no registro de tarefas. O agente continua
respondendo a outras mensagens enquanto o trabalho é executado. Quando o provedor termina,
o OpenClaw desperta o agente com os caminhos da mídia gerada para que ele possa informar o
usuário por meio do modo normal de resposta visível da sessão: entrega automática da resposta final
quando configurada ou `message(action="send")` quando a sessão exige
a ferramenta de mensagens. Se a sessão solicitante estiver inativa ou seu despertar ativo
falhar, e alguma mídia gerada ainda estiver ausente da resposta de conclusão,
o OpenClaw enviará um fallback direto idempotente somente com a mídia ausente. A mídia
já entregue pela resposta de conclusão não será publicada novamente.

## Conversão de fala em texto e Voice Call

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio e xAI podem transcrever áudio recebido pelo caminho em lote
`tools.media.audio` quando configurados. Os plugins de canal que fazem a verificação preliminar de uma
mensagem de voz para controle de menções ou análise de comandos marcam o anexo transcrito
no contexto recebido, para que a etapa compartilhada de compreensão de mídia
reutilize essa transcrição em vez de fazer uma segunda chamada de STT para o mesmo
áudio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI também registram provedores de
STT por streaming do Voice Call, de modo que o áudio telefônico ao vivo possa ser encaminhado ao
fornecedor selecionado sem esperar por uma gravação concluída.

Para conversas ao vivo com usuários, prefira o [modo Talk](/pt-BR/nodes/talk). Anexos de áudio em lote
permanecem no caminho de mídia; o tempo real no navegador, o pressione-para-falar nativo,
a telefonia e o áudio de reuniões devem usar eventos do Talk e os catálogos com escopo de sessão
retornados pelo Gateway.

## Mapeamentos de provedores (como os fornecedores se dividem entre as superfícies)

<AccordionGroup>
  <Accordion title="Google">
    Superfícies de imagem, vídeo, música, TTS em lote, STT em lote, voz em tempo real no backend e
    compreensão de mídia.
  </Accordion>
  <Accordion title="OpenAI">
    Superfícies de imagem, vídeo, TTS em lote, STT em lote, STT por streaming do Voice Call, voz em
    tempo real no backend e embeddings de memória.
  </Accordion>
  <Accordion title="DeepInfra">
    Superfícies de roteamento de chat/modelos, geração/edição de imagens, texto para vídeo, TTS em lote,
    STT em lote, compreensão de mídia de imagem e embeddings de memória.
    A DeepInfra também oferece reranqueamento, classificação, detecção de objetos e
    outros tipos de modelos nativos; o OpenClaw ainda não tem um contrato de provedor para essas
    categorias, portanto este plugin não as registra.
  </Accordion>
  <Accordion title="xAI">
    Imagem, vídeo, pesquisa, execução de código, TTS em lote, STT em lote e STT por streaming do Voice
    Call. A voz em tempo real da xAI é um recurso do sistema upstream, mas
    não é registrada no OpenClaw até que o contrato compartilhado de voz em tempo real possa
    representá-la.
  </Accordion>
</AccordionGroup>

## Relacionados

- [Geração de imagens](/pt-BR/tools/image-generation)
- [Geração de vídeos](/pt-BR/tools/video-generation)
- [Geração de música](/pt-BR/tools/music-generation)
- [Conversão de texto em fala](/pt-BR/tools/tts)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Nodes de áudio](/pt-BR/nodes/audio)
- [Modo Talk](/pt-BR/nodes/talk)
