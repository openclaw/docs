---
read_when:
    - Diagnosticando rotação de perfis de autenticação, cooldowns ou comportamento de fallback de modelo
    - Atualizando regras de failover para perfis de autenticação ou modelos
    - Entendendo como substituições de modelo de sessão interagem com tentativas de fallback
summary: Como o OpenClaw alterna perfis de autenticação e usa fallback entre modelos
title: Failover de modelo
x-i18n:
    generated_at: "2026-04-24T05:48:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8921c9edd4699d8c623229cd3c82a92768d720fa9711862c270d6edb665841af
    source_path: concepts/model-failover.md
    workflow: 15
---

O OpenClaw lida com falhas em duas etapas:

1. **Rotação de perfis de autenticação** dentro do provedor atual.
2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

Este documento explica as regras de runtime e os dados que as sustentam.

## Fluxo de runtime

Para uma execução normal de texto, o OpenClaw avalia os candidatos nesta ordem:

1. O modelo de sessão atualmente selecionado.
2. `agents.defaults.model.fallbacks` configurados, em ordem.
3. O modelo primário configurado ao final, quando a execução começou a partir de uma substituição.

Dentro de cada candidato, o OpenClaw tenta o failover de perfil de autenticação antes de avançar para
o próximo candidato de modelo.

Sequência em alto nível:

1. Resolve o modelo de sessão ativo e a preferência de perfil de autenticação.
2. Constrói a cadeia de candidatos de modelo.
3. Tenta o provedor atual com regras de rotação/cooldown de perfil de autenticação.
4. Se esse provedor se esgotar com um erro digno de failover, passa para o próximo
   candidato de modelo.
5. Persiste a substituição de fallback selecionada antes de a nova tentativa começar, para que outros
   leitores da sessão vejam o mesmo provedor/modelo que o executor está prestes a usar.
6. Se o candidato de fallback falhar, reverte apenas os campos de substituição da sessão pertencentes ao fallback
   quando eles ainda corresponderem àquele candidato com falha.
7. Se todos os candidatos falharem, lança um `FallbackSummaryError` com detalhes por tentativa
   e o vencimento de cooldown mais próximo, quando conhecido.

Isso é intencionalmente mais restrito do que "salvar e restaurar a sessão inteira". O
executor de resposta persiste apenas os campos de seleção de modelo que ele controla para fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Isso impede que uma nova tentativa de fallback com falha sobrescreva mutações mais recentes e não relacionadas da sessão,
como alterações manuais via `/model` ou atualizações de rotação da sessão que
aconteceram enquanto a tentativa estava em execução.

## Armazenamento de autenticação (chaves + OAuth)

O OpenClaw usa **perfis de autenticação** tanto para chaves de API quanto para tokens OAuth.

- Os segredos ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legado: `~/.openclaw/agent/auth-profiles.json`).
- O estado de roteamento de autenticação em runtime fica em `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- A configuração `auth.profiles` / `auth.order` é **apenas metadados + roteamento** (sem segredos).
- Arquivo OAuth legado somente para importação: `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso).

Mais detalhes: [/concepts/oauth](/pt-BR/concepts/oauth)

Tipos de credencial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)

## IDs de perfil

Logins OAuth criam perfis distintos para que várias contas possam coexistir.

- Padrão: `provider:default` quando nenhum e-mail está disponível.
- OAuth com e-mail: `provider:<email>` (por exemplo `google-antigravity:user@gmail.com`).

