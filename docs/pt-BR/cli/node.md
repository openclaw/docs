---
read_when:
    - Executando o host de Node sem interface
    - Emparelhando um nó não macOS para system.run
summary: Referência da CLI para `openclaw node` (host de nó sem interface gráfica)
title: Node
x-i18n:
    generated_at: "2026-05-06T17:53:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Execute um **host Node headless** que se conecta ao WebSocket do Gateway e expõe
`system.run` / `system.which` nesta máquina.

## Por que usar um host Node?

Use um host Node quando quiser que agentes **executem comandos em outras máquinas** na sua
rede sem instalar um app complementar completo para macOS nelas.

Casos de uso comuns:

- Executar comandos em máquinas Linux/Windows remotas (servidores de build, máquinas de laboratório, NAS).
- Manter exec **em sandbox** no gateway, mas delegar execuções aprovadas a outros hosts.
- Fornecer um alvo de execução leve e headless para automação ou nós de CI.

A execução ainda é protegida por **aprovações de exec** e allowlists por agente no
host Node, para que você possa manter o acesso a comandos com escopo limitado e explícito.

## Proxy de navegador (configuração zero)

Hosts Node anunciam automaticamente um proxy de navegador se `browser.enabled` não estiver
desabilitado no nó. Isso permite que o agente use automação de navegador nesse nó
sem configuração extra.

Por padrão, o proxy expõe a superfície de perfil normal do navegador do nó. Se você
definir `nodeHost.browserProxy.allowProfiles`, o proxy se torna restritivo:
o direcionamento a perfis fora da allowlist é rejeitado, e rotas persistentes de
criação/exclusão de perfil são bloqueadas pelo proxy.

Desabilite-o no nó se necessário:

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

- `--host <host>`: host WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta WebSocket do Gateway (padrão: `18789`)
- `--tls`: usar TLS para a conexão com o gateway
- `--tls-fingerprint <sha256>`: fingerprint esperado do certificado TLS (sha256)
- `--node-id <id>`: substituir o id do nó (limpa o token de pareamento)
- `--display-name <name>`: substituir o nome de exibição do nó

## Autenticação do Gateway para host Node

`openclaw node run` e `openclaw node install` resolvem a autenticação do gateway a partir de config/env (sem flags `--token`/`--password` nos comandos de nó):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificados primeiro.
- Depois, fallback de configuração local: `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host Node intencionalmente não herda `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução de autenticação do nó falha fechada (sem fallback remoto mascarando).
- Em `gateway.mode=remote`, campos de cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também são elegíveis conforme as regras de precedência remota.
- A resolução de autenticação do host Node honra apenas variáveis de ambiente `OPENCLAW_GATEWAY_*`.

Para um nó que se conecta a um Gateway `ws://` que não é local loopback em uma
rede privada confiável, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sem isso, a inicialização do nó
falha fechada e pede que você use `wss://`, um túnel SSH ou Tailscale.
Esta é uma adesão pelo ambiente do processo, não uma chave de configuração `openclaw.json`.
`openclaw node install` a persiste no serviço supervisionado do nó quando ela está
presente no ambiente do comando de instalação.

## Serviço (segundo plano)

Instale um host Node headless como serviço de usuário.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta WebSocket do Gateway (padrão: `18789`)
- `--tls`: usar TLS para a conexão com o gateway
- `--tls-fingerprint <sha256>`: fingerprint esperado do certificado TLS (sha256)
- `--node-id <id>`: substituir o id do nó (limpa o token de pareamento)
- `--display-name <name>`: substituir o nome de exibição do nó
- `--runtime <runtime>`: runtime do serviço (`node` ou `bun`)
- `--force`: reinstalar/substituir se já estiver instalado

Gerencie o serviço:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Use `openclaw node run` para um host Node em primeiro plano (sem serviço).

Comandos de serviço aceitam `--json` para saída legível por máquina.

O host Node tenta novamente reinícios do Gateway e fechamentos de rede dentro do processo. Se o
Gateway relatar uma pausa terminal de autenticação por token/senha/bootstrap, o host Node
registra o detalhe do fechamento e sai com código diferente de zero para que launchd/systemd possa reiniciá-lo com
configuração e credenciais atualizadas. Pausas que exigem pareamento permanecem no fluxo
em primeiro plano para que a solicitação pendente possa ser aprovada.

## Pareamento

A primeira conexão cria uma solicitação pendente de pareamento de dispositivo (`role: node`) no Gateway.
Aprove-a via:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Em redes de nós rigorosamente controladas, o operador do Gateway pode optar explicitamente
por aprovar automaticamente o primeiro pareamento de nós a partir de CIDRs confiáveis:

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

Isso é desabilitado por padrão. Aplica-se apenas a pareamentos novos com `role: node` e
sem escopos solicitados. Clientes operador/navegador, Control UI, WebChat, e atualizações de função,
escopo, metadados ou chave pública ainda exigem aprovação manual.

Se o nó tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior é substituída e um novo `requestId` é criado.
Execute `openclaw devices list` novamente antes da aprovação.

O host Node armazena seu id de nó, token, nome de exibição e informações de conexão do gateway em
`~/.openclaw/node.json`.

## Aprovações de exec

`system.run` é protegido por aprovações locais de exec:

- `~/.openclaw/exec-approvals.json`
- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar a partir do Gateway)

Para exec de nó assíncrona aprovada, o OpenClaw prepara um `systemRunPlan` canônico
antes de solicitar aprovação. O encaminhamento posterior aprovado de `system.run` reutiliza esse
plano armazenado, portanto edições em campos de comando/cwd/sessão depois que a solicitação de aprovação foi
criada são rejeitadas em vez de alterar o que o nó executa.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nós](/pt-BR/nodes)
