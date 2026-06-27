---
read_when:
    - Você quer uma interface de terminal para o Gateway (adequada para acesso remoto)
    - Você quer passar url/token/session a partir de scripts
    - Você quer executar a TUI em modo incorporado local sem um Gateway
    - Você quer usar openclaw chat ou openclaw tui --local
summary: Referência da CLI para `openclaw tui` (UI de terminal incorporada local ou baseada em Gateway)
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:22:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Abra a interface de terminal conectada ao Gateway ou execute-a no modo local incorporado.

Relacionado:

- Guia da TUI: [TUI](/pt-BR/web/tui)

## Opções

| Flag                  | Padrão                                   | Descrição                                                                                         |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                  | Executa contra o runtime local incorporado do agente em vez de um Gateway.                        |
| `--url <url>`         | `gateway.remote.url` da configuração     | URL WebSocket do Gateway.                                                                         |
| `--token <token>`     | (nenhum)                                 | Token do Gateway, se necessário.                                                                  |
| `--password <pass>`   | (nenhuma)                                | Senha do Gateway, se necessária.                                                                  |
| `--session <key>`     | `main` (ou `global` quando o escopo é global) | Chave da sessão. Dentro de um workspace de agente, seleciona automaticamente esse agente, a menos que haja um prefixo. |
| `--deliver`           | `false`                                  | Entrega respostas do assistente por meio dos canais configurados.                                 |
| `--thinking <level>`  | (padrão do modelo)                       | Substituição do nível de raciocínio.                                                              |
| `--message <text>`    | (nenhuma)                                | Envia uma mensagem inicial após conectar.                                                         |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`         | Tempo limite do agente. Valores inválidos registram um aviso e são ignorados.                     |
| `--history-limit <n>` | `200`                                    | Entradas do histórico a carregar ao anexar.                                                       |

Aliases: `openclaw chat` e `openclaw terminal` invocam o mesmo comando com `--local` implícito.

Notas:

- `chat` e `terminal` são aliases para `openclaw tui --local`.
- `--local` não pode ser combinado com `--url`, `--token` ou `--password`.
- `tui` resolve SecretRefs de autenticação do Gateway configurados para autenticação por token/senha quando possível (provedores `env`/`file`/`exec`).
- Quando iniciada de dentro de um diretório de workspace de agente configurado, a TUI seleciona automaticamente esse agente como padrão da chave de sessão (a menos que `--session` seja explicitamente `agent:<id>:...`).
- Para mostrar o nome do host do Gateway no rodapé para conexões baseadas em URL não locais, execute `openclaw config set tui.footer.showRemoteHost true`. O rótulo do host fica desativado por padrão e nunca aparece para conexões loopback ou locais incorporadas.
- O modo local usa diretamente o runtime incorporado do agente. A maioria das ferramentas locais funciona, mas recursos exclusivos do Gateway ficam indisponíveis.
- O modo local adiciona `/auth [provider]` dentro da superfície de comandos da TUI.
- Os controles de aprovação de Plugin ainda se aplicam no modo local. Ferramentas que exigem aprovação solicitam uma decisão no terminal; nada é aprovado automaticamente de forma silenciosa porque o Gateway não está envolvido.
- As [metas](/pt-BR/tools/goal) da sessão aparecem no rodapé e podem ser gerenciadas com `/goal`.

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

Use o modo local quando a configuração atual já for validada e você quiser que o agente incorporado a inspecione, compare-a com a documentação e ajude a repará-la a partir do mesmo terminal:

Se `openclaw config validate` já estiver falhando, use `openclaw configure` ou `openclaw doctor --fix` primeiro. `openclaw chat` não contorna a proteção contra configuração inválida.

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

Aplique correções direcionadas com `openclaw config set` ou `openclaw configure` e depois execute `openclaw config validate` novamente. Consulte [TUI](/pt-BR/web/tui) e [Configuração](/pt-BR/cli/config).

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [TUI](/pt-BR/web/tui)
- [Meta](/pt-BR/tools/goal)
