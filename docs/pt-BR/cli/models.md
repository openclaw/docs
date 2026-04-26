---
read_when:
    - Você quer alterar os models padrão ou ver o status de autenticação do provedor
    - Você quer verificar os models/providers disponíveis e depurar perfis de auth
summary: Referência da CLI para `openclaw models` (`status`/`list`/`set`/`scan`, aliases, fallbacks, auth)
title: Models
x-i18n:
    generated_at: "2026-04-26T11:26:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Descoberta, varredura e configuração de models (model padrão, fallbacks, perfis de auth).

Relacionado:

- Providers + models: [Models](/pt-BR/providers/models)
- Conceitos de seleção de model + comando de barra `/models`: [Conceito de Models](/pt-BR/concepts/models)
- Configuração de auth do provider: [Primeiros passos](/pt-BR/start/getting-started)

## Comandos comuns

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra o padrão/fallbacks resolvidos mais uma visão geral de auth.
Quando instantâneos de uso do provider estão disponíveis, a seção de status de OAuth/API key inclui
janelas de uso do provider e instantâneos de cota.
Providers atuais com janela de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. O auth de uso vem de hooks específicos do provider
quando disponíveis; caso contrário, o OpenClaw recorre à correspondência de
credenciais OAuth/API key a partir de perfis de auth, env ou config.
Na saída `--json`, `auth.providers` é a visão geral do provider com reconhecimento de env/config/store,
enquanto `auth.oauth` é apenas a integridade de perfis do armazenamento de auth.
Adicione `--probe` para executar probes de auth em tempo real em cada perfil de provider configurado.
Os probes são solicitações reais (podem consumir tokens e acionar rate limits).
Use `--agent <id>` para inspecionar o estado de model/auth de um agente configurado. Quando omitido,
o comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se definidos; caso contrário, usa o
agente padrão configurado.
As linhas de probe podem vir de perfis de auth, credenciais env ou `models.json`.

Observações:

- `models set <model-or-alias>` aceita `provider/model` ou um alias.
- `models list` é somente leitura: lê config, perfis de auth, estado de catálogo
  existente e linhas de catálogo controladas pelo provider, mas não regrava
  `models.json`.
- `models list --all --provider <id>` pode incluir linhas estáticas de catálogo controladas pelo provider
  a partir de manifestos de Plugin ou metadados de catálogo de provider incluídos, mesmo quando
  você ainda não se autenticou com esse provider. Essas linhas ainda aparecem como
  indisponíveis até que um auth correspondente seja configurado.
- `models list` mantém distintos os metadados nativos do model e os limites de runtime. Na
  saída em tabela, `Ctx` mostra `contextTokens/contextWindow` quando um limite efetivo de runtime
  difere da janela de contexto nativa; linhas JSON incluem `contextTokens`
  quando um provider expõe esse limite.
- `models list --provider <id>` filtra por id do provider, como `moonshot` ou
  `openai-codex`. Ele não aceita rótulos de exibição de seletores interativos de provider,
  como `Moonshot AI`.
- As refs de model são analisadas separando no **primeiro** `/`. Se o ID do model incluir `/` (estilo OpenRouter), inclua o prefixo do provider (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provider, o OpenClaw resolve a entrada primeiro como um alias, depois
  como uma correspondência única de provider configurado para aquele id exato de model, e só então
  recorre ao provider padrão configurado com um aviso de descontinuação.
  Se esse provider não expuser mais o model padrão configurado, o OpenClaw
  recorre ao primeiro provider/model configurado em vez de exibir um
  padrão obsoleto de provider removido.
- `models status` pode mostrar `marker(<value>)` na saída de auth para placeholders não secretos (por exemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) em vez de mascará-los como segredos.

### `models scan`

`models scan` lê o catálogo público `:free` do OpenRouter e classifica candidatos para
uso como fallback. O catálogo em si é público, então varreduras apenas de metadados não precisam
de uma chave do OpenRouter.

Por padrão, o OpenClaw tenta fazer probe de suporte a ferramentas e imagens com chamadas reais de model.
Se nenhuma chave do OpenRouter estiver configurada, o comando recorre à saída somente de metadados
e explica que models `:free` ainda exigem `OPENROUTER_API_KEY` para
probes e inferência.

Opções:

- `--no-probe` (somente metadados; sem busca de config/segredos)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout da solicitação do catálogo e por probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` exigem probes em tempo real; resultados de varredura
somente de metadados são informativos e não são aplicados à config.

### `models status`

Opções:

- `--json`
- `--plain`
- `--check` (saída 1=expirado/ausente, 2=expirando)
- `--probe` (probe em tempo real dos perfis de auth configurados)
- `--probe-provider <name>` (faz probe de um provider)
- `--probe-profile <id>` (repetível ou ids separados por vírgula)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id do agente configurado; substitui `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Categorias de status do probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos de detalhe/código de motivo do probe que você pode esperar:

- `excluded_by_auth_order`: existe um perfil armazenado, mas `auth.order.<provider>` explícito
  o omitiu, então o probe relata a exclusão em vez de
  tentar usá-lo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  o perfil está presente, mas não está elegível/resolúvel.
- `no_model`: existe auth do provider, mas o OpenClaw não conseguiu resolver um candidato de model
  apto para probe nesse provider.

## Aliases + fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Perfis de auth

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` é o helper interativo de auth. Ele pode iniciar um fluxo de auth do provider
(OAuth/API key) ou orientar você para colar manualmente um token, dependendo do
provider escolhido.

`models auth login` executa o fluxo de auth de um Plugin de provider (OAuth/API key). Use
`openclaw plugins list` para ver quais providers estão instalados.
Use `openclaw models auth --agent <id> <subcommand>` para gravar resultados de auth em um
armazenamento específico de agente configurado. A flag pai `--agent` é respeitada por
`add`, `login`, `setup-token`, `paste-token` e `login-github-copilot`.

Exemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Observações:

- `setup-token` e `paste-token` continuam sendo comandos genéricos de token para providers
  que expõem métodos de auth por token.
- `setup-token` exige um TTY interativo e executa o método de auth por token do provider
  (usando por padrão o método `setup-token` daquele provider quando ele expõe
  um).
- `paste-token` aceita uma string de token gerada em outro lugar ou por automação.
- `paste-token` exige `--provider`, solicita o valor do token e o grava
  no id de perfil padrão `<provider>:manual`, a menos que você passe
  `--profile-id`.
- `paste-token --expires-in <duration>` armazena uma expiração absoluta do token a partir de uma
  duração relativa como `365d` ou `12h`.
- Observação sobre Anthropic: a equipe da Anthropic nos informou que o uso no estilo Claude CLI do OpenClaw é permitido novamente, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados para essa integração, a menos que a Anthropic publique uma nova política.
- `setup-token` / `paste-token` da Anthropic continuam disponíveis como um caminho de token compatível do OpenClaw, mas o OpenClaw agora prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Seleção de model](/pt-BR/concepts/model-providers)
- [Failover de model](/pt-BR/concepts/model-failover)
