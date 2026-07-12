---
read_when:
    - Depuração dos indicadores de integridade do aplicativo para Mac
summary: Como o aplicativo para macOS informa os estados de integridade do Gateway e dos canais
title: Verificações de integridade (macOS)
x-i18n:
    generated_at: "2026-07-12T00:05:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Verificações de integridade no macOS

Como consultar o estado de integridade dos canais vinculados pelo aplicativo da barra de menus.

## Barra de menus

Indicador de status:

- Verde: vinculado + verificação íntegra.
- Laranja: vinculado, mas a verificação de um canal indica estado degradado/não conectado.
- Vermelho: ainda não vinculado.

A linha secundária exibe "vinculado · autenticação há 12 min" ou mostra o motivo da falha.
"Run Health Check Now" no menu inicia uma verificação sob demanda.

## Configurações

- A guia Geral exibe um cartão de integridade: indicador de status, linha de resumo (estado do vínculo +
  tempo desde a autenticação) e uma linha opcional com detalhes da falha, além dos botões **Tentar novamente agora** e
  **Abrir logs**.
- A **guia Canais** exibe o status e os controles de cada canal (QR de login,
  logout, verificação, última desconexão/último erro) para WhatsApp e Telegram.

## Como a verificação funciona

O aplicativo chama o RPC `health` do Gateway pela conexão WebSocket
existente (sem invocar um shell da CLI) aproximadamente a cada 60 segundos e sob demanda. O RPC carrega
as credenciais e informa o status sem enviar mensagens. O aplicativo armazena em cache separadamente o último
instantâneo válido e o último erro, para que a interface carregue instantaneamente e
não fique oscilando enquanto estiver offline.

## Em caso de dúvida

Use o fluxo da CLI em [Integridade do Gateway](/pt-BR/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) e acompanhe
`/tmp/openclaw/openclaw-*.log`, filtrando por `web-heartbeat` / `web-reconnect`.

## Relacionados

- [Integridade do Gateway](/pt-BR/gateway/health)
- [Aplicativo para macOS](/pt-BR/platforms/macos)
