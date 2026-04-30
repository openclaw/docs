---
read_when:
    - Diagnosticando rotação de perfis de autenticação, intervalos de espera ou comportamento de uso de modelo alternativo
    - Atualizando as regras de alternância em caso de falha para perfis de autenticação ou modelos
    - Entendendo como as substituições de modelo da sessão interagem com novas tentativas de contingência
sidebarTitle: Model failover
summary: Como o OpenClaw alterna perfis de autenticação e recorre a alternativas entre modelos
title: Failover de modelo
x-i18n:
    generated_at: "2026-04-30T09:45:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw lida com falhas em duas etapas:

1. **Rotação de perfis de autenticação** dentro do provedor atual.
2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

Este documento explica as regras de runtime e os dados que as sustentam.

## Fluxo de runtime

Para uma execução normal de texto, o OpenClaw avalia candidatos nesta ordem:

<Steps>
  <Step title="Resolver estado da sessão">
    Resolva o modelo ativo da sessão e a preferência de perfil de autenticação.
  </Step>
  <Step title="Criar cadeia de candidatos">
    Crie a cadeia de modelos candidatos a partir da seleção de modelo atual e da política de fallback para essa fonte de seleção. Padrões configurados, primários de jobs cron e modelos de fallback selecionados automaticamente podem usar fallbacks configurados; seleções explícitas de sessão do usuário são estritas.
  </Step>
  <Step title="Tentar o provedor atual">
    Tente o provedor atual com as regras de rotação/cooldown de perfis de autenticação.
  </Step>
  <Step title="Avançar em erros que justificam failover">
    Se esse provedor estiver esgotado com um erro que justifica failover, avance para o próximo modelo candidato.
  </Step>
  <Step title="Persistir substituição de fallback">
    Persista a substituição de fallback selecionada antes do início da nova tentativa para que outros leitores da sessão vejam o mesmo provedor/modelo que o executor está prestes a usar. A substituição de modelo persistida é marcada como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Reverter de forma restrita em caso de falha">
    Se o candidato de fallback falhar, reverta apenas os campos de substituição de sessão pertencentes ao fallback quando eles ainda corresponderem a esse candidato com falha.
  </Step>
  <Step title="Lançar FallbackSummaryError se esgotado">
    Se todos os candidatos falharem, lance um `FallbackSummaryError` com detalhes por tentativa e a expiração de cooldown mais próxima quando uma for conhecida.
  </Step>
</Steps>

Isso é intencionalmente mais restrito do que "salvar e restaurar toda a sessão". O executor de resposta persiste apenas os campos de seleção de modelo que controla para fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Isso impede que uma nova tentativa de fallback com falha sobrescreva mutações de sessão não relacionadas mais recentes, como alterações manuais de `/model` ou atualizações de rotação de sessão que ocorreram enquanto a tentativa estava em execução.

## Política da fonte de seleção

O OpenClaw separa o provedor/modelo selecionado do motivo pelo qual ele foi selecionado. Essa fonte controla se a cadeia de fallback é permitida:

- **Padrão configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Primário do agente**: `agents.list[].model` é estrito, a menos que esse objeto de modelo do agente inclua seus próprios `fallbacks`. Use `fallbacks: []` para tornar explícito o comportamento estrito, ou forneça uma lista não vazia para habilitar o fallback de modelo para esse agente.
- **Substituição de fallback automática**: um fallback em runtime grava `providerOverride`, `modelOverride` e `modelOverrideSource: "auto"` antes de tentar novamente. Essa substituição automática pode continuar percorrendo a cadeia de fallback configurada e é limpa por `/new`, `/reset` e `sessions.reset`.
- **Substituição de sessão do usuário**: `/model`, o seletor de modelo, `session_status(model=...)` e `sessions.patch` gravam `modelOverrideSource: "user"`. Essa é uma seleção exata de sessão. Se o provedor/modelo selecionado falhar antes de produzir uma resposta, o OpenClaw relata a falha em vez de responder a partir de um fallback configurado não relacionado.
- **Substituição de sessão legada**: entradas de sessão mais antigas podem ter `modelOverride` sem `modelOverrideSource`. O OpenClaw as trata como substituições do usuário para que uma seleção antiga explícita não seja convertida silenciosamente em comportamento de fallback.
- **Modelo de payload de Cron**: um job cron `payload.model` / `--model` é um primário do job, não uma substituição de sessão do usuário. Ele usa fallbacks configurados, a menos que o job forneça `payload.fallbacks`; `payload.fallbacks: []` torna a execução cron estrita.

