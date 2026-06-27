---
read_when:
    - Empacotando OpenClaw.app
    - Depurando o serviço launchd do Gateway no macOS
    - Instalando a CLI do gateway para macOS
summary: Runtime do Gateway no macOS (serviço launchd externo)
title: Gateway no macOS
x-i18n:
    generated_at: "2026-06-27T17:42:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app não inclui mais Node/Bun nem o runtime do Gateway. O app macOS
espera uma instalação **externa** da CLI `openclaw`, não inicia o Gateway como um
processo filho e gerencia um serviço launchd por usuário para manter o Gateway
em execução (ou se conecta a um Gateway local existente se já houver um em execução).

## Instale a CLI (obrigatório para o modo local)

Node 24 é o runtime padrão no Mac. Node 22 LTS, atualmente `22.19+`, ainda funciona por compatibilidade. Em seguida, instale `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

O botão **Instalar CLI** do app macOS executa o mesmo fluxo de instalação global que o app
usa internamente: ele prefere npm primeiro, depois pnpm, depois bun se esse for o único
gerenciador de pacotes detectado. Node continua sendo o runtime recomendado para o Gateway.

## Launchd (Gateway como LaunchAgent)

Rótulo:

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>`; o legado `com.openclaw.*` pode permanecer)

Localização do plist (por usuário):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gerenciador:

- O app macOS é responsável pela instalação/atualização do LaunchAgent no modo Local.
- A CLI também pode instalá-lo: `openclaw gateway install`.

Comportamento:

- "OpenClaw Active" ativa/desativa o LaunchAgent.
- Sair do app **não** interrompe o gateway (o launchd o mantém ativo).
- Se um Gateway já estiver em execução na porta configurada, o app se conecta a
  ele em vez de iniciar um novo.

Registro:

- stdout do launchd: `~/Library/Logs/openclaw/gateway.log` (perfis usam `gateway-<profile>.log`)
- stderr do launchd: suprimido

## Compatibilidade de versão

O app macOS verifica a versão do gateway em relação à sua própria versão. Se elas forem
incompatíveis, atualize a CLI global para corresponder à versão do app.

## Verificação rápida

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Em seguida:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Relacionados

- [app macOS](/pt-BR/platforms/macos)
- [Runbook do Gateway](/pt-BR/gateway)
