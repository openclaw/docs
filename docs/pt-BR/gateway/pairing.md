---
read_when:
    - Implementando aprovações de pareamento de nós sem a interface do macOS
    - Adicionando fluxos da CLI para aprovar nós remotos
    - Estendendo o protocolo Gateway com gerenciamento de nós
summary: Pareamento de nós gerenciado pelo Gateway (Opção B) para iOS e outros nós remotos
title: Emparelhamento pertencente ao Gateway
x-i18n:
    generated_at: "2026-06-27T17:32:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

No pareamento de propriedade do Gateway, o **Gateway** é a fonte da verdade para quais nós
têm permissão para entrar. As UIs (app macOS, clientes futuros) são apenas frontends que
aprovam ou rejeitam solicitações pendentes.

**Importante:** nós WS usam **pareamento de dispositivo** (função `node`) durante `connect`.
`node.pair.*` é um armazenamento de pareamento separado e **não** bloqueia o handshake WS.
Somente clientes que chamam explicitamente `node.pair.*` usam este fluxo.

## Conceitos

- **Solicitação pendente**: um nó pediu para entrar; requer aprovação.
- **Nó pareado**: nó aprovado com um token de autenticação emitido.
- **Transporte**: o endpoint WS do Gateway encaminha solicitações, mas não decide
  associação. (O suporte ao bridge TCP legado foi removido.)

## Como o pareamento funciona

1. Um nó se conecta ao WS do Gateway e solicita pareamento.
2. O Gateway armazena uma **solicitação pendente** e emite `node.pair.requested`.
3. Você aprova ou rejeita a solicitação (CLI ou UI).
4. Na aprovação, o Gateway emite um **novo token** (tokens são rotacionados ao parear novamente).
5. O nó se reconecta usando o token e agora está "pareado".

Solicitações pendentes expiram automaticamente após **5 minutos**.

## Fluxo de trabalho da CLI (compatível com headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra nós pareados/conectados e suas capacidades.

## Superfície de API (protocolo do Gateway)

Eventos:

- `node.pair.requested` - emitido quando uma nova solicitação pendente é criada.
- `node.pair.resolved` - emitido quando uma solicitação é aprovada/rejeitada/expirada.

Métodos:

- `node.pair.request` - cria ou reutiliza uma solicitação pendente.
- `node.pair.list` - lista nós pendentes + pareados (`operator.pairing`).
- `node.pair.approve` - aprova uma solicitação pendente (emite token).
- `node.pair.reject` - rejeita uma solicitação pendente.
- `node.pair.remove` - remove um nó pareado. Para pareamentos baseados em dispositivo, isso
  revoga a função `node` do dispositivo: modifica `devices/paired.json` e
  invalida/desconecta as sessões com função de nó desse dispositivo. Um dispositivo com **funções mistas**
  (por exemplo, ele também tem `operator`) mantém sua linha e perde apenas a função `node`;
  uma linha de dispositivo somente de nó é excluída. Também remove qualquer entrada legada correspondente
  de pareamento de nó pertencente ao gateway. Authz: `operator.pairing` pode remover
  linhas de nó não operador; um chamador com token de dispositivo revogando sua **própria** função de nó em
  um dispositivo com funções mistas também precisa de `operator.admin`.
- `node.pair.verify` - verifica `{ nodeId, token }`.

Observações:

- `node.pair.request` é idempotente por nó: chamadas repetidas retornam a mesma
  solicitação pendente.
- Solicitações repetidas para o mesmo nó pendente também atualizam os metadados armazenados do nó
  e o snapshot mais recente de comandos declarados allowlisted para visibilidade do operador.
- A aprovação **sempre** gera um token novo; nenhum token jamais é retornado por
  `node.pair.request`.
- Os níveis de escopo de operador e as verificações no momento da aprovação estão resumidos em
  [Escopos de operador](/pt-BR/gateway/operator-scopes).
