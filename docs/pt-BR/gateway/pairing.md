---
read_when:
    - Implementando aprovações de pareamento de Node sem a interface do macOS
    - Adicionando fluxos de CLI para aprovar nós remotos
    - Estendendo o protocolo do Gateway com gerenciamento de Node
summary: Pareamento de Node gerenciado pelo Gateway (Opção B) para iOS e outros Nodes remotos
title: Pareamento gerenciado pelo Gateway
x-i18n:
    generated_at: "2026-04-30T09:50:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

No emparelhamento controlado pelo Gateway, o **Gateway** é a fonte da verdade para quais Nodes
têm permissão para entrar. UIs (app para macOS, clientes futuros) são apenas frontends que
aprovam ou rejeitam solicitações pendentes.

**Importante:** Nodes WS usam **emparelhamento de dispositivo** (função `node`) durante `connect`.
`node.pair.*` é um armazenamento de emparelhamento separado e **não** bloqueia o handshake WS.
Somente clientes que chamam explicitamente `node.pair.*` usam este fluxo.

## Conceitos

- **Solicitação pendente**: um Node pediu para entrar; requer aprovação.
- **Node emparelhado**: Node aprovado com um token de autenticação emitido.
- **Transporte**: o endpoint WS do Gateway encaminha solicitações, mas não decide
  associação. (O suporte legado à ponte TCP foi removido.)

## Como o emparelhamento funciona

1. Um Node se conecta ao WS do Gateway e solicita emparelhamento.
2. O Gateway armazena uma **solicitação pendente** e emite `node.pair.requested`.
3. Você aprova ou rejeita a solicitação (CLI ou UI).
4. Na aprovação, o Gateway emite um **novo token** (tokens são rotacionados ao reemparelhar).
5. O Node se reconecta usando o token e agora está “emparelhado”.

Solicitações pendentes expiram automaticamente após **5 minutos**.

## Fluxo de trabalho da CLI (adequado para headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra Nodes emparelhados/conectados e suas capacidades.

## Superfície da API (protocolo do Gateway)

Eventos:

- `node.pair.requested` — emitido quando uma nova solicitação pendente é criada.
- `node.pair.resolved` — emitido quando uma solicitação é aprovada/rejeitada/expirada.

Métodos:

- `node.pair.request` — cria ou reutiliza uma solicitação pendente.
- `node.pair.list` — lista Nodes pendentes + emparelhados (`operator.pairing`).
- `node.pair.approve` — aprova uma solicitação pendente (emite token).
- `node.pair.reject` — rejeita uma solicitação pendente.
- `node.pair.remove` — remove uma entrada obsoleta de Node emparelhado.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Notas:

- `node.pair.request` é idempotente por Node: chamadas repetidas retornam a mesma
  solicitação pendente.
- Solicitações repetidas para o mesmo Node pendente também atualizam os metadados
  armazenados do Node e o snapshot mais recente dos comandos declarados permitidos para visibilidade do operador.
- A aprovação **sempre** gera um token novo; nenhum token jamais é retornado por
  `node.pair.request`.
