---
read_when:
    - Procurando compatibilidade com sistemas operacionais ou caminhos de instalação
    - Decidindo onde executar o Gateway
summary: Visão geral do suporte a plataformas (Gateway + aplicativos complementares)
title: Plataformas
x-i18n:
    generated_at: "2026-07-16T12:36:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

O núcleo do OpenClaw é escrito em TypeScript. **Node é o runtime obrigatório** porque
o armazenamento de estado canônico usa `node:sqlite`. O Bun continua disponível para
instalação de dependências e scripts de pacote; consulte [Bun](/pt-BR/install/bun).

Há aplicativos complementares para o Windows Hub, macOS (aplicativo da barra de menus) e Nodes móveis
(iOS/Android). Aplicativos complementares para Linux estão planejados, mas o Gateway já é
totalmente compatível. No Windows, escolha o Windows Hub para usar o aplicativo para desktop, a
instalação nativa pelo PowerShell para priorizar o uso pelo terminal ou o WSL2 para obter o runtime
do Gateway com maior compatibilidade com Linux.

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
- Guia operacional do Gateway: [Gateway](/pt-BR/gateway)
- Configuração do Gateway: [Configuração](/pt-BR/gateway/configuration)
- Status do serviço: `openclaw gateway status`

## Instalação do serviço do Gateway (CLI)

Use uma destas opções (todas são compatíveis):

- Assistente (recomendado): `openclaw onboard --install-daemon`
- Direta: `openclaw gateway install`
- Fluxo de configuração: `openclaw configure` → selecione **Serviço do Gateway**
- Reparar/migrar: `openclaw doctor` (oferece a instalação ou correção do serviço)

O destino do serviço depende do sistema operacional:

- macOS: LaunchAgent (`ai.openclaw.gateway` ou `ai.openclaw.<profile>` para um perfil nomeado)
- Linux/WSL2: serviço de usuário do systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: Tarefa Agendada (`OpenClaw Gateway` ou `OpenClaw Gateway (<profile>)`), com um item de logon por usuário na pasta Inicializar como alternativa caso a criação da tarefa seja negada

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Windows Hub](/pt-BR/platforms/windows)
- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Aplicativo para iOS](/pt-BR/platforms/ios)
