---
read_when:
    - Depuração de erros de escopo de operador ausente
    - Revisando aprovações de pareamento de dispositivos ou Nodes
    - Adição ou classificação de métodos RPC do Gateway
summary: Funções de operador, escopos e verificações no momento da aprovação para clientes do Gateway
title: Escopos do operador
x-i18n:
    generated_at: "2026-07-16T12:28:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Os escopos do operador controlam o que um cliente do Gateway pode fazer depois de se autenticar.
Eles são uma proteção do plano de controle dentro de um único domínio de operador confiável do Gateway,
e não um isolamento contra multilocação hostil. Para uma separação robusta entre pessoas,
equipes ou máquinas, execute Gateways separados sob usuários do SO ou hosts distintos.

Relacionado: [Segurança](/pt-BR/gateway/security), [Protocolo do Gateway](/pt-BR/gateway/protocol),
[Emparelhamento do Gateway](/pt-BR/gateway/pairing), [CLI de dispositivos](/pt-BR/cli/devices).

## Funções

Cada cliente WebSocket do Gateway se conecta com uma função:

- `operator`: clientes do plano de controle, como CLI, interface de controle, automação e
  processos auxiliares confiáveis.
- `node`: hosts de recursos (macOS, iOS, Android, sem interface gráfica) que expõem
  comandos por meio de `node.invoke`.

Os métodos RPC do operador exigem a função `operator`; métodos originados por nós
exigem a função `node`.

## Níveis de escopo

| Escopo                   | Significado                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Status somente leitura, listas, catálogo, logs, leituras de sessão e outras chamadas que não fazem alterações.                                                                          |
| `operator.write`        | Ações de operador que fazem alterações: envio de mensagens, invocação de ferramentas, atualização das configurações de conversa/voz e retransmissão de comandos de nós. Também satisfaz `operator.read`.                |
| `operator.admin`        | Acesso administrativo. Satisfaz todos os escopos `operator.*`. Necessário para alterar configurações, fazer atualizações, usar hooks nativos e namespaces reservados e conceder aprovações de alto risco. |
| `operator.pairing`      | Gerenciamento de emparelhamento de dispositivos e nós: listar, aprovar, rejeitar, remover, rotacionar e revogar.                                                                            |
| `operator.approvals`    | APIs de aprovação de execução e plugins.                                                                                                                                |
| `operator.talk.secrets` | Leitura da configuração de conversa com inclusão de segredos.                                                                                                             |

Escopos `operator.*` futuros e desconhecidos exigem uma correspondência exata, a menos que o chamador
já tenha `operator.admin`.

## O escopo do método é apenas a primeira barreira

Cada RPC do Gateway tem um escopo de método de privilégio mínimo que decide se uma
solicitação chega ao manipulador. Alguns manipuladores aplicam verificações mais rigorosas com base
no item concreto que está sendo aprovado ou alterado:

- `device.pair.approve` pode ser acessado com `operator.pairing`, mas a aprovação de um
  dispositivo de operador só pode emitir ou preservar escopos que o chamador já tenha.
- `node.pair.approve` pode ser acessado com `operator.pairing` e, em seguida, deriva escopos
  de aprovação adicionais da lista de comandos declarada pelo nó pendente.
- `chat.send` é um método com escopo de gravação, mas os comandos de chat `/config set` e
  `/config unset` exigem adicionalmente `operator.admin`,
  independentemente do escopo de envio de chat do chamador.

Isso permite que operadores com escopos menores realizem ações de emparelhamento de baixo risco sem
tornar todas as aprovações de emparelhamento exclusivas para administradores.

## Aprovações de emparelhamento de dispositivos

Os registros de emparelhamento de dispositivos são a fonte persistente das funções e dos escopos aprovados.
Um dispositivo já emparelhado não obtém acesso mais amplo silenciosamente: uma reconexão
que solicita uma função ou escopos mais amplos cria uma nova solicitação pendente
de ampliação de acesso.

Ao aprovar uma solicitação de dispositivo:

- Uma solicitação sem função de operador não precisa de aprovação de escopo de operador.
- Uma solicitação de uma função de dispositivo que não seja de operador (por exemplo, `node`) exige
  `operator.admin`, embora o próprio `device.pair.approve` exija apenas
  `operator.pairing`.
- Uma solicitação de `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` ou `operator.talk.secrets` exige que o chamador já
  tenha esse escopo ou `operator.admin`.
- Uma solicitação de `operator.admin` exige `operator.admin`.
- Uma solicitação de reparo sem escopos explícitos pode herdar os escopos do token
  de operador existente; se esse token tiver escopo de administrador, a aprovação ainda exigirá
  `operator.admin`.

Sessões não administrativas com segredo compartilhado e proxy confiável só podem aprovar
solicitações de dispositivos de operador dentro dos próprios escopos de operador declarados; a aprovação
de funções que não sejam de operador é exclusiva para administradores, mesmo quando essas sessões possam usar
`operator.pairing` em outras situações.

Para sessões com token de dispositivo emparelhado, o gerenciamento fica restrito ao próprio dispositivo, a menos que o chamador
tenha `operator.admin`: um chamador que não seja administrador vê apenas as próprias entradas de emparelhamento e
só pode aprovar, rejeitar, rotacionar, revogar ou remover a entrada do próprio dispositivo.

## Aprovações de emparelhamento de nós

Os métodos legados `node.pair.*` usam um armazenamento separado de emparelhamento de nós pertencente ao Gateway.
Os nós WS usam o emparelhamento de dispositivos (`role: node`), mas o mesmo vocabulário de aprovação
se aplica. Consulte [Emparelhamento do Gateway](/pt-BR/gateway/pairing) para saber como os dois
armazenamentos se relacionam.

`node.pair.approve` deriva escopos obrigatórios adicionais da lista
de comandos da solicitação pendente:

| Comandos declarados                                                                                                    | Escopos obrigatórios                       |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| nenhum                                                                                                                 | `operator.pairing`                    |
| comandos comuns de nós                                                                                               | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` ou `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

A aprovação de uma declaração de nó não habilita comandos que tenham uma barreira separada
de lista de permissões em tempo de execução. Por exemplo, aprovar um nó que declara
`computer.act` exige emparelhamento e escopo de gravação, mas apenas registra a superfície.
Um administrador ou proprietário ainda precisa ativar `computer.act`. Enquanto permanecer
ativado, invocá-lo por meio do método com escopo de gravação `node.invoke` não
exige escopo de administrador para cada ação.

O emparelhamento de nós estabelece identidade e confiança; ele não substitui a própria política de aprovação
de execução `system.run` de um nó.

## Autenticação por segredo compartilhado

A autenticação por token/senha compartilhada do Gateway é tratada como acesso de operador confiável para
esse Gateway. As superfícies HTTP compatíveis com OpenAI, `/tools/invoke` e os endpoints HTTP
de histórico de sessões restauram o conjunto completo de escopos padrão do operador para
autenticação bearer por segredo compartilhado, mesmo que um chamador envie escopos declarados mais restritos.

Modos que incluem identidade, como autenticação por proxy confiável ou `none` de ingresso privado,
ainda podem respeitar escopos declarados explicitamente. Use Gateways separados para uma separação real
dos limites de confiança.
