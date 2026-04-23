---
read_when:
    - Implementando aprovações de pareamento de Node sem interface do macOS
    - Adicionando fluxos de CLI para aprovar Nodes remotos
    - Estendendo o protocolo do Gateway com gerenciamento de Node
summary: Pareamento de Node controlado pelo Gateway (Opção B) para iOS e outros Nodes remotos
title: Pareamento controlado pelo Gateway
x-i18n:
    generated_at: "2026-04-23T14:02:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f644f2dd9a79140156646a78df2a83f0940e3db8160cb083453e43c108eacf3a
    source_path: gateway/pairing.md
    workflow: 15
---

# Pareamento controlado pelo Gateway (Opção B)

No pareamento controlado pelo Gateway, o **Gateway** é a fonte da verdade sobre quais Nodes
têm permissão para entrar. Interfaces (app macOS, futuros clientes) são apenas frontends que
aprovam ou rejeitam solicitações pendentes.

**Importante:** Nodes WS usam **device pairing** (função `node`) durante `connect`.
`node.pair.*` é um armazenamento de pareamento separado e **não** controla o handshake de WS.
Somente clientes que chamam explicitamente `node.pair.*` usam esse fluxo.

## Conceitos

- **Solicitação pendente**: um Node pediu para entrar; requer aprovação.
- **Node pareado**: Node aprovado com um token de autenticação emitido.
- **Transporte**: o endpoint WS do Gateway encaminha solicitações, mas não decide
  associação. (O suporte legado à bridge TCP foi removido.)

## Como o pareamento funciona

1. Um Node se conecta ao WS do Gateway e solicita pareamento.
2. O Gateway armazena uma **solicitação pendente** e emite `node.pair.requested`.
3. Você aprova ou rejeita a solicitação (CLI ou interface).
4. Na aprovação, o Gateway emite um **novo token** (os tokens são rotacionados ao parear novamente).
5. O Node se reconecta usando o token e agora está “pareado”.

Solicitações pendentes expiram automaticamente após **5 minutos**.

## Fluxo da CLI (compatível com ambiente headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra Nodes pareados/conectados e suas capacidades.

## Superfície de API (protocolo do gateway)

Eventos:

- `node.pair.requested` — emitido quando uma nova solicitação pendente é criada.
- `node.pair.resolved` — emitido quando uma solicitação é aprovada/rejeitada/expirada.

Métodos:

- `node.pair.request` — cria ou reutiliza uma solicitação pendente.
- `node.pair.list` — lista Nodes pendentes + pareados (`operator.pairing`).
- `node.pair.approve` — aprova uma solicitação pendente (emite token).
- `node.pair.reject` — rejeita uma solicitação pendente.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Observações:

- `node.pair.request` é idempotente por Node: chamadas repetidas retornam a mesma
  solicitação pendente.
- Solicitações repetidas para o mesmo Node pendente também atualizam os metadados
  armazenados do Node e o snapshot mais recente de comandos declarados permitidos para visibilidade do operador.
- A aprovação **sempre** gera um token novo; nenhum token é retornado por
  `node.pair.request`.
