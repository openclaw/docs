---
read_when:
    - Você quer verificar as configurações do OpenClaw em relação a um policy.jsonc criado.
    - Você quer achados de política no lint do doctor
    - Você precisa de um hash de atestado de política para evidências de auditoria
summary: Referência da CLI para verificações de conformidade de `openclaw policy`
title: Política
x-i18n:
    generated_at: "2026-06-27T17:20:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` é fornecido pelo Plugin Policy incluído. A política é uma
camada de conformidade empresarial sobre as configurações existentes do OpenClaw.
Ela não adiciona um segundo sistema de configuração. `policy.jsonc` define
requisitos declarados, o OpenClaw observa o workspace ativo como evidência, e as
verificações de integridade da política relatam desvios por meio de `doctor --lint`.
O sinal final de conformidade é uma execução limpa de `doctor --lint`; a política
contribui com achados para essa superfície de lint compartilhada em vez de criar
um gate de integridade separado.

Atualmente, a política gerencia canais configurados, servidores MCP, provedores
de modelo, postura de SSRF de rede, postura de acesso de ingresso/canal, postura
de exposição do Gateway, postura do workspace de agentes, postura de tratamento
de dados, postura de provedor de segredo/perfil de autenticação da configuração
do OpenClaw e declarações de ferramentas governadas. Por exemplo, a TI ou um
operador de workspace pode registrar que Telegram não é um provedor de canal
aprovado, restringir servidores MCP e refs de modelo a entradas aprovadas,
exigir que o acesso de fetch/navegador à rede privada permaneça desativado,
exigir que o isolamento de sessão de mensagem direta e a postura de ingresso de
canal permaneçam dentro dos limites revisados, exigir que bind/autenticação/exposição
HTTP do Gateway permaneçam dentro dos limites revisados, exigir que o acesso ao
workspace do agente e negações de ferramentas permaneçam em uma postura revisada,
exigir que SecretRefs da configuração do OpenClaw usem provedores gerenciados,
exigir que perfis de autenticação da configuração carreguem metadados de
provedor/modo, exigir que ferramentas governadas carreguem metadados de risco e
sensibilidade, exigir redação de logs sensíveis, negar captura de conteúdo de
telemetria, exigir manutenção de retenção de sessão, negar indexação em memória
de transcrições de sessão e então usar `doctor --lint` como o gate de
conformidade compartilhado.

Use a política quando um workspace precisar de uma declaração durável, como
"estes canais não devem ser habilitados" ou "ferramentas governadas devem
declarar metadados de aprovação", e de uma forma repetível de provar que o
OpenClaw ainda está em conformidade com essa declaração. Use apenas a
configuração regular e a documentação do workspace quando você só precisar de
comportamento local e não precisar de achados de política ou saída de atestação.

## Início rápido

Habilite o Plugin Policy incluído antes do primeiro uso:

```bash
openclaw plugins enable policy
```

Quando a política está habilitada, o doctor pode carregar verificações de
integridade de política sem ativar plugins arbitrários. O Plugin permanece
habilitado se `policy.jsonc` estiver ausente, para que o doctor possa relatar o
artefato ausente.

A política é declarada, não gerada a partir das configurações atuais do usuário.
Uma política mínima para canais, servidores MCP, provedores de modelo, postura
de rede, acesso de ingresso/canal, exposição do Gateway, postura do workspace de
agentes, postura de runtime de sandbox configurado, postura de tratamento de
dados do OpenClaw, postura de provedor de segredo/perfil de autenticação da
configuração, postura de arquivo de aprovação de exec e metadados de ferramenta
se parece com isto:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

