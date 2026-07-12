---
read_when:
    - Ajuste dos padrões do modo elevado, das listas de permissões ou do comportamento dos comandos de barra
    - Entendendo como agentes em sandbox podem acessar o host
summary: 'Modo de execução elevada: execute comandos fora do sandbox a partir de um agente em sandbox'
title: Modo elevado
x-i18n:
    generated_at: "2026-07-12T15:41:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Quando um agente é executado dentro de uma sandbox, seus comandos `exec` ficam confinados ao ambiente da sandbox. O **modo elevado** permite que o agente saia dela e execute comandos fora da sandbox, com controles de aprovação configuráveis.

<Info>
  O modo elevado só altera o comportamento quando o agente está **em uma sandbox**. Para agentes fora de uma sandbox, o exec já é executado no host.
</Info>

## Diretivas

Controle o modo elevado por sessão com comandos de barra:

| Diretiva         | O que faz                                                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Executa fora da sandbox no caminho configurado do host, mantendo as aprovações                                                                                          |
| `/elevated ask`  | Igual a `on` (alias)                                                                                                                                                    |
| `/elevated full` | Executa fora da sandbox no caminho configurado do host e ignora as aprovações quando a política de aprovação do modo/host já é permissiva                               |
| `/elevated off`  | Retorna à execução confinada à sandbox                                                                                                                                  |

Também disponível como `/elev on|off|ask|full`.

Envie `/elevated` sem argumento para ver o nível atual.

## Como funciona

<Steps>
  <Step title="Verificar a disponibilidade">
    O modo elevado deve estar habilitado na configuração, e o remetente deve estar na lista de permissões:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Definir o nível">
    Envie uma mensagem contendo apenas a diretiva para definir o padrão da sessão:

    ```
    /elevated full
    ```

    Ou use-a em linha (aplica-se somente a essa mensagem):

    ```
    /elevated on execute o script de implantação
    ```

  </Step>

  <Step title="Comandos executados fora da sandbox">
    Com o modo elevado ativo, as chamadas `exec` saem da sandbox. O host efetivo é
    `gateway` por padrão ou `node` quando o destino de execução configurado/da sessão é
    `node`. No modo `full`, as aprovações de execução são ignoradas quando a política
    de aprovação do modo/host de execução resolvido já é totalmente permissiva (segurança
    `full`, solicitação `off`); caso contrário, a política de aprovação normal ainda se aplica. No
    modo `on`/`ask`, as regras de aprovação configuradas sempre se aplicam.
  </Step>
</Steps>

## Ordem de resolução

1. **Diretiva inline** na mensagem (aplica-se somente a essa mensagem)
2. **Substituição da sessão** (definida ao enviar uma mensagem contendo apenas a diretiva)
3. **Padrão global** (`agents.defaults.elevatedDefault` na configuração)

## Disponibilidade e listas de permissões

- **Controle global**: `tools.elevated.enabled` (deve ser `true`)
- **Lista de remetentes permitidos**: `tools.elevated.allowFrom` com listas por canal
- **Controle por agente**: `agents.list[].tools.elevated.enabled` (pode apenas restringir ainda mais; tanto o controle global quanto o controle por agente devem ser `true`)
- **Lista de permissões por agente**: `agents.list[].tools.elevated.allowFrom` (o remetente deve corresponder às listas global e por agente)
- **Lista de permissões alternativa fornecida pelo canal**: os plugins de canal podem, opcionalmente, fornecer uma lista de permissões alternativa por meio de um hook de adaptador do SDK, usada quando `tools.elevated.allowFrom.<provider>` não está configurado. Atualmente, nenhum canal incluído implementa esse hook; portanto, na prática, hoje cada provedor precisa de uma entrada explícita em `tools.elevated.allowFrom.<provider>`.
- **Todos os controles devem ser aprovados**; caso contrário, o modo elevado é considerado indisponível

Formatos de entrada da lista de permissões:

| Prefixo                 | Corresponde a                                |
| ----------------------- | -------------------------------------------- |
| (nenhum)                | ID do remetente, E.164 ou campo From         |
| `name:`                 | Nome de exibição do remetente                |
| `username:`             | Nome de usuário do remetente                 |
| `tag:`                  | Tag do remetente                             |
| `id:`, `from:`, `e164:` | Direcionamento explícito para uma identidade |

## O que o modo elevado não controla

- **Política de ferramentas**: se `exec` for negado pela política de ferramentas, o modo elevado não poderá substituí-la.
- **Política de seleção de host**: o modo elevado não transforma `auto` em uma substituição livre entre hosts. Ele usa as regras de destino de execução configuradas ou da sessão, escolhendo `node` somente quando o destino já for `node`.
- **Separado de `/exec`**: a diretiva `/exec` ajusta os padrões de execução por sessão (host, segurança, confirmação, node) para remetentes autorizados e não exige o modo elevado.

<Note>
  O comando bash do chat (prefixo `!`; alias `/bash`) é controlado por uma verificação separada que exige que `tools.elevated` esteja habilitado, além de seu próprio sinalizador `tools.bash.enabled`. Desabilitar o modo elevado também bloqueia os comandos de shell com `!`.
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Ferramenta Exec" href="/pt-BR/tools/exec" icon="terminal">
    Execução de comandos de shell pelo agente.
  </Card>
  <Card title="Aprovações de Exec" href="/pt-BR/tools/exec-approvals" icon="shield">
    Sistema de aprovação e lista de permissões para `exec`.
  </Card>
  <Card title="Sandboxing" href="/pt-BR/gateway/sandboxing" icon="box">
    Configuração de sandbox no nível do Gateway.
  </Card>
  <Card title="Sandbox vs. política de ferramentas vs. modo elevado" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Como as três verificações são combinadas durante uma chamada de ferramenta.
  </Card>
</CardGroup>
