---
read_when:
    - Executando o host Node sem interface gráfica
    - Emparelhando um nó que não é macOS para system.run
summary: Referência da CLI para `openclaw node` (host de nó headless)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:20:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Execute um **host de nó sem interface** que se conecta ao WebSocket do Gateway e expõe
`system.run` / `system.which` nesta máquina.

## Por que usar um host de nó?

Use um host de nó quando quiser que agentes **executem comandos em outras máquinas** na sua
rede sem instalar ali um app complementar completo para macOS.

Casos de uso comuns:

- Executar comandos em máquinas Linux/Windows remotas (servidores de build, máquinas de laboratório, NAS).
- Manter exec **em sandbox** no Gateway, mas delegar execuções aprovadas a outros hosts.
- Fornecer um alvo de execução leve e sem interface para automação ou nós de CI.

A execução ainda é protegida por **aprovações de exec** e listas de permissões por agente no
host de nó, para que você possa manter o acesso a comandos com escopo definido e explícito.

## Proxy de navegador (configuração zero)

Hosts de nó anunciam automaticamente um proxy de navegador se `browser.enabled` não estiver
desabilitado no nó. Isso permite que o agente use automação de navegador nesse nó
sem configuração extra.

Por padrão, o proxy expõe a superfície normal de perfis de navegador do nó. Se você
definir `nodeHost.browserProxy.allowProfiles`, o proxy se torna restritivo:
direcionamentos a perfis fora da lista de permissões são rejeitados, e rotas de
criação/exclusão de perfis persistentes são bloqueadas pelo proxy.

Desabilite no nó, se necessário:

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
- `--tls-fingerprint <sha256>`: impressão digital esperada do certificado TLS (sha256)
- `--node-id <id>`: substituir o id do nó (limpa o token de pareamento)
- `--display-name <name>`: substituir o nome de exibição do nó

## Autenticação do Gateway para host de nó

`openclaw node run` e `openclaw node install` resolvem a autenticação do Gateway a partir de configuração/ambiente (sem flags `--token`/`--password` em comandos de nó):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificados primeiro.
- Depois, fallback da configuração local: `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host de nó intencionalmente não herda `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não for resolvido, a resolução de autenticação do nó falha de forma fechada (sem mascaramento por fallback remoto).
- Em `gateway.mode=remote`, os campos de cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também são elegíveis conforme as regras de precedência remota.
- A resolução de autenticação do host de nó só respeita variáveis de ambiente `OPENCLAW_GATEWAY_*`.

Para um nó que se conecta a um Gateway `ws://` em texto puro, loopback, literais de IP
privado, `.local` e hosts Tailnet `*.ts.net` são aceitos. Para outros nomes
confiáveis de DNS privado, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; sem
isso, a inicialização do nó falha de forma fechada e pede que você use `wss://`, um túnel SSH ou
Tailscale. Esta é uma opção explícita do ambiente do processo, não uma chave de configuração
de `openclaw.json`.
`openclaw node install` a persiste no serviço supervisionado do nó quando ela está
presente no ambiente do comando de instalação.

## Serviço (segundo plano)

Instale um host de nó sem interface como serviço de usuário.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host do WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta do WebSocket do Gateway (padrão: `18789`)
- `--tls`: usar TLS para a conexão com o Gateway
- `--tls-fingerprint <sha256>`: impressão digital esperada do certificado TLS (sha256)
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

Use `openclaw node run` para um host de nó em primeiro plano (sem serviço).

Comandos de serviço aceitam `--json` para saída legível por máquina.

O host de nó tenta novamente reinicializações do Gateway e fechamentos de rede dentro do processo. Se o
Gateway relatar uma pausa terminal de autenticação por token/senha/bootstrap, o host de nó
registra os detalhes do fechamento e sai com código diferente de zero para que launchd/systemd possa reiniciá-lo com
configuração e credenciais atualizadas. Pausas que exigem pareamento permanecem no fluxo
em primeiro plano para que a solicitação pendente possa ser aprovada.

## Pareamento

A primeira conexão cria uma solicitação pendente de pareamento de dispositivo (`role: node`) no Gateway.
Aprove-a via:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Em redes de nós estritamente controladas, o operador do Gateway pode optar explicitamente
por aprovar automaticamente o pareamento inicial de nós a partir de CIDRs confiáveis:

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

Isso fica desabilitado por padrão. Aplica-se apenas a pareamento novo com `role: node`
sem escopos solicitados. Clientes operador/navegador, Control UI, WebChat e atualizações de função,
escopo, metadados ou chave pública ainda exigem aprovação manual.

Se o nó tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

O host de nó armazena seu id de nó, token, nome de exibição e informações de conexão do Gateway em
`~/.openclaw/node.json`.

## Aprovações de exec

`system.run` é controlado por aprovações locais de exec:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, ou
  `~/.openclaw/exec-approvals.json` quando a variável não estiver definida
- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar a partir do Gateway)

Para exec assíncrono aprovado em nó, o OpenClaw prepara um `systemRunPlan` canônico
antes de solicitar confirmação. O encaminhamento posterior aprovado de `system.run` reutiliza esse
plano armazenado, então edições nos campos de comando/cwd/sessão depois que a solicitação de aprovação foi
criada são rejeitadas em vez de alterar o que o nó executa.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nós](/pt-BR/nodes)
