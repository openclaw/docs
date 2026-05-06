---
read_when:
    - Diagnosticando rotação de perfis de autenticação, períodos de espera ou comportamento de fallback de modelo
    - Atualizando regras de failover para perfis de autenticação ou modelos
    - Entendendo como as substituições de modelo da sessão interagem com novas tentativas de alternativa
sidebarTitle: Model failover
summary: Como o OpenClaw alterna perfis de autenticação e recorre a modelos alternativos
title: Failover de modelo
x-i18n:
    generated_at: "2026-05-06T05:51:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw lida com falhas em duas etapas:

1. **Rotação de perfil de autenticação** dentro do provedor atual.
2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

Este documento explica as regras em tempo de execução e os dados que dão suporte a elas.

## Fluxo em tempo de execução

Para uma execução normal de texto, o OpenClaw avalia candidatos nesta ordem:

<Steps>
  <Step title="Resolver estado da sessão">
    Resolva o modelo ativo da sessão e a preferência de perfil de autenticação.
  </Step>
  <Step title="Criar cadeia de candidatos">
    Crie a cadeia de modelos candidatos a partir da seleção de modelo atual e da política de fallback para essa origem de seleção. Padrões configurados, modelos primários de tarefas cron e modelos de fallback selecionados automaticamente podem usar fallbacks configurados; seleções explícitas de sessão pelo usuário são estritas.
  </Step>
  <Step title="Tentar o provedor atual">
    Tente o provedor atual com regras de rotação/cooldown de perfil de autenticação.
  </Step>
  <Step title="Avançar em erros que justificam failover">
    Se esse provedor for esgotado com um erro que justifica failover, avance para o próximo modelo candidato.
  </Step>
  <Step title="Persistir substituição de fallback">
    Persista a substituição de fallback selecionada antes que a nova tentativa comece, para que outros leitores da sessão vejam o mesmo provedor/modelo que o executor está prestes a usar. A substituição de modelo persistida é marcada como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Reverter de forma restrita em caso de falha">
    Se o candidato de fallback falhar, reverta apenas os campos de substituição da sessão pertencentes ao fallback quando eles ainda corresponderem a esse candidato com falha.
  </Step>
  <Step title="Lançar FallbackSummaryError se esgotado">
    Se todos os candidatos falharem, lance um `FallbackSummaryError` com detalhes por tentativa e a expiração de cooldown mais próxima quando ela for conhecida.
  </Step>
</Steps>

Isso é intencionalmente mais restrito do que "salvar e restaurar a sessão inteira". O executor de resposta só persiste os campos de seleção de modelo que ele controla para fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Isso impede que uma nova tentativa de fallback com falha sobrescreva mutações de sessão mais recentes e não relacionadas, como alterações manuais de `/model` ou atualizações de rotação de sessão que aconteceram enquanto a tentativa estava em execução.

## Política de origem de seleção

O OpenClaw separa o provedor/modelo selecionado do motivo pelo qual ele foi selecionado. Essa origem controla se a cadeia de fallback é permitida:

- **Padrão configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Modelo primário do agente**: `agents.list[].model` é estrito, a menos que esse objeto de modelo do agente inclua seus próprios `fallbacks`. Use `fallbacks: []` para tornar o comportamento estrito explícito, ou forneça uma lista não vazia para habilitar fallback de modelo para esse agente.
- **Substituição automática de fallback**: um fallback em tempo de execução grava `providerOverride`, `modelOverride` e `modelOverrideSource: "auto"` antes de tentar novamente. Essa substituição automática pode continuar percorrendo a cadeia de fallback configurada e é limpa por `/new`, `/reset` e `sessions.reset`.
- **Substituição de sessão pelo usuário**: `/model`, o seletor de modelos, `session_status(model=...)` e `sessions.patch` gravam `modelOverrideSource: "user"`. Essa é uma seleção exata da sessão. Se o provedor/modelo selecionado falhar antes de produzir uma resposta, o OpenClaw relata a falha em vez de responder a partir de um fallback configurado não relacionado.
- **Substituição de sessão legada**: entradas de sessão mais antigas podem ter `modelOverride` sem `modelOverrideSource`. O OpenClaw trata essas entradas como substituições de usuário para que uma seleção antiga explícita não seja silenciosamente convertida em comportamento de fallback.
- **Modelo de payload de Cron**: um `payload.model` / `--model` de tarefa cron é um modelo primário da tarefa, não uma substituição de sessão pelo usuário. Ele usa fallbacks configurados, a menos que a tarefa forneça `payload.fallbacks`; `payload.fallbacks: []` torna a execução cron estrita.

