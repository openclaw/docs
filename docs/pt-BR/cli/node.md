---
read_when:
    - Executando o host Node sem interface gráfica
    - Pareamento de um Node não macOS para `system.run`
summary: Referência da CLI para `openclaw node` (host de Node sem interface gráfica)
title: Node
x-i18n:
    generated_at: "2026-07-11T23:49:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Execute um **host Node sem interface gráfica** que se conecta ao WebSocket do Gateway e disponibiliza
`system.run` / `system.which` nesta máquina.

## Por que usar um host Node?

Use um host Node quando quiser que agentes **executem comandos em outras máquinas** da sua
rede sem instalar nelas um aplicativo complementar completo para macOS.

Casos de uso comuns:

- Executar comandos em máquinas Linux/Windows remotas (servidores de compilação, máquinas de laboratório, NAS).
- Manter a execução **em sandbox** no Gateway, mas delegar execuções aprovadas a outros hosts.
- Fornecer um destino de execução leve e sem interface gráfica para automação ou nós de CI.

A execução continua protegida por **aprovações de execução** e listas de permissões por agente no
host Node, permitindo manter o acesso a comandos restrito e explícito.

`openclaw node run` pode publicar ferramentas fornecidas por plugins ou pelo MCP após estabelecer a conexão.
Por padrão, o Gateway confia nos descritores do Node emparelhado, mas exige
que o comando de cada descritor permaneça na superfície de comandos aprovada do Node. O
agente vê cada descritor aceito como uma ferramenta normal de plugin, mas a execução ainda
passa por `node.invoke`; portanto, desconectar o Node remove a ferramenta das novas
execuções de agentes. Operadores do Gateway podem desativar a publicação com
`gateway.nodes.pluginTools.enabled: false`.

