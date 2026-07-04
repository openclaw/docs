---
read_when:
    - Diagnosticando rotação de perfis de autenticação, tempos de espera ou comportamento de fallback de modelos
    - Atualização das regras de failover para perfis de autenticação ou modelos
    - Entendendo como as substituições de modelo da sessão interagem com novas tentativas de fallback
sidebarTitle: Model failover
summary: Como o OpenClaw alterna perfis de autenticação e recorre a modelos alternativos
title: Alternância de modelo em caso de falha
x-i18n:
    generated_at: "2026-07-04T15:11:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1521e27c53029ead305f29b7a29b627b519adbd28ed30688c01f32542625855f
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw lida com falhas em dois estágios:

1. **Rotação de perfis de autenticação** dentro do provedor atual.
2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

Este documento explica as regras de runtime e os dados que as sustentam.

## Fluxo de runtime

Para uma execução de texto normal, o OpenClaw avalia candidatos nesta ordem:

<Steps>
  <Step title="Resolver estado da sessão">
    Resolve o modelo da sessão ativa e a preferência de perfil de autenticação.
  </Step>
  <Step title="Criar cadeia de candidatos">
    Cria a cadeia de candidatos de modelo a partir da seleção de modelo atual e da política de fallback para essa origem de seleção. Padrões configurados, primários de tarefas cron e modelos de fallback selecionados automaticamente podem usar fallbacks configurados; seleções explícitas de sessão pelo usuário são estritas.
  </Step>
  <Step title="Tentar o provedor atual">
    Tenta o provedor atual com regras de rotação/cooldown de perfis de autenticação.
  </Step>
  <Step title="Avançar em erros que justificam failover">
    Se esse provedor for esgotado com um erro que justifica failover, passa para o próximo candidato de modelo.
  </Step>
  <Step title="Persistir substituição de fallback">
    Persiste a substituição de fallback selecionada antes de a nova tentativa começar, para que outros leitores da sessão vejam o mesmo provedor/modelo que o runner está prestes a usar. A substituição de modelo persistida é marcada como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Reverter de forma restrita em caso de falha">
    Se o candidato de fallback falhar, reverte apenas os campos de substituição de sessão pertencentes ao fallback quando eles ainda correspondem a esse candidato com falha.
  </Step>
  <Step title="Lançar FallbackSummaryError se esgotado">
    Se todos os candidatos falharem, lança um `FallbackSummaryError` com detalhes por tentativa e o vencimento de cooldown mais próximo quando ele for conhecido.
  </Step>
</Steps>

Isso é intencionalmente mais restrito do que "salvar e restaurar a sessão inteira". O runner de resposta persiste apenas os campos de seleção de modelo que ele controla para fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Isso impede que uma nova tentativa de fallback com falha sobrescreva mutações de sessão mais recentes e não relacionadas, como alterações manuais de `/model` ou atualizações de rotação de sessão que ocorreram enquanto a tentativa estava em execução.

## Política de origem da seleção

O OpenClaw separa o provedor/modelo selecionado do motivo pelo qual ele foi selecionado. Essa origem controla se a cadeia de fallback é permitida:

- **Padrão configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Primário do agente**: `agents.list[].model` é estrito, a menos que esse objeto de modelo do agente inclua seus próprios `fallbacks`. Use `fallbacks: []` para tornar explícito o comportamento estrito, ou forneça uma lista não vazia para optar esse agente no fallback de modelo.
- **Substituição de fallback automática**: um fallback de runtime grava `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` e o modelo de origem selecionado antes de tentar novamente. Essa substituição automática pode continuar percorrendo a cadeia de fallback configurada sem sondar o primário em toda mensagem, mas o OpenClaw sonda periodicamente a origem configurada novamente e limpa a substituição automática quando ela se recupera. `/new`, `/reset` e `sessions.reset` também limpam substituições com origem automática. Execuções de Heartbeat sem um `heartbeat.model` explícito limpam substituições automáticas diretas quando sua origem não corresponde mais ao padrão configurado atual.
- **Substituição de sessão pelo usuário**: `/model`, o seletor de modelo, `session_status(model=...)` e `sessions.patch` gravam `modelOverrideSource: "user"`. Isso é uma seleção exata da sessão. Se o provedor/modelo selecionado falhar antes de produzir uma resposta, o OpenClaw relata a falha em vez de responder a partir de um fallback configurado não relacionado.
- **Substituição de sessão legada**: entradas de sessão mais antigas podem ter `modelOverride` sem `modelOverrideSource`. O OpenClaw trata essas entradas como substituições de usuário para que uma seleção antiga explícita não seja convertida silenciosamente em comportamento de fallback.
- **Modelo de payload do Cron**: um `payload.model` / `--model` de tarefa cron é um primário da tarefa, não uma substituição de sessão pelo usuário. Ele usa fallbacks configurados, a menos que a tarefa forneça `payload.fallbacks`; `payload.fallbacks: []` torna a execução do cron estrita.