As regras são a autoridade. Um bloco de categoria é apenas um namespace; as
verificações são executadas quando uma regra concreta está presente. O OpenClaw
lê as configurações atuais de `channels.*`, `mcp.servers.*`,
`models.providers.*`, refs de modelo de agentes selecionados, configurações de
SSRF de rede, escopo de sessão de mensagem direta, política de DM de canal,
política de grupo de canal, gates de menção de canal/grupo, postura de
bind/autenticação/Control UI/Tailscale/remoto/HTTP do Gateway, postura de acesso
ao workspace de sandbox de agente da configuração do OpenClaw e negação de
ferramentas, postura de configuração de tratamento de dados, proveniência de
provedor de segredo e SecretRef da configuração, metadados de perfil de
autenticação da configuração, postura de ferramenta global/por agente
configurada e declarações de `TOOLS.md` como evidência, e então relata o estado
observado que não está em conformidade. Se uma política negar binds de Gateway
que não sejam local loopback, omita `gateway.bind` apenas quando você estiver
disposto a revisar o padrão de runtime; defina `gateway.bind=loopback` para
conformidade estrita da configuração. Para postura de agente somente leitura,
configure o modo sandbox nos padrões ou agente aplicáveis e defina
`workspaceAccess` como `none` ou `ro`; modo sandbox omitido ou `off` não
satisfaz uma política somente leitura/sem escrita. `agents.workspace.denyTools`
oferece suporte a `exec`, `process`, `write`, `edit` e `apply_patch`; a
configuração do OpenClaw `group:fs` cobre ferramentas de mutação de arquivos e
`group:runtime` cobre ferramentas de shell/processo. A política de postura de
ferramentas observa `tools.profile`, `tools.allow`, `tools.alsoAllow`,
`tools.deny`, `tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`,
`tools.exec.host`, `tools.elevated.enabled` e as mesmas substituições por agente
em `agents.list[].tools.*`. A política de aprovação de exec lê o artefato de
produto `exec-approvals.json` nomeado somente quando uma regra `execApprovals`
está presente; a evidência registra padrões, postura por agente e padrões de
allowlist sem tokens de socket ou texto do último comando usado. A política não
impõe chamadas de ferramentas em runtime. A evidência de segredo registra a
postura de provedor/fonte e metadados de SecretRef, nunca valores brutos de
segredo. A política não lê nem atesta armazenamentos de credenciais por agente,
como `auth-profiles.json`; esses armazenamentos continuam pertencendo aos fluxos
existentes de autenticação e credenciais. A evidência de tratamento de dados é
apenas postura em nível de configuração: ela verifica o modo de redação
configurado, alternâncias de captura de conteúdo de telemetria, modo de
manutenção de sessão e configurações de indexação em memória de transcrições de
sessão. Ela não inspeciona logs brutos, exportações de telemetria, conteúdos de
transcrições, arquivos de memória nem prova que não existem dados pessoais ou
segredos.

### Referência de regras de política

Cada campo de política abaixo é opcional. Uma verificação é executada somente
quando a regra correspondente está presente em `policy.jsonc`. O estado
observado é a configuração existente do OpenClaw ou metadados do workspace; a
política relata desvios, mas não reescreve o comportamento de runtime, a menos
que um caminho de reparo esteja explicitamente disponível e habilitado.
Arquivos de política são estritos: seções ou chaves de regra sem suporte são
relatadas como `policy/policy-jsonc-invalid` em vez de serem ignoradas.

Sobreposições de política mantêm regras amplas de nível superior como globais e
então permitem que blocos de escopo nomeados adicionem seções normais de
política mais estritas para seletores explícitos. Um nome de escopo é apenas um
agrupamento descritivo; a correspondência usa os valores de seletor dentro do
escopo. A sobreposição é aditiva: declarações globais continuam sendo executadas,
e uma declaração com escopo pode emitir seu próprio achado contra a mesma
configuração observada.

#### Sobreposições com escopo

Use `scopes.<scopeName>` quando um conjunto de agentes ou canais precisar de
política mais estrita do que a linha de base de nível superior. Seções com
escopo de agente usam `agentIds`, que oferece suporte a `tools.*`,
`agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*` e `execApprovals.*`.
Ingresso com escopo de canal usa `channelIds`, que oferece suporte a
`ingress.channels.*`. Seções sem suporte são rejeitadas em vez de serem
ignoradas. Se uma entrada `agentIds` não estiver presente em `agents.list[]`, o
OpenClaw avalia a regra com escopo contra a postura global/padrão herdada para
esse id de agente de runtime.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

O mesmo agente pode aparecer em vários escopos quando cada escopo governa campos
diferentes, como mostrado acima. Um campo com escopo repetido para o mesmo
agente deve ser igualmente ou mais restritivo de acordo com os metadados de
política; declarações duplicadas mais fracas são rejeitadas. Metadados de
rigor tratam allowlists como subconjuntos, denylists como superconjuntos e
booleanos obrigatórios como requisitos fixos.

A política de postura de contêiner é avaliada somente contra evidências que o
OpenClaw consegue observar para o agente correspondente. Se uma regra
`sandbox.containers.*` habilitada se aplicar a um agente cujo backend de sandbox
não consegue expor esse campo, a política relata
`policy/sandbox-container-posture-unobservable` em vez de tratar a declaração
como aprovada. Use escopos `agentIds` separados para grupos de agentes que usam
backends de sandbox diferentes e deixe regras de contêiner sem suporte
indefinidas ou falsas para os grupos em que esses campos não podem ser
observados.

