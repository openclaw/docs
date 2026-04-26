---
read_when:
    - Implementando aprovações de emparelhamento de Node sem interface do macOS
    - Adicionando fluxos de CLI para aprovar Nodes remotos
    - Estendendo o protocolo do Gateway com gerenciamento de Nodes
summary: Emparelhamento de Node controlado pelo Gateway (Opção B) para iOS e outros Nodes remotos
title: Emparelhamento controlado pelo Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

No emparelhamento controlado pelo Gateway, o **Gateway** é a fonte de verdade sobre quais Nodes
têm permissão para entrar. UIs (app do macOS, clientes futuros) são apenas frontends que
aprovam ou rejeitam solicitações pendentes.

**Importante:** Nodes WS usam **emparelhamento de dispositivo** (função `node`) durante `connect`.
`node.pair.*` é um armazenamento de emparelhamento separado e **não** controla o handshake de WS.
Somente clientes que chamam explicitamente `node.pair.*` usam esse fluxo.

## Conceitos

- **Solicitação pendente**: um Node pediu para entrar; requer aprovação.
- **Node emparelhado**: Node aprovado com um token de autenticação emitido.
- **Transporte**: o endpoint WS do Gateway encaminha solicitações, mas não decide
  associação. (O suporte legado à ponte TCP foi removido.)

## Como o emparelhamento funciona

1. Um Node se conecta ao Gateway WS e solicita emparelhamento.
2. O Gateway armazena uma **solicitação pendente** e emite `node.pair.requested`.
3. Você aprova ou rejeita a solicitação (CLI ou UI).
4. Na aprovação, o Gateway emite um **novo token** (tokens são rotacionados em novo emparelhamento).
5. O Node se reconecta usando o token e agora está “emparelhado”.

Solicitações pendentes expiram automaticamente após **5 minutos**.

## Fluxo de CLI (compatível com modo headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra Nodes emparelhados/conectados e suas capacidades.

## Superfície de API (protocolo do gateway)

Eventos:

- `node.pair.requested` — emitido quando uma nova solicitação pendente é criada.
- `node.pair.resolved` — emitido quando uma solicitação é aprovada/rejeitada/expirada.

Métodos:

- `node.pair.request` — cria ou reutiliza uma solicitação pendente.
- `node.pair.list` — lista Nodes pendentes + emparelhados (`operator.pairing`).
- `node.pair.approve` — aprova uma solicitação pendente (emite token).
- `node.pair.reject` — rejeita uma solicitação pendente.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Observações:

- `node.pair.request` é idempotente por Node: chamadas repetidas retornam a mesma
  solicitação pendente.
- Solicitações repetidas para o mesmo Node pendente também atualizam os metadados
  armazenados do Node e o snapshot mais recente dos comandos declarados permitidos por allowlist para visibilidade do operador.
- A aprovação **sempre** gera um token novo; nenhum token é retornado por
  `node.pair.request`.
