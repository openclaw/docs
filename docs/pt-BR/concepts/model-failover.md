---
read_when:
    - Diagnosticando rotação de perfis de autenticação, períodos de espera ou comportamento de fallback de modelo
    - Atualizando regras de failover para perfis de autenticação ou modelos
    - Entendendo como substituições de modelo da sessão interagem com tentativas de fallback
sidebarTitle: Model failover
summary: Como o OpenClaw rotaciona perfis de autenticação e usa fallback entre modelos
title: Failover de modelo
x-i18n:
    generated_at: "2026-04-26T11:27:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

O OpenClaw lida com falhas em dois estágios:

1. **Rotação de perfil de autenticação** dentro do provedor atual.
2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

Este documento explica as regras de runtime e os dados que as sustentam.

## Fluxo de runtime

Para uma execução de texto normal, o OpenClaw avalia candidatos nesta ordem:

<Steps>
  <Step title="Resolver estado da sessão">
    Resolve o modelo ativo da sessão e a preferência de perfil de autenticação.
  </Step>
  <Step title="Construir cadeia de candidatos">
    Constrói a cadeia de candidatos de modelo a partir do modelo de sessão atualmente selecionado, depois `agents.defaults.model.fallbacks` em ordem, terminando com o primário configurado quando a execução começou a partir de uma substituição.
  </Step>
  <Step title="Tentar o provedor atual">
    Tenta o provedor atual com regras de rotação/período de espera de perfil de autenticação.
  </Step>
  <Step title="Avançar em erros elegíveis para failover">
    Se esse provedor se esgotar com um erro elegível para failover, passa para o próximo candidato de modelo.
  </Step>
  <Step title="Persistir substituição de fallback">
    Persiste a substituição de fallback selecionada antes de a nova tentativa começar, para que outros leitores da sessão vejam o mesmo provedor/modelo que o executor está prestes a usar.
  </Step>
  <Step title="Reverter de forma restrita em caso de falha">
    Se o candidato de fallback falhar, reverte apenas os campos de substituição da sessão pertencentes ao fallback quando eles ainda corresponderem a esse candidato com falha.
  </Step>
  <Step title="Lançar FallbackSummaryError se esgotado">
    Se todos os candidatos falharem, lança um `FallbackSummaryError` com detalhes por tentativa e o vencimento de período de espera mais próximo quando conhecido.
  </Step>
</Steps>

Isso é intencionalmente mais restrito do que "salvar e restaurar a sessão inteira". O executor de resposta persiste apenas os campos de seleção de modelo que ele controla para fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Isso impede que uma nova tentativa de fallback com falha sobrescreva mutações mais recentes e não relacionadas da sessão, como alterações manuais de `/model` ou atualizações de rotação de sessão que ocorreram enquanto a tentativa estava em execução.

## Armazenamento de autenticação (chaves + OAuth)

O OpenClaw usa **perfis de autenticação** tanto para chaves de API quanto para tokens OAuth.

- Os segredos ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legado: `~/.openclaw/agent/auth-profiles.json`).
- O estado de runtime de roteamento de autenticação fica em `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Configurações `auth.profiles` / `auth.order` são **somente metadados + roteamento** (sem segredos).
- Arquivo OAuth legado apenas para importação: `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso).

Mais detalhes: [OAuth](/pt-BR/concepts/oauth)

Tipos de credencial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)

## IDs de perfil

Logins OAuth criam perfis distintos para que várias contas possam coexistir.

- Padrão: `provider:default` quando nenhum email está disponível.
- OAuth com email: `provider:<email>` (por exemplo `google-antigravity:user@gmail.com`).

