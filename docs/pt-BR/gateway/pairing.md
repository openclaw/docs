---
read_when:
    - Implementando aprovações de pareamento de nós sem UI do macOS
    - Adicionando fluxos de CLI para aprovar nós remotos
    - Estendendo o protocolo do gateway com gerenciamento de nós
summary: Pareamento de nós controlado pelo Gateway (Opção B) para iOS e outros nós remotos
title: Pareamento controlado pelo Gateway
x-i18n:
    generated_at: "2026-04-25T13:47:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

No pareamento controlado pelo Gateway, o **Gateway** é a fonte da verdade para quais nós
têm permissão para entrar. UIs (app do macOS, futuros clientes) são apenas frontends que
aprovam ou rejeitam solicitações pendentes.

**Importante:** Nós WS usam **pareamento de dispositivo** (role `node`) durante `connect`.
`node.pair.*` é um armazenamento de pareamento separado e **não** controla o handshake WS.
Somente clientes que chamam explicitamente `node.pair.*` usam esse fluxo.

## Conceitos

- **Solicitação pendente**: um nó pediu para entrar; requer aprovação.
- **Nó pareado**: nó aprovado com um token de autenticação emitido.
- **Transporte**: o endpoint WS do Gateway encaminha solicitações, mas não decide
  a participação. (O suporte legado à bridge TCP foi removido.)

## Como o pareamento funciona

1. Um nó se conecta ao WS do Gateway e solicita pareamento.
2. O Gateway armazena uma **solicitação pendente** e emite `node.pair.requested`.
3. Você aprova ou rejeita a solicitação (CLI ou UI).
4. Na aprovação, o Gateway emite um **novo token** (tokens são rotacionados ao reparar).
5. O nó se reconecta usando o token e agora está “pareado”.

Solicitações pendentes expiram automaticamente após **5 minutos**.

## Fluxo de CLI (compatível com headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra nós pareados/conectados e suas capacidades.

## Superfície da API (protocolo do gateway)

Eventos:

- `node.pair.requested` — emitido quando uma nova solicitação pendente é criada.
- `node.pair.resolved` — emitido quando uma solicitação é aprovada/rejeitada/expirada.

Métodos:

- `node.pair.request` — cria ou reutiliza uma solicitação pendente.
- `node.pair.list` — lista nós pendentes + pareados (`operator.pairing`).
- `node.pair.approve` — aprova uma solicitação pendente (emite token).
- `node.pair.reject` — rejeita uma solicitação pendente.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Observações:

- `node.pair.request` é idempotente por nó: chamadas repetidas retornam a mesma
  solicitação pendente.
- Solicitações repetidas para o mesmo nó pendente também atualizam os metadados do nó
  armazenados e o snapshot mais recente de comandos declarados permitidos para visibilidade do operador.
- A aprovação **sempre** gera um token novo; nenhum token jamais é retornado por
  `node.pair.request`.
