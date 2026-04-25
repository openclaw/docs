---
read_when:
    - Procurando uma visão geral dos recursos de mídia
    - Decidindo qual provedor de mídia configurar
    - Entendendo como funciona a geração de mídia assíncrona
summary: Página inicial unificada para recursos de geração, compreensão e fala de mídia
title: Visão geral de mídia
x-i18n:
    generated_at: "2026-04-25T13:57:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c674df701b88c807842078b2e2e53821f1b2fc6037fd2e4d688caea147e769f1
    source_path: tools/media-overview.md
    workflow: 15
---

# Geração e compreensão de mídia

O OpenClaw gera imagens, vídeos e música, compreende mídia recebida (imagens, áudio, vídeo) e fala respostas em voz alta com texto para fala. Todos os recursos de mídia são orientados por ferramentas: o agente decide quando usá-los com base na conversa, e cada ferramenta só aparece quando pelo menos um provedor de suporte está configurado.

## Recursos em resumo

| Capability           | Tool             | Providers                                                                                    | What it does                                            |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Geração de imagem    | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Cria ou edita imagens a partir de prompts de texto ou referências |
| Geração de vídeo     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Cria vídeos a partir de texto, imagens ou vídeos existentes |
| Geração de música    | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Cria músicas ou faixas de áudio a partir de prompts de texto |
| Texto para fala (TTS) | `tts`           | ElevenLabs, Google, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo  | Converte respostas enviadas em áudio falado             |
| Compreensão de mídia | (automático)     | Qualquer provedor de modelo compatível com visão/áudio, além de fallbacks de CLI             | Resume imagens, áudios e vídeos recebidos               |

## Matriz de recursos do provedor

Esta tabela mostra quais provedores oferecem suporte a quais recursos de mídia em toda a plataforma.

| Provider    | Image | Video | Music | TTS | STT / Transcription | Realtime Voice | Media Understanding |
| ----------- | ----- | ----- | ----- | --- | ------------------- | -------------- | ------------------- |
| Alibaba     |       | Yes   |       |     |                     |                |                     |
| BytePlus    |       | Yes   |       |     |                     |                |                     |
| ComfyUI     | Yes   | Yes   | Yes   |     |                     |                |                     |
| Deepgram    |       |       |       |     | Yes                 | Yes            |                     |
| ElevenLabs  |       |       |       | Yes | Yes                 |                |                     |
| fal         | Yes   | Yes   |       |     |                     |                |                     |
| Google      | Yes   | Yes   | Yes   | Yes |                     | Yes            | Yes                 |
| Gradium     |       |       |       | Yes |                     |                |                     |
| Local CLI   |       |       |       | Yes |                     |                |                     |
| Microsoft   |       |       |       | Yes |                     |                |                     |
| MiniMax     | Yes   | Yes   | Yes   | Yes |                     |                |                     |
| Mistral     |       |       |       |     | Yes                 |                |                     |
| OpenAI      | Yes   | Yes   |       | Yes | Yes                 | Yes            | Yes                 |
| Qwen        |       | Yes   |       |     |                     |                |                     |
| Runway      |       | Yes   |       |     |                     |                |                     |
| SenseAudio  |       |       |       |     | Yes                 |                |                     |
| Together    |       | Yes   |       |     |                     |                |                     |
| Vydra       | Yes   | Yes   |       | Yes |                     |                |                     |
| xAI         | Yes   | Yes   |       | Yes | Yes                 |                | Yes                 |
| Xiaomi MiMo | Yes   |       |       | Yes |                     |                | Yes                 |

<Note>
A compreensão de mídia usa qualquer modelo compatível com visão ou áudio registrado na configuração do seu provedor. A tabela acima destaca provedores com suporte dedicado à compreensão de mídia; a maioria dos provedores de LLM com modelos multimodais (Anthropic, Google, OpenAI etc.) também consegue compreender mídia recebida quando configurada como o modelo de resposta ativo.
</Note>

## Como funciona a geração assíncrona

A geração de vídeo e música é executada como tarefas em segundo plano porque o processamento do provedor normalmente leva de 30 segundos a vários minutos. Quando o agente chama `video_generate` ou `music_generate`, o OpenClaw envia a solicitação ao provedor, retorna um ID de tarefa imediatamente e acompanha o trabalho no registro de tarefas. O agente continua respondendo a outras mensagens enquanto o trabalho é executado. Quando o provedor conclui, o OpenClaw reativa o agente para que ele possa publicar a mídia finalizada de volta no canal original. A geração de imagem e o TTS são síncronos e são concluídos em linha com a resposta.

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio e xAI podem transcrever
áudio recebido por meio do caminho em lote `tools.media.audio` quando configurados.
Deepgram, ElevenLabs, Mistral, OpenAI e xAI também registram provedores de STT
por streaming para Voice Call, para que o áudio de chamadas telefônicas ao vivo possa ser encaminhado ao fornecedor selecionado sem esperar por uma gravação concluída.

O Google é mapeado para as superfícies de imagem, vídeo, música, TTS em lote, voz
em tempo real de backend e compreensão de mídia do OpenClaw. O OpenAI é mapeado para as superfícies de imagem,
vídeo, TTS em lote, STT em lote, STT por streaming de Voice Call, voz em tempo real de backend
e embeddings de memória do OpenClaw. O xAI atualmente é mapeado para as superfícies de imagem, vídeo,
pesquisa, execução de código, TTS em lote, STT em lote e STT por streaming de Voice Call
do OpenClaw. A voz em tempo real do xAI é atualmente um recurso upstream, mas não está
registrada no OpenClaw até que o contrato compartilhado de voz em tempo real possa representá-la.

## Links rápidos

- [Geração de imagem](/pt-BR/tools/image-generation) -- geração e edição de imagens
- [Geração de vídeo](/pt-BR/tools/video-generation) -- texto para vídeo, imagem para vídeo e vídeo para vídeo
- [Geração de música](/pt-BR/tools/music-generation) -- criação de música e faixas de áudio
- [Texto para fala](/pt-BR/tools/tts) -- conversão de respostas em áudio falado
- [Compreensão de mídia](/pt-BR/nodes/media-understanding) -- compreensão de imagens, áudio e vídeo recebidos

## Relacionado

- [Geração de imagem](/pt-BR/tools/image-generation)
- [Geração de vídeo](/pt-BR/tools/video-generation)
- [Geração de música](/pt-BR/tools/music-generation)
- [Texto para fala](/pt-BR/tools/tts)
