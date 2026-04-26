---
read_when:
    - Executando o host Node headless
    - Pareando um Node não macOS para `system.run`
summary: Referência da CLI para `openclaw node` (host Node headless)
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Execute um **host Node headless** que se conecta ao WebSocket do Gateway e expõe
`system.run` / `system.which` nesta máquina.

## Por que usar um host Node?

Use um host Node quando quiser que agentes **executem comandos em outras máquinas** na sua
rede sem instalar nelas um app companheiro completo para macOS.

Casos de uso comuns:

- Executar comandos em máquinas Linux/Windows remotas (servidores de build, máquinas de laboratório, NAS).
- Manter `exec` **em sandbox** no Gateway, mas delegar execuções aprovadas a outros hosts.
- Fornecer um destino de execução leve e headless para automação ou nós de CI.

A execução ainda é protegida por **aprovações de exec** e allowlists por agente no
host Node, para que você possa manter o acesso a comandos restrito e explícito.

## Proxy de Browser (sem configuração)

Hosts Node anunciam automaticamente um proxy de Browser se `browser.enabled` não
estiver desativado no nó. Isso permite que o agente use automação de navegador nesse nó
sem configuração extra.

Por padrão, o proxy expõe a superfície normal de perfis de navegador do nó. Se você
definir `nodeHost.browserProxy.allowProfiles`, o proxy se torna restritivo:
alvos de perfil fora da allowlist são rejeitados, e rotas persistentes de
criação/exclusão de perfis são bloqueadas por meio do proxy.

Desative-o no nó, se necessário:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Executar (primeiro plano)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host do WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta do WebSocket do Gateway (padrão: `18789`)
- `--tls`: usar TLS para a conexão com o Gateway
- `--tls-fingerprint <sha256>`: fingerprint esperado do certificado TLS (sha256)
- `--node-id <id>`: substitui o id do nó (limpa o token de pareamento)
- `--display-name <name>`: substitui o nome de exibição do nó

## Autenticação do Gateway para host Node

`openclaw node run` e `openclaw node install` resolvem a autenticação do Gateway a partir de config/env (sem flags `--token`/`--password` em comandos de node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificados primeiro.
- Depois, fallback para configuração local: `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host Node intencionalmente não herda `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado por SecretRef e não resolvido, a resolução de autenticação do node falha de forma fechada (sem mascaramento por fallback remoto).
- Em `gateway.mode=remote`, campos do cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também são elegíveis conforme as regras de precedência remota.
- A resolução de autenticação do host Node só respeita variáveis de ambiente `OPENCLAW_GATEWAY_*`.

Para um nó que se conecta a um Gateway `ws://` não-loopback em uma rede privada
confiável, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sem isso, a inicialização do node falha de forma fechada e orienta você a usar `wss://`, um túnel SSH ou Tailscale.
Isso é uma ativação explícita por ambiente de processo, não uma chave de configuração em `openclaw.json`.
`openclaw node install` persiste isso no serviço supervisionado do node quando está
presente no ambiente do comando de instalação.

## Serviço (segundo plano)

Instale um host Node headless como um serviço de usuário.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host do WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta do WebSocket do Gateway (padrão: `18789`)
- `--tls`: usar TLS para a conexão com o Gateway
- `--tls-fingerprint <sha256>`: fingerprint esperado do certificado TLS (sha256)
- `--node-id <id>`: substitui o id do nó (limpa o token de pareamento)
- `--display-name <name>`: substitui o nome de exibição do nó
- `--runtime <runtime>`: runtime do serviço (`node` ou `bun`)
- `--force`: reinstala/sobrescreve se já estiver instalado

Gerencie o serviço:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Use `openclaw node run` para um host Node em primeiro plano (sem serviço).

Os comandos de serviço aceitam `--json` para saída legível por máquina.

O host Node tenta novamente internamente em caso de reinicialização do Gateway e fechamentos de rede. Se o Gateway relatar uma pausa terminal de autenticação de token/senha/bootstrap, o host Node registra o detalhe do fechamento e sai com código diferente de zero para que `launchd`/`systemd` possam reiniciá-lo com configuração e credenciais atualizadas. Pausas que exigem pareamento permanecem no fluxo de primeiro plano para que a solicitação pendente possa ser aprovada.

## Pareamento

A primeira conexão cria uma solicitação pendente de pareamento de dispositivo (`role: node`) no Gateway.
Aprove com:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Em redes de nós rigidamente controladas, o operador do Gateway pode optar explicitamente
por aprovar automaticamente o pareamento inicial de nós vindos de CIDRs confiáveis:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Isso fica desativado por padrão. Só se aplica a pareamento novo de `role: node` com
nenhum escopo solicitado. Clientes operator/browser, Control UI, WebChat e upgrades de role,
escopo, metadados ou chave pública ainda exigem aprovação manual.

Se o nó tentar novamente o pareamento com detalhes de autenticação alterados (role/scopes/chave pública),
a solicitação pendente anterior é substituída e um novo `requestId` é criado.
Execute `openclaw devices list` novamente antes de aprovar.

O host Node armazena seu id de nó, token, nome de exibição e informações de conexão do Gateway em
`~/.openclaw/node.json`.

## Aprovações de exec

`system.run` é controlado por aprovações locais de exec:

- `~/.openclaw/exec-approvals.json`
- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar a partir do Gateway)

Para exec assíncrono de node aprovado, o OpenClaw prepara um `systemRunPlan`
canônico antes de pedir aprovação. O encaminhamento posterior de `system.run`
aprovado reutiliza esse plano armazenado, então edições em campos de comando/cwd/sessão após a criação da solicitação de aprovação são rejeitadas em vez de alterar o que o nó executa.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
