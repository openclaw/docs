---
read_when:
    - Você quer alterar os modelos padrão ou visualizar o status de autenticação do provedor
    - Você quer verificar os modelos/provedores disponíveis e depurar perfis de autenticação
summary: Referência da CLI para `openclaw models` (status/list/set/scan, aliases, alternativas, autenticação)
title: Modelos
x-i18n:
    generated_at: "2026-06-27T17:20:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Descoberta, varredura e configuração de modelos (modelo padrão, fallbacks, perfis de autenticação).

Relacionado:

- Provedores + modelos: [Modelos](/pt-BR/providers/models)
- Conceitos de seleção de modelos + comando de barra `/models`: [Conceito de modelos](/pt-BR/concepts/models)
- Configuração de autenticação de provedor: [Primeiros passos](/pt-BR/start/getting-started)

## Comandos comuns

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra o padrão/fallbacks resolvidos, além de uma visão geral de autenticação.
Quando instantâneos de uso do provedor estão disponíveis, a seção de status OAuth/chave de API inclui
janelas de uso do provedor e instantâneos de cota.
Provedores atuais de janela de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI,
MiniMax, Xiaomi e z.ai. A autenticação de uso vem de hooks específicos do provedor
quando disponíveis; caso contrário, o OpenClaw recorre a credenciais OAuth/chave de API
correspondentes de perfis de autenticação, ambiente ou configuração.
Na saída `--json`, `auth.providers` é a visão geral do provedor ciente de ambiente/configuração/armazenamento,
enquanto `auth.oauth` é apenas a integridade dos perfis do armazenamento de autenticação.
Adicione `--probe` para executar sondagens de autenticação ao vivo em cada perfil de provedor configurado.
As sondagens são solicitações reais (podem consumir tokens e acionar limites de taxa).
Use `--agent <id>` para inspecionar o estado de modelo/autenticação de um agente configurado. Quando omitido,
o comando usa `OPENCLAW_AGENT_DIR` se definido; caso contrário, usa o
agente padrão configurado.
Linhas de sondagem podem vir de perfis de autenticação, credenciais de ambiente ou `models.json`.
Para solucionar problemas de OAuth do OpenAI ChatGPT/Codex, `openclaw models status`,
`openclaw models auth list --provider openai` e
`openclaw config get agents.defaults.model --json` são a forma mais rápida de
confirmar se um agente tem um perfil OAuth `openai` utilizável para
`openai/*` por meio do runtime nativo do Codex. Consulte [Configuração do provedor OpenAI](/pt-BR/providers/openai#check-and-recover-codex-oauth-routing).

Observações:

- `models set <model-or-alias>` aceita `provider/model` ou um alias.
- `models list` é somente leitura: ele lê configuração, perfis de autenticação, estado de catálogo existente
  e linhas de catálogo pertencentes ao provedor, mas não reescreve
  `models.json`.
- A coluna `Auth` é em nível de provedor e somente leitura. Ela é calculada a partir de metadados locais
  de perfil de autenticação, marcadores de ambiente, chaves de provedor configuradas, marcadores de
  provedor local, marcadores de ambiente/perfil do AWS Bedrock e metadados de autenticação sintética de plugin;
  ela não carrega o runtime do provedor, lê segredos do chaveiro, chama APIs do provedor
  nem comprova prontidão exata de execução por modelo.
- `models list --all --provider <id>` pode incluir linhas de catálogo estático pertencentes ao provedor
  vindas de manifestos de plugin ou metadados de catálogo de provedor incluído, mesmo quando você
  ainda não se autenticou com esse provedor. Essas linhas ainda aparecem como
  indisponíveis até que a autenticação correspondente seja configurada.
- `models list` mantém o plano de controle responsivo enquanto a descoberta de catálogo do provedor
  é lenta. As visualizações padrão e configuradas recorrem a linhas de modelo configuradas ou
  sintéticas após uma espera curta e deixam a descoberta terminar em
  segundo plano. Use `--all` quando precisar do catálogo completo descoberto exato e
  estiver disposto a aguardar a descoberta do provedor.
- Um `models list --all` amplo mescla linhas de catálogo do manifesto sobre linhas do registro
  sem carregar hooks complementares do runtime do provedor. Caminhos rápidos de manifesto filtrados por provedor
  usam apenas provedores marcados como `static`; provedores marcados como `refreshable`
  permanecem apoiados por registro/cache e anexam linhas de manifesto como complementos, enquanto
  provedores marcados como `runtime` permanecem na descoberta de registro/runtime.
- `models list` mantém metadados de modelo nativos e limites de runtime distintos. Na saída em tabela,
  `Ctx` mostra `contextTokens/contextWindow` quando um limite efetivo de runtime
  difere da janela de contexto nativa; linhas JSON incluem `contextTokens`
  quando um provedor expõe esse limite.
- `models list --provider <id>` filtra por id de provedor, como `moonshot` ou
  `openai`. Ele não aceita rótulos de exibição de seletores interativos de provedor,
  como `Moonshot AI`.
- Referências de modelo são analisadas dividindo na **primeira** `/`. Se o ID do modelo incluir `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw resolve a entrada primeiro como um alias, depois
  como uma correspondência única de provedor configurado para esse id exato de modelo e só então
  recorre ao provedor padrão configurado com um aviso de obsolescência.
  Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw
  recorre ao primeiro provedor/modelo configurado em vez de apresentar um
  padrão obsoleto de provedor removido.
- `models status` pode mostrar `marker(<value>)` na saída de autenticação para placeholders não secretos (por exemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) em vez de mascará-los como segredos.

### Varredura de modelos

`models scan` lê o catálogo público `:free` do OpenRouter e ranqueia candidatos para
uso como fallback. O catálogo em si é público, portanto varreduras somente de metadados não precisam
de uma chave do OpenRouter.

Por padrão, o OpenClaw tenta sondar suporte a ferramentas e imagens com chamadas de modelo ao vivo.
Se nenhuma chave do OpenRouter estiver configurada, o comando recorre à saída somente de metadados
e explica que modelos `:free` ainda exigem `OPENROUTER_API_KEY` para
sondagens e inferência.

Opções:

- `--no-probe` (somente metadados; sem consulta de configuração/segredos)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (tempo limite da solicitação de catálogo e por sondagem)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` exigem sondagens ao vivo; resultados de varredura
somente de metadados são informativos e não são aplicados à configuração.

### Status dos modelos

Opções:

- `--json`
- `--plain`
- `--check` (sai com 1=expirado/ausente, 2=expirando)
- `--probe` (sondagem ao vivo de perfis de autenticação configurados)
- `--probe-provider <name>` (sonda um provedor)
- `--probe-profile <id>` (ids de perfil repetidos ou separados por vírgula)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id de agente configurado; substitui `OPENCLAW_AGENT_DIR`)

