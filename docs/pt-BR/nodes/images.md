---
read_when:
    - Modificando o pipeline de mídia ou anexos
summary: Regras de tratamento de imagens e mídia para envio, Gateway e respostas de agentes
title: Suporte a imagens e mídia
x-i18n:
    generated_at: "2026-05-06T06:01:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# Suporte a imagens e mídia (2025-12-05)

O canal WhatsApp é executado via **Baileys Web**. Este documento registra as regras atuais de tratamento de mídia para envios, Gateway e respostas de agentes.

## Objetivos

- Enviar mídia com legendas opcionais via `openclaw message send --media`.
- Permitir que respostas automáticas da caixa de entrada web incluam mídia junto com texto.
- Manter limites por tipo sensatos e previsíveis.

## Interface da CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` é opcional; a legenda pode ficar vazia para envios apenas com mídia.
  - `--dry-run` imprime a carga resolvida; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento do canal WhatsApp Web

- Entrada: caminho de arquivo local **ou** URL HTTP(S).
- Fluxo: carregar em um Buffer, detectar o tipo de mídia e montar a carga correta:
  - **Imagens:** redimensionar e recomprimir para JPEG (lado máximo de 2048 px), mirando `channels.whatsapp.mediaMaxMb` (padrão: 50 MB).
  - **Áudio/Voz/Vídeo:** passagem direta até 16 MB; o áudio é enviado como nota de voz (`ptt: true`).
  - **Documentos:** qualquer outra coisa, até 100 MB, com o nome do arquivo preservado quando disponível.
- Reprodução ao estilo GIF no WhatsApp: envie um MP4 com `gifPlayback: true` (CLI: `--gif-playback`) para que clientes móveis reproduzam em loop em linha.
- A detecção de MIME prefere bytes mágicos, depois cabeçalhos e depois extensão de arquivo.
- A legenda vem de `--message` ou `reply.text`; legenda vazia é permitida.
- Registro: o modo não detalhado mostra `↩️`/`✅`; o modo detalhado inclui tamanho e caminho/URL de origem.

## Pipeline de resposta automática

- `getReplyFromConfig` retorna `{ text?, mediaUrl?, mediaUrls? }`.
- Quando há mídia, o remetente web resolve caminhos locais ou URLs usando o mesmo pipeline de `openclaw message send`.
- Várias entradas de mídia são enviadas sequencialmente, se fornecidas.

## Mídia recebida para comandos (Pi)

- Quando mensagens web recebidas incluem mídia, o OpenClaw baixa para um arquivo temporário e expõe variáveis de modelo:
  - Pseudo-URL `{{MediaUrl}}` para a mídia recebida.
  - Caminho temporário local `{{MediaPath}}` gravado antes de executar o comando.
- Quando um sandbox Docker por sessão está ativado, a mídia recebida é copiada para o workspace do sandbox e `MediaPath`/`MediaUrl` são reescritos para um caminho relativo como `media/inbound/<filename>`.
- O entendimento de mídia (se configurado via `tools.media.*` ou `tools.media.models` compartilhado) é executado antes da aplicação do modelo e pode inserir blocos `[Image]`, `[Audio]` e `[Video]` em `Body`.
  - Áudio define `{{Transcript}}` e usa a transcrição para análise de comandos, para que comandos com barra ainda funcionem.
  - Descrições de vídeo e imagem preservam qualquer texto de legenda para análise de comandos.
  - Se o modelo de imagem primário ativo já for compatível nativamente com visão, o OpenClaw ignora o bloco de resumo `[Image]` e passa a imagem original para o modelo.
- Por padrão, apenas o primeiro anexo correspondente de imagem/áudio/vídeo é processado; defina `tools.media.<cap>.attachments` para processar vários anexos.

## Limites e erros

**Limites de envio de saída (envio pelo WhatsApp web)**

- Imagens: até `channels.whatsapp.mediaMaxMb` (padrão: 50 MB) após recompressão.
- Áudio/voz/vídeo: limite de 16 MB; documentos: limite de 100 MB.
- Mídia grande demais ou ilegível → erro claro nos registros e a resposta é ignorada.

**Limites de entendimento de mídia (transcrição/descrição)**

- Padrão para imagem: 10 MB (`tools.media.image.maxBytes`).
- Padrão para áudio: 20 MB (`tools.media.audio.maxBytes`).
- Padrão para vídeo: 50 MB (`tools.media.video.maxBytes`).
- Mídia grande demais ignora o entendimento, mas as respostas ainda seguem com o corpo original.

## Notas para testes

- Cobrir fluxos de envio e resposta para casos de imagem/áudio/documento.
- Validar a recompressão de imagens (limite de tamanho) e o sinalizador de nota de voz para áudio.
- Garantir que respostas com várias mídias sejam distribuídas como envios sequenciais.

## Relacionado

- [Captura de câmera](/pt-BR/nodes/camera)
- [Entendimento de mídia](/pt-BR/nodes/media-understanding)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
