---
permalink: /security/formal-verification/
read_when:
    - Analisando garantias ou limitações formais do modelo de segurança
    - Reprodução ou atualização das verificações do modelo de segurança TLA+/TLC
summary: Modelos de segurança verificados por máquina para os caminhos de maior risco do OpenClaw.
title: Verificação formal (modelos de segurança)
x-i18n:
    generated_at: "2026-07-12T00:22:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

Os modelos formais de segurança do OpenClaw (atualmente TLA+/TLC) fornecem um argumento verificado por máquina de que caminhos específicos de maior risco — autorização, isolamento de sessões, controle de acesso a ferramentas e segurança contra configurações incorretas — aplicam a política pretendida, sob premissas explicitamente declaradas.

> Observação: alguns links mais antigos podem fazer referência ao nome anterior do projeto.

## O que é isto

Um conjunto executável de testes de regressão de segurança orientados por atacantes:

- Cada afirmação tem uma verificação de modelo executável em um espaço de estados finito.
- Muitas afirmações têm um modelo negativo correspondente que produz um rastreamento de contraexemplo para uma classe realista de falhas.

Isto **não** é uma prova de que o OpenClaw seja seguro em todos os aspectos e não verifica toda a implementação em TypeScript.

## Onde ficam os modelos

Os modelos são mantidos em um repositório separado: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Esse repositório está inacessível no momento (o GitHub retorna "Repository not found" na data desta redação). Se ele continuar indisponível para você, pergunte nos canais de mantenedores do OpenClaw qual é a localização atual antes de presumir que os modelos foram removidos.
</Note>

## Ressalvas

- Estes são modelos, não a implementação completa em TypeScript — é possível haver divergências entre o modelo e o código.
- Os resultados são limitados pelo espaço de estados explorado pelo TLC. Um resultado positivo não implica segurança além das premissas e dos limites modelados.
- Algumas afirmações dependem de premissas explícitas sobre o ambiente (por exemplo, implantação e entradas de configuração corretas).

## Como reproduzir os resultados

Clone o repositório dos modelos e execute o TLC:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned tla2tools.jar and provides bin/tlc plus Make targets.

make <target>
```

Ainda não há integração de CI com este repositório; uma iteração futura poderia adicionar modelos executados pela CI com artefatos públicos (rastreamentos de contraexemplos e logs de execução) ou um fluxo hospedado de "executar este modelo" para verificações pequenas e limitadas.

## Afirmações e alvos

### Exposição do Gateway e configuração incorreta de Gateway aberto

**Afirmação:** vincular a interfaces além de local loopback sem autenticação pode possibilitar o comprometimento remoto e aumentar a exposição; um token ou uma senha bloqueia atacantes não autenticados, de acordo com as premissas do modelo.

| Resultado               | Alvos                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| Positivo                | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Negativo (esperado)     | `make gateway-exposure-v2-negative`                              |

Consulte também `docs/gateway-exposure-matrix.md` no repositório dos modelos.

### Pipeline de execução do Node (recurso de maior risco)

**Afirmação:** `exec host=node` exige (a) uma lista de permissões de comandos do Node junto com comandos declarados e (b) aprovação em tempo real quando configurada; no modelo, as aprovações usam tokens para impedir ataques de repetição.

| Resultado           | Alvos                                                           |
| ------------------- | --------------------------------------------------------------- |
| Positivo            | `make nodes-pipeline`, `make approvals-token`                   |
| Negativo (esperado) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Armazenamento de pareamento (controle de acesso a mensagens diretas)

**Afirmação:** as solicitações de pareamento respeitam o TTL e os limites de solicitações pendentes.

| Resultado           | Alvos                                                |
| ------------------- | ---------------------------------------------------- |
| Positivo            | `make pairing`, `make pairing-cap`                   |
| Negativo (esperado) | `make pairing-negative`, `make pairing-cap-negative` |

### Controle de entrada (menções e desvio por comandos de controle)

**Afirmação:** em contextos de grupo que exigem menção, um comando de controle não autorizado não pode contornar o controle de acesso por menção.

| Resultado           | Alvos                          |
| ------------------- | ------------------------------ |
| Positivo            | `make ingress-gating`          |
| Negativo (esperado) | `make ingress-gating-negative` |

### Isolamento de roteamento e de chaves de sessão

**Afirmação:** mensagens diretas de remetentes distintos não são combinadas na mesma sessão, a menos que sejam explicitamente vinculadas ou configuradas dessa forma.

| Resultado           | Alvos                             |
| ------------------- | --------------------------------- |
| Positivo            | `make routing-isolation`          |
| Negativo (esperado) | `make routing-isolation-negative` |

## Modelos v1++: concorrência, novas tentativas e correção de rastreamentos

Modelos posteriores que aumentam a fidelidade em relação a modos de falha do mundo real: atualizações não atômicas, novas tentativas e distribuição de mensagens.

### Concorrência e idempotência do armazenamento de pareamento

**Afirmação:** o armazenamento de pareamento aplica `MaxPending` e a idempotência mesmo com intercalações — a operação de verificar e depois gravar deve ser atômica ou bloqueada, e a atualização não deve criar duplicatas. Especificamente: solicitações simultâneas não podem exceder `MaxPending` em um canal, e solicitações ou atualizações repetidas para o mesmo `(channel, sender)` não criam linhas pendentes ativas duplicadas.

| Resultado           | Alvos                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Positivo            | `make pairing-race` (verificação atômica ou bloqueada do limite), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                            |
| Negativo (esperado) | `make pairing-race-negative` (condição de corrida não atômica entre início e confirmação do limite), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Correlação e idempotência dos rastreamentos de entrada

**Afirmação:** a ingestão preserva a correlação dos rastreamentos durante a distribuição e é idempotente diante de novas tentativas do provedor. Quando um evento externo se transforma em várias mensagens internas, cada parte mantém a mesma identidade de rastreamento e evento; novas tentativas não causam processamento duplicado; se os IDs de eventos do provedor estiverem ausentes, a desduplicação recorre a uma chave segura (por exemplo, o ID do rastreamento) para evitar o descarte de eventos distintos.

| Resultado           | Alvos                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Positivo            | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Negativo (esperado) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Precedência de dmScope no roteamento e identityLinks

**Afirmação:** o roteamento mantém as sessões de mensagens diretas isoladas por padrão e só combina sessões quando isso é explicitamente configurado, por meio da precedência de canais e dos vínculos de identidade. As substituições de `dmScope` específicas de cada canal prevalecem sobre os padrões globais; `identityLinks` combina sessões somente dentro de grupos explicitamente vinculados, não entre remetentes sem relação.

| Resultado           | Alvos                                                                     |
| ------------------- | ------------------------------------------------------------------------- |
| Positivo            | `make routing-precedence`, `make routing-identitylinks`                   |
| Negativo (esperado) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Relacionado

- [Modelo de ameaças](/pt-BR/security/THREAT-MODEL-ATLAS)
- [Como contribuir para o modelo de ameaças](/pt-BR/security/CONTRIBUTING-THREAT-MODEL)
- [Resposta a incidentes](/pt-BR/security/incident-response)
