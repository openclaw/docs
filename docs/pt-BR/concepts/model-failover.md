---
read_when:
    - Diagnosticando a rotação de perfis de autenticação, períodos de espera ou comportamento de alternativa de modelo
    - Atualizando regras de failover para perfis de autenticação ou modelos
    - Entendendo como as substituições de modelo de sessão interagem com novas tentativas de fallback
sidebarTitle: Model failover
summary: Como o OpenClaw alterna perfis de autenticação e recorre a alternativas entre modelos
title: Alternância de modelo em caso de falha
x-i18n:
    generated_at: "2026-05-10T19:31:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw lida com falhas em duas etapas:

1. **Rotação de perfil de autenticação** dentro do provedor atual.
2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

Este documento explica as regras de runtime e os dados que as sustentam.

## Fluxo de runtime

Para uma execução de texto normal, o OpenClaw avalia candidatos nesta ordem:

<Steps>
  <Step title="Resolver estado da sessão">
    Resolve o modelo da sessão ativa e a preferência de perfil de autenticação.
  </Step>
  <Step title="Construir cadeia de candidatos">
    Constrói a cadeia de candidatos de modelo a partir da seleção de modelo atual e da política de fallback para essa origem de seleção. Padrões configurados, primários de jobs cron e modelos de fallback selecionados automaticamente podem usar fallbacks configurados; seleções explícitas de sessão do usuário são estritas.
  </Step>
  <Step title="Tentar o provedor atual">
    Tenta o provedor atual com regras de rotação/cooldown de perfil de autenticação.
  </Step>
  <Step title="Avançar em erros que justificam failover">
    Se esse provedor for esgotado com um erro que justifica failover, passa para o próximo candidato de modelo.
  </Step>
  <Step title="Persistir substituição de fallback">
    Persiste a substituição de fallback selecionada antes que a nova tentativa comece, para que outros leitores da sessão vejam o mesmo provedor/modelo que o executor está prestes a usar. A substituição de modelo persistida é marcada como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Reverter de forma restrita em caso de falha">
    Se o candidato de fallback falhar, reverte apenas os campos de substituição de sessão pertencentes ao fallback quando eles ainda corresponderem a esse candidato com falha.
  </Step>
  <Step title="Lançar FallbackSummaryError se esgotado">
    Se todos os candidatos falharem, lança um `FallbackSummaryError` com detalhes por tentativa e a expiração de cooldown mais próxima quando ela for conhecida.
  </Step>
</Steps>

Isso é intencionalmente mais restrito do que "salvar e restaurar a sessão inteira". O executor de resposta persiste apenas os campos de seleção de modelo que ele controla para fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Isso impede que uma nova tentativa de fallback com falha sobrescreva mutações de sessão mais recentes e não relacionadas, como alterações manuais de `/model` ou atualizações de rotação de sessão que ocorreram enquanto a tentativa estava em execução.

## Política de origem da seleção

OpenClaw separa o provedor/modelo selecionado do motivo pelo qual ele foi selecionado. Essa origem controla se a cadeia de fallback é permitida:

- **Padrão configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Primário do agente**: `agents.list[].model` é estrito, a menos que esse objeto de modelo do agente inclua seus próprios `fallbacks`. Use `fallbacks: []` para tornar o comportamento estrito explícito, ou forneça uma lista não vazia para habilitar fallback de modelo para esse agente.
- **Substituição de fallback automática**: um fallback de runtime grava `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` e o modelo de origem selecionado antes de tentar novamente. Essa substituição automática pode continuar percorrendo a cadeia de fallback configurada e é limpa por `/new`, `/reset` e `sessions.reset`. Execuções de Heartbeat sem um `heartbeat.model` explícito também limpam uma substituição automática direta quando sua origem não corresponde mais ao padrão configurado atual.
- **Substituição de sessão do usuário**: `/model`, o seletor de modelo, `session_status(model=...)` e `sessions.patch` gravam `modelOverrideSource: "user"`. Essa é uma seleção exata de sessão. Se o provedor/modelo selecionado falhar antes de produzir uma resposta, OpenClaw relata a falha em vez de responder a partir de um fallback configurado não relacionado.
- **Substituição de sessão legada**: entradas de sessão mais antigas podem ter `modelOverride` sem `modelOverrideSource`. OpenClaw trata essas entradas como substituições do usuário para que uma seleção antiga explícita não seja silenciosamente convertida em comportamento de fallback.
- **Modelo de payload do Cron**: um `payload.model` / `--model` de job cron é um primário de job, não uma substituição de sessão do usuário. Ele usa fallbacks configurados, a menos que o job forneça `payload.fallbacks`; `payload.fallbacks: []` torna a execução cron estrita.

