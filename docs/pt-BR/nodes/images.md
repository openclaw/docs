---
read_when:
    - Modificando pipeline de mídia ou anexos
summary: Regras de tratamento de imagens e mídia para envio, gateway e respostas de agentes
title: Suporte a imagens e mídia
x-i18n:
    generated_at: "2026-06-27T17:40:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeee181cae2798b7d0f5dbe0331c6b09612755b4d796d98baaeaf6989955def5
    source_path: nodes/images.md
    workflow: 16
---

O canal WhatsApp é executado via **Baileys Web**. Este documento registra as regras atuais de tratamento de mídia para envios, Gateway e respostas de agentes.

## Objetivos

- Enviar mídia com legendas opcionais via `openclaw message send --media`.
- Permitir que respostas automáticas da caixa de entrada web incluam mídia junto com texto.
- Manter limites por tipo sensatos e previsíveis.

## Superfície da CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` é opcional; a legenda pode ficar vazia para envios somente com mídia.
  - `--dry-run` imprime o payload resolvido; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento do canal WhatsApp Web

- Entrada: caminho de arquivo local **ou** URL HTTP(S).
- Fluxo: carregar em um Buffer, detectar o tipo de mídia e montar o payload correto:
  - **Imagens:** redimensionar e recomprimir para JPEG (lado máximo de 2048px), mirando `channels.whatsapp.mediaMaxMb` (padrão: 50 MB).
  - **Áudio/Voz/Vídeo:** passagem direta até 16 MB; áudio é enviado como nota de voz (`ptt: true`).
  - **Documentos:** qualquer outra coisa, até 100 MB, com o nome de arquivo preservado quando disponível.
- Reprodução estilo GIF do WhatsApp: envie um MP4 com `gifPlayback: true` (CLI: `--gif-playback`) para que clientes móveis reproduzam em loop inline.
- A detecção de MIME prioriza bytes mágicos, depois cabeçalhos e depois a extensão do arquivo.
- A legenda vem de `--message` ou `reply.text`; legenda vazia é permitida.
- Logs: modo não detalhado mostra `↩️`/`✅`; modo detalhado inclui tamanho e caminho/URL de origem.

## Pipeline de resposta automática

- `getReplyFromConfig` retorna `{ text?, mediaUrl?, mediaUrls? }`.
- Quando há mídia presente, o remetente web resolve caminhos locais ou URLs usando o mesmo pipeline de `openclaw message send`.
- Várias entradas de mídia são enviadas sequencialmente se fornecidas.

## Mídia de entrada para comandos

- Quando mensagens web de entrada incluem mídia, o OpenClaw baixa para um arquivo temporário e expõe variáveis de templating:
  - `{{MediaUrl}}` pseudo-URL para a mídia de entrada.
  - `{{MediaPath}}` caminho temporário local gravado antes de executar o comando.
- Quando um sandbox Docker por sessão está habilitado, a mídia de entrada é copiada para o workspace do sandbox e `MediaPath`/`MediaUrl` são reescritos para um caminho relativo como `media/inbound/<filename>`.
- O entendimento de mídia (se configurado via `tools.media.*` ou `tools.media.models` compartilhado) é executado antes do templating e pode inserir blocos `[Image]`, `[Audio]` e `[Video]` em `Body`.
  - Áudio define `{{Transcript}}` e usa a transcrição para análise de comandos, para que comandos de barra ainda funcionem.
  - Descrições de vídeo e imagem preservam qualquer texto de legenda para análise de comandos.
  - Se o modelo de imagem primário ativo já oferecer suporte nativo a visão, o OpenClaw pula o bloco de resumo `[Image]` e passa a imagem original ao modelo.
- Por padrão, somente o primeiro anexo correspondente de imagem/áudio/vídeo é processado; defina `tools.media.<cap>.attachments` para processar vários anexos.

## Limites e erros

**Limites de envio de saída (envio pelo WhatsApp web)**

- Imagens: até `channels.whatsapp.mediaMaxMb` (padrão: 50 MB) após recompressão.
- Áudio/voz/vídeo: limite de 16 MB; documentos: limite de 100 MB.
- Mídia grande demais ou ilegível → erro claro nos logs e a resposta é ignorada.

**Limites de entendimento de mídia (transcrição/descrição)**

- Padrão de imagem: 10 MB (`tools.media.image.maxBytes`).
- Padrão de áudio: 20 MB (`tools.media.audio.maxBytes`).
- Padrão de vídeo: 50 MB (`tools.media.video.maxBytes`).
- Mídia grande demais pula o entendimento, mas as respostas ainda seguem com o corpo original.

## Observações para testes

- Cubra fluxos de envio + resposta para casos de imagem/áudio/documento.
- Valide a recompressão de imagens (limite de tamanho) e a flag de nota de voz para áudio.
- Garanta que respostas com várias mídias se desdobrem em envios sequenciais.

## Relacionados

- [Captura de câmera](/pt-BR/nodes/camera)
- [Entendimento de mídia](/pt-BR/nodes/media-understanding)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