`ingress.session.requireDmScope` de nível superior permanece global porque
`session.dmScope` não é evidência atribuível a canal.

| Seletor     | Seções compatíveis                                                                 | Use quando                                          |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory` e `execApprovals` | Um ou mais agentes de runtime precisam de regras mais rígidas.   |
| `channelIds` | `ingress.channels`                                                                 | Um ou mais canais precisam de regras de ingresso mais rígidas. |

Todo escopo presente em `policy.jsonc` deve ser válido e aplicável.

#### Canais

| Campo da política                         | Estado observado                          | Use quando                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | Provedor de `channels.*` e estado habilitado | Negar canais configurados de um provedor como `telegram`. |
| `channels.denyRules[].reason`        | Mensagem da constatação e contexto da dica de reparo | Explicar por que o provedor é negado.                          |

#### Servidores MCP

| Campo da política        | Estado observado      | Use quando                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | IDs de `mcp.servers.*` | Exigir que todo servidor MCP configurado esteja em uma lista de permissões. |
| `mcp.servers.deny`  | IDs de `mcp.servers.*` | Negar IDs específicos de servidores MCP configurados.                   |

#### Provedores de modelo

| Campo da política             | Estado observado                                   | Use quando                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | IDs de `models.providers.*` e refs de modelo selecionadas | Exigir que provedores configurados e refs de modelo selecionadas usem provedores aprovados. |
| `models.providers.deny`  | IDs de `models.providers.*` e refs de modelo selecionadas | Negar provedores configurados e refs de modelo selecionadas por ID de provedor.               |

#### Rede

| Campo da política                   | Estado observado                      | Use quando                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | Escapes de SSRF para rede privada | Definir como `false` para exigir que o acesso à rede privada permaneça desabilitado. |

#### Ingresso e acesso a canais

| Campo da política                              | Estado observado                                                 | Use quando                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | Exigir um escopo de isolamento de mensagem direta revisado.                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` e campos legados de política de DM de canal      | Permitir apenas políticas de canal de mensagem direta revisadas.               |
| `ingress.channels.denyOpenGroups`         | Política de ingresso de canal, conta e grupo                     | Negar ingresso de grupo aberto para canais e contas configurados.      |
| `ingress.channels.requireMentionInGroups` | Configuração de gates de menção de canal, conta, grupo, guilda e aninhados | Exigir gates de menção quando o ingresso de grupo estiver aberto ou condicionado a menção. |

#### Gateway

| Campo da política                            | Estado observado                                 | Use quando                                                     |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | Definir como `false` para exigir vinculação do Gateway a loopback.          |
| `gateway.exposure.allowTailscaleFunnel` | Postura de serve/funnel do Gateway no Tailscale         | Definir como `false` para negar exposição via Tailscale Funnel.            |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Definir como `true` para rejeitar autenticação desabilitada do Gateway.               |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | Definir como `true` para exigir configuração explícita de limite de taxa de autenticação.    |
| `gateway.controlUi.allowInsecure`       | Alternâncias inseguras de autenticação/dispositivo/origem da Control UI | Definir como `false` para negar alternâncias inseguras de exposição da Control UI. |
| `gateway.remote.allow`                  | Modo/configuração de Gateway remoto                     | Definir como `false` para negar o modo Gateway remoto.                  |
| `gateway.http.denyEndpoints`            | Endpoints da API HTTP do Gateway                     | Negar IDs de endpoint como `chatCompletions` ou `responses`.  |
| `gateway.http.requireUrlAllowlists`     | Entradas de busca de URL do Gateway HTTP                  | Definir como `true` para exigir listas de permissões de URL em entradas de busca de URL. |

#### Espaço de trabalho do agente

