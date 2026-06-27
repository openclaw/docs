---
read_when:
    - Diagnóstico de rotação de perfis de autenticação, tempos de espera ou comportamento de fallback de modelo
    - Atualizando regras de failover para perfis de autenticação ou modelos
    - Entendendo como as substituições de modelo de sessão interagem com novas tentativas de fallback
sidebarTitle: Model failover
summary: Como o OpenClaw alterna perfis de autenticação e recorre entre modelos
title: Failover de modelo
x-i18n:
    generated_at: "2026-06-27T17:25:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw lida com falhas em duas etapas:

1. **Rotação de perfil de autenticação** dentro do provedor atual.
2. **Modelo de reserva** para o próximo modelo em `agents.defaults.model.fallbacks`.

Este documento explica as regras em tempo de execução e os dados que as sustentam.

## Fluxo em tempo de execução

Para uma execução normal de texto, o OpenClaw avalia candidatos nesta ordem:

<Steps>
  <Step title="Resolver estado da sessão">
    Resolve o modelo de sessão ativo e a preferência de perfil de autenticação.
  </Step>
  <Step title="Criar cadeia de candidatos">
    Cria a cadeia de modelos candidatos a partir da seleção de modelo atual e da política de reserva para a origem dessa seleção. Padrões configurados, modelos primários de tarefas cron e modelos de reserva selecionados automaticamente podem usar reservas configuradas; seleções explícitas de sessão do usuário são estritas.
  </Step>
  <Step title="Tentar o provedor atual">
    Tenta o provedor atual com regras de rotação/resfriamento de perfil de autenticação.
  </Step>
  <Step title="Avançar em erros que justificam failover">
    Se esse provedor se esgotar com um erro que justifica failover, passa para o próximo modelo candidato.
  </Step>
  <Step title="Persistir substituição de reserva">
    Persiste a substituição de reserva selecionada antes de a nova tentativa começar, para que outros leitores da sessão vejam o mesmo provedor/modelo que o executor está prestes a usar. A substituição de modelo persistida é marcada como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Reverter de forma limitada em caso de falha">
    Se o candidato de reserva falhar, reverte apenas os campos de substituição de sessão pertencentes à reserva quando eles ainda corresponderem a esse candidato com falha.
  </Step>
  <Step title="Lançar FallbackSummaryError se esgotado">
    Se todos os candidatos falharem, lança um `FallbackSummaryError` com detalhes por tentativa e o vencimento de resfriamento mais próximo quando ele for conhecido.
  </Step>
</Steps>

Isso é intencionalmente mais restrito do que "salvar e restaurar a sessão inteira". O executor de respostas persiste apenas os campos de seleção de modelo que ele controla para reserva:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Isso impede que uma nova tentativa de reserva com falha sobrescreva mutações de sessão mais recentes e não relacionadas, como alterações manuais de `/model` ou atualizações de rotação de sessão que aconteceram enquanto a tentativa estava em execução.

## Política de origem da seleção

O OpenClaw separa o provedor/modelo selecionado do motivo pelo qual ele foi selecionado. Essa origem controla se a cadeia de reserva é permitida:

- **Padrão configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Primário do agente**: `agents.list[].model` é estrito, a menos que o objeto de modelo desse agente inclua seus próprios `fallbacks`. Use `fallbacks: []` para tornar o comportamento estrito explícito, ou forneça uma lista não vazia para permitir que esse agente use modelo de reserva.
- **Substituição automática de reserva**: uma reserva em tempo de execução grava `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` e o modelo de origem selecionado antes de tentar novamente. Essa substituição automática pode continuar percorrendo a cadeia de reservas configurada sem sondar o primário a cada mensagem, mas o OpenClaw sonda periodicamente a origem configurada novamente e limpa a substituição automática quando ela se recupera. `/new`, `/reset` e `sessions.reset` também limpam substituições originadas automaticamente. Execuções de Heartbeat sem um `heartbeat.model` explícito limpam substituições automáticas diretas quando sua origem não corresponde mais ao padrão configurado atual.
- **Substituição de sessão do usuário**: `/model`, o seletor de modelo, `session_status(model=...)` e `sessions.patch` gravam `modelOverrideSource: "user"`. Essa é uma seleção exata de sessão. Se o provedor/modelo selecionado falhar antes de produzir uma resposta, o OpenClaw relata a falha em vez de responder a partir de uma reserva configurada não relacionada.
- **Substituição de sessão legada**: entradas de sessão mais antigas podem ter `modelOverride` sem `modelOverrideSource`. O OpenClaw trata essas entradas como substituições de usuário para que uma seleção antiga explícita não seja convertida silenciosamente em comportamento de reserva.
- **Modelo de payload Cron**: um `payload.model` / `--model` de uma tarefa cron é um primário da tarefa, não uma substituição de sessão do usuário. Ele usa reservas configuradas, a menos que a tarefa forneça `payload.fallbacks`; `payload.fallbacks: []` torna a execução cron estrita.

