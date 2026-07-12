---
read_when:
    - Empacotamento do OpenClaw.app
    - Depuração do serviço launchd do Gateway no macOS
    - Instalando a CLI do Gateway para macOS
summary: Runtime do Gateway no macOS (serviço launchd externo)
title: Gateway no macOS
x-i18n:
    generated_at: "2026-07-12T15:25:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e6a871678fcbc617cb87dc4f0610419187a0b67cea7105e02a6cde70d44e85f3
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

O OpenClaw.app não inclui o Node/Bun nem o runtime do Gateway. O aplicativo para macOS
espera uma instalação **externa** da CLI `openclaw`, não inicia o Gateway como
um processo filho e gerencia um serviço launchd por usuário para manter o Gateway
em execução (ou se conecta a um Gateway local que já esteja em execução).

## Configuração automática

Em um Mac novo, escolha **This Mac** durante a integração inicial. O aplicativo executa seu
script de instalação assinado e incluído antes do assistente do Gateway: ele instala um
runtime do Node no espaço do usuário e a CLI `openclaw` correspondente em `~/.openclaw`,
depois instala e inicia o serviço launchd por usuário. Esse caminho não requer
Terminal, Homebrew nem acesso de administrador.

O aplicativo inclui apenas o script de instalação, não o payload do Node ou do Gateway;
a configuração requer uma conexão com a internet para baixar o runtime e o pacote
correspondente do OpenClaw.

## Recuperação manual

O Node 24 é recomendado para uma instalação manual; o Node 22.19+ também funciona. Instale
o `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Use **Retry setup** após uma falha na configuração automática. Se ela ainda falhar,
instale a CLI manualmente com o comando acima e escolha **Check again**
na integração inicial.

## Launchd (Gateway como LaunchAgent)

Rótulo: `ai.openclaw.gateway` (perfil padrão) ou `ai.openclaw.<profile>`
para um perfil nomeado.

Localização do plist (por usuário): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(ou `ai.openclaw.<profile>.plist`).

O aplicativo para macOS é responsável pela instalação/atualização do LaunchAgent para o perfil padrão no
modo Local. A CLI também pode instalá-lo diretamente: `openclaw gateway install`
(perfis nomeados são selecionados pela variável de ambiente `OPENCLAW_PROFILE`).

Comportamento:

- "OpenClaw Active" ativa/desativa o LaunchAgent.
- Encerrar o aplicativo **não** interrompe o Gateway (o launchd o mantém ativo).
- Se um Gateway já estiver em execução na porta configurada, o aplicativo se conecta a
  ele em vez de iniciar um novo.

Registro em log:

- stdout do launchd: `~/Library/Logs/openclaw/gateway.log` (os perfis usam
  `gateway-<profile>.log`)
- stderr do launchd: suprimido
- Se o host entrar em um ciclo com ocorrências repetidas de `EADDRINUSE` ou reinicializações rápidas, verifique se há
  LaunchAgents `ai.openclaw.gateway` / `ai.openclaw.node` duplicados e a
  solução alternativa do marcador do launchd em
  [solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Compatibilidade de versões

O aplicativo para macOS verifica a versão do Gateway em relação à sua própria versão. A integração inicial
executa automaticamente a configuração gerenciada quando uma CLI existente está ausente ou é
incompatível. Use **Retry setup** para repetir a instalação ou **Check again**
após reparar uma CLI externa.

## Diretório de estado no macOS

Mantenha o estado do OpenClaw em um disco local e não sincronizado. Evite o iCloud Drive e outras
pastas sincronizadas com a nuvem; a latência da sincronização e os bloqueios de arquivos podem afetar sessões,
credenciais e o estado do Gateway.

Defina `OPENCLAW_STATE_DIR` como um caminho local somente quando precisar de uma substituição.
`openclaw doctor` alerta sobre caminhos de estado comuns sincronizados com a nuvem e recomenda
voltar para o armazenamento local. Consulte
[variáveis de ambiente](/pt-BR/help/environment#path-related-env-vars) e
[Doctor](/pt-BR/gateway/doctor).

## Depurar a conectividade do aplicativo

Use a CLI de depuração do macOS a partir de um checkout do código-fonte para testar a mesma lógica de
handshake e descoberta do WebSocket do Gateway usada pelo aplicativo:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` aceita `--url`, `--token`, `--timeout`, `--probe` e `--json`
(além de substituições da identidade do cliente; execute com `--help` para ver a lista completa).
`discover` aceita `--timeout`, `--json` e `--include-local`. Compare
a saída da descoberta com `openclaw gateway discover --json` quando precisar
separar a descoberta da CLI de problemas de conexão no aplicativo.

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

## Relacionado

- [aplicativo para macOS](/pt-BR/platforms/macos)
- [runbook do Gateway](/pt-BR/gateway)
