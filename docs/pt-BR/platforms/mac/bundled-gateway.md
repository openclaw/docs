---
read_when:
    - Empacotando o OpenClaw.app
    - Depuração do serviço launchd do Gateway no macOS
    - Instalação da CLI do Gateway para macOS
summary: Runtime do Gateway no macOS (serviço launchd externo)
title: Gateway no macOS
x-i18n:
    generated_at: "2026-07-16T12:40:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app não inclui o Node nem o runtime do Gateway. O aplicativo para macOS
espera uma instalação **externa** da CLI `openclaw`, não inicia o Gateway como
um processo filho e gerencia um serviço launchd por usuário para manter o Gateway
em execução (ou se conecta a um Gateway local que já esteja em execução).

## Configuração automática

Em um Mac novo, escolha **Este Mac** durante a integração inicial. O aplicativo executa seu
script de instalação assinado e incluído antes do assistente do Gateway: ele instala um
runtime do Node no espaço do usuário e a CLI `openclaw` correspondente em `~/.openclaw`,
depois instala e inicia o serviço launchd por usuário. Esse processo não exige
Terminal, Homebrew nem acesso de administrador.

O aplicativo inclui apenas o script de instalação, não o payload do Node ou do Gateway;
a configuração exige conexão com a internet para baixar o runtime e o pacote
OpenClaw correspondente.

## Recuperação manual

O Node 24.15+ é recomendado para uma instalação manual; o Node 22.22.3+ também funciona. Instale
`openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Use **Tentar configurar novamente** após uma falha na configuração automática. Se isso ainda falhar,
instale a CLI manualmente com o comando acima e escolha **Verificar novamente**
na integração inicial.

## Launchd (Gateway como LaunchAgent)

Rótulo: `ai.openclaw.gateway` (perfil padrão) ou `ai.openclaw.<profile>`
para um perfil nomeado.

Local do plist (por usuário): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(ou `ai.openclaw.<profile>.plist`).

O aplicativo para macOS gerencia a instalação/atualização do LaunchAgent para o perfil padrão no
modo Local. A CLI também pode instalá-lo diretamente: `openclaw gateway install`
(os perfis nomeados são selecionados pela variável de ambiente `OPENCLAW_PROFILE`).

Comportamento:

- "OpenClaw ativo" ativa/desativa o LaunchAgent.
- Encerrar o aplicativo **não** interrompe o Gateway (o launchd o mantém em execução).
- Se um Gateway já estiver em execução na porta configurada, o aplicativo se conecta a
  ele em vez de iniciar um novo.

Registro:

- stdout do launchd: `~/Library/Logs/openclaw/gateway.log` (os perfis usam
  `gateway-<profile>.log`)
- stderr do launchd: suprimido
- Se o host entrar em um ciclo com `EADDRINUSE` repetidos ou reinicializações rápidas, verifique se há
  LaunchAgents `ai.openclaw.gateway` / `ai.openclaw.node` duplicados e a
  solução alternativa do marcador do launchd em
  [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Compatibilidade de versões

O aplicativo para macOS verifica a versão do Gateway em relação à sua própria versão. A integração inicial
executa automaticamente a configuração gerenciada quando uma CLI existente está ausente ou é
incompatível. Use **Tentar configurar novamente** para repetir a instalação ou **Verificar novamente**
após reparar uma CLI externa.

## Diretório de estado no macOS

Mantenha o estado do OpenClaw em um disco local não sincronizado. Evite o iCloud Drive e outras
pastas sincronizadas com a nuvem; a latência de sincronização e os bloqueios de arquivos podem afetar sessões,
credenciais e o estado do Gateway.

Defina `OPENCLAW_STATE_DIR` como um caminho local somente quando precisar de uma substituição.
`openclaw doctor` alerta sobre caminhos comuns de estado sincronizados com a nuvem e recomenda
mover o estado de volta para o armazenamento local. Consulte
[variáveis de ambiente](/pt-BR/help/environment#path-related-env-vars) e
[Doctor](/pt-BR/gateway/doctor).

## Depurar a conectividade do aplicativo

Use a CLI de depuração do macOS a partir de um checkout do código-fonte para exercitar a mesma lógica de
handshake e descoberta do WebSocket do Gateway usada pelo aplicativo:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` aceita `--url`, `--token`, `--timeout`, `--probe` e `--json`
(além de substituições da identidade do cliente; execute com `--help` para obter a lista completa).
`discover` aceita `--timeout`, `--json` e `--include-local`. Compare
a saída da descoberta com `openclaw gateway discover --json` quando precisar
separar a descoberta da CLI dos problemas de conexão do aplicativo.

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

- [aplicativo para macOS](/pt-BR/platforms/macos)
- [Guia operacional do Gateway](/pt-BR/gateway)
