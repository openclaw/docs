---
read_when:
    - Diagnosticando a rotação de perfis de autenticação, períodos de espera ou o comportamento de fallback do modelo
    - Atualização das regras de failover para perfis de autenticação ou modelos
    - Entendendo como as substituições de modelo da sessão interagem com as novas tentativas de fallback
sidebarTitle: Model failover
summary: Como o OpenClaw alterna perfis de autenticação e usa modelos alternativos em caso de falha
title: Failover de modelo
x-i18n:
    generated_at: "2026-07-11T23:52:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

O OpenClaw trata falhas em duas etapas:

1. **Rotação de perfil de autenticação** dentro do provedor atual.
2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

## Fluxo de execução

<Steps>
  <Step title="Resolver o estado da sessão">
    Resolva o modelo ativo da sessão e a preferência de perfil de autenticação.
  </Step>
  <Step title="Criar a cadeia de candidatos">
    Crie a cadeia de modelos candidatos com base na seleção de modelo atual e na política de fallback para a origem dessa seleção. Padrões configurados, modelos primários de tarefas Cron e modelos de fallback selecionados automaticamente podem usar fallbacks configurados; seleções explícitas de sessão feitas pelo usuário são estritas.
  </Step>
  <Step title="Tentar o provedor atual">
    Tente o provedor atual com as regras de rotação e período de espera dos perfis de autenticação.
  </Step>
  <Step title="Avançar em erros que justificam failover">
    Se as opções desse provedor se esgotarem com um erro que justifique failover, avance para o próximo modelo candidato.
  </Step>
  <Step title="Persistir a substituição de fallback">
    Persista a substituição de fallback selecionada antes do início da nova tentativa, para que outros leitores da sessão vejam o mesmo provedor/modelo que o executor está prestes a usar. A substituição de modelo persistida é marcada como `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Reverter de forma restrita em caso de falha">
    Se o candidato de fallback falhar, reverta apenas os campos de substituição da sessão pertencentes ao fallback quando eles ainda corresponderem ao candidato que falhou.
  </Step>
  <Step title="Lançar FallbackSummaryError se as opções se esgotarem">
    Se todos os candidatos falharem, lance um `FallbackSummaryError` com detalhes de cada tentativa e o vencimento mais próximo do período de espera, quando conhecido.
  </Step>
</Steps>

Isso é intencionalmente mais restrito do que "salvar e restaurar toda a sessão". O executor de respostas persiste apenas os campos de seleção de modelo que controla para o fallback: `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Isso impede que uma nova tentativa de fallback com falha sobrescreva alterações mais recentes e não relacionadas da sessão, como uma alteração manual com `/model` ou uma atualização de rotação de sessão ocorrida durante a tentativa.

## Política de origem da seleção

A origem da seleção controla se a cadeia de fallback é permitida:

- **Padrão configurado**: `agents.defaults.model.primary` usa `agents.defaults.model.fallbacks`.
- **Modelo primário do agente**: `agents.list[].model` é estrito, a menos que o objeto de modelo desse agente inclua seus próprios `fallbacks`. Use `fallbacks: []` para tornar explícito o comportamento estrito ou uma lista não vazia para habilitar o fallback de modelo para esse agente.
- **Substituição de fallback automática**: um fallback em tempo de execução grava `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` e o modelo de origem selecionado antes de tentar novamente. Essa substituição continua percorrendo a cadeia de fallback configurada sem sondar o modelo primário a cada mensagem, mas o OpenClaw sonda a origem configurada a cada 5 minutos (não configurável) e remove a substituição assim que ela se recupera. `/new`, `/reset` e `sessions.reset` também removem substituições de origem automática. Execuções de Heartbeat sem um `heartbeat.model` explícito removem substituições automáticas diretas quando sua origem deixa de corresponder ao padrão configurado atual.
- **Substituição de sessão pelo usuário**: `/model`, o seletor de modelo, `session_status(model=...)` e `sessions.patch` gravam `modelOverrideSource: "user"`. Essa é uma seleção exata para a sessão. Se o provedor/modelo selecionado falhar antes de produzir uma resposta, o OpenClaw relata a falha em vez de responder usando um fallback configurado não relacionado.
- **Substituição de sessão legada**: entradas de sessão mais antigas podem ter `modelOverride` sem `modelOverrideSource`. O OpenClaw as trata como substituições do usuário para que uma seleção antiga explícita não seja convertida silenciosamente em comportamento de fallback.
- **Modelo da carga útil do Cron**: o `payload.model` / `--model` de uma tarefa Cron é o modelo primário da tarefa, não uma substituição de sessão feita pelo usuário. Ele usa os fallbacks configurados, a menos que a tarefa forneça `payload.fallbacks`; `payload.fallbacks: []` torna a execução do Cron estrita.

