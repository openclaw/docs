---
read_when:
    - Ajuste dos padrões do modo elevado, das listas de permissões ou do comportamento dos comandos de barra
    - Entendendo como agentes em sandbox podem acessar o host
summary: 'Modo de execução elevada: execute comandos fora do sandbox a partir de um agente em sandbox'
title: Modo elevado
x-i18n:
    generated_at: "2026-07-12T00:25:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Quando um agente é executado dentro de um sandbox, seus comandos `exec` ficam confinados ao ambiente do sandbox. O **modo elevado** permite que o agente saia desse ambiente e execute comandos fora do sandbox, com controles de aprovação configuráveis.

<Info>
  O modo elevado só altera o comportamento quando o agente está **em sandbox**. Para agentes fora do sandbox, o `exec` já é executado no host.
</Info>

## Diretivas

Controle o modo elevado por sessão com comandos de barra:

| Diretiva         | O que faz                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Executa fora do sandbox no caminho configurado do host, mantendo as aprovações                                                                                    |
| `/elevated ask`  | Igual a `on` (alias)                                                                                                                                              |
| `/elevated full` | Executa fora do sandbox no caminho configurado do host e ignora as aprovações quando a política de aprovação do modo/host já é permissiva                          |
| `/elevated off`  | Retorna à execução confinada ao sandbox                                                                                                                           |

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
    Envie uma mensagem contendo somente a diretiva para definir o padrão da sessão:

    ```
    /elevated full
    ```

    Ou use-a em linha (aplica-se somente a essa mensagem):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Os comandos são executados fora do sandbox">
    Com o modo elevado ativo, as chamadas `exec` saem do sandbox. O host efetivo é
    `gateway` por padrão ou `node` quando o destino de exec configurado/da sessão é
    `node`. No modo `full`, as aprovações de exec são ignoradas quando a política de
    aprovação resolvida para o modo/host de exec já é totalmente permissiva (segurança
    `full`, solicitação `off`); caso contrário, a política de aprovação normal ainda se
    aplica. No modo `on`/`ask`, as regras de aprovação configuradas sempre se aplicam.
  </Step>
</Steps>

## Ordem de resolução

1. **Diretiva em linha** na mensagem (aplica-se somente a essa mensagem)
2. **Substituição da sessão** (definida pelo envio de uma mensagem contendo somente a diretiva)
3. **Padrão global** (`agents.defaults.elevatedDefault` na configuração)

## Disponibilidade e listas de permissões

- **Controle global**: `tools.elevated.enabled` (deve ser `true`)
- **Lista de permissões de remetentes**: `tools.elevated.allowFrom` com listas por canal
- **Controle por agente**: `agents.list[].tools.elevated.enabled` (só pode restringir ainda mais; tanto o controle global quanto o controle por agente devem ser `true`)
- **Lista de permissões por agente**: `agents.list[].tools.elevated.allowFrom` (o remetente deve corresponder tanto à lista global quanto à lista por agente)
- **Lista de permissões alternativa fornecida pelo canal**: Plugins de canal podem, opcionalmente, fornecer uma lista de permissões alternativa por meio de um hook adaptador do SDK, usada quando `tools.elevated.allowFrom.<provider>` não está configurado. Atualmente, nenhum canal incluído implementa esse hook; portanto, na prática, cada provedor precisa hoje de uma entrada explícita em `tools.elevated.allowFrom.<provider>`.
- **Todos os controles devem ser aprovados**; caso contrário, o modo elevado é tratado como indisponível

Formatos das entradas da lista de permissões:

| Prefixo                 | Corresponde a                                     |
| ----------------------- | ------------------------------------------------- |
| (nenhum)                | ID do remetente, E.164 ou campo From              |
| `name:`                 | Nome de exibição do remetente                     |
| `username:`             | Nome de usuário do remetente                      |
| `tag:`                  | Tag do remetente                                  |
| `id:`, `from:`, `e164:` | Direcionamento explícito de identidade            |

## O que o modo elevado não controla

- **Política de ferramentas**: se o `exec` for negado pela política de ferramentas, o modo elevado não poderá substituí-la.
- **Política de seleção de host**: o modo elevado não transforma `auto` em uma substituição livre entre hosts. Ele usa as regras de destino de exec configuradas/da sessão, escolhendo `node` somente quando o destino já é `node`.
- **Separado de `/exec`**: a diretiva `/exec` ajusta os padrões de exec por sessão (host, segurança, solicitação, node) para remetentes autorizados e não exige o modo elevado.

<Note>
  O comando de chat bash (prefixo `!`; alias `/bash`) é um controle separado que exige que `tools.elevated` esteja habilitado, além de seu próprio sinalizador `tools.bash.enabled`. Desabilitar o modo elevado também bloqueia os comandos de shell `!`.
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Ferramenta Exec" href="/pt-BR/tools/exec" icon="terminal">
    Execução de comandos de shell pelo agente.
  </Card>
  <Card title="Aprovações de exec" href="/pt-BR/tools/exec-approvals" icon="shield">
    Sistema de aprovação e lista de permissões para `exec`.
  </Card>
  <Card title="Uso de sandbox" href="/pt-BR/gateway/sandboxing" icon="box">
    Configuração de sandbox no nível do Gateway.
  </Card>
  <Card title="Sandbox vs. política de ferramentas vs. modo elevado" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Como os três controles se combinam durante uma chamada de ferramenta.
  </Card>
</CardGroup>
