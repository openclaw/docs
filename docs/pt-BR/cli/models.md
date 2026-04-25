---
read_when:
    - Você quer alterar os modelos padrão ou ver o status de autenticação do provider
    - Você quer escanear modelos/providers disponíveis e depurar perfis de autenticação
summary: Referência de CLI para `openclaw models` (status/list/set/scan, aliases, fallbacks, auth)
title: Modelos
x-i18n:
    generated_at: "2026-04-25T13:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Descoberta, escaneamento e configuração de modelos (modelo padrão, fallbacks, perfis de autenticação).

Relacionado:

- Providers + modelos: [Modelos](/pt-BR/providers/models)
- Conceitos de seleção de modelos + comando slash `/models`: [Conceito de modelos](/pt-BR/concepts/models)
- Configuração de autenticação de provider: [Primeiros passos](/pt-BR/start/getting-started)

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
Codex, MiniMax, Xiaomi e z.ai. A autenticação de uso vem de hooks específicos
do provider quando disponíveis; caso contrário, o OpenClaw faz fallback para a correspondência de
credenciais OAuth/chave de API de perfis de autenticação, env ou configuração.
Na saída `--json`, `auth.providers` é a visão geral do provider com reconhecimento
de env/config/store, enquanto `auth.oauth` é apenas o estado dos perfis do armazenamento de autenticação.
Adicione `--probe` para executar sondagens de autenticação ao vivo em cada perfil de provider configurado.
As sondagens são solicitações reais (podem consumir tokens e acionar limites de taxa).
Use `--agent <id>` para inspecionar o estado de modelo/autenticação de um agente configurado. Quando omitido,
o comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se definido; caso contrário, usa o
agente padrão configurado.
As linhas de sondagem podem vir de perfis de autenticação, credenciais de env ou `models.json`.

Observações:

- `models set <model-or-alias>` aceita `provider/model` ou um alias.
- `models list` é somente leitura: lê a configuração, os perfis de autenticação, o estado
  existente do catálogo e linhas de catálogo de propriedade do provider, mas não regrava
  `models.json`.
- `models list --all` inclui linhas estáticas de catálogo de propriedade do provider incluídas
  mesmo quando você ainda não autenticou com esse provider. Essas linhas ainda aparecem
  como indisponíveis até que a autenticação correspondente seja configurada.
- `models list` mantém distintos os metadados nativos do modelo e os limites de runtime. Na
  saída em tabela, `Ctx` mostra `contextTokens/contextWindow` quando um limite efetivo
  de runtime difere da janela de contexto nativa; as linhas JSON incluem `contextTokens`
  quando um provider expõe esse limite.
- `models list --provider <id>` filtra por ID do provider, como `moonshot` ou
  `openai-codex`. Não aceita rótulos de exibição de seletores interativos de provider,
  como `Moonshot AI`.
- Referências de modelo são analisadas dividindo na **primeira** `/`. Se o ID do modelo inclui `/` (estilo OpenRouter), inclua o prefixo do provider (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provider, o OpenClaw resolve a entrada primeiro como um alias, depois
  como uma correspondência única de provider configurado para esse ID exato de modelo, e só então
  faz fallback para o provider padrão configurado com um aviso de descontinuação.
  Se esse provider não expuser mais o modelo padrão configurado, o OpenClaw
  faz fallback para o primeiro provider/modelo configurado em vez de exibir um
  padrão obsoleto de provider removido.
- `models status` pode mostrar `marker(<value>)` na saída de autenticação para placeholders não secretos (por exemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) em vez de mascará-los como segredos.

### `models scan`

`models scan` lê o catálogo público `:free` do OpenRouter e classifica candidatos para
uso como fallback. O catálogo em si é público, portanto escaneamentos somente de metadados não precisam
de uma chave do OpenRouter.

Por padrão, o OpenClaw tenta sondar suporte a ferramentas e imagens com chamadas reais ao modelo.
Se nenhuma chave do OpenRouter estiver configurada, o comando faz fallback para saída somente
de metadados e explica que modelos `:free` ainda exigem `OPENROUTER_API_KEY` para
sondagens e inferência.

Opções:

- `--no-probe` (somente metadados; sem consulta a config/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout da solicitação do catálogo e de cada sondagem)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` exigem sondagens ao vivo; resultados de escaneamento
somente de metadados são informativos e não são aplicados à configuração.

### `models status`

Opções:

- `--json`
- `--plain`
- `--check` (saída 1=expirado/ausente, 2=expirando)
- `--probe` (sondagem ao vivo dos perfis de autenticação configurados)
- `--probe-provider <name>` (sonda um provider)
- `--probe-profile <id>` (repetível ou IDs separados por vírgula)
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

Casos de detalhe/código de motivo esperados na sondagem:

- `excluded_by_auth_order`: existe um perfil armazenado, mas `auth.order.<provider>`
  explícito o omitiu, então a sondagem relata a exclusão em vez de
  tentar usá-lo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  o perfil está presente, mas não está elegível/resolúvel.
- `no_model`: existe autenticação do provider, mas o OpenClaw não conseguiu resolver um
  candidato de modelo sondável para esse provider.

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

`models auth add` é o helper interativo de autenticação. Ele pode iniciar um fluxo
de autenticação do provider (OAuth/chave de API) ou orientar você para colagem manual
de token, dependendo do provider escolhido.

`models auth login` executa o fluxo de autenticação de um Plugin de provider (OAuth/chave de API). Use
`openclaw plugins list` para ver quais providers estão instalados.

Exemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Observações:

- `setup-token` e `paste-token` continuam sendo comandos genéricos de token para providers
  que expõem métodos de autenticação por token.
- `setup-token` exige um TTY interativo e executa o método de autenticação por token do provider
  (por padrão, o método `setup-token` desse provider quando ele expõe
  um).
- `paste-token` aceita uma string de token gerada em outro lugar ou por automação.
- `paste-token` exige `--provider`, solicita o valor do token e o grava
  no ID de perfil padrão `<provider>:manual`, a menos que você use
  `--profile-id`.
- `paste-token --expires-in <duration>` armazena uma expiração absoluta do token a partir de uma
  duração relativa como `365d` ou `12h`.
- Observação sobre Anthropic: a equipe da Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw é permitido novamente, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados para essa integração, a menos que a Anthropic publique uma nova política.
- `setup-token` / `paste-token` do Anthropic continuam disponíveis como um caminho compatível de token do OpenClaw, mas o OpenClaw agora prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.

## Relacionado

- [Referência de CLI](/pt-BR/cli)
- [Seleção de modelo](/pt-BR/concepts/model-providers)
- [Failover de modelo](/pt-BR/concepts/model-failover)
