---
read_when:
    - Procurando uma visão geral dos recursos de mídia do OpenClaw
    - Decidindo qual provedor de mídia configurar
    - Entendendo como funciona a geração assíncrona de mídia
sidebarTitle: Media overview
summary: Visão geral dos recursos de imagem, vídeo, música, fala e compreensão de mídia
title: Visão geral de mídia
x-i18n:
    generated_at: "2026-07-12T00:26:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

O OpenClaw gera imagens, vídeos e músicas, compreende mídias recebidas
(imagens, áudio e vídeo) e reproduz respostas em voz alta com conversão de texto em fala. Todos
os recursos de mídia são orientados por ferramentas: o agente decide quando usá-los com base
na conversa, e cada ferramenta só aparece quando há pelo menos um provedor correspondente
configurado.

A fala ao vivo usa o contrato de sessão do Talk em vez do caminho da ferramenta de mídia
de execução única. O Talk tem três modos: `realtime` nativo do provedor, `stt-tts`
local ou por streaming e `transcription` para captura de fala somente para observação. Esses modos
compartilham catálogos de provedores, envelopes de eventos e semântica de cancelamento com
telefonia, reuniões, comunicação em tempo real no navegador e clientes nativos de pressione-para-falar.

## Recursos

<CardGroup cols={2}>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Crie e edite imagens a partir de prompts de texto ou imagens de referência por meio de
    `image_generate`. Assíncrona em sessões de chat — é executada em segundo plano e
    publica o resultado quando estiver pronto.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Conversão de texto em vídeo, imagem em vídeo e vídeo em vídeo por meio de `video_generate`.
    Assíncrona — é executada em segundo plano e publica o resultado quando estiver pronto.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Gere músicas ou faixas de áudio por meio de `music_generate`. Assíncrona em sessões de
    chat, usando o ciclo de vida compartilhado das tarefas de geração de mídia.
  </Card>
  <Card title="Conversão de texto em fala" href="/pt-BR/tools/tts" icon="microphone">
    Converta respostas enviadas em áudio falado por meio da ferramenta `tts` e da
    configuração `messages.tts`. Síncrona.
  </Card>
  <Card title="Compreensão de mídia" href="/pt-BR/nodes/media-understanding" icon="eye">
    Resuma imagens, áudios e vídeos recebidos usando provedores de modelos
    com recursos de visão e plugins dedicados à compreensão de mídia.
  </Card>
  <Card title="Conversão de fala em texto" href="/pt-BR/nodes/audio" icon="ear-listen">
    Transcreva mensagens de voz recebidas por meio de STT em lote ou de provedores
    de STT por streaming do Voice Call.
  </Card>
</CardGroup>

## Matriz de recursos dos provedores