| Campo da política                     | Estado observado                                                                        | Use quando                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` e `agents.list[].sandbox.workspaceAccess` | Permitir apenas valores de acesso ao espaço de trabalho do sandbox como `none` ou `ro`.                                                  |
| `agents.workspace.denyTools`     | Configuração global e por agente de negação de ferramentas                                                 | Exigir que ferramentas de mutação de espaço de trabalho/runtime como `exec`, `process`, `write`, `edit` ou `apply_patch` sejam negadas. |

#### Postura do sandbox

| Campo da política                                          | Estado observado                                          | Use quando                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` e modo por agente       | Permitir apenas modos de sandbox revisados como `all` ou `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` e backend por agente | Permitir apenas backends de sandbox revisados como `docker`.         |
| `sandbox.containers.denyHostNetwork`                  | Modo de rede de sandbox/navegador baseado em contêiner           | Negar modo de rede do host.                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | Modo de rede de sandbox/navegador baseado em contêiner           | Negar entrada no namespace de rede de outro contêiner.              |
| `sandbox.containers.requireReadOnlyMounts`            | Modo de montagem de sandbox/navegador baseado em contêiner             | Exigir que as montagens sejam somente leitura.                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Alvos de montagem de sandbox/navegador baseado em contêiner          | Negar montagens de socket do runtime de contêiner.                          |
| `sandbox.containers.denyUnconfinedProfiles`           | Postura de perfil de segurança de contêiner                      | Negar perfis de segurança de contêiner sem confinamento.                   |
| `sandbox.browser.requireCdpSourceRange`               | Intervalo de origem CDP do navegador do sandbox                        | Exigir que a exposição CDP do navegador declare um intervalo de origem.        |

A política trata `sandbox.mode` ausente como o padrão implícito `off`, portanto
`sandbox.requireMode` relata um sandbox novo ou não configurado como fora de uma
lista de permissões como `["all"]`.

#### Tratamento de dados

| Campo da política                                        | Estado observado                                                                       | Use quando                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Definir como `true` para rejeitar `logging.redactSensitive: "off"`.              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Definir como `true` para rejeitar captura de conteúdo de telemetria.                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Definir como `true` para exigir o modo efetivo de manutenção de sessão `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` e `agents.*.memorySearch.experimental.sessionMemory` | Definir como `true` para rejeitar indexação de transcritos de sessão na memória.       |

#### Segredos

| Campo da política                      | Estado observado                                           | Use quando                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Configurar SecretRefs e declarações de `secrets.providers.*` | Definir como `true` para exigir que SecretRefs apontem para provedores declarados.     |
| `secrets.denySources`             | Origens de provedores de segredo e origens de SecretRef            | Negar origens como `exec`, `file` ou outro nome de origem configurado. |
| `secrets.allowInsecureProviders`  | Flags de postura insegura de provedor de segredo                   | Definir como `false` para rejeitar provedores que optam por postura insegura.      |

#### Aprovações de exec

A política de aprovações de exec observa o artefato ativo de runtime
`exec-approvals.json`. Por padrão, ele é `~/.openclaw/exec-approvals.json`; quando
`OPENCLAW_STATE_DIR` está definido, a Política lê
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Regras de postura reais como
`execApprovals.defaults.*` ou `execApprovals.agents.*` exigem evidência de artefato
legível; um artefato ausente ou inválido é relatado como evidência não observável
em vez de se tornar uma aprovação de melhor esforço contra padrões sintéticos de runtime. Depois
que o artefato é legível, campos de aprovação omitidos herdam os padrões de runtime: `defaults.security` ausente
é `full`, e a segurança de agente ausente herda esse
padrão. A evidência inclui `defaults`, `agents.*` e
`agents.*.allowlist[].pattern`, além de `argPattern` opcional, postura efetiva de
`autoAllowSkills` e origem da entrada. Ela não inclui caminho/token de socket,
`commandText`, `lastUsedCommand`, caminhos resolvidos ou carimbos de data/hora.

| Campo de política                         | Estado observado                                                                      | Use quando                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`               | Caminho ativo de runtime `exec-approvals.json`                                        | Defina como `true` para exigir que o artefato de aprovações exista e seja analisado.    |
| `execApprovals.defaults.allowSecurity`    | `defaults.security`, com padrão `full`                                                | Permita somente modos aprovados de segurança de aprovação padrão.                       |
| `execApprovals.agents.allowSecurity`      | `agents.*.security`, herdando os padrões                                             | Permita somente modos aprovados de segurança de aprovação efetiva por agente.           |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` e `agents.*.autoAllowSkills`, herdando padrões de runtime | Defina como `false` para exigir listas de permissão manuais estritas sem aprovação implícita da CLI de Skills. |
| `execApprovals.agents.allowlist.expected` | Padrão agregado `agents.*.allowlist[]` e entradas opcionais `argPattern`             | Exija que a lista de permissão de aprovações corresponda ao conjunto de padrões revisado. |

