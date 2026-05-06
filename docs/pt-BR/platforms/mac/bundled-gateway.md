---
read_when:
    - Empacotamento do OpenClaw.app
    - Depuração do serviço launchd do Gateway do macOS
    - Instalando a CLI do Gateway para macOS
summary: Runtime do Gateway no macOS (serviço launchd externo)
title: Gateway no macOS
x-i18n:
    generated_at: "2026-05-06T06:03:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app não inclui mais Node/Bun nem o runtime do Gateway. O app para macOS
espera uma instalação **externa** da CLI `openclaw`, não inicia o Gateway como um
processo filho e gerencia um serviço launchd por usuário para manter o Gateway
em execução (ou se conecta a um Gateway local existente se um já estiver em execução).

## Instale a CLI (necessário para o modo local)

Node 24 é o runtime padrão no Mac. Node 22 LTS, atualmente `22.14+`, ainda funciona por compatibilidade. Em seguida, instale `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

O botão **Instalar CLI** do app para macOS executa o mesmo fluxo de instalação global que o app
usa internamente: ele prefere npm primeiro, depois pnpm e depois bun se esse for o único
gerenciador de pacotes detectado. Node continua sendo o runtime recomendado do Gateway.

## Launchd (Gateway como LaunchAgent)

Rótulo:

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>`; o legado `com.openclaw.*` pode permanecer)

Localização do plist (por usuário):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gerenciador:

- O app para macOS é responsável por instalar/atualizar o LaunchAgent no modo Local.
- A CLI também pode instalá-lo: `openclaw gateway install`.

Comportamento:

- "OpenClaw Ativo" habilita/desabilita o LaunchAgent.
- Encerrar o app **não** interrompe o gateway (launchd o mantém ativo).
- Se um Gateway já estiver em execução na porta configurada, o app se conecta a
  ele em vez de iniciar um novo.

Registro em log:

- stdout/err do launchd: `/tmp/openclaw/openclaw-gateway.log`

## Compatibilidade de versão

O app para macOS verifica a versão do gateway em relação à própria versão. Se forem
incompatíveis, atualize a CLI global para corresponder à versão do app.

## Verificação rápida

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

- [app para macOS](/pt-BR/platforms/macos)
- [runbook do Gateway](/pt-BR/gateway)
