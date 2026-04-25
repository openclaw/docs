---
read_when:
    - Diagnosticando a rotação de perfis de autenticação, períodos de espera ou comportamento de fallback de modelo
    - Atualizando regras de failover para perfis de autenticação ou modelos
    - Entendendo como as substituições de modelo da sessão interagem com as novas tentativas de fallback
summary: Como o OpenClaw alterna perfis de autenticação e faz fallback entre modelos
title: Failover de modelo
x-i18n:
    generated_at: "2026-04-25T18:17:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e128c288ed420874f1b5eb28ecaa4ada66f09152c1b0b73b1d932bf5e86b6dd7
    source_path: concepts/model-failover.md
    workflow: 15
---

O OpenClaw lida com falhas em dois estágios:

1. **Rotação de perfis de autenticação** dentro do provedor atual.
2. **Failover de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

Este documento explica as regras de runtime e os dados que as sustentam.

## Fluxo de runtime

Para uma execução normal de texto, o OpenClaw avalia candidatos nesta ordem:

1. O modelo de sessão atualmente selecionado.
2. `agents.defaults.model.fallbacks` configurado, em ordem.
3. O modelo primário configurado ao final, quando a execução começou a partir de uma substituição.

Dentro de cada candidato, o OpenClaw tenta failover de perfil de autenticação antes de avançar para o próximo candidato de modelo.

Sequência de alto nível:

1. Resolver o modelo de sessão ativo e a preferência de perfil de autenticação.
2. Construir a cadeia de candidatos de modelo.
3. Tentar o provedor atual com regras de rotação/período de espera de perfil de autenticação.
4. Se esse provedor for esgotado com um erro elegível para failover, passar para o próximo candidato de modelo.
5. Persistir a substituição de fallback selecionada antes de a nova tentativa começar, para que outros leitores da sessão vejam o mesmo provedor/modelo que o executor está prestes a usar.
6. Se o candidato de fallback falhar, reverter apenas os campos de substituição da sessão pertencentes ao fallback, quando eles ainda corresponderem a esse candidato com falha.
7. Se todos os candidatos falharem, lançar um `FallbackSummaryError` com detalhes por tentativa e o vencimento de período de espera mais próximo, quando conhecido.

Isso é intencionalmente mais restrito do que “salvar e restaurar a sessão inteira”. O executor de resposta persiste apenas os campos de seleção de modelo que ele controla para fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Isso evita que uma nova tentativa de fallback com falha sobrescreva mutações mais recentes e não relacionadas na sessão, como alterações manuais de `/model` ou atualizações de rotação de sessão que aconteceram enquanto a tentativa estava em execução.

## Armazenamento de autenticação (chaves + OAuth)

O OpenClaw usa **perfis de autenticação** tanto para chaves de API quanto para tokens OAuth.

- Os segredos ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legado: `~/.openclaw/agent/auth-profiles.json`).
- O estado de roteamento de autenticação em runtime fica em `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- A configuração `auth.profiles` / `auth.order` é **apenas metadados + roteamento** (sem segredos).
- Arquivo OAuth legado apenas para importação: `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso).

Mais detalhes: [/concepts/oauth](/pt-BR/concepts/oauth)

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

1. **Configuração explícita**: `auth.order[provider]` (se definida).
2. **Perfis configurados**: `auth.profiles` filtrados por provedor.
3. **Perfis armazenados**: entradas em `auth-profiles.json` para o provedor.

Se nenhuma ordem explícita for configurada, o OpenClaw usa uma ordem round-robin:

- **Chave primária:** tipo de perfil (**OAuth antes de chaves de API**).
- **Chave secundária:** `usageStats.lastUsed` (mais antigo primeiro, dentro de cada tipo).
- **Perfis em período de espera/desativados** são movidos para o fim, ordenados pelo vencimento mais próximo.

### Persistência por sessão (favorável a cache)