O intervalo de sondagem do primário de reserva automática é de cinco minutos e não é configurável. O OpenClaw lembra sondagens recentes por sessão e modelo primário, para que um primário com falha não seja tentado novamente a cada turno. O OpenClaw envia um aviso visível quando uma sessão passa para a reserva e outro aviso quando ela retorna ao primário selecionado; ele não repete o aviso a cada turno fixado na reserva.

## Cache de ignorar falhas de autenticação

Por padrão, cada novo turno mantém o comportamento existente de nova tentativa de reserva: o OpenClaw
tentará cada candidato de reserva configurado novamente, incluindo candidatos não primários
que falharam recentemente com `auth` ou `auth_permanent`.

Operadores que preferem suprimir essas falhas repetidas de autenticação podem optar por isso com:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Quando ativado, o OpenClaw registra em memória um marcador de ignorar com escopo de sessão para um
candidato de reserva não primário após uma falha da classe de autenticação. O marcador é indexado
por id de sessão, provedor e modelo. Candidatos primários nunca são ignorados, então uma
seleção explícita de modelo pelo usuário ainda expõe o erro real de autenticação. O cache é
local ao processo e é limpo na reinicialização do Gateway.

O valor é um TTL em milissegundos. `0` ou um valor não definido desativa o cache.
Valores positivos são limitados entre 1 segundo e 10 minutos.

## Avisos de reserva visíveis ao usuário

Quando uma sessão passa para uma reserva selecionada automaticamente, o OpenClaw envia um aviso de status na mesma superfície de resposta:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Quando uma sondagem posterior é bem-sucedida e a sessão retorna ao primário selecionado, o OpenClaw envia:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Esses avisos são mensagens operacionais, não conteúdo do assistente. Eles são entregues uma vez por alteração de estado, incluindo turnos apenas com efeitos colaterais quando viável, mas turnos fixados na reserva não os repetem. A entrega ignora a supressão normal de resposta de origem, o aviso não consome o primeiro espaço de resposta do assistente em canais encadeados e é excluído de texto para fala e da extração de compromissos.

## Armazenamento de autenticação (chaves + OAuth)

O OpenClaw usa **perfis de autenticação** tanto para chaves de API quanto para tokens OAuth.