Para ferramentas MCP declarativas, adicione o formato normal de servidor MCP em
`nodeHost.mcp.servers` no `openclaw.json` da máquina do Node e reinicie o
host Node. O Node declara a família de comandos `mcp.tools.call.v1`, sujeita a aprovação,
e publica as ferramentas listadas após estabelecer a conexão; alterar posteriormente a lista de servidores
não exige um novo emparelhamento. Consulte
[Servidores MCP hospedados em Node](/pt-BR/nodes#node-hosted-mcp-servers).

## Proxy de navegador (sem configuração)

Os hosts Node anunciam automaticamente um proxy de navegador se `browser.enabled` não estiver
desativado no Node. Isso permite que o agente use automação de navegador nesse Node
sem configuração adicional.

Por padrão, o proxy disponibiliza a superfície normal de perfis de navegador do Node. Se você
definir `nodeHost.browserProxy.allowProfiles`, o proxy se tornará restritivo:
o direcionamento a perfis fora da lista de permissões será rejeitado, e as rotas de
criação/exclusão de perfis persistentes serão bloqueadas pelo proxy.

Desative-o no Node, se necessário:

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
- `--context-path <path>`: caminho de contexto do WebSocket do Gateway (por exemplo, `/openclaw-gw`). Anexado à URL do WebSocket.
- `--tls`: usar TLS para a conexão com o Gateway
- `--no-tls`: forçar uma conexão em texto simples com o Gateway, mesmo quando a configuração local do Gateway habilitar TLS
- `--tls-fingerprint <sha256>`: impressão digital esperada do certificado TLS (sha256)
- `--node-id <id>`: substituir o ID legado da instância cliente armazenado em `node.json` (não redefine o emparelhamento)
- `--display-name <name>`: substituir o nome de exibição do Node

## Autenticação do Gateway para o host Node

`openclaw node run` e `openclaw node install` resolvem a autenticação do Gateway pela configuração/ambiente (não há flags `--token`/`--password` nos comandos de Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificados primeiro.
- Em seguida, é usado o fallback da configuração local: `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host Node intencionalmente não herda `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado por meio de SecretRef e não for resolvido, a resolução da autenticação do Node falhará de forma segura (sem um fallback remoto que oculte a falha).
- Em `gateway.mode=remote`, os campos do cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também podem ser usados conforme as regras de precedência remota.
- A resolução da autenticação do host Node considera apenas as variáveis de ambiente `OPENCLAW_GATEWAY_*`.

Para um Node que se conecta a um Gateway `ws://` em texto simples, são aceitos local loopback, literais de IP
privado, `.local` e hosts `*.ts.net` da Tailnet. Para outros
nomes DNS privados confiáveis, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; sem
isso, a inicialização do Node falha de forma segura e solicita o uso de `wss://`, um túnel SSH ou
Tailscale. Essa é uma opção habilitada pelo ambiente do processo, não uma chave de configuração do
`openclaw.json`.
`openclaw node install` a mantém no serviço supervisionado do Node quando ela está
presente no ambiente do comando de instalação.

## Serviço (segundo plano)

Instale um host Node sem interface gráfica como serviço do usuário (launchd no macOS, systemd no
Linux e Agendador de Tarefas do Windows no Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host do WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta do WebSocket do Gateway (padrão: `18789`)
- `--context-path <path>`: caminho de contexto do WebSocket do Gateway (por exemplo, `/openclaw-gw`). Anexado à URL do WebSocket.
- `--tls`: usar TLS para a conexão com o Gateway
- `--tls-fingerprint <sha256>`: impressão digital esperada do certificado TLS (sha256)
- `--node-id <id>`: substituir o ID legado da instância cliente armazenado em `node.json` (não redefine o emparelhamento)
- `--display-name <name>`: substituir o nome de exibição do Node
- `--runtime <runtime>`: ambiente de execução do serviço (`node` ou `bun`)
- `--force`: reinstalar/sobrescrever se já estiver instalado

Gerencie o serviço:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Use `openclaw node run` para executar um host Node em primeiro plano (sem serviço).

Os comandos de serviço aceitam `--json` para produzir uma saída legível por máquina.

O host Node tenta novamente, no mesmo processo, quando o Gateway reinicia ou quando a conexão de rede é encerrada. Se o
Gateway informar uma pausa terminal de autenticação por token/senha/inicialização, o host Node
registra os detalhes do encerramento e termina com um código diferente de zero para que launchd/systemd/Agendador de Tarefas
possa reiniciá-lo com configuração e credenciais atualizadas. As pausas que exigem emparelhamento permanecem no
fluxo em primeiro plano para que a solicitação pendente possa ser aprovada.

## Emparelhamento

A primeira conexão cria uma solicitação pendente de emparelhamento de dispositivo (`role: node`) no Gateway.

Quando o host do Gateway consegue acessar o host Node por SSH de modo não interativo (mesmo usuário,
chave de host confiável), a solicitação pendente é aprovada automaticamente: o Gateway
executa `openclaw node identity --json` no host Node por SSH e aprova quando
a chave do dispositivo corresponde exatamente. Isso é habilitado por padrão; consulte
[Aprovação automática de dispositivo verificada por SSH](/pt-BR/gateway/pairing#ssh-verified-device-auto-approval-default)
para conhecer os requisitos e saber como desativá-la (`gateway.nodes.pairing.sshVerify: false`).

Caso contrário, aprove manualmente por meio de:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Inspecione a identidade local do Node que o Gateway verifica:

```bash
openclaw node identity --json
```

Esse comando exibe o ID do dispositivo e a chave pública de `identity/device.json` e nunca
cria nem modifica arquivos de identidade.

Em redes de Nodes rigidamente controladas, o operador do Gateway pode habilitar explicitamente
a aprovação automática do primeiro emparelhamento de Nodes provenientes de CIDRs confiáveis:

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

Isso é desativado por padrão (`autoApproveCidrs` não é definido). Aplica-se somente ao
novo emparelhamento de `role: node`, sem escopos solicitados, proveniente de um IP de cliente no qual o
Gateway confia. Clientes de operador/navegador, Control UI, WebChat e atualizações de função,
escopo, metadados ou chave pública ainda exigem aprovação manual.

Se o Node tentar novamente o emparelhamento com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

### Estado da identidade e do emparelhamento

O Node sem interface gráfica separa o ID legado da instância cliente da identidade assinada do dispositivo
que o Gateway usa para emparelhamento e roteamento. Esses arquivos ficam no
diretório de estado do OpenClaw (`~/.openclaw` por padrão, ou `$OPENCLAW_STATE_DIR`
quando definido):

| Arquivo                     | Finalidade                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node.json`                 | ID da instância cliente na chave legada `nodeId`, nome de exibição e metadados da conexão com o Gateway. O cliente envia esse valor como `instanceId`. |
| `identity/device.json`      | Par de chaves Ed25519 assinado e ID de dispositivo derivado. Para conexões assinadas, esse ID de dispositivo é o ID do Node roteado e a identidade de emparelhamento. |
| `identity/device-auth.json` | Tokens do dispositivo emparelhado, indexados por ID criptográfico do dispositivo e função.                                                        |

`--node-id` altera somente o ID da instância cliente em `node.json`. Ele não
altera o ID criptográfico do dispositivo nem limpa a autenticação de emparelhamento. Da mesma forma, excluir apenas
`node.json` não redefine o emparelhamento. Para revogar e emparelhar novamente um Node:

1. No Gateway, execute `openclaw nodes remove --node <id|name|ip>`.
2. No Node, reinicie o serviço instalado com `openclaw node restart` ou
   interrompa e execute novamente o comando em primeiro plano `openclaw node run`. Isso inicia o
   fluxo de emparelhamento do dispositivo. Se `openclaw devices list` não mostrar uma solicitação
   e o Node informar `AUTH_DEVICE_TOKEN_MISMATCH`, reinicie-o ou execute-o novamente mais
   uma vez. A tentativa rejeitada limpa o token local que acabou de ser revogado; a próxima
   tentativa poderá solicitar o emparelhamento.
3. No Gateway, execute `openclaw devices list` e depois
   `openclaw devices approve <deviceRequestId>`.
4. Reinicie ou execute novamente o Node. Um cliente pausado para emparelhamento não retoma
   automaticamente após a aprovação; essa reconexão cria a solicitação separada
   de superfície de comandos.
5. No Gateway, execute `openclaw nodes pending` e depois
   `openclaw nodes approve <nodeRequestId>`.

Os dois IDs de solicitação são distintos. Uma política de CIDR confiável aplicável pode
aprovar automaticamente a etapa inicial de emparelhamento do dispositivo; a aprovação da superfície de comandos continua sendo
uma verificação separada.

Versões anteriores do OpenClaw podiam deixar um campo legado `token` em `node.json`.
O OpenClaw atual não usa esse campo e o remove na próxima vez que o host Node
salvar o arquivo. Mantenha ambos os arquivos em `identity/` privados; eles contêm o
par de chaves do dispositivo e tokens de autenticação.

## Aprovações de execução

`system.run` é controlado por aprovações locais de execução:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` ou
  `~/.openclaw/exec-approvals.json` quando a variável não está definida
- [Aprovações de execução](/pt-BR/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edite a partir do Gateway)

Para uma execução assíncrona aprovada no Node, o OpenClaw prepara um `systemRunPlan` canônico
antes de solicitar aprovação. O encaminhamento posterior e aprovado de `system.run` reutiliza esse
plano armazenado; portanto, edições nos campos de comando/cwd/sessão após a criação da solicitação
de aprovação são rejeitadas, em vez de alterar o que o Node executa.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
