---
read_when:
    - Você quer uma TUI para o Gateway (amigável para acesso remoto)
    - Você quer passar url/token/session a partir de scripts
    - Você quer executar a TUI no modo local incorporado sem um Gateway
    - Você quer usar `openclaw chat` ou `openclaw tui --local`
summary: Referência da CLI para `openclaw tui` (UI de terminal local incorporada ou com suporte do Gateway)
title: tui
x-i18n:
    generated_at: "2026-04-23T14:02:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Abre a UI de terminal conectada ao Gateway ou a executa no modo local
incorporado.

Relacionado:

- Guia da TUI: [TUI](/pt-BR/web/tui)

Observações:

- `chat` e `terminal` são aliases de `openclaw tui --local`.
- `--local` não pode ser combinado com `--url`, `--token` ou `--password`.
- `tui` resolve SecretRefs configurados de autenticação do gateway para autenticação por token/senha quando possível (providers `env`/`file`/`exec`).
- Quando iniciado de dentro de um diretório de workspace de agente configurado, a TUI seleciona automaticamente esse agente como padrão da chave de sessão (a menos que `--session` seja explicitamente `agent:<id>:...`).
- O modo local usa diretamente o runtime incorporado do agente. A maioria das ferramentas locais funciona, mas recursos exclusivos do Gateway não estão disponíveis.
- O modo local adiciona `/auth [provider]` dentro da superfície de comandos da TUI.
- Gatings de aprovação de Plugin ainda se aplicam no modo local. Ferramentas que exigem aprovação solicitam uma decisão no terminal; nada é aprovado automaticamente em silêncio porque o Gateway não está envolvido.

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

Use o modo local quando a configuração atual já for válida e você quiser que o
agente incorporado a inspecione, compare com a documentação e ajude a corrigi-la
no mesmo terminal:

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
execute novamente `openclaw config validate`. Veja [TUI](/pt-BR/web/tui) e [Config](/pt-BR/cli/config).