## Armazenamento de autenticação (chaves + OAuth)

O OpenClaw usa **perfis de autenticação** tanto para chaves de API quanto para tokens OAuth.

- Segredos ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legado: `~/.openclaw/agent/auth-profiles.json`).
- O estado de roteamento de autenticação em tempo de execução fica em `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Configurações `auth.profiles` / `auth.order` são **apenas metadados + roteamento** (sem segredos).
- Arquivo OAuth legado somente para importação: `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso).

Mais detalhes: [OAuth](/pt-BR/concepts/oauth)

Tipos de credencial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)

## IDs de perfil

Logins OAuth criam perfis distintos para que várias contas possam coexistir.

- Padrão: `provider:default` quando nenhum e-mail está disponível.
- OAuth com e-mail: `provider:<email>` (por exemplo, `google-antigravity:user@gmail.com`).

Perfis ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sob `profiles`.

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

Se nenhuma ordem explícita estiver configurada, o OpenClaw usa uma ordem round-robin:

- **Chave primária:** tipo de perfil (**OAuth antes de chaves de API**).
- **Chave secundária:** `usageStats.lastUsed` (mais antigo primeiro, dentro de cada tipo).
- **Perfis em cooldown/desabilitados** são movidos para o fim, ordenados pela expiração mais próxima.

### Fixação de sessão (favorável a cache)

O OpenClaw **fixa o perfil de autenticação escolhido por sessão** para manter os caches do provedor aquecidos. Ele **não** rotaciona a cada solicitação. O perfil fixado é reutilizado até que:

- a sessão seja redefinida (`/new` / `/reset`)
- uma Compaction seja concluída (a contagem de compactação incrementa)
- o perfil esteja em cooldown/desabilitado

A seleção manual via `/model …@<profileId>` define uma **substituição de usuário** para essa sessão e não é rotacionada automaticamente até que uma nova sessão comece.

<Note>
Perfis fixados automaticamente (selecionados pelo roteador da sessão) são tratados como uma **preferência**: eles são tentados primeiro, mas o OpenClaw pode rotacionar para outro perfil em limites de taxa/timeouts. Perfis fixados pelo usuário permanecem bloqueados nesse perfil; se ele falhar e fallbacks de modelo estiverem configurados, o OpenClaw avança para o próximo modelo em vez de trocar de perfil.
</Note>

### Por que OAuth pode "parecer perdido"

Se você tiver tanto um perfil OAuth quanto um perfil de chave de API para o mesmo provedor, o round-robin pode alternar entre eles entre mensagens, a menos que estejam fixados. Para forçar um único perfil:

- Fixe com `auth.order[provider] = ["provider:profileId"]`, ou
- Use uma substituição por sessão via `/model …` com uma substituição de perfil (quando houver suporte pela sua interface de UI/chat).

## Cooldowns

Quando um perfil falha devido a erros de autenticação/limite de taxa (ou um timeout que parece limitação de taxa), o OpenClaw o marca em cooldown e avança para o próximo perfil.

