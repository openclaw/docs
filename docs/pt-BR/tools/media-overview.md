---
read_when:
    - Procurando uma visão geral dos recursos de mídia do OpenClaw
    - Decidindo qual provedor de mídia configurar
    - Entendendo como funciona a geração assíncrona de mídia
sidebarTitle: Media overview
summary: Visão geral das capacidades de imagem, vídeo, música, fala e compreensão de mídia
title: Visão geral de mídia
x-i18n:
    generated_at: "2026-05-12T08:46:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7ca89d058467968ee140cb3318fe8a1fb96d09fe7c59982efce36eb9b714591
    source_path: tools/media-overview.md
    workflow: 16
---

O OpenClaw gera imagens, vídeos e música, entende mídia recebida
(imagens, áudio, vídeo) e fala respostas em voz alta com conversão de texto
em fala. Todos os recursos de mídia são orientados por ferramentas: o agente
decide quando usá-los com base na conversa, e cada ferramenta só aparece
quando pelo menos um provedor de apoio está configurado.

A fala ao vivo usa o contrato de sessão Talk em vez do caminho da ferramenta
de mídia de uso único. O Talk tem três modos: `realtime` nativo do provedor,
`stt-tts` local ou em streaming, e `transcription` para captura de fala apenas
para observação. Esses modos compartilham catálogos de provedores, envelopes
de eventos e semântica de cancelamento com telefonia, reuniões, tempo real no
navegador e clientes nativos de apertar para falar.

## Recursos

<CardGroup cols={2}>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Crie e edite imagens a partir de prompts de texto ou imagens de referência via
    `image_generate`. Síncrono — conclui em linha com a resposta.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Texto para vídeo, imagem para vídeo e vídeo para vídeo via `video_generate`.
    Assíncrono — executa em segundo plano e publica o resultado quando estiver pronto.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Gere música ou faixas de áudio via `music_generate`. Assíncrono em provedores
    compartilhados; o caminho de fluxo de trabalho do ComfyUI executa de forma síncrona.
  </Card>
  <Card title="Conversão de texto em fala" href="/pt-BR/tools/tts" icon="microphone">
    Converta respostas de saída em áudio falado via a ferramenta `tts` mais a configuração
    `messages.tts`. Síncrono.
  </Card>
  <Card title="Compreensão de mídia" href="/pt-BR/nodes/media-understanding" icon="eye">
    Resuma imagens, áudio e vídeo recebidos usando provedores de modelo com capacidade
    de visão e plugins dedicados de compreensão de mídia.
  </Card>
  <Card title="Fala para texto" href="/pt-BR/nodes/audio" icon="ear-listen">
    Transcreva mensagens de voz recebidas por meio de STT em lote ou provedores de STT
    em streaming para chamadas de voz.
  </Card>
</CardGroup>

## Matriz de recursos de provedores

| Provedor     | Imagem | Vídeo | Música | TTS | STT | Voz em tempo real | Compreensão de mídia |
| ------------ | :----: | :---: | :----: | :-: | :-: | :---------------: | :------------------: |
| Alibaba      |        |   ✓   |        |     |     |                   |                      |
| BytePlus     |        |   ✓   |        |     |     |                   |                      |
| ComfyUI      |   ✓    |   ✓   |   ✓    |     |     |                   |                      |
| DeepInfra    |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |          ✓           |
| Deepgram     |        |       |        |     |  ✓  |         ✓         |                      |
| ElevenLabs   |        |       |        |  ✓  |  ✓  |                   |                      |
| fal          |   ✓    |   ✓   |        |     |     |                   |                      |
| Google       |   ✓    |   ✓   |   ✓    |  ✓  |     |         ✓         |          ✓           |
| Gradium      |        |       |        |  ✓  |     |                   |                      |
| CLI local    |        |       |        |  ✓  |     |                   |                      |
| Microsoft    |        |       |        |  ✓  |     |                   |                      |
| MiniMax      |   ✓    |   ✓   |   ✓    |  ✓  |     |                   |                      |
| Mistral      |        |       |        |     |  ✓  |                   |                      |
| OpenAI       |   ✓    |   ✓   |        |  ✓  |  ✓  |         ✓         |          ✓           |
| OpenRouter   |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |          ✓           |
| Qwen         |        |   ✓   |        |     |     |                   |                      |
| Runway       |        |   ✓   |        |     |     |                   |                      |
| SenseAudio   |        |       |        |     |  ✓  |                   |                      |
| Together     |        |   ✓   |        |     |     |                   |                      |
| Vydra        |   ✓    |   ✓   |        |  ✓  |     |                   |                      |
| xAI          |   ✓    |   ✓   |        |  ✓  |  ✓  |                   |          ✓           |
| Xiaomi MiMo  |   ✓    |       |        |  ✓  |     |                   |          ✓           |