`--json` mantém stdout reservado para o payload JSON. Diagnósticos de perfil de autenticação, provedor
e inicialização são direcionados para stderr para que scripts possam canalizar stdout diretamente
para ferramentas como `jq`.

Categorias de status de sondagem:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos esperados de detalhe/código de motivo da sondagem:

- `excluded_by_auth_order`: existe um perfil armazenado, mas uma
  `auth.order.<provider>` explícita o omitiu, então a sondagem relata a exclusão em vez de
  tentar usá-lo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  o perfil está presente, mas não é elegível/resolvível.
- `no_model`: a autenticação do provedor existe, mas o OpenClaw não conseguiu resolver um candidato
  de modelo sondável para esse provedor.

## Aliases + fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Perfis de autenticação

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` é o auxiliar interativo de autenticação. Ele pode iniciar um fluxo de autenticação
do provedor (OAuth/chave de API) ou orientar você na colagem manual de token, dependendo do
provedor escolhido.

`models auth list` lista os perfis de autenticação salvos para o agente selecionado sem
imprimir token, chave de API ou material secreto OAuth. Use `--provider <id>` para
filtrar para um provedor, como `openai`, e `--json` para scripts.

`models auth login` executa o fluxo de autenticação de um plugin de provedor (OAuth/chave de API). Use
`openclaw plugins list` para ver quais provedores estão instalados.
Use `openclaw models auth --agent <id> <subcommand>` para gravar resultados de autenticação em um
armazenamento específico de agente configurado. A flag pai `--agent` é respeitada por
`add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token` e
`login-github-copilot`.

Para modelos OpenAI, `--provider openai` usa por padrão login de conta ChatGPT/Codex.
Use `--method api-key` apenas quando quiser adicionar um perfil de chave de API OpenAI,
normalmente como backup para limites de assinatura do Codex. Execute `openclaw doctor --fix`
para migrar estados antigos de autenticação/perfil com prefixo legado OpenAI Codex para `openai`.

Exemplos:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Observações:

- `login` aceita `--profile-id <id>` para provedores que oferecem suporte a perfis
  nomeados durante o login. Use isso para manter separados múltiplos logins para o mesmo
  provedor.
- `paste-api-key` aceita chaves de API geradas em outro lugar, solicita o valor da chave
  e o grava no id de perfil padrão `<provider>:manual`, a menos que você
  passe `--profile-id`. Em automação, canalize a chave em stdin, por exemplo
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` e `paste-token` continuam sendo comandos genéricos de token para provedores
  que expõem métodos de autenticação por token.
- `setup-token` exige um TTY interativo e executa o método de autenticação por token do provedor
  (usando por padrão o método `setup-token` desse provedor quando ele expõe
  um).
- `paste-token` aceita uma string de token gerada em outro lugar ou por automação.
- `paste-token` exige `--provider`, solicita o valor do token por padrão
  e o grava no id de perfil padrão `<provider>:manual`, a menos que você passe
  `--profile-id`.
- Em automação, canalize o token em stdin em vez de passá-lo como argumento para que
  as credenciais do provedor não apareçam no histórico do shell nem em listas de processos.
- `paste-token --expires-in <duration>` armazena uma expiração absoluta do token a partir de uma
  duração relativa como `365d` ou `12h`.
- Para `openai`, chaves de API OpenAI e material de token ChatGPT/OAuth são
  formatos de autenticação diferentes. Use `paste-api-key` para chaves de API OpenAI `sk-...` e
  `paste-token` apenas para material de autenticação por token.
- Observação sobre Anthropic: a equipe da Anthropic nos informou que o uso estilo OpenClaw da Claude CLI é permitido novamente, então o OpenClaw trata o reuso da Claude CLI e o uso de `claude -p` como sancionados para esta integração, a menos que a Anthropic publique uma nova política.
- Anthropic `setup-token` / `paste-token` continuam disponíveis como um caminho de token compatível do OpenClaw, mas o OpenClaw agora prefere o reuso da Claude CLI e `claude -p` quando disponíveis.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Seleção de modelos](/pt-BR/concepts/model-providers)
- [Failover de modelos](/pt-BR/concepts/model-failover)
