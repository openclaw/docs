---
read_when:
    - Você quer uma UI de terminal para o Gateway (compatível com acesso remoto)
    - Você quer passar url/token/session a partir de scripts
    - Você quer executar a TUI no modo incorporado local sem um Gateway
    - Você quer usar `openclaw chat` ou `openclaw tui --local`
summary: Referência da CLI para `openclaw tui` (UI de terminal incorporada local ou com suporte do Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-24T05:46:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Abra a UI de terminal conectada ao Gateway ou execute-a no modo incorporado
local.

Relacionado:

- Guia da TUI: [TUI](/pt-BR/web/tui)

Observações:

- `chat` e `terminal` são aliases para `openclaw tui --local`.
- `--local` não pode ser combinado com `--url`, `--token` ou `--password`.
- `tui` resolve SecretRefs configurados de autenticação do gateway para autenticação por token/senha quando possível (provedores `env`/`file`/`exec`).
- Quando iniciada de dentro de um diretório de workspace de agente configurado, a TUI seleciona automaticamente esse agente como padrão para a chave de sessão (a menos que `--session` seja explicitamente `agent:<id>:...`).
- O modo local usa diretamente o runtime incorporado do agente. A maioria das ferramentas locais funciona, mas recursos exclusivos do Gateway não estão disponíveis.
- O modo local adiciona `/auth [provider]` dentro da superfície de comandos da TUI.
- Portões de aprovação de Plugin ainda se aplicam no modo local. Ferramentas que exigem aprovação solicitam uma decisão no terminal; nada é automaticamente aprovado em silêncio porque o Gateway não está envolvido.

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

## Loop de reparo de configuração

Use o modo local quando a configuração atual já validar e você quiser que o
agente incorporado a inspecione, compare com a documentação e ajude a repará-la
a partir do mesmo terminal:

Se `openclaw config validate` já estiver falhando, use `openclaw configure` ou
`openclaw doctor --fix` primeiro. `openclaw chat` não ignora a proteção contra
configuração inválida.

```bash
openclaw chat
```

Depois, dentro da TUI:

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