O OpenClaw **fixa o perfil de autenticação escolhido por sessão** para manter os caches do provedor aquecidos.
Ele **não** faz rotação a cada requisição. O perfil fixado é reutilizado até que:

- a sessão seja redefinida (`/new` / `/reset`)
- uma compaction seja concluída (a contagem de compaction aumenta)
- o perfil entre em período de espera/seja desativado

A seleção manual via `/model …@<profileId>` define uma **substituição do usuário** para essa sessão
e não entra em rotação automática até que uma nova sessão comece.

Perfis fixados automaticamente (selecionados pelo roteador da sessão) são tratados como uma **preferência**:
eles são tentados primeiro, mas o OpenClaw pode alternar para outro perfil em limites de taxa/timeouts.
Perfis fixados pelo usuário permanecem travados nesse perfil; se ele falhar e fallbacks de modelo
estiverem configurados, o OpenClaw passa para o próximo modelo em vez de trocar de perfil.

### Por que o OAuth pode “parecer perdido”

Se você tiver tanto um perfil OAuth quanto um perfil de chave de API para o mesmo provedor, o round-robin pode alternar entre eles entre mensagens, a menos que estejam fixados. Para forçar um único perfil:

- Fixe com `auth.order[provider] = ["provider:profileId"]`, ou
- Use uma substituição por sessão via `/model …` com uma substituição de perfil de autenticação (quando compatível com sua UI/superfície de chat).

## Períodos de espera

Quando um perfil falha devido a erros de autenticação/limite de taxa (ou um timeout que parece limitação de taxa), o OpenClaw o marca em período de espera e passa para o próximo perfil.
Esse grupo de limite de taxa é mais amplo do que apenas `429`: ele também inclui mensagens do provedor
como `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` e limites periódicos de janela de uso, como
`weekly/monthly limit reached`.
Erros de formato/requisição inválida (por exemplo, falhas de validação de ID de chamada de ferramenta do Cloud Code Assist) são tratados como elegíveis para failover e usam os mesmos períodos de espera.
Erros compatíveis com OpenAI de motivo de parada, como `Unhandled stop reason: error`,
`stop reason: error` e `reason: error`, são classificados como sinais de timeout/failover.
Texto genérico de servidor também pode cair nesse grupo de timeout quando a origem corresponde
a um padrão transitório conhecido. Por exemplo, a mensagem simples do wrapper de stream do pi-ai
`An unknown error occurred` é tratada como elegível para failover para qualquer provedor
porque o pi-ai a emite quando streams do provedor terminam com `stopReason: "aborted"` ou
`stopReason: "error"` sem detalhes específicos. Payloads JSON `api_error` com texto transitório
de servidor, como `internal server error`, `unknown error, 520`,
`upstream error` ou `backend error`, também são tratados como timeouts
elegíveis para failover.
Texto genérico de upstream específico do OpenRouter, como `Provider returned error`,
é tratado como timeout apenas quando o contexto do provedor é de fato OpenRouter.
Texto genérico de fallback interno, como `LLM request failed with an unknown
error.`, permanece conservador e não aciona failover por si só.

Alguns SDKs de provedores podem, de outra forma, aguardar uma longa janela de `Retry-After` antes
de devolver o controle ao OpenClaw. Para SDKs baseados em Stainless, como Anthropic e
OpenAI, o OpenClaw limita por padrão as esperas internas do SDK de `retry-after-ms` / `retry-after` a 60
segundos e expõe imediatamente respostas reutilizáveis mais longas para que esse
caminho de failover possa ser executado. Ajuste ou desative o limite com
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [/concepts/retry](/pt-BR/concepts/retry).

Períodos de espera por limite de taxa também podem ser delimitados por modelo:

- O OpenClaw registra `cooldownModel` para falhas por limite de taxa quando o ID
  do modelo com falha é conhecido.
- Um modelo irmão no mesmo provedor ainda pode ser tentado quando o período de espera estiver
  delimitado a um modelo diferente.
