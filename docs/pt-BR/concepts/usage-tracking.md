---
read_when:
    - Você está conectando superfícies de uso/cota do provedor
    - Você precisa explicar o comportamento de rastreamento de uso ou os requisitos de autenticação
summary: Superfícies de rastreamento de uso e requisitos de credenciais
title: Rastreamento de uso
x-i18n:
    generated_at: "2026-06-27T17:28:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## O que é

- Busca o uso/cota do provedor diretamente dos endpoints de uso deles.
- Sem custos estimados; apenas janelas de cota relatadas pelo provedor ou resumos
  de estado da conta.
- A saída de status de janela de cota legível por humanos é normalizada para `X% left`, mesmo
  quando uma API upstream relata cota consumida, cota restante ou apenas contagens
  brutas. Provedores sem janelas de cota redefiníveis podem mostrar texto de resumo
  do provedor em vez disso, como um saldo.
- `/status` e `session_status` no nível da sessão podem recorrer à entrada de uso
  mais recente do transcript quando o snapshot da sessão ativa é escasso. Esse
  fallback preenche contadores ausentes de tokens/cache, pode recuperar o rótulo do
  modelo de runtime ativo e prefere o total maior orientado a prompt quando os
  metadados da sessão estão ausentes ou são menores. Valores ativos não zero
  existentes ainda prevalecem.

## Onde aparece

- `/status` em chats: cartão de status rico em emojis com tokens da sessão + custo estimado (somente chave de API). O uso do provedor aparece para o **provedor do modelo atual** quando disponível como uma janela `X% left` normalizada ou texto de resumo do provedor.
- `/usage off|tokens|full` em chats: rodapé de uso por resposta (OAuth mostra apenas tokens).
- `/usage cost` em chats: resumo de custo local agregado dos logs de sessão do OpenClaw.
- CLI: `openclaw status --usage` imprime uma análise completa por provedor.
- CLI: `openclaw channels list` imprime o mesmo snapshot de uso junto com a configuração do provedor (use `--no-usage` para ignorar).
- Barra de menu do macOS: seção "Uso" em Contexto (somente se disponível).

## Modo padrão do rodapé de uso

`/usage off|tokens|full` define o rodapé de uma sessão e é lembrado para essa
sessão. `messages.responseUsage` semeia esse modo para sessões que ainda não
escolheram um, para que o rodapé possa ficar ativado por padrão sem digitar
`/usage` a cada vez.

Defina um modo para todos os canais ou um mapa por canal com fallback `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Três estados distintos de sessão

O campo `responseUsage` de uma sessão tem três estados representáveis, cada um com
semântica diferente:

| Estado                       | Valor armazenado                 | Modo efetivo                                                               |
| ---------------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| **Não definido / herdar**    | `undefined` (ausente)            | Cai para o padrão de configuração `messages.responseUsage`, depois `off`. |
| **Desativado explicitamente** | `"off"` (armazenado)             | Sempre desativado — um padrão de configuração não `off` não pode reativar o rodapé. |
| **Ativado explicitamente**    | `"tokens"` ou `"full"` (armazenado) | Esse modo, independentemente do padrão de configuração.                    |

### Precedência

Modo efetivo = substituição da sessão → entrada de configuração do canal → `default` → `off`.

Um `/usage off` explícito é **persistido** como o valor literal `"off"` na
sessão, não é o mesmo que "não definido". Isso significa que um padrão
`messages.responseUsage` não `off` não pode reativar o rodapé depois que o usuário
o desativou explicitamente.

### Redefinir vs. desativar

- `/usage off` — força o rodapé a ficar desativado e persiste essa escolha. Um
  padrão configurado não `off` não pode substituir isso.
- `/usage reset` (aliases: `inherit`, `clear`, `default`) — limpa a substituição
  da sessão. Então a sessão **herda** o padrão de configuração efetivo
  (`messages.responseUsage`). Se nenhum padrão estiver configurado, o rodapé fica
  desativado (inalterado em relação a antes). Use isso para "voltar ao padrão" sem
  ativar explicitamente o rodapé.
- Uma redefinição completa de sessão (`/reset` ou `/new`) ou uma rolagem de sessão
  **preserva** a preferência explícita de modo de uso para que a escolha de exibição
  do usuário sobreviva a rolagens de sessão. Somente `/usage reset` (e seus aliases)
  realmente limpa a substituição.

### Comportamento de alternância

`/usage` sem argumentos percorre: off → tokens → full → off. O ponto inicial
do ciclo é o modo atual **efetivo** (substituição da sessão caindo para o padrão
de configuração quando não definida), então o ciclo é sempre consistente com o que
o usuário vê no rodapé.

### Configuração

Sem configuração, o comportamento anterior permanece (rodapé desativado até
`/usage`). Use `/usage reset` para limpar uma substituição de sessão e herdar
novamente o padrão configurado.

## Rodapé personalizado de `/usage full`

`/usage full` mostra um rodapé compacto integrado com modelo, reasoning, fast/slow,
janela de contexto, tokens do turno, cache e custo quando esses campos estão disponíveis. Nenhum
arquivo de template é obrigatório.

`messages.usageTemplate` é apenas para layouts personalizados avançados. O valor é um
caminho de arquivo JSON (compatível com `~`) ou um objeto inline, e substitui o rodapé
integrado quando válido:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Templates ausentes ou vazios voltam silenciosamente para o rodapé integrado. Templates
configurados ilegíveis ou inválidos também voltam para o rodapé integrado e emitem um
aviso ao operador.

Comece templates personalizados a partir do formato integrado e depois edite as partes que você quer
alterar:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Formato

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

Cada superfície é uma lista ordenada de **partes**; o mecanismo renderiza cada uma,
descarta vazias e junta as sobreviventes com `sep`. Uma superfície sem entrada usa
`output.default`.

### Caminhos do contrato

Uma parte lê valores do contrato por turno usando dot-path. Valores ausentes ficam
vazios (então uma guarda `when` ou um `|fallback` mantém a parte limpa).

| Caminho                                                                             | Significado                            |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | id do canal (`discord`/`telegram`/etc.) |
| `model.provider` / `model.display_name`                                             | id do provedor / id do modelo          |
| `model.reasoning`                                                                   | esforço (`off` até `xhigh`)            |
| `model.is_fallback` / `model.is_override`                                           | bool: fallback usado / modelo fixado   |
| `state.fast_mode`                                                                   | bool: rápido vs lento                  |
| `context.max_tokens` / `context.pct_used`                                           | orçamento da janela / 0-100 usado      |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agregado do turno                      |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | guardas de exibição de tokens e percentual de cache |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | somente chamada final do modelo        |
| `cost.turn_usd`                                                                     | custo estimado do turno                |
| `identity.name` / `identity.emoji`                                                  | nome do agente / emoji escolhido       |

(Janelas de limite de taxa do provedor **não** estão neste contrato.)

### Verbos

Encadeie um valor por verbos da esquerda para a direita; um segmento que não é verbo é o fallback.

| Verbo           | Efeito                                | Exemplo                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | contagem compacta                     | `272000 -> 272k`                  |
| `fixed:N`       | N casas decimais (padrão 2)           | `0.0377`                          |
| `dur`           | segundos para duração                 | `14820 -> 4h07m`                  |
| `pct`           | acrescenta `%`                        | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | de usado para restante            |
| `alias:TABLE`   | consulta em `aliases`, ecoa se não listado | `medium -> 🌗`                    |
| `meter:W:SCALE` | barra de glifos de W células sobre um valor de 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = um glifo) |

### Formas de partes

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolação.
- `{ "when": "<path>", "text": "..." }`: renderiza somente se o caminho for truthy.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: valor para glifo.
- `{ "each": "limits.windows", "item": "{label}" }`: itera um array.

### Exemplo

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

renderiza, por exemplo, `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Provedores + credenciais

