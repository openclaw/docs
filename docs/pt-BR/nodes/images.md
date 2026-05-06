---
read_when:
    - Modificando o pipeline de mídia ou os anexos
summary: Regras de tratamento de imagens e mídia para envio, Gateway e respostas de agentes
title: Suporte a imagens e mídia
x-i18n:
    generated_at: "2026-05-06T17:58:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 069140a3ad3bade166d4576ead604b4675006a01e546672872379ce83291471c
    source_path: nodes/images.md
    workflow: 16
---

O canal WhatsApp roda via **Baileys Web**. Este documento registra as regras atuais de manuseio de mídia para envios, Gateway e respostas do agente.

## Objetivos

- Enviar mídia com legendas opcionais via `openclaw message send --media`.
- Permitir que respostas automáticas da caixa de entrada web incluam mídia junto com texto.
- Manter os limites por tipo razoáveis e previsíveis.

## Superfície da CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` opcional; a legenda pode ficar vazia para envios somente com mídia.
  - `--dry-run` imprime o payload resolvido; `--json` emite `{ channel, to, messageId, mediaUrl, caption }`.

## Comportamento do canal WhatsApp Web

- Entrada: caminho de arquivo local **ou** URL HTTP(S).
- Fluxo: carregar em um Buffer, detectar o tipo de mídia e montar o payload correto:
  - **Imagens:** redimensionar e recomprimir para JPEG (lado máximo de 2048px) visando `channels.whatsapp.mediaMaxMb` (padrão: 50 MB).
  - **Áudio/Voz/Vídeo:** passagem direta até 16 MB; áudio é enviado como nota de voz (`ptt: true`).
  - **Documentos:** qualquer outra coisa, até 100 MB, com nome de arquivo preservado quando disponível.
- Reprodução em estilo GIF no WhatsApp: envie um MP4 com `gifPlayback: true` (CLI: `--gif-playback`) para que clientes móveis reproduzam em loop embutido.
- A detecção de MIME prefere bytes mágicos, depois cabeçalhos, depois extensão de arquivo.
- A legenda vem de `--message` ou `reply.text`; legenda vazia é permitida.
- Logs: modo não verboso mostra `↩️`/`✅`; modo verboso inclui tamanho e caminho/URL de origem.

## Pipeline de resposta automática

- `getReplyFromConfig` retorna `{ text?, mediaUrl?, mediaUrls? }`.
- Quando há mídia, o remetente web resolve caminhos locais ou URLs usando o mesmo pipeline de `openclaw message send`.
- Várias entradas de mídia são enviadas sequencialmente quando fornecidas.

## Mídia recebida para comandos (Pi)

- Quando mensagens web recebidas incluem mídia, o OpenClaw baixa para um arquivo temporário e expõe variáveis de template:
  - `{{MediaUrl}}` pseudo-URL para a mídia recebida.
  - `{{MediaPath}}` caminho temporário local gravado antes de executar o comando.
- Quando uma sandbox Docker por sessão está ativada, a mídia recebida é copiada para o workspace da sandbox e `MediaPath`/`MediaUrl` são reescritos para um caminho relativo como `media/inbound/<filename>`.
- A compreensão de mídia (se configurada via `tools.media.*` ou `tools.media.models` compartilhado) roda antes do template e pode inserir blocos `[Image]`, `[Audio]` e `[Video]` em `Body`.
  - Áudio define `{{Transcript}}` e usa a transcrição para análise de comandos, então comandos com barra ainda funcionam.
  - Descrições de vídeo e imagem preservam qualquer texto de legenda para análise de comandos.
  - Se o modelo de imagem primário ativo já oferece suporte nativo a visão, o OpenClaw ignora o bloco de resumo `[Image]` e passa a imagem original para o modelo em vez disso.
- Por padrão, apenas o primeiro anexo correspondente de imagem/áudio/vídeo é processado; defina `tools.media.<cap>.attachments` para processar vários anexos.

## Limites e erros

**Limites de envio de saída (envio pelo WhatsApp web)**

- Imagens: até `channels.whatsapp.mediaMaxMb` (padrão: 50 MB) após a recompressão.
- Áudio/voz/vídeo: limite de 16 MB; documentos: limite de 100 MB.
- Mídia grande demais ou ilegível → erro claro nos logs e a resposta é ignorada.

**Limites de compreensão de mídia (transcrição/descrição)**

- Imagem padrão: 10 MB (`tools.media.image.maxBytes`).
- Áudio padrão: 20 MB (`tools.media.audio.maxBytes`).
- Vídeo padrão: 50 MB (`tools.media.video.maxBytes`).
- Mídia grande demais ignora a compreensão, mas as respostas ainda seguem com o corpo original.

## Observações para testes

- Cobrir fluxos de envio e resposta para casos de imagem/áudio/documento.
- Validar recompressão para imagens (limite de tamanho) e flag de nota de voz para áudio.
- Garantir que respostas com várias mídias se desdobrem em envios sequenciais.

## Relacionado

- [Captura de câmera](/pt-BR/nodes/camera)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