## Armazenamento de autenticação (chaves + OAuth)

OpenClaw usa **perfis de autenticação** tanto para chaves de API quanto para tokens OAuth.

- Segredos ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legado: `~/.openclaw/agent/auth-profiles.json`).
- O estado de roteamento de autenticação em runtime fica em `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Configuração `auth.profiles` / `auth.order` são **apenas metadados + roteamento** (sem segredos).
- Arquivo OAuth legado apenas para importação: `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso).

Mais detalhes: [OAuth](/pt-BR/concepts/oauth)

Tipos de credencial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)

## IDs de perfil

Logins OAuth criam perfis distintos para que várias contas possam coexistir.

- Padrão: `provider:default` quando nenhum email está disponível.
- OAuth com email: `provider:<email>` (por exemplo `google-antigravity:user@gmail.com`).

Os perfis ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` dentro de `profiles`.

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
    Entradas em `auth-profiles.json` para o provedor.
  </Step>
</Steps>

Se nenhuma ordem explícita estiver configurada, OpenClaw usa uma ordem round-robin:

- **Chave primária:** tipo de perfil (**OAuth antes de chaves de API**).
- **Chave secundária:** `usageStats.lastUsed` (mais antigo primeiro, dentro de cada tipo).
- **Perfis em cooldown/desabilitados** são movidos para o fim, ordenados pela expiração mais próxima.

### Fixação de sessão (favorável a cache)

OpenClaw **fixa o perfil de autenticação escolhido por sessão** para manter os caches do provedor aquecidos. Ele **não** rotaciona em toda solicitação. O perfil fixado é reutilizado até:

- a sessão ser redefinida (`/new` / `/reset`)
- uma Compaction ser concluída (a contagem de compaction incrementa)
- o perfil estar em cooldown/desabilitado

A seleção manual via `/model …@<profileId>` define uma **substituição do usuário** para essa sessão e não é rotacionada automaticamente até que uma nova sessão comece.

<Note>
Perfis fixados automaticamente (selecionados pelo roteador de sessão) são tratados como uma **preferência**: eles são tentados primeiro, mas o OpenClaw pode rotacionar para outro perfil em limites de taxa/timeouts. Perfis fixados pelo usuário permanecem presos a esse perfil; se ele falhar e fallbacks de modelo estiverem configurados, o OpenClaw passa para o próximo modelo em vez de trocar de perfil.
</Note>

### Por que OAuth pode "parecer perdido"

Se você tiver tanto um perfil OAuth quanto um perfil de chave de API para o mesmo provedor, o round-robin pode alternar entre eles entre mensagens, a menos que haja fixação. Para forçar um único perfil:

- Fixe com `auth.order[provider] = ["provider:profileId"]`, ou
- Use uma substituição por sessão via `/model …` com uma substituição de perfil (quando houver suporte na sua interface de UI/chat).

## Cooldowns

Quando um perfil falha devido a erros de autenticação/limite de taxa (ou um timeout que parece limitação de taxa), o OpenClaw o marca em cooldown e passa para o próximo perfil.

<AccordionGroup>
  <Accordion title="O que entra no bucket de limite de taxa / timeout">
    Esse bucket de limite de taxa é mais amplo do que um simples `429`: ele também inclui mensagens de provedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limites periódicos de janela de uso como `weekly/monthly limit reached`.

    Erros de formato/solicitação inválida geralmente são terminais porque repetir o mesmo payload falharia da mesma forma, então o OpenClaw os expõe em vez de rotacionar perfis de autenticação. Caminhos conhecidos de reparo por nova tentativa podem optar explicitamente por isso: por exemplo, falhas de validação de ID de chamada de ferramenta do Cloud Code Assist são sanitizadas e repetidas uma vez pela política `allowFormatRetry`. Erros de motivo de parada compatíveis com OpenAI, como `Unhandled stop reason: error`, `stop reason: error` e `reason: error`, são classificados como sinais de timeout/failover.

    Texto genérico de servidor também pode entrar nesse bucket de timeout quando a origem corresponde a um padrão transitório conhecido. Por exemplo, a mensagem simples do wrapper de stream pi-ai `An unknown error occurred` é tratada como algo que justifica failover para todos os provedores porque pi-ai a emite quando streams do provedor terminam com `stopReason: "aborted"` ou `stopReason: "error"` sem detalhes específicos. Payloads JSON `api_error` com texto transitório de servidor, como `internal server error`, `unknown error, 520`, `upstream error` ou `backend error`, também são tratados como timeouts que justificam failover.

    Texto genérico upstream específico do OpenRouter, como o simples `Provider returned error`, é tratado como timeout apenas quando o contexto do provedor é realmente OpenRouter. Texto genérico de fallback interno, como `LLM request failed with an unknown error.`, permanece conservador e não aciona failover por si só.

  </Accordion>
  <Accordion title="Limites de retry-after do SDK">
    Alguns SDKs de provedor poderiam, caso contrário, aguardar uma janela longa de `Retry-After` antes de devolver o controle ao OpenClaw. Para SDKs baseados em Stainless, como Anthropic e OpenAI, o OpenClaw limita esperas internas do SDK `retry-after-ms` / `retry-after` a 60 segundos por padrão e expõe respostas repetíveis mais longas imediatamente para que esse caminho de failover possa executar. Ajuste ou desabilite o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [Comportamento de nova tentativa](/pt-BR/concepts/retry).
  </Accordion>
  <Accordion title="Cooldowns com escopo de modelo">
    Cooldowns de limite de taxa também podem ter escopo de modelo:

    - OpenClaw registra `cooldownModel` para falhas de limite de taxa quando o id do modelo com falha é conhecido.
    - Um modelo irmão no mesmo provedor ainda pode ser tentado quando o cooldown tem escopo de outro modelo.
    - Janelas de cobrança/desabilitação ainda bloqueiam o perfil inteiro entre modelos.

  </Accordion>
</AccordionGroup>

Cooldowns usam backoff exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (limite)

O estado é armazenado em `auth-state.json` dentro de `usageStats`:

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

## Desabilitações por cobrança

Falhas de cobrança/crédito (por exemplo "insufficient credits" / "credit balance too low") são tratadas como dignas de failover, mas geralmente não são transitórias. Em vez de um cooldown curto, OpenClaw marca o perfil como **desabilitado** (com um backoff mais longo) e rotaciona para o próximo perfil/provedor.

<Note>
Nem toda resposta com formato de cobrança é `402`, e nem todo HTTP `402` entra aqui. OpenClaw mantém texto explícito de cobrança na faixa de cobrança mesmo quando um provedor retorna `401` ou `403`, mas matchers específicos de provedor permanecem restritos ao provedor que os controla (por exemplo, OpenRouter `403 Key limit exceeded`).

Enquanto isso, erros temporários `402` de janela de uso e limite de gastos de organização/workspace são classificados como `rate_limit` quando a mensagem parece repetível (por exemplo `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Eles permanecem no caminho de cooldown/failover curto, em vez do caminho longo de desabilitação por cobrança.
</Note>