Os perfis ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` em `profiles`.

## Ordem de rotação

Quando um provedor tem vários perfis, o OpenClaw escolhe uma ordem assim:

1. **Configuração explícita**: `auth.order[provider]` (se definido).
2. **Perfis configurados**: `auth.profiles` filtrados por provedor.
3. **Perfis armazenados**: entradas em `auth-profiles.json` para o provedor.

Se nenhuma ordem explícita for configurada, o OpenClaw usa uma ordem round-robin:

- **Chave primária:** tipo de perfil (**OAuth antes de chaves de API**).
- **Chave secundária:** `usageStats.lastUsed` (mais antigo primeiro, dentro de cada tipo).
- **Perfis em cooldown/desativados** são movidos para o final, ordenados pelo vencimento mais próximo.

### Persistência de sessão (favorável a cache)

O OpenClaw **fixa o perfil de autenticação escolhido por sessão** para manter os caches do provedor aquecidos.
Ele **não** faz rotação a cada solicitação. O perfil fixado é reutilizado até que:

- a sessão seja redefinida (`/new` / `/reset`)
- uma Compaction seja concluída (a contagem de Compaction aumenta)
- o perfil entre em cooldown/desativação

A seleção manual via `/model …@<profileId>` define uma **substituição do usuário** para essa sessão
e não entra em rotação automática até que uma nova sessão comece.

Perfis fixados automaticamente (selecionados pelo roteador da sessão) são tratados como uma **preferência**:
eles são tentados primeiro, mas o OpenClaw pode girar para outro perfil em caso de limites de taxa/timeouts.
Perfis fixados pelo usuário permanecem presos àquele perfil; se ele falhar e houver fallbacks de modelo
configurados, o OpenClaw passa para o próximo modelo em vez de trocar de perfil.

### Por que o OAuth pode "parecer perdido"

Se você tiver tanto um perfil OAuth quanto um perfil de chave de API para o mesmo provedor, o round-robin pode alternar entre eles entre mensagens, a menos que estejam fixados. Para forçar um único perfil:

- Fixe com `auth.order[provider] = ["provider:profileId"]`, ou
- Use uma substituição por sessão via `/model …` com uma substituição de perfil (quando compatível com sua superfície de UI/chat).

## Cooldowns

Quando um perfil falha devido a erros de autenticação/limite de taxa (ou a um timeout que se parece
com limite de taxa), o OpenClaw o marca em cooldown e passa para o próximo perfil.
Esse grupo de limite de taxa é mais amplo que apenas `429`: ele também inclui mensagens do provedor
como `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` e limites periódicos de janela de uso, como
`weekly/monthly limit reached`.
Erros de formato/solicitação inválida (por exemplo falhas de validação de ID de chamada de ferramenta do Cloud Code Assist) são tratados como dignos de failover e usam os mesmos cooldowns.
Erros de motivo de parada compatíveis com OpenAI, como `Unhandled stop reason: error`,
`stop reason: error` e `reason: error`, são classificados como sinais de timeout/failover.
Texto genérico de servidor com escopo de provedor também pode cair nesse grupo de timeout quando
a origem corresponde a um padrão transitório conhecido. Por exemplo, em Anthropic, o texto simples
`An unknown error occurred` e cargas JSON `api_error` com texto transitório de servidor
como `internal server error`, `unknown error, 520`, `upstream error`
ou `backend error` são tratados como dignos de failover por timeout. Texto genérico específico do OpenRouter
de upstream, como `Provider returned error`, também é tratado como
timeout apenas quando o contexto do provedor é realmente OpenRouter. Texto genérico interno de
fallback, como `LLM request failed with an unknown error.`, permanece
conservador e não aciona failover por si só.

Alguns SDKs de provedor podem, de outra forma, dormir por uma longa janela `Retry-After` antes de
devolver o controle ao OpenClaw. Para SDKs baseados em Stainless, como Anthropic e
OpenAI, o OpenClaw limita por padrão as esperas internas do SDK em `retry-after-ms` / `retry-after` a 60
segundos e expõe imediatamente respostas tentáveis mais longas para que esse caminho de
failover possa ser executado. Ajuste ou desative esse limite com
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [/concepts/retry](/pt-BR/concepts/retry).

Cooldowns de limite de taxa também podem ter escopo por modelo:

- O OpenClaw registra `cooldownModel` para falhas de limite de taxa quando o
  ID do modelo com falha é conhecido.
- Um modelo irmão no mesmo provedor ainda pode ser tentado quando o cooldown está
  restrito a um modelo diferente.
- Janelas de cobrança/desativação ainda bloqueiam o perfil inteiro entre modelos.

Cooldowns usam backoff exponencial:

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

Falhas de cobrança/crédito (por exemplo “insufficient credits” / “credit balance too low”) são tratadas como dignas de failover, mas normalmente não são transitórias. Em vez de um cooldown curto, o OpenClaw marca o perfil como **desativado** (com um backoff mais longo) e gira para o próximo perfil/provedor.

Nem toda resposta com aparência de cobrança é `402`, e nem todo HTTP `402` cai
aqui. O OpenClaw mantém texto explícito de cobrança na trilha de cobrança mesmo quando um
provedor retorna `401` ou `403`, mas matchers específicos de provedor continuam
restritos ao provedor a que pertencem (por exemplo OpenRouter `403 Key limit
exceeded`). Enquanto isso, erros temporários `402` de janela de uso e
limite de gasto de organização/workspace são classificados como `rate_limit` quando
a mensagem parece tentável (por exemplo `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` ou `organization spending limit exceeded`).
Eles permanecem no caminho curto de cooldown/failover em vez do caminho longo de
desativação por cobrança.

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

- O backoff de cobrança começa em **5 horas**, dobra a cada falha de cobrança e tem limite em **24 horas**.
- Os contadores de backoff são redefinidos se o perfil não falhar por **24 horas** (configurável).
- Novas tentativas por sobrecarga permitem **1 rotação de perfil no mesmo provedor** antes do fallback de modelo.
- Novas tentativas por sobrecarga usam **0 ms de backoff** por padrão.

## Fallback de modelo

Se todos os perfis de um provedor falharem, o OpenClaw passa para o próximo modelo em
`agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticação, limites de taxa e
timeouts que esgotaram a rotação de perfil (outros erros não avançam o fallback).

