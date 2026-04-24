---
read_when:
    - Empacotando o OpenClaw.app
    - Depurando o serviço launchd do gateway no macOS
    - Instalando a CLI do gateway para macOS
summary: Runtime do Gateway no macOS (serviço launchd externo)
title: Gateway no macOS
x-i18n:
    generated_at: "2026-04-24T06:01:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

O OpenClaw.app não inclui mais Node/Bun nem o runtime do Gateway. O app do macOS
espera uma instalação **externa** da CLI `openclaw`, não inicia o Gateway como
um processo filho e gerencia um serviço launchd por usuário para manter o Gateway
em execução (ou se conecta a um Gateway local existente se já houver um em execução).

## Instale a CLI (obrigatória para o modo local)

Node 24 é o runtime padrão no Mac. Node 22 LTS, atualmente `22.14+`, ainda funciona por compatibilidade. Depois instale `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

O botão **Install CLI** do app do macOS executa o mesmo fluxo de instalação global que o app
usa internamente: ele prefere npm primeiro, depois pnpm e depois bun, se esse for o único
gerenciador de pacotes detectado. Node continua sendo o runtime recomendado do Gateway.

## Launchd (Gateway como LaunchAgent)

Label:

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>`; o legado `com.openclaw.*` pode permanecer)

Local do plist (por usuário):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gerenciador:

- O app do macOS é responsável pela instalação/atualização do LaunchAgent no modo Local.
- A CLI também pode instalá-lo: `openclaw gateway install`.

Comportamento:

- “OpenClaw Active” habilita/desabilita o LaunchAgent.
- Fechar o app **não** interrompe o gateway (o launchd o mantém ativo).
- Se um Gateway já estiver em execução na porta configurada, o app se conecta
  a ele em vez de iniciar um novo.

Logging:

- stdout/err do launchd: `/tmp/openclaw/openclaw-gateway.log`

## Compatibilidade de versão

O app do macOS verifica a versão do gateway em relação à sua própria versão. Se forem
incompatíveis, atualize a CLI global para corresponder à versão do app.

## Verificação smoke

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Depois:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Relacionado

- [App do macOS](/pt-BR/platforms/macos)
- [Runbook do Gateway](/pt-BR/gateway)