O estado é armazenado em `auth-state.json`:

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
- Os contadores de backoff são redefinidos se o perfil não falhar por **24 horas** (configurável).
- Novas tentativas por sobrecarga permitem **1 rotação de perfil do mesmo provedor** antes do fallback de modelo.
- Novas tentativas por sobrecarga usam **0 ms de backoff** por padrão.

## Fallback de modelo

Se todos os perfis de um provedor falharem, o OpenClaw passa para o próximo modelo em `agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticação, limites de taxa e timeouts que esgotaram a rotação de perfis (outros erros não avançam para a alternativa). Erros de provedor que não expõem detalhes suficientes ainda são rotulados com precisão no estado de alternativa: `empty_response` significa que o provedor não retornou nenhuma mensagem ou status utilizável, `no_error_details` significa que o provedor retornou explicitamente `Unknown error (no error details in response)`, e `unclassified` significa que o OpenClaw preservou a prévia bruta, mas nenhum classificador ainda a correspondeu.

Erros de sobrecarga e limite de taxa são tratados de forma mais agressiva do que períodos de espera por cobrança. Por padrão, o OpenClaw permite uma nova tentativa com perfil de autenticação do mesmo provedor e, em seguida, muda para a próxima alternativa de modelo configurada sem esperar. Sinais de provedor ocupado, como `ModelNotReadyException`, entram nesse grupo de sobrecarga. Ajuste isso com `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando uma execução começa a partir do primário padrão configurado, de um primário de tarefa cron, de um primário de agente com alternativas explícitas ou de uma substituição de alternativa selecionada automaticamente, o OpenClaw pode percorrer a cadeia de alternativas configurada correspondente. Primários de agente sem alternativas explícitas e seleções explícitas do usuário (por exemplo, `/model ollama/qwen3.5:27b`, o seletor de modelos, `sessions.patch` ou substituições pontuais de provedor/modelo pela CLI) são estritos: se esse provedor/modelo estiver inacessível ou falhar antes de produzir uma resposta, o OpenClaw relata a falha em vez de responder a partir de uma alternativa não relacionada.