- Solicitações podem incluir `silent: true` como uma dica para fluxos de aprovação automática.
- `node.pair.approve` usa os comandos declarados da solicitação pendente para impor
  escopos de aprovação extras:
  - solicitação sem comandos: `operator.pairing`
  - solicitação de comando não exec: `operator.pairing` + `operator.write`
  - solicitação `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
O emparelhamento de Node é um fluxo de confiança e identidade, além da emissão de token. Ele **não** fixa a superfície de comandos ativa do Node por Node.

- Comandos ativos do Node vêm do que o Node declara ao se conectar depois que a política global de comandos de Node do Gateway (`gateway.nodes.allowCommands` e `denyCommands`) é aplicada.
- A política de permitir e perguntar de `system.run` por Node fica no Node em `exec.approvals.node.*`, não no registro de emparelhamento.

</Warning>

## Controle de comandos de Node (2026.3.31+)

<Warning>
**Alteração incompatível:** A partir de `2026.3.31`, comandos de Node ficam desabilitados até que o emparelhamento de Node seja aprovado. O emparelhamento de dispositivo sozinho não é mais suficiente para expor comandos de Node declarados.
</Warning>

Quando um Node se conecta pela primeira vez, o emparelhamento é solicitado automaticamente. Até que a solicitação de emparelhamento seja aprovada, todos os comandos pendentes desse Node são filtrados e não serão executados. Depois que a confiança é estabelecida por meio da aprovação do emparelhamento, os comandos declarados do Node ficam disponíveis sujeitos à política normal de comandos.

Isso significa:

- Nodes que antes dependiam apenas do emparelhamento de dispositivo para expor comandos agora precisam concluir o emparelhamento de Node.
- Comandos enfileirados antes da aprovação do emparelhamento são descartados, não adiados.

## Limites de confiança de eventos de Node (2026.3.31+)

<Warning>
**Alteração incompatível:** Execuções originadas por Node agora permanecem em uma superfície confiável reduzida.
</Warning>

Resumos originados por Node e eventos de sessão relacionados são restritos à superfície confiável pretendida. Fluxos acionados por notificações ou por Node que antes dependiam de acesso mais amplo a ferramentas de host ou sessão podem precisar de ajuste. Esse reforço garante que eventos de Node não possam escalar para acesso a ferramentas em nível de host além do que o limite de confiança do Node permite.

Atualizações duráveis de presença de Node seguem o mesmo limite de identidade. O evento `node.presence.alive` é
aceito apenas de sessões autenticadas de dispositivo Node e atualiza metadados de emparelhamento somente quando a
identidade dispositivo/Node já está emparelhada. Valores `client.id` autodeclarados não são suficientes para gravar
estado de última visualização.

## Aprovação automática (app para macOS)

O app para macOS pode opcionalmente tentar uma **aprovação silenciosa** quando:

- a solicitação está marcada como `silent`, e
- o app consegue verificar uma conexão SSH ao host do Gateway usando o mesmo usuário.

Se a aprovação silenciosa falhar, ele recorre ao prompt normal “Aprovar/Rejeitar”.

## Aprovação automática de dispositivo por CIDR confiável

O emparelhamento de dispositivo WS para `role: node` permanece manual por padrão. Para redes
privadas de Nodes em que o Gateway já confia no caminho de rede, operadores podem
optar por CIDRs explícitos ou IPs exatos:

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

Limite de segurança:

- Desabilitado quando `gateway.nodes.pairing.autoApproveCidrs` não está definido.
- Não existe modo de aprovação automática geral para LAN ou rede privada.
- Somente emparelhamento novo de dispositivo `role: node` sem escopos solicitados é elegível.
- Clientes operador, navegador, Control UI e WebChat permanecem manuais.
- Atualizações de função, escopo, metadados e chave pública permanecem manuais.
- Caminhos de cabeçalho de proxy confiável por loopback no mesmo host não são elegíveis porque esse
  caminho pode ser falsificado por chamadores locais.

## Aprovação automática de atualização de metadados

Quando um dispositivo já emparelhado se reconecta apenas com alterações de metadados não sensíveis
(por exemplo, nome de exibição ou dicas de plataforma do cliente), o OpenClaw trata
isso como um `metadata-upgrade`. A aprovação automática silenciosa é restrita: aplica-se apenas
a reconexões locais confiáveis que não sejam de navegador e que já provaram posse de credenciais locais
ou compartilhadas, incluindo reconexões de app nativo no mesmo host após alterações de metadados de versão do SO. Clientes navegador/Control UI e clientes remotos ainda
usam o fluxo explícito de reaprovação. Atualizações de escopo (leitura para gravação/admin) e
alterações de chave pública **não** são elegíveis para aprovação automática de metadata-upgrade —
elas permanecem como solicitações explícitas de reaprovação.

## Auxiliares de emparelhamento por QR

`/pair qr` renderiza a carga útil de emparelhamento como mídia estruturada para que clientes móveis e
de navegador possam escaneá-la diretamente.

Excluir um dispositivo também limpa quaisquer solicitações pendentes de emparelhamento obsoletas para esse
id de dispositivo, de modo que `nodes pending` não mostra linhas órfãs após uma revogação.

## Localidade e cabeçalhos encaminhados

O emparelhamento do Gateway trata uma conexão como loopback somente quando tanto o socket bruto
quanto qualquer evidência de proxy upstream concordam. Se uma solicitação chega por loopback, mas
carrega cabeçalhos `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
que apontam para uma origem não local, essa evidência de cabeçalho encaminhado desqualifica
a alegação de localidade loopback. O caminho de emparelhamento então requer aprovação explícita
em vez de tratar silenciosamente a solicitação como uma conexão do mesmo host. Consulte
[Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth) para a regra equivalente em
autenticação de operador.

## Armazenamento (local, privado)

O estado de emparelhamento é armazenado no diretório de estado do Gateway (padrão `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se você substituir `OPENCLAW_STATE_DIR`, a pasta `nodes/` se move junto.

Notas de segurança:

- Tokens são segredos; trate `paired.json` como sensível.
- Rotacionar um token requer reaprovação (ou excluir a entrada do Node).

## Comportamento do transporte

- O transporte é **sem estado**; ele não armazena associação.
- Se o Gateway estiver offline ou o emparelhamento estiver desabilitado, os Nodes não conseguem emparelhar.
- Se o Gateway estiver em modo remoto, o emparelhamento ainda acontece contra o armazenamento do Gateway remoto.

## Relacionados

- [Emparelhamento de canais](/pt-BR/channels/pairing)
- [Nodes](/pt-BR/nodes)
- [CLI de dispositivos](/pt-BR/cli/devices)
