---
read_when:
    - Você está conectando as interfaces de uso/cota do provedor
    - Você precisa explicar o comportamento do monitoramento de uso ou os requisitos de autenticação.
summary: Superfícies de rastreamento de uso e requisitos de credenciais
title: Monitoramento de uso
x-i18n:
    generated_at: "2026-07-11T23:54:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## O que é

- Obtém o uso e a cota do provedor diretamente do endpoint de uso de cada provedor. Não há estimativa de cobrança do provedor; somente nomes de planos, janelas de cota, saldos, gastos, orçamentos, histórico de custos diários, atribuição de tokens/modelos ou resumos do estado da conta informados pelo provedor.
- A saída legível das janelas de cota é normalizada como `X% left`, mesmo quando um provedor informa a cota consumida, a cota restante ou apenas contagens brutas. Provedores sem janelas de cota redefiníveis exibem um texto de resumo do provedor (por exemplo, um saldo).
- O `/status` no nível da sessão e a ferramenta `session_status` recorrem ao log de transcrição da sessão quando o instantâneo da sessão ativa não contém dados de tokens/modelo. Esse recurso preenche contadores ausentes de tokens/cache, pode recuperar o rótulo do modelo de runtime ativo e prefere o maior total orientado ao prompt quando os metadados da sessão estão ausentes ou são menores (`totalTokensFresh !== true`, zero ou abaixo do valor derivado da transcrição). Valores ativos diferentes de zero sempre prevalecem sobre esse recurso.

## Onde aparece

- `/status` nos chats: cartão de status com os tokens da sessão e o custo estimado (somente modelos com chave de API). Quando disponível, o uso do provedor é exibido para o **provedor do modelo atual**, como uma janela normalizada `X% left` ou um texto de resumo do provedor.
- `/usage off|tokens|full` nos chats: rodapé de uso por resposta.
- `/usage cost` nos chats: resumo local de custos agregado com base nos logs de sessão do OpenClaw.
- CLI: `openclaw status --usage` imprime uma análise completa do uso e da cota por provedor.
- CLI: `openclaw models status` lista os perfis de autenticação OAuth/token e exibe um resumo da janela de uso ao lado de cada provedor que tenha uma.
- Interface de Controle: **Uso** exibe cartões do plano e da cobrança do provedor acima da análise de tokens e custos estimados do OpenClaw derivada da sessão. As credenciais da API Admin da Anthropic e da OpenAI acrescentam gastos informados pelo provedor referentes a hoje, 7 dias e 30 dias, tendências diárias, totais de tokens, principais modelos e categorias de custos.
- Interface de Controle: o popover do anel de contexto do compositor do chat exibe o **uso do plano** para provedores de assinatura — barras por janela (5 horas, semanal e específica do modelo), com horários de redefinição, o plano do provedor quando conhecido (por exemplo, `Max (20x)`) e créditos de uso adicional. Sessões cobradas por meio de um plano ocultam estimativas monetárias por token; sessões cobradas via API mantêm `Est. cost` e a análise de custos por tipo. Configurações da CLI do Claude Code (`claude-cli`) reutilizam o mesmo uso da assinatura da Anthropic.
- Barra de menus do macOS: uma seção raiz "Uso" aparece abaixo de Contexto quando estão disponíveis instantâneos de uso do provedor. Consulte [Barra de menus](/pt-BR/platforms/mac/menu-bar).

`openclaw channels list` não imprime mais o uso do provedor; em vez disso, direciona os usuários para `openclaw status` ou `openclaw models list`.

## Histórico de custos da Anthropic e da OpenAI

A cota de assinatura e a cobrança da API são superfícies diferentes do provedor:

- As credenciais de assinatura/configuração da Anthropic continuam exibindo as janelas de cota do Claude e orçamentos opcionais de uso adicional. Defina `ANTHROPIC_ADMIN_KEY` ou `ANTHROPIC_ADMIN_API_KEY` para exibir o histórico das APIs de Uso e Custo da organização. Uma credencial do provedor Anthropic que comece com `sk-ant-admin` é detectada automaticamente.
- O OAuth do OpenAI ChatGPT/Codex continua exibindo o plano, as janelas de cota e o saldo de créditos. Defina `OPENAI_ADMIN_KEY` para exibir o histórico de custos e uso de conclusões da organização; opcionalmente, defina `OPENAI_PROJECT_ID` para restringi-lo a um projeto. O OpenClaw nunca envia credenciais de inferência de `OPENAI_API_KEY`, da configuração do provedor ou dos perfis de autenticação para APIs da organização, pois essas chaves podem pertencer a endpoints personalizados.

