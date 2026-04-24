---
read_when:
    - Você quer alterar modelos padrão ou ver o status de autenticação do provedor
    - Você quer verificar modelos/provedores disponíveis e depurar perfis de autenticação
summary: Referência da CLI para `openclaw models` (status/list/set/scan, aliases, fallbacks, autenticação)
title: Modelos
x-i18n:
    generated_at: "2026-04-24T05:45:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Descoberta, varredura e configuração de modelos (modelo padrão, fallbacks, perfis de autenticação).

Relacionado:

- Provedores + modelos: [Modelos](/pt-BR/providers/models)
- Conceitos de seleção de modelo + comando com barra `/models`: [Conceito de modelos](/pt-BR/concepts/models)
- Configuração de autenticação do provedor: [Primeiros passos](/pt-BR/start/getting-started)

## Comandos comuns

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra os padrões/fallbacks resolvidos mais uma visão geral da autenticação.
Quando snapshots de uso do provedor estão disponíveis, a seção de status de OAuth/chave de API inclui
janelas de uso do provedor e snapshots de cota.
Provedores atuais de janela de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. A autenticação de uso vem de hooks específicos do provedor
quando disponíveis; caso contrário, o OpenClaw recorre à correspondência de
credenciais OAuth/chave de API de perfis de autenticação, env ou configuração.
Na saída `--json`, `auth.providers` é a visão geral do provedor
com reconhecimento de env/config/store, enquanto `auth.oauth` é apenas o estado dos perfis do auth-store.
Adicione `--probe` para executar sondagens de autenticação em tempo real em cada perfil de provedor configurado.
As sondagens são solicitações reais (podem consumir tokens e acionar limites de taxa).
Use `--agent <id>` para inspecionar o estado de modelo/autenticação de um agente configurado. Quando omitido,
o comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se definido; caso contrário, usa o
agente padrão configurado.
As linhas de sondagem podem vir de perfis de autenticação, credenciais de env ou `models.json`.

Observações:

- `models set <model-or-alias>` aceita `provider/model` ou um alias.
- `models list` é somente leitura: ele lê a configuração, perfis de autenticação, o estado de catálogo
  existente e linhas de catálogo pertencentes ao provedor, mas não reescreve
  `models.json`.
- `models list --all` inclui linhas estáticas de catálogo pertencentes ao provedor e incluídas no pacote, mesmo
  quando você ainda não autenticou com esse provedor. Essas linhas ainda aparecem
  como indisponíveis até que uma autenticação correspondente seja configurada.
- `models list --provider <id>` filtra por ID do provedor, como `moonshot` ou
  `openai-codex`. Ele não aceita rótulos de exibição de seletores interativos de provedor,
  como `Moonshot AI`.
- Referências de modelo são analisadas dividindo na **primeira** `/`. Se o ID do modelo incluir `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw resolve a entrada primeiro como alias, depois
  como uma correspondência única de provedor configurado para esse ID exato de modelo, e só então
  recorre ao provedor padrão configurado com um aviso de descontinuação.
  Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw
  recorre ao primeiro provedor/modelo configurado em vez de exibir um
  padrão obsoleto de provedor removido.
- `models status` pode mostrar `marker(<value>)` na saída de autenticação para placeholders não secretos (por exemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) em vez de mascará-los como segredos.

### `models status`

Opções:

- `--json`
- `--plain`
- `--check` (saída 1=expirado/ausente, 2=expirando)
- `--probe` (sondagem em tempo real dos perfis de autenticação configurados)
- `--probe-provider <name>` (sondar um provedor)
- `--probe-profile <id>` (repetível ou IDs de perfil separados por vírgula)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID do agente configurado; substitui `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Categorias de status da sondagem:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos de detalhe/código de motivo da sondagem esperados:

- `excluded_by_auth_order`: existe um perfil armazenado, mas
  `auth.order.<provider>` explícito o omitiu, então a sondagem relata a exclusão em vez de
  tentar usá-lo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  o perfil está presente, mas não está elegível/resolvido.
- `no_model`: existe autenticação do provedor, mas o OpenClaw não conseguiu resolver um
  candidato de modelo sondável para esse provedor.

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

`models auth add` é o auxiliar interativo de autenticação. Ele pode iniciar um fluxo de autenticação do provedor
(OAuth/chave de API) ou orientar você para a colagem manual de token, dependendo do
provedor escolhido.

`models auth login` executa o fluxo de autenticação de um plugin de provedor (OAuth/chave de API). Use
`openclaw plugins list` para ver quais provedores estão instalados.

Exemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Observações:

- `setup-token` e `paste-token` continuam sendo comandos genéricos de token para provedores
  que expõem métodos de autenticação por token.
- `setup-token` exige um TTY interativo e executa o método de autenticação por token do provedor
  (usando por padrão o método `setup-token` desse provedor quando ele expõe
  um).
- `paste-token` aceita uma string de token gerada em outro lugar ou por automação.
- `paste-token` exige `--provider`, solicita o valor do token e o grava
  no ID de perfil padrão `<provider>:manual`, a menos que você passe
  `--profile-id`.
- `paste-token --expires-in <duration>` armazena uma expiração absoluta do token a partir de uma
  duração relativa, como `365d` ou `12h`.
- Observação sobre Anthropic: a equipe da Anthropic nos informou que o uso no estilo Claude CLI do OpenClaw é permitido novamente, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados para esta integração, a menos que a Anthropic publique uma nova política.
- Anthropic `setup-token` / `paste-token` continuam disponíveis como um caminho compatível de token no OpenClaw, mas o OpenClaw agora prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Seleção de modelo](/pt-BR/concepts/model-providers)
- [Failover de modelo](/pt-BR/concepts/model-failover)
