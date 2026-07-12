---
read_when:
    - Procurando suporte a sistemas operacionais ou caminhos de instalação
    - Decidindo onde executar o Gateway
summary: Visão geral do suporte a plataformas (Gateway + aplicativos complementares)
title: Plataformas
x-i18n:
    generated_at: "2026-07-12T00:07:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

O núcleo do OpenClaw é escrito em TypeScript. **Node é o runtime recomendado**.
Bun não é recomendado para o Gateway — há problemas conhecidos com os canais do WhatsApp e
Telegram; consulte [Bun (experimental)](/pt-BR/install/bun) para obter detalhes.

Há aplicativos complementares para o Windows Hub, macOS (aplicativo da barra de menus) e Nodes móveis
(iOS/Android). Aplicativos complementares para Linux estão planejados, mas o Gateway já conta com
suporte completo. No Windows, escolha o Windows Hub para usar o aplicativo para desktop, a instalação
nativa pelo PowerShell para uso prioritariamente pelo terminal ou o WSL2 para obter o runtime do Gateway
com maior compatibilidade com Linux.

## Escolha seu sistema operacional

- macOS: [macOS](/pt-BR/platforms/macos)
- iOS: [iOS](/pt-BR/platforms/ios)
- Android: [Android](/pt-BR/platforms/android)
- Windows: [Windows](/pt-BR/platforms/windows)
- Linux: [Linux](/pt-BR/platforms/linux)

## VPS e hospedagem

- Hub em VPS: [Hospedagem em VPS](/pt-BR/vps)
- Fly.io: [Fly.io](/pt-BR/install/fly)
- Hetzner (Docker): [Hetzner](/pt-BR/install/hetzner)
- GCP (Compute Engine): [GCP](/pt-BR/install/gcp)
- Azure (VM Linux): [Azure](/pt-BR/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/pt-BR/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/pt-BR/platforms/easyrunner)

## Links comuns

- Guia de instalação: [Primeiros passos](/pt-BR/start/getting-started)
- Windows Hub: [Windows](/pt-BR/platforms/windows)
- Manual de operações do Gateway: [Gateway](/pt-BR/gateway)
- Configuração do Gateway: [Configuração](/pt-BR/gateway/configuration)
- Status do serviço: `openclaw gateway status`

## Instalação do serviço do Gateway (CLI)

Use uma destas opções (todas são compatíveis):

- Assistente (recomendado): `openclaw onboard --install-daemon`
- Direta: `openclaw gateway install`
- Fluxo de configuração: `openclaw configure` → selecione **Serviço do Gateway**
- Reparo/migração: `openclaw doctor` (oferece a opção de instalar ou corrigir o serviço)

O destino do serviço depende do sistema operacional:

- macOS: LaunchAgent (`ai.openclaw.gateway` ou `ai.openclaw.<profile>` para um perfil nomeado)
- Linux/WSL2: serviço de usuário do systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: Tarefa Agendada (`OpenClaw Gateway` ou `OpenClaw Gateway (<profile>)`), com um item de login por usuário na pasta Inicializar como alternativa caso a criação da tarefa seja negada

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Windows Hub](/pt-BR/platforms/windows)
- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Aplicativo para iOS](/pt-BR/platforms/ios)