O intervalo de sondagem do primário do fallback automático é de cinco minutos e não é configurável. O OpenClaw lembra sondagens recentes por sessão e modelo primário para que um primário com falha não seja tentado novamente em cada turno. O OpenClaw envia um aviso visível quando uma sessão passa para fallback e outro aviso quando ela retorna ao primário selecionado; ele não repete o aviso em cada turno de fallback persistente.

## Cache de ignorar falhas de autenticação

Por padrão, cada novo turno mantém o comportamento existente de nova tentativa de fallback: o OpenClaw
tentará cada candidato de fallback configurado novamente, incluindo candidatos
não primários que falharam recentemente com `auth` ou `auth_permanent`.

Operadores que preferem suprimir essas falhas repetidas de autenticação podem optar por isso com:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Quando habilitado, o OpenClaw registra um marcador de ignorar em memória e
escopado à sessão para um candidato de fallback não primário após uma falha da classe de autenticação. O marcador é identificado
por ID da sessão, provedor e modelo. Candidatos primários nunca são ignorados, então uma
seleção explícita de modelo pelo usuário ainda expõe o erro real de autenticação. O cache é
local ao processo e é limpo na reinicialização do Gateway.

O valor é um TTL em milissegundos. `0` ou um valor não definido desabilita o cache.
Valores positivos são limitados entre 1 segundo e 10 minutos.

## Avisos de fallback visíveis ao usuário

Quando uma sessão passa para um fallback selecionado automaticamente, o OpenClaw envia um aviso de status na mesma superfície de resposta:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Quando uma sondagem posterior é bem-sucedida e a sessão retorna ao primário selecionado, o OpenClaw envia:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Esses avisos são mensagens operacionais, não conteúdo do assistente. Eles são entregues uma vez por mudança de estado, incluindo turnos apenas com efeitos colaterais quando viável, mas turnos de fallback persistente não os repetem. A entrega ignora a supressão normal de resposta de origem, o aviso não consome o primeiro slot de resposta do assistente para canais encadeados e ele é excluído de conversão de texto em fala e extração de compromissos.

## Armazenamento de autenticação (chaves + OAuth)

O OpenClaw usa **perfis de autenticação** tanto para chaves de API quanto para tokens OAuth.

