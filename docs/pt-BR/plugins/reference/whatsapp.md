---
read_when:
    - Você está instalando, configurando ou auditando o Plugin do WhatsApp
summary: Adiciona a superfície do canal WhatsApp para enviar e receber mensagens do OpenClaw.
title: Plugin do WhatsApp
x-i18n:
    generated_at: "2026-05-05T05:44:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# Plugin do WhatsApp

Adiciona a superfície de canal do WhatsApp para enviar e receber mensagens do OpenClaw.

## Distribuição

- Pacote: `@openclaw/whatsapp`
- Rota de instalação: npm; ClawHub

## Superfície

channels: whatsapp

## Observação de instalação no Windows

No Windows, o Plugin do WhatsApp precisa do Git no `PATH` durante a instalação via npm porque uma de suas dependências Baileys/libsignal é obtida de uma URL git. Instale o Git para Windows, reinicie o shell e execute novamente a instalação:

```powershell
winget install --id Git.Git -e
```

O Git portátil também funciona se seu diretório `bin` estiver no `PATH`.

## Documentação relacionada

- [whatsapp](/pt-BR/channels/whatsapp)