### Regras da cadeia de candidatos

O OpenClaw cria a lista de candidatos a partir do `provider/model` solicitado no momento mais as alternativas configuradas.

<AccordionGroup>
  <Accordion title="Regras">
    - O modelo solicitado é sempre o primeiro.
    - Alternativas configuradas explícitas são desduplicadas, mas não filtradas pela lista de modelos permitidos. Elas são tratadas como intenção explícita do operador.
    - Se a execução atual já estiver em uma alternativa configurada na mesma família de provedores, o OpenClaw continuará usando a cadeia configurada completa.
    - Se a execução atual estiver em um provedor diferente da configuração e esse modelo atual ainda não fizer parte da cadeia de alternativas configurada, o OpenClaw não acrescentará alternativas configuradas não relacionadas de outro provedor.
    - Quando nenhuma substituição explícita de alternativa é fornecida ao executor de alternativas, o primário configurado é acrescentado ao final para que a cadeia possa voltar ao padrão normal depois que os candidatos anteriores forem esgotados.
    - Quando um chamador fornece `fallbacksOverride`, o executor usa exatamente o modelo solicitado mais essa lista de substituição. Uma lista vazia desativa a alternativa de modelo e impede que o primário configurado seja acrescentado como alvo oculto de nova tentativa.

  </Accordion>
</AccordionGroup>

### Quais erros avançam para a alternativa

<Tabs>
  <Tab title="Continua em">
    - falhas de autenticação
    - limites de taxa e esgotamento de períodos de espera
    - erros de sobrecarga/provedor ocupado
    - erros de failover com formato de timeout
    - desativações por cobrança
    - `LiveSessionModelSwitchError`, que é normalizado para um caminho de failover para que um modelo persistido obsoleto não crie um loop externo de novas tentativas
    - outros erros não reconhecidos quando ainda há candidatos restantes

  </Tab>
  <Tab title="Não continua em">
    - abortos explícitos que não têm formato de timeout/failover
    - erros de estouro de contexto que devem permanecer dentro da lógica de Compaction/nova tentativa (por exemplo, `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` ou `ollama error: context length exceeded`)
    - um erro desconhecido final quando não há candidatos restantes

  </Tab>
</Tabs>

### Comportamento de salto de período de espera vs sondagem

Quando todos os perfis de autenticação de um provedor já estão em período de espera, o OpenClaw não pula automaticamente esse provedor para sempre. Ele toma uma decisão por candidato:

<AccordionGroup>
  <Accordion title="Decisões por candidato">
    - Falhas de autenticação persistentes pulam o provedor inteiro imediatamente.
    - Desativações por cobrança geralmente pulam, mas o candidato primário ainda pode ser sondado com limitação para que a recuperação seja possível sem reiniciar.
    - O candidato primário pode ser sondado perto da expiração do período de espera, com uma limitação por provedor.
    - Alternativas irmãs do mesmo provedor podem ser tentadas apesar do período de espera quando a falha parece transitória (`rate_limit`, `overloaded` ou desconhecida). Isso é especialmente relevante quando um limite de taxa é específico ao modelo e um modelo irmão ainda pode se recuperar imediatamente.
    - Sondagens de períodos de espera transitórios são limitadas a uma por provedor por execução de alternativas para que um único provedor não bloqueie a alternativa entre provedores.

  </Accordion>
</AccordionGroup>