- Segredos e estado de roteamento de autenticação em runtime ficam em `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Configurações `auth.profiles` / `auth.order` são **apenas metadados + roteamento** (sem segredos).
- Arquivo OAuth legado apenas para importação: `~/.openclaw/credentials/oauth.json` (importado para o armazenamento de autenticação por agente no primeiro uso).
- Arquivos legados `auth-profiles.json`, `auth-state.json` e `auth.json` por agente são importados por `openclaw doctor --fix`.

Mais detalhes: [OAuth](/pt-BR/concepts/oauth)

Tipos de credenciais:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)

## IDs de perfil

Logins OAuth criam perfis distintos para que várias contas possam coexistir.

- Padrão: `provider:default` quando nenhum email está disponível.
- OAuth com email: `provider:<email>` (por exemplo, `google-antigravity:user@gmail.com`).

Perfis ficam no armazenamento de perfis de autenticação `openclaw-agent.sqlite` por agente.

## Ordem de rotação

Quando um provedor tem vários perfis, o OpenClaw escolhe uma ordem assim:

<Steps>
  <Step title="Configuração explícita">
    `auth.order[provider]` (se definido).
  </Step>
  <Step title="Perfis configurados">
    `auth.profiles` filtrado por provedor.
  </Step>
  <Step title="Perfis armazenados">
    Entradas de perfil de autenticação SQLite por agente para o provedor.
  </Step>
</Steps>

Se nenhuma ordem explícita estiver configurada, o OpenClaw usa uma ordem round-robin:

- **Chave primária:** tipo de perfil (**OAuth antes de chaves de API**).
- **Chave secundária:** `usageStats.lastUsed` (mais antigo primeiro, dentro de cada tipo).
- **Perfis em cooldown/desabilitados** são movidos para o fim, ordenados pelo vencimento mais próximo.

### Aderência da sessão (amigável a cache)

O OpenClaw **fixa o perfil de autenticação escolhido por sessão** para manter os caches do provedor aquecidos. Ele **não** rotaciona a cada solicitação. O perfil fixado é reutilizado até que:

- a sessão seja redefinida (`/new` / `/reset`)
- uma Compaction seja concluída (a contagem de Compaction incrementa)
- o perfil esteja em cooldown/desabilitado

A seleção manual via `/model …@<profileId>` define uma **substituição de usuário** para essa sessão e não é rotacionada automaticamente até que uma nova sessão comece.

<Note>
Perfis fixados automaticamente (selecionados pelo roteador de sessão) são tratados como uma **preferência**: eles são tentados primeiro, mas o OpenClaw pode rotacionar para outro perfil em limites de taxa/timeouts. Quando o perfil original fica disponível novamente, novas execuções podem preferi-lo de novo sem alterar o modelo selecionado ou o runtime. Perfis fixados pelo usuário permanecem travados nesse perfil; se ele falhar e fallbacks de modelo estiverem configurados, o OpenClaw passa para o próximo modelo em vez de trocar de perfil.
</Note>

### Assinatura do OpenAI Codex mais backup por chave de API

Para modelos de agente OpenAI, autenticação e runtime são separados. `openai/gpt-*` permanece no
harness do Codex enquanto a autenticação pode rotacionar entre um perfil de assinatura do Codex e
um backup por chave de API da OpenAI.

Use `auth.order.openai` para a ordem visível ao usuário:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Use `openai:*` tanto para perfis OAuth ChatGPT/Codex quanto para
perfis de chave de API da OpenAI. Quando a assinatura atinge um limite de uso do Codex,
o OpenClaw registra o horário exato de redefinição quando o Codex fornece um, tenta o próximo
perfil de autenticação ordenado e mantém a execução dentro do harness do Codex. Depois que o horário de redefinição
passa, o perfil de assinatura fica elegível novamente e a próxima seleção automática
pode retornar a ele.

Use um perfil fixado pelo usuário somente quando quiser forçar uma conta/chave para essa
sessão. Perfis fixados pelo usuário são intencionalmente estritos e não saltam silenciosamente
para outro perfil.

## Cooldowns

Quando um perfil falha devido a erros de autenticação/limite de taxa (ou um timeout que parece limitação de taxa), o OpenClaw o marca em cooldown e passa para o próximo perfil.

<AccordionGroup>
  <Accordion title="O que entra no grupo de limite de taxa / timeout">
    Esse grupo de limite de taxa é mais amplo do que apenas `429`: ele também inclui mensagens de provedores como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limites periódicos de janela de uso como `weekly/monthly limit reached`.

    Erros de formato/solicitação inválida normalmente são terminais porque tentar novamente o mesmo payload falharia da mesma forma, então o OpenClaw os expõe em vez de rotacionar perfis de autenticação. Caminhos conhecidos de reparo por nova tentativa podem optar explicitamente: por exemplo, falhas de validação de ID de chamada de ferramenta do Cloud Code Assist são sanitizadas e tentadas novamente uma vez pela política `allowFormatRetry`. Erros de motivo de parada compatíveis com OpenAI, como `Unhandled stop reason: error`, `stop reason: error` e `reason: error`, são classificados como sinais de timeout/failover.

    Texto genérico de servidor também pode entrar nesse grupo de timeout quando a origem corresponde a um padrão transitório conhecido. Por exemplo, a mensagem simples do wrapper de stream do runtime de modelo `An unknown error occurred` é tratada como digna de failover para todos os provedores porque o runtime de modelo compartilhado a emite quando streams de provedores terminam com `stopReason: "aborted"` ou `stopReason: "error"` sem detalhes específicos. Payloads JSON `api_error` com texto transitório de servidor, como `internal server error`, `unknown error, 520`, `upstream error` ou `backend error`, também são tratados como timeouts que justificam failover.

    Texto genérico upstream específico do OpenRouter, como o simples `Provider returned error`, é tratado como timeout somente quando o contexto do provedor é realmente OpenRouter. Texto genérico de fallback interno, como `LLM request failed with an unknown error.`, permanece conservador e não aciona failover por si só.

  </Accordion>
  <Accordion title="Limites de retry-after do SDK">
    Alguns SDKs de provedores poderiam, caso contrário, aguardar por uma janela longa de `Retry-After` antes de devolver o controle ao OpenClaw. Para SDKs baseados em Stainless, como Anthropic e OpenAI, o OpenClaw limita as esperas internas do SDK por `retry-after-ms` / `retry-after` a 60 segundos por padrão e expõe respostas repetíveis mais longas imediatamente para que esse caminho de failover possa ser executado. Ajuste ou desative o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [Comportamento de repetição](/pt-BR/concepts/retry).
  </Accordion>
  <Accordion title="Cooldowns com escopo de modelo">
    Cooldowns por limite de taxa também podem ter escopo de modelo:

    - O OpenClaw registra `cooldownModel` para falhas de limite de taxa quando o id do modelo com falha é conhecido.
    - Um modelo irmão no mesmo provedor ainda pode ser tentado quando o cooldown tem escopo para um modelo diferente.
    - Janelas de cobrança/desativação ainda bloqueiam todo o perfil entre modelos.

  </Accordion>
</AccordionGroup>

Cooldowns usam backoff exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (limite)

O estado é armazenado no estado de autenticação SQLite por agente em `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Desativações por cobrança

