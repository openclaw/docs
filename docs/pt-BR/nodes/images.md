---
read_when:
    - Modificação do pipeline de mídia ou dos anexos
summary: Regras de tratamento de imagens e mídias para envios, Gateway e respostas de agentes
title: Suporte a imagens e mídia
x-i18n:
    generated_at: "2026-07-12T15:23:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

O canal do WhatsApp é executado no Baileys Web. Esta página aborda as regras de processamento de mídia para envios, Gateway e respostas do agente.

## Objetivos

- Enviar mídia com uma legenda opcional por meio de `openclaw message send --media`.
- Permitir que respostas automáticas da caixa de entrada da Web incluam mídia junto com texto.
- Manter limites adequados e previsíveis para cada tipo.

## Interface da CLI

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — anexa mídia (imagem/áudio/vídeo/documento); aceita caminhos locais ou URLs. Opcional; a legenda pode ficar vazia para envios somente de mídia.
- `--gif-playback` — trata a mídia de vídeo como reprodução de GIF (somente WhatsApp).
- `--force-document` — envia a mídia como documento para evitar a compactação do canal (Telegram, WhatsApp); aplica-se a imagens, GIFs e vídeos.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — opções de entrega/encadeamento compartilhadas com envios somente de texto.
- `--dry-run` — exibe o payload resolvido e não realiza o envio.
- `--json` — exibe o resultado como JSON: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` contém o resultado de envio específico do canal, incluindo qualquer referência de mídia).

## Comportamento do canal WhatsApp Web

- Entrada: caminho de arquivo local **ou** URL HTTP(S).
- Fluxo: carrega em um buffer, detecta o tipo de mídia e, em seguida, cria o payload de saída de acordo com o tipo:
  - **Imagens:** otimizadas para ficar abaixo de `channels.whatsapp.mediaMaxMb` (padrão de 50MB). Imagens opacas são recomprimidas como JPEG (a sequência padrão de dimensões começa em 2048px e diminui após cada tentativa que excede o tamanho); imagens com transparência são mantidas como PNG. Se a origem já for um JPEG/PNG/WebP aceitável dentro dos limites de tamanho e dimensão lateral, os bytes originais serão preservados sem alterações, em vez de serem recomprimidos. GIFs animados nunca são recodificados, apenas têm o tamanho verificado.
  - **Áudio/voz:** a menos que já seja áudio de voz nativo (`.ogg`/`.opus` ou `audio/ogg`/`audio/opus`), o áudio de saída é transcodificado pelo `ffmpeg` para Opus/OGG (48kHz mono, 64kbps, limitado a 20 minutos) antes de ser enviado como mensagem de voz (`ptt: true`).
  - **Vídeo:** repassado sem alterações até 16MB.
  - **Documentos:** qualquer outro conteúdo, até 100MB, com o nome do arquivo preservado quando disponível.
- Reprodução no estilo GIF do WhatsApp: envia um MP4 com `gifPlayback: true` (CLI: `--gif-playback`) para que os clientes móveis o reproduzam continuamente em linha.
- A detecção de MIME prioriza os bytes mágicos identificados, depois a extensão do arquivo e, por fim, os cabeçalhos da resposta; um contêiner genérico identificado (`application/octet-stream`, `zip`) nunca substitui um mapeamento de extensão mais específico (por exemplo, XLSX em vez de ZIP).
- A legenda vem de `--message` ou `reply.text`; uma legenda vazia é permitida.
- Registro: o modo não detalhado mostra `↩️`/`✅`; o modo detalhado inclui o tamanho e o caminho/URL de origem.

<Note>
Os valores de 16MB para áudio/vídeo e 100MB para documentos indicados acima são os padrões de mídia compartilhados por tipo usados quando nenhum limite explícito de bytes é fornecido. Os envios do WhatsApp definem um limite explícito por meio de `channels.whatsapp.mediaMaxMb` (padrão de 50MB), aplicado uniformemente a todos os tipos nessa conta.
</Note>

## Pipeline de resposta automática

- `getReplyFromConfig` retorna um payload de resposta (ou uma matriz de payloads) com `text?`, `mediaUrl?` e `mediaUrls?`, entre outros campos.
- Quando há mídia, o remetente da Web resolve caminhos locais ou URLs usando o mesmo pipeline que `openclaw message send`.
- Se forem fornecidas várias entradas de mídia, elas serão enviadas sequencialmente.

## Mídia recebida para comandos

- Quando mensagens recebidas da Web incluem mídia, o OpenClaw a baixa para um arquivo temporário e disponibiliza variáveis de modelo:
  - `{{MediaUrl}}` — pseudo-URL da mídia recebida.
  - `{{MediaPath}}` — caminho temporário local gravado antes da execução do comando.
- Quando um sandbox do Docker por sessão está ativado, a mídia recebida é copiada para o espaço de trabalho do sandbox, e `MediaPath`/`MediaUrl` são reescritos como um caminho relativo ao sandbox, como `media/inbound/<filename>`.
- A compreensão de mídia (configurada por meio de `tools.media.*` ou do `tools.media.models` compartilhado) é executada antes da aplicação do modelo e pode inserir blocos `[Image]`, `[Audio]` e `[Video]` em `Body`.
  - O áudio define `{{Transcript}}` e usa a transcrição para analisar comandos, garantindo que os comandos de barra continuem funcionando.
  - As descrições de vídeos e imagens preservam qualquer texto de legenda para a análise de comandos.
  - Se o modelo primário ativo já for compatível nativamente com visão, o OpenClaw ignora o bloco de resumo `[Image]` e, em vez disso, passa a imagem original ao modelo.
- Por padrão, somente o primeiro anexo correspondente de imagem/áudio/vídeo é processado; defina `tools.media.<capability>.attachments` para processar vários anexos.

## Limites e erros

**Limites de envio de saída (envio pela Web do WhatsApp)**

- Imagens: até `channels.whatsapp.mediaMaxMb` (padrão de 50MB) após a otimização.
- Áudio/vídeo: limite de 16MB (padrão compartilhado; substituído por `mediaMaxMb` ao enviar pelo WhatsApp).
- Documentos: limite de 100MB (padrão compartilhado; substituído por `mediaMaxMb` ao enviar pelo WhatsApp).
- Mídias grandes demais ou ilegíveis geram um erro claro nos registros, e a resposta é ignorada.

**Limites da compreensão de mídia (transcrição/descrição)**

- Padrão para imagens: 10MB (`tools.media.image.maxBytes`).
- Padrão para áudio: 20MB (`tools.media.audio.maxBytes`).
- Padrão para vídeo: 50MB (`tools.media.video.maxBytes`).
- Mídias grandes demais não passam pela compreensão, mas a resposta ainda é processada com o corpo original.

## Observações para testes

- Abranja os fluxos de envio e resposta para casos de imagem/áudio/documento.
- Valide os limites de tamanho após a otimização de imagens e o sinalizador de mensagem de voz para áudio.
- Garanta que respostas com várias mídias sejam distribuídas como envios sequenciais.

## Conteúdo relacionado

- [Captura da câmera](/pt-BR/nodes/camera)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Áudio e mensagens de voz](/pt-BR/nodes/audio)