Os perfis ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` em `profiles`.

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

Se nenhuma ordem explícita for configurada, o OpenClaw usa uma ordem round-robin:

- **Chave primária:** tipo de perfil (**OAuth antes de chaves de API**).
- **Chave secundária:** `usageStats.lastUsed` (mais antigo primeiro, dentro de cada tipo).
- **Perfis em período de espera/desabilitados** são movidos para o fim, ordenados pelo vencimento mais próximo.

### Persistência na sessão (favorável a cache)

O OpenClaw **fixa o perfil de autenticação escolhido por sessão** para manter os caches do provedor aquecidos. Ele **não** faz rotação a cada requisição. O perfil fixado é reutilizado até que:

- a sessão seja redefinida (`/new` / `/reset`)
- uma Compaction seja concluída (o contador de compaction é incrementado)
- o perfil entre em período de espera/seja desabilitado

A seleção manual via `/model …@<profileId>` define uma **substituição do usuário** para aquela sessão e não entra em rotação automática até que uma nova sessão comece.

<Note>
Perfis fixados automaticamente (selecionados pelo roteador de sessão) são tratados como uma **preferência**: eles são tentados primeiro, mas o OpenClaw pode rotacionar para outro perfil em caso de limites de taxa/timeouts. Perfis fixados pelo usuário permanecem travados nesse perfil; se ele falhar e houver fallbacks de modelo configurados, o OpenClaw passa para o próximo modelo em vez de trocar de perfil.
</Note>

### Por que o OAuth pode "parecer perdido"

Se você tiver tanto um perfil OAuth quanto um perfil de chave de API para o mesmo provedor, o round-robin pode alternar entre eles entre mensagens, a menos que estejam fixados. Para forçar um único perfil:

- Fixe com `auth.order[provider] = ["provider:profileId"]`, ou
- Use uma substituição por sessão via `/model …` com uma substituição de perfil (quando suportado pela sua UI/superfície de chat).

## Períodos de espera

Quando um perfil falha devido a erros de autenticação/limite de taxa (ou um timeout que parece limitação de taxa), o OpenClaw o marca com período de espera e passa para o próximo perfil.

<AccordionGroup>
  <Accordion title="O que entra no bucket de limite de taxa / timeout">
    Esse bucket de limite de taxa é mais amplo do que um simples `429`: ele também inclui mensagens de provedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limites periódicos de janela de uso como `weekly/monthly limit reached`.

    Erros de formato/requisição inválida (por exemplo falhas de validação de ID de chamada de ferramenta do Cloud Code Assist) são tratados como elegíveis para failover e usam os mesmos períodos de espera. Erros de motivo de parada compatíveis com OpenAI, como `Unhandled stop reason: error`, `stop reason: error` e `reason: error`, são classificados como sinais de timeout/failover.

    Texto genérico de servidor também pode cair nesse bucket de timeout quando a origem corresponde a um padrão transitório conhecido. Por exemplo, a mensagem simples do wrapper de stream do pi-ai `An unknown error occurred` é tratada como elegível para failover para qualquer provedor porque o pi-ai a emite quando streams do provedor terminam com `stopReason: "aborted"` ou `stopReason: "error"` sem detalhes específicos. Payloads JSON `api_error` com texto transitório de servidor como `internal server error`, `unknown error, 520`, `upstream error` ou `backend error` também são tratados como timeouts elegíveis para failover.

    Texto genérico upstream específico do OpenRouter, como `Provider returned error`, é tratado como timeout apenas quando o contexto do provedor é realmente OpenRouter. Texto genérico interno de fallback, como `LLM request failed with an unknown error.`, permanece conservador e não aciona failover por si só.

  </Accordion>
  <Accordion title="Limites de retry-after do SDK">
    Alguns SDKs de provedor poderiam dormir por uma longa janela `Retry-After` antes de devolver o controle ao OpenClaw. Para SDKs baseados em Stainless, como Anthropic e OpenAI, o OpenClaw limita por padrão as esperas internas do SDK em `retry-after-ms` / `retry-after` a 60 segundos e expõe imediatamente respostas retryable mais longas para que esse caminho de failover possa ser executado. Ajuste ou desabilite o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [Comportamento de retry](/pt-BR/concepts/retry).
  </Accordion>
  <Accordion title="Períodos de espera com escopo de modelo">
    Períodos de espera de limite de taxa também podem ter escopo de modelo:

    - O OpenClaw registra `cooldownModel` para falhas por limite de taxa quando o id do modelo com falha é conhecido.
    - Um modelo irmão no mesmo provedor ainda pode ser tentado quando o período de espera está limitado a um modelo diferente.
    - Janelas de cobrança/desabilitação continuam bloqueando o perfil inteiro em todos os modelos.

  </Accordion>
</AccordionGroup>

Os períodos de espera usam backoff exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (limite)

O estado é armazenado em `auth-state.json` em `usageStats`:

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

Falhas de cobrança/crédito (por exemplo "insufficient credits" / "credit balance too low") são tratadas como elegíveis para failover, mas normalmente não são transitórias. Em vez de um curto período de espera, o OpenClaw marca o perfil como **desabilitado** (com um backoff mais longo) e rotaciona para o próximo perfil/provedor.

<Note>
Nem toda resposta com aparência de cobrança é `402`, e nem todo HTTP `402` entra aqui. O OpenClaw mantém texto explícito de cobrança na trilha de cobrança mesmo quando um provedor retorna `401` ou `403`, mas matchers específicos de provedor permanecem limitados ao provedor que os possui (por exemplo OpenRouter `403 Key limit exceeded`).

Enquanto isso, erros temporários `402` de janela de uso e limite de gasto de organização/workspace são classificados como `rate_limit` quando a mensagem parece reexecutável (por exemplo `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Eles permanecem no caminho curto de período de espera/failover em vez do caminho longo de desabilitação por cobrança.
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