Erros de sobrecarga e limite de taxa são tratados de forma mais agressiva do que cooldowns
de cobrança. Por padrão, o OpenClaw permite uma nova tentativa de perfil de autenticação no mesmo provedor,
depois troca para o próximo fallback de modelo configurado sem esperar.
Sinais de provedor ocupado, como `ModelNotReadyException`, caem nesse grupo de sobrecarga. Ajuste isso com `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` e
`auth.cooldowns.rateLimitedProfileRotations`.

Quando uma execução começa com uma substituição de modelo (hooks ou CLI), os fallbacks ainda terminam em
`agents.defaults.model.primary` depois de tentar quaisquer fallbacks configurados.

### Regras da cadeia de candidatos

O OpenClaw constrói a lista de candidatos a partir do `provider/model`
atualmente solicitado mais os fallbacks configurados.

Regras:

- O modelo solicitado é sempre o primeiro.
- Fallbacks configurados explicitamente são removidos de duplicação, mas não são filtrados pela allowlist
  de modelos. Eles são tratados como intenção explícita do operador.
- Se a execução atual já estiver em um fallback configurado da mesma família de provedor,
  o OpenClaw continua usando a cadeia completa configurada.
- Se a execução atual estiver em um provedor diferente da configuração e esse modelo
  atual ainda não fizer parte da cadeia de fallback configurada, o OpenClaw não
  acrescenta fallbacks configurados não relacionados de outro provedor.
- Quando a execução começou a partir de uma substituição, o primário configurado é acrescentado ao
  final para que a cadeia possa voltar ao padrão normal depois que os
  candidatos anteriores forem esgotados.

### Quais erros avançam o fallback

O fallback de modelo continua em:

- falhas de autenticação
- limites de taxa e esgotamento de cooldown
- erros de sobrecarga/provedor ocupado
- erros de failover com aparência de timeout
- desativações por cobrança
- `LiveSessionModelSwitchError`, que é normalizado em um caminho de failover para que um
  modelo persistido desatualizado não crie um loop externo de nova tentativa
- outros erros não reconhecidos quando ainda restam candidatos

O fallback de modelo não continua em:

