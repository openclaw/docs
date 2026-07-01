---
read_when:
    - Executando o host Node sem interface gráfica
    - Emparelhar um nó que não é macOS para system.run
summary: Referência da CLI para `openclaw node` (host Node sem interface gráfica)
title: Node
x-i18n:
    generated_at: "2026-07-01T12:51:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Execute um **host de Node sem interface** que se conecta ao WebSocket do Gateway e expõe
`system.run` / `system.which` nesta máquina.

## Por que usar um host de Node?

Use um host de Node quando quiser que agentes **executem comandos em outras máquinas** na sua
rede sem instalar nelas um app complementar completo para macOS.

Casos de uso comuns:

- Executar comandos em máquinas Linux/Windows remotas (servidores de build, máquinas de laboratório, NAS).
- Manter o exec **em sandbox** no Gateway, mas delegar execuções aprovadas a outros hosts.
- Fornecer um destino de execução leve e sem interface para automação ou nós de CI.

A execução ainda é protegida por **aprovações de exec** e allowlists por agente no
host de Node, para que você mantenha o acesso a comandos escopado e explícito.

## Proxy de navegador (configuração zero)

Hosts de Node anunciam automaticamente um proxy de navegador se `browser.enabled` não estiver
desativado no nó. Isso permite que o agente use automação de navegador nesse nó
sem configuração extra.

Por padrão, o proxy expõe a superfície normal de perfis de navegador do nó. Se você
definir `nodeHost.browserProxy.allowProfiles`, o proxy passa a ser restritivo:
o direcionamento para perfis fora da allowlist é rejeitado, e rotas de
criação/exclusão de perfis persistentes são bloqueadas pelo proxy.

Desative no nó se necessário:

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

- `--host <host>`: Host do WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: Porta do WebSocket do Gateway (padrão: `18789`)
- `--context-path <path>`: Caminho de contexto do WebSocket do Gateway (por exemplo, `/openclaw-gw`). Anexado à URL do WebSocket.
- `--tls`: Usar TLS para a conexão com o Gateway
- `--tls-fingerprint <sha256>`: Impressão digital esperada do certificado TLS (sha256)
- `--node-id <id>`: Substituir o id do nó (limpa o token de pareamento)
- `--display-name <name>`: Substituir o nome de exibição do nó

## Autenticação do Gateway para host de Node

`openclaw node run` e `openclaw node install` resolvem a autenticação do Gateway a partir de config/env (sem flags `--token`/`--password` nos comandos de nó):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificados primeiro.
- Depois, fallback da configuração local: `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host de Node intencionalmente não herda `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver configurado explicitamente via SecretRef e não for resolvido, a resolução de autenticação do nó falha fechada (sem mascaramento por fallback remoto).
- Em `gateway.mode=remote`, os campos de cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também são elegíveis conforme as regras de precedência remota.
- A resolução de autenticação do host de Node honra somente variáveis de ambiente `OPENCLAW_GATEWAY_*`.

Para um nó se conectando a um Gateway `ws://` em texto claro, loopback, literais
de IP privado, `.local` e hosts Tailnet `*.ts.net` são aceitos. Para outros
nomes de DNS privado confiáveis, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; sem
isso, a inicialização do nó falha fechada e solicita que você use `wss://`, um túnel SSH ou
Tailscale. Esta é uma adesão por ambiente de processo, não uma chave de configuração
`openclaw.json`.
`openclaw node install` a persiste no serviço de nó supervisionado quando ela está
presente no ambiente do comando de instalação.

## Serviço (segundo plano)

Instale um host de Node sem interface como serviço de usuário.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: Host do WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: Porta do WebSocket do Gateway (padrão: `18789`)
- `--context-path <path>`: Caminho de contexto do WebSocket do Gateway (por exemplo, `/openclaw-gw`). Anexado à URL do WebSocket.
- `--tls`: Usar TLS para a conexão com o Gateway
- `--tls-fingerprint <sha256>`: Impressão digital esperada do certificado TLS (sha256)
- `--node-id <id>`: Substituir o id do nó (limpa o token de pareamento)
- `--display-name <name>`: Substituir o nome de exibição do nó
- `--runtime <runtime>`: Runtime do serviço (`node` ou `bun`)
- `--force`: Reinstalar/substituir se já estiver instalado

Gerencie o serviço:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Use `openclaw node run` para um host de Node em primeiro plano (sem serviço).

Comandos de serviço aceitam `--json` para saída legível por máquina.

O host de Node tenta novamente reinicializações do Gateway e fechamentos de rede dentro do processo. Se o
Gateway relatar uma pausa terminal de autenticação por token/senha/bootstrap, o host de Node
registra o detalhe do fechamento e sai com código diferente de zero para que launchd/systemd possa reiniciá-lo com
configuração e credenciais novas. Pausas que exigem pareamento permanecem no fluxo em primeiro plano
para que a solicitação pendente possa ser aprovada.

## Pareamento

A primeira conexão cria uma solicitação pendente de pareamento de dispositivo (`role: node`) no Gateway.
Aprove-a via:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Em redes de nós rigidamente controladas, o operador do Gateway pode aderir explicitamente
à aprovação automática de pareamento de nós pela primeira vez a partir de CIDRs confiáveis:

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

Isso vem desativado por padrão. Aplica-se somente a pareamento novo com `role: node` e
sem escopos solicitados. Clientes operador/navegador, Control UI, WebChat, e upgrades de função,
escopo, metadados ou chave pública ainda exigem aprovação manual.

Se o nó tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

O host de Node armazena seu id de nó, token, nome de exibição e informações de conexão do Gateway em
`~/.openclaw/node.json`.

## Aprovações de exec

`system.run` é controlado por aprovações de exec locais:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, ou
  `~/.openclaw/exec-approvals.json` quando a variável não estiver definida
- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar a partir do Gateway)

Para exec assíncrono aprovado em nó, o OpenClaw prepara um `systemRunPlan` canônico
antes de solicitar confirmação. O encaminhamento `system.run` aprovado depois reutiliza esse
plano armazenado, então edições nos campos de comando/cwd/sessão após a criação da solicitação de aprovação
são rejeitadas em vez de alterar o que o nó executa.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Nós](/pt-BR/nodes)