## Armazenamento de autenticação (chaves + OAuth)

O OpenClaw usa **perfis de autenticação** tanto para chaves de API quanto para tokens OAuth.

- Segredos ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legado: `~/.openclaw/agent/auth-profiles.json`).
- O estado de roteamento de autenticação em runtime fica em `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- A configuração `auth.profiles` / `auth.order` é **apenas metadados + roteamento** (sem segredos).
- Arquivo OAuth legado somente para importação: `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso).

Mais detalhes: [OAuth](/pt-BR/concepts/oauth)

Tipos de credencial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)

## IDs de perfil

Logins OAuth criam perfis distintos para que várias contas possam coexistir.

- Padrão: `provider:default` quando nenhum email está disponível.
- OAuth com email: `provider:<email>` (por exemplo, `google-antigravity:user@gmail.com`).

Os perfis ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` dentro de `profiles`.

## Ordem de rotação

Quando um provedor tem vários perfis, o OpenClaw escolhe uma ordem assim:

<Steps>
  <Step title="Configuração explícita">
    `auth.order[provider]` (se definida).
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
- **Perfis em cooldown/desabilitados** são movidos para o final, ordenados pela expiração mais próxima.

### Aderência da sessão (amigável ao cache)

O OpenClaw **fixa o perfil de autenticação escolhido por sessão** para manter os caches do provedor aquecidos. Ele **não** alterna em todas as solicitações. O perfil fixado é reutilizado até que:

- a sessão seja redefinida (`/new` / `/reset`)
- uma Compaction seja concluída (o contador de Compaction é incrementado)
- o perfil esteja em cooldown/desabilitado

A seleção manual via `/model …@<profileId>` define uma **substituição do usuário** para essa sessão e não é alternada automaticamente até que uma nova sessão seja iniciada.

<Note>
Perfis fixados automaticamente (selecionados pelo roteador da sessão) são tratados como uma **preferência**: eles são tentados primeiro, mas o OpenClaw pode alternar para outro perfil em limites de taxa/timeouts. Perfis fixados pelo usuário permanecem travados nesse perfil; se ele falhar e fallbacks de modelo estiverem configurados, o OpenClaw avança para o próximo modelo em vez de trocar de perfil.
</Note>

### Por que OAuth pode "parecer perdido"

Se você tiver tanto um perfil OAuth quanto um perfil de chave de API para o mesmo provedor, o round-robin pode alternar entre eles entre mensagens, a menos que estejam fixados. Para forçar um único perfil:

- Fixe com `auth.order[provider] = ["provider:profileId"]`, ou
- Use uma substituição por sessão via `/model …` com uma substituição de perfil (quando compatível com sua superfície de UI/chat).

## Cooldowns

Quando um perfil falha devido a erros de autenticação/limite de taxa (ou a um timeout que parece limitação de taxa), o OpenClaw o marca em cooldown e avança para o próximo perfil.

<AccordionGroup>
  <Accordion title="O que entra no bucket de limite de taxa / timeout">
    Esse bucket de limite de taxa é mais amplo do que apenas `429`: ele também inclui mensagens de provedores como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limites periódicos de janela de uso, como `weekly/monthly limit reached`.

    Erros de formato/solicitação inválida (por exemplo, falhas de validação de ID de chamada de ferramenta do Cloud Code Assist) são tratados como dignos de failover e usam os mesmos cooldowns. Erros de motivo de parada compatíveis com OpenAI, como `Unhandled stop reason: error`, `stop reason: error` e `reason: error`, são classificados como sinais de timeout/failover.

    Texto genérico de servidor também pode entrar nesse bucket de timeout quando a origem corresponde a um padrão transitório conhecido. Por exemplo, a mensagem sem detalhes do wrapper de stream pi-ai `An unknown error occurred` é tratada como digna de failover para todos os provedores porque o pi-ai a emite quando streams do provedor terminam com `stopReason: "aborted"` ou `stopReason: "error"` sem detalhes específicos. Payloads JSON `api_error` com texto transitório de servidor, como `internal server error`, `unknown error, 520`, `upstream error` ou `backend error`, também são tratados como timeouts dignos de failover.

    Texto upstream genérico específico do OpenRouter, como `Provider returned error` sem detalhes, é tratado como timeout somente quando o contexto do provedor é de fato OpenRouter. Texto genérico interno de fallback, como `LLM request failed with an unknown error.`, permanece conservador e não aciona failover por si só.

  </Accordion>
  <Accordion title="Limites de retry-after do SDK">
    Alguns SDKs de provedores poderiam, de outra forma, aguardar uma janela longa de `Retry-After` antes de devolver o controle ao OpenClaw. Para SDKs baseados em Stainless, como Anthropic e OpenAI, o OpenClaw limita esperas internas do SDK `retry-after-ms` / `retry-after` a 60 segundos por padrão e expõe respostas repetíveis mais longas imediatamente para que esse caminho de failover possa executar. Ajuste ou desabilite o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [Comportamento de retry](/pt-BR/concepts/retry).
  </Accordion>
  <Accordion title="Cooldowns com escopo de modelo">
    Cooldowns de limite de taxa também podem ter escopo de modelo:

    - O OpenClaw registra `cooldownModel` para falhas de limite de taxa quando o ID do modelo com falha é conhecido.
    - Um modelo irmão no mesmo provedor ainda pode ser tentado quando o cooldown tem escopo de um modelo diferente.
    - Janelas de faturamento/desabilitadas ainda bloqueiam todo o perfil entre modelos.

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

## Desabilitações por faturamento

Falhas de faturamento/crédito (por exemplo, "insufficient credits" / "credit balance too low") são tratadas como dignas de failover, mas geralmente não são transitórias. Em vez de um cooldown curto, o OpenClaw marca o perfil como **desabilitado** (com um backoff mais longo) e alterna para o próximo perfil/provedor.

<Note>
Nem toda resposta com formato de faturamento é `402`, e nem todo HTTP `402` entra aqui. O OpenClaw mantém texto explícito de faturamento na trilha de faturamento mesmo quando um provedor retorna `401` ou `403`, mas correspondências específicas de provedor permanecem com escopo restrito ao provedor que as possui (por exemplo, OpenRouter `403 Key limit exceeded`).

Enquanto isso, erros temporários `402` de janela de uso e de limites de gastos de organização/workspace são classificados como `rate_limit` quando a mensagem parece repetível (por exemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Eles permanecem no caminho curto de cooldown/failover em vez do caminho longo de desabilitação por faturamento.
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

- O backoff de faturamento começa em **5 horas**, dobra a cada falha de faturamento e tem limite de **24 horas**.
- Contadores de backoff são redefinidos se o perfil não tiver falhado por **24 horas** (configurável).
- Retries por sobrecarga permitem **1 rotação de perfil do mesmo provedor** antes do fallback de modelo.
- Retries por sobrecarga usam **0 ms de backoff** por padrão.

## Fallback de modelo

Se todos os perfis de um provedor falharem, o OpenClaw avança para o próximo modelo em `agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticação, limites de taxa e timeouts que esgotaram a rotação de perfis (outros erros não avançam o fallback). Erros de provedor que não expõem detalhes suficientes ainda são rotulados com precisão no estado de fallback: `empty_response` significa que o provedor não retornou nenhuma mensagem ou status utilizável, `no_error_details` significa que o provedor retornou explicitamente `Unknown error (no error details in response)`, e `unclassified` significa que o OpenClaw preservou a prévia bruta, mas nenhum classificador a correspondeu ainda.