Por exemplo, exija o artefato de aprovações, negue padrões permissivos e
permita somente a postura revisada de aprovação de exec para agentes selecionados:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Perfis de autenticação

| Campo de política              | Estado observado                            | Use quando                                                                                  |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Metadados de provedor e modo `auth.profiles.*` | Exija chaves de metadados como `provider` e `mode` em perfis de autenticação da configuração. |
| `auth.profiles.allowModes`     | `auth.profiles.*.mode`                      | Permita somente modos compatíveis de perfil de autenticação, como `api_key`, `aws-sdk`, `oauth` ou `token`. |

#### Metadados de ferramentas

| Campo de política        | Estado observado              | Use quando                                                                                 |
| ------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata`  | Declarações governadas de `TOOLS.md` | Exija que ferramentas governadas declarem chaves de metadados como `risk`, `sensitivity` ou `owner`. |

#### Postura de ferramentas

| Campo de política              | Estado observado                                            | Use quando                                                                                               |
| ------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`         | `tools.profile` e `agents.list[].tools.profile`             | Permita somente ids de perfil de ferramenta, como `minimal`, `messaging` ou `coding`.                    |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` e substituições por agente de `tools.fs` | Defina como `true` para exigir postura de ferramenta de sistema de arquivos somente no workspace.         |
| `tools.exec.allowSecurity`     | `tools.exec.security` e segurança de exec por agente        | Permita somente modos de segurança de exec, como `deny` ou `allowlist`.                                  |
| `tools.exec.requireAsk`        | `tools.exec.ask` e modo de solicitação de exec por agente   | Exija postura de aprovação, como `always`.                                                              |
| `tools.exec.allowHosts`        | `tools.exec.host` e roteamento de host de exec por agente   | Permita somente modos de roteamento de host de exec, como `sandbox`.                                     |
| `tools.elevated.allow`         | `tools.elevated.enabled` e postura elevada por agente       | Defina como `false` para exigir que o modo de ferramenta elevada permaneça desabilitado.                 |
| `tools.alsoAllow.expected`     | `tools.alsoAllow` e `tools.alsoAllow` por agente            | Exija entradas exatas de `alsoAllow` e relate concessões aditivas de ferramenta ausentes ou inesperadas. |
| `tools.denyTools`              | `tools.deny` e `agents.list[].tools.deny`                   | Exija que listas configuradas de negação de ferramentas incluam ids ou grupos de ferramenta, como `group:runtime` e `group:fs`. |

Execute verificações somente de política durante a autoria:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` executa somente o conjunto de verificações de política e emite evidências, achados e
hashes de atestação. Os mesmos achados também aparecem em `openclaw doctor --lint`
quando o Plugin de Política está habilitado.

Compare um arquivo de política do operador com um arquivo de política de baseline criado:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` compara a sintaxe de arquivo de política com a sintaxe de arquivo de política. Ele não
inspeciona estado de runtime do OpenClaw, evidências, credenciais ou segredos. O comando
usa os mesmos metadados de regra de política que governam sobreposições com escopo: listas de permissão devem
permanecer iguais ou mais restritas, listas de negação devem permanecer iguais ou mais amplas, booleanos obrigatórios
devem manter seu valor obrigatório, strings ordenadas devem mover-se apenas em direção à extremidade mais
restritiva da ordem configurada, e listas exatas devem corresponder.

O arquivo de baseline pode ser uma política criada pela organização. A política verificada pode
usar valores mais estritos ou adicionar regras de política extras. Uma regra verificada de nível superior também pode
satisfazer uma regra de baseline com escopo quando ela for igualmente ou mais restritiva porque
a política de nível superior se aplica amplamente. Os nomes de escopo não precisam corresponder; a
comparação com escopo é indexada pelo valor do seletor, como `agentIds` ou `channelIds`, e pelo
campo de política verificado.

Exemplo de saída JSON limpa de comparação relata somente o estado de comparação de arquivo de política:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Exemplo de saída limpa de `policy check --json` inclui hashes estáveis que podem ser
registrados por um operador ou supervisor:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Configurar política

A configuração de política fica em `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Configuração              | Finalidade                                                      |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | Habilitar verificações de política mesmo antes de `policy.jsonc` existir. |
| `workspaceRepairs`        | Permitir que `doctor --fix` edite configurações de workspace gerenciadas por política. |
| `expectedHash`            | Bloqueio de hash opcional para o artefato de política aprovado. |
| `expectedAttestationHash` | Bloqueio de hash opcional para a última verificação de política limpa aceita. |
| `path`                    | Localização relativa ao workspace do artefato de política.      |