O OpenClaw memoriza sondagens recentes do modelo primário por sessão e por modelo primário, para que um modelo primário com falha não seja tentado novamente a cada interação. Ele envia um aviso visível quando uma sessão passa a usar o fallback e outro quando retorna ao modelo primário selecionado; o aviso não é repetido em cada interação que permanece no fallback.

## Cache para ignorar falhas de autenticação

Por padrão, cada nova interação mantém o comportamento existente de novas tentativas de fallback: o OpenClaw tenta novamente cada candidato de fallback configurado, incluindo candidatos não primários que tenham falhado recentemente com `auth` ou `auth_permanent`.

Habilite a supressão de falhas de autenticação repetidas com:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Quando habilitado, o OpenClaw registra na memória um marcador de omissão, com escopo de sessão, para um candidato de fallback não primário após uma falha da classe de autenticação, identificado pelo ID da sessão, provedor e modelo. Candidatos primários nunca são ignorados, portanto uma seleção explícita de modelo pelo usuário ainda exibe o erro real de autenticação. O cache é local ao processo e é limpo quando o Gateway é reiniciado.

O valor é um TTL em milissegundos. `0` ou a ausência de valor desabilita o cache. Valores positivos são limitados ao intervalo entre 1 segundo e 10 minutos.

## Avisos de fallback visíveis ao usuário

Quando uma sessão passa a usar um fallback selecionado automaticamente, o OpenClaw envia um aviso de status na mesma superfície de resposta:

```text
↪️ Fallback de modelo: <fallback> (selecionado <primary>; <reason>)
```

Quando uma sondagem posterior é bem-sucedida e a sessão retorna ao modelo primário selecionado, o OpenClaw envia:

```text
↪️ Fallback de modelo removido: <primary> (anteriormente <fallback>)
```

Esses avisos são mensagens operacionais, não conteúdo do assistente. Eles são entregues uma vez por alteração de estado, inclusive, quando viável, em interações que produzem apenas efeitos colaterais, mas não são repetidos nas interações que permanecem no fallback. A entrega ignora a supressão normal de respostas à origem, não consome o primeiro espaço de resposta do assistente em canais com conversas encadeadas e é excluída da conversão de texto em fala e da extração de compromissos.

## Armazenamento de autenticação (chaves + OAuth)

O OpenClaw usa **perfis de autenticação** tanto para chaves de API quanto para tokens OAuth.

