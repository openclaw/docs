---
read_when:
    - Procurando suporte a SO ou caminhos de instalação
    - Decidindo onde executar o Gateway
summary: Visão geral do suporte a plataformas (Gateway + apps complementares)
title: Plataformas
x-i18n:
    generated_at: "2026-04-24T06:00:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

O núcleo do OpenClaw é escrito em TypeScript. **Node é o runtime recomendado**.
Bun não é recomendado para o Gateway — há problemas conhecidos com os canais WhatsApp e
Telegram; consulte [Bun (experimental)](/pt-BR/install/bun) para detalhes.

Existem apps complementares para macOS (app de barra de menu) e nodes móveis (iOS/Android). Apps complementares para Windows e
Linux estão planejados, mas o Gateway já tem suporte completo hoje.
Apps complementares nativos para Windows também estão planejados; o Gateway é recomendado via WSL2.

## Escolha seu SO

- macOS: [macOS](/pt-BR/platforms/macos)
- iOS: [iOS](/pt-BR/platforms/ios)
- Android: [Android](/pt-BR/platforms/android)
- Windows: [Windows](/pt-BR/platforms/windows)
- Linux: [Linux](/pt-BR/platforms/linux)

## VPS e hospedagem

- Hub de VPS: [Hospedagem VPS](/pt-BR/vps)
- Fly.io: [Fly.io](/pt-BR/install/fly)
- Hetzner (Docker): [Hetzner](/pt-BR/install/hetzner)
- GCP (Compute Engine): [GCP](/pt-BR/install/gcp)
- Azure (Linux VM): [Azure](/pt-BR/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/pt-BR/install/exe-dev)

## Links comuns

- Guia de instalação: [Primeiros passos](/pt-BR/start/getting-started)
- Runbook do Gateway: [Gateway](/pt-BR/gateway)
- Configuração do Gateway: [Configuração](/pt-BR/gateway/configuration)
- Status do serviço: `openclaw gateway status`

## Instalação do serviço do Gateway (CLI)

Use uma destas opções (todas compatíveis):

- Assistente (recomendado): `openclaw onboard --install-daemon`
- Direto: `openclaw gateway install`
- Fluxo de configuração: `openclaw configure` → selecione **Gateway service**
- Reparo/migração: `openclaw doctor` (oferece instalar ou corrigir o serviço)

O destino do serviço depende do SO:

- macOS: LaunchAgent (`ai.openclaw.gateway` ou `ai.openclaw.<profile>`; legado `com.openclaw.*`)
- Linux/WSL2: serviço de usuário systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: Tarefa Agendada (`OpenClaw Gateway` ou `OpenClaw Gateway (<profile>)`), com fallback para um item de login na pasta Startup por usuário se a criação da tarefa for negada

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [App do macOS](/pt-BR/platforms/macos)
- [App do iOS](/pt-BR/platforms/ios)
