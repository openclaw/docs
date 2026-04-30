---
read_when:
    - Você quer alterar os modelos padrão ou visualizar o status de autenticação do provedor
    - Você quer verificar os modelos/provedores disponíveis e depurar perfis de autenticação
summary: Referência da CLI para `openclaw models` (status/list/set/scan, aliases, alternativas, autenticação)
title: Modelos
x-i18n:
    generated_at: "2026-04-30T09:42:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Descoberta, varredura e configuração de modelos (modelo padrão, alternativas, perfis de autenticação).

Relacionado:

- Provedores + modelos: [Modelos](/pt-BR/providers/models)
- Conceitos de seleção de modelo + comando de barra `/models`: [Conceito de modelos](/pt-BR/concepts/models)
- Configuração de autenticação de provedor: [Primeiros passos](/pt-BR/start/getting-started)

## Comandos comuns

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra o padrão/as alternativas resolvidos, além de uma visão geral de autenticação.
Quando snapshots de uso do provedor estão disponíveis, a seção de status OAuth/chave de API inclui
janelas de uso do provedor e snapshots de cota.
Provedores atuais de janela de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. A autenticação de uso vem de hooks específicos do provedor
quando disponíveis; caso contrário, o OpenClaw recorre a credenciais OAuth/chave de API
correspondentes de perfis de autenticação, env ou config.
Na saída `--json`, `auth.providers` é a visão geral de provedores ciente de env/config/store,
enquanto `auth.oauth` é apenas a integridade dos perfis do armazenamento de autenticação.
Adicione `--probe` para executar sondagens de autenticação ao vivo em cada perfil de provedor configurado.
Sondagens são solicitações reais (podem consumir tokens e acionar limites de taxa).
Use `--agent <id>` para inspecionar o estado de modelo/autenticação de um agente configurado. Quando omitido,
o comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se definido; caso contrário, usa o
agente padrão configurado.
Linhas de sondagem podem vir de perfis de autenticação, credenciais de env ou `models.json`.

Observações:

- `models set <model-or-alias>` aceita `provider/model` ou um alias.
- `models list` é somente leitura: ele lê a config, os perfis de autenticação, o estado de catálogo
  existente e as linhas de catálogo pertencentes ao provedor, mas não reescreve
  `models.json`.
- A coluna `Auth` é em nível de provedor e somente leitura. Ela é calculada a partir de metadados
  locais de perfil de autenticação, marcadores de env, chaves de provedor configuradas, marcadores de
  provedor local, marcadores de env/perfil do AWS Bedrock e metadados de autenticação sintética de plugins;
  ela não carrega o runtime do provedor, não lê segredos do keychain, não chama APIs do provedor
  nem comprova a prontidão exata de execução por modelo.
- `models list --all --provider <id>` pode incluir linhas estáticas de catálogo pertencentes ao provedor
  vindas de manifests de plugin ou metadados de catálogo de provedor incluídos, mesmo quando você
  ainda não se autenticou nesse provedor. Essas linhas ainda aparecem como
  indisponíveis até que a autenticação correspondente seja configurada.
- `models list --all` amplo mescla linhas de catálogo de manifest sobre linhas de registro
  sem carregar hooks suplementares de runtime do provedor. Caminhos rápidos de manifest filtrados por provedor
  usam apenas provedores marcados como `static`; provedores marcados como `refreshable`
  permanecem baseados em registro/cache e acrescentam linhas de manifest como suplementos, enquanto
  provedores marcados como `runtime` permanecem na descoberta por registro/runtime.
- `models list` mantém metadados nativos de modelo e limites de runtime distintos. Na saída em tabela,
  `Ctx` mostra `contextTokens/contextWindow` quando um limite efetivo de runtime
  difere da janela de contexto nativa; linhas JSON incluem `contextTokens`
  quando um provedor expõe esse limite.
- `models list --provider <id>` filtra por id de provedor, como `moonshot` ou
  `openai-codex`. Ele não aceita rótulos de exibição de seletores interativos de provedor,
  como `Moonshot AI`.