- Solicitações podem incluir `silent: true` como dica para fluxos de aprovação automática.
- `node.pair.approve` usa os comandos declarados da solicitação pendente para impor
  escopos extras de aprovação:
  - solicitação sem comando: `operator.pairing`
  - solicitação de comando sem exec: `operator.pairing` + `operator.write`
  - solicitação `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- O emparelhamento de Node é um fluxo de confiança/identidade mais emissão de token.
- Ele **não** fixa a superfície de comandos ativa do Node por Node.
- Os comandos ativos do Node vêm do que o Node declara ao conectar, depois que a
  política global de comandos de Node do gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) é aplicada.
- A política allow/ask por Node de `system.run` fica no próprio Node em
  `exec.approvals.node.*`, não no registro de emparelhamento.

## Controle de comandos de Node (2026.3.31+)

<Warning>
**Mudança incompatível:** A partir de `2026.3.31`, comandos de Node ficam desabilitados até que o emparelhamento do Node seja aprovado. Somente o emparelhamento de dispositivo não é mais suficiente para expor comandos declarados do Node.
</Warning>

Quando um Node se conecta pela primeira vez, o emparelhamento é solicitado automaticamente. Até que a solicitação de emparelhamento seja aprovada, todos os comandos de Node pendentes desse Node são filtrados e não serão executados. Quando a confiança é estabelecida por meio da aprovação do emparelhamento, os comandos declarados do Node ficam disponíveis, sujeitos à política normal de comandos.

Isso significa:

- Nodes que antes dependiam apenas do emparelhamento de dispositivo para expor comandos agora precisam concluir o emparelhamento de Node.
- Comandos enfileirados antes da aprovação do emparelhamento são descartados, não adiados.

## Limites de confiança de eventos de Node (2026.3.31+)

<Warning>
**Mudança incompatível:** Execuções originadas por Node agora permanecem em uma superfície confiável reduzida.
</Warning>

Resumos originados por Node e eventos de sessão relacionados são restritos à superfície confiável pretendida. Fluxos acionados por notificação ou pelo Node que antes dependiam de acesso mais amplo a ferramentas de host ou sessão podem precisar de ajuste. Esse hardening garante que eventos de Node não possam escalar para acesso a ferramentas em nível de host além do que o limite de confiança do Node permite.

## Aprovação automática (app do macOS)

O app do macOS pode opcionalmente tentar uma **aprovação silenciosa** quando:

- a solicitação está marcada como `silent`, e
- o app consegue verificar uma conexão SSH com o host do gateway usando o mesmo usuário.

Se a aprovação silenciosa falhar, ele volta ao prompt normal “Aprovar/Rejeitar”.

## Aprovação automática de dispositivo por CIDR confiável

O emparelhamento de dispositivo WS para `role: node` continua manual por padrão. Para redes privadas
de Node em que o Gateway já confia no caminho de rede, operadores podem fazer
opt-in com CIDRs explícitos ou IPs exatos:

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
- Não existe modo geral de aprovação automática para LAN ou rede privada.
- Somente emparelhamento inicial de dispositivo `role: node` sem escopos solicitados é elegível.
- Clientes operator, browser, Control UI e WebChat continuam manuais.
- Upgrades de função, escopo, metadados e chave pública continuam manuais.
- Caminhos de header de proxy confiável em loopback no mesmo host não são elegíveis porque esse
  caminho pode ser falsificado por chamadores locais.

## Aprovação automática de upgrade de metadados

Quando um dispositivo já emparelhado se reconecta com apenas mudanças não sensíveis
de metadados (por exemplo, nome de exibição ou dicas de plataforma do cliente), o OpenClaw trata
isso como um `metadata-upgrade`. A aprovação automática silenciosa é restrita: ela se aplica apenas
a reconexões locais confiáveis que não sejam de navegador e que já tenham provado posse de credenciais locais
ou compartilhadas, incluindo reconexões de app nativo no mesmo host após alterações de metadados de versão do SO.
Clientes browser/Control UI e clientes remotos ainda usam o fluxo explícito de reaprovação.
Upgrades de escopo (read para write/admin) e mudanças de chave pública **não** são elegíveis para aprovação automática de upgrade de metadados —
eles continuam como solicitações explícitas de reaprovação.

## Auxiliares de emparelhamento por QR

`/pair qr` renderiza a carga de emparelhamento como mídia estruturada para que clientes móveis e
de navegador possam escaneá-la diretamente.

Excluir um dispositivo também remove quaisquer solicitações pendentes obsoletas de emparelhamento para esse
id de dispositivo, para que `nodes pending` não mostre linhas órfãs após uma revogação.

## Localidade e headers encaminhados

O emparelhamento do Gateway trata uma conexão como loopback somente quando tanto o socket bruto
quanto qualquer evidência de proxy upstream concordam. Se uma solicitação chegar em loopback mas
carregar headers `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
que apontam para uma origem não local, essa evidência de header encaminhado desqualifica
a alegação de localidade em loopback. O caminho de emparelhamento então requer aprovação explícita
em vez de tratar silenciosamente a solicitação como uma conexão no mesmo host. Consulte
[Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth) para a regra equivalente em
autenticação operator.

## Armazenamento (local, privado)

O estado de emparelhamento é armazenado no diretório de estado do Gateway (padrão `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se você substituir `OPENCLAW_STATE_DIR`, a pasta `nodes/` será movida junto com ele.

Observações de segurança:

- Tokens são segredos; trate `paired.json` como sensível.
- Rotacionar um token requer nova aprovação (ou exclusão da entrada do Node).

## Comportamento do transporte

- O transporte é **sem estado**; ele não armazena associação.
- Se o Gateway estiver offline ou o emparelhamento estiver desabilitado, Nodes não poderão emparelhar.
- Se o Gateway estiver em modo remoto, o emparelhamento ainda acontece no armazenamento do Gateway remoto.

## Relacionado

- [Emparelhamento de canal](/pt-BR/channels/pairing)
- [Nodes](/pt-BR/nodes)
- [CLI de dispositivos](/pt-BR/cli/devices)
