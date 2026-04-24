---
read_when:
    - Executando o host headless do Node
    - Pareando um Node que não seja macOS para `system.run`
summary: Referência da CLI para `openclaw node` (host headless do Node)
title: Node
x-i18n:
    generated_at: "2026-04-24T05:46:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61b16bdd0c52115bc9938a0fc975369159a4e45d743173ab4e65fce8292af51e
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Execute um **host headless do Node** que se conecta ao WebSocket do Gateway e expõe
`system.run` / `system.which` nesta máquina.

## Por que usar um host de Node?

Use um host de Node quando quiser que agentes **executem comandos em outras máquinas** da sua
rede sem instalar nelas um app complementar completo para macOS.

Casos de uso comuns:

- Executar comandos em máquinas remotas Linux/Windows (servidores de build, máquinas de laboratório, NAS).
- Manter a execução em **sandbox** no gateway, mas delegar execuções aprovadas a outros hosts.
- Fornecer um destino de execução leve e headless para automação ou nodes de CI.

A execução continua protegida por **aprovações de execução** e allowlists por agente no
host de Node, para que você possa manter o acesso a comandos delimitado e explícito.

## Proxy de browser (zero-config)

Hosts de Node anunciam automaticamente um proxy de browser se `browser.enabled` não estiver
desabilitado no node. Isso permite que o agente use automação de browser nesse node
sem configuração extra.

Por padrão, o proxy expõe a superfície normal de perfis de browser do node. Se você
definir `nodeHost.browserProxy.allowProfiles`, o proxy passa a ser restritivo:
o direcionamento a perfis fora da allowlist é rejeitado, e rotas de
criação/exclusão de perfis persistentes são bloqueadas pelo proxy.

Desabilite no node, se necessário:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Executar (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host do WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta do WebSocket do Gateway (padrão: `18789`)
- `--tls`: usar TLS para a conexão com o gateway
- `--tls-fingerprint <sha256>`: fingerprint esperada do certificado TLS (sha256)
- `--node-id <id>`: sobrescrever o ID do node (limpa o token de pareamento)
- `--display-name <name>`: sobrescrever o nome de exibição do node

## Autenticação do Gateway para host de Node

`openclaw node run` e `openclaw node install` resolvem a autenticação do gateway a partir de config/env (sem flags `--token`/`--password` nos comandos do node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificados primeiro.
- Depois, fallback para a configuração local: `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host de Node intencionalmente não herda `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não for resolvido, a resolução de autenticação do node falha de forma segura (sem mascaramento por fallback remoto).
- Em `gateway.mode=remote`, os campos de cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também são elegíveis segundo as regras de precedência remota.
- A resolução de autenticação do host de Node só respeita variáveis de ambiente `OPENCLAW_GATEWAY_*`.

Para um node que se conecta a um Gateway `ws://` sem loopback em uma
rede privada confiável, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sem isso, a inicialização
do node falha de forma segura e pede para você usar `wss://`, um túnel SSH ou Tailscale.
`openclaw node install` persiste essa adesão no serviço supervisionado do node.

## Serviço (background)

Instale um host headless do Node como serviço de usuário.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host do WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta do WebSocket do Gateway (padrão: `18789`)
- `--tls`: usar TLS para a conexão com o gateway
- `--tls-fingerprint <sha256>`: fingerprint esperada do certificado TLS (sha256)
- `--node-id <id>`: sobrescrever o ID do node (limpa o token de pareamento)
- `--display-name <name>`: sobrescrever o nome de exibição do node
- `--runtime <runtime>`: runtime do serviço (`node` ou `bun`)
- `--force`: reinstalar/sobrescrever se já estiver instalado

Gerencie o serviço:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Use `openclaw node run` para um host de Node em foreground (sem serviço).

Os comandos de serviço aceitam `--json` para saída legível por máquina.

## Pareamento

A primeira conexão cria uma solicitação pendente de pareamento de dispositivo (`role: node`) no Gateway.
Aprove via:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o node tentar novamente o pareamento com detalhes de autenticação alterados (role/scopes/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes de aprovar.

O host de Node armazena seu ID de node, token, nome de exibição e informações de conexão do gateway em
`~/.openclaw/node.json`.

## Aprovações de execução

`system.run` é controlado por aprovações locais de execução:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/pt-BR/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar a partir do Gateway)

Para execução assíncrona aprovada no node, o OpenClaw prepara um `systemRunPlan`
canônico antes de solicitar a aprovação. O encaminhamento posterior aprovado de `system.run` reutiliza esse plano
armazenado, então edições nos campos command/cwd/session depois que a solicitação de aprovação foi
criada são rejeitadas em vez de alterar o que o node executa.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
