---
read_when:
    - Escolhendo um caminho de onboarding
    - Configurando um novo ambiente
sidebarTitle: Onboarding Overview
summary: Visão geral das opções e fluxos de onboarding do OpenClaw
title: Visão geral do onboarding
x-i18n:
    generated_at: "2026-04-24T06:13:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

O OpenClaw tem dois caminhos de onboarding. Ambos configuram autenticação, o Gateway e
canais de chat opcionais — eles apenas diferem na forma como você interage com a configuração.

## Qual caminho devo usar?

|                | Onboarding pela CLI                    | Onboarding pelo app macOS |
| -------------- | -------------------------------------- | ------------------------- |
| **Plataformas** | macOS, Linux, Windows (nativo ou WSL2) | apenas macOS              |
| **Interface**  | Assistente no terminal                 | UI guiada no app          |
| **Melhor para** | Servidores, headless, controle total  | Mac desktop, configuração visual |
| **Automação**  | `--non-interactive` para scripts       | apenas manual             |
| **Comando**    | `openclaw onboard`                     | Iniciar o app             |

A maioria dos usuários deve começar com o **onboarding pela CLI** — ele funciona em qualquer lugar e oferece
mais controle.

## O que o onboarding configura

Independentemente do caminho escolhido, o onboarding configura:

1. **Provedor de modelo e auth** — chave de API, OAuth ou token de setup para o provedor escolhido
2. **Workspace** — diretório para arquivos do agente, templates de bootstrap e memória
3. **Gateway** — porta, endereço de bind, modo de autenticação
4. **Canais** (opcional) — canais de chat integrados e incluídos, como
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp e mais
5. **Daemon** (opcional) — serviço em segundo plano para que o Gateway inicie automaticamente

## Onboarding pela CLI

Execute em qualquer terminal:

```bash
openclaw onboard
```

Adicione `--install-daemon` para também instalar o serviço em segundo plano em uma única etapa.

Referência completa: [Onboarding (CLI)](/pt-BR/start/wizard)
Documentação do comando da CLI: [`openclaw onboard`](/pt-BR/cli/onboard)

## Onboarding pelo app macOS

Abra o app OpenClaw. O assistente de primeira execução orienta você pelas mesmas etapas
com uma interface visual.

Referência completa: [Onboarding (App macOS)](/pt-BR/start/onboarding)

## Provedores personalizados ou não listados

Se o seu provedor não estiver listado no onboarding, escolha **Custom Provider** e
informe:

- modo de compatibilidade da API (compatível com OpenAI, compatível com Anthropic ou detecção automática)
- Base URL e chave de API
- ID do modelo e alias opcional

Vários endpoints personalizados podem coexistir — cada um recebe seu próprio endpoint ID.

## Relacionado

- [Primeiros passos](/pt-BR/start/getting-started)
- [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference)