Defina `plugins.entries.policy.config.enabled` como `false` para desabilitar verificações de política
para um workspace enquanto mantém o plugin instalado.

Os requisitos de metadados de ferramentas são criados em `policy.jsonc` com
`tools.requireMetadata`, por exemplo `["risk", "sensitivity", "owner"]`.

## Aceitar estado de política

Exemplo de saída JSON:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

O hash da política identifica o artefato de regra criado. O bloco de evidências
registra o estado observado do OpenClaw usado pelas verificações de política. O
valor `workspace.hash` identifica esse payload de evidências para o escopo
verificado. O hash das constatações identifica o conjunto exato de constatações
retornado pela verificação. `checkedAt` registra quando a avaliação foi
executada. O hash da attestação identifica a declaração estável: hash da
política, hash das evidências, hash das constatações e se o resultado estava
limpo. Intencionalmente, ele não inclui `checkedAt`, para que o mesmo estado de
política produza a mesma attestação em verificações repetidas. Juntos, eles
formam a tupla de auditoria para esta verificação de política.

Se um Gateway ou supervisor posterior usar a política para bloquear, aprovar ou
anotar uma ação de runtime, ele deve registrar o hash da attestação da última
verificação de política limpa. `checkedAt` permanece na saída JSON para logs de
auditoria, mas não faz parte do hash de attestação estável.

Use este ciclo de vida ao aceitar o estado de política:

1. Crie ou revise `policy.jsonc`.
2. Execute `openclaw policy check --json`.
3. Se o resultado estiver limpo, registre `attestation.policy.hash` como `expectedHash`.
4. Registre `attestation.attestationHash` como `expectedAttestationHash`.
5. Execute novamente `openclaw doctor --lint` na CI ou em gates de lançamento.

Se as regras de política mudarem intencionalmente, atualize ambos os hashes
aceitos a partir de uma verificação limpa. Se as configurações do workspace
mudarem intencionalmente, mas a política permanecer a mesma, normalmente apenas
`expectedAttestationHash` muda.

Habilitar ou atualizar regras de `agents.workspace` adiciona evidências
`agentWorkspace` ao hash do workspace e ao hash da attestação. Os operadores
devem revisar as novas evidências e atualizar os hashes de attestação aceitos
após habilitar essas regras. Habilitar ou atualizar regras de postura de
ferramentas adiciona evidências `toolPosture` da mesma forma.

