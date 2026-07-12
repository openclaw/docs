---
read_when:
    - Executando o host Node sem interface gráfica
    - Emparelhamento de um Node não macOS para system.run
summary: Referência da CLI para `openclaw node` (host de Node sem interface gráfica)
title: Node
x-i18n:
    generated_at: "2026-07-12T21:30:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c350655e902f36ecf578c98edf0583ee6621dea6b916cc8da08c35673fef8e49
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Execute um **host de Node sem interface gráfica** que se conecta ao WebSocket do Gateway e expõe
`system.run` / `system.which` nesta máquina.

No macOS, o aplicativo da barra de menus já incorpora esse runtime de host de Node em sua própria
conexão de Node e adiciona recursos nativos do Mac. Use `openclaw node run` em um
Mac somente quando quiser intencionalmente um Node sem interface gráfica e sem o aplicativo. Executar
ambos cria duas identidades de Node para a mesma máquina.

## Por que usar um host de Node?

Use um host de Node quando quiser que agentes **executem comandos em outras máquinas** da sua
rede sem instalar nelas um aplicativo complementar completo para macOS.

Casos de uso comuns:

- Executar comandos em máquinas Linux/Windows remotas (servidores de compilação, máquinas de laboratório, NAS).
- Manter a execução **em sandbox** no Gateway, mas delegar execuções aprovadas a outros hosts.
- Fornecer um destino de execução leve e sem interface gráfica para automação ou Nodes de CI.

A execução continua protegida por **aprovações de execução** e listas de permissões por agente no
host de Node, permitindo manter o acesso a comandos com escopo restrito e explícito.

`openclaw node run` pode publicar ferramentas fornecidas por plugins ou MCP depois de se conectar.
Por padrão, o Gateway confia nos descritores do Node pareado, mas exige que
o comando de cada descritor permaneça na superfície de comandos aprovada do Node. O
agente vê cada descritor aceito como uma ferramenta normal de plugin, mas a execução ainda
passa por `node.invoke`; portanto, desconectar o Node remove a ferramenta das novas
execuções de agentes. Os operadores do Gateway podem desativar a publicação com
`gateway.nodes.pluginTools.enabled: false`.

