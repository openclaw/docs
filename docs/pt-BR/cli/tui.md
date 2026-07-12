---
read_when:
    - Você quer uma interface de terminal para o Gateway (adequada para acesso remoto)
    - Você deseja passar URL/token/sessão a partir de scripts
    - Você quer executar a TUI no modo incorporado local sem um Gateway
    - Você quer usar openclaw chat ou openclaw tui --local
summary: Referência da CLI para `openclaw tui` (interface de usuário de terminal integrada localmente ou baseada no Gateway)
title: TUI
x-i18n:
    generated_at: "2026-07-11T23:50:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Abra a interface de terminal conectada ao Gateway ou execute-a no modo local
incorporado.

Guia relacionado: [TUI](/pt-BR/web/tui)

## Opções

| Sinalizador                  | Padrão                                    | Descrição                                                                                       |
| ---------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Executa com o ambiente de execução local incorporado do agente em vez de um Gateway.            |
| `--url <url>`                | `gateway.remote.url` da configuração      | URL WebSocket do Gateway.                                                                       |
| `--token <token>`            | (nenhum)                                  | Token do Gateway, se necessário.                                                                |
| `--password <pass>`          | (nenhuma)                                 | Senha do Gateway, se necessária.                                                                |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Impressão digital esperada do certificado TLS para um Gateway `wss://` fixado.                   |
| `--session <key>`            | `main` (ou `global` quando o escopo é global) | Chave da sessão. Dentro do espaço de trabalho de um agente, seleciona esse agente automaticamente, a menos que um prefixo seja usado. |
| `--deliver`                  | `false`                                   | Entrega as respostas do assistente pelos canais configurados.                                   |
| `--thinking <level>`         | (padrão do modelo)                        | Substituição do nível de raciocínio.                                                             |
| `--message <text>`           | (nenhuma)                                 | Envia uma mensagem inicial após a conexão.                                                       |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Tempo limite do agente. Valores inválidos registram um aviso e são ignorados.                    |
| `--history-limit <n>`        | `200`                                     | Número de entradas do histórico a carregar ao conectar.                                         |

Aliases: `openclaw chat` e `openclaw terminal` invocam este comando com
`--local` implícito.

## Observações

- `--local` não pode ser combinado com `--url`, `--token`, `--password` nem `--tls-fingerprint`.
- `tui` resolve as SecretRefs de autenticação do Gateway configuradas para autenticação
  por token/senha quando possível (provedores `env`/`file`/`exec`).
- Sem uma URL ou porta explícita, `tui` usa a porta local ativa do Gateway
  registrada pelo Gateway em execução. `--url`, `OPENCLAW_GATEWAY_URL`,
  `OPENCLAW_GATEWAY_PORT` e a configuração do Gateway remoto explícitos mantêm a precedência.
- Quando iniciada dentro do diretório de espaço de trabalho de um agente configurado, a TUI seleciona
  automaticamente esse agente como padrão da chave da sessão (a menos que `--session` seja explicitamente
  `agent:<id>:...`).
- Para exibir o nome do host do Gateway no rodapé de conexões não locais
  baseadas em URL, execute `openclaw config set tui.footer.showRemoteHost true`. Desativado por
  padrão; nunca é exibido em conexões local loopback ou locais incorporadas.
- O modo local usa diretamente o ambiente de execução incorporado do agente. A maioria das ferramentas locais funciona,
  mas os recursos exclusivos do Gateway não ficam disponíveis.
- O modo local adiciona `/auth [provider]` à superfície de comandos da TUI.
- As verificações de aprovação de Plugins continuam válidas no modo local: ferramentas que exigem aprovação
  solicitam uma decisão no terminal; nada é aprovado automaticamente de forma silenciosa.
- Os [objetivos](/pt-BR/tools/goal) da sessão aparecem no rodapé e podem ser gerenciados com
  `/goal`.

## Exemplos

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare minha configuração com a documentação e diga o que preciso corrigir"
# quando executado dentro do espaço de trabalho de um agente, infere esse agente automaticamente
openclaw tui --session bugfix
```

## Ciclo de reparo da configuração

Use o modo local para que o agente incorporado inspecione a configuração atual, compare-a
com a documentação e ajude a corrigi-la no mesmo terminal.

Se `openclaw config validate` já estiver falhando, execute primeiro `openclaw configure` ou
`openclaw doctor --fix`; `openclaw chat` não ignora a proteção contra
configuração inválida.

```bash
openclaw chat
```

Em seguida, dentro da TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Aplique correções específicas com `openclaw config set` ou `openclaw configure` e, em seguida,
execute novamente `openclaw config validate`. Consulte [TUI](/pt-BR/web/tui) e
[Configuração](/pt-BR/cli/config).

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [TUI](/pt-BR/web/tui)
- [Objetivo](/pt-BR/tools/goal)
