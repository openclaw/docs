---
read_when:
    - Você quer alterar os modelos padrão ou visualizar o status de autenticação do provedor
    - Você quer verificar os modelos/provedores disponíveis e depurar perfis de autenticação
summary: Referência da CLI para `openclaw models` (status/list/set/scan, aliases, fallbacks, autenticação)
title: Modelos
x-i18n:
    generated_at: "2026-07-12T15:05:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Descoberta, varredura e configuração de modelos (modelo padrão, fallbacks, perfis de autenticação).

Relacionado:

- Provedores + modelos: [Modelos](/pt-BR/providers/models)
- Conceitos de seleção de modelos + comando de barra `/models`: [Conceito de modelos](/pt-BR/concepts/models)
- Configuração de autenticação do provedor: [Primeiros passos](/pt-BR/start/getting-started)

## Comandos comuns

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

Os subcomandos `status` e `auth` aceitam `--agent <id>` para direcionar a um agente configurado; `list`, `scan`, `aliases` e `fallbacks`/`image-fallbacks` sempre usam o agente padrão configurado, e `set`/`set-image` rejeitam `--agent` diretamente. Quando omitido, os comandos compatíveis com `--agent` usam `OPENCLAW_AGENT_DIR`, se definido; caso contrário, usam o agente padrão configurado.

### Status

`openclaw models status` mostra o padrão e os fallbacks resolvidos, além de uma visão geral da autenticação. Quando snapshots de uso dos provedores estão disponíveis, a seção de status de OAuth/chave de API inclui janelas de uso dos provedores e snapshots de cota. Provedores atuais com janelas de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi e z.ai. A autenticação para uso vem de hooks específicos do provedor, quando disponíveis; caso contrário, o OpenClaw recorre às credenciais OAuth/chave de API correspondentes provenientes de perfis de autenticação, variáveis de ambiente ou configuração.

Na saída `--json`, `auth.providers` é a visão geral dos provedores que considera variáveis de ambiente, configuração e armazenamento, enquanto `auth.oauth` representa apenas a integridade dos perfis no armazenamento de autenticação.

Opções:

