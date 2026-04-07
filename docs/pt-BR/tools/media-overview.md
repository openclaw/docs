---
read_when:
    - Procurando uma visão geral dos recursos de mídia
    - Decidindo qual provedor de mídia configurar
    - Entendendo como a geração assíncrona de mídia funciona
summary: Página inicial unificada para recursos de geração, compreensão e fala de mídia
title: Visão Geral de Mídia
x-i18n:
    generated_at: "2026-04-07T05:32:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfee08eb91ec3e827724c8fa99bff7465356f6f1ac1b146562f35651798e3fd6
    source_path: tools/media-overview.md
    workflow: 15
---

# Geração e Compreensão de Mídia

O OpenClaw gera imagens, vídeos e música, compreende mídia recebida (imagens, áudio, vídeo) e fala respostas em voz alta com texto para fala. Todos os recursos de mídia são orientados por ferramentas: o agente decide quando usá-los com base na conversa, e cada ferramenta só aparece quando pelo menos um provedor subjacente está configurado.

## Recursos em resumo

| Recurso              | Ferramenta      | Provedores                                                                                   | O que faz                                               |
| -------------------- | --------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Geração de imagem    | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra                                                 | Cria ou edita imagens a partir de prompts de texto ou referências |
| Geração de vídeo     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Cria vídeos a partir de texto, imagens ou vídeos existentes |
| Geração de música    | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Cria música ou faixas de áudio a partir de prompts de texto |
| Texto para fala (TTS) | `tts`           | ElevenLabs, Microsoft, MiniMax, OpenAI                                                       | Converte respostas de saída em áudio falado             |
| Compreensão de mídia | (automático)    | Qualquer provedor de modelo com recursos de visão/áudio, além de fallbacks da CLI            | Resume imagens, áudio e vídeo recebidos                 |

## Matriz de recursos por provedor

Esta tabela mostra quais provedores oferecem suporte a quais recursos de mídia na plataforma.

| Provider   | Imagem | Vídeo | Música | TTS | STT / Transcrição | Compreensão de Mídia |
| ---------- | ------ | ----- | ------ | --- | ----------------- | -------------------- |
| Alibaba    |        | Sim   |        |     |                   |                      |
| BytePlus   |        | Sim   |        |     |                   |                      |
| ComfyUI    | Sim    | Sim   | Sim    |     |                   |                      |
| Deepgram   |        |       |        |     | Sim               |                      |
| ElevenLabs |        |       |        | Sim |                   |                      |
| fal        | Sim    | Sim   |        |     |                   |                      |
| Google     | Sim    | Sim   | Sim    |     |                   | Sim                  |
| Microsoft  |        |       |        | Sim |                   |                      |
| MiniMax    | Sim    | Sim   | Sim    | Sim |                   |                      |
| OpenAI     | Sim    | Sim   |        | Sim | Sim               | Sim                  |
| Qwen       |        | Sim   |        |     |                   |                      |
| Runway     |        | Sim   |        |     |                   |                      |
| Together   |        | Sim   |        |     |                   |                      |
| Vydra      | Sim    | Sim   |        |     |                   |                      |
| xAI        |        | Sim   |        |     |                   |                      |

<Note>
A compreensão de mídia usa qualquer modelo com recursos de visão ou áudio registrado na sua configuração de provedor. A tabela acima destaca provedores com suporte dedicado à compreensão de mídia; a maioria dos provedores de LLM com modelos multimodais (Anthropic, Google, OpenAI etc.) também pode compreender mídia recebida quando configurada como o modelo ativo de resposta.
</Note>

## Como a geração assíncrona funciona

A geração de vídeo e música é executada como tarefas em segundo plano porque o processamento do provedor normalmente leva de 30 segundos a vários minutos. Quando o agente chama `video_generate` ou `music_generate`, o OpenClaw envia a solicitação ao provedor, retorna imediatamente um ID de tarefa e rastreia o trabalho no task ledger. O agente continua respondendo a outras mensagens enquanto o trabalho é executado. Quando o provedor conclui, o OpenClaw reativa o agente para que ele possa publicar a mídia concluída de volta no canal original. A geração de imagem e o TTS são síncronos e são concluídos em linha com a resposta.

## Links rápidos

- [Image Generation](/pt-BR/tools/image-generation) -- geração e edição de imagens
- [Video Generation](/pt-BR/tools/video-generation) -- texto para vídeo, imagem para vídeo e vídeo para vídeo
- [Music Generation](/pt-BR/tools/music-generation) -- criação de música e faixas de áudio
- [Text-to-Speech](/pt-BR/tools/tts) -- conversão de respostas em áudio falado
- [Media Understanding](/pt-BR/nodes/media-understanding) -- compreensão de imagens, áudio e vídeo recebidos
