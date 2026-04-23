---
read_when:
    - Você quer alterar modelos padrão ou ver o status de autenticação do provider
    - Você quer verificar modelos/providers disponíveis e depurar perfis de autenticação
summary: Referência da CLI para `openclaw models` (status/list/set/scan, aliases, fallbacks, autenticação)
title: modelos
x-i18n:
    generated_at: "2026-04-23T14:01:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Descoberta, verificação e configuração de modelos (modelo padrão, fallbacks, perfis de autenticação).

Relacionado:

- Providers + modelos: [Models](/pt-BR/providers/models)
- Conceitos de seleção de modelo + comando de barra `/models`: [Models concept](/pt-BR/concepts/models)
- Configuração de autenticação de provider: [Getting started](/pt-BR/start/getting-started)

## Comandos comuns

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra o padrão/fallbacks resolvidos, além de uma visão geral da autenticação.
Quando snapshots de uso do provider estão disponíveis, a seção de status de OAuth/chave de API inclui
janelas de uso do provider e snapshots de cota.
Providers atuais com janela de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. A autenticação de uso vem de hooks específicos do provider
quando disponíveis; caso contrário, o OpenClaw recorre à correspondência de
credenciais OAuth/chave de API a partir de perfis de autenticação, env ou configuração.
Na saída `--json`, `auth.providers` é a visão geral de provider
com reconhecimento de env/config/store, enquanto `auth.oauth` é apenas a integridade dos perfis do auth-store.
Adicione `--probe` para executar sondagens de autenticação ao vivo contra cada perfil de provider configurado.
As sondagens são requisições reais (podem consumir tokens e acionar limites de taxa).
Use `--agent <id>` para inspecionar o estado de modelo/autenticação de um agente configurado. Quando omitido,
o comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se definido; caso contrário, usa o
agente padrão configurado.
As linhas de sondagem podem vir de perfis de autenticação, credenciais de env ou `models.json`.

Observações:

- `models set <model-or-alias>` aceita `provider/model` ou um alias.
- `models list --all` inclui linhas estáticas de catálogo de providers incluídos
  mesmo quando você ainda não se autenticou com esse provider. Essas linhas ainda aparecem
  como indisponíveis até que a autenticação correspondente seja configurada.
- `models list --provider <id>` filtra por ID do provider, como `moonshot` ou
  `openai-codex`. Ele não aceita rótulos de exibição de seletores interativos de provider,
  como `Moonshot AI`.
- Referências de modelo são analisadas dividindo no **primeiro** `/`. Se o ID do modelo incluir `/` (estilo OpenRouter), inclua o prefixo do provider (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provider, o OpenClaw resolve a entrada primeiro como um alias, depois
  como uma correspondência única de provider configurado para aquele ID de modelo exato e só então
  recorre ao provider padrão configurado com um aviso de descontinuação.
  Se esse provider não expuser mais o modelo padrão configurado, o OpenClaw
  recorrerá ao primeiro provider/modelo configurado em vez de exibir um
  padrão obsoleto de provider removido.
- `models status` pode mostrar `marker(<value>)` na saída de autenticação para placeholders não secretos (por exemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) em vez de mascará-los como segredos.

### `models status`

Opções:

- `--json`
- `--plain`
- `--check` (código de saída 1=expirado/ausente, 2=expirando)
- `--probe` (sondagem ao vivo dos perfis de autenticação configurados)
- `--probe-provider <name>` (sonda um provider)
- `--probe-profile <id>` (repetível ou IDs de perfil separados por vírgula)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID do agente configurado; substitui `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Categorias de status de sondagem:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos de detalhe/código de motivo de sondagem a esperar:

- `excluded_by_auth_order`: existe um perfil armazenado, mas `auth.order.<provider>`
  explícito o omitiu, então a sondagem informa a exclusão em vez de
  tentar usá-lo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  o perfil está presente, mas não está elegível/resolvido.
- `no_model`: existe autenticação do provider, mas o OpenClaw não conseguiu resolver
  um candidato de modelo sondável para esse provider.

## Aliases + fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Perfis de autenticação

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` é o assistente interativo de autenticação. Ele pode iniciar um fluxo de autenticação do provider
(OAuth/chave de API) ou orientar você no colar manual de token, dependendo do
provider escolhido.

`models auth login` executa o fluxo de autenticação de um plugin de provider (OAuth/chave de API). Use
`openclaw plugins list` para ver quais providers estão instalados.

Exemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Observações:

- `setup-token` e `paste-token` continuam sendo comandos genéricos de token para providers
  que expõem métodos de autenticação por token.
- `setup-token` requer um TTY interativo e executa o método de autenticação por token do provider
  (por padrão, o método `setup-token` desse provider quando ele expõe
  um).
- `paste-token` aceita uma string de token gerada em outro lugar ou por automação.
- `paste-token` requer `--provider`, solicita o valor do token e o grava
  no ID de perfil padrão `<provider>:manual`, a menos que você passe
  `--profile-id`.
- `paste-token --expires-in <duration>` armazena uma expiração absoluta do token a partir de uma
  duração relativa, como `365d` ou `12h`.
- Observação sobre Anthropic: a equipe da Anthropic nos disse que o uso do Claude CLI no estilo OpenClaw é permitido novamente, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados para esta integração, a menos que a Anthropic publique uma nova política.
- `setup-token` / `paste-token` do Anthropic continuam disponíveis como um caminho de token compatível do OpenClaw, mas o OpenClaw agora prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.
