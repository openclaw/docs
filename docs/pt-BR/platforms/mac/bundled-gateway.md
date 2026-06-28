---
read_when:
    - Empacotando o OpenClaw.app
    - Depuração do serviço launchd do Gateway no macOS
    - Instalando a CLI do Gateway para macOS
summary: Runtime do Gateway no macOS (serviço launchd externo)
title: Gateway no macOS
x-i18n:
    generated_at: "2026-06-28T00:12:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

O OpenClaw.app não inclui mais Node/Bun nem o ambiente de execução do Gateway. O aplicativo macOS
espera uma instalação **externa** da CLI `openclaw`, não inicia o Gateway como um
processo filho e gerencia um serviço launchd por usuário para manter o Gateway
em execução (ou se conecta a um Gateway local existente, se já houver um em execução).

## Instale a CLI (obrigatório para o modo local)

Node 24 é o ambiente de execução padrão no Mac. Node 22 LTS, atualmente `22.19+`, ainda funciona por compatibilidade. Depois, instale `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

O botão **Instalar CLI** do aplicativo macOS executa o mesmo fluxo de instalação global que o aplicativo
usa internamente: ele prefere npm primeiro, depois pnpm e, em seguida, bun se esse for o único
gerenciador de pacotes detectado. Node continua sendo o ambiente de execução recomendado do Gateway.

## Launchd (Gateway como LaunchAgent)

Rótulo:

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>`; o legado `com.openclaw.*` pode permanecer)

Localização do Plist (por usuário):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gerenciador:

- O aplicativo macOS controla a instalação/atualização do LaunchAgent no modo Local.
- A CLI também pode instalá-lo: `openclaw gateway install`.

Comportamento:

- "OpenClaw Ativo" habilita/desabilita o LaunchAgent.
- Sair do aplicativo **não** para o gateway (o launchd o mantém ativo).
- Se um Gateway já estiver em execução na porta configurada, o aplicativo se conecta a
  ele em vez de iniciar um novo.

Registro:

- stdout do launchd: `~/Library/Logs/openclaw/gateway.log` (perfis usam `gateway-<profile>.log`)
- stderr do launchd: suprimido

## Compatibilidade de versões

O aplicativo macOS verifica a versão do gateway em relação à sua própria versão. Se elas forem
incompatíveis, atualize a CLI global para corresponder à versão do aplicativo.

## Diretório de estado no macOS

Mantenha o estado do OpenClaw em um disco local, não sincronizado. Evite iCloud Drive e outras
pastas sincronizadas com a nuvem, porque a latência de sincronização e os bloqueios de arquivo podem afetar sessões,
credenciais e o estado do Gateway.

Defina `OPENCLAW_STATE_DIR` para um caminho local somente quando precisar de uma substituição.
`openclaw doctor` avisa sobre caminhos de estado comuns sincronizados com a nuvem e recomenda
voltar para o armazenamento local. Consulte
[variáveis de ambiente](/pt-BR/help/environment#path-related-env-vars) e
[Doctor](/pt-BR/gateway/doctor).

## Depurar a conectividade do aplicativo

Use a CLI de depuração do macOS a partir de um checkout do código-fonte para exercitar a mesma lógica de
handshake WebSocket e descoberta do Gateway que o aplicativo usa:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` aceita `--url`, `--token`, `--timeout` e `--json`. `discover`
aceita `--timeout`, `--json` e `--include-local`. Compare a saída de descoberta
com `openclaw gateway discover --json` quando precisar separar a descoberta da CLI
de problemas de conexão do lado do aplicativo.

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

- [aplicativo macOS](/pt-BR/platforms/macos)
- [runbook do Gateway](/pt-BR/gateway)