- O backoff por cobrança começa em **5 horas**, dobra a cada falha de cobrança e é limitado a **24 horas**.
- Os contadores de backoff são redefinidos se o perfil não falhar por **24 horas** (configurável).
- Retries por sobrecarga permitem **1 rotação de perfil no mesmo provedor** antes do fallback de modelo.
- Retries por sobrecarga usam backoff de **0 ms** por padrão.

## Fallback de modelo

Se todos os perfis de um provedor falharem, o OpenClaw passa para o próximo modelo em `agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticação, limites de taxa e timeouts que esgotaram a rotação de perfis (outros erros não avançam o fallback).

Erros de sobrecarga e limite de taxa são tratados de forma mais agressiva do que períodos de espera por cobrança. Por padrão, o OpenClaw permite uma tentativa com outro perfil de autenticação no mesmo provedor e depois muda sem esperar para o próximo fallback de modelo configurado. Sinais de provedor ocupado, como `ModelNotReadyException`, entram nesse bucket de sobrecarga. Ajuste isso com `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` e `auth.cooldowns.rateLimitedProfileRotations`.

Quando uma execução começa com uma substituição de modelo (hooks ou CLI), os fallbacks ainda terminam em `agents.defaults.model.primary` depois de tentar quaisquer fallbacks configurados.

### Regras da cadeia de candidatos

O OpenClaw constrói a lista de candidatos a partir do `provider/model` solicitado no momento mais os fallbacks configurados.

<AccordionGroup>
  <Accordion title="Regras">
    - O modelo solicitado vem sempre primeiro.
    - Fallbacks configurados explicitamente são deduplicados, mas não são filtrados pela allowlist de modelos. Eles são tratados como intenção explícita do operador.
    - Se a execução atual já estiver em um fallback configurado na mesma família de provedores, o OpenClaw continua usando a cadeia configurada completa.
    - Se a execução atual estiver em um provedor diferente do da configuração e esse modelo atual ainda não fizer parte da cadeia de fallback configurada, o OpenClaw não acrescentará fallbacks configurados não relacionados de outro provedor.
    - Quando a execução começou a partir de uma substituição, o primário configurado é acrescentado no final para que a cadeia possa se estabilizar de volta no padrão normal quando os candidatos anteriores forem esgotados.

  </Accordion>
</AccordionGroup>

### Quais erros avançam o fallback

<Tabs>
  <Tab title="Continua em">
    - falhas de autenticação
    - limites de taxa e esgotamento de período de espera
    - erros de sobrecarga/provedor ocupado
    - erros de failover com formato de timeout
    - desabilitações por cobrança
    - `LiveSessionModelSwitchError`, que é normalizado em um caminho de failover para que um modelo persistido obsoleto não crie um loop externo de retry
    - outros erros não reconhecidos quando ainda restam candidatos

  </Tab>
  <Tab title="Não continua em">
    - abortos explícitos que não têm formato de timeout/failover
    - erros de estouro de contexto que devem permanecer dentro da lógica de Compaction/retry (por exemplo `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` ou `ollama error: context length exceeded`)
    - um erro desconhecido final quando não restam candidatos

  </Tab>
</Tabs>

### Comportamento de pular período de espera vs sondagem

Quando todos os perfis de autenticação de um provedor já estão em período de espera, o OpenClaw não pula automaticamente esse provedor para sempre. Ele toma uma decisão por candidato:

<AccordionGroup>
  <Accordion title="Decisões por candidato">
    - Falhas persistentes de autenticação pulam imediatamente o provedor inteiro.
    - Desabilitações por cobrança normalmente são puladas, mas o candidato primário ainda pode ser sondado sob limitação para que a recuperação seja possível sem reiniciar.
    - O candidato primário pode ser sondado perto do vencimento do período de espera, com uma limitação por provedor.
    - Candidatos irmãos de fallback no mesmo provedor podem ser tentados apesar do período de espera quando a falha parecer transitória (`rate_limit`, `overloaded` ou desconhecida). Isso é especialmente relevante quando um limite de taxa tem escopo de modelo e um modelo irmão ainda pode se recuperar imediatamente.
    - Sondagens transitórias em período de espera são limitadas a uma por provedor por execução de fallback, para que um único provedor não atrase o fallback entre provedores.

  </Accordion>
</AccordionGroup>

## Substituições de sessão e troca de modelo ao vivo

Mudanças no modelo da sessão são estado compartilhado. O executor ativo, o comando `/model`, atualizações de Compaction/sessão e reconciliação de sessão ao vivo leem ou gravam partes da mesma entrada de sessão.

Isso significa que tentativas de fallback precisam coordenar com a troca de modelo ao vivo:

- Somente mudanças explícitas de modelo acionadas pelo usuário marcam uma troca ao vivo pendente. Isso inclui `/model`, `session_status(model=...)` e `sessions.patch`.
- Mudanças de modelo acionadas pelo sistema, como rotação por fallback, substituições de Heartbeat ou Compaction, nunca marcam por si só uma troca ao vivo pendente.
- Antes de uma tentativa de fallback começar, o executor de resposta persiste os campos de substituição de fallback selecionados na entrada da sessão.
- A reconciliação de sessão ao vivo prefere substituições persistidas da sessão em vez de campos de modelo obsoletos em runtime.
- Se a tentativa de fallback falhar, o executor reverte apenas os campos de substituição que gravou, e somente se eles ainda corresponderem àquele candidato com falha.

Isso evita a condição de corrida clássica:

<Steps>
  <Step title="Primário falha">
    O modelo primário selecionado falha.
  </Step>
  <Step title="Fallback escolhido em memória">
    O candidato de fallback é escolhido em memória.
  </Step>
  <Step title="Armazenamento da sessão ainda diz primário antigo">
    O armazenamento da sessão ainda reflete o primário antigo.
  </Step>
  <Step title="Reconciliação ao vivo lê estado obsoleto">
    A reconciliação de sessão ao vivo lê o estado obsoleto da sessão.
  </Step>
  <Step title="Retry volta para trás">
    A nova tentativa volta para o modelo antigo antes de a tentativa de fallback começar.
  </Step>
</Steps>

A substituição de fallback persistida fecha essa janela, e a reversão restrita mantém intactas mudanças mais recentes da sessão, manuais ou de runtime.

## Observabilidade e resumos de falha

`runWithModelFallback(...)` registra detalhes por tentativa que alimentam logs e mensagens de período de espera visíveis ao usuário:

- provedor/modelo tentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivos de failover semelhantes)
- status/código opcional
- resumo de erro legível por humanos

Quando todos os candidatos falham, o OpenClaw lança `FallbackSummaryError`. O executor externo de resposta pode usar isso para construir uma mensagem mais específica, como "todos os modelos estão temporariamente limitados por taxa", e incluir o vencimento de período de espera mais próximo quando conhecido.

Esse resumo de período de espera considera o modelo:

- limites de taxa com escopo de modelo não relacionados são ignorados para a cadeia tentada de provedor/modelo
- se o bloqueio restante for um limite de taxa com escopo de modelo correspondente, o OpenClaw informa o último vencimento correspondente que ainda bloqueia aquele modelo

## Configuração relacionada

Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- roteamento de `agents.defaults.imageModel`

Consulte [Modelos](/pt-BR/concepts/models) para a visão geral mais ampla de seleção de modelo e fallback.
