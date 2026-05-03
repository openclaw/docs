---
read_when:
    - Depuração de erros de escopo de operador ausente
    - Revisão de aprovações de emparelhamento de dispositivo ou Node
    - Adicionar ou classificar métodos RPC do Gateway
summary: Funções, escopos e verificações no momento da aprovação para clientes do Gateway
title: Escopos de operador
x-i18n:
    generated_at: "2026-05-03T05:49:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Os escopos de operador definem o que um cliente Gateway pode fazer depois de se autenticar.
Eles são uma proteção de plano de controle dentro de um domínio confiável de operador Gateway,
não isolamento multi-tenant hostil. Se você precisa de separação forte entre
pessoas, equipes ou máquinas, execute Gateways separados sob usuários do SO ou
hosts separados.

Relacionado: [Segurança](/pt-BR/gateway/security), [protocolo do Gateway](/pt-BR/gateway/protocol),
[pareamento do Gateway](/pt-BR/gateway/pairing), [CLI de dispositivos](/pt-BR/cli/devices).

## Funções

Clientes WebSocket do Gateway se conectam com uma função:

- `operator`: clientes de plano de controle, como CLI, Interface de controle, automação e
  processos auxiliares confiáveis.
- `node`: hosts de capacidade, como macOS, iOS, Android ou nós sem interface gráfica que
  expõem comandos por meio de `node.invoke`.

Os métodos RPC de operador exigem a função `operator`. Métodos originados no nó
exigem a função `node`.

## Níveis de escopo

| Escopo                  | Significado                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Status somente leitura, listas, catálogo, logs, leituras de sessão e outras chamadas de plano de controle que não fazem mutação.                                                        |
| `operator.write`        | Ações normais de operador que fazem mutação, como enviar mensagens, invocar ferramentas, atualizar configurações de fala/voz e retransmissão de comandos de nó. Também satisfaz `operator.read`. |
| `operator.admin`        | Acesso administrativo ao plano de controle. Satisfaz todos os escopos `operator.*`. Exigido para mutação de configuração, atualizações, hooks nativos, namespaces reservados sensíveis e aprovações de alto risco. |
| `operator.pairing`      | Gerenciamento de pareamento de dispositivos e nós, incluindo listar, aprovar, rejeitar, remover, rotacionar e revogar registros de pareamento ou tokens de dispositivo.                 |
| `operator.approvals`    | APIs de aprovação de exec e Plugin.                                                                                                                                                      |
| `operator.talk.secrets` | Leitura da configuração do Talk com segredos incluídos.                                                                                                                                  |

Escopos `operator.*` futuros desconhecidos exigem uma correspondência exata, a menos que o chamador tenha
`operator.admin`.

## O escopo do método é apenas o primeiro gate

Cada RPC do Gateway tem um escopo de método de privilégio mínimo. Esse escopo de método decide
se a solicitação pode chegar ao manipulador. Alguns manipuladores então aplicam verificações mais estritas
no momento da aprovação com base no item concreto que está sendo aprovado ou modificado.

Exemplos:

- `device.pair.approve` é acessível com `operator.pairing`, mas aprovar um
  dispositivo operador só pode emitir ou preservar escopos que o chamador já possui.
- `node.pair.approve` é acessível com `operator.pairing`, depois deriva escopos
  extras de aprovação a partir da lista de comandos pendentes do nó.
- `chat.send` normalmente é um método com escopo de escrita, mas `/config set`
  e `/config unset` persistentes exigem `operator.admin` no nível do comando.

Isso permite que operadores com escopo mais baixo realizem ações de pareamento de baixo risco sem tornar
todas as aprovações de pareamento exclusivas de administradores.

## Aprovações de pareamento de dispositivos

Registros de pareamento de dispositivos são a fonte durável de funções e escopos aprovados.
Dispositivos já pareados não recebem acesso mais amplo silenciosamente: reconexões que pedem
uma função mais ampla ou escopos mais amplos criam uma nova solicitação pendente de upgrade.

Ao aprovar uma solicitação de dispositivo:

- Uma solicitação sem função de operador não precisa de aprovação de escopo de token de operador.
- Uma solicitação para `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` ou `operator.talk.secrets` exige que o chamador tenha
  esses escopos ou `operator.admin`.
- Uma solicitação para `operator.admin` exige `operator.admin`.
- Uma solicitação de reparo sem escopos explícitos pode herdar os escopos de token
  de operador existentes. Se esse token existente tiver escopo de administrador, a aprovação ainda exigirá
  `operator.admin`.

Para sessões de token de dispositivo pareado, o gerenciamento é autoescopado, a menos que o chamador
também tenha `operator.admin`: chamadores que não são administradores só podem rotacionar, revogar ou remover
sua própria entrada de dispositivo.

## Aprovações de pareamento de Node

O `node.pair.*` legado usa um armazenamento de pareamento de nós separado, pertencente ao Gateway. Nós WS
usam pareamento de dispositivo com `role: node`, mas o mesmo vocabulário em nível de aprovação
se aplica.

`node.pair.approve` usa a lista de comandos da solicitação pendente para derivar escopos
adicionais exigidos:

- Solicitação sem comando: `operator.pairing`
- Comandos de nó que não são exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

O pareamento de nós estabelece identidade e confiança. Ele não substitui a política
própria de aprovação de exec `system.run` do nó.

## Autenticação por segredo compartilhado

A autenticação por token/senha compartilhada do Gateway é tratada como acesso confiável de operador para
esse Gateway. Superfícies HTTP compatíveis com OpenAI e `/tools/invoke` restauram o
conjunto normal completo de escopos padrão de operador para autenticação bearer por segredo compartilhado, mesmo que um
chamador envie escopos declarados mais restritos.

Modos com identidade, como autenticação por proxy confiável ou `none` de ingresso privado,
ainda podem honrar escopos declarados explícitos. Use Gateways separados para separação real de
limites de confiança.
