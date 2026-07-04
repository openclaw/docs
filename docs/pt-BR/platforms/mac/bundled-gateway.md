---
read_when:
    - Empacotando OpenClaw.app
    - Depuração do serviço launchd do Gateway no macOS
    - Instalando a CLI do gateway para macOS
summary: Runtime do Gateway no macOS (serviço launchd externo)
title: Gateway no macOS
x-i18n:
    generated_at: "2026-07-04T06:26:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app não inclui mais Node/Bun nem o runtime do Gateway. O app para macOS
espera uma instalação **externa** da CLI `openclaw`, não inicia o Gateway como um
processo filho e gerencia um serviço launchd por usuário para manter o Gateway
em execução (ou se conecta a um Gateway local existente, se já houver um em execução).

## Configuração automática

Em um Mac novo, escolha **Este Mac** durante a integração inicial. O app executa seu
instalador assinado e incluído antes do assistente do Gateway, instala um runtime Node
no espaço do usuário e a CLI `openclaw` correspondente em `~/.openclaw`, depois instala e inicia o
serviço launchd por usuário. Esse caminho não exige Terminal, Homebrew nem
acesso de administrador.

O app inclui o script de instalação, não o payload do Node ou do Gateway. Portanto, a configuração
precisa de uma conexão com a internet para baixar o runtime e o pacote
OpenClaw correspondente.

## Recuperação manual

Node 24 é recomendado para uma instalação manual. Node 22 LTS, atualmente `22.19+`,
também funciona. Depois, instale `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Use **Tentar configuração novamente** após uma configuração automática com falha. Se isso ainda falhar, instale
a CLI manualmente com o comando acima e escolha **Verificar novamente** na
integração inicial. Node continua sendo o runtime recomendado para o Gateway.

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

- "OpenClaw Active" habilita/desabilita o LaunchAgent.
- Encerrar o app **não** para o gateway (o launchd o mantém ativo).
- Se um Gateway já estiver em execução na porta configurada, o app se conecta a
  ele em vez de iniciar um novo.

Logs:

- stdout do launchd: `~/Library/Logs/openclaw/gateway.log` (perfis usam `gateway-<profile>.log`)
- stderr do launchd: suprimido

## Compatibilidade de versões

O app para macOS verifica a versão do Gateway em relação à sua própria versão. A integração inicial
executa automaticamente a configuração gerenciada quando uma CLI existente está ausente ou
é incompatível. Use **Tentar configuração novamente** para repetir a instalação ou **Verificar novamente**
após reparar uma CLI externa.

## Diretório de estado no macOS

Mantenha o estado do OpenClaw em um disco local, não sincronizado. Evite o iCloud Drive e outras
pastas sincronizadas com a nuvem, pois a latência de sincronização e bloqueios de arquivo podem afetar sessões,
credenciais e estado do Gateway.

Defina `OPENCLAW_STATE_DIR` como um caminho local somente quando precisar de uma substituição.
`openclaw doctor` avisa sobre caminhos comuns de estado sincronizados com a nuvem e recomenda
voltar para armazenamento local. Consulte
[variáveis de ambiente](/pt-BR/help/environment#path-related-env-vars) e
[Doctor](/pt-BR/gateway/doctor).

## Depurar conectividade do app

Use a CLI de depuração do macOS a partir de um checkout do código-fonte para exercitar o mesmo handshake WebSocket
do Gateway e a lógica de descoberta que o app usa:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` aceita `--url`, `--token`, `--timeout` e `--json`. `discover`
aceita `--timeout`, `--json` e `--include-local`. Compare a saída de descoberta
com `openclaw gateway discover --json` quando precisar separar a descoberta da CLI
dos problemas de conexão no lado do app.

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

## Relacionados

- [app para macOS](/pt-BR/platforms/macos)
- [runbook do Gateway](/pt-BR/gateway)
