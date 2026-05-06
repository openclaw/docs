---
read_when:
    - Implementando aprovações de emparelhamento de Node sem a interface do macOS
    - Adicionando fluxos da CLI para aprovar nós remotos
    - Estendendo o protocolo do Gateway com gerenciamento de Node
summary: Pareamento de nó gerenciado pelo Gateway (Opção B) para iOS e outros nós remotos
title: Emparelhamento gerenciado pelo Gateway
x-i18n:
    generated_at: "2026-05-06T05:56:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75713e04e37dcbae151d170e2eb459d0e9b9a799c64a10db731b61d7b53998b4
    source_path: gateway/pairing.md
    workflow: 16
---

No pareamento de propriedade do Gateway, o **Gateway** é a fonte da verdade para quais nós
têm permissão para ingressar. As UIs (aplicativo macOS, clientes futuros) são apenas frontends que
aprovam ou rejeitam solicitações pendentes.

**Importante:** nós WS usam **pareamento de dispositivo** (função `node`) durante `connect`.
`node.pair.*` é um armazenamento de pareamento separado e **não** controla o handshake WS.
Somente clientes que chamam explicitamente `node.pair.*` usam esse fluxo.

## Conceitos

- **Solicitação pendente**: um nó pediu para ingressar; requer aprovação.
- **Nó pareado**: nó aprovado com um token de autenticação emitido.
- **Transporte**: o endpoint WS do Gateway encaminha solicitações, mas não decide
  a associação. (O suporte à ponte TCP legada foi removido.)

## Como o pareamento funciona

1. Um nó se conecta ao WS do Gateway e solicita pareamento.
2. O Gateway armazena uma **solicitação pendente** e emite `node.pair.requested`.
3. Você aprova ou rejeita a solicitação (CLI ou UI).
4. Na aprovação, o Gateway emite um **novo token** (tokens são rotacionados ao reparear).
5. O nó se reconecta usando o token e agora está "pareado".

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

`nodes status` mostra nós pareados/conectados e seus recursos.

## Superfície da API (protocolo do gateway)

Eventos:

- `node.pair.requested` - emitido quando uma nova solicitação pendente é criada.
- `node.pair.resolved` - emitido quando uma solicitação é aprovada/rejeitada/expirada.

Métodos:

- `node.pair.request` - cria ou reutiliza uma solicitação pendente.
- `node.pair.list` - lista nós pendentes + pareados (`operator.pairing`).
- `node.pair.approve` - aprova uma solicitação pendente (emite token).
- `node.pair.reject` - rejeita uma solicitação pendente.
- `node.pair.remove` - remove uma entrada obsoleta de nó pareado.
- `node.pair.verify` - verifica `{ nodeId, token }`.

Observações:

- `node.pair.request` é idempotente por nó: chamadas repetidas retornam a mesma
  solicitação pendente.
- Solicitações repetidas para o mesmo nó pendente também atualizam os metadados
  armazenados do nó e o snapshot mais recente de comandos declarados permitidos para visibilidade do operador.
- A aprovação **sempre** gera um token novo; nenhum token é retornado por
  `node.pair.request`.
- Os níveis de escopo de operador e verificações no momento da aprovação estão resumidos em
  [Escopos de operador](/pt-BR/gateway/operator-scopes).
