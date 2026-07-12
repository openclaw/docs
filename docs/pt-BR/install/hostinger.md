---
read_when:
    - Configurando o OpenClaw na Hostinger
    - Procurando um VPS gerenciado para o OpenClaw
    - Usando o OpenClaw com 1 clique da Hostinger
summary: Hospede o OpenClaw na Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T15:18:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Execute um Gateway persistente do OpenClaw na [Hostinger](https://www.hostinger.com/openclaw), seja como uma implantação gerenciada com **1-Click** ou como uma instalação em **VPS** administrada por você.

## Pré-requisitos

- Conta da Hostinger ([cadastro](https://www.hostinger.com/openclaw))
- Cerca de 5-10 minutos

## Opção A: OpenClaw com 1-Click

A Hostinger cuida da infraestrutura, do Docker e das atualizações automáticas. É o caminho mais rápido para obter uma instância em execução.

<Steps>
  <Step title="Comprar e iniciar">
    1. Na [página do OpenClaw da Hostinger](https://www.hostinger.com/openclaw), escolha um plano Managed OpenClaw e conclua a compra.

    <Note>
    Durante a compra, você pode selecionar créditos **Ready-to-Use AI**, que são pré-pagos e integrados instantaneamente ao OpenClaw — sem necessidade de contas externas ou chaves de API de outros provedores. Você pode começar a conversar imediatamente. Como alternativa, forneça sua própria chave da Anthropic, OpenAI, Google Gemini ou xAI durante a configuração.
    </Note>

  </Step>

  <Step title="Selecionar um canal de mensagens">
    Escolha um ou mais canais para conectar:

    - **WhatsApp** — escaneie o código QR exibido no assistente de configuração.
    - **Telegram** — cole o token do bot obtido no [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Concluir a instalação">
    Clique em **Finish** para implantar a instância. Quando estiver pronta, acesse o painel do OpenClaw em **OpenClaw Overview** no hPanel.
  </Step>

</Steps>

## Opção B: OpenClaw em VPS

Oferece mais controle sobre o servidor. A Hostinger implanta o OpenClaw via Docker em seu VPS; você o gerencia pelo **Docker Manager** no hPanel.

<Steps>
  <Step title="Comprar um VPS">
    1. Na [página do OpenClaw da Hostinger](https://www.hostinger.com/openclaw), escolha um plano OpenClaw on VPS e conclua a compra.

    <Note>
    Você pode selecionar créditos **Ready-to-Use AI** durante a compra — eles são pré-pagos e integrados instantaneamente ao OpenClaw, permitindo que você comece a conversar sem contas externas ou chaves de API de outros provedores.
    </Note>

  </Step>

  <Step title="Configurar o OpenClaw">
    Depois que o VPS for provisionado, preencha os campos de configuração:

    - **Gateway token** — gerado automaticamente; salve-o para uso posterior.
    - **WhatsApp number** — seu número com o código do país (opcional).
    - **Telegram bot token** — obtido no [BotFather](https://t.me/BotFather) (opcional).
    - **API keys** — necessárias somente se você não tiver selecionado créditos Ready-to-Use AI durante a compra.

  </Step>

  <Step title="Iniciar o OpenClaw">
    Clique em **Deploy**. Quando estiver em execução, abra o painel do OpenClaw no hPanel clicando em **Open**.
  </Step>

</Steps>

Logs, reinicializações e atualizações são gerenciados pela interface do Docker Manager no hPanel. Para atualizar, pressione **Update** no Docker Manager para obter a imagem mais recente.

## Verificar sua configuração

Envie "Olá" ao seu assistente no canal conectado. O OpenClaw responderá e orientará você na definição das preferências iniciais.

## Solução de problemas

**O painel não carrega** — Aguarde alguns minutos até que o provisionamento do contêiner seja concluído e verifique os logs do Docker Manager no hPanel.

**O contêiner Docker continua reiniciando** — Abra os logs do Docker Manager e procure erros de configuração (tokens ausentes ou chaves de API inválidas).

**O bot do Telegram não responde** — Se o pareamento por mensagem direta for necessário, um remetente desconhecido receberá um código curto de pareamento em vez de uma resposta. Aprove-o pelo chat do painel do OpenClaw ou com `openclaw pairing approve telegram <CODE>` se você tiver acesso ao shell do contêiner. Consulte [Pareamento](/pt-BR/channels/pairing).

## Próximas etapas

- [Canais](/pt-BR/channels) — conecte Telegram, WhatsApp, Discord e outros
- [Configuração do Gateway](/pt-BR/gateway/configuration) — todas as opções de configuração

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Hospedagem em VPS](/pt-BR/vps)
- [DigitalOcean](/pt-BR/install/digitalocean)