Para ferramentas MCP declarativas, adicione a estrutura normal do servidor MCP em
`nodeHost.mcp.servers` no `openclaw.json` da máquina do Node e reinicie o
host de Node. O Node declara a família de comandos `mcp.tools.call.v1`, sujeita a aprovação,
e publica as ferramentas listadas após se conectar; alterar posteriormente a lista de servidores
não exige um novo pareamento. Consulte
[Servidores MCP hospedados no Node](/pt-BR/nodes#node-hosted-mcp-servers).

## Proxy de navegador (sem configuração)

Os hosts de Node anunciam automaticamente um proxy de navegador se `browser.enabled` não estiver
desativado no Node. Isso permite que o agente use automação de navegador nesse Node
sem configuração adicional.

Por padrão, o proxy expõe a superfície normal de perfis de navegador do Node. Se você
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
- `--context-path <path>`: caminho de contexto do WebSocket do Gateway (por exemplo, `/openclaw-gw`). Acrescentado à URL do WebSocket.
- `--tls`: usar TLS para a conexão com o Gateway
- `--no-tls`: forçar uma conexão em texto simples com o Gateway, mesmo quando a configuração local do Gateway habilita TLS
- `--tls-fingerprint <sha256>`: impressão digital esperada do certificado TLS (sha256)
- `--node-id <id>`: substituir o ID legado da instância do cliente armazenado em `node.json` (não redefine o pareamento)
- `--display-name <name>`: substituir o nome de exibição do Node

## Autenticação do Gateway para o host de Node

`openclaw node run` e `openclaw node install` resolvem a autenticação do Gateway pela configuração/variáveis de ambiente (sem flags `--token`/`--password` nos comandos de Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` são verificadas primeiro.
- Em seguida, usa-se a configuração local como fallback: `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host de Node não herda intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` estiver configurado explicitamente por meio de SecretRef e não for resolvido, a resolução da autenticação do Node falhará de modo seguro (sem fallback remoto que oculte a falha).
- Em `gateway.mode=remote`, os campos do cliente remoto (`gateway.remote.token` / `gateway.remote.password`) também são elegíveis conforme as regras de precedência remota.
- A resolução da autenticação do host de Node considera somente as variáveis de ambiente `OPENCLAW_GATEWAY_*`.

Para um Node que se conecta a um Gateway `ws://` em texto simples, são aceitos loopback, literais de IP
privado, `.local` e hosts `*.ts.net` da Tailnet. Para outros
nomes DNS privados confiáveis, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; sem
isso, a inicialização do Node falha de modo seguro e solicita o uso de `wss://`, um túnel SSH ou
Tailscale. Essa é uma adesão explícita no ambiente do processo, não uma chave de configuração do
`openclaw.json`.
`openclaw node install` a mantém no serviço supervisionado do Node quando ela está
presente no ambiente do comando de instalação.

## Serviço (segundo plano)

Instale um host de Node sem interface gráfica como serviço do usuário (launchd no macOS, systemd no
Linux, Agendador de Tarefas do Windows no Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opções:

- `--host <host>`: host do WebSocket do Gateway (padrão: `127.0.0.1`)
- `--port <port>`: porta do WebSocket do Gateway (padrão: `18789`)
- `--context-path <path>`: caminho de contexto do WebSocket do Gateway (por exemplo, `/openclaw-gw`). Acrescentado à URL do WebSocket.
- `--tls`: usar TLS para a conexão com o Gateway
- `--tls-fingerprint <sha256>`: impressão digital esperada do certificado TLS (sha256)
- `--node-id <id>`: substituir o ID legado da instância do cliente armazenado em `node.json` (não redefine o pareamento)
- `--display-name <name>`: substituir o nome de exibição do Node
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

Use `openclaw node run` para um host de Node em primeiro plano (sem serviço).

Os comandos de serviço aceitam `--json` para saída legível por máquina.

O host de Node repete as tentativas após reinicializações do Gateway e encerramentos de rede no mesmo processo. Se o
Gateway informar uma pausa terminal de autenticação por token/senha/bootstrap, o host de Node
registra os detalhes do encerramento e termina com código diferente de zero, para que launchd/systemd/Agendador de Tarefas
possa reiniciá-lo com configurações e credenciais atualizadas. As pausas que exigem pareamento permanecem no
fluxo em primeiro plano para que a solicitação pendente possa ser aprovada.

## Pareamento

A primeira conexão cria uma solicitação pendente de pareamento de dispositivo (`role: node`) no Gateway.

Quando o host do Gateway consegue acessar o host de Node por SSH de forma não interativa (mesmo usuário,
chave de host confiável), a solicitação pendente é aprovada automaticamente: o Gateway
executa `openclaw node identity --json` no host de Node por SSH e aprova quando
há uma correspondência exata da chave do dispositivo. Isso é habilitado por padrão; consulte
[Aprovação automática de dispositivos verificada por SSH](/pt-BR/gateway/pairing#ssh-verified-device-auto-approval-default)
para conhecer os requisitos e saber como desativá-la (`gateway.nodes.pairing.sshVerify: false`).

Caso contrário, aprove manualmente por meio de:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Inspecione a identidade local do Node usada pelo Gateway para verificação:

```bash
openclaw node identity --json
```

Esse comando exibe o ID do dispositivo e a chave pública de `identity/device.json` e nunca
cria nem modifica arquivos de identidade.

Em redes de Nodes rigidamente controladas, o operador do Gateway pode aderir explicitamente
à aprovação automática do primeiro pareamento de Nodes provenientes de CIDRs confiáveis:

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
primeiro pareamento `role: node`, sem escopos solicitados, proveniente de um IP de cliente no qual o
Gateway confia. Clientes operadores/de navegador, Control UI, WebChat e atualizações de função,
escopo, metadados ou chave pública ainda exigem aprovação manual.

Se o Node tentar novamente o pareamento com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

### Estado de identidade e pareamento

O Node sem interface gráfica separa seu ID legado da instância do cliente da identidade de dispositivo
assinada que o Gateway usa para pareamento e roteamento. Esses arquivos ficam no
diretório de estado do OpenClaw (`~/.openclaw` por padrão, ou `$OPENCLAW_STATE_DIR`
quando definido):

| Arquivo                     | Finalidade                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node.json`                 | ID da instância do cliente na chave legada `nodeId`, nome de exibição e metadados de conexão com o Gateway. O cliente envia esse valor como `instanceId`.           |
| `identity/device.json`      | Par de chaves Ed25519 assinado e ID de dispositivo derivado. Para conexões assinadas, esse ID de dispositivo é o ID de Node roteado e a identidade de pareamento.   |
| `identity/device-auth.json` | Tokens de dispositivos pareados, indexados pelo ID criptográfico do dispositivo e pela função.                                                                     |

`--node-id` altera somente o ID da instância do cliente em `node.json`. Ele não
altera o ID criptográfico do dispositivo nem limpa a autenticação do pareamento. Da mesma forma, excluir apenas
`node.json` não redefine o pareamento. Para revogar e parear novamente um Node:

1. No Gateway, execute `openclaw nodes remove --node <id|name|ip>`.
2. No Node, reinicie o serviço instalado com `openclaw node restart` ou
   interrompa e execute novamente o comando em primeiro plano `openclaw node run`. Isso inicia o
   fluxo de pareamento de dispositivo. Se `openclaw devices list` não mostrar uma solicitação
   e o Node informar `AUTH_DEVICE_TOKEN_MISMATCH`, reinicie-o ou execute-o novamente mais
   uma vez. A tentativa rejeitada limpa o token local que agora está revogado; a próxima
   tentativa pode solicitar o pareamento.
3. No Gateway, execute `openclaw devices list` e depois
   `openclaw devices approve <deviceRequestId>`.
4. Reinicie ou execute novamente o Node. Um cliente pausado para pareamento não retoma
   automaticamente após a aprovação; essa reconexão cria a solicitação separada da
   superfície de comandos.
5. No Gateway, execute `openclaw nodes pending` e depois
   `openclaw nodes approve <nodeRequestId>`.

Os dois IDs de solicitação são distintos. Uma política aplicável de CIDR confiável pode
aprovar automaticamente a etapa inicial de pareamento do dispositivo; a aprovação da superfície de comandos continua sendo
uma verificação separada.

Versões anteriores do OpenClaw podiam deixar um campo legado `token` em `node.json`.
A versão atual do OpenClaw não usa esse campo e o remove na próxima vez que o host de Node
salvar o arquivo. Mantenha privados os dois arquivos em `identity/`; eles contêm o
par de chaves do dispositivo e os tokens de autenticação.

## Aprovações de execução

`system.run` é controlado por aprovações locais de execução:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, ou
  `~/.openclaw/exec-approvals.json` quando a variável não estiver definida
- [Aprovações de execução](/pt-BR/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar pelo Gateway)

Para a execução assíncrona aprovada no Node, o OpenClaw prepara um `systemRunPlan` canônico
antes de solicitar aprovação. O encaminhamento posterior aprovado de `system.run` reutiliza esse plano
armazenado; assim, edições nos campos de comando/cwd/sessão após a criação da solicitação de
aprovação são rejeitadas, em vez de alterar o que o Node executa.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