- Solicitações podem incluir `silent: true` como dica para fluxos de aprovação automática.
- `node.pair.approve` usa os comandos declarados da solicitação pendente para aplicar
  escopos extras de aprovação:
  - solicitação sem comandos: `operator.pairing`
  - solicitação de comando sem exec: `operator.pairing` + `operator.write`
  - solicitação `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- O pareamento de Node é um fluxo de confiança/identidade mais emissão de token.
- Ele **não** fixa a superfície ativa de comandos do Node por Node.
- Os comandos ativos do Node vêm do que o Node declara em `connect` depois que a
  política global de comandos de Node do gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) é aplicada.
- A política `allow/ask` de `system.run` por Node fica no Node em
  `exec.approvals.node.*`, não no registro de pareamento.

## Controle de comandos de Node (2026.3.31+)

<Warning>
**Mudança incompatível:** A partir de `2026.3.31`, comandos de Node ficam desativados até que o pareamento do Node seja aprovado. Apenas device pairing não é mais suficiente para expor comandos declarados do Node.
</Warning>

Quando um Node se conecta pela primeira vez, o pareamento é solicitado automaticamente. Até que a solicitação de pareamento seja aprovada, todos os comandos de Node pendentes desse Node são filtrados e não serão executados. Quando a confiança é estabelecida por meio da aprovação do pareamento, os comandos declarados do Node ficam disponíveis sujeitos à política normal de comandos.

Isso significa:

- Nodes que antes dependiam apenas de device pairing para expor comandos agora precisam concluir o pareamento do Node.
- Comandos enfileirados antes da aprovação do pareamento são descartados, não adiados.

## Limites de confiança de eventos de Node (2026.3.31+)

<Warning>
**Mudança incompatível:** Execuções originadas por Node agora permanecem em uma superfície confiável reduzida.
</Warning>

Resumos originados por Node e eventos de sessão relacionados são restritos à superfície confiável pretendida. Fluxos acionados por notificação ou disparados por Node que antes dependiam de acesso mais amplo a host ou ferramentas de sessão podem precisar de ajustes. Esse reforço garante que eventos de Node não possam escalar para acesso a ferramentas em nível de host além do que o limite de confiança do Node permite.

## Aprovação automática (app macOS)

O app macOS pode opcionalmente tentar uma **aprovação silenciosa** quando:

- a solicitação está marcada como `silent`, e
- o app consegue verificar uma conexão SSH com o host do gateway usando o mesmo usuário.

Se a aprovação silenciosa falhar, ele usa fallback para o prompt normal “Approve/Reject”.

## Aprovação automática de atualização de metadados

Quando um dispositivo já pareado se reconecta com apenas alterações não sensíveis
de metadados (por exemplo, nome de exibição ou dicas de plataforma do cliente), o OpenClaw trata
isso como um `metadata-upgrade`. A aprovação automática silenciosa é restrita: aplica-se apenas
a reconexões confiáveis de CLI/helper locais que já comprovaram posse do
token compartilhado ou da senha por loopback. Clientes Browser/Control UI e clientes remotos
ainda usam o fluxo explícito de reaprovação. Atualizações de escopo (de leitura para
escrita/admin) e mudanças de chave pública **não** são elegíveis para aprovação automática de `metadata-upgrade`
— elas continuam como solicitações explícitas de reaprovação.

## Helpers de pareamento por QR

`/pair qr` renderiza a carga de pareamento como mídia estruturada para que clientes móveis e de
browser possam escaneá-la diretamente.

Excluir um dispositivo também remove quaisquer solicitações pendentes antigas de pareamento para esse
id de dispositivo, para que `nodes pending` não mostre linhas órfãs após uma revogação.

## Localidade e headers encaminhados

O pareamento do Gateway trata uma conexão como loopback apenas quando tanto o socket bruto
quanto qualquer evidência de proxy upstream concordam. Se uma solicitação chega em loopback, mas
carrega headers `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` que
apontam para uma origem não local, essa evidência de header encaminhado desqualifica
a alegação de localidade por loopback. O caminho de pareamento então exige aprovação explícita
em vez de tratar silenciosamente a solicitação como uma conexão do mesmo host. Veja
[Autenticação Trusted Proxy](/pt-BR/gateway/trusted-proxy-auth) para a regra equivalente em
autenticação de operador.

## Armazenamento (local, privado)

O estado de pareamento é armazenado no diretório de estado do Gateway (padrão `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se você substituir `OPENCLAW_STATE_DIR`, a pasta `nodes/` será movida junto com ele.

Observações de segurança:

- Tokens são segredos; trate `paired.json` como sensível.
- Rotacionar um token exige reaprovação (ou exclusão da entrada do Node).

## Comportamento de transporte

- O transporte é **sem estado**; ele não armazena associação.
- Se o Gateway estiver offline ou o pareamento estiver desativado, os Nodes não poderão parear.
- Se o Gateway estiver em modo remoto, o pareamento ainda ocorrerá no armazenamento do Gateway remoto.