- Solicitações podem incluir `silent: true` como dica para fluxos de aprovação automática.
- `node.pair.approve` usa os comandos declarados da solicitação pendente para impor
  escopos extras de aprovação:
  - solicitação sem comandos: `operator.pairing`
  - solicitação de comando não exec: `operator.pairing` + `operator.write`
  - solicitação `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
O pareamento de nós é um fluxo de confiança e identidade mais emissão de token. Ele **não** fixa a superfície de comandos de nó ativa por nó.

- Comandos de nó ativos vêm do que o nó declara ao conectar depois que a política global de comandos de nó do gateway (`gateway.nodes.allowCommands` e `denyCommands`) é aplicada.
- A política de permitir e perguntar por nó para `system.run` fica no nó em `exec.approvals.node.*`, não no registro de pareamento.

</Warning>

## Controle de comandos de nó (2026.3.31+)

<Warning>
**Alteração incompatível:** A partir de `2026.3.31`, comandos de nó ficam desabilitados até que o pareamento do nó seja aprovado. Apenas o pareamento de dispositivo não é mais suficiente para expor comandos de nó declarados.
</Warning>

Quando um nó se conecta pela primeira vez, o pareamento é solicitado automaticamente. Até que a solicitação de pareamento seja aprovada, todos os comandos de nó pendentes desse nó são filtrados e não serão executados. Depois que a confiança é estabelecida pela aprovação do pareamento, os comandos declarados do nó ficam disponíveis sujeitos à política normal de comandos.

Isso significa:

- Nós que antes dependiam apenas do pareamento de dispositivo para expor comandos agora precisam concluir o pareamento de nó.
- Comandos enfileirados antes da aprovação do pareamento são descartados, não adiados.

## Limites de confiança de eventos de nó (2026.3.31+)

<Warning>
**Alteração incompatível:** Execuções originadas por nó agora permanecem em uma superfície confiável reduzida.
</Warning>

Resumos originados por nó e eventos de sessão relacionados são restritos à superfície confiável pretendida. Fluxos acionados por notificação ou por nó que antes dependiam de acesso mais amplo a ferramentas do host ou da sessão podem precisar de ajustes. Esse endurecimento garante que eventos de nó não possam escalar para acesso a ferramentas em nível de host além do permitido pelo limite de confiança do nó.

Atualizações duráveis de presença de nó seguem o mesmo limite de identidade. O evento `node.presence.alive` é
aceito apenas de sessões autenticadas de dispositivo de nó e atualiza metadados de pareamento apenas quando a
identidade do dispositivo/nó já está pareada. Valores `client.id` autodeclarados não bastam para gravar
estado de visto por último.

## Aprovação automática (app macOS)

O app macOS pode opcionalmente tentar uma **aprovação silenciosa** quando:

- a solicitação está marcada como `silent`, e
- o app consegue verificar uma conexão SSH com o host do gateway usando o mesmo usuário.

Se a aprovação silenciosa falhar, ele volta para o prompt normal "Aprovar/Rejeitar".

## Aprovação automática de dispositivos por CIDR confiável

O pareamento de dispositivo WS para `role: node` permanece manual por padrão. Para redes
privadas de nós em que o Gateway já confia no caminho de rede, operadores podem
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
- Apenas pareamento novo de dispositivo `role: node` sem escopos solicitados é elegível.
- Clientes de operador, navegador, Control UI e WebChat permanecem manuais.
- Atualizações de função, escopo, metadados e chave pública permanecem manuais.
- Caminhos de cabeçalho de proxy confiável por loopback no mesmo host não são elegíveis porque esse
  caminho pode ser falsificado por chamadores locais.

## Aprovação automática de atualização de metadados

Quando um dispositivo já pareado se reconecta com apenas alterações de metadados não sensíveis
(por exemplo, nome de exibição ou dicas de plataforma do cliente), o OpenClaw trata
isso como um `metadata-upgrade`. A aprovação automática silenciosa é restrita: ela se aplica apenas
a reconexões locais confiáveis não navegador que já provaram posse de credenciais locais
ou compartilhadas, incluindo reconexões de app nativo no mesmo host após alterações de metadados de
versão do SO. Clientes de navegador/Control UI e clientes remotos ainda
usam o fluxo explícito de reaprovação. Atualizações de escopo (leitura para escrita/admin) e
alterações de chave pública **não** são elegíveis para aprovação automática de metadata-upgrade -
elas permanecem como solicitações explícitas de reaprovação.

## Auxiliares de pareamento por QR

`/pair qr` renderiza o payload de pareamento como mídia estruturada para que clientes móveis e
de navegador possam escaneá-lo diretamente.

Excluir um dispositivo também varre quaisquer solicitações pendentes obsoletas de pareamento para esse
ID de dispositivo, então `nodes pending` não mostra linhas órfãs após uma revogação.

## Localidade e cabeçalhos encaminhados

O pareamento do Gateway trata uma conexão como loopback apenas quando tanto o soquete bruto
quanto qualquer evidência de proxy upstream concordam. Se uma solicitação chega por loopback, mas
carrega evidência de cabeçalho `Forwarded`, qualquer `X-Forwarded-*` ou `X-Real-IP`, essa
evidência de cabeçalho encaminhado desqualifica a alegação de localidade por loopback. O caminho de
pareamento então exige aprovação explícita em vez de tratar silenciosamente a solicitação como
uma conexão do mesmo host. Consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth) para
a regra equivalente em autenticação de operador.

## Armazenamento (local, privado)

O estado de pareamento é armazenado no diretório de estado do Gateway (padrão `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se você sobrescrever `OPENCLAW_STATE_DIR`, a pasta `nodes/` se move com ele.

Observações de segurança:

- Tokens são segredos; trate `paired.json` como sensível.
- Rotacionar um token exige reaprovação (ou excluir a entrada do nó).

## Comportamento de transporte

- O transporte é **sem estado**; ele não armazena associação.
- Se o Gateway estiver offline ou o pareamento estiver desabilitado, os nós não conseguem parear.
- Se o Gateway estiver em modo remoto, o pareamento ainda acontece contra o armazenamento do Gateway remoto.

## Relacionado

- [Pareamento de canal](/pt-BR/channels/pairing)
- [Nós](/pt-BR/nodes)
- [CLI de dispositivos](/pt-BR/cli/devices)
