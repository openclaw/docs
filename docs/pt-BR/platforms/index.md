---
read_when:
    - Procurando suporte de SO ou caminhos de instalação
    - Decidindo onde executar o Gateway
summary: Visão geral de suporte da plataforma (Gateway + aplicativos complementares)
title: Plataformas
x-i18n:
    generated_at: "2026-06-27T17:42:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

O núcleo do OpenClaw é escrito em TypeScript. **Node é o runtime recomendado**.
Bun não é recomendado para o Gateway — há problemas conhecidos com canais do WhatsApp e
Telegram; veja [Bun (experimental)](/pt-BR/install/bun) para detalhes.

Existem aplicativos complementares para Windows Hub, macOS (aplicativo da barra de menus) e nós móveis
(iOS/Android). Aplicativos complementares para Linux estão planejados, mas o Gateway já é totalmente
compatível hoje. No Windows, escolha Windows Hub para o aplicativo desktop, instalação nativa via
PowerShell para uso priorizando o terminal, ou WSL2 para o runtime do Gateway mais
compatível com Linux.

## Escolha seu SO

- macOS: [macOS](/pt-BR/platforms/macos)
- iOS: [iOS](/pt-BR/platforms/ios)
- Android: [Android](/pt-BR/platforms/android)
- Windows: [Windows](/pt-BR/platforms/windows)
- Linux: [Linux](/pt-BR/platforms/linux)

## VPS e hospedagem

- Hub VPS: [Hospedagem VPS](/pt-BR/vps)
- Fly.io: [Fly.io](/pt-BR/install/fly)
- Hetzner (Docker): [Hetzner](/pt-BR/install/hetzner)
- GCP (Compute Engine): [GCP](/pt-BR/install/gcp)
- Azure (VM Linux): [Azure](/pt-BR/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/pt-BR/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/pt-BR/platforms/easyrunner)

## Links comuns

- Guia de instalação: [Introdução](/pt-BR/start/getting-started)
- Windows Hub: [Windows](/pt-BR/platforms/windows)
- Runbook do Gateway: [Gateway](/pt-BR/gateway)
- Configuração do Gateway: [Configuração](/pt-BR/gateway/configuration)
- Status do serviço: `openclaw gateway status`

## Instalação do serviço Gateway (CLI)

Use uma destas opções (todas compatíveis):

- Assistente (recomendado): `openclaw onboard --install-daemon`
- Direto: `openclaw gateway install`
- Fluxo de configuração: `openclaw configure` → selecione **Serviço Gateway**
- Reparar/migrar: `openclaw doctor` (oferece instalar ou corrigir o serviço)

O destino do serviço depende do SO:

- macOS: LaunchAgent (`ai.openclaw.gateway` ou `ai.openclaw.<profile>`; legado `com.openclaw.*`)
- Linux/WSL2: serviço de usuário systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: Tarefa Agendada (`OpenClaw Gateway` ou `OpenClaw Gateway (<profile>)`), com fallback para um item de login por usuário na pasta Inicializar se a criação da tarefa for negada

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Windows Hub](/pt-BR/platforms/windows)
- [Aplicativo macOS](/pt-BR/platforms/macos)
- [Aplicativo iOS](/pt-BR/platforms/ios)