- Segredos e o estado de roteamento de autenticação em tempo de execução ficam em `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- As configurações `auth.profiles` / `auth.order` contêm **apenas metadados + roteamento** (sem segredos).
- Arquivo OAuth legado somente para importação: `~/.openclaw/credentials/oauth.json` (importado para o armazenamento de autenticação por agente no primeiro uso).
- Os arquivos legados `auth-profiles.json`, `auth-state.json` e `auth.json` por agente são importados por `openclaw doctor --fix`.

Mais detalhes: [OAuth](/pt-BR/concepts/oauth)

Tipos de credencial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para alguns provedores)
- `type: "token"` → token estático no estilo bearer, opcionalmente com expiração; o OpenClaw não o renova (usado para `aws-sdk` e outros modos de autenticação por cadeia de credenciais)

## IDs de perfil

Logins OAuth criam perfis distintos para permitir a coexistência de várias contas.

- Padrão: `provider:default` quando nenhum e-mail está disponível.
- OAuth com e-mail: `provider:<email>` (por exemplo, `google-antigravity:user@gmail.com`).

Os perfis ficam no armazenamento de perfis de autenticação do `openclaw-agent.sqlite` por agente.

## Ordem de rotação

Quando um provedor tem vários perfis, o OpenClaw escolhe uma ordem da seguinte forma:

<Steps>
  <Step title="Configuração explícita">
    `auth.order[provider]` (se definida).
  </Step>
  <Step title="Perfis configurados">
    `auth.profiles` filtrados por provedor.
  </Step>
  <Step title="Perfis armazenados">
    Entradas de perfil de autenticação no SQLite por agente para o provedor.
  </Step>
</Steps>

Se nenhuma ordem explícita estiver configurada, o OpenClaw usa uma ordem round-robin:

- **Chave primária:** tipo de perfil (**OAuth, depois token estático e, por fim, chave de API**).
- **Chave secundária:** `usageStats.lastUsed` (mais antigo primeiro, dentro de cada tipo).
- **Perfis em período de espera/desabilitados** são movidos para o final, ordenados pelo vencimento mais próximo.

### Afinidade da sessão (favorável ao cache)

O OpenClaw **fixa o perfil de autenticação escolhido por sessão** para manter aquecidos os caches do provedor. Ele **não** alterna a cada solicitação. O perfil fixado é reutilizado até que:

- a sessão seja redefinida (`/new` / `/reset`)
- uma Compaction seja concluída (a contagem de compactações aumenta)
- o perfil entre em período de espera ou seja desabilitado

A seleção manual por meio de `/model …@<profileId>` define uma **substituição do usuário** para essa sessão e não é alternada automaticamente até o início de uma nova sessão.

<Note>
Perfis fixados automaticamente (selecionados pelo roteador da sessão) são tratados como uma **preferência**: são tentados primeiro, mas o OpenClaw pode alternar para outro perfil em caso de limites de taxa ou tempos limite. Quando o perfil original volta a ficar disponível, novas execuções podem voltar a preferi-lo sem alterar o modelo ou o ambiente de execução selecionado. Perfis fixados pelo usuário permanecem vinculados a esse perfil; se ele falhar e houver fallbacks de modelo configurados, o OpenClaw avança para o próximo modelo em vez de trocar de perfil.
</Note>

### Assinatura do OpenAI Codex com chave de API de backup

Para modelos de agente da OpenAI, a autenticação e o ambiente de execução são separados. `openai/gpt-*` permanece no ambiente do Codex, enquanto a autenticação pode alternar entre um perfil de assinatura do Codex e uma chave de API de backup da OpenAI.

Use `auth.order.openai` para definir a ordem visível ao usuário:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Use `openai:*` tanto para perfis OAuth do ChatGPT/Codex quanto para perfis de chave de API da OpenAI. Quando a assinatura atinge um limite de uso do Codex, o OpenClaw registra o horário exato de redefinição quando fornecido pelo Codex, tenta o próximo perfil de autenticação na ordem e mantém a execução dentro do ambiente do Codex. Depois que o horário de redefinição passa, o perfil de assinatura volta a ser elegível e a próxima seleção automática pode retornar a ele.

Use um perfil fixado pelo usuário somente quando quiser forçar uma conta/chave para essa sessão. Perfis fixados pelo usuário são intencionalmente estritos e não mudam silenciosamente para outro perfil.

## Períodos de espera

Quando um perfil falha devido a erros de autenticação/limite de taxa (ou um tempo limite que pareça decorrer de limitação de taxa), o OpenClaw o coloca em período de espera e avança para o próximo perfil.

<AccordionGroup>
  <Accordion title="O que entra na categoria de limite de taxa / tempo limite">
    Essa categoria de limite de taxa é mais ampla do que apenas `429`: ela também inclui mensagens do provedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` e limites periódicos de janela de uso como `weekly limit reached` ou `monthly limit exhausted`.

    Erros de formato/solicitação inválida geralmente são terminais, pois tentar novamente a mesma carga útil falharia da mesma maneira; portanto, o OpenClaw os exibe em vez de alternar os perfis de autenticação. Fluxos conhecidos de reparo e nova tentativa podem ser habilitados explicitamente: por exemplo, falhas de validação do ID de chamada de ferramenta do Cloud Code Assist são sanitizadas e tentadas novamente uma vez por meio da política `allowFormatRetry`. Erros de motivo de interrupção compatíveis com a OpenAI, como `Unhandled stop reason: error`, `stop reason: error` e `reason: error`, são classificados como sinais de tempo limite/failover.

    Textos genéricos do servidor também podem entrar nessa categoria de tempo limite quando a origem corresponde a um padrão transitório conhecido. Por exemplo, a mensagem simples do wrapper de fluxo do ambiente de execução do modelo `An unknown error occurred` é tratada como justificativa para failover em todos os provedores, pois o ambiente compartilhado de execução de modelos a emite quando os fluxos dos provedores terminam com `stopReason: "aborted"` ou `stopReason: "error"` sem detalhes específicos. Cargas úteis JSON `api_error` com textos transitórios do servidor, como `internal server error`, `unknown error, 520`, `upstream error` ou `backend error`, também são tratadas como tempos limite que justificam failover.

    Textos genéricos de upstream específicos do OpenRouter, como a mensagem simples `Provider returned error`, são tratados como tempo limite somente quando o contexto do provedor é realmente o OpenRouter. Textos genéricos internos de fallback, como `LLM request failed with an unknown error.`, continuam sendo tratados de forma conservadora e, isoladamente, não acionam failover.

  </Accordion>
  <Accordion title="Limites de retry-after do SDK">
    Caso contrário, alguns SDKs de provedores podem aguardar por uma janela longa de `Retry-After` antes de devolver o controle ao OpenClaw. Para SDKs baseados em Stainless, como Anthropic e OpenAI, o OpenClaw limita por padrão as esperas internas do SDK de `retry-after-ms` / `retry-after` a 60 segundos e apresenta imediatamente respostas repetíveis com esperas maiores, para que esse caminho de failover possa ser executado. Ajuste ou desative o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulte [Comportamento de repetição](/pt-BR/concepts/retry).
  </Accordion>
  <Accordion title="Tempos de espera por modelo">
    Os tempos de espera por limite de taxa também podem ser específicos do modelo:

    - O OpenClaw registra `cooldownModel` para falhas de limite de taxa quando o identificador do modelo que falhou é conhecido.
    - Ainda é possível tentar outro modelo do mesmo provedor quando o tempo de espera é específico de um modelo diferente.
    - Janelas de cobrança/desativação continuam bloqueando o perfil inteiro em todos os modelos.

  </Accordion>