- Janelas de cobrança/desativação ainda bloqueiam o perfil inteiro em todos os modelos.

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

## Desativações por cobrança

Falhas de cobrança/crédito (por exemplo, “insufficient credits” / “credit balance too low”) são tratadas como elegíveis para failover, mas normalmente não são transitórias. Em vez de um curto período de espera, o OpenClaw marca o perfil como **desativado** (com um backoff mais longo) e alterna para o próximo perfil/provedor.

Nem toda resposta com aparência de cobrança é `402`, e nem todo HTTP `402` cai
aqui. O OpenClaw mantém texto explícito de cobrança na categoria de cobrança mesmo quando um
provedor retorna `401` ou `403` em vez disso, mas matchers específicos do provedor permanecem
delimitados ao provedor que os possui (por exemplo, OpenRouter `403 Key limit
exceeded`). Enquanto isso, erros temporários `402` de janela de uso e
de limite de gastos de organização/workspace são classificados como `rate_limit` quando
a mensagem parece passível de nova tentativa (por exemplo, `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` ou `organization spending limit exceeded`).
Esses permanecem no caminho curto de período de espera/failover em vez do longo
caminho de desativação por cobrança.

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

- O backoff de cobrança começa em **5 horas**, dobra a cada falha de cobrança e atinge o limite de **24 horas**.
- Os contadores de backoff são redefinidos se o perfil não falhar por **24 horas** (configurável).
- Novas tentativas por sobrecarga permitem **1 rotação de perfil no mesmo provedor** antes do fallback de modelo.
- Novas tentativas por sobrecarga usam backoff de **0 ms** por padrão.

## Fallback de modelo

Se todos os perfis de um provedor falharem, o OpenClaw passa para o próximo modelo em
`agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticação, limites de taxa e
timeouts que esgotaram a rotação de perfil (outros erros não avançam o fallback).

Erros de sobrecarga e limite de taxa são tratados de forma mais agressiva do que períodos de espera
por cobrança. Por padrão, o OpenClaw permite uma nova tentativa de perfil de autenticação no mesmo provedor,
depois muda para o próximo fallback de modelo configurado sem esperar.
Sinais de provedor ocupado, como `ModelNotReadyException`, caem nesse grupo de sobrecarga.
Ajuste isso com `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` e
`auth.cooldowns.rateLimitedProfileRotations`.

Quando uma execução começa com uma substituição de modelo (hooks ou CLI), os fallbacks ainda terminam em
`agents.defaults.model.primary` depois de tentar quaisquer fallbacks configurados.

### Regras da cadeia de candidatos

O OpenClaw constrói a lista de candidatos a partir do `provider/model` solicitado no momento
mais os fallbacks configurados.

Regras:

- O modelo solicitado é sempre o primeiro.
- Fallbacks configurados explicitamente são deduplicados, mas não filtrados pela allowlist
  de modelos. Eles são tratados como intenção explícita do operador.
- Se a execução atual já estiver em um fallback configurado na mesma família de provedor,
  o OpenClaw continua usando a cadeia configurada completa.
- Se a execução atual estiver em um provedor diferente da configuração e esse modelo atual
  ainda não fizer parte da cadeia de fallback configurada, o OpenClaw não
  acrescenta fallbacks configurados não relacionados de outro provedor.
- Quando a execução começou a partir de uma substituição, o primário configurado é acrescentado ao
  final para que a cadeia possa voltar ao padrão normal assim que os candidatos
  anteriores forem esgotados.

### Quais erros avançam o fallback

O fallback de modelo continua em:

- falhas de autenticação
- limites de taxa e esgotamento de período de espera
- erros de sobrecarga/provedor ocupado
- erros de failover com formato de timeout
- desativações por cobrança
- `LiveSessionModelSwitchError`, que é normalizado para um caminho de failover para que
  um modelo persistido desatualizado não crie um loop externo de nova tentativa
- outros erros não reconhecidos quando ainda restam candidatos

O fallback de modelo não continua em:

- abortos explícitos que não tenham formato de timeout/failover
- erros de estouro de contexto que devem permanecer dentro da lógica de compaction/nova tentativa
  (por exemplo `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` ou `ollama error: context
