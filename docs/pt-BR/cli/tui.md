---
read_when:
    - Você quer uma interface de terminal para o Gateway (adequada para uso remoto)
    - Você quer passar url/token/session a partir de scripts
    - Você deseja executar a TUI no modo incorporado local sem um Gateway
    - Você quer usar openclaw chat ou openclaw tui --local
summary: Referência da CLI para `openclaw tui` (interface de terminal com suporte do Gateway ou incorporada localmente)
title: TUI
x-i18n:
    generated_at: "2026-05-10T19:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Abra a UI de terminal conectada ao Gateway ou execute-a no modo incorporado
local.

Relacionado:

- Guia da TUI: [TUI](/pt-BR/web/tui)

## Opções

| Flag                  | Padrão                                   | Descrição                                                                                          |
| --------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Executa contra o ambiente de execução do agente incorporado local em vez de um Gateway.            |
| `--url <url>`         | `gateway.remote.url` da configuração      | URL WebSocket do Gateway.                                                                          |
| `--token <token>`     | (nenhum)                                  | Token do Gateway, se necessário.                                                                   |
| `--password <pass>`   | (nenhum)                                  | Senha do Gateway, se necessária.                                                                   |
| `--session <key>`     | `main` (ou `global` quando o escopo é global) | Chave da sessão. Dentro de um espaço de trabalho de agente, seleciona automaticamente esse agente, a menos que haja prefixo. |
| `--deliver`           | `false`                                   | Entrega respostas do assistente pelos canais configurados.                                         |
| `--thinking <level>`  | (padrão do modelo)                        | Substituição do nível de raciocínio.                                                               |
| `--message <text>`    | (nenhum)                                  | Envia uma mensagem inicial após conectar.                                                          |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | Tempo limite do agente. Valores inválidos registram um aviso e são ignorados.                      |
| `--history-limit <n>` | `200`                                     | Entradas do histórico a carregar ao anexar.                                                        |

Aliases: `openclaw chat` e `openclaw terminal` invocam o mesmo comando com `--local` implícito.

Observações:

- `chat` e `terminal` são aliases para `openclaw tui --local`.
- `--local` não pode ser combinado com `--url`, `--token` ou `--password`.
- `tui` resolve SecretRefs configuradas de autenticação do Gateway para autenticação por token/senha quando possível (provedores `env`/`file`/`exec`).
- Quando iniciada de dentro de um diretório de espaço de trabalho de agente configurado, a TUI seleciona automaticamente esse agente como padrão da chave de sessão (a menos que `--session` seja explicitamente `agent:<id>:...`).
- O modo local usa diretamente o ambiente de execução do agente incorporado. A maioria das ferramentas locais funciona, mas os recursos exclusivos do Gateway não ficam disponíveis.
- O modo local adiciona `/auth [provider]` dentro da superfície de comandos da TUI.
- Os gates de aprovação de Plugin ainda se aplicam no modo local. Ferramentas que exigem aprovação solicitam uma decisão no terminal; nada é aprovado automaticamente de forma silenciosa só porque o Gateway não está envolvido.

## Exemplos

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Loop de reparo da configuração

Use o modo local quando a configuração atual já for validada e você quiser que o
agente incorporado a inspecione, compare-a com a documentação e ajude a repará-la
a partir do mesmo terminal:

Se `openclaw config validate` já estiver falhando, use `openclaw configure` ou
`openclaw doctor --fix` primeiro. `openclaw chat` não ignora a proteção contra
configuração inválida.

```bash
openclaw chat
```

Então, dentro da TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Aplique correções direcionadas com `openclaw config set` ou `openclaw configure` e, em seguida,
execute novamente `openclaw config validate`. Consulte [TUI](/pt-BR/web/tui) e [Config](/pt-BR/cli/config).

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [TUI](/pt-BR/web/tui)