<AccordionGroup>
  <Accordion title="O que entra no agrupamento de limite de taxa / timeout">
    Esse agrupamento de limite de taxa é mais amplo do que um simples `429`: ele também inclui mensagens de provedores como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limites periódicos de janela de uso como `weekly/monthly limit reached`.

    Erros de formato/solicitação inválida (por exemplo, falhas de validação de ID de chamada de ferramenta do Cloud Code Assist) são tratados como dignos de failover e usam os mesmos cooldowns. Erros de motivo de parada compatíveis com OpenAI, como `Unhandled stop reason: error`, `stop reason: error` e `reason: error`, são classificados como sinais de timeout/failover.

    Texto genérico de servidor também pode entrar nesse agrupamento de timeout quando a origem corresponde a um padrão transitório conhecido. Por exemplo, a mensagem simples do wrapper de stream pi-ai `An unknown error occurred` é tratada como digna de failover para todos os provedores porque pi-ai a emite quando streams de provedores terminam com `stopReason: "aborted"` ou `stopReason: "error"` sem detalhes específicos. Payloads JSON `api_error` com texto transitório de servidor como `internal server error`, `unknown error, 520`, `upstream error` ou `backend error` também são tratados como timeouts dignos de failover.

    Texto genérico upstream específico do OpenRouter, como o simples `Provider returned error`, é tratado como timeout somente quando o contexto do provedor é de fato OpenRouter. Texto genérico de fallback interno, como `LLM request failed with an unknown error.`, permanece conservador e não aciona failover por si só.

  </Accordion>
  <Accordion title="Limites de retry-after do SDK">
    Alguns SDKs de provedores poderiam, caso contrário, aguardar uma janela longa de `Retry-After` antes de devolver o controle ao OpenClaw. Para SDKs baseados em Stainless, como Anthropic e OpenAI, o OpenClaw limita esperas internas do SDK de `retry-after-ms` / `retry-after` a 60 segundos por padrão e expõe respostas retentáveis mais longas imediatamente para que esse caminho de failover possa ser executado. Ajuste ou desabilite o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [Comportamento de repetição](/pt-BR/concepts/retry).
  </Accordion>
  <Accordion title="Cooldowns com escopo por modelo">
    Cooldowns de limite de taxa também podem ter escopo por modelo:

    - O OpenClaw registra `cooldownModel` para falhas de limite de taxa quando o id do modelo com falha é conhecido.
    - Um modelo irmão no mesmo provedor ainda pode ser tentado quando o cooldown tem escopo para um modelo diferente.
    - Janelas de cobrança/desabilitado ainda bloqueiam o perfil inteiro em todos os modelos.

  </Accordion>
</AccordionGroup>

Cooldowns usam backoff exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (limite)

O estado é armazenado em `auth-state.json` sob `usageStats`:

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

Falhas de cobrança/crédito (por exemplo, "insufficient credits" / "credit balance too low") são tratadas como dignas de failover, mas geralmente não são transitórias. Em vez de um cooldown curto, o OpenClaw marca o perfil como **desabilitado** (com um backoff mais longo) e rotaciona para o próximo perfil/provedor.

<Note>
Nem toda resposta com formato de cobrança é `402`, e nem todo HTTP `402` entra aqui. O OpenClaw mantém texto explícito de cobrança na trilha de cobrança mesmo quando um provedor retorna `401` ou `403`, mas os correspondedores específicos de provedor permanecem restritos ao provedor que os possui (por exemplo, OpenRouter `403 Key limit exceeded`).