| Flag                      | Efeito                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--json`                  | Saída JSON; diagnósticos de perfis de autenticação, provedores e inicialização vão para stderr, mantendo stdout utilizável com `jq`. |
| `--plain`                 | Saída em texto simples.                                                                                                      |
| `--check`                 | Encerra com código diferente de zero se a autenticação estiver expirando/expirada: `1` = expirada/ausente, `2` = expirando.   |
| `--probe`                 | Teste em tempo real dos perfis de autenticação configurados. Faz solicitações reais; pode consumir tokens e acionar limites de taxa. |
| `--probe-provider <name>` | Testa somente um provedor.                                                                                                   |
| `--probe-profile <id>`    | Testa IDs específicos de perfis de autenticação (repetidos ou separados por vírgulas).                                       |
| `--probe-timeout <ms>`    | Tempo limite por teste.                                                                                                      |
| `--probe-concurrency <n>` | Testes simultâneos.                                                                                                          |
| `--probe-max-tokens <n>`  | Máximo de tokens do teste (melhor esforço).                                                                                  |
| `--agent <id>`            | ID do agente configurado; substitui `OPENCLAW_AGENT_DIR`.                                                                    |

As linhas dos testes podem vir de perfis de autenticação, credenciais de ambiente ou `models.json`. Categorias de status dos testes: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Códigos de detalhe/motivo esperados quando um teste nunca chega a fazer uma chamada de modelo:

- `excluded_by_auth_order`: existe um perfil armazenado, mas `auth.order.<provider>` explícito o omitiu; portanto, o teste informa a exclusão em vez de tentar usá-lo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: o perfil está presente, mas não é elegível ou não pode ser resolvido.
- `ineligible_profile`: o perfil é incompatível com a configuração do provedor por outro motivo.
- `no_model`: existe autenticação do provedor, mas o OpenClaw não conseguiu resolver um modelo candidato que pudesse ser testado para esse provedor.

Para solucionar problemas de OAuth do OpenAI ChatGPT/Codex, `openclaw models status`, `openclaw models auth list --provider openai` e `openclaw config get agents.defaults.model --json` são a forma mais rápida de confirmar se um agente tem um perfil OAuth `openai` utilizável para `openai/*` por meio do runtime nativo do Codex. Consulte [Configuração do provedor OpenAI](/pt-BR/providers/openai#check-and-recover-codex-oauth-routing).

### Listagem

`openclaw models list` é somente leitura: lê a configuração, os perfis de autenticação, o estado existente do catálogo e as linhas de catálogo pertencentes ao provedor, mas nunca regrava `models.json`.

Opções: `--all` (catálogo completo), `--local` (filtra para modelos locais), `--provider <id>`, `--json`, `--plain`.

Observações:

- A coluna `Auth` é somente leitura. Para rotas de modelos pertencentes ao provedor, como OpenAI, ela associa a rota de API/URL-base de cada linha aos perfis elegíveis na ordem efetiva de `auth.order`, às credenciais de ambiente/configuração e às SecretRefs resolvidas no escopo do comando. Uma linha concreta da OpenAI permanece desconhecida quando sua política de rota não está disponível, em vez de tomar emprestada a autenticação no nível do provedor; verificações legadas somente do provedor e outros provedores mantêm o comportamento no nível do provedor. Os metadados de autenticação sintética do Plugin são apenas uma indicação de capacidade do runtime, não uma comprovação de autenticação nativa da conta; portanto, rotas dependentes de conta permanecem desconhecidas sem evidências positivas do registro. O comando não carrega o runtime do provedor, não lê segredos do chaveiro, não chama APIs do provedor nem comprova a prontidão exata para execução.
- `models list --all --provider <id>` pode incluir linhas estáticas de catálogo pertencentes ao provedor, provenientes de manifestos de Plugin ou de metadados de catálogo de provedores incluídos, mesmo que você ainda não tenha se autenticado nesse provedor. Essas linhas ainda aparecem como indisponíveis até que a autenticação correspondente seja configurada.
- `models list` mantém o plano de controle responsivo enquanto a descoberta do catálogo do provedor está lenta. As visualizações padrão e configurada recorrem a linhas de modelos configuradas ou sintéticas após uma breve espera e permitem que a descoberta seja concluída em segundo plano. Use `--all` quando precisar do catálogo completo descoberto com exatidão e estiver disposto a aguardar a descoberta do provedor.
- O comando amplo `models list --all` mescla linhas de catálogo do manifesto sobre as linhas do registro sem carregar hooks complementares do runtime do provedor. Caminhos rápidos de manifesto filtrados por provedor usam apenas provedores marcados como `static`; provedores marcados como `refreshable` continuam baseados em registro/cache e acrescentam linhas de manifesto como complementos, enquanto provedores marcados como `runtime` continuam usando a descoberta por registro/runtime.
- `models list` mantém distintos os metadados nativos do modelo e os limites do runtime. Na saída tabular, `Ctx` mostra `contextTokens/contextWindow` quando um limite efetivo do runtime difere da janela de contexto nativa; as linhas JSON incluem `contextTokens` quando um provedor expõe esse limite.
- Para rotas pertencentes ao provedor, `models list` projeta uma linha lógica de provedor/modelo na rota selecionada. `Input` e `Ctx` vêm somente de uma linha de catálogo com rota física exata, com substituições lógicas configuradas explicitamente aplicadas por último; uma seleção de rota não resolvida mostra campos de capacidade desconhecidos em vez de tomar emprestados metadados de rotas relacionadas.
- `models list --provider <id>` filtra pelo ID do provedor, como `moonshot` ou `openai`. Não aceita rótulos de exibição de seletores interativos de provedores, como `Moonshot AI`.
- As referências de modelo são analisadas pela divisão na **primeira** `/`. Se o ID do modelo incluir `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw resolve a entrada primeiro como um alias, depois como uma correspondência exclusiva de provedor configurado para esse ID exato de modelo e, somente então, recorre ao provedor padrão configurado com um aviso de descontinuação. Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado em vez de exibir um padrão obsoleto de provedor removido.
- `models status` pode mostrar `marker(<value>)` na saída de autenticação para placeholders que não são segredos (por exemplo, `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), em vez de mascará-los como segredos.

### Definir o modelo padrão/de imagem

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` grava `agents.defaults.model.primary`; `set-image` grava `agents.defaults.imageModel.primary`. Ambos aceitam `provider/model` ou um alias configurado. `set` também repara instalações de Plugins de runtime do Codex/Copilot quando o novo modelo selecionado exige um; `set-image` não faz isso. Nenhum dos comandos aceita `--agent`; eles sempre gravam nos padrões dos agentes.

### Varredura

`models scan` lê o catálogo público `:free` do OpenRouter e classifica candidatos para uso como fallback. O catálogo em si é público; portanto, varreduras somente de metadados não precisam de uma chave do OpenRouter.

Por padrão, o OpenClaw tenta testar o suporte a ferramentas e imagens com chamadas de modelo em tempo real. Se nenhuma chave do OpenRouter estiver configurada, o comando recorre à saída somente de metadados e explica que modelos `:free` ainda exigem `OPENROUTER_API_KEY` para testes e inferência.

Opções:

- `--no-probe` (somente metadados; sem consulta de configuração/segredos)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (tempo limite da solicitação ao catálogo e de cada teste)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` exigem testes em tempo real; resultados de varredura somente de metadados são informativos e não são aplicados à configuração.

## Aliases

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Os aliases são armazenados por entrada de modelo como `agents.defaults.models.<key>.alias`. `add` primeiro resolve `<model-or-alias>` para uma chave canônica de provedor/modelo; assim, criar um alias para outro alias redireciona-o em vez de criar uma cadeia.

## Fallbacks

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

Gerencia `agents.defaults.model.fallbacks`. `openclaw models image-fallbacks list|add|remove|clear` gerencia a lista paralela `agents.defaults.imageModel.fallbacks` com o mesmo formato de subcomandos.

## Perfis de autenticação

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` é o assistente interativo de autenticação. Ele pode iniciar um fluxo de autenticação do provedor (OAuth/chave de API) ou orientar você a colar um token manualmente, dependendo do provedor escolhido.

`models auth list` lista os perfis de autenticação salvos para o agente selecionado sem imprimir tokens, chaves de API ou material secreto de OAuth. Use `--provider <id>` para filtrar por um provedor, como `openai`, e `--json` para automação com scripts.

`models auth login` executa o fluxo de autenticação de um Plugin de provedor (OAuth/chave de API). Use `openclaw plugins list` para ver quais provedores estão instalados. `login` aceita `--profile-id <id>` para provedores que oferecem suporte a perfis nomeados durante o login (use isso para manter separados vários logins do mesmo provedor), `--method <id>` para escolher um método de autenticação específico, `--device-code` como atalho para `--method device-code`, `--set-default` para aplicar o modelo padrão recomendado pelo provedor e `--force` para remover primeiro os perfis existentes desse provedor (use quando um perfil OAuth em cache estiver travado ou quando quiser trocar de conta).

`models auth login-github-copilot` é um atalho para `models auth login --provider github-copilot --method device` (fluxo de dispositivo do GitHub); ele aceita `--yes` para substituir um perfil existente sem solicitar confirmação.

Use `openclaw models auth --agent <id> <subcommand>` para gravar os resultados de autenticação no armazenamento de um agente configurado específico. A flag pai `--agent` é respeitada por `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` e `order get`/`set`/`clear`.

Para modelos da OpenAI, `--provider openai` usa por padrão o login de conta do ChatGPT/Codex. Use `--method api-key` somente quando quiser adicionar um perfil de chave de API da OpenAI, geralmente como alternativa para os limites da assinatura do Codex. Execute `openclaw doctor --fix` para migrar o estado legado mais antigo de autenticação/perfil com o prefixo OpenAI Codex para `openai`.

Exemplos:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Observações:

- `paste-api-key` aceita chaves de API geradas em outro lugar, solicita o valor da chave e o grava no id de perfil padrão `<provider>:manual`, a menos que você forneça `--profile-id`. Em automações, encaminhe a chave pela entrada padrão; por exemplo, `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` e `paste-token` continuam sendo comandos genéricos de token para provedores que disponibilizam métodos de autenticação por token.
- `setup-token` exige um TTY interativo e executa o método de autenticação por token do provedor (usando por padrão o método `setup-token` desse provedor, quando ele disponibiliza um).
- `paste-token` exige `--provider`, solicita o valor do token por padrão e o grava no id de perfil padrão `<provider>:manual`, a menos que você forneça `--profile-id`. Em automações, encaminhe o token pela entrada padrão em vez de passá-lo como argumento, para que as credenciais do provedor não apareçam no histórico do shell nem nas listas de processos.
- `paste-token --expires-in <duration>` armazena uma expiração absoluta do token calculada a partir de uma duração relativa, como `365d` ou `12h`.
- Para `openai`, as chaves de API da OpenAI e o material de token do ChatGPT/OAuth têm formatos de autenticação diferentes. Use `paste-api-key` para chaves de API da OpenAI no formato `sk-...` e `paste-token` somente para material de autenticação por token.
- Anthropic: `setup-token`/`paste-token` são caminhos de autenticação do OpenClaw compatíveis com `anthropic`, mas o OpenClaw prefere reutilizar a CLI do Claude (`claude -p`) no host quando ela está disponível.
- `auth order get/set/clear` gerencia uma substituição por agente da ordem dos perfis de autenticação para um provedor, armazenada em `auth-state.json` (separada da chave de configuração `auth.order.<provider>`). `set` recebe um ou mais ids de perfil em ordem de prioridade; `clear` volta a usar a ordenação da configuração/round-robin.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Seleção de modelos](/pt-BR/concepts/model-providers)
- [Failover de modelos](/pt-BR/concepts/model-failover)