- Solicitações podem incluir `silent: true` como dica para fluxos de aprovação automática.
- `node.pair.approve` usa os comandos declarados da solicitação pendente para impor
  escopos extras de aprovação:
  - solicitação sem comando: `operator.pairing`
  - solicitação com comando não exec: `operator.pairing` + `operator.write`
  - solicitação `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- O pareamento de nó é um fluxo de confiança/identidade mais emissão de token.
- Ele **não** fixa a superfície ativa de comandos do nó por nó.
- Os comandos ativos do nó vêm do que o nó declara em `connect` após a
  aplicação da política global de comandos de nó do gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- A política por nó de permitir/perguntar para `system.run` fica no nó em
  `exec.approvals.node.*`, não no registro de pareamento.

## Bloqueio de comandos de nó (2026.3.31+)

<Warning>
**Mudança incompatível:** A partir de `2026.3.31`, comandos de nó ficam desabilitados até que o pareamento do nó seja aprovado. Somente o pareamento de dispositivo não é mais suficiente para expor comandos declarados do nó.
</Warning>

Quando um nó se conecta pela primeira vez, o pareamento é solicitado automaticamente. Até que a solicitação de pareamento seja aprovada, todos os comandos de nó pendentes desse nó são filtrados e não serão executados. Depois que a confiança é estabelecida por meio da aprovação do pareamento, os comandos declarados do nó ficam disponíveis sujeitos à política normal de comandos.

Isso significa:

- Nós que antes dependiam apenas do pareamento de dispositivo para expor comandos agora precisam concluir o pareamento do nó.
- Comandos enfileirados antes da aprovação do pareamento são descartados, não adiados.

## Limites de confiança de eventos de nó (2026.3.31+)

<Warning>
**Mudança incompatível:** Execuções originadas por nó agora permanecem em uma superfície confiável reduzida.
</Warning>

Resumos originados por nó e eventos de sessão relacionados são restritos à superfície confiável pretendida. Fluxos acionados por notificação ou por nó que antes dependiam de acesso mais amplo a ferramentas do host ou da sessão podem precisar de ajuste. Esse reforço garante que eventos de nó não possam escalar para acesso a ferramentas em nível de host além do que o limite de confiança do nó permite.

## Aprovação automática (app do macOS)

O app do macOS pode opcionalmente tentar uma **aprovação silenciosa** quando:

- a solicitação está marcada como `silent`, e
- o app consegue verificar uma conexão SSH ao host do gateway usando o mesmo usuário.

Se a aprovação silenciosa falhar, ele recorre ao prompt normal “Approve/Reject”.

## Aprovação automática de dispositivo por CIDR confiável

O pareamento de dispositivo WS para `role: node` continua manual por padrão. Para
redes privadas de nós em que o Gateway já confia no caminho de rede, operadores podem
fazer opt-in com CIDRs explícitos ou IPs exatos:

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
- Somente pareamento de dispositivo `role: node` novo sem escopos solicitados é elegível.
- Clientes operador, browser, Control UI e WebChat continuam manuais.
- Papel, escopo, metadados e upgrades de chave pública continuam manuais.
- Caminhos de cabeçalho de proxy confiável em loopback no mesmo host não são elegíveis porque esse
  caminho pode ser falsificado por chamadores locais.

## Aprovação automática de upgrade de metadados

Quando um dispositivo já pareado se reconecta com apenas alterações não sensíveis de
metadados (por exemplo, nome de exibição ou dicas de plataforma do cliente), o OpenClaw trata
isso como um `metadata-upgrade`. A aprovação automática silenciosa é restrita: aplica-se apenas
a reconexões confiáveis de CLI/helper local que já comprovaram posse do
token ou senha compartilhados por loopback. Clientes browser/Control UI e clientes remotos
ainda usam o fluxo explícito de reaprovação. Upgrades de escopo (de leitura para
gravação/admin) e alterações de chave pública **não** são elegíveis para aprovação automática de metadata-upgrade — eles continuam como solicitações explícitas de reaprovação.

## Auxiliares de pareamento por QR

`/pair qr` renderiza a payload de pareamento como mídia estruturada para que clientes
móveis e de navegador possam escaneá-la diretamente.

Excluir um dispositivo também remove quaisquer solicitações pendentes antigas de pareamento para esse
id de dispositivo, de modo que `nodes pending` não mostre linhas órfãs após uma revogação.

## Localidade e cabeçalhos encaminhados

O pareamento do Gateway trata uma conexão como loopback somente quando tanto o socket bruto
quanto qualquer evidência de proxy upstream concordam. Se uma solicitação chega por loopback, mas
carrega cabeçalhos `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` que apontam
para uma origem não local, essa evidência de cabeçalho encaminhado invalida a alegação
de localidade loopback. O caminho de pareamento então exige aprovação explícita
em vez de tratar silenciosamente a solicitação como uma conexão do mesmo host. Consulte
[Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth) para a regra equivalente em
autenticação de operador.

## Armazenamento (local, privado)

O estado de pareamento é armazenado no diretório de estado do Gateway (padrão `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se você substituir `OPENCLAW_STATE_DIR`, a pasta `nodes/` muda junto.

Observações de segurança:

- Tokens são segredos; trate `paired.json` como sensível.
- Rotacionar um token exige reaprovação (ou exclusão da entrada do nó).

## Comportamento do transporte

- O transporte é **sem estado**; ele não armazena participação.
- Se o Gateway estiver offline ou o pareamento estiver desabilitado, nós não poderão parear.
- Se o Gateway estiver em modo remoto, o pareamento ainda acontece em relação ao armazenamento do Gateway remoto.

## Relacionado

- [Pareamento de canal](/pt-BR/channels/pairing)
- [Nós](/pt-BR/nodes)
- [CLI de dispositivos](/pt-BR/cli/devices)