Falhas de cobrança/crédito (por exemplo, "insufficient credits" / "credit balance too low") são tratadas como elegíveis para failover, mas geralmente não são transitórias. Em vez de um cooldown curto, o OpenClaw marca o perfil como **desativado** (com um backoff mais longo) e alterna para o próximo perfil/provedor.

<Note>
Nem toda resposta com formato de cobrança é `402`, e nem todo HTTP `402` cai aqui. O OpenClaw mantém texto explícito de cobrança na trilha de cobrança mesmo quando um provedor retorna `401` ou `403`, mas os correspondedores específicos de provedor permanecem limitados ao provedor que os possui (por exemplo, OpenRouter `403 Key limit exceeded`).

Enquanto isso, erros temporários `402` de janela de uso e limite de gastos de organização/workspace são classificados como `rate_limit` quando a mensagem parece repetível (por exemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Eles permanecem no caminho de cooldown/failover curto em vez do caminho longo de desativação por cobrança.
</Note>

O estado é armazenado no estado de autenticação SQLite por agente:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Padrões:

- O backoff de cobrança começa em **5 horas**, dobra a cada falha de cobrança e tem limite de **24 horas**.
- Contadores de backoff são redefinidos se o perfil não falhar por **24 horas** (configurável).
- Repetições por sobrecarga permitem **1 rotação de perfil no mesmo provedor** antes do fallback de modelo.
- Repetições por sobrecarga usam **0 ms de backoff** por padrão.

## Fallback de modelo

Se todos os perfis de um provedor falharem, o OpenClaw passa para o próximo modelo em `agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticação, limites de taxa e tempos limite que esgotaram a rotação de perfil (outros erros não avançam o fallback). Erros de provedor que não expõem detalhes suficientes ainda são rotulados com precisão no estado de fallback: `empty_response` significa que o provedor não retornou nenhuma mensagem ou status utilizável, `no_error_details` significa que o provedor retornou explicitamente `Unknown error (no error details in response)`, e `unclassified` significa que o OpenClaw preservou a prévia bruta, mas nenhum classificador ainda correspondeu a ela.

Erros de sobrecarga e limite de taxa são tratados de forma mais agressiva do que cooldowns de cobrança. Por padrão, o OpenClaw permite uma repetição de perfil de autenticação no mesmo provedor e, em seguida, muda para o próximo fallback de modelo configurado sem esperar. Sinais de provedor ocupado, como `ModelNotReadyException`, entram nesse bucket de sobrecarga. Ajuste isso com `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando uma execução começa a partir do primário padrão configurado, de um primário de cron job, de um primário de agente com fallbacks explícitos ou de uma substituição de fallback selecionada automaticamente, o OpenClaw pode percorrer a cadeia de fallback configurada correspondente. Primários de agente sem fallbacks explícitos e seleções explícitas do usuário (por exemplo, `/model ollama/qwen3.5:27b`, o seletor de modelos, `sessions.patch` ou substituições pontuais de provedor/modelo na CLI) são estritos: se esse provedor/modelo estiver inacessível ou falhar antes de produzir uma resposta, o OpenClaw relata a falha em vez de responder a partir de um fallback não relacionado.

### Regras da cadeia de candidatos

O OpenClaw constrói a lista de candidatos a partir do `provider/model` solicitado no momento mais os fallbacks configurados.

<AccordionGroup>
  <Accordion title="Regras">
    - O modelo solicitado é sempre o primeiro.
    - Fallbacks configurados explicitamente são desduplicados, mas não filtrados pela lista de permissões de modelos. Eles são tratados como intenção explícita do operador.
    - Se a execução atual já estiver em um fallback configurado na mesma família de provedores, o OpenClaw continua usando a cadeia configurada completa.
    - Quando nenhuma substituição explícita de fallback é fornecida, os fallbacks configurados são tentados antes do primário configurado, mesmo que o modelo solicitado use um provedor diferente.
    - Quando nenhuma substituição explícita de fallback é fornecida ao executor de fallback, o primário configurado é anexado ao final para que a cadeia possa voltar ao padrão normal quando os candidatos anteriores forem esgotados.
    - Quando um chamador fornece `fallbacksOverride`, o executor usa exatamente o modelo solicitado mais essa lista de substituição. Uma lista vazia desativa o fallback de modelo e impede que o primário configurado seja anexado como um destino oculto de repetição.

  </Accordion>
</AccordionGroup>

### Quais erros avançam o fallback

<Tabs>
  <Tab title="Continua em">
    - falhas de autenticação
    - limites de taxa e esgotamento de cooldown
    - erros de sobrecarga/provedor ocupado
    - erros de failover com formato de tempo limite
    - desativações por cobrança
    - `LiveSessionModelSwitchError`, que é normalizado em um caminho de failover para que um modelo persistido obsoleto não crie um loop externo de repetição
    - outros erros não reconhecidos quando ainda há candidatos restantes

  </Tab>
  <Tab title="Não continua em">
    - abortos explícitos que não tenham formato de tempo limite/failover
    - erros de estouro de contexto que devem permanecer dentro da lógica de Compaction/repetição (por exemplo, `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` ou `ollama error: context length exceeded`)
    - um erro desconhecido final quando não há candidatos restantes
    - recusas de segurança do Claude Fable 5; solicitações diretas com chave de API lidam com elas no nível do provedor por meio do fallback do lado do servidor da Anthropic para `claude-opus-4-8` (consulte [Anthropic](/pt-BR/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Comportamento de pular cooldown vs sondar

Quando todos os perfis de autenticação de um provedor já estão em cooldown, o OpenClaw não pula automaticamente esse provedor para sempre. Ele toma uma decisão por candidato:

<AccordionGroup>
  <Accordion title="Decisões por candidato">
    - Falhas persistentes de autenticação pulam todo o provedor imediatamente.
    - Desativações por cobrança geralmente são puladas, mas o candidato primário ainda pode ser sondado com limitação para que a recuperação seja possível sem reiniciar.
    - O candidato primário pode ser sondado perto da expiração do cooldown, com limitação por provedor.
    - Irmãos de fallback no mesmo provedor podem ser tentados apesar do cooldown quando a falha parece transitória (`rate_limit`, `overloaded` ou desconhecida). Isso é especialmente relevante quando um limite de taxa tem escopo de modelo e um modelo irmão ainda pode se recuperar imediatamente.
    - Sondagens de cooldown transitório são limitadas a uma por provedor por execução de fallback para que um único provedor não atrase o fallback entre provedores.

  </Accordion>
</AccordionGroup>

## Substituições de sessão e troca de modelo ao vivo

Alterações de modelo de sessão são estado compartilhado. O executor ativo, o comando `/model`, atualizações de Compaction/sessão e a reconciliação de sessão ao vivo leem ou escrevem partes da mesma entrada de sessão.

Isso significa que repetições de fallback precisam coordenar com a troca de modelo ao vivo:

- Apenas alterações de modelo explícitas conduzidas pelo usuário marcam uma troca ao vivo pendente. Isso inclui `/model`, `session_status(model=...)` e `sessions.patch`.
- Alterações de modelo conduzidas pelo sistema, como rotação de fallback, substituições de Heartbeat ou Compaction, nunca marcam uma troca ao vivo pendente por conta própria.
- Substituições de modelo conduzidas pelo usuário são tratadas como seleções exatas para a política de fallback, então um provedor selecionado inacessível aparece como uma falha em vez de ser mascarado por `agents.defaults.model.fallbacks`.
- Antes de uma repetição de fallback começar, o executor de resposta persiste os campos de substituição de fallback selecionados na entrada de sessão.
- Substituições automáticas de fallback permanecem selecionadas em turnos subsequentes para que o OpenClaw não sonde um primário sabidamente ruim a cada mensagem. O OpenClaw sonda periodicamente a origem configurada novamente e limpa a substituição automática quando ela se recupera; `/new`, `/reset` e `sessions.reset` limpam imediatamente substituições de origem automática.
- Respostas ao usuário anunciam transições de fallback e recuperação com fallback limpo uma vez por mudança de estado. Turnos de fallback persistente não repetem o aviso.
- `/status` mostra o modelo selecionado e, quando o estado de fallback difere, o modelo de fallback ativo e o motivo.
- A reconciliação de sessão ao vivo prefere substituições de sessão persistidas a campos de modelo de runtime obsoletos.
- Se um erro de troca ao vivo apontar para um candidato posterior na cadeia de fallback ativa, o OpenClaw salta diretamente para esse modelo selecionado em vez de percorrer candidatos não relacionados primeiro.
- Se a tentativa de fallback falhar, o executor reverte apenas os campos de substituição que escreveu, e somente se eles ainda corresponderem a esse candidato com falha.

Isso evita a corrida clássica:

<Steps>
  <Step title="Primário falha">
    O modelo primário selecionado falha.
  </Step>
  <Step title="Fallback escolhido na memória">
    O candidato de fallback é escolhido na memória.
  </Step>
  <Step title="Armazenamento de sessão ainda diz primário antigo">
    O armazenamento de sessão ainda reflete o primário antigo.
  </Step>
  <Step title="Reconciliação ao vivo lê estado obsoleto">
    A reconciliação de sessão ao vivo lê o estado de sessão obsoleto.
  </Step>
  <Step title="Repetição volta para trás">
    A repetição é trazida de volta ao modelo antigo antes que a tentativa de fallback comece.
  </Step>
</Steps>

A substituição de fallback persistida fecha essa janela, e a reversão estreita mantém intactas alterações de sessão manuais ou de runtime mais recentes.

## Observabilidade e resumos de falha

`runWithModelFallback(...)` registra detalhes por tentativa que alimentam logs e mensagens de cooldown voltadas ao usuário:

- provedor/modelo tentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivos semelhantes de failover)
- status/código opcional
- resumo de erro legível por humanos

Logs estruturados `model_fallback_decision` também incluem campos planos `fallbackStep*` quando um candidato falha, é pulado ou um fallback posterior é bem-sucedido. Esses campos tornam explícita a transição tentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que exportadores de log e diagnóstico possam reconstruir a falha primária mesmo quando o fallback terminal também falha.

Quando todos os candidatos falham, o OpenClaw lança `FallbackSummaryError`. O executor de resposta externo pode usar isso para criar uma mensagem mais específica, como "todos os modelos estão temporariamente limitados por taxa", e incluir a expiração de cooldown mais próxima quando ela for conhecida.

Esse resumo de cooldown é ciente de modelo:

- limites de taxa com escopo de modelo não relacionados são ignorados para a cadeia de provedor/modelo tentada
- se o bloqueio restante for um limite de taxa com escopo de modelo correspondente, o OpenClaw relata a última expiração correspondente que ainda bloqueia esse modelo

## Configuração relacionada

Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- roteamento de `agents.defaults.imageModel`

Consulte [Modelos](/pt-BR/concepts/models) para uma visão geral mais ampla sobre seleção de modelos e fallback.