`openclaw policy watch` executa a mesma verificação repetidamente e relata
quando as evidências atuais não correspondem mais a `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Use `--once` em CI ou scripts que precisam de apenas uma avaliação de desvio.
Sem `--once`, o comando consulta a cada dois segundos por padrão; use
`--interval-ms` para escolher um intervalo diferente.

## Constatações

Atualmente, a política verifica:

| ID da verificação                                        | Achado                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | A política está habilitada, mas `policy.jsonc` está ausente.                      |
| `policy/policy-jsonc-invalid`                            | A política não pode ser analisada ou contém entradas de regra malformadas.        |
| `policy/policy-hash-mismatch`                            | A política não corresponde ao `expectedHash` configurado.                         |
| `policy/attestation-hash-mismatch`                       | A evidência de política atual não corresponde mais à atestação aceita.            |
| `policy/policy-conformance-invalid`                      | Um arquivo de política de referência ou verificado tem sintaxe de comparação inválida. |
| `policy/policy-conformance-missing`                      | Um arquivo de política verificado não tem uma regra exigida pelo arquivo de política de referência. |
| `policy/policy-conformance-weaker`                       | Um arquivo de política verificado tem um valor mais fraco do que o arquivo de política de referência. |
| `policy/channels-denied-provider`                        | Um canal habilitado corresponde a uma regra de negação de canal.                  |
| `policy/mcp-denied-server`                               | Um servidor MCP configurado é negado pela política.                               |
| `policy/mcp-unapproved-server`                           | Um servidor MCP configurado está fora da lista de permissões.                     |
| `policy/models-denied-provider`                          | Um provedor de modelo ou referência de modelo configurado usa um provedor negado. |
| `policy/models-unapproved-provider`                      | Um provedor de modelo ou referência de modelo configurado está fora da lista de permissões. |
| `policy/network-private-access-enabled`                  | Uma exceção de SSRF para rede privada está habilitada quando a política a nega.   |
| `policy/ingress-dm-policy-unapproved`                    | Uma política de DM de canal está fora da lista de permissões da política.         |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` não corresponde ao escopo de isolamento de DM exigido pela política. |
| `policy/ingress-open-groups-denied`                      | Uma política de grupo de canal é `open` enquanto a política nega ingresso de grupos abertos. |
| `policy/ingress-group-mention-required`                  | Uma entrada de canal ou grupo desabilita portões de menção enquanto a política os exige. |
| `policy/gateway-non-loopback-bind`                       | A postura de vinculação do Gateway permite exposição fora de loopback quando a política a nega. |
| `policy/gateway-auth-disabled`                           | A autenticação do Gateway está desabilitada quando a política exige autenticação. |
| `policy/gateway-rate-limit-missing`                      | A postura de limite de taxa da autenticação do Gateway não está explícita quando a política a exige. |
| `policy/gateway-control-ui-insecure`                     | Alternâncias de exposição insegura da UI de Controle do Gateway estão habilitadas. |
| `policy/gateway-tailscale-funnel`                        | A exposição do Gateway Tailscale Funnel está habilitada quando a política a nega. |
| `policy/gateway-remote-enabled`                          | O modo remoto do Gateway está ativo quando a política o nega.                     |
| `policy/gateway-http-endpoint-enabled`                   | Um endpoint da API HTTP do Gateway está habilitado enquanto é negado pela política. |
| `policy/gateway-http-url-fetch-unrestricted`             | A entrada de busca de URL HTTP do Gateway não tem uma lista de permissões de URL obrigatória. |
| `policy/agents-workspace-access-denied`                  | O modo de sandbox do agente ou o acesso ao espaço de trabalho está fora da lista de permissões da política. |
| `policy/agents-tool-not-denied`                          | Um agente ou configuração padrão não nega uma ferramenta exigida pela política.   |
| `policy/tools-profile-unapproved`                        | Um perfil de ferramentas global ou por agente configurado está fora da lista de permissões. |
| `policy/tools-fs-workspace-only-required`                | As ferramentas de sistema de arquivos não estão configuradas com postura de caminho restrita ao espaço de trabalho. |
| `policy/tools-exec-security-unapproved`                  | O modo de segurança de exec está fora da lista de permissões da política.         |
| `policy/tools-exec-ask-unapproved`                       | O modo de solicitação de exec está fora da lista de permissões da política.       |
| `policy/tools-exec-host-unapproved`                      | O roteamento de host de exec está fora da lista de permissões da política.        |
| `policy/tools-elevated-enabled`                          | O modo de ferramenta elevada está habilitado quando a política o nega.            |
| `policy/tools-also-allow-missing`                        | Uma lista `alsoAllow` configurada não tem uma entrada exigida pela política.      |
| `policy/tools-also-allow-unexpected`                     | Uma lista `alsoAllow` configurada inclui uma entrada não esperada pela política.  |
| `policy/tools-required-deny-missing`                     | Uma lista de negação de ferramentas global ou por agente não inclui uma ferramenta negada obrigatória. |
| `policy/sandbox-mode-unapproved`                         | O modo de sandbox está fora da lista de permissões da política.                   |
| `policy/sandbox-backend-unapproved`                      | O backend de sandbox está fora da lista de permissões da política.                |
| `policy/sandbox-container-posture-unobservable`          | Uma regra de postura de contêiner está habilitada para um backend que não consegue observá-la. |
| `policy/sandbox-container-host-network-denied`           | Um sandbox ou navegador baseado em contêiner usa modo de rede do host.            |
| `policy/sandbox-container-namespace-join-denied`         | Um sandbox ou navegador baseado em contêiner entra no namespace de outro contêiner. |
| `policy/sandbox-container-mount-mode-required`           | Uma montagem de sandbox ou navegador baseado em contêiner não é somente leitura. |
| `policy/sandbox-container-runtime-socket-mount`          | Uma montagem de sandbox ou navegador baseado em contêiner expõe o soquete do runtime de contêiner. |
| `policy/sandbox-container-unconfined-profile`            | O perfil de sandbox de contêiner é irrestrito quando a política o nega.           |
| `policy/sandbox-browser-cdp-source-range-missing`        | O intervalo de origem CDP do navegador de sandbox está ausente quando a política exige um. |
| `policy/data-handling-redaction-disabled`                | A redação de logs sensíveis está desabilitada quando a política a exige.          |
| `policy/data-handling-telemetry-content-capture`         | A captura de conteúdo de telemetria está habilitada quando a política a nega.     |
| `policy/data-handling-session-retention-not-enforced`    | A manutenção de retenção de sessão não é aplicada quando a política a exige.      |
| `policy/data-handling-session-transcript-memory-enabled` | A indexação de memória de transcrições de sessão está habilitada quando a política a nega. |
| `policy/secrets-unmanaged-provider`                      | Um SecretRef de configuração referencia um provedor não declarado em `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Um provedor de segredo de configuração ou SecretRef usa uma origem negada pela política. |
| `policy/secrets-insecure-provider`                       | Um provedor de segredo opta por uma postura insegura quando a política a nega.    |
| `policy/auth-profile-invalid-metadata`                   | Um perfil de autenticação de configuração não tem metadados válidos de provedor ou modo. |
| `policy/auth-profile-unapproved-mode`                    | Um modo de perfil de autenticação de configuração está fora da lista de permissões da política. |
| `policy/exec-approvals-missing`                          | A política exige `exec-approvals.json`, mas o artefato está ausente.              |
| `policy/exec-approvals-invalid`                          | O artefato de aprovações de exec configurado não pode ser analisado.              |
| `policy/exec-approvals-default-security-unapproved`      | Os padrões de aprovação de exec usam um modo de segurança fora da lista de permissões da política. |
| `policy/exec-approvals-agent-security-unapproved`        | Um modo de segurança efetivo de aprovação de exec por agente está fora da lista de permissões. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Um agente de aprovação de exec permite automaticamente CLIs de Skills de forma implícita quando a política nega isso. |
| `policy/exec-approvals-allowlist-missing`                | A lista de permissões de aprovações não tem um padrão exigido pela política.      |
| `policy/exec-approvals-allowlist-unexpected`             | A lista de permissões de aprovações inclui um padrão não esperado pela política.  |
| `policy/tools-missing-risk-level`                        | Uma declaração de ferramenta governada não tem metadados de risco.                |
| `policy/tools-unknown-risk-level`                        | Uma declaração de ferramenta governada usa um valor de risco desconhecido.        |
| `policy/tools-missing-sensitivity-token`                 | Uma declaração de ferramenta governada não tem metadados de sensibilidade.        |
| `policy/tools-missing-owner`                             | Uma declaração de ferramenta governada não tem metadados de proprietário.         |
| `policy/tools-unknown-sensitivity-token`                 | Uma declaração de ferramenta governada usa um valor de sensibilidade desconhecido. |

Achados de política podem incluir tanto `target` quanto `requirement`. `target` é a
coisa observada no espaço de trabalho que não está em conformidade. `requirement` é a regra de
política criada que fez disso um achado. Ambos os valores são endereços hoje, geralmente
caminhos `oc://`, mas os nomes dos campos descrevem seu papel na política em vez do
formato do endereço.