- Referências de modelo são analisadas dividindo no **primeiro** `/`. Se o ID do modelo incluir `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw resolve a entrada primeiro como um alias, depois
  como uma correspondência única de provedor configurado para esse id de modelo exato, e só então
  recorre ao provedor padrão configurado com um aviso de depreciação.
  Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw
  recorre ao primeiro provedor/modelo configurado em vez de expor um
  padrão obsoleto de provedor removido.
- `models status` pode mostrar `marker(<value>)` na saída de autenticação para placeholders não secretos (por exemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) em vez de mascará-los como segredos.

### Varredura de modelos

`models scan` lê o catálogo público `:free` do OpenRouter e classifica candidatos para
uso como alternativa. O catálogo em si é público, então varreduras somente de metadados não precisam de
uma chave do OpenRouter.

Por padrão, o OpenClaw tenta sondar suporte a ferramentas e imagens com chamadas de modelo ao vivo.
Se nenhuma chave do OpenRouter estiver configurada, o comando recorre à saída somente de metadados
e explica que modelos `:free` ainda exigem `OPENROUTER_API_KEY` para
sondagens e inferência.

Opções:

- `--no-probe` (somente metadados; sem consulta a config/segredos)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (solicitação de catálogo e tempo limite por sondagem)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` exigem sondagens ao vivo; resultados de varredura somente de metadados
são informativos e não são aplicados à config.

### Status de modelos

Opções:

- `--json`
- `--plain`
- `--check` (exit 1=expirado/ausente, 2=expirando)
- `--probe` (sondagem ao vivo de perfis de autenticação configurados)
- `--probe-provider <name>` (sondar um provedor)
- `--probe-profile <id>` (repetir ou ids de perfil separados por vírgula)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id de agente configurado; substitui `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` mantém stdout reservado para o payload JSON. Diagnósticos de perfil de autenticação, provedor
e inicialização são roteados para stderr para que scripts possam enviar stdout diretamente
para ferramentas como `jq`.

Buckets de status de sondagem:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos esperados de detalhe/código de motivo da sondagem:

- `excluded_by_auth_order`: existe um perfil armazenado, mas
  `auth.order.<provider>` explícito o omitiu, então a sondagem informa a exclusão em vez de
  tentar usá-lo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  o perfil está presente, mas não é elegível/resolvível.
- `no_model`: existe autenticação do provedor, mas o OpenClaw não conseguiu resolver um candidato
  de modelo sondável para esse provedor.

## Aliases + alternativas

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

`models auth add` é o auxiliar interativo de autenticação. Ele pode iniciar um fluxo de autenticação
do provedor (OAuth/chave de API) ou orientar você na colagem manual de token, dependendo do
provedor escolhido.

`models auth login` executa o fluxo de autenticação de um plugin de provedor (OAuth/chave de API). Use
`openclaw plugins list` para ver quais provedores estão instalados.
Use `openclaw models auth --agent <id> <subcommand>` para gravar resultados de autenticação em um
armazenamento específico de agente configurado. A flag pai `--agent` é respeitada por
`add`, `login`, `setup-token`, `paste-token` e `login-github-copilot`.

Exemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Observações:

- `setup-token` e `paste-token` permanecem comandos genéricos de token para provedores
  que expõem métodos de autenticação por token.
- `setup-token` exige um TTY interativo e executa o método de autenticação por token do provedor
  (usando por padrão o método `setup-token` desse provedor quando ele expõe
  um).
- `paste-token` aceita uma string de token gerada em outro lugar ou por automação.
- `paste-token` exige `--provider`, solicita o valor do token e o grava
  no id de perfil padrão `<provider>:manual`, a menos que você passe
  `--profile-id`.
- `paste-token --expires-in <duration>` armazena uma expiração absoluta de token a partir de uma
  duração relativa, como `365d` ou `12h`.
- Observação sobre a Anthropic: a equipe da Anthropic nos informou que o uso da Claude CLI no estilo OpenClaw é permitido novamente, então o OpenClaw trata a reutilização da Claude CLI e o uso de `claude -p` como sancionados para esta integração, a menos que a Anthropic publique uma nova política.
- Anthropic `setup-token` / `paste-token` permanecem disponíveis como um caminho de token OpenClaw compatível, mas o OpenClaw agora prefere reutilização da Claude CLI e `claude -p` quando disponíveis.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Seleção de modelo](/pt-BR/concepts/model-providers)
- [Failover de modelo](/pt-BR/concepts/model-failover)