- abortos explícitos que não tenham aparência de timeout/failover
- erros de estouro de contexto que devem permanecer dentro da lógica de Compaction/retry
  (por exemplo `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` ou `ollama error: context
length exceeded`)
- um erro final desconhecido quando não restam candidatos

### Comportamento de pular cooldown vs probe

Quando todos os perfis de autenticação de um provedor já estão em cooldown, o OpenClaw
não pula automaticamente esse provedor para sempre. Ele toma uma decisão por candidato:

- Falhas persistentes de autenticação pulam o provedor inteiro imediatamente.
- Desativações por cobrança geralmente pulam, mas o candidato primário ainda pode ser testado
  sob limitação para que a recuperação seja possível sem reiniciar.
- O candidato primário pode ser testado perto do vencimento do cooldown, com uma limitação
  por provedor.
- Modelos irmãos de fallback no mesmo provedor podem ser tentados apesar do cooldown quando a
  falha parece transitória (`rate_limit`, `overloaded` ou desconhecida). Isso é
  especialmente relevante quando um limite de taxa tem escopo por modelo e um modelo irmão ainda pode
  se recuperar imediatamente.
- Probes transitórias de cooldown são limitadas a uma por provedor por execução de fallback, para que
  um único provedor não atrase o fallback entre provedores.

## Substituições de sessão e troca de modelo ao vivo

As mudanças de modelo da sessão são estado compartilhado. O executor ativo, o comando `/model`,
atualizações de Compaction/sessão e a reconciliação de sessão ao vivo leem ou gravam
partes da mesma entrada de sessão.

Isso significa que as novas tentativas de fallback precisam se coordenar com a troca de modelo ao vivo:

- Apenas mudanças explícitas de modelo conduzidas pelo usuário marcam uma troca ao vivo pendente. Isso
  inclui `/model`, `session_status(model=...)` e `sessions.patch`.
- Mudanças de modelo conduzidas pelo sistema, como rotação de fallback, substituições de Heartbeat
  ou Compaction, nunca marcam uma troca ao vivo pendente por conta própria.
- Antes de uma nova tentativa de fallback começar, o executor de resposta persiste os campos
  de substituição de fallback selecionados na entrada da sessão.
- A reconciliação de sessão ao vivo prefere substituições persistidas na sessão em vez de
  campos desatualizados de modelo em runtime.
- Se a tentativa de fallback falhar, o executor reverte apenas os campos de substituição
  que ele gravou, e apenas se eles ainda corresponderem àquele candidato com falha.

Isso evita a condição de corrida clássica:

1. O primário falha.
2. Um candidato de fallback é escolhido em memória.
3. O armazenamento da sessão ainda indica o primário antigo.
4. A reconciliação de sessão ao vivo lê o estado desatualizado da sessão.
5. A nova tentativa volta ao modelo antigo antes de a tentativa de fallback
   começar.

A substituição de fallback persistida fecha essa janela, e o rollback estreito
mantém intactas mudanças mais recentes de sessão manuais ou de runtime.

## Observabilidade e resumos de falha

`runWithModelFallback(...)` registra detalhes por tentativa que alimentam logs e
mensagens de cooldown voltadas ao usuário:

- provedor/modelo tentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e
  motivos semelhantes de failover)
- status/código opcional
- resumo de erro legível por humanos

Quando todos os candidatos falham, o OpenClaw lança `FallbackSummaryError`. O
executor externo de resposta pode usar isso para montar uma mensagem mais específica, como "todos os modelos
estão temporariamente sob limite de taxa", e incluir o vencimento de cooldown mais próximo quando
ele for conhecido.

Esse resumo de cooldown considera o modelo:

- limites de taxa com escopo de modelo não relacionados são ignorados para a cadeia
  de provedor/modelo tentada
- se o bloqueio restante for um limite de taxa correspondente com escopo de modelo, o OpenClaw
  informa o último vencimento correspondente que ainda bloqueia aquele modelo

## Configuração relacionada

Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- roteamento de `agents.defaults.imageModel`

Consulte [Models](/pt-BR/concepts/models) para uma visão geral mais ampla de seleção de modelo e fallback.
