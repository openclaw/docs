---
read_when:
    - Modificação do pipeline de mídia ou dos anexos
summary: Regras de processamento de imagens e mídia para envios, Gateway e respostas de agentes
title: Suporte a imagens e mídia
x-i18n:
    generated_at: "2026-07-12T00:04:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

O canal do WhatsApp é executado no Baileys Web. Esta página aborda as regras de processamento de mídia para envios, o Gateway e as respostas do agente.

## Objetivos

- Enviar mídia com uma legenda opcional por meio de `openclaw message send --media`.
- Permitir que respostas automáticas da caixa de entrada da web incluam mídia junto com texto.
- Manter limites adequados e previsíveis para cada tipo.

## Interface da CLI

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — anexa mídia (imagem/áudio/vídeo/documento); aceita caminhos locais ou URLs. Opcional; a legenda pode estar vazia para envios somente de mídia.
- `--gif-playback` — trata a mídia de vídeo como reprodução de GIF (somente WhatsApp).
- `--force-document` — envia a mídia como documento para evitar a compactação do canal (Telegram, WhatsApp); aplica-se a imagens, GIFs e vídeos.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — opções de entrega e encadeamento compartilhadas com envios somente de texto.
- `--dry-run` — exibe a carga útil resolvida e não realiza o envio.
- `--json` — exibe o resultado como JSON: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` contém o resultado de envio específico do canal, incluindo qualquer referência à mídia).

## Comportamento do canal WhatsApp Web

- Entrada: caminho de arquivo local **ou** URL HTTP(S).
- Fluxo: carrega em um buffer, detecta o tipo de mídia e cria a carga útil de saída correspondente:
  - **Imagens:** otimizadas para permanecer abaixo de `channels.whatsapp.mediaMaxMb` (padrão: 50 MB). Imagens opacas são recomprimidas como JPEG (a sequência padrão de dimensões começa em 2048 px e diminui após repetidas tentativas que excedem o tamanho); imagens com transparência são mantidas como PNG. Se a origem já for um JPEG/PNG/WebP aceitável dentro dos limites de tamanho e dimensão lateral, os bytes originais serão preservados sem alterações, em vez de serem recomprimidos. GIFs animados nunca são recodificados; apenas o tamanho é verificado.
  - **Áudio/voz:** a menos que já seja um áudio de voz nativo (`.ogg`/`.opus` ou `audio/ogg`/`audio/opus`), o áudio de saída é transcodificado pelo `ffmpeg` para Opus/OGG (48 kHz mono, 64 kbps, limitado a 20 minutos) antes de ser enviado como mensagem de voz (`ptt: true`).
  - **Vídeo:** encaminhado sem alterações até 16 MB.
  - **Documentos:** qualquer outro conteúdo, até 100 MB, preservando o nome do arquivo quando disponível.
- Reprodução no estilo GIF do WhatsApp: envia um MP4 com `gifPlayback: true` (CLI: `--gif-playback`) para que os clientes móveis o reproduzam continuamente em linha.
- A detecção de MIME prioriza os bytes mágicos identificados, depois a extensão do arquivo e, por fim, os cabeçalhos da resposta; um contêiner genérico identificado (`application/octet-stream`, `zip`) nunca substitui um mapeamento de extensão mais específico (por exemplo, XLSX em vez de ZIP).
- A legenda vem de `--message` ou `reply.text`; uma legenda vazia é permitida.
- Registro: o modo não detalhado exibe `↩️`/`✅`; o modo detalhado inclui o tamanho e o caminho/URL de origem.

<Note>
Os valores de 16 MB para áudio/vídeo e 100 MB para documentos indicados acima são os padrões de mídia compartilhados por tipo usados quando nenhum limite explícito de bytes é fornecido. Os envios do WhatsApp definem um limite explícito com base em `channels.whatsapp.mediaMaxMb` (padrão: 50 MB), aplicado uniformemente a todos os tipos dessa conta.
</Note>

## Pipeline de resposta automática

- `getReplyFromConfig` retorna uma carga útil de resposta (ou uma matriz de cargas úteis) com `text?`, `mediaUrl?` e `mediaUrls?`, entre outros campos.
- Quando há mídia, o remetente da web resolve caminhos locais ou URLs usando o mesmo pipeline de `openclaw message send`.
- Se várias entradas de mídia forem fornecidas, elas serão enviadas sequencialmente.

## Mídia recebida em comandos

- Quando mensagens recebidas pela web incluem mídia, o OpenClaw a baixa para um arquivo temporário e disponibiliza variáveis de modelo:
  - `{{MediaUrl}}` — pseudo-URL da mídia recebida.
  - `{{MediaPath}}` — caminho temporário local gravado antes da execução do comando.
- Quando uma sandbox do Docker por sessão está habilitada, a mídia recebida é copiada para o espaço de trabalho da sandbox, e `MediaPath`/`MediaUrl` são reescritos como um caminho relativo à sandbox, como `media/inbound/<filename>`.
- A compreensão de mídia (configurada por meio de `tools.media.*` ou do `tools.media.models` compartilhado) é executada antes da aplicação do modelo e pode inserir blocos `[Image]`, `[Audio]` e `[Video]` em `Body`.
  - Para áudio, define `{{Transcript}}` e usa a transcrição para analisar comandos, de modo que os comandos com barra continuem funcionando.
  - As descrições de vídeo e imagem preservam qualquer texto de legenda para a análise de comandos.
  - Se o modelo primário ativo já oferecer suporte nativo à visão, o OpenClaw ignora o bloco de resumo `[Image]` e envia a imagem original diretamente ao modelo.
- Por padrão, somente o primeiro anexo correspondente de imagem/áudio/vídeo é processado; defina `tools.media.<capability>.attachments` para processar vários anexos.

## Limites e erros

**Limites de envio de saída (envio pela web do WhatsApp)**

- Imagens: até `channels.whatsapp.mediaMaxMb` (padrão: 50 MB) após a otimização.
- Áudio/vídeo: limite de 16 MB (padrão compartilhado; substituído por `mediaMaxMb` ao enviar pelo WhatsApp).
- Documentos: limite de 100 MB (padrão compartilhado; substituído por `mediaMaxMb` ao enviar pelo WhatsApp).
- Mídias grandes demais ou ilegíveis produzem um erro claro nos registros, e a resposta não é enviada.

**Limites da compreensão de mídia (transcrição/descrição)**

- Padrão para imagens: 10 MB (`tools.media.image.maxBytes`).
- Padrão para áudio: 20 MB (`tools.media.audio.maxBytes`).
- Padrão para vídeo: 50 MB (`tools.media.video.maxBytes`).
- Mídias grandes demais não passam pela compreensão, mas a resposta ainda é processada com o corpo original.

## Observações para testes

- Abranja os fluxos de envio e resposta para casos de imagem, áudio e documento.
- Valide os limites de tamanho após a otimização de imagens e o sinalizador de mensagem de voz para áudio.
- Garanta que respostas com várias mídias sejam distribuídas como envios sequenciais.

## Conteúdo relacionado

- [Captura da câmera](/pt-BR/nodes/camera)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Áudio e mensagens de voz](/pt-BR/nodes/audio)
