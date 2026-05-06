---
read_when:
    - Ajustando os padrões do modo elevado, as listas de permissão ou o comportamento dos comandos de barra
    - Entendendo como agentes em sandbox podem acessar o host
summary: 'Modo de execução elevada: execute comandos fora do ambiente isolado a partir de um agente em ambiente isolado'
title: Modo elevado
x-i18n:
    generated_at: "2026-05-06T09:15:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
---

Quando um agente é executado dentro de um sandbox, seus comandos `exec` ficam confinados ao
ambiente do sandbox. O **modo elevado** permite que o agente saia dele e execute comandos
fora do sandbox, com portões de aprovação configuráveis.

<Info>
  O modo elevado só muda o comportamento quando o agente está **em sandbox**. Para
  agentes sem sandbox, exec já é executado no host.
</Info>

## Diretivas

Controle o modo elevado por sessão com comandos de barra:

| Diretiva         | O que faz                                                              |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Executa fora do sandbox no caminho de host configurado, mantém aprovações |
| `/elevated ask`  | Igual a `on` (alias)                                                   |
| `/elevated full` | Executa fora do sandbox no caminho de host configurado e ignora aprovações |
| `/elevated off`  | Retorna à execução confinada ao sandbox                                |

Também disponível como `/elev on|off|ask|full`.

Envie `/elevated` sem argumento para ver o nível atual.

## Como funciona

<Steps>
  <Step title="Check availability">
    O modo elevado deve estar habilitado na configuração e o remetente deve estar na lista de permissões:

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

  <Step title="Set the level">
    Envie uma mensagem contendo apenas a diretiva para definir o padrão da sessão:

    ```
    /elevated full
    ```

    Ou use-a em linha (aplica-se apenas a essa mensagem):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Commands run outside the sandbox">
    Com o modo elevado ativo, chamadas `exec` saem do sandbox. O host efetivo é
    `gateway` por padrão, ou `node` quando o destino exec configurado/da sessão é
    `node`. No modo `full`, aprovações de exec são ignoradas. No modo `on`/`ask`,
    as regras de aprovação configuradas ainda se aplicam.
  </Step>
</Steps>

## Ordem de resolução

1. **Diretiva em linha** na mensagem (aplica-se apenas a essa mensagem)
2. **Substituição de sessão** (definida ao enviar uma mensagem contendo apenas a diretiva)
3. **Padrão global** (`agents.defaults.elevatedDefault` na configuração)

## Disponibilidade e listas de permissões

- **Portão global**: `tools.elevated.enabled` (deve ser `true`)
- **Lista de permissões de remetentes**: `tools.elevated.allowFrom` com listas por canal
- **Portão por agente**: `agents.list[].tools.elevated.enabled` (só pode restringir ainda mais)
- **Lista de permissões por agente**: `agents.list[].tools.elevated.allowFrom` (o remetente deve corresponder à global e à por agente)
- **Fallback do Discord**: se `tools.elevated.allowFrom.discord` for omitido, `channels.discord.allowFrom` será usado como fallback
- **Todos os portões devem passar**; caso contrário, o modo elevado é tratado como indisponível

Formatos de entradas da lista de permissões:

| Prefixo                 | Corresponde a                  |
| ----------------------- | ------------------------------ |
| (nenhum)                | ID do remetente, E.164 ou campo From |
| `name:`                 | Nome de exibição do remetente  |
| `username:`             | Nome de usuário do remetente   |
| `tag:`                  | Tag do remetente               |
| `id:`, `from:`, `e164:` | Direcionamento explícito de identidade |

## O que o modo elevado não controla

- **Política de ferramenta**: se `exec` for negado pela política de ferramenta, o modo elevado não pode substituir isso.
- **Política de seleção de host**: o modo elevado não transforma `auto` em uma substituição livre entre hosts. Ele usa as regras de destino exec configuradas/da sessão, escolhendo `node` somente quando o destino já é `node`.
- **Separado de `/exec`**: a diretiva `/exec` ajusta padrões exec por sessão para remetentes autorizados e não exige modo elevado.

<Note>
  O comando de chat bash (prefixo `!`; alias `/bash`) é um portão separado que exige que `tools.elevated` esteja habilitado além de sua própria flag `tools.bash.enabled`. Desabilitar o modo elevado também bloqueia comandos shell `!`.
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Exec tool" href="/pt-BR/tools/exec" icon="terminal">
    Execução de comandos shell a partir do agente.
  </Card>
  <Card title="Exec approvals" href="/pt-BR/tools/exec-approvals" icon="shield">
    Sistema de aprovação e lista de permissões para `exec`.
  </Card>
  <Card title="Sandboxing" href="/pt-BR/gateway/sandboxing" icon="box">
    Configuração de sandbox no nível do Gateway.
  </Card>
  <Card title="Sandbox vs Tool Policy vs Elevated" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Como os três portões se compõem durante uma chamada de ferramenta.
  </Card>
</CardGroup>
