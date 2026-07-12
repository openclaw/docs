---
read_when:
    - Depuração de erros de escopo de operador ausente
    - Analisando aprovações de emparelhamento de dispositivos ou nós
    - Adição ou classificação de métodos RPC do Gateway
summary: Funções de operador, escopos e verificações no momento da aprovação para clientes do Gateway
title: Escopos do operador
x-i18n:
    generated_at: "2026-07-11T23:59:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Os escopos de operador controlam o que um cliente do Gateway pode fazer após se autenticar.
Eles são uma proteção do plano de controle dentro de um domínio confiável de operador do Gateway,
não um isolamento multitenant contra agentes hostis. Para uma separação forte entre pessoas,
equipes ou máquinas, execute Gateways separados sob usuários do sistema operacional ou hosts distintos.

Relacionado: [Segurança](/pt-BR/gateway/security), [Protocolo do Gateway](/pt-BR/gateway/protocol),
[Emparelhamento do Gateway](/pt-BR/gateway/pairing), [CLI de dispositivos](/pt-BR/cli/devices).

## Funções

Cada cliente WebSocket do Gateway se conecta com uma função:

- `operator`: clientes do plano de controle, como CLI, interface de controle, automação e
  processos auxiliares confiáveis.
- `node`: hosts de recursos (macOS, iOS, Android, sem interface gráfica) que expõem
  comandos por meio de `node.invoke`.

Os métodos RPC de operador exigem a função `operator`; os métodos originados em um Node
exigem a função `node`.

## Níveis de escopo

| Escopo                  | Significado                                                                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Status, listas, catálogo, logs, leituras de sessão e outras chamadas que não fazem alterações, somente para leitura.                                                                                             |
| `operator.write`        | Ações de operador que fazem alterações: envio de mensagens, invocação de ferramentas, atualização das configurações de conversa/voz e retransmissão de comandos de Node. Também atende a `operator.read`.        |
| `operator.admin`        | Acesso administrativo. Atende a todos os escopos `operator.*`. Obrigatório para alterar configurações, realizar atualizações, usar hooks nativos, acessar namespaces reservados e conceder aprovações de alto risco. |
| `operator.pairing`      | Gerenciamento do emparelhamento de dispositivos e Nodes: listar, aprovar, rejeitar, remover, rotacionar e revogar.                                                                                                |
| `operator.approvals`    | APIs de aprovação de execução e de plugins.                                                                                                                                                                      |
| `operator.talk.secrets` | Leitura da configuração de conversa com os segredos incluídos.                                                                                                                                                   |

Escopos `operator.*` futuros e desconhecidos exigem uma correspondência exata, a menos que o chamador
já tenha `operator.admin`.

## O escopo do método é apenas a primeira barreira

Cada RPC do Gateway tem um escopo de método com privilégio mínimo que determina se uma
solicitação chega ao seu manipulador. Alguns manipuladores aplicam verificações mais rigorosas com base
no item específico que está sendo aprovado ou alterado:

- `device.pair.approve` pode ser acessado com `operator.pairing`, mas a aprovação de um
  dispositivo de operador só pode emitir ou preservar escopos que o chamador já possui.
- `node.pair.approve` pode ser acessado com `operator.pairing` e, em seguida, deriva escopos
  adicionais de aprovação da lista de comandos declarada pelo Node pendente.
- `chat.send` é um método com escopo de escrita, mas os comandos de chat `/config set` e
  `/config unset` exigem também `operator.admin`,
  independentemente do escopo de envio de chat do chamador.

Isso permite que operadores com escopos menores realizem ações de emparelhamento de baixo risco sem
fazer com que toda aprovação de emparelhamento seja exclusiva de administradores.

## Aprovações de emparelhamento de dispositivos

Os registros de emparelhamento de dispositivos são a fonte persistente das funções e dos escopos aprovados.
Um dispositivo já emparelhado não recebe silenciosamente um acesso mais amplo: uma reconexão
que solicita uma função ou escopos mais amplos cria uma nova solicitação de atualização pendente.

Ao aprovar uma solicitação de dispositivo:

- Uma solicitação sem a função de operador não precisa de aprovação de escopo de operador.
- Uma solicitação de função de dispositivo que não seja de operador (por exemplo, `node`) exige
  `operator.admin`, embora `device.pair.approve` precise apenas de
  `operator.pairing`.
- Uma solicitação de `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` ou `operator.talk.secrets` exige que o chamador já
  tenha esse escopo ou `operator.admin`.
- Uma solicitação de `operator.admin` exige `operator.admin`.
- Uma solicitação de reparo sem escopos explícitos pode herdar os escopos do token
  de operador existente; se esse token tiver escopo administrativo, a aprovação ainda exigirá
  `operator.admin`.

Sessões não administrativas de segredo compartilhado e de proxy confiável só podem aprovar
solicitações de dispositivos de operador dentro de seus próprios escopos de operador declarados; a aprovação
de funções que não sejam de operador é exclusiva de administradores, mesmo quando essas sessões podem usar
`operator.pairing` para outras finalidades.

Para sessões de token de dispositivo emparelhado, o gerenciamento é limitado ao próprio dispositivo, a menos que o chamador
tenha `operator.admin`: um chamador não administrativo vê apenas suas próprias entradas de emparelhamento e
só pode aprovar, rejeitar, rotacionar, revogar ou remover a entrada do próprio dispositivo.

## Aprovações de emparelhamento de Nodes

Os métodos legados `node.pair.*` usam um armazenamento separado de emparelhamento de Nodes pertencente ao Gateway.
Os Nodes WS usam o emparelhamento de dispositivos (`role: node`), mas o mesmo vocabulário de aprovação
se aplica. Consulte [Emparelhamento do Gateway](/pt-BR/gateway/pairing) para saber como os dois
armazenamentos se relacionam.

`node.pair.approve` deriva escopos obrigatórios adicionais da lista de comandos
da solicitação pendente:

| Comandos declarados                                    | Escopos obrigatórios                    |
| ------------------------------------------------------ | --------------------------------------- |
| nenhum                                                 | `operator.pairing`                      |
| comandos de Node que não sejam de execução             | `operator.pairing` + `operator.write`   |
| `system.run`, `system.run.prepare` ou `system.which`   | `operator.pairing` + `operator.admin`   |

A aprovação da declaração de um Node não habilita comandos que tenham uma barreira separada
de lista de permissões em tempo de execução. Por exemplo, aprovar um Node que declara
`computer.act` exige escopo de emparelhamento e de escrita, mas apenas registra a superfície.
Um administrador ou proprietário ainda precisa ativar `computer.act`. Enquanto ele permanecer
ativado, sua invocação por meio do método `node.invoke`, com escopo de escrita, não
exigirá escopo administrativo para cada ação.

O emparelhamento de Nodes estabelece identidade e confiança; ele não substitui a política de aprovação
de execução de `system.run` do próprio Node.

## Autenticação por segredo compartilhado

A autenticação por token/senha compartilhada do Gateway é tratada como acesso confiável de operador para
esse Gateway. Superfícies HTTP compatíveis com a OpenAI, `/tools/invoke` e endpoints HTTP
de histórico de sessões restauram o conjunto completo de escopos padrão de operador para
autenticação de portador por segredo compartilhado, mesmo que um chamador envie escopos declarados mais restritos.

Modos que incluem identidade, como autenticação por proxy confiável ou `none` em ingresso privado,
ainda podem respeitar escopos declarados explicitamente. Use Gateways separados para uma separação real
dos limites de confiança.