- Solicitações podem incluir `silent: true` como uma dica para fluxos de aprovação automática.
- `node.pair.approve` usa os comandos declarados da solicitação pendente para impor
  escopos de aprovação extras:
  - solicitação sem comando: `operator.pairing`
  - solicitação de comando sem exec: `operator.pairing` + `operator.write`
  - solicitação `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
O pareamento de nós é um fluxo de confiança e identidade, além da emissão de token. Ele **não** fixa a superfície de comandos ativa do nó por nó.

- Comandos ativos do nó vêm do que o nó declara na conexão depois que a política global de comandos de nó do gateway (`gateway.nodes.allowCommands` e `denyCommands`) é aplicada.
- A política de permitir e perguntar de `system.run` por nó fica no nó em `exec.approvals.node.*`, não no registro de pareamento.

</Warning>

## Controle de comandos de nó (2026.3.31+)

<Warning>
**Alteração incompatível:** A partir de `2026.3.31`, comandos de nó ficam desativados até que o pareamento do nó seja aprovado. Apenas o pareamento de dispositivo não é mais suficiente para expor comandos declarados do nó.
</Warning>

Quando um nó se conecta pela primeira vez, o pareamento é solicitado automaticamente. Até que a solicitação de pareamento seja aprovada, todos os comandos pendentes desse nó são filtrados e não serão executados. Depois que a confiança é estabelecida por meio da aprovação de pareamento, os comandos declarados do nó ficam disponíveis sujeitos à política normal de comandos.

Isso significa:

- Nós que antes dependiam apenas do pareamento de dispositivo para expor comandos agora precisam concluir o pareamento de nó.
- Comandos enfileirados antes da aprovação do pareamento são descartados, não adiados.

## Limites de confiança de eventos de nó (2026.3.31+)

<Warning>
**Alteração incompatível:** Execuções originadas por nós agora permanecem em uma superfície confiável reduzida.
</Warning>

Resumos originados por nós e eventos de sessão relacionados são restritos à superfície confiável pretendida. Fluxos orientados por notificação ou acionados por nó que antes dependiam de acesso mais amplo a ferramentas do host ou da sessão podem precisar de ajustes. Esse endurecimento garante que eventos de nó não possam escalar para acesso a ferramentas em nível de host além do que o limite de confiança do nó permite.

Atualizações duráveis de presença de nó seguem o mesmo limite de identidade. O evento `node.presence.alive` é
aceito somente de sessões de dispositivo de nó autenticadas e atualiza metadados de pareamento somente quando a
identidade de dispositivo/nó já está pareada. Valores `client.id` autodeclarados não são suficientes para gravar
o estado de visto por último.

## Aprovação automática (aplicativo macOS)

O aplicativo macOS pode opcionalmente tentar uma **aprovação silenciosa** quando:

- a solicitação está marcada como `silent`, e
- o aplicativo consegue verificar uma conexão SSH com o host do gateway usando o mesmo usuário.

Se a aprovação silenciosa falhar, ele volta para o prompt normal de "Aprovar/Rejeitar".

## Aprovação automática de dispositivo por CIDR confiável

O pareamento de dispositivo WS para `role: node` permanece manual por padrão. Para redes
privadas de nós em que o Gateway já confia no caminho de rede, operadores podem
aderir com CIDRs explícitos ou IPs exatos:

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

- Desativado quando `gateway.nodes.pairing.autoApproveCidrs` não está definido.
- Não existe modo de aprovação automática geral para LAN ou rede privada.
- Somente pareamento de dispositivo `role: node` novo sem escopos solicitados é elegível.
- Clientes operador, navegador, Control UI e WebChat continuam manuais.
- Atualizações de função, escopo, metadados e chave pública continuam manuais.
- Caminhos de cabeçalho de proxy confiável via loopback no mesmo host não são elegíveis porque esse
  caminho pode ser falsificado por chamadores locais.

## Aprovação automática de atualização de metadados

Quando um dispositivo já pareado se reconecta apenas com alterações de metadados
não sensíveis (por exemplo, nome de exibição ou dicas de plataforma do cliente), o OpenClaw trata
isso como um `metadata-upgrade`. A aprovação automática silenciosa é restrita: ela se aplica somente
a reconexões locais confiáveis que não sejam de navegador e que já provaram posse de credenciais locais
ou compartilhadas, incluindo reconexões de aplicativo nativo no mesmo host após alterações de metadados da versão do SO.
Clientes de navegador/Control UI e clientes remotos ainda
usam o fluxo explícito de nova aprovação. Atualizações de escopo (leitura para gravação/admin) e
alterações de chave pública **não** são elegíveis para aprovação automática de atualização de metadados -
elas permanecem como solicitações explícitas de nova aprovação.

## Auxiliares de pareamento por QR

`/pair qr` renderiza a carga de pareamento como mídia estruturada para que clientes móveis e
de navegador possam escaneá-la diretamente.

Excluir um dispositivo também limpa quaisquer solicitações de pareamento pendentes obsoletas desse
id de dispositivo, então `nodes pending` não mostra linhas órfãs após uma revogação.

## Localidade e cabeçalhos encaminhados

O pareamento do Gateway trata uma conexão como loopback somente quando tanto o socket bruto
quanto qualquer evidência de proxy upstream concordam. Se uma solicitação chega em loopback, mas
carrega cabeçalhos `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
que apontam para uma origem não local, essa evidência de cabeçalho encaminhado desqualifica
a alegação de localidade de loopback. O caminho de pareamento então exige aprovação explícita
em vez de tratar silenciosamente a solicitação como uma conexão do mesmo host. Consulte
[Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth) para a regra equivalente na
autenticação de operador.

## Armazenamento (local, privado)

O estado de pareamento é armazenado no diretório de estado do Gateway (padrão `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se você substituir `OPENCLAW_STATE_DIR`, a pasta `nodes/` se move junto com ele.

Observações de segurança:

- Tokens são segredos; trate `paired.json` como sensível.
- Rotacionar um token exige nova aprovação (ou excluir a entrada do nó).

## Comportamento de transporte

- O transporte é **sem estado**; ele não armazena associação.
- Se o Gateway estiver offline ou o pareamento estiver desativado, nós não podem parear.
- Se o Gateway estiver em modo remoto, o pareamento ainda acontece no armazenamento do Gateway remoto.

## Relacionados

- [Pareamento de canal](/pt-BR/channels/pairing)
- [Nós](/pt-BR/nodes)
- [CLI de dispositivos](/pt-BR/cli/devices)