<Note>
Esta tabela abrange os plugins dedicados à geração de mídia, TTS e STT. Muitos
provedores de modelos de chat (Anthropic, Google, OpenAI e outros) também compreendem
mídias recebidas por meio de seus modelos de resposta; consulte a lista completa de provedores em
[Compreensão de mídia](/pt-BR/nodes/media-understanding#provider-support-matrix).
</Note>

| Provedor          | Imagem | Vídeo | Música | TTS | STT | Voz em tempo real | Compreensão de mídia |
| ----------------- | :----: | :---: | :----: | :-: | :-: | :----------------: | :------------------: |
| Alibaba           |        |   ✓   |        |     |     |                    |                      |
| Azure Speech      |        |       |        |  ✓  |     |                    |                      |
| BytePlus          |        |   ✓   |        |     |     |                    |                      |
| ComfyUI           |   ✓    |   ✓   |   ✓    |     |     |                    |                      |
| Deepgram          |        |       |        |     |  ✓  |                    |                      |
| DeepInfra         |   ✓    |   ✓   |        |  ✓  |  ✓  |                    |          ✓           |
| ElevenLabs        |        |       |        |  ✓  |  ✓  |                    |                      |
| fal               |   ✓    |   ✓   |   ✓    |     |     |                    |                      |
| Google            |   ✓    |   ✓   |   ✓    |  ✓  |  ✓  |         ✓          |          ✓           |
| Gradium           |        |       |        |  ✓  |     |                    |                      |
| Inworld           |        |       |        |  ✓  |     |                    |                      |
| LiteLLM           |   ✓    |       |        |     |     |                    |                      |
| CLI local         |        |       |        |  ✓  |     |                    |                      |
| Microsoft         |        |       |        |  ✓  |     |                    |                      |
| Microsoft Foundry |   ✓    |       |        |     |     |                    |                      |
| MiniMax           |   ✓    |   ✓   |   ✓    |  ✓  |     |                    |                      |
| Mistral           |        |       |        |     |  ✓  |                    |                      |
| OpenAI            |   ✓    |   ✓   |        |  ✓  |  ✓  |         ✓          |          ✓           |
| OpenRouter        |   ✓    |   ✓   |   ✓    |  ✓  |  ✓  |                    |          ✓           |
| PixVerse          |        |   ✓   |        |     |     |                    |                      |
| Qwen              |        |   ✓   |        |     |     |                    |          ✓           |
| Runway            |        |   ✓   |        |     |     |                    |                      |
| SenseAudio        |        |       |        |     |  ✓  |                    |                      |
| Together          |        |   ✓   |        |     |     |                    |                      |
| Volcengine        |        |       |        |  ✓  |     |                    |                      |
| Vydra             |   ✓    |   ✓   |        |  ✓  |     |                    |                      |
| xAI               |   ✓    |   ✓   |        |  ✓  |  ✓  |                    |          ✓           |
| Xiaomi MiMo       |        |       |        |  ✓  |     |                    |                      |

<Note>
**Voz em tempo real** aqui significa comunicação bidirecional em tempo real nativa do provedor (modo
`realtime` do Talk, como Gemini Live ou a OpenAI Realtime API) — atualmente, apenas Google
e OpenAI a registram. Deepgram, ElevenLabs, Mistral, OpenAI e xAI
registram separadamente STT por streaming do Voice Call (áudio para texto unidirecional); consulte
[Conversão de fala em texto e Voice Call](#speech-to-text-and-voice-call) abaixo.
A voz em tempo real da xAI é um recurso fornecido pelo serviço de origem, mas não é registrada no
OpenClaw até que o contrato compartilhado de voz em tempo real possa representá-la.
</Note>

## Assíncrono e síncrono

| Recurso                   | Modo       | Motivo                                                                                                             |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Imagem                    | Assíncrono | O processamento do provedor pode durar mais que um turno do chat; os anexos gerados usam o caminho de conclusão compartilhado. |
| Conversão de texto em fala | Síncrono   | As respostas do provedor retornam em segundos; são anexadas ao áudio da resposta.                                  |
| Vídeo                     | Assíncrono | O processamento do provedor leva de 30 s a vários minutos; filas lentas podem ser executadas até o tempo limite configurado. |
| Música                    | Assíncrono | Tem a mesma característica de processamento do provedor que o vídeo.                                               |

Para ferramentas assíncronas, o OpenClaw envia a solicitação ao provedor, retorna imediatamente
um identificador de tarefa e acompanha o trabalho no registro de tarefas. O agente continua
respondendo a outras mensagens enquanto o trabalho é executado. Quando o provedor termina,
o OpenClaw desperta o agente com os caminhos das mídias geradas para que ele possa informar o
usuário pelo modo normal de resposta visível da sessão: entrega automática da resposta final
quando configurada ou `message(action="send")` quando a sessão exige
a ferramenta de mensagens. Se a sessão solicitante estiver inativa ou seu despertar ativo
falhar, e alguma mídia gerada ainda estiver ausente da resposta de conclusão,
o OpenClaw enviará diretamente, de modo idempotente, apenas as mídias ausentes. As mídias
já entregues pela resposta de conclusão não serão publicadas novamente.

## Conversão de fala em texto e Voice Call

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio e xAI podem transcrever áudios recebidos pelo caminho em lote
`tools.media.audio` quando configurados. Plugins de canais que verificam previamente uma
mensagem de voz para filtragem por menção ou análise de comandos marcam o anexo
transcrito no contexto recebido, para que a etapa compartilhada de compreensão de mídia
reutilize essa transcrição em vez de realizar uma segunda chamada de STT para o mesmo
áudio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI também registram provedores de
STT por streaming do Voice Call, permitindo que o áudio telefônico ao vivo seja encaminhado
ao fornecedor selecionado sem aguardar a conclusão de uma gravação.

Para conversas ao vivo com usuários, prefira o [modo Talk](/pt-BR/nodes/talk). Anexos de áudio
em lote permanecem no caminho de mídia; comunicação em tempo real no navegador, pressione-para-falar
nativo, telefonia e áudio de reuniões devem usar os eventos do Talk e os catálogos
com escopo de sessão retornados pelo Gateway.

## Mapeamentos de provedores (como os fornecedores se distribuem entre as superfícies)

<AccordionGroup>
  <Accordion title="Google">
    Superfícies de imagem, vídeo, música, TTS em lote, STT em lote, voz em tempo real
    no backend e compreensão de mídia.
  </Accordion>
  <Accordion title="OpenAI">
    Superfícies de imagem, vídeo, TTS em lote, STT em lote, STT por streaming do Voice Call,
    voz em tempo real no backend e embeddings de memória.
  </Accordion>
  <Accordion title="DeepInfra">
    Superfícies de roteamento de chat/modelos, geração/edição de imagens, conversão de texto em vídeo,
    TTS em lote, STT em lote, compreensão de mídia de imagem e embeddings de memória.
    A DeepInfra também oferece reclassificação, classificação, detecção de objetos e
    outros tipos de modelos nativos; o OpenClaw ainda não possui um contrato de provedor para essas
    categorias, portanto este plugin não as registra.
  </Accordion>
  <Accordion title="xAI">
    Imagem, vídeo, pesquisa, execução de código, TTS em lote, STT em lote e STT por
    streaming do Voice Call. A voz em tempo real da xAI é um recurso fornecido pelo serviço de origem,
    mas não é registrada no OpenClaw até que o contrato compartilhado de voz em tempo real possa
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