Erros de sobrecarga e limite de taxa são tratados de forma mais agressiva do que cooldowns de cobrança. Por padrão, o OpenClaw permite uma nova tentativa de perfil de autenticação do mesmo provedor e, em seguida, alterna para o próximo fallback de modelo configurado sem esperar. Sinais de provedor ocupado, como `ModelNotReadyException`, entram nesse grupo de sobrecarga. Ajuste isso com `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando uma execução começa a partir do primário padrão configurado, de um primário de tarefa cron, de um primário de agente com fallbacks explícitos ou de uma substituição de fallback selecionada automaticamente, o OpenClaw pode percorrer a cadeia de fallback configurada correspondente. Primários de agente sem fallbacks explícitos e seleções explícitas do usuário (por exemplo, `/model ollama/qwen3.5:27b`, o seletor de modelos, `sessions.patch` ou substituições pontuais de provedor/modelo da CLI) são estritos: se esse provedor/modelo estiver inacessível ou falhar antes de produzir uma resposta, o OpenClaw relata a falha em vez de responder a partir de um fallback não relacionado.

### Regras da cadeia de candidatos

O OpenClaw cria a lista de candidatos a partir do `provider/model` solicitado no momento mais os fallbacks configurados.

<AccordionGroup>
  <Accordion title="Regras">
    - O modelo solicitado é sempre o primeiro.
    - Fallbacks configurados explicitamente são desduplicados, mas não filtrados pela lista de modelos permitidos. Eles são tratados como intenção explícita do operador.
    - Se a execução atual já estiver em um fallback configurado na mesma família de provedores, o OpenClaw continuará usando a cadeia configurada completa.
    - Se a execução atual estiver em um provedor diferente da configuração e esse modelo atual ainda não fizer parte da cadeia de fallback configurada, o OpenClaw não anexará fallbacks configurados não relacionados de outro provedor.
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
    - `LiveSessionModelSwitchError`, que é normalizado para um caminho de failover para que um modelo persistido obsoleto não crie um loop externo de novas tentativas
    - outros erros não reconhecidos quando ainda há candidatos restantes

  </Tab>
  <Tab title="Não continua em">
    - abortos explícitos que não têm formato de tempo limite/failover
    - erros de estouro de contexto que devem permanecer dentro da lógica de Compaction/nova tentativa (por exemplo, `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` ou `ollama error: context length exceeded`)
    - um erro desconhecido final quando não há candidatos restantes

  </Tab>
</Tabs>

### Comportamento de ignorar cooldown vs sondar

Quando todos os perfis de autenticação de um provedor já estão em cooldown, o OpenClaw não ignora automaticamente esse provedor para sempre. Ele toma uma decisão por candidato:

<AccordionGroup>
  <Accordion title="Decisões por candidato">
    - Falhas de autenticação persistentes ignoram o provedor inteiro imediatamente.
    - Desativações por cobrança geralmente são ignoradas, mas o candidato primário ainda pode ser sondado com limitação para que a recuperação seja possível sem reiniciar.
    - O candidato primário pode ser sondado perto do fim do cooldown, com uma limitação por provedor.
    - Fallbacks irmãos do mesmo provedor podem ser tentados apesar do cooldown quando a falha parece transitória (`rate_limit`, `overloaded` ou desconhecida). Isso é especialmente relevante quando um limite de taxa é escopado ao modelo e um modelo irmão ainda pode se recuperar imediatamente.
    - Sondagens de cooldown transitório são limitadas a uma por provedor por execução de fallback, para que um único provedor não interrompa o fallback entre provedores.

  </Accordion>
</AccordionGroup>

## Substituições de sessão e troca de modelo ao vivo

Mudanças de modelo da sessão são estado compartilhado. O executor ativo, o comando `/model`, atualizações de Compaction/sessão e a reconciliação de sessão ao vivo leem ou escrevem partes da mesma entrada de sessão.

Isso significa que novas tentativas de fallback precisam se coordenar com a troca de modelo ao vivo:

- Apenas mudanças de modelo explícitas acionadas pelo usuário marcam uma troca ao vivo pendente. Isso inclui `/model`, `session_status(model=...)` e `sessions.patch`.
- Mudanças de modelo acionadas pelo sistema, como rotação de fallback, substituições de Heartbeat ou Compaction, nunca marcam uma troca ao vivo pendente por conta própria.
- Substituições de modelo acionadas pelo usuário são tratadas como seleções exatas para a política de fallback, então um provedor selecionado inacessível aparece como falha em vez de ser mascarado por `agents.defaults.model.fallbacks`.
- Antes que uma nova tentativa de fallback comece, o executor de resposta persiste os campos de substituição de fallback selecionados na entrada da sessão.
- Substituições automáticas de fallback permanecem selecionadas em turnos subsequentes para que o OpenClaw não sonde um primário sabidamente ruim em cada mensagem. `/new`, `/reset` e `sessions.reset` limpam substituições originadas automaticamente e retornam a sessão ao padrão configurado.
- `/status` mostra o modelo selecionado e, quando o estado de fallback difere, o modelo de fallback ativo e o motivo.
- A reconciliação de sessão ao vivo prefere substituições de sessão persistidas em vez de campos de modelo obsoletos em tempo de execução.
- Se um erro de troca ao vivo apontar para um candidato posterior na cadeia de fallback ativa, o OpenClaw salta diretamente para esse modelo selecionado em vez de percorrer candidatos não relacionados primeiro.
- Se a tentativa de fallback falhar, o executor reverte apenas os campos de substituição que escreveu, e somente se eles ainda corresponderem a esse candidato com falha.

Isso evita a disputa clássica:

<Steps>
  <Step title="Primário falha">
    O modelo primário selecionado falha.
  </Step>
  <Step title="Fallback escolhido na memória">
    O candidato de fallback é escolhido na memória.
  </Step>
  <Step title="Armazenamento da sessão ainda mostra primário antigo">
    O armazenamento da sessão ainda reflete o primário antigo.
  </Step>
  <Step title="Reconciliação ao vivo lê estado obsoleto">
    A reconciliação de sessão ao vivo lê o estado obsoleto da sessão.
  </Step>
  <Step title="Nova tentativa volta ao anterior">
    A nova tentativa é trazida de volta ao modelo antigo antes que a tentativa de fallback comece.
  </Step>
</Steps>

A substituição de fallback persistida fecha essa janela, e a reversão restrita mantém intactas as mudanças de sessão manuais ou de tempo de execução mais recentes.

## Observabilidade e resumos de falha

`runWithModelFallback(...)` registra detalhes por tentativa que alimentam logs e mensagens de cooldown voltadas ao usuário:

- provedor/modelo tentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivos de failover semelhantes)
- status/código opcional
- resumo de erro legível por humanos

Logs estruturados `model_fallback_decision` também incluem campos planos `fallbackStep*` quando um candidato falha, é ignorado ou um fallback posterior tem sucesso. Esses campos tornam a transição tentada explícita (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) para que exportadores de logs e diagnóstico possam reconstruir a falha primária mesmo quando o fallback terminal também falha.

Quando todos os candidatos falham, o OpenClaw lança `FallbackSummaryError`. O executor externo de resposta pode usar isso para criar uma mensagem mais específica, como "todos os modelos estão temporariamente com limite de taxa", e incluir o vencimento de cooldown mais próximo quando ele for conhecido.

Esse resumo de cooldown é ciente do modelo:

- limites de taxa escopados a modelos não relacionados são ignorados para a cadeia de provedor/modelo tentada
- se o bloqueio restante for um limite de taxa escopado ao modelo correspondente, o OpenClaw relata o último vencimento correspondente que ainda bloqueia esse modelo

## Configuração relacionada

Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- roteamento de `agents.defaults.imageModel`

Consulte [Modelos](/pt-BR/concepts/models) para a visão geral mais ampla de seleção de modelos e fallback.