- Segredos e estado de roteamento de autenticação em tempo de execução ficam em `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Configuração `auth.profiles` / `auth.order` são **apenas metadados + roteamento** (sem segredos).
- Arquivo OAuth legado somente para importação: `~/.openclaw/credentials/oauth.json` (importado para o armazenamento de autenticação por agente no primeiro uso).
- Arquivos legados `auth-profiles.json`, `auth-state.json` e `auth.json` por agente são importados por `openclaw doctor --fix`.

Mais detalhes: [OAuth](/pt-BR/concepts/oauth)

Tipos de credenciais:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)

## IDs de perfil

Logins OAuth criam perfis distintos para que várias contas possam coexistir.

- Padrão: `provider:default` quando nenhum e-mail está disponível.
- OAuth com e-mail: `provider:<email>` (por exemplo, `google-antigravity:user@gmail.com`).

Os perfis ficam no armazenamento de perfis de autenticação por agente `openclaw-agent.sqlite`.

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
- **Perfis em resfriamento/desativados** são movidos para o fim, ordenados pelo vencimento mais próximo.

### Fixação de sessão (amigável a cache)

O OpenClaw **fixa o perfil de autenticação escolhido por sessão** para manter os caches do provedor aquecidos. Ele **não** rotaciona a cada solicitação. O perfil fixado é reutilizado até que:

- a sessão seja redefinida (`/new` / `/reset`)
- uma Compaction seja concluída (a contagem de Compaction incrementa)
- o perfil esteja em resfriamento/desativado

A seleção manual via `/model …@<profileId>` define uma **substituição de usuário** para essa sessão e não é rotacionada automaticamente até uma nova sessão começar.

<Note>
Perfis fixados automaticamente (selecionados pelo roteador de sessão) são tratados como uma **preferência**: eles são tentados primeiro, mas o OpenClaw pode rotacionar para outro perfil em limites de taxa/tempos limite. Quando o perfil original volta a ficar disponível, novas execuções podem preferi-lo novamente sem alterar o modelo selecionado ou o runtime. Perfis fixados pelo usuário permanecem bloqueados nesse perfil; se ele falhar e reservas de modelo estiverem configuradas, o OpenClaw passa para o próximo modelo em vez de trocar de perfil.
</Note>

### Assinatura OpenAI Codex mais backup por chave de API

Para modelos de agente OpenAI, autenticação e runtime são separados. `openai/gpt-*` permanece no
harness Codex enquanto a autenticação pode rotacionar entre um perfil de assinatura Codex e
um backup por chave de API OpenAI.

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

Use `openai:*` tanto para perfis OAuth ChatGPT/Codex quanto para perfis de chave de API
OpenAI. Quando a assinatura atinge um limite de uso do Codex,
o OpenClaw registra o horário exato de redefinição quando o Codex fornece um, tenta o próximo
perfil de autenticação ordenado e mantém a execução dentro do harness Codex. Depois que o horário de redefinição
passa, o perfil de assinatura fica elegível novamente e a próxima seleção automática
pode retornar a ele.

Use um perfil fixado pelo usuário somente quando quiser forçar uma conta/chave para essa
sessão. Perfis fixados pelo usuário são intencionalmente estritos e não pulam silenciosamente
para outro perfil.

## Resfriamentos

Quando um perfil falha devido a erros de autenticação/limite de taxa (ou um tempo limite que parece limite de taxa), o OpenClaw o marca em resfriamento e passa para o próximo perfil.

<AccordionGroup>
  <Accordion title="O que entra no grupo de limite de taxa / tempo limite">
    Esse grupo de limite de taxa é mais amplo que um simples `429`: ele também inclui mensagens de provedores como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limites periódicos de janela de uso como `weekly/monthly limit reached`.

    Erros de formato/solicitação inválida geralmente são terminais porque tentar novamente o mesmo payload falharia da mesma forma, então o OpenClaw os expõe em vez de rotacionar perfis de autenticação. Caminhos conhecidos de reparo por nova tentativa podem optar por isso explicitamente: por exemplo, falhas de validação de ID de chamada de ferramenta do Cloud Code Assist são sanitizadas e tentadas novamente uma vez por meio da política `allowFormatRetry`. Erros de motivo de parada compatíveis com OpenAI, como `Unhandled stop reason: error`, `stop reason: error` e `reason: error`, são classificados como sinais de tempo limite/failover.

    Texto genérico de servidor também pode entrar nesse grupo de tempo limite quando a origem corresponde a um padrão transitório conhecido. Por exemplo, a mensagem simples do wrapper de stream do runtime de modelo `An unknown error occurred` é tratada como digna de failover para todos os provedores porque o runtime de modelo compartilhado a emite quando streams de provedores terminam com `stopReason: "aborted"` ou `stopReason: "error"` sem detalhes específicos. Payloads JSON `api_error` com texto transitório de servidor como `internal server error`, `unknown error, 520`, `upstream error` ou `backend error` também são tratados como tempos limite que justificam failover.

    Texto genérico upstream específico do OpenRouter, como o simples `Provider returned error`, é tratado como tempo limite somente quando o contexto do provedor é de fato OpenRouter. Texto genérico interno de reserva, como `LLM request failed with an unknown error.`, permanece conservador e não aciona failover por si só.

  </Accordion>
  <Accordion title="Limites de retry-after do SDK">
    Alguns SDKs de provedores podem, de outra forma, aguardar uma janela longa de `Retry-After` antes de devolver o controle ao OpenClaw. Para SDKs baseados em Stainless, como Anthropic e OpenAI, o OpenClaw limita por padrão as esperas internas do SDK de `retry-after-ms` / `retry-after` a 60 segundos e expõe respostas repetíveis mais longas imediatamente para que esse caminho de failover possa ser executado. Ajuste ou desative o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [Comportamento de repetição](/pt-BR/concepts/retry).
  </Accordion>
  <Accordion title="Cooldowns por escopo de modelo">
    Cooldowns de limite de taxa também podem ter escopo por modelo:

    - O OpenClaw registra `cooldownModel` para falhas de limite de taxa quando o id do modelo com falha é conhecido.
    - Um modelo irmão no mesmo provedor ainda pode ser tentado quando o cooldown tem escopo em um modelo diferente.
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
Nem toda resposta com formato de cobrança é `402`, e nem todo HTTP `402` chega aqui. O OpenClaw mantém texto explícito de cobrança na faixa de cobrança mesmo quando um provedor retorna `401` ou `403`, mas correspondências específicas de provedor permanecem restritas ao provedor ao qual pertencem (por exemplo, OpenRouter `403 Key limit exceeded`).

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
- Repetições por sobrecarga usam **backoff de 0 ms** por padrão.

## Fallback de modelo

Se todos os perfis de um provedor falharem, o OpenClaw passa para o próximo modelo em `agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticação, limites de taxa e tempos limite que esgotaram a rotação de perfis (outros erros não avançam o fallback). Erros de provedor que não expõem detalhes suficientes ainda são rotulados com precisão no estado de fallback: `empty_response` significa que o provedor não retornou nenhuma mensagem ou status utilizável, `no_error_details` significa que o provedor retornou explicitamente `Unknown error (no error details in response)`, e `unclassified` significa que o OpenClaw preservou a prévia bruta, mas nenhum classificador correspondeu a ela ainda.