Exemplo de achado JSON:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

Exemplo de achado de ferramenta:

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

Exemplo de achado MCP:

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

Exemplo de achado de provedor de modelo:

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

Exemplo de achado de rede:

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

Exemplo de constatação de exposição do Gateway:

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

Exemplo de achado de workspace de agente:

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Reparo

`doctor --lint` e `policy check` são somente leitura.

`doctor --fix` só edita configurações de workspace gerenciadas por política quando
`workspaceRepairs` está explicitamente habilitado. Sem essa adesão, as verificações de política
relatam o que reparariam e deixam as configurações inalteradas.

Nesta versão, o reparo pode desabilitar canais que estão habilitados na configuração do OpenClaw
mas negados por `channels.denyRules`. Habilite `workspaceRepairs` somente depois que o
arquivo de política tiver sido revisado, porque uma regra de negação válida pode desativar um
canal configurado:

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Códigos de saída

| Comando          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | Nenhuma descoberta no limite.                          | Uma ou mais descobertas atingiram o limite.                         | Falha de argumento ou runtime. |
| `policy compare` | O arquivo de política é pelo menos tão rigoroso quanto a baseline. | O arquivo de política é inválido, ausente ou mais fraco que as regras da baseline. | Falha de argumento ou runtime. |
| `policy watch`   | Nenhuma descoberta e o hash aceito está atual.         | Existem descobertas ou a atestação aceita está obsoleta.            | Falha de argumento ou runtime. |

## Relacionado

- [Modo de lint do Doctor](/pt-BR/cli/doctor#lint-mode)
- [CLI de caminho](/pt-BR/cli/path)
