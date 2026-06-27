---
read_when:
    - Depuração de erros de escopo do operador ausente
    - Revisando aprovações de pareamento de dispositivo ou node
    - Adição ou classificação de métodos RPC do Gateway
summary: Funções, escopos e verificações no momento da aprovação do operador para clientes Gateway
title: Escopos de operador
x-i18n:
    generated_at: "2026-06-27T17:32:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Os escopos de operador definem o que um cliente Gateway pode fazer depois de se autenticar.
Eles são uma proteção de plano de controle dentro de um único domínio confiável de operador Gateway,
não isolamento multi-inquilino hostil. Se você precisa de separação forte entre
pessoas, equipes ou máquinas, execute Gateways separados sob usuários do SO ou
hosts separados.

Relacionado: [Segurança](/pt-BR/gateway/security), [Protocolo Gateway](/pt-BR/gateway/protocol),
[Pareamento Gateway](/pt-BR/gateway/pairing), [CLI de dispositivos](/pt-BR/cli/devices).

## Funções

Clientes WebSocket do Gateway se conectam com uma função:

- `operator`: clientes de plano de controle, como CLI, Control UI, automação e
  processos auxiliares confiáveis.
- `node`: hosts de capacidade, como macOS, iOS, Android ou nós sem interface que
  expõem comandos por meio de `node.invoke`.

Métodos RPC de operador exigem a função `operator`. Métodos originados por node
exigem a função `node`.

## Níveis de escopo

| Escopo                  | Significado                                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Status somente leitura, listas, catálogo, logs, leituras de sessão e outras chamadas de plano de controle que não fazem mutações.                                                              |
| `operator.write`        | Ações normais de operador que fazem mutações, como enviar mensagens, invocar ferramentas, atualizar configurações de conversa/voz e retransmissão de comandos de node. Também satisfaz `operator.read`. |
| `operator.admin`        | Acesso administrativo ao plano de controle. Satisfaz todos os escopos `operator.*`. Necessário para mutação de configuração, atualizações, hooks nativos, namespaces reservados sensíveis e aprovações de alto risco. |
| `operator.pairing`      | Gerenciamento de pareamento de dispositivos e nodes, incluindo listar, aprovar, rejeitar, remover, rotacionar e revogar registros de pareamento ou tokens de dispositivo.                      |
| `operator.approvals`    | APIs de aprovação de exec e Plugin.                                                                                                                                                           |
| `operator.talk.secrets` | Leitura da configuração do Talk com segredos incluídos.                                                                                                                                        |

Escopos `operator.*` futuros desconhecidos exigem uma correspondência exata, a menos que o chamador tenha
`operator.admin`.

## O escopo do método é apenas o primeiro bloqueio

Cada RPC do Gateway tem um escopo de método de privilégio mínimo. Esse escopo de método decide
se a solicitação pode chegar ao handler. Alguns handlers então aplicam verificações mais rigorosas
no momento da aprovação com base no item concreto que está sendo aprovado ou alterado.

Exemplos:

- `device.pair.approve` é acessível com `operator.pairing`, mas aprovar um
  dispositivo operador só pode emitir ou preservar escopos que o chamador já possui.
- `node.pair.approve` é acessível com `operator.pairing` e então deriva escopos
  extras de aprovação da lista pendente de comandos do node.
- `chat.send` normalmente é um método com escopo de escrita, mas `/config set`
  e `/config unset` persistentes exigem `operator.admin` no nível do comando.

Isso permite que operadores com escopos menores executem ações de pareamento de baixo risco sem tornar
toda aprovação de pareamento exclusiva para administradores.

## Aprovações de pareamento de dispositivos

Registros de pareamento de dispositivos são a fonte durável das funções e escopos aprovados.
Dispositivos já pareados não recebem acesso mais amplo silenciosamente: reconexões que pedem
uma função mais ampla ou escopos mais amplos criam uma nova solicitação pendente de upgrade.

Ao aprovar uma solicitação de dispositivo:

- Uma solicitação sem função de operador não precisa de aprovação de escopo de token de operador.
- Uma solicitação para uma função de dispositivo não operador, como `node`, exige
  `operator.admin`, mesmo quando `device.pair.approve` é acessível com
  `operator.pairing`.
- Uma solicitação para `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` ou `operator.talk.secrets` exige que o chamador tenha
  esses escopos ou `operator.admin`.
- Uma solicitação para `operator.admin` exige `operator.admin`.
- Uma solicitação de reparo sem escopos explícitos pode herdar os escopos do token
  de operador existente. Se esse token existente tiver escopo de administrador, a aprovação ainda exige
  `operator.admin`.

Sessões de segredo compartilhado e proxy confiável sem privilégios de administrador podem aprovar solicitações de dispositivo operador
somente dentro de seus próprios escopos de operador declarados. Aprovar funções não operadoras
é exclusivo para administradores, mesmo quando essas sessões podem usar
`operator.pairing` de outra forma.

Para sessões de token de dispositivo pareado, o gerenciamento também é autoescopado, a menos que o
chamador tenha `operator.admin`: chamadores não administradores veem apenas suas próprias entradas de
pareamento, podem aprovar ou rejeitar apenas sua própria solicitação pendente e podem rotacionar,
revogar ou remover apenas sua própria entrada de dispositivo.

## Aprovações de pareamento de Node

O `node.pair.*` legado usa um armazenamento separado de pareamento de nodes pertencente ao Gateway. Nodes WS
usam pareamento de dispositivos com `role: node`, mas o mesmo vocabulário de nível de aprovação
se aplica.

`node.pair.approve` usa a lista de comandos da solicitação pendente para derivar escopos
necessários adicionais:

- Solicitação sem comandos: `operator.pairing`
- Comandos de node que não são exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

O pareamento de Node estabelece identidade e confiança. Ele não substitui a política de aprovação de exec
`system.run` própria do node.

## Autenticação por segredo compartilhado

Autenticação por token/senha compartilhados do Gateway é tratada como acesso de operador confiável para
esse Gateway. Superfícies HTTP compatíveis com OpenAI, `/tools/invoke` e endpoints HTTP de histórico de sessão
restauram o conjunto padrão normal e completo de escopos de operador para
autenticação bearer por segredo compartilhado, mesmo que um chamador envie escopos declarados mais estreitos.

Modos que carregam identidade, como autenticação por proxy confiável ou `none` de ingresso privado,
ainda podem respeitar escopos declarados explicitamente. Use Gateways separados para separação real de
limites de confiança.