length exceeded`)
- um erro desconhecido final quando não restam candidatos

### Comportamento de pular ou sondar em período de espera

Quando todos os perfis de autenticação de um provedor já estão em período de espera, o OpenClaw
não ignora automaticamente esse provedor para sempre. Ele toma uma decisão por candidato:

- Falhas persistentes de autenticação pulam o provedor inteiro imediatamente.
- Desativações por cobrança normalmente pulam, mas o candidato primário ainda pode ser sondado
  com limitação para que a recuperação seja possível sem reiniciar.
- O candidato primário pode ser sondado próximo ao vencimento do período de espera, com uma limitação por provedor.
- Irmãos de fallback no mesmo provedor podem ser tentados apesar do período de espera quando a
  falha parece transitória (`rate_limit`, `overloaded` ou desconhecida). Isso é
  especialmente relevante quando um limite de taxa é delimitado por modelo e um modelo irmão pode
  ainda se recuperar imediatamente.
- Sondagens transitórias durante período de espera são limitadas a uma por provedor por execução de fallback, para que
  um único provedor não atrase o fallback entre provedores.

## Substituições de sessão e troca de modelo ao vivo

As alterações de modelo da sessão são estado compartilhado. O executor ativo, o comando `/model`,
atualizações de compaction/sessão e a reconciliação de sessão ao vivo leem ou escrevem
partes da mesma entrada de sessão.

Isso significa que novas tentativas de fallback precisam coordenar com a troca de modelo ao vivo:

- Apenas alterações explícitas de modelo iniciadas pelo usuário marcam uma troca ao vivo pendente. Isso
  inclui `/model`, `session_status(model=...)` e `sessions.patch`.
- Alterações de modelo dirigidas pelo sistema, como rotação de fallback, substituições de Heartbeat
  ou compaction, nunca marcam uma troca ao vivo pendente por conta própria.
- Antes de uma nova tentativa de fallback começar, o executor de resposta persiste os campos
  de substituição de fallback selecionados na entrada da sessão.
- A reconciliação de sessão ao vivo prefere substituições persistidas da sessão em vez de
  campos de modelo de runtime desatualizados.
- Se a tentativa de fallback falhar, o executor reverte apenas os campos de substituição
  que ele escreveu, e apenas se eles ainda corresponderem àquele candidato com falha.

Isso evita a corrida clássica:

1. O primário falha.
2. O candidato de fallback é escolhido em memória.
3. O armazenamento da sessão ainda indica o primário antigo.
4. A reconciliação de sessão ao vivo lê o estado desatualizado da sessão.
5. A nova tentativa volta para o modelo antigo antes de a tentativa de fallback
   começar.

A substituição persistida de fallback fecha essa janela, e a reversão restrita
mantém intactas alterações mais recentes de sessão, manuais ou de runtime.

## Observabilidade e resumos de falha

`runWithModelFallback(...)` registra detalhes por tentativa que alimentam logs e
mensagens de período de espera voltadas ao usuário:

- provedor/modelo tentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e
  motivos semelhantes de failover)
- status/código opcional
- resumo de erro legível por humanos

Quando todos os candidatos falham, o OpenClaw lança `FallbackSummaryError`. O executor externo
de resposta pode usar isso para construir uma mensagem mais específica, como “todos os modelos
estão temporariamente com limite de taxa”, e incluir o vencimento do período de espera mais próximo quando conhecido.

Esse resumo de período de espera considera o modelo:

- limites de taxa delimitados por modelo e não relacionados são ignorados para a cadeia
  de provedor/modelo tentada
- se o bloqueio restante for um limite de taxa correspondente e delimitado por modelo, o OpenClaw
  informa o último vencimento correspondente que ainda bloqueia esse modelo

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
