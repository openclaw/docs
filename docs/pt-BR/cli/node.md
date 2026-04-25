---
read_when:
    - Executando o host de Node headless
    - Emparelhando um Node que não seja macOS para `system.run`
summary: Referência da CLI para `openclaw node` (host de Node headless)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Execute um **host de Node headless** que se conecta ao Gateway WebSocket e expõe
`system.run` / `system.which` nesta máquina.

## Por que usar um host de Node?

Use um host de Node quando quiser que agentes **executem comandos em outras máquinas** da sua
rede sem instalar um aplicativo complementar macOS completo nelas.

Casos de uso comuns:

- Executar comandos em máquinas Linux/Windows remotas (servidores de build, máquinas de laboratório, NAS).
- Manter a execução **em sandbox** no Gateway, mas delegar execuções aprovadas para outros hosts.
- Fornecer um destino de execução leve e headless para automação ou Nodes de CI.

A execução ainda é protegida por **aprovações de exec** e allowlists por agente no
host de Node, para que você possa manter o acesso a comandos com escopo limitado e explícito.

## Proxy de navegador (configuração zero)

Hosts de Node anunciam automaticamente um proxy de navegador se `browser.enabled` não estiver
desabilitado no Node. Isso permite que o agente use automação de navegador nesse Node
sem configuração extra.

Por padrão, o proxy expõe a superfície normal de perfil de navegador do Node. Se você
definir `nodeHost.browserProxy.allowProfiles`, o proxy se tornará restritivo:
o direcionamento para perfis fora da allowlist será rejeitado, e rotas de
criação/exclusão de perfil persistente serão bloqueadas por meio do proxy.

Desabilite-o no Node, se necessário:

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

- `--host <host>`: host do Gateway WebSocket (padrão: `127.0.0.1`)
- `--port <port>`: porta do Gateway WebSocket (padrão: `18789`)
- `--tls`: usa TLS para a conexão com o Gateway
- `--tls-fingerprint <sha256>`: impressão digital esperada do certificado TLS (sha256)
- `--node-id <id>`: substitui o id do Node (limpa o token de emparelhamento)
- `--display-name <name>`: substitui o nome de exibição do Node

## Autenticação do Gateway para host de Node

`openclaw node run` e `openclaw node install` resolvem a autenticação do Gateway a partir de config/env (sem flags `--token`/`--password` nos comandos de Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificados primeiro.
- Depois, fallback da configuração local: `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host de Node intencionalmente não herda `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado por SecretRef e não resolvido, a resolução de autenticação do Node falha de forma fail-closed (sem mascaramento por fallback remoto).
- Em `gateway.mode=remote`, os campos do cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também podem ser usados de acordo com as regras de precedência remota.
- A resolução de autenticação do host de Node só respeita variáveis de ambiente `OPENCLAW_GATEWAY_*`.

Para um Node se conectando a um Gateway `ws://` não loopback em uma
rede privada confiável, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sem isso,
a inicialização do Node falha de forma fail-closed e pede que você use `wss://`, um túnel SSH ou
Tailscale.
Isso é uma ativação opcional no ambiente do processo, não uma chave de configuração em `openclaw.json`.
`openclaw node install` a persiste no serviço supervisionado do Node quando ela está
presente no ambiente do comando de instalação.

## Serviço (segundo plano)

Instale um host de Node headless como serviço de usuário.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host do Gateway WebSocket (padrão: `127.0.0.1`)
- `--port <port>`: porta do Gateway WebSocket (padrão: `18789`)
- `--tls`: usa TLS para a conexão com o Gateway
- `--tls-fingerprint <sha256>`: impressão digital esperada do certificado TLS (sha256)
- `--node-id <id>`: substitui o id do Node (limpa o token de emparelhamento)
- `--display-name <name>`: substitui o nome de exibição do Node
- `--runtime <runtime>`: runtime do serviço (`node` ou `bun`)
- `--force`: reinstala/substitui se já estiver instalado

Gerencie o serviço:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Use `openclaw node run` para um host de Node em primeiro plano (sem serviço).

Comandos de serviço aceitam `--json` para saída legível por máquina.

## Emparelhamento

A primeira conexão cria uma solicitação pendente de emparelhamento de dispositivo (`role: node`) no Gateway.
Aprove-a via:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Em redes de Nodes rigidamente controladas, o operador do Gateway pode optar explicitamente
pela aprovação automática do primeiro emparelhamento de Node a partir de CIDRs confiáveis:

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

Isso fica desabilitado por padrão. Aplica-se apenas ao emparelhamento novo de `role: node` sem
escopos solicitados. Clientes operator/browser, Control UI, WebChat e atualizações de função,
escopo, metadados ou chave pública ainda exigem aprovação manual.

Se o Node tentar emparelhar novamente com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

O host de Node armazena seu id de Node, token, nome de exibição e informações de conexão com o Gateway em
`~/.openclaw/node.json`.

## Aprovações de exec

`system.run` é controlado por aprovações locais de exec:

- `~/.openclaw/exec-approvals.json`
- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar a partir do Gateway)

Para exec assíncrono de Node aprovado, OpenClaw prepara um `systemRunPlan`
canônico antes de solicitar. O encaminhamento posterior de `system.run` aprovado reutiliza esse plano armazenado,
portanto edições em campos de comando/cwd/sessão após a criação da solicitação de aprovação são rejeitadas
em vez de alterar o que o Node executa.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
