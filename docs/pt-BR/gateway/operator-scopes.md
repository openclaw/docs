---
read_when:
    - Depuração de erros de escopo de operador ausente
    - Revisão das aprovações de pareamento de dispositivos ou Node
    - Adição ou classificação de métodos RPC do Gateway
summary: Papéis, escopos e verificações no momento da aprovação do operador para clientes do Gateway
title: Escopos de operador
x-i18n:
    generated_at: "2026-05-04T05:53:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Os escopos de operador definem o que um cliente do Gateway pode fazer depois de se autenticar.
Eles são uma proteção do plano de controle dentro de um domínio confiável de operador do Gateway,
não isolamento multi-inquilino hostil. Se você precisa de separação forte entre
pessoas, equipes ou máquinas, execute Gateways separados sob usuários do SO ou
hosts separados.

Relacionado: [Segurança](/pt-BR/gateway/security), [Protocolo do Gateway](/pt-BR/gateway/protocol),
[Emparelhamento do Gateway](/pt-BR/gateway/pairing), [CLI de dispositivos](/pt-BR/cli/devices).

## Funções

Clientes WebSocket do Gateway se conectam com uma função:

- `operator`: clientes do plano de controle, como CLI, Control UI, automação e
  processos auxiliares confiáveis.
- `node`: hosts de capacidade, como macOS, iOS, Android ou nodes sem interface
  gráfica que expõem comandos por meio de `node.invoke`.

Métodos RPC de operador exigem a função `operator`. Métodos originados por Node
exigem a função `node`.

## Níveis de escopo

| Escopo                  | Significado                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | Status somente leitura, listas, catálogo, logs, leituras de sessão e outras chamadas do plano de controle que não fazem mutação.                                                           |
| `operator.write`        | Ações normais de operador que fazem mutação, como enviar mensagens, invocar ferramentas, atualizar configurações de fala/voz e retransmissão de comandos de Node. Também satisfaz `operator.read`. |
| `operator.admin`        | Acesso administrativo ao plano de controle. Satisfaz todos os escopos `operator.*`. Exigido para mutação de configuração, atualizações, hooks nativos, namespaces reservados sensíveis e aprovações de alto risco. |
| `operator.pairing`      | Gerenciamento de emparelhamento de dispositivos e Node, incluindo listar, aprovar, rejeitar, remover, rotacionar e revogar registros de emparelhamento ou tokens de dispositivo.           |
| `operator.approvals`    | APIs de aprovação de exec e Plugin.                                                                                                                                                         |
| `operator.talk.secrets` | Leitura da configuração do Talk com segredos incluídos.                                                                                                                                      |

Escopos `operator.*` futuros desconhecidos exigem uma correspondência exata, a menos que o chamador tenha
`operator.admin`.

## O escopo do método é apenas a primeira barreira

Cada RPC do Gateway tem um escopo de método de menor privilégio. Esse escopo de método decide
se a solicitação pode chegar ao manipulador. Alguns manipuladores então aplicam verificações mais estritas
no momento da aprovação com base no item concreto que está sendo aprovado ou modificado.

Exemplos:

- `device.pair.approve` é acessível com `operator.pairing`, mas aprovar um
  dispositivo operador só pode emitir ou preservar escopos que o chamador já possui.
- `node.pair.approve` é acessível com `operator.pairing` e, em seguida, deriva escopos
  de aprovação extras da lista de comandos de Node pendente.
- `chat.send` normalmente é um método com escopo de escrita, mas `/config set`
  e `/config unset` persistentes exigem `operator.admin` no nível do comando.

Isso permite que operadores com escopo mais baixo realizem ações de emparelhamento de baixo risco sem tornar
todas as aprovações de emparelhamento exclusivas de admin.

## Aprovações de emparelhamento de dispositivo

Registros de emparelhamento de dispositivo são a fonte durável de funções e escopos aprovados.
Dispositivos já emparelhados não recebem acesso mais amplo silenciosamente: reconexões que solicitam
uma função mais ampla ou escopos mais amplos criam uma nova solicitação de upgrade pendente.

Ao aprovar uma solicitação de dispositivo:

- Uma solicitação sem função de operador não precisa de aprovação de escopo de token de operador.
- Uma solicitação para `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` ou `operator.talk.secrets` exige que o chamador possua
  esses escopos ou `operator.admin`.
- Uma solicitação para `operator.admin` exige `operator.admin`.
- Uma solicitação de reparo sem escopos explícitos pode herdar os escopos de token de operador
  existentes. Se esse token existente tiver escopo de admin, a aprovação ainda exige
  `operator.admin`.

Para sessões de token de dispositivo emparelhado, o gerenciamento é autoescopado, a menos que o chamador
também tenha `operator.admin`: chamadores não admin veem apenas suas próprias entradas de emparelhamento,
podem aprovar ou rejeitar apenas sua própria solicitação pendente e podem rotacionar, revogar ou
remover apenas sua própria entrada de dispositivo.

## Aprovações de emparelhamento de Node

O `node.pair.*` legado usa um armazenamento separado de emparelhamento de Node pertencente ao Gateway. Nodes WS
usam emparelhamento de dispositivo com `role: node`, mas o mesmo vocabulário de nível de aprovação
se aplica.

`node.pair.approve` usa a lista de comandos da solicitação pendente para derivar escopos
necessários adicionais:

- Solicitação sem comandos: `operator.pairing`
- Comandos de Node não exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

O emparelhamento de Node estabelece identidade e confiança. Ele não substitui a política
própria de aprovação de exec `system.run` do Node.

## Autenticação por segredo compartilhado

Autenticação por token/senha compartilhados do gateway é tratada como acesso de operador confiável para
esse Gateway. Superfícies HTTP compatíveis com OpenAI e `/tools/invoke` restauram o
conjunto padrão normal completo de escopos de operador para autenticação bearer por segredo compartilhado, mesmo que um
chamador envie escopos declarados mais restritos.

Modos com identidade, como autenticação por proxy confiável ou `none` em ingresso privado,
ainda podem respeitar escopos declarados explícitos. Use Gateways separados para separação real de
fronteiras de confiança.
