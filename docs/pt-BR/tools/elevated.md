---
read_when:
    - Ajustando padrões do modo elevado, listas de permissões ou o comportamento do comando de barra
    - Entendendo como agentes em sandbox podem acessar o host
summary: 'Modo exec elevado: executar comandos fora do sandbox a partir de um agente em sandbox'
title: Modo elevado
x-i18n:
    generated_at: "2026-04-24T06:15:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 15
---

Quando um agente é executado dentro de um sandbox, seus comandos `exec` ficam confinados ao
ambiente do sandbox. O **modo elevado** permite que o agente saia desse confinamento e execute comandos
fora do sandbox, com gates de aprovação configuráveis.

<Info>
  O modo elevado só muda o comportamento quando o agente está em **sandbox**. Para
  agentes sem sandbox, `exec` já é executado no host.
</Info>

## Diretivas

Controle o modo elevado por sessão com comandos de barra:

| Diretiva         | O que faz                                                            |
| ---------------- | -------------------------------------------------------------------- |
| `/elevated on`   | Executa fora do sandbox no caminho de host configurado, mantendo aprovações |
| `/elevated ask`  | O mesmo que `on` (alias)                                             |
| `/elevated full` | Executa fora do sandbox no caminho de host configurado e ignora aprovações |
| `/elevated off`  | Volta para execução confinada ao sandbox                             |

Também disponível como `/elev on|off|ask|full`.

Envie `/elevated` sem argumento para ver o nível atual.

## Como funciona

<Steps>
  <Step title="Verificar disponibilidade">
    Elevated deve estar habilitado na configuração e o remetente deve estar na lista de permissões:

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
    Envie uma mensagem apenas com a diretiva para definir o padrão da sessão:

    ```
    /elevated full
    ```

    Ou use inline (aplica-se apenas àquela mensagem):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Comandos são executados fora do sandbox">
    Com elevated ativo, chamadas `exec` saem do sandbox. O host efetivo é
    `gateway` por padrão, ou `node` quando o alvo exec configurado/da sessão é
    `node`. No modo `full`, aprovações de exec são ignoradas. Nos modos `on`/`ask`,
    regras configuradas de aprovação continuam se aplicando.
  </Step>
</Steps>

## Ordem de resolução

1. **Diretiva inline** na mensagem (aplica-se apenas àquela mensagem)
2. **Substituição da sessão** (definida ao enviar uma mensagem apenas com diretiva)
3. **Padrão global** (`agents.defaults.elevatedDefault` na configuração)

## Disponibilidade e listas de permissões

- **Gate global**: `tools.elevated.enabled` (deve ser `true`)
- **Lista de permissões do remetente**: `tools.elevated.allowFrom` com listas por canal
- **Gate por agente**: `agents.list[].tools.elevated.enabled` (só pode restringir ainda mais)
- **Lista de permissões por agente**: `agents.list[].tools.elevated.allowFrom` (o remetente deve corresponder tanto à global quanto à por agente)
- **Fallback do Discord**: se `tools.elevated.allowFrom.discord` for omitido, `channels.discord.allowFrom` é usado como fallback
- **Todos os gates devem passar**; caso contrário, elevated é tratado como indisponível

Formatos de entrada da lista de permissões:

| Prefixo                 | Corresponde a                    |
| ----------------------- | -------------------------------- |
| (nenhum)                | ID do remetente, E.164 ou campo From |
| `name:`                 | Nome de exibição do remetente    |
| `username:`             | Nome de usuário do remetente     |
| `tag:`                  | Tag do remetente                 |
| `id:`, `from:`, `e164:` | Direcionamento explícito de identidade |

## O que elevated não controla

- **Política de tool**: se `exec` for negado pela política de tool, elevated não pode sobrescrevê-la
- **Política de seleção de host**: elevated não transforma `auto` em uma substituição livre entre hosts. Ele usa as regras configuradas/da sessão para alvo exec, escolhendo `node` apenas quando o alvo já for `node`.
- **Separado de `/exec`**: a diretiva `/exec` ajusta padrões de exec por sessão para remetentes autorizados e não exige modo elevado

## Relacionado

- [Tool Exec](/pt-BR/tools/exec) — execução de comandos de shell
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — sistema de aprovação e lista de permissões
- [Sandboxing](/pt-BR/gateway/sandboxing) — configuração de sandbox
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