## Substituições de sessão e troca de modelo ao vivo

Mudanças de modelo de sessão são estado compartilhado. O executor ativo, o comando `/model`, atualizações de Compaction/sessão e a reconciliação de sessão ao vivo leem ou escrevem partes da mesma entrada de sessão.

Isso significa que novas tentativas com alternativas precisam coordenar com a troca de modelo ao vivo:

- Apenas mudanças de modelo explícitas acionadas pelo usuário marcam uma troca ao vivo pendente. Isso inclui `/model`, `session_status(model=...)` e `sessions.patch`.
- Mudanças de modelo acionadas pelo sistema, como rotação de alternativas, substituições de Heartbeat ou Compaction, nunca marcam por conta própria uma troca ao vivo pendente.
- Substituições de modelo acionadas pelo usuário são tratadas como seleções exatas para a política de alternativas, portanto um provedor selecionado inacessível aparece como falha em vez de ser mascarado por `agents.defaults.model.fallbacks`.
- Antes de uma nova tentativa com alternativa começar, o executor de resposta persiste os campos de substituição de alternativa selecionados na entrada de sessão.
- Substituições automáticas de alternativa permanecem selecionadas em turnos subsequentes para que o OpenClaw não sonde um primário sabidamente ruim em toda mensagem. `/new`, `/reset` e `sessions.reset` limpam substituições originadas automaticamente e retornam a sessão ao padrão configurado.
- `/status` mostra o modelo selecionado e, quando o estado de alternativa difere, o modelo de alternativa ativo e o motivo.
- A reconciliação de sessão ao vivo prefere substituições de sessão persistidas a campos de modelo de runtime obsoletos.
- Se um erro de troca ao vivo apontar para um candidato posterior na cadeia de alternativas ativa, o OpenClaw salta diretamente para esse modelo selecionado em vez de percorrer candidatos não relacionados primeiro.
- Se a tentativa com alternativa falhar, o executor reverte apenas os campos de substituição que escreveu, e somente se eles ainda corresponderem ao candidato que falhou.

Isso evita a corrida clássica:

<Steps>
  <Step title="Primário falha">
    O modelo primário selecionado falha.
  </Step>
  <Step title="Alternativa escolhida em memória">
    O candidato alternativo é escolhido em memória.
  </Step>
  <Step title="Armazenamento de sessão ainda indica o primário antigo">
    O armazenamento de sessão ainda reflete o primário antigo.
  </Step>
  <Step title="Reconciliação ao vivo lê estado obsoleto">
    A reconciliação de sessão ao vivo lê o estado de sessão obsoleto.
  </Step>
  <Step title="Nova tentativa voltou ao anterior">
    A nova tentativa é trazida de volta ao modelo antigo antes que a tentativa com alternativa comece.
  </Step>
</Steps>

A substituição de alternativa persistida fecha essa janela, e a reversão estreita mantém intactas mudanças de sessão manuais ou de runtime mais recentes.

## Observabilidade e resumos de falha

`runWithModelFallback(...)` registra detalhes por tentativa que alimentam logs e mensagens de período de espera voltadas ao usuário:

- provedor/modelo tentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivos de failover semelhantes)
- status/código opcional
- resumo de erro legível por humanos

Logs estruturados `model_fallback_decision` também incluem campos planos `fallbackStep*` quando um candidato falha, é pulado ou uma alternativa posterior tem sucesso. Esses campos tornam explícita a transição tentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que exportadores de logs e diagnósticos possam reconstruir a falha primária mesmo quando a alternativa terminal também falha.

Quando todos os candidatos falham, o OpenClaw lança `FallbackSummaryError`. O executor externo de resposta pode usar isso para criar uma mensagem mais específica, como "todos os modelos estão temporariamente limitados por taxa", e incluir a expiração de período de espera mais próxima quando ela for conhecida.

Esse resumo de período de espera é ciente de modelo:

- limites de taxa específicos a modelos não relacionados são ignorados para a cadeia de provedor/modelo tentada
- se o bloqueio restante for um limite de taxa específico ao modelo correspondente, o OpenClaw relata a última expiração correspondente que ainda bloqueia esse modelo

## Configuração relacionada

Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- roteamento de `agents.defaults.imageModel`

Consulte [Modelos](/pt-BR/concepts/models) para a visão geral mais ampla de seleção de modelos e alternativas.