As credenciais administrativas têm precedência porque fornecem a cobrança real da organização. O OpenClaw não combina esses totais informados pelo provedor com suas estimativas locais de sessão; as duas seções respondem intencionalmente a perguntas diferentes.

## Modo padrão do rodapé de uso

`/usage off|tokens|full` define o rodapé de uma sessão e essa configuração é lembrada para essa
sessão. `messages.responseUsage` inicializa esse modo para sessões que ainda não
escolheram um, permitindo que o rodapé fique ativado por padrão sem digitar `/usage` todas as vezes.

Defina um modo para todos os canais ou um mapa por canal com um fallback `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

Valores aceitos: `"off"`, `"tokens"`, `"full"` e o alias legado `"on"` (tratado como `"tokens"`).

### Três estados distintos da sessão

O campo `responseUsage` de uma sessão tem três estados representáveis, cada um com
uma semântica diferente:

| Estado                     | Valor armazenado                 | Modo efetivo                                                                 |
| -------------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| **Não definido / herdar**  | `undefined` (ausente)            | Recorre ao padrão da configuração `messages.responseUsage` e depois a `off`. |
| **Desativado explicitamente** | `"off"` (armazenado)          | Sempre desativado; um padrão de configuração diferente de `off` não pode reativar o rodapé. |
| **Ativado explicitamente** | `"tokens"` ou `"full"` (armazenado) | Esse modo, independentemente do padrão da configuração.                    |

### Precedência

Modo efetivo = substituição da sessão → entrada de configuração do canal → `default` → `off`.

Um `/usage off` explícito é **persistido** como o valor literal `"off"` na
sessão, o que não equivale a "não definido". Um padrão `messages.responseUsage`
diferente de `off` não pode reativar o rodapé depois que o usuário o desativou explicitamente.

### Redefinir em comparação com desativar

- `/usage off` força a desativação do rodapé e persiste essa escolha. Um padrão
  configurado diferente de `off` não pode substituí-la.
- `/usage reset` (aliases: `default`, `inherit`, `inherited`, `clear`, `unpin`) limpa a
  substituição da sessão. A sessão passa então a **herdar** o padrão efetivo da configuração
  (`messages.responseUsage`). Se nenhum padrão estiver configurado, o rodapé permanecerá desativado.
- Uma redefinição completa da sessão (`/reset` ou `/new`) ou uma rotação de sessão **preserva**
  a preferência explícita do modo de uso, para que a escolha de exibição do usuário sobreviva
  às rotações de sessão. Somente `/usage reset` (e seus aliases) limpa a substituição.

### Comportamento da alternância

`/usage` sem argumentos percorre: off → tokens → full → off. O ponto inicial
do ciclo é o modo atual **efetivo** (a substituição da sessão recorre
ao padrão da configuração quando não está definida), portanto o ciclo sempre corresponde ao que
o usuário vê atualmente no rodapé.

### Configuração

Sem configuração, o comportamento anterior é mantido (rodapé desativado até o uso de `/usage`). Use
`/usage reset` para limpar uma substituição da sessão e voltar a herdar o padrão configurado.

## Rodapé personalizado de `/usage full`

`/usage tokens` sempre renderiza uma linha simples `Usage: X in / Y out` (além de sufixos de cache e
custo estimado, quando disponíveis). Somente `/usage full` renderiza o rodapé mais
detalhado descrito abaixo.

`/usage full` exibe um rodapé compacto integrado com modelo, raciocínio, modo rápido/lento,
janela de contexto e custo quando esses campos estão disponíveis. Nenhum arquivo de modelo
é necessário para o rodapé integrado.

`messages.usageTemplate` destina-se apenas a layouts personalizados avançados. O valor é um
caminho de arquivo JSON (compatível com `~`) ou um objeto embutido, e substitui o rodapé
integrado quando é válido. Um caminho de arquivo é monitorado e recarregado em tempo real quando alterado.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Modelos ausentes ou vazios recorrem silenciosamente ao rodapé integrado. Modelos configurados
ilegíveis ou inválidos (JSON inválido ou uma estrutura sem partes de saída renderizáveis)
também recorrem ao rodapé integrado e emitem um aviso ao operador.

Comece os modelos personalizados com a estrutura integrada e depois edite as partes que deseja
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
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Estrutura

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [/* pieces */], // fallback for any surface
    "surfaces": {
      "discord": [/* pieces */],
      "telegram": [/* pieces */],
    },
  },
}
```

