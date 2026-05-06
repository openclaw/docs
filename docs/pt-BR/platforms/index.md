---
read_when:
    - Procurando suporte a sistemas operacionais ou caminhos de instalação
    - Decidindo onde executar o Gateway
summary: Visão geral do suporte a plataformas (Gateway + aplicativos complementares)
title: Plataformas
x-i18n:
    generated_at: "2026-05-06T06:02:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core é escrito em TypeScript. **Node é o runtime recomendado**.
Bun não é recomendado para o Gateway — há problemas conhecidos com os canais
WhatsApp e Telegram; consulte [Bun (experimental)](/pt-BR/install/bun) para detalhes.

Existem apps complementares para macOS (app de barra de menus) e nodes móveis (iOS/Android). Apps complementares para Windows e
Linux estão planejados, mas o Gateway tem suporte completo hoje.
Apps complementares nativos para Windows também estão planejados; o Gateway é recomendado via WSL2.

## Escolha seu sistema operacional

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
- Azure (VM Linux): [Azure](/pt-BR/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/pt-BR/install/exe-dev)

## Links comuns

- Guia de instalação: [Primeiros passos](/pt-BR/start/getting-started)
- Runbook do Gateway: [Gateway](/pt-BR/gateway)
- Configuração do Gateway: [Configuração](/pt-BR/gateway/configuration)
- Status do serviço: `openclaw gateway status`

## Instalação do serviço do Gateway (CLI)

Use uma destas opções (todas com suporte):

- Assistente (recomendado): `openclaw onboard --install-daemon`
- Direto: `openclaw gateway install`
- Fluxo de configuração: `openclaw configure` → selecione **Serviço do Gateway**
- Reparar/migrar: `openclaw doctor` (oferece instalar ou corrigir o serviço)

O destino do serviço depende do sistema operacional:

- macOS: LaunchAgent (`ai.openclaw.gateway` ou `ai.openclaw.<profile>`; legado `com.openclaw.*`)
- Linux/WSL2: serviço systemd de usuário (`openclaw-gateway[-<profile>].service`)
- Windows nativo: Tarefa Agendada (`OpenClaw Gateway` ou `OpenClaw Gateway (<profile>)`), com fallback para um item de login na pasta Inicializar por usuário se a criação da tarefa for negada

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [App para macOS](/pt-BR/platforms/macos)
- [App para iOS](/pt-BR/platforms/ios)