Erros de sobrecarga e limite de taxa são tratados de forma mais agressiva do que cooldowns de cobrança. Por padrão, o OpenClaw permite uma repetição com perfil de autenticação no mesmo provedor e, em seguida, muda para o próximo fallback de modelo configurado sem esperar. Sinais de provedor ocupado, como `ModelNotReadyException`, entram nesse bucket de sobrecarga. Ajuste isso com `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando uma execução começa a partir do primário padrão configurado, de um primário de trabalho cron, de um primário de agente com fallbacks explícitos ou de uma substituição de fallback selecionada automaticamente, o OpenClaw pode percorrer a cadeia de fallback configurada correspondente. Primários de agente sem fallbacks explícitos e seleções explícitas do usuário (por exemplo, `/model ollama/qwen3.5:27b`, o seletor de modelo, `sessions.patch` ou substituições pontuais de provedor/modelo da CLI) são estritos: se esse provedor/modelo estiver inacessível ou falhar antes de produzir uma resposta, o OpenClaw relata a falha em vez de responder a partir de um fallback não relacionado.

### Regras da cadeia de candidatos

O OpenClaw constrói a lista de candidatos a partir do `provider/model` solicitado no momento, mais os fallbacks configurados.

<AccordionGroup>
  <Accordion title="Regras">
    - O modelo solicitado é sempre o primeiro.
    - Fallbacks configurados explicitamente são deduplicados, mas não filtrados pela lista de permissões de modelos. Eles são tratados como intenção explícita do operador.
    - Se a execução atual já estiver em um fallback configurado na mesma família de provedores, o OpenClaw continua usando a cadeia configurada completa.
    - Quando nenhuma substituição explícita de fallback é fornecida, os fallbacks configurados são tentados antes do primário configurado, mesmo que o modelo solicitado use um provedor diferente.
    - Quando nenhuma substituição explícita de fallback é fornecida ao executor de fallback, o primário configurado é anexado ao final para que a cadeia possa voltar ao padrão normal depois que os candidatos anteriores forem esgotados.
    - Quando um chamador fornece `fallbacksOverride`, o executor usa exatamente o modelo solicitado mais essa lista de substituição. Uma lista vazia desativa o fallback de modelo e impede que o primário configurado seja anexado como um destino oculto de nova tentativa.

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
    - abortos explícitos que não têm formato de tempo limite/failover
    - erros de estouro de contexto que devem permanecer dentro da lógica de Compaction/repetição (por exemplo, `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` ou `ollama error: context length exceeded`)
    - um erro desconhecido final quando não há mais candidatos restantes

  </Tab>
</Tabs>

### Comportamento de pular cooldown vs sondar

Quando todo perfil de autenticação de um provedor já está em cooldown, o OpenClaw não pula automaticamente esse provedor para sempre. Ele toma uma decisão por candidato:

<AccordionGroup>
  <Accordion title="Decisões por candidato">
    - Falhas persistentes de autenticação pulam todo o provedor imediatamente.
    - Desativações por cobrança geralmente pulam, mas o candidato primário ainda pode ser sondado com limitação para que a recuperação seja possível sem reiniciar.
    - O candidato primário pode ser sondado perto do vencimento do cooldown, com limitação por provedor.
    - Irmãos de fallback no mesmo provedor podem ser tentados apesar do cooldown quando a falha parece transitória (`rate_limit`, `overloaded` ou desconhecida). Isso é especialmente relevante quando um limite de taxa tem escopo por modelo e um modelo irmão ainda pode se recuperar imediatamente.
    - Sondas de cooldown transitório são limitadas a uma por provedor por execução de fallback, para que um único provedor não trave o fallback entre provedores.

  </Accordion>
</AccordionGroup>

## Substituições de sessão e troca de modelo ao vivo

Alterações de modelo de sessão são estado compartilhado. O executor ativo, o comando `/model`, atualizações de compaction/sessão e a reconciliação de sessão ao vivo leem ou gravam partes da mesma entrada de sessão.

Isso significa que repetições de fallback precisam se coordenar com a troca de modelo ao vivo:

- Apenas alterações de modelo explícitas, acionadas pelo usuário, marcam uma troca ao vivo pendente. Isso inclui `/model`, `session_status(model=...)` e `sessions.patch`.
- Alterações de modelo acionadas pelo sistema, como rotação de fallback, substituições de Heartbeat ou Compaction, nunca marcam por si só uma troca ao vivo pendente.
- Substituições de modelo acionadas pelo usuário são tratadas como seleções exatas para a política de fallback, portanto um provedor selecionado inacessível aparece como falha em vez de ser mascarado por `agents.defaults.model.fallbacks`.
- Antes de uma repetição de fallback começar, o executor de resposta persiste os campos de substituição de fallback selecionados na entrada de sessão.
- Substituições automáticas de fallback permanecem selecionadas em turnos subsequentes para que o OpenClaw não sonde um primário sabidamente ruim em cada mensagem. O OpenClaw periodicamente sonda novamente a origem configurada e limpa a substituição automática quando ela se recupera; `/new`, `/reset` e `sessions.reset` limpam imediatamente substituições de origem automática.
- Respostas ao usuário anunciam transições de fallback e recuperação com fallback limpo uma vez por mudança de estado. Turnos de fallback aderente não repetem o aviso.
- `/status` mostra o modelo selecionado e, quando o estado de fallback difere, o modelo de fallback ativo e o motivo.
- A reconciliação de sessão ao vivo prefere substituições de sessão persistidas em vez de campos de modelo de runtime obsoletos.
- Se um erro de troca ao vivo aponta para um candidato posterior na cadeia de fallback ativa, o OpenClaw salta diretamente para esse modelo selecionado em vez de percorrer candidatos não relacionados primeiro.
- Se a tentativa de fallback falhar, o executor reverte apenas os campos de substituição que gravou, e somente se eles ainda corresponderem ao candidato com falha.

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
  <Step title="Repetição retornou">
    A repetição é levada de volta ao modelo antigo antes que a tentativa de fallback comece.
  </Step>
</Steps>

A substituição de fallback persistida fecha essa janela, e a reversão restrita mantém intactas alterações manuais ou de sessão de runtime mais novas.

## Observabilidade e resumos de falha

`runWithModelFallback(...)` registra detalhes por tentativa que alimentam logs e mensagens de cooldown voltadas ao usuário:

- provedor/modelo tentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivos de failover semelhantes)
- status/código opcional
- resumo de erro legível por humanos

Logs estruturados `model_fallback_decision` também incluem campos planos `fallbackStep*` quando um candidato falha, é pulado ou um fallback posterior tem sucesso. Esses campos tornam explícita a transição tentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que exportadores de logs e diagnósticos possam reconstruir a falha primária mesmo quando o fallback terminal também falha.

Quando todos os candidatos falham, o OpenClaw lança `FallbackSummaryError`. O executor de resposta externo pode usar isso para construir uma mensagem mais específica, como "todos os modelos estão temporariamente limitados por taxa", e incluir a expiração de cooldown mais próxima quando conhecida.

Esse resumo de cooldown é ciente de modelo:

- limites de taxa com escopo por modelo não relacionados são ignorados para a cadeia provedor/modelo tentada
- se o bloqueio restante for um limite de taxa com escopo por modelo correspondente, o OpenClaw relata a última expiração correspondente que ainda bloqueia esse modelo

## Configuração relacionada

Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- roteamento de `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- roteamento de `agents.defaults.imageModel`

Consulte [Modelos](/pt-BR/concepts/models) para uma visão geral mais ampla sobre seleção de modelo e fallback.
