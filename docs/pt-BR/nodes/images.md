---
read_when:
    - Modificando pipeline de mídia ou anexos
summary: Regras de tratamento de imagens e mídia para envio, Gateway e respostas de agentes
title: Suporte a imagens e mídia
x-i18n:
    generated_at: "2026-04-30T09:56:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb07bc638a755be5597e78c07041a52cfc0297b00d70c5adbfe5f3ad8c1a372
    source_path: nodes/images.md
    workflow: 16
---

# Suporte a imagens e mídia (2025-12-05)

O canal WhatsApp é executado via **Baileys Web**. Este documento registra as regras atuais de tratamento de mídia para envios, Gateway e respostas do agente.

## Objetivos

- Enviar mídia com legendas opcionais via `openclaw message send --media`.
- Permitir que respostas automáticas da caixa de entrada web incluam mídia junto com texto.
- Manter limites por tipo sensatos e previsíveis.

## Superfície da CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` opcional; a legenda pode ficar vazia para envios somente com mídia.
  - `--dry-run` imprime o payload resolvido; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento do canal WhatsApp Web

- Entrada: caminho de arquivo local **ou** URL HTTP(S).
- Fluxo: carregar em um Buffer, detectar o tipo de mídia e construir o payload correto:
  - **Imagens:** redimensionar e recomprimir para JPEG (lado máximo de 2048px) visando `channels.whatsapp.mediaMaxMb` (padrão: 50 MB).
  - **Áudio/Voz/Vídeo:** passagem direta até 16 MB; áudio é enviado como nota de voz (`ptt: true`).
  - **Documentos:** qualquer outra coisa, até 100 MB, com o nome do arquivo preservado quando disponível.
- Reprodução no estilo GIF do WhatsApp: envie um MP4 com `gifPlayback: true` (CLI: `--gif-playback`) para que clientes móveis reproduzam em loop inline.
- A detecção de MIME prefere bytes mágicos, depois cabeçalhos e, por fim, extensão do arquivo.
- A legenda vem de `--message` ou `reply.text`; legenda vazia é permitida.
- Registro: modo não detalhado mostra `↩️`/`✅`; modo detalhado inclui tamanho e caminho/URL de origem.

## Pipeline de resposta automática

- `getReplyFromConfig` retorna `{ text?, mediaUrl?, mediaUrls? }`.
- Quando há mídia, o remetente web resolve caminhos locais ou URLs usando o mesmo pipeline de `openclaw message send`.
- Várias entradas de mídia são enviadas sequencialmente quando fornecidas.

## Mídia recebida para comandos (Pi)

- Quando mensagens web recebidas incluem mídia, o OpenClaw baixa para um arquivo temporário e expõe variáveis de template:
  - `{{MediaUrl}}` pseudo-URL da mídia recebida.
  - `{{MediaPath}}` caminho temporário local escrito antes de executar o comando.
- Quando um sandbox Docker por sessão está habilitado, a mídia recebida é copiada para o workspace do sandbox, e `MediaPath`/`MediaUrl` são reescritos para um caminho relativo como `media/inbound/<filename>`.
- A compreensão de mídia (se configurada via `tools.media.*` ou `tools.media.models` compartilhado) é executada antes do template e pode inserir blocos `[Image]`, `[Audio]` e `[Video]` em `Body`.
  - Áudio define `{{Transcript}}` e usa a transcrição para análise de comandos, para que comandos de barra ainda funcionem.
  - Descrições de vídeo e imagem preservam qualquer texto de legenda para análise de comandos.
  - Se o modelo primário ativo de imagem já oferecer suporte nativo a visão, o OpenClaw ignora o bloco de resumo `[Image]` e passa a imagem original ao modelo em vez disso.
- Por padrão, apenas o primeiro anexo correspondente de imagem/áudio/vídeo é processado; defina `tools.media.<cap>.attachments` para processar vários anexos.

## Limites e erros

**Limites de envio de saída (envio via WhatsApp web)**

- Imagens: até `channels.whatsapp.mediaMaxMb` (padrão: 50 MB) após recompressão.
- Áudio/voz/vídeo: limite de 16 MB; documentos: limite de 100 MB.
- Mídia grande demais ou ilegível → erro claro nos registros, e a resposta é ignorada.

**Limites de compreensão de mídia (transcrição/descrição)**

- Padrão para imagem: 10 MB (`tools.media.image.maxBytes`).
- Padrão para áudio: 20 MB (`tools.media.audio.maxBytes`).
- Padrão para vídeo: 50 MB (`tools.media.video.maxBytes`).
- Mídia grande demais pula a compreensão, mas as respostas ainda seguem com o corpo original.

## Observações para testes

- Cobrir fluxos de envio + resposta para casos de imagem/áudio/documento.
- Validar recompressão para imagens (limite de tamanho) e flag de nota de voz para áudio.
- Garantir que respostas com várias mídias se desdobrem em envios sequenciais.

## Relacionados

- [Captura de câmera](/pt-BR/nodes/camera)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