Enquanto isso, erros temporários `402` de janela de uso e limite de gastos de organização/workspace são classificados como `rate_limit` quando a mensagem parece retentável (por exemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Eles permanecem no caminho de cooldown/failover curto em vez do caminho longo de desabilitação por cobrança.
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

- O backoff de cobrança começa em **5 horas**, dobra por falha de cobrança e tem limite de **24 horas**.
- Contadores de backoff são redefinidos se o perfil não falhar por **24 horas** (configurável).
- Tentativas por sobrecarga permitem **1 rotação de perfil no mesmo provedor** antes do fallback de modelo.
- Tentativas por sobrecarga usam **backoff de 0 ms** por padrão.

## Fallback de modelo

Se todos os perfis de um provedor falharem, o OpenClaw avança para o próximo modelo em `agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticação, limites de taxa e timeouts que esgotaram a rotação de perfis (outros erros não avançam o fallback). Erros de provedor que não expõem detalhes suficientes ainda são rotulados com precisão no estado de fallback: `empty_response` significa que o provedor não retornou nenhuma mensagem ou status utilizável, `no_error_details` significa que o provedor retornou explicitamente `Unknown error (no error details in response)`, e `unclassified` significa que o OpenClaw preservou a prévia bruta, mas nenhum classificador correspondeu a ela ainda.

Erros de sobrecarga e limite de taxa são tratados de forma mais agressiva do que pausas por cobrança. Por padrão, o OpenClaw permite uma nova tentativa com o mesmo perfil de autenticação do provedor e, em seguida, muda para a próxima alternativa de modelo configurada sem esperar. Sinais de provedor ocupado, como `ModelNotReadyException`, entram nesse grupo de sobrecarga. Ajuste isso com `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando uma execução começa a partir do primário padrão configurado, de um primário de tarefa Cron, de um primário de agente com alternativas explícitas ou de uma substituição de alternativa selecionada automaticamente, o OpenClaw pode percorrer a cadeia de alternativas configurada correspondente. Primários de agente sem alternativas explícitas e seleções explícitas do usuário (por exemplo, `/model ollama/qwen3.5:27b`, o seletor de modelo, `sessions.patch` ou substituições pontuais de provedor/modelo pela CLI) são estritos: se esse provedor/modelo estiver inacessível ou falhar antes de produzir uma resposta, o OpenClaw relata a falha em vez de responder a partir de uma alternativa não relacionada.

### Regras da cadeia de candidatos

O OpenClaw cria a lista de candidatos a partir do `provider/model` solicitado no momento mais as alternativas configuradas.

<AccordionGroup>
  <Accordion title="Regras">
    - O modelo solicitado é sempre o primeiro.
    - Alternativas configuradas explícitas são deduplicadas, mas não filtradas pela lista de modelos permitidos. Elas são tratadas como intenção explícita do operador.
    - Se a execução atual já estiver em uma alternativa configurada na mesma família de provedores, o OpenClaw continua usando a cadeia configurada completa.
    - Se a execução atual estiver em um provedor diferente do configurado e esse modelo atual ainda não fizer parte da cadeia de alternativas configurada, o OpenClaw não anexa alternativas configuradas não relacionadas de outro provedor.
    - Quando nenhuma substituição explícita de alternativa é fornecida ao executor de alternativas, o primário configurado é anexado ao final para que a cadeia possa voltar ao padrão normal depois que os candidatos anteriores forem esgotados.
    - Quando um chamador fornece `fallbacksOverride`, o executor usa exatamente o modelo solicitado mais essa lista de substituição. Uma lista vazia desativa a alternativa de modelo e impede que o primário configurado seja anexado como um destino oculto de nova tentativa.

  </Accordion>
</AccordionGroup>

### Quais erros avançam para a alternativa

<Tabs>
  <Tab title="Continua em">
    - falhas de autenticação
    - limites de taxa e esgotamento de pausas
    - erros de sobrecarga/provedor ocupado
    - erros de failover com formato de timeout
    - desativações por cobrança
    - `LiveSessionModelSwitchError`, que é normalizado em um caminho de failover para que um modelo persistido obsoleto não crie um loop externo de nova tentativa
    - outros erros não reconhecidos quando ainda há candidatos restantes

  </Tab>
  <Tab title="Não continua em">
    - abortos explícitos que não têm formato de timeout/failover
    - erros de estouro de contexto que devem permanecer dentro da lógica de compactação/nova tentativa (por exemplo, `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` ou `ollama error: context length exceeded`)
    - um erro desconhecido final quando não há candidatos restantes

  </Tab>
</Tabs>

### Comportamento de pular pausa vs sondagem

Quando todos os perfis de autenticação de um provedor já estão em pausa, o OpenClaw não pula automaticamente esse provedor para sempre. Ele toma uma decisão por candidato:

<AccordionGroup>
  <Accordion title="Decisões por candidato">
    - Falhas persistentes de autenticação pulam o provedor inteiro imediatamente.
    - Desativações por cobrança geralmente são puladas, mas o candidato primário ainda pode ser sondado com limitação para possibilitar recuperação sem reiniciar.
    - O candidato primário pode ser sondado perto do fim da pausa, com uma limitação por provedor.
    - Alternativas irmãs do mesmo provedor podem ser tentadas apesar da pausa quando a falha parece transitória (`rate_limit`, `overloaded` ou desconhecida). Isso é especialmente relevante quando um limite de taxa é específico do modelo e um modelo irmão ainda pode se recuperar imediatamente.
    - Sondagens de pausas transitórias são limitadas a uma por provedor por execução de alternativas para que um único provedor não bloqueie a alternativa entre provedores.

  </Accordion>
</AccordionGroup>

## Substituições de sessão e troca de modelo ao vivo

Alterações de modelo da sessão são estado compartilhado. O executor ativo, o comando `/model`, atualizações de Compaction/sessão e a reconciliação de sessão ao vivo leem ou escrevem partes da mesma entrada de sessão.

Isso significa que novas tentativas com alternativas precisam ser coordenadas com a troca de modelo ao vivo:

- Somente alterações de modelo acionadas explicitamente pelo usuário marcam uma troca ao vivo pendente. Isso inclui `/model`, `session_status(model=...)` e `sessions.patch`.
- Alterações de modelo acionadas pelo sistema, como rotação de alternativa, substituições de Heartbeat ou Compaction, nunca marcam uma troca ao vivo pendente por conta própria.
- Substituições de modelo acionadas pelo usuário são tratadas como seleções exatas para a política de alternativas, então um provedor selecionado inacessível aparece como falha em vez de ser mascarado por `agents.defaults.model.fallbacks`.
- Antes de uma nova tentativa com alternativa começar, o executor de respostas persiste os campos da substituição de alternativa selecionada na entrada de sessão.
- Substituições automáticas de alternativa permanecem selecionadas nos turnos seguintes para que o OpenClaw não sonde um primário sabidamente problemático a cada mensagem. `/new`, `/reset` e `sessions.reset` limpam substituições de origem automática e retornam a sessão ao padrão configurado.
- `/status` mostra o modelo selecionado e, quando o estado da alternativa difere, o modelo de alternativa ativo e o motivo.
- A reconciliação de sessão ao vivo prefere substituições de sessão persistidas em vez de campos de modelo de runtime obsoletos.
- Se um erro de troca ao vivo apontar para um candidato posterior na cadeia de alternativas ativa, o OpenClaw salta diretamente para esse modelo selecionado em vez de percorrer candidatos não relacionados primeiro.
- Se a tentativa de alternativa falhar, o executor reverte apenas os campos de substituição que escreveu, e somente se eles ainda corresponderem a esse candidato com falha.

Isso evita a corrida clássica:

<Steps>
  <Step title="Primário falha">
    O modelo primário selecionado falha.
  </Step>
  <Step title="Alternativa escolhida na memória">
    O candidato alternativo é escolhido na memória.
  </Step>
  <Step title="Armazenamento de sessão ainda indica o primário antigo">
    O armazenamento de sessão ainda reflete o primário antigo.
  </Step>
  <Step title="Reconciliação ao vivo lê estado obsoleto">
    A reconciliação de sessão ao vivo lê o estado de sessão obsoleto.
  </Step>
  <Step title="Nova tentativa volta ao anterior">
    A nova tentativa é levada de volta ao modelo antigo antes que a tentativa de alternativa comece.
  </Step>
</Steps>

A substituição de alternativa persistida fecha essa janela, e a reversão restrita mantém intactas alterações manuais ou de runtime mais recentes na sessão.

## Observabilidade e resumos de falhas

`runWithModelFallback(...)` registra detalhes por tentativa que alimentam logs e mensagens de pausa voltadas ao usuário:

- provedor/modelo tentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivos semelhantes de failover)
- status/código opcional
- resumo de erro legível por humanos

Logs estruturados `model_fallback_decision` também incluem campos planos `fallbackStep*` quando um candidato falha, é pulado ou uma alternativa posterior tem sucesso. Esses campos tornam explícita a transição tentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que exportadores de logs e diagnósticos possam reconstruir a falha primária mesmo quando a alternativa terminal também falha.

Quando todos os candidatos falham, o OpenClaw lança `FallbackSummaryError`. O executor externo de respostas pode usar isso para criar uma mensagem mais específica, como "todos os modelos estão temporariamente com limite de taxa", e incluir o vencimento de pausa mais próximo quando ele for conhecido.

Esse resumo de pausa reconhece modelos:

- limites de taxa com escopo de modelo não relacionados são ignorados para a cadeia de provedor/modelo tentada
- se o bloqueio restante for um limite de taxa com escopo de modelo correspondente, o OpenClaw relata o último vencimento correspondente que ainda bloqueia esse modelo

## Configuração relacionada

Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- roteamento de `agents.defaults.imageModel`

Consulte [Modelos](/pt-BR/concepts/models) para uma visão geral mais ampla da seleção de modelos e alternativas.