<Note>
A compreensão de mídia usa qualquer modelo com capacidade de visão ou áudio registrado
na sua configuração de provedor. A matriz acima lista provedores com suporte dedicado
a compreensão de mídia; a maioria dos provedores de LLM multimodais (Anthropic, Google,
OpenAI etc.) também consegue entender mídia recebida quando configurada como o modelo
ativo de resposta.
</Note>

## Assíncrono vs. síncrono

| Recurso                 | Modo        | Por quê                                                                                               |
| ----------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| Imagem                  | Síncrono    | As respostas do provedor retornam em segundos; conclui em linha com a resposta.                       |
| Conversão de texto em fala | Síncrono | As respostas do provedor retornam em segundos; anexadas ao áudio da resposta.                         |
| Vídeo                   | Assíncrono  | O processamento do provedor leva de 30 s a vários minutos; filas lentas podem executar até o timeout configurado. |
| Música (compartilhada)  | Assíncrono  | Mesma característica de processamento do provedor que vídeo.                                          |
| Música (ComfyUI)        | Síncrono    | O fluxo de trabalho local executa em linha contra o servidor ComfyUI configurado.                     |

Para ferramentas assíncronas, o OpenClaw envia a solicitação ao provedor,
retorna um id de tarefa imediatamente e rastreia o trabalho no registro de
tarefas. O agente continua respondendo a outras mensagens enquanto o trabalho
executa. Quando o provedor termina, o OpenClaw acorda o agente com os caminhos
da mídia gerada para que ele possa avisar o usuário e, quando exigido pela
política de entrega da origem, retransmitir o resultado pela ferramenta de
mensagens. Para rotas de grupo/canal somente com ferramenta de mensagens, o
OpenClaw trata a ausência de evidência de entrega pela ferramenta de mensagens
como uma tentativa de conclusão com falha e envia o fallback de mídia gerada
diretamente ao canal original.

## Fala para texto e chamada de voz

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio e xAI podem transcrever
áudio recebido pelo caminho em lote `tools.media.audio` quando configurados.
Plugins de canal que fazem preflight de uma nota de voz para filtragem por menção ou análise
de comando marcam o anexo transcrito no contexto recebido, então a passagem
compartilhada de compreensão de mídia reutiliza essa transcrição em vez de fazer uma segunda
chamada STT para o mesmo áudio.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI também registram provedores de STT
em streaming para chamadas de voz, então áudio telefônico ao vivo pode ser encaminhado ao fornecedor
selecionado sem aguardar uma gravação concluída.

Para conversas ao vivo com usuários, prefira o [modo Talk](/pt-BR/nodes/talk). Anexos
de áudio em lote permanecem no caminho de mídia; tempo real no navegador,
apertar para falar nativo, telefonia e áudio de reunião devem usar eventos
Talk e os catálogos com escopo de sessão retornados pelo Gateway.

## Mapeamentos de provedores (como os fornecedores se dividem entre superfícies)

<AccordionGroup>
  <Accordion title="Google">
    Superfícies de imagem, vídeo, música, TTS em lote, voz em tempo real de backend e
    compreensão de mídia.
  </Accordion>
  <Accordion title="OpenAI">
    Superfícies de imagem, vídeo, TTS em lote, STT em lote, STT em streaming para chamadas de voz,
    voz em tempo real de backend e embedding de memória.
  </Accordion>
  <Accordion title="DeepInfra">
    Superfícies de roteamento de chat/modelo, geração/edição de imagens, texto para vídeo, TTS em lote,
    STT em lote, compreensão de mídia de imagem e embedding de memória.
    Modelos nativos da DeepInfra de rerank/classificação/detecção de objetos não são
    registrados até que o OpenClaw tenha contratos de provedor dedicados para essas
    categorias.
  </Accordion>
  <Accordion title="xAI">
    Imagem, vídeo, busca, execução de código, TTS em lote, STT em lote e STT em streaming
    para chamadas de voz. Voz em tempo real da xAI é um recurso upstream, mas não está
    registrada no OpenClaw até que o contrato compartilhado de voz em tempo real consiga
    representá-la.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Geração de imagens](/pt-BR/tools/image-generation)
- [Geração de vídeo](/pt-BR/tools/video-generation)
- [Geração de música](/pt-BR/tools/music-generation)
- [Conversão de texto em fala](/pt-BR/tools/tts)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Nós de áudio](/pt-BR/nodes/audio)
- [Modo Talk](/pt-BR/nodes/talk)