</AccordionGroup>

Tempos de espera regulares (não relacionados a cobrança nem a autenticação permanentemente inválida) aumentam de acordo com a contagem recente de erros do perfil:

- 1ª falha: 30 segundos
- 2ª falha: 1 minuto
- 3ª falha em diante: 5 minutos (limite)

Os contadores são redefinidos após o término da janela de falhas do perfil (`auth.cooldowns.failureWindowHours`, padrão de 24).

O estado é armazenado no estado de autenticação SQLite por agente, em `usageStats`:

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

Falhas de cobrança/crédito (por exemplo, "créditos insuficientes" / "saldo de créditos muito baixo") são tratadas como motivo para failover, mas geralmente não são transitórias. Em vez de um tempo de espera curto, o OpenClaw marca o perfil como **desativado** (com um recuo mais longo) e alterna para o próximo perfil/provedor.

<Note>
Nem toda resposta com características de cobrança é `402`, e nem todo HTTP `402` é classificado aqui. O OpenClaw mantém textos explícitos de cobrança na categoria de cobrança mesmo quando um provedor retorna `401` ou `403`, mas os correspondedores específicos de provedores permanecem restritos ao provedor ao qual pertencem (por exemplo, `403 Key limit exceeded` do OpenRouter).

Enquanto isso, erros temporários `402` relacionados à janela de uso e ao limite de gastos da organização/espaço de trabalho são classificados como `rate_limit` quando a mensagem parece permitir nova tentativa (por exemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Eles permanecem no caminho de tempo de espera curto/failover, em vez do caminho longo de desativação por cobrança.
</Note>

Falhas permanentes de autenticação com alto grau de confiança (chaves revogadas/desativadas, espaços de trabalho desativados) entram em uma categoria de desativação semelhante, mas se recuperam muito mais cedo do que falhas de cobrança, pois alguns provedores apresentam temporariamente cargas semelhantes a erros de autenticação durante incidentes.

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

Padrões (`auth.cooldowns.*`):

| Chave                         | Padrão  | Finalidade                                                                           |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `billingBackoffHours`         | 5       | Recuo básico por cobrança, dobra a cada falha de cobrança                            |
| `billingMaxHours`             | 24      | Limite do recuo por cobrança                                                        |
| `authPermanentBackoffMinutes` | 10      | Recuo básico para falhas permanentes de autenticação com alto grau de confiança      |
| `authPermanentMaxMinutes`     | 60      | Limite desse recuo                                                                   |
| `failureWindowHours`          | 24      | Os contadores de falhas são redefinidos se não ocorrerem falhas durante essa janela  |
| `overloadedProfileRotations`  | 1       | Alternâncias de perfil do mesmo provedor permitidas antes do fallback de modelo em caso de sobrecarga |
| `overloadedBackoffMs`         | 0       | Atraso fixo antes de repetir uma alternância por sobrecarga                          |
| `rateLimitedProfileRotations` | 1       | Alternâncias de perfil do mesmo provedor permitidas antes do fallback de modelo por limite de taxa |

Erros de sobrecarga e limite de taxa são tratados de forma mais agressiva do que tempos de espera por cobrança: por padrão, o OpenClaw permite uma nova tentativa com outro perfil de autenticação do mesmo provedor e, em seguida, muda para o próximo fallback de modelo configurado sem aguardar.

## Fallback de modelo

Se todos os perfis de um provedor falharem, o OpenClaw avança para o próximo modelo em `agents.defaults.model.fallbacks`. Isso se aplica a falhas de autenticação, limites de taxa e tempos limite que esgotaram a alternância de perfis (outros erros não avançam o fallback). Erros de provedor que não apresentam detalhes suficientes ainda recebem rótulos precisos no estado de fallback: `empty_response` significa que o provedor não retornou nenhuma mensagem ou status utilizável, `no_error_details` significa que o provedor retornou explicitamente `Unknown error (no error details in response)`, e `unclassified` significa que o OpenClaw preservou a prévia bruta, mas nenhum classificador ainda correspondeu a ela.

Sinais de provedor ocupado, como `ModelNotReadyException`, entram na categoria de sobrecarga e seguem a mesma política de uma alternância seguida de fallback usada para limites de taxa (consulte a tabela de padrões acima).

Quando uma execução começa no primário padrão configurado, no primário de um trabalho Cron, no primário de um agente com fallbacks explícitos ou em uma substituição de fallback selecionada automaticamente, o OpenClaw pode percorrer a cadeia de fallback configurada correspondente. Primários de agentes sem fallbacks explícitos e seleções explícitas do usuário (por exemplo, `/model ollama/qwen3.5:27b`, o seletor de modelos, `sessions.patch` ou substituições pontuais de provedor/modelo pela CLI) são estritos: se esse provedor/modelo estiver inacessível ou falhar antes de produzir uma resposta, o OpenClaw relata a falha em vez de responder usando um fallback não relacionado.

### Regras da cadeia de candidatos

O OpenClaw cria a lista de candidatos a partir do `provider/model` solicitado atualmente e dos fallbacks configurados.

<AccordionGroup>
  <Accordion title="Regras">
    - O modelo solicitado é sempre o primeiro.
    - Os fallbacks configurados explicitamente são deduplicados, mas não são filtrados pela lista de modelos permitidos. Eles são tratados como uma intenção explícita do operador.
    - Se a execução atual já estiver em um fallback configurado da mesma família de provedores, o OpenClaw continuará usando toda a cadeia configurada.
    - Quando nenhuma substituição explícita de fallback é fornecida, os fallbacks configurados são tentados antes do primário configurado, mesmo que o modelo solicitado use outro provedor.
    - Quando nenhuma substituição explícita de fallback é fornecida ao executor de fallback, o primário configurado é anexado ao final, para que a cadeia possa retornar ao padrão normal depois que os candidatos anteriores se esgotarem.
    - Quando um chamador fornece `fallbacksOverride`, o executor usa exatamente o modelo solicitado e essa lista de substituição. Uma lista vazia desativa o fallback de modelo e impede que o primário configurado seja anexado como um destino oculto de nova tentativa.

  </Accordion>
</AccordionGroup>

### Quais erros avançam o fallback

<Tabs>
  <Tab title="Continua em">
    - falhas de autenticação
    - limites de taxa e esgotamento do tempo de espera
    - erros de sobrecarga/provedor ocupado
    - erros de failover semelhantes a tempo limite
    - desativações por cobrança
    - `LiveSessionModelSwitchError`, que é normalizado em um caminho de failover para que um modelo persistido obsoleto não crie um ciclo externo de novas tentativas
    - outros erros não reconhecidos quando ainda há candidatos restantes

  </Tab>
  <Tab title="Não continua em">
    - cancelamentos explícitos que não tenham características de tempo limite/failover
    - erros de estouro de contexto que devem permanecer na lógica de Compaction/nova tentativa (por exemplo, `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` ou `ollama error: context length exceeded`)
    - um erro desconhecido final quando não há candidatos restantes
    - recusas de segurança do Claude Fable 5; solicitações diretas com chave de API tratam esses casos no nível do provedor por meio do fallback do lado do servidor da Anthropic para `claude-opus-4-8` (consulte [Anthropic](/pt-BR/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Comportamento de ignorar o tempo de espera versus sondar

Quando todos os perfis de autenticação de um provedor já estão em tempo de espera, o OpenClaw não ignora automaticamente esse provedor para sempre. Ele toma uma decisão por candidato:

<AccordionGroup>
  <Accordion title="Decisões por candidato">
    - Falhas persistentes de autenticação ignoram imediatamente todo o provedor.
    - Desativações por cobrança geralmente são ignoradas, mas o candidato primário ainda pode ser sondado de forma controlada, para possibilitar a recuperação sem reinicialização.
    - O candidato primário pode ser sondado perto do término do tempo de espera, com controle de frequência por provedor.
    - Outros fallbacks do mesmo provedor podem ser tentados apesar do tempo de espera quando a falha parece transitória (`rate_limit`, `overloaded` ou desconhecida). Isso é especialmente relevante quando um limite de taxa é específico de um modelo e outro modelo pode se recuperar imediatamente.
    - As sondagens de tempos de espera transitórios são limitadas a uma por provedor em cada execução de fallback, para que um único provedor não atrase o fallback entre provedores.

  </Accordion>
</AccordionGroup>

## Substituições de sessão e troca de modelo em tempo real

As alterações de modelo da sessão são um estado compartilhado. O executor ativo, o comando `/model`, as atualizações de Compaction/sessão e a reconciliação da sessão em tempo real leem ou gravam partes da mesma entrada de sessão.

Isso significa que as novas tentativas de fallback precisam ser coordenadas com a troca de modelo em tempo real:

- Somente alterações de modelo explícitas, iniciadas pelo usuário, marcam uma troca em tempo real como pendente. Isso inclui `/model`, `session_status(model=...)` e `sessions.patch`.
- Alterações de modelo iniciadas pelo sistema, como alternância de fallback, substituições de Heartbeat ou Compaction, nunca marcam por conta própria uma troca em tempo real como pendente.
- Substituições de modelo iniciadas pelo usuário são tratadas como seleções exatas para a política de fallback; portanto, um provedor selecionado que esteja inacessível é apresentado como falha, em vez de ser ocultado por `agents.defaults.model.fallbacks`.
- Antes do início de uma nova tentativa de fallback, o executor de respostas persiste na entrada de sessão os campos de substituição do fallback selecionado.
- As substituições automáticas de fallback permanecem selecionadas nas interações seguintes, para que o OpenClaw não sonde um primário sabidamente problemático a cada mensagem. O OpenClaw sonda periodicamente a origem configurada novamente e remove a substituição automática quando ela se recupera; `/new`, `/reset` e `sessions.reset` removem imediatamente as substituições de origem automática.
- As respostas ao usuário anunciam as transições de fallback e a recuperação com remoção do fallback uma vez por alteração de estado. Interações que permanecem no fallback não repetem o aviso.
- `/status` mostra o modelo selecionado e, quando o estado de fallback é diferente, o modelo de fallback ativo e o motivo.
- A reconciliação da sessão em tempo real prioriza substituições persistidas da sessão em vez de campos de modelo obsoletos do ambiente de execução.
- Se um erro de troca em tempo real apontar para um candidato posterior na cadeia de fallback ativa, o OpenClaw avança diretamente para esse modelo selecionado, em vez de percorrer primeiro candidatos não relacionados.
- Se a tentativa de fallback falhar, o executor reverte apenas os campos de substituição que gravou, e somente se eles ainda corresponderem ao candidato que falhou.

Isso evita a condição de corrida clássica:

<Steps>
  <Step title="O primário falha">
    O modelo primário selecionado falha.
  </Step>
  <Step title="Fallback escolhido na memória">
    O candidato de fallback é escolhido na memória.
  </Step>
  <Step title="O armazenamento da sessão ainda indica o primário antigo">
    O armazenamento da sessão ainda reflete o primário antigo.
  </Step>
  <Step title="A reconciliação em tempo real lê o estado obsoleto">
    A reconciliação da sessão em tempo real lê o estado obsoleto da sessão.
  </Step>
  <Step title="A nova tentativa retorna ao modelo anterior">
    A nova tentativa é redirecionada para o modelo antigo antes do início da tentativa de fallback.
  </Step>
</Steps>

A substituição de fallback persistida fecha essa janela, e a reversão restrita mantém intactas as alterações manuais ou de ambiente de execução mais recentes na sessão.

## Observabilidade e resumos de falhas

`runWithModelFallback(...)` registra detalhes de cada tentativa que alimentam os logs e as mensagens de tempo de espera apresentadas ao usuário:

- provedor/modelo tentado
- motivo (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` e motivos semelhantes de fallback)
- status/código opcional
- resumo do erro legível por humanos

Os logs estruturados de `model_fallback_decision` também incluem campos simples `fallbackStep*` quando um candidato falha, é ignorado ou um fallback posterior é bem-sucedido. Esses campos tornam explícita a transição tentada (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), para que os exportadores de logs e diagnósticos possam reconstruir a falha principal mesmo quando o fallback final também falhar.

Quando todos os candidatos falham, o OpenClaw lança `FallbackSummaryError`. O executor externo de respostas pode usar esse erro para criar uma mensagem mais específica, como "todos os modelos estão temporariamente limitados por taxa", e incluir o término mais próximo do período de espera, quando conhecido.

Esse resumo do período de espera considera o modelo:

- limites de taxa não relacionados e específicos de outros modelos são ignorados na cadeia de provedor/modelo tentada
- se o bloqueio restante for um limite de taxa específico do modelo correspondente, o OpenClaw informa o último término correspondente que ainda bloqueia esse modelo

## Configuração relacionada

Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- roteamento de `agents.defaults.imageModel`

Consulte [Modelos](/pt-BR/concepts/models) para uma visão geral mais ampla da seleção de modelos e do fallback.