Cada superfície é uma lista ordenada de **partes**; o mecanismo renderiza cada uma, descarta
as vazias e une as restantes com `sep`. Uma superfície sem entrada usa
`output.default`.

### Caminhos do contrato

Uma parte lê valores do contrato por turno por meio de um caminho com pontos. Valores ausentes ficam
vazios (portanto, uma proteção `when` ou um `|fallback` mantém a parte limpa).

| Caminho                                                                             | Significado                                                                                                              |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `surface`                                                                           | id do canal (`discord`/`telegram`/etc.)                                                                                  |
| `agentId` / `chat_type`                                                             | id do agente proprietário / tipo de superfície de chat                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | id do modelo / nome de exibição / id do provedor                                                                         |
| `model.actual`, `model.resolved_ref`                                                | referência de provedor/modelo efetivamente usada no turno                                                                |
| `model.requested`                                                                   | referência de provedor/modelo solicitada (antes do fallback)                                                             |
| `model.reasoning`                                                                   | esforço (`off` a `xhigh`)                                                                                                |
| `model.is_fallback` / `model.is_override`                                           | bool: fallback usado / modelo fixado                                                                                     |
| `model.override_source` / `model.auth_mode`                                         | rótulo da origem da substituição / modo de credencial (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`)       |
| `state.fast_mode`                                                                   | bool: rápido vs. lento                                                                                                   |
| `state.compactions`                                                                 | contagem de Compaction da sessão                                                                                         |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | orçamento da janela / tokens ocupados / percentual usado de 0 a 100                                                     |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | agregado do turno                                                                                                        |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | tokens de leitura e gravação do cache no turno                                                                           |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | condições de exibição dos tokens                                                                                         |
| `usage.cache_hit_pct`                                                               | parcela de leituras do cache no total de tokens do prompt                                                                |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | somente a chamada final do modelo (também tem `cache_read_tokens`, `cache_write_tokens`, `total_tokens`)                 |
| `cost.turn_usd` / `cost.available`                                                  | custo estimado do turno / se uma tabela de custos foi encontrada                                                        |
| `timing.duration_ms`                                                                | duração do turno em tempo decorrido                                                                                      |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | nome / emoji / avatar da identidade do agente                                                                            |
| `session.id`                                                                        | id da sessão                                                                                                             |

(As janelas de limite de taxa do provedor **não** fazem parte deste contrato; atualmente não há nenhum caminho com valor de matriz, portanto uma parte `each` não tem nada sobre o que iterar.)

### Verbos

Passe um valor pelos verbos da esquerda para a direita; um segmento que não seja verbo é o fallback.

| Verbo           | Efeito                                               | Exemplo                                |
| --------------- | ---------------------------------------------------- | -------------------------------------- |
| `num`           | contagem compacta                                    | `272000 -> 272k`                       |
| `fixed:N`       | N casas decimais (padrão: 2)                         | `0.0377`                               |
| `dur`           | segundos para duração                                | `14820 -> 4h07m`                       |
| `pct`           | acrescenta `%`                                       | `96 -> 96%`                            |
| `inv`           | `100 - x`                                            | de usado para restante                 |
| `alias:TABLE`   | busca em `aliases`; repete se não estiver na lista   | `medium -> 🌗`                         |
| `meter:W:SCALE` | barra de glifos com W células para um valor de 0–100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = um glifo) |

### Formatos das partes

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolação.
- `{ "when": "<path>", "text": "..." }`: renderiza somente se o caminho tiver valor verdadeiro.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: valor para glifo (um caso `_default` abrange valores sem correspondência).
- `{ "each": "<array-path>", "item": "{label}" }`: itera sobre um caminho com valor de matriz (nenhum caminho do contrato atual é uma matriz).

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

O uso fica oculto quando não é possível encontrar uma autenticação de uso válida para o provedor. O OpenClaw
descobre automaticamente Plugins de provedor habilitados que declaram
`contracts.usageProviders` e implementam tanto `resolveUsageAuth` quanto
`fetchUsageSnapshot`; não há uma lista de permissões separada para provedores no núcleo. O contrato
estático mantém o escopo da descoberta sem importar todos os Plugins de provedor. Cada
Plugin é responsável pelo próprio endpoint upstream e pelo mapeamento de respostas. O
snapshot compartilhado mantém nomes de planos, janelas de cota, saldos, gastos e orçamentos
independentes do provedor para consumidores da CLI, do aplicativo e da interface de controle.

- **Anthropic (Claude)**: tokens OAuth em perfis de autenticação. Se o token OAuth não tiver
  o escopo `user:profile`, usa como fallback uma sessão web do `claude.ai` (`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY` ou um cookie `sessionKey=` em `CLAUDE_WEB_COOKIE`), quando configurada.
  Limites específicos por modelo e gastos/orçamentos mensais habilitados para uso adicional são incluídos
  quando a Anthropic os informa. Uma chave explícita da Anthropic Admin API ou um
  perfil de provedor `sk-ant-admin...` detectado automaticamente exibe, em vez disso, o custo
  da organização em 30 dias e o histórico da Messages API.
- **ClawRouter**: chave de API (`CLAWROUTER_API_KEY`). Exibe uma janela de orçamento mensal
  e um orçamento tipado em USD quando configurado; caso contrário, exibe o gasto agregado e um
  resumo de solicitações/tokens/custos.
- **DeepSeek**: chave de API via ambiente/configuração/armazenamento de autenticação (`DEEPSEEK_API_KEY`).
  Exibe o saldo de cada moeda informado pelo provedor.
- **GitHub Copilot**: tokens OAuth em perfis de autenticação.
- **Gemini CLI**: tokens OAuth em perfis de autenticação.
- **MiniMax**: chave de API ou perfil de autenticação OAuth da MiniMax. O OpenClaw considera
  `minimax`, `minimax-cn` e `minimax-portal` como a mesma superfície de cota da MiniMax,
  dá preferência ao OAuth armazenado da MiniMax quando disponível e, caso contrário, usa como fallback
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  A consulta de uso deriva o host do Coding Plan de `models.providers.minimax-portal.baseUrl`
  ou `models.providers.minimax.baseUrl` quando configurado; caso contrário, usa o
  host da MiniMax CN.
  Os campos brutos `usage_percent` / `usagePercent` da MiniMax representam a cota
  **restante**, portanto o OpenClaw os inverte antes da exibição; campos baseados em contagem têm prioridade
  quando presentes.
  - Os rótulos das janelas vêm dos campos de horas/minutos do provedor quando presentes e depois
    usam como fallback o intervalo entre `start_time` / `end_time`.
  - Se o endpoint do plano de codificação retornar `model_remains`, o OpenClaw dá preferência à
    entrada do modelo de chat, deriva o rótulo da janela dos carimbos de data e hora quando os campos explícitos
    `window_hours` / `window_minutes` estão ausentes e inclui o nome do modelo
    no rótulo do plano.
- **OpenAI (plano Codex/ChatGPT)**: tokens OAuth em perfis de autenticação (o cabeçalho
  `ChatGPT-Account-Id` é enviado quando há um id de conta). Exibe o plano do ChatGPT, as janelas
  redefiníveis do Codex e um saldo de créditos quando informado. Os créditos continuam sendo créditos
  do provedor; o OpenClaw não os identifica como dólares. `OPENAI_ADMIN_KEY` adiciona
  o custo da organização em 30 dias e o histórico de uso de conclusões quando a chave tem acesso ao
  Usage Dashboard. As credenciais de inferência nunca são encaminhadas às APIs da organização.
- **OpenRouter**: chave de API ou chave de API baseada em OAuth (`OPENROUTER_API_KEY` ou um perfil
  de autenticação). Combina o endpoint de créditos da conta com o endpoint de cota da chave,
  de modo que saldo/gastos da conta, orçamento da chave e uso diário/semanal/mensal apareçam
  quando a credencial puder acessá-los. Qualquer um dos endpoints pode enriquecer o snapshot
  de forma independente.
- **Venice**: chave de API via ambiente/configuração/armazenamento de autenticação (`VENICE_API_KEY`). Exibe saldos em USD e
  DIEM, além do uso da alocação por época do DIEM quando informado.
- **Xiaomi MiMo**: duas superfícies de uso separadas. O pagamento conforme o uso utiliza uma chave de API
  (`XIAOMI_API_KEY`); o Token Plan utiliza uma chave separada (`XIAOMI_TOKEN_PLAN_API_KEY`).
  Atualmente, nenhum deles informa janelas de cota.
- **z.ai**: chave de API via ambiente/configuração/armazenamento de autenticação (`ZAI_API_KEY` ou `Z_AI_API_KEY`).

## Relacionado

- [Uso e custos de tokens](/pt-BR/reference/token-use)
- [Uso e custos da API](/pt-BR/reference/api-usage-costs)
- [Cache de prompts](/pt-BR/reference/prompt-caching)
- [Barra de menus](/pt-BR/platforms/mac/menu-bar)
