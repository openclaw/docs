---
read_when:
    - Procurando uma visão geral das capacidades de mídia
    - Decidindo qual provider de mídia configurar
    - Entendendo como funciona a geração de mídia assíncrona
summary: Página inicial unificada para capacidades de geração, compreensão e fala de mídia
title: Visão geral de mídia
x-i18n:
    generated_at: "2026-04-24T06:17:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469fb173ac3853011b8cd4f89f3ab97dd7d14e12e4e1d7d87e84de05d025a593
    source_path: tools/media-overview.md
    workflow: 15
---

# Geração e compreensão de mídia

O OpenClaw gera imagens, vídeos e música, entende mídia de entrada (imagens, áudio, vídeo) e fala respostas em voz alta com texto para fala. Todas as capacidades de mídia são orientadas por tools: o agente decide quando usá-las com base na conversa, e cada tool só aparece quando pelo menos um provider de backend está configurado.

## Capacidades em resumo

| Capacidade            | Tool             | Providers                                                                                   | O que faz                                              |
| --------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Geração de imagem     | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | Cria ou edita imagens a partir de prompts de texto ou referências |
| Geração de vídeo      | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Cria vídeos a partir de texto, imagens ou vídeos existentes |
| Geração de música     | `music_generate` | ComfyUI, Google, MiniMax                                                                    | Cria música ou faixas de áudio a partir de prompts de texto |
| Texto para fala (TTS) | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                 | Converte respostas de saída em áudio falado            |
| Compreensão de mídia  | (automática)     | Qualquer provider de modelo com capacidade de visão/áudio, mais fallbacks de CLI            | Resume imagens, áudio e vídeo de entrada               |

## Matriz de capacidades por provider

Esta tabela mostra quais providers oferecem suporte a quais capacidades de mídia em toda a plataforma.

| Provider   | Imagem | Vídeo | Música | TTS | STT / Transcrição | Compreensão de mídia |
| ---------- | ------ | ----- | ------ | --- | ----------------- | -------------------- |
| Alibaba    |        | Sim   |        |     |                   |                      |
| BytePlus   |        | Sim   |        |     |                   |                      |
| ComfyUI    | Sim    | Sim   | Sim    |     |                   |                      |
| Deepgram   |        |       |        |     | Sim               |                      |
| ElevenLabs |        |       |        | Sim | Sim               |                      |
| fal        | Sim    | Sim   |        |     |                   |                      |
| Google     | Sim    | Sim   | Sim    |     |                   | Sim                  |
| Microsoft  |        |       |        | Sim |                   |                      |
| MiniMax    | Sim    | Sim   | Sim    | Sim |                   |                      |
| Mistral    |        |       |        |     | Sim               |                      |
| OpenAI     | Sim    | Sim   |        | Sim | Sim               | Sim                  |
| Qwen       |        | Sim   |        |     |                   |                      |
| Runway     |        | Sim   |        |     |                   |                      |
| Together   |        | Sim   |        |     |                   |                      |
| Vydra      | Sim    | Sim   |        |     |                   |                      |
| xAI        | Sim    | Sim   |        | Sim | Sim               | Sim                  |

<Note>
A compreensão de mídia usa qualquer modelo com capacidade de visão ou áudio registrado na sua configuração de provider. A tabela acima destaca providers com suporte dedicado a compreensão de mídia; a maioria dos providers de LLM com modelos multimodais (Anthropic, Google, OpenAI etc.) também pode entender mídia de entrada quando configurada como modelo ativo de resposta.
</Note>

## Como funciona a geração assíncrona

Geração de vídeo e música é executada como tarefa em segundo plano porque o processamento do provider normalmente leva de 30 segundos a vários minutos. Quando o agente chama `video_generate` ou `music_generate`, o OpenClaw envia a requisição ao provider, retorna imediatamente um ID de tarefa e rastreia o job no ledger de tarefas. O agente continua respondendo a outras mensagens enquanto o job é executado. Quando o provider termina, o OpenClaw acorda o agente para que ele possa publicar a mídia finalizada de volta no canal original. Geração de imagem e TTS são síncronos e são concluídos inline com a resposta.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI podem transcrever áudio de entrada
pelo caminho em lote `tools.media.audio` quando configurados. Deepgram,
ElevenLabs, Mistral, OpenAI e xAI também registram providers de STT em streaming para Voice Call,
então o áudio ao vivo da chamada pode ser encaminhado ao vendor selecionado
sem esperar por uma gravação concluída.

A OpenAI mapeia para as superfícies do OpenClaw de imagem, vídeo, TTS em lote, STT em lote, STT em streaming para Voice Call, voz realtime e embeddings de memória. A xAI atualmente
mapeia para as superfícies do OpenClaw de imagem, vídeo, busca, execução de código, TTS em lote, STT em lote
e STT em streaming para Voice Call. A voz Realtime da xAI é uma
capacidade upstream, mas não é registrada no OpenClaw até que o contrato compartilhado
de voz realtime possa representá-la.

## Links rápidos

- [Geração de imagem](/pt-BR/tools/image-generation) -- geração e edição de imagens
- [Geração de vídeo](/pt-BR/tools/video-generation) -- texto para vídeo, imagem para vídeo e vídeo para vídeo
- [Geração de música](/pt-BR/tools/music-generation) -- criação de música e faixas de áudio
- [Texto para fala](/pt-BR/tools/tts) -- conversão de respostas em áudio falado
- [Compreensão de mídia](/pt-BR/nodes/media-understanding) -- compreensão de imagens, áudio e vídeo de entrada

## Relacionado

- [Geração de imagem](/pt-BR/tools/image-generation)
- [Geração de vídeo](/pt-BR/tools/video-generation)
- [Geração de música](/pt-BR/tools/music-generation)
- [Texto para fala](/pt-BR/tools/tts)
