---
read_when:
    - Escolhendo um caminho de integração
    - Configurando um novo ambiente
sidebarTitle: Onboarding Overview
summary: Visão geral das opções e dos fluxos de integração do OpenClaw
title: Visão geral da integração
x-i18n:
    generated_at: "2026-05-10T19:50:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9b375b9090250992b9deead25ae6502592cb63c9774204782b2d4f69d8f3395
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw tem dois caminhos de configuração inicial. Ambos configuram autenticação, o Gateway e
canais de chat opcionais — eles diferem apenas na forma como você interage com a configuração.

## Qual caminho devo usar?

|                | Configuração inicial pela CLI                         | Configuração inicial pelo app macOS |
| -------------- | -------------------------------------- | ------------------------- |
| **Plataformas**  | macOS, Linux, Windows (nativo ou WSL2) | somente macOS                |
| **Interface**  | Assistente no terminal                        | UI guiada no app      |
| **Ideal para**   | Servidores, headless, controle total        | Mac desktop, configuração visual |
| **Automação** | `--non-interactive` para scripts        | Somente manual               |
| **Comando**    | `openclaw onboard`                     | Iniciar o app            |

A maioria dos usuários deve começar com a **configuração inicial pela CLI** — ela funciona em todos os lugares e dá
a você o máximo controle.

## O que a configuração inicial configura

Independentemente do caminho escolhido, a configuração inicial define:

1. **Provedor de modelo e autenticação** — chave de API, OAuth ou token de configuração para o provedor escolhido
2. **Workspace** — diretório para arquivos de agente, modelos de bootstrap e memória
3. **Gateway** — porta, endereço de bind, modo de autenticação
4. **Canais** (opcional) — canais de chat integrados e incluídos, como
   iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp e outros
5. **Serviço em segundo plano** (opcional) — serviço em segundo plano para que o Gateway seja iniciado automaticamente

## Configuração inicial pela CLI

Execute em qualquer terminal:

```bash
openclaw onboard
```

Adicione `--install-daemon` para também instalar o serviço em segundo plano em uma única etapa.

Referência completa: [Configuração inicial (CLI)](/pt-BR/start/wizard)
Documentação do comando CLI: [`openclaw onboard`](/pt-BR/cli/onboard)

## Configuração inicial pelo app macOS

Abra o app OpenClaw. O assistente de primeira execução orienta você pelas mesmas etapas
com uma interface visual.

Referência completa: [Configuração inicial (app macOS)](/pt-BR/start/onboarding)

## Provedores personalizados ou não listados

Se seu provedor não estiver listado na configuração inicial, escolha **Provedor personalizado** e
insira:

- Modo de compatibilidade de API (compatível com OpenAI, compatível com Anthropic ou detecção automática)
- URL base e chave de API
- ID do modelo e alias opcional

Vários endpoints personalizados podem coexistir — cada um recebe seu próprio ID de endpoint.

## Relacionado

- [Primeiros passos](/pt-BR/start/getting-started)
- [Referência de configuração pela CLI](/pt-BR/start/wizard-cli-reference)
