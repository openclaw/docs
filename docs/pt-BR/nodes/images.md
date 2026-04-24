---
read_when:
    - Alterando o pipeline de mídia ou anexos
summary: Regras de tratamento de imagem e mídia para envio, gateway e respostas do agente
title: Suporte a imagem e mídia
x-i18n:
    generated_at: "2026-04-24T05:59:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26fa460f7dcdac9f15c9d79c3c3370adbce526da5cfa9a6825a8ed20b41e0a29
    source_path: nodes/images.md
    workflow: 15
---

# Suporte a imagem e mídia (2025-12-05)

O canal web do WhatsApp é executado via **Baileys Web**. Este documento registra as regras atuais de tratamento de mídia para envio, gateway e respostas do agente.

## Objetivos

- Enviar mídia com legendas opcionais via `openclaw message send --media`.
- Permitir que respostas automáticas da caixa de entrada web incluam mídia junto com texto.
- Manter limites por tipo coerentes e previsíveis.

## Superfície da CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` é opcional; a legenda pode estar vazia para envios somente com mídia.
  - `--dry-run` imprime o payload resolvido; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento do canal web do WhatsApp

- Entrada: caminho de arquivo local **ou** URL HTTP(S).
- Fluxo: carregar em um Buffer, detectar o tipo de mídia e montar o payload correto:
  - **Imagens:** redimensionar e recomprimir para JPEG (lado máximo de 2048px) visando `channels.whatsapp.mediaMaxMb` (padrão: 50 MB).
  - **Áudio/Voz/Vídeo:** passagem direta até 16 MB; áudio é enviado como mensagem de voz (`ptt: true`).
  - **Documentos:** qualquer outra coisa, até 100 MB, com o nome do arquivo preservado quando disponível.
- Reprodução estilo GIF no WhatsApp: envie um MP4 com `gifPlayback: true` (CLI: `--gif-playback`) para que clientes móveis façam loop inline.
- A detecção de MIME prioriza magic bytes, depois cabeçalhos e depois extensão de arquivo.
- A legenda vem de `--message` ou `reply.text`; legenda vazia é permitida.
- Logging: no modo não verbose mostra `↩️`/`✅`; no modo verbose inclui tamanho e caminho/URL de origem.

## Pipeline de resposta automática

- `getReplyFromConfig` retorna `{ text?, mediaUrl?, mediaUrls? }`.
- Quando há mídia, o remetente web resolve caminhos locais ou URLs usando o mesmo pipeline de `openclaw message send`.
- Várias entradas de mídia são enviadas sequencialmente, se fornecidas.

## Mídia de entrada para comandos (Pi)

- Quando mensagens web de entrada incluem mídia, o OpenClaw faz download para um arquivo temporário e expõe variáveis de template:
  - `{{MediaUrl}}` pseudo-URL para a mídia de entrada.
  - `{{MediaPath}}` caminho local temporário gravado antes da execução do comando.
- Quando um sandbox Docker por sessão está habilitado, a mídia de entrada é copiada para o workspace do sandbox e `MediaPath`/`MediaUrl` são regravados para um caminho relativo como `media/inbound/<filename>`.
- Compreensão de mídia (se configurada via `tools.media.*` ou `tools.media.models` compartilhado) é executada antes do templating e pode inserir blocos `[Image]`, `[Audio]` e `[Video]` em `Body`.
  - Áudio define `{{Transcript}}` e usa a transcrição para parsing de comandos, para que comandos com barra continuem funcionando.
  - Descrições de vídeo e imagem preservam qualquer texto de legenda para parsing de comandos.
  - Se o modelo de imagem primário ativo já oferecer suporte nativo a visão, o OpenClaw ignora o bloco de resumo `[Image]` e passa a imagem original diretamente ao modelo.
- Por padrão, apenas o primeiro anexo correspondente de imagem/áudio/vídeo é processado; defina `tools.media.<cap>.attachments` para processar vários anexos.

## Limites e erros

**Limites de envio de saída (envio web do WhatsApp)**

- Imagens: até `channels.whatsapp.mediaMaxMb` (padrão: 50 MB) após recompressão.
- Áudio/voz/vídeo: limite de 16 MB; documentos: 100 MB.
- Mídia grande demais ou ilegível → erro claro nos logs e a resposta é ignorada.

**Limites de compreensão de mídia (transcrição/descrição)**

- Padrão de imagem: 10 MB (`tools.media.image.maxBytes`).
- Padrão de áudio: 20 MB (`tools.media.audio.maxBytes`).
- Padrão de vídeo: 50 MB (`tools.media.video.maxBytes`).
- Mídia acima do limite ignora a compreensão, mas as respostas ainda passam com o corpo original.

## Observações para testes

- Cubra fluxos de envio + resposta para casos de imagem/áudio/documento.
- Valide recompressão de imagens (limite de tamanho) e a flag de mensagem de voz para áudio.
- Garanta que respostas com várias mídias se espalhem em envios sequenciais.

## Relacionado

- [Captura de câmera](/pt-BR/nodes/camera)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Áudio e mensagens de voz](/pt-BR/nodes/audio)
