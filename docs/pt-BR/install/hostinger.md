---
read_when:
    - Configurando o OpenClaw na Hostinger
    - Procurando um VPS gerenciado para o OpenClaw
    - Usando OpenClaw 1-Click da Hostinger
summary: Hospedar o OpenClaw na Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T14:03:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

Execute um Gateway persistente do OpenClaw na [Hostinger](https://www.hostinger.com/openclaw) por meio de uma implantação gerenciada **1-Click** ou de uma instalação em **VPS**.

## Pré-requisitos

- Conta na Hostinger ([cadastro](https://www.hostinger.com/openclaw))
- Cerca de 5 a 10 minutos

## Opção A: OpenClaw 1-Click

A forma mais rápida de começar. A Hostinger cuida da infraestrutura, do Docker e das atualizações automáticas.

<Steps>
  <Step title="Comprar e iniciar">
    1. Na [página do OpenClaw na Hostinger](https://www.hostinger.com/openclaw), escolha um plano Managed OpenClaw e conclua a compra.

    <Note>
    Durante a compra, você pode selecionar créditos de **Ready-to-Use AI** que são pré-comprados e integrados instantaneamente dentro do OpenClaw — sem necessidade de contas externas nem chaves de API de outros provedores. Você pode começar a conversar imediatamente. Como alternativa, forneça sua própria chave da Anthropic, OpenAI, Google Gemini ou xAI durante a configuração.
    </Note>

  </Step>

  <Step title="Selecionar um canal de mensagens">
    Escolha um ou mais canais para conectar:

    - **WhatsApp** — escaneie o código QR mostrado no assistente de configuração.
    - **Telegram** — cole o token do bot do [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Concluir a instalação">
    Clique em **Finish** para implantar a instância. Quando estiver pronta, acesse o painel do OpenClaw em **OpenClaw Overview** no hPanel.
  </Step>

</Steps>

## Opção B: OpenClaw em VPS

Mais controle sobre o seu servidor. A Hostinger implanta o OpenClaw via Docker no seu VPS, e você o gerencia pelo **Docker Manager** no hPanel.

<Steps>
  <Step title="Comprar um VPS">
    1. Na [página do OpenClaw na Hostinger](https://www.hostinger.com/openclaw), escolha um plano OpenClaw on VPS e conclua a compra.

    <Note>
    Você pode selecionar créditos de **Ready-to-Use AI** durante a compra — eles são pré-comprados e integrados instantaneamente dentro do OpenClaw, para que você possa começar a conversar sem nenhuma conta externa nem chaves de API de outros provedores.
    </Note>

  </Step>

  <Step title="Configurar o OpenClaw">
    Quando o VPS for provisionado, preencha os campos de configuração:

    - **Gateway token** — gerado automaticamente; salve-o para uso posterior.
    - **Número do WhatsApp** — seu número com código do país (opcional).
    - **Token do bot do Telegram** — do [BotFather](https://t.me/BotFather) (opcional).
    - **Chaves de API** — necessárias apenas se você não selecionou créditos de Ready-to-Use AI durante a compra.

  </Step>

  <Step title="Iniciar o OpenClaw">
    Clique em **Deploy**. Quando estiver em execução, abra o painel do OpenClaw no hPanel clicando em **Open**.
  </Step>

</Steps>

Logs, reinicializações e atualizações são gerenciados diretamente pela interface do Docker Manager no hPanel. Para atualizar, pressione **Update** no Docker Manager, e isso fará o pull da imagem mais recente.

## Verifique sua configuração

Envie "Hi" para o seu assistente no canal que você conectou. O OpenClaw responderá e guiará você pelas preferências iniciais.

## Solução de problemas

**Painel não carrega** — Aguarde alguns minutos para o contêiner concluir o provisionamento. Verifique os logs do Docker Manager no hPanel.

**O contêiner do Docker continua reiniciando** — Abra os logs do Docker Manager e procure erros de configuração (tokens ausentes, chaves de API inválidas).

**O bot do Telegram não responde** — Envie sua mensagem com o código de pareamento pelo Telegram diretamente como uma mensagem dentro do seu chat do OpenClaw para concluir a conexão.

## Próximos passos

- [Canais](/pt-BR/channels) — conecte Telegram, WhatsApp, Discord e mais
- [Configuração do Gateway](/pt-BR/gateway/configuration) — todas as opções de configuração