- **Anthropic (Claude)**: tokens OAuth em perfis de autenticação.
- **GitHub Copilot**: tokens OAuth em perfis de autenticação.
- **Gemini CLI**: tokens OAuth em perfis de autenticação.
  - O uso em JSON recorre a `stats`; `stats.cached` é normalizado para
    `cacheRead`.
- **OpenAI Codex**: tokens OAuth em perfis de autenticação (`accountId` usado quando presente).
- **MiniMax**: chave de API ou perfil de autenticação OAuth do MiniMax. O OpenClaw trata
  `minimax`, `minimax-cn` e `minimax-portal` como a mesma superfície de cota do MiniMax,
  prefere o OAuth do MiniMax armazenado quando presente e, caso contrário, recorre
  a `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  A sondagem de uso deriva o host do Coding Plan de `models.providers.minimax-portal.baseUrl`
  ou `models.providers.minimax.baseUrl` quando configurado e, caso contrário, usa o
  host MiniMax CN.
  Os campos brutos `usage_percent` / `usagePercent` do MiniMax significam cota
  **restante**, então o OpenClaw os inverte antes da exibição; campos baseados em contagem prevalecem quando
  presentes.
  - Os rótulos da janela do Coding Plan vêm dos campos de horas/minutos do provedor quando
    presentes e depois recorrem ao intervalo `start_time` / `end_time`.
  - Se o endpoint do Coding Plan retornar `model_remains`, o OpenClaw prefere a
    entrada do modelo de chat, deriva o rótulo da janela de carimbos de data/hora quando os campos explícitos
    `window_hours` / `window_minutes` estão ausentes e inclui o nome do modelo
    no rótulo do plano.
- **Xiaomi MiMo**: chave de API via env/config/armazenamento de autenticação (`XIAOMI_API_KEY`).
- **z.ai**: chave de API via env/config/armazenamento de autenticação.
- **DeepSeek**: chave de API via env/config/armazenamento de autenticação (`DEEPSEEK_API_KEY`).
  O OpenClaw chama o endpoint de saldo do DeepSeek e mostra o saldo relatado pelo provedor
  como texto em vez de uma janela de cota percentual restante.

O uso fica oculto quando nenhuma autenticação de uso de provedor utilizável pode ser resolvida. Provedores
podem fornecer lógica de autenticação de uso específica do Plugin; caso contrário, o OpenClaw recorre a
credenciais OAuth/chave de API correspondentes de perfis de autenticação, variáveis de ambiente
ou configuração.

## Relacionados

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Uso da API e custos](/pt-BR/reference/api-usage-costs)
- [Cache de prompts](/pt-BR/reference/prompt-caching)
